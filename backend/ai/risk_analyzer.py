#!/usr/bin/env python3
"""
Python Environmental Risk Analyzer
- Parses uploaded PDFs (if pypdf is installed)
- Performs keyword/rule-based risk detection
- Uses LLM summarization when OPENAI_API_KEY is configured
- Falls back to extractive summary when LLM is unavailable

Input: JSON via stdin
Output: JSON via stdout
"""

from __future__ import annotations

import json
import os
import re
import sys
import datetime as dt
from typing import Any, Dict, List, Optional, Tuple

try:
    from pypdf import PdfReader  # type: ignore
except Exception:
    PdfReader = None


KEYWORD_PATTERNS: Dict[str, re.Pattern[str]] = {
    "deforestation": re.compile(
        r"\b(deforestation|forest clearance|tree felling|tree cutting|habitat loss)\b", re.IGNORECASE
    ),
    "pollution": re.compile(
        r"\b(pollution|air emissions?|effluent|wastewater|hazardous waste|industrial discharge|particulate)\b",
        re.IGNORECASE,
    ),
    "wildlife impact": re.compile(
        r"\b(wildlife|sanctuary|national park|eco[- ]?sensitive|biodiversity|protected area)\b", re.IGNORECASE
    ),
    "groundwater usage": re.compile(
        r"\b(groundwater|aquifer|borewell|water extraction|water withdrawal)\b", re.IGNORECASE
    ),
}

DOCUMENT_CONTENT_RULES: Dict[str, Dict[str, Any]] = {
    "pre_feasibility_report": {
        "required_keywords": ["project", "baseline", "environment", "impact"],
        "min_matches": 3,
    },
    "emp": {
        "required_keywords": ["mitigation", "monitoring", "environment", "management plan"],
        "min_matches": 3,
    },
    "form_caf": {
        "required_keywords": ["form", "applicant", "project", "location"],
        "min_matches": 3,
    },
    "eia_report": {
        "required_keywords": ["impact", "baseline", "mitigation", "public hearing"],
        "min_matches": 3,
    },
    "project_report": {
        "required_keywords": ["project", "capacity", "location", "environment"],
        "min_matches": 3,
    },
    "land_documents": {
        "required_keywords": ["khasra", "land", "ownership", "survey"],
        "min_matches": 2,
    },
    "all_affidavits": {
        "required_keywords": ["affidavit", "undertake", "declare", "compliance"],
        "min_matches": 2,
    },
    "gist_submission": {
        "required_keywords": ["gist", "submission", "project"],
        "min_matches": 2,
    },
}

LINE_SPLIT_PATTERN = re.compile(r"[\r\n]+")


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def candidate_lines(text: str) -> List[str]:
    raw_lines = [normalize_spaces(line) for line in LINE_SPLIT_PATTERN.split(text or "")]
    return [line for line in raw_lines if line]


def extract_metric_from_labeled_lines(
    lines: List[str],
    label_pattern: str,
    value_pattern: str,
    reducer: str = "max",
) -> Optional[float]:
    regex = re.compile(
        rf"(?:{label_pattern})[^\d\n]{{0,40}}({value_pattern})",
        re.IGNORECASE,
    )
    values: List[float] = []

    for line in lines:
      for match in regex.finditer(line):
            raw_value = match.group(1).replace(",", "").strip()
            try:
                values.append(float(raw_value))
            except ValueError:
                continue

    if not values:
        return None
    return min(values) if reducer == "min" else max(values)


def extract_metric_from_table_rows(
    lines: List[str],
    label_pattern: str,
    value_pattern: str,
    reducer: str = "max",
) -> Optional[float]:
    label_regex = re.compile(label_pattern, re.IGNORECASE)
    value_regex = re.compile(value_pattern, re.IGNORECASE)
    values: List[float] = []

    for line in lines:
        if not label_regex.search(line):
            continue

        cells = [normalize_spaces(cell) for cell in re.split(r"\||\t| {2,}", line) if normalize_spaces(cell)]
        for cell in cells:
            match = value_regex.search(cell)
            if not match:
                continue
            raw_value = match.group(1).replace(",", "").strip()
            try:
                values.append(float(raw_value))
            except ValueError:
                continue

    if not values:
        return None
    return min(values) if reducer == "min" else max(values)


def clamp_score(score: float) -> int:
    return max(0, min(100, int(round(score))))


def classify_risk(score: int) -> str:
    if score >= 67:
        return "High"
    if score >= 40:
        return "Medium"
    return "Low"


def load_payload() -> Dict[str, Any]:
    raw = sys.stdin.read().strip()
    if not raw:
        return {}
    return json.loads(raw)


def read_pdf_text(file_paths: List[str], max_pages: int = 25, max_chars: int = 100000) -> str:
    if PdfReader is None:
        return ""

    chunks: List[str] = []
    collected = 0

    for file_path in file_paths:
        if not file_path or not os.path.exists(file_path):
            continue
        try:
            reader = PdfReader(file_path)
            for index, page in enumerate(reader.pages):
                if index >= max_pages:
                    break
                text = (page.extract_text() or "").strip()
                if not text:
                    continue
                chunks.append(text)
                collected += len(text)
                if collected >= max_chars:
                    break
            if collected >= max_chars:
                break
        except Exception:
            continue

    return "\n".join(chunks)[:max_chars]


def read_pdf_text_single(file_path: str, max_pages: int = 15, max_chars: int = 30000) -> str:
    if PdfReader is None:
        return ""
    if not file_path or not os.path.exists(file_path):
        return ""

    chunks: List[str] = []
    collected = 0
    try:
        reader = PdfReader(file_path)
        for index, page in enumerate(reader.pages):
            if index >= max_pages:
                break
            text = (page.extract_text() or "").strip()
            if not text:
                continue
            chunks.append(text)
            collected += len(text)
            if collected >= max_chars:
                break
    except Exception:
        return ""

    return "\n".join(chunks)[:max_chars]


def evaluate_document_content(doc: Dict[str, Any], extracted_text: str) -> Dict[str, Any]:
    doc_type = str(doc.get("document_type") or "").lower()
    rule = DOCUMENT_CONTENT_RULES.get(doc_type)

    if not rule:
        return {
            "id": doc.get("id"),
            "document_type": doc.get("document_type"),
            "original_name": doc.get("original_name"),
            "status": "not_checked",
            "score": None,
            "required_keywords": [],
            "matched_keywords": [],
            "missing_keywords": [],
            "message": "No content rule configured for this document type.",
        }

    metadata_text = " ".join(
        [
            str(doc.get("original_name") or ""),
            str(doc.get("tag") or ""),
            str(doc.get("document_type") or ""),
        ]
    )
    corpus = f"{metadata_text}\n{extracted_text or ''}".lower()

    required_keywords = [str(k).strip().lower() for k in rule.get("required_keywords", []) if str(k).strip()]
    if not required_keywords:
        return {
            "id": doc.get("id"),
            "document_type": doc.get("document_type"),
            "original_name": doc.get("original_name"),
            "status": "not_checked",
            "score": None,
            "required_keywords": [],
            "matched_keywords": [],
            "missing_keywords": [],
            "message": "Rule is empty for this document type.",
        }

    matched_keywords = [kw for kw in required_keywords if re.search(rf"\b{re.escape(kw)}\b", corpus, re.IGNORECASE)]
    missing_keywords = [kw for kw in required_keywords if kw not in matched_keywords]

    min_matches = int(rule.get("min_matches") or len(required_keywords))
    min_matches = max(1, min(min_matches, len(required_keywords)))

    if not extracted_text and not metadata_text.strip():
        return {
            "id": doc.get("id"),
            "document_type": doc.get("document_type"),
            "original_name": doc.get("original_name"),
            "status": "not_verified",
            "score": None,
            "required_keywords": required_keywords,
            "matched_keywords": [],
            "missing_keywords": required_keywords,
            "message": "Document text could not be extracted for verification.",
        }

    score = int(round((len(matched_keywords) / len(required_keywords)) * 100))
    satisfied = len(matched_keywords) >= min_matches

    return {
        "id": doc.get("id"),
        "document_type": doc.get("document_type"),
        "original_name": doc.get("original_name"),
        "status": "satisfied" if satisfied else "insufficient",
        "score": score,
        "required_keywords": required_keywords,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "message": (
            "Document appears to satisfy expected content markers."
            if satisfied
            else f"Missing expected markers: {', '.join(missing_keywords[:4])}."
        ),
    }


def fallback_summary(text: str, project_name: str) -> str:
    compact = re.sub(r"\s+", " ", text or "").strip()
    if not compact:
        return f"{project_name} has limited textual context for environmental impact summarization."

    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", compact) if s.strip()]
    if not sentences:
        return f"{project_name} has limited textual context for environmental impact summarization."

    important_words = {
        "wildlife",
        "sanctuary",
        "groundwater",
        "deforestation",
        "pollution",
        "forest",
        "effluent",
        "emission",
        "biodiversity",
        "wetland",
    }

    def sentence_score(sentence: str) -> int:
        lowered = sentence.lower()
        return sum(1 for token in important_words if token in lowered)

    ranked = sorted(sentences, key=sentence_score, reverse=True)
    selected = ranked[:3]
    return " ".join(selected)


def llm_summary(text: str, project_name: str, category_name: str, sector_name: str) -> Tuple[str, str]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"

    if not api_key:
        return fallback_summary(text, project_name), "extractive-fallback"

    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=api_key)
        prompt = (
            "Create a concise environmental-impact summary (3-5 lines). "
            "Focus on ecological pressure, water usage, habitat concerns, and likely mitigation priorities.\n\n"
            f"Project: {project_name}\n"
            f"Category: {category_name}\n"
            f"Sector: {sector_name}\n\n"
            "Text:\n"
            f"{text[:12000]}"
        )

        response = client.responses.create(
            model=model,
            input=[
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "text",
                            "text": "You are an environmental risk analyst. Return plain-text summary only.",
                        }
                    ],
                },
                {"role": "user", "content": [{"type": "text", "text": prompt}]},
            ],
            temperature=0.2,
            max_output_tokens=220,
        )

        summary_text = (getattr(response, "output_text", "") or "").strip()
        if summary_text:
            return summary_text, "openai"
    except Exception:
        pass

    return fallback_summary(text, project_name), "extractive-fallback"


def parse_wildlife_distance_km(text: str) -> Optional[float]:
    lines = candidate_lines(text)

    labeled = extract_metric_from_labeled_lines(
        lines,
        r"distance\s+(?:from|to)\s+(?:nearest\s+)?(?:wildlife\s+sanctuary|national\s+park|protected\s+area|eco[- ]?sensitive\s+zone)",
        r"\d+(?:\.\d+)?",
        reducer="min",
    )
    if labeled is not None:
        return labeled

    table_value = extract_metric_from_table_rows(
        lines,
        r"wildlife\s+sanctuary|national\s+park|protected\s+area|eco[- ]?sensitive\s+zone",
        r"(\d+(?:\.\d+)?)\s*km\b",
        reducer="min",
    )
    if table_value is not None:
        return table_value

    pattern = re.compile(
        r"(\d+(?:\.\d+)?)\s*km[^.\n]{0,120}\b(wildlife sanctuary|national park|eco[- ]?sensitive zone|protected area)\b"
        r"|\b(wildlife sanctuary|national park|eco[- ]?sensitive zone|protected area)\b[^.\n]{0,120}(\d+(?:\.\d+)?)\s*km",
        re.IGNORECASE,
    )
    found: List[float] = []
    for match in pattern.finditer(text):
        raw = match.group(1) or match.group(4)
        if raw:
            try:
                found.append(float(raw))
            except ValueError:
                pass
    return min(found) if found else None


def parse_groundwater_kld(text: str) -> Optional[float]:
    lines = candidate_lines(text)

    labeled = extract_metric_from_labeled_lines(
        lines,
        r"(?:groundwater\s+(?:requirement|usage|withdrawal|extraction)|water\s+requirement|fresh\s+water\s+requirement)",
        r"\d+(?:\.\d+)?",
        reducer="max",
    )
    if labeled is not None:
        for line in lines:
            if re.search(r"groundwater|water\s+requirement|fresh\s+water", line, re.IGNORECASE) and re.search(r"lpd|liters?/day", line, re.IGNORECASE):
                return labeled / 1000.0
        return labeled

    table_value = extract_metric_from_table_rows(
        lines,
        r"groundwater|water\s+requirement|fresh\s+water",
        r"(\d+(?:\.\d+)?)\s*(?:kld|kl/day|m3/day|m\^3/day|lpd|liters?/day)\b",
        reducer="max",
    )
    if table_value is not None:
        return table_value

    pattern = re.compile(
        r"\b(groundwater|aquifer|borewell)\b[^.\n]{0,120}?(\d+(?:\.\d+)?)\s*(kld|kl/day|m3/day|m\^3/day|lpd|liters?/day)\b",
        re.IGNORECASE,
    )
    values: List[float] = []
    for match in pattern.finditer(text):
        amount = float(match.group(2))
        unit = match.group(3).lower()
        if unit in {"lpd"} or unit.startswith("liter"):
            values.append(amount / 1000.0)
        else:
            values.append(amount)
    return max(values) if values else None


def parse_deforestation_ha(text: str) -> Optional[float]:
    lines = candidate_lines(text)

    labeled = extract_metric_from_labeled_lines(
        lines,
        r"(?:forest\s+land\s+(?:required|diversion)|deforestation\s+area|tree\s+felling\s+area|forest\s+clearance\s+area)",
        r"\d+(?:\.\d+)?",
        reducer="max",
    )
    if labeled is not None:
        return labeled

    table_value = extract_metric_from_table_rows(
        lines,
        r"forest\s+land|deforestation|tree\s+felling|forest\s+clearance",
        r"(\d+(?:\.\d+)?)\s*(?:ha|hectare|hectares)\b",
        reducer="max",
    )
    if table_value is not None:
        return table_value

    pattern = re.compile(
        r"\b(deforestation|forest clearance|tree felling|tree cutting)\b[^.\n]{0,120}?(\d+(?:\.\d+)?)\s*(ha|hectare|hectares)\b",
        re.IGNORECASE,
    )
    values: List[float] = []
    for match in pattern.finditer(text):
        values.append(float(match.group(2)))
    return max(values) if values else None


def analyze(payload: Dict[str, Any]) -> Dict[str, Any]:
    app = payload.get("application", {}) or {}
    docs = payload.get("documents", []) or []

    project_name = app.get("project_name") or "Project"
    category_name = ((app.get("category") or {}).get("name") or "")
    sector_name = ((app.get("sector") or {}).get("name") or "")

    pdf_paths = [
        d.get("file_path")
        for d in docs
        if str(d.get("mime_type", "")).lower().find("pdf") >= 0
    ]

    text_parts = [
        str(app.get("project_name") or ""),
        str(app.get("project_description") or ""),
        str(app.get("project_location") or ""),
        str(app.get("project_state") or ""),
        str(app.get("project_district") or ""),
        category_name,
        sector_name,
    ]

    pdf_text = read_pdf_text([p for p in pdf_paths if isinstance(p, str)])
    if pdf_text:
        text_parts.append(pdf_text)

    document_verification: List[Dict[str, Any]] = []
    for doc in docs:
        is_pdf = str(doc.get("mime_type", "")).lower().find("pdf") >= 0
        file_path = str(doc.get("file_path") or "")
        per_doc_text = read_pdf_text_single(file_path) if is_pdf and file_path else ""
        document_verification.append(evaluate_document_content(doc, per_doc_text))

    corpus = "\n".join(part for part in text_parts if part).strip()

    score = 20.0
    reasons: List[str] = []
    keyword_hits: List[Dict[str, Any]] = []

    for keyword, pattern in KEYWORD_PATTERNS.items():
        count = len(pattern.findall(corpus))
        if count <= 0:
            continue

        contribution = min(18, count * 5)
        score += contribution
        keyword_hits.append({"keyword": keyword, "count": count, "contribution": contribution})

    wildlife_km = parse_wildlife_distance_km(corpus)
    if wildlife_km is not None:
        if wildlife_km <= 8:
            score += 22
            km_value = int(wildlife_km) if wildlife_km.is_integer() else round(wildlife_km, 1)
            reasons.append(f"Located within {km_value}km of wildlife sanctuary")
        elif wildlife_km <= 15:
            score += 12
            km_value = int(wildlife_km) if wildlife_km.is_integer() else round(wildlife_km, 1)
            reasons.append(f"Located within {km_value}km of wildlife-sensitive area")

    groundwater_kld = parse_groundwater_kld(corpus)
    if groundwater_kld is not None:
        if groundwater_kld >= 1000:
            score += 16
            reasons.append("High groundwater usage")
        elif groundwater_kld >= 500:
            score += 8
            reasons.append("Moderate groundwater usage")

    deforestation_ha = parse_deforestation_ha(corpus)
    if deforestation_ha is not None and deforestation_ha > 10:
        score += 14
        reasons.append("Deforestation area > 10 hectares")

    estimated_cost = float(app.get("estimated_cost") or 0)
    if estimated_cost > 10_000_000_000:
        score += 10
    elif estimated_cost > 5_000_000_000:
        score += 6

    project_area = float(app.get("project_area") or 0)
    if project_area > 50:
        score += 8
    elif project_area > 10:
        score += 4

    if not reasons and keyword_hits:
        top_keywords = [item["keyword"] for item in sorted(keyword_hits, key=lambda x: x["contribution"], reverse=True)[:3]]
        reasons.extend([f"Risk indicators detected: {label}" for label in top_keywords])

    if not reasons:
        reasons.append("No major environmental risk triggers found in the parsed content.")

    checked_docs = [d for d in document_verification if d.get("status") in {"satisfied", "insufficient"}]
    satisfied_docs = [d for d in checked_docs if d.get("status") == "satisfied"]
    insufficient_docs = [d for d in checked_docs if d.get("status") == "insufficient"]
    not_verified_docs = [d for d in document_verification if d.get("status") == "not_verified"]

    if insufficient_docs:
        penalty = min(20, len(insufficient_docs) * 6)
        score += penalty
        reasons.append(
            f"{len(insufficient_docs)} document(s) may be insufficient against expected content markers."
        )

    summary_text, summary_source = llm_summary(corpus, project_name, category_name, sector_name)

    score_value = clamp_score(score)
    risk_level = classify_risk(score_value)

    extracted_metrics = {
        "wildlife_distance_km": wildlife_km,
        "groundwater_usage_kld": round(groundwater_kld, 2) if groundwater_kld is not None else None,
        "deforestation_area_ha": round(deforestation_ha, 2) if deforestation_ha is not None else None,
        "pdf_text_extracted": bool(pdf_text),
        "docs_checked_for_content": len(checked_docs),
        "docs_satisfied": len(satisfied_docs),
        "docs_insufficient": len(insufficient_docs),
        "docs_not_verified": len(not_verified_docs),
    }

    return {
        "risk_score": score_value,
        "risk_level": risk_level,
        "summary": summary_text,
        "reasons": reasons[:6],
        "keyword_hits": sorted(keyword_hits, key=lambda x: x["contribution"], reverse=True),
        "extracted_metrics": extracted_metrics,
        "analyzed_documents": [
            {
                "id": d.get("id"),
                "document_type": d.get("document_type"),
                "original_name": d.get("original_name"),
                "mime_type": d.get("mime_type"),
                "tag": d.get("tag"),
            }
            for d in docs
        ],
        "document_verification": document_verification,
        "source": f"python-llm-analyzer-v1/{summary_source}",
        "generated_at": dt.datetime.now(dt.UTC).isoformat().replace("+00:00", "Z"),
    }


def main() -> int:
    try:
        payload = load_payload()
        result = analyze(payload)
        sys.stdout.write(json.dumps(result, ensure_ascii=True))
        return 0
    except Exception as exc:  # pragma: no cover
        sys.stderr.write(str(exc))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
