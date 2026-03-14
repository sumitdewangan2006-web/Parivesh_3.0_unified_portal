// ── Environmental Risk Analyzer ─────────────────────────────────────
// Rule-based analyzer that scores project risk from project metadata,
// description text, and uploaded document metadata.

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const {
  Application,
  ApplicationCategory,
  Sector,
  Document,
} = require("../models");

const CRORE = 1_00_00_000;

const KEYWORD_RULES = [
  {
    keyword: "deforestation",
    pattern: /\b(deforestation|forest clearance|tree felling|tree cutting|habitat loss)\b/gi,
    pointsPerHit: 10,
    maxPoints: 20,
    reason: "Potential deforestation or habitat-loss indicators were detected.",
  },
  {
    keyword: "pollution",
    pattern: /\b(pollution|air emissions?|effluent|wastewater|hazardous waste|industrial discharge|particulate)\b/gi,
    pointsPerHit: 7,
    maxPoints: 20,
    reason: "Pollution and emissions related terms were found in the proposal context.",
  },
  {
    keyword: "wildlife impact",
    pattern: /\b(wildlife|sanctuary|national park|eco[- ]?sensitive|biodiversity|protected area)\b/gi,
    pointsPerHit: 9,
    maxPoints: 24,
    reason: "Wildlife or protected-area sensitivity keywords are present.",
  },
  {
    keyword: "groundwater usage",
    pattern: /\b(groundwater|aquifer|borewell|water extraction|water withdrawal)\b/gi,
    pointsPerHit: 8,
    maxPoints: 18,
    reason: "Groundwater extraction or aquifer dependency indicators were detected.",
  },
  {
    keyword: "wetland or river impact",
    pattern: /\b(wetland|river diversion|river bed|floodplain|riparian)\b/gi,
    pointsPerHit: 8,
    maxPoints: 16,
    reason: "Potential wetland or river-system impact terms were detected.",
  },
];

const DOCUMENT_CONTENT_RULES = {
  pre_feasibility_report: {
    required_keywords: ["project", "baseline", "environment", "impact"],
    min_matches: 3,
  },
  emp: {
    required_keywords: ["mitigation", "monitoring", "environment", "management plan"],
    min_matches: 3,
  },
  form_caf: {
    required_keywords: ["form", "applicant", "project", "location"],
    min_matches: 3,
  },
  eia_report: {
    required_keywords: ["impact", "baseline", "mitigation", "public hearing"],
    min_matches: 3,
  },
  project_report: {
    required_keywords: ["project", "capacity", "location", "environment"],
    min_matches: 3,
  },
  land_documents: {
    required_keywords: ["khasra", "land", "ownership", "survey"],
    min_matches: 2,
  },
  all_affidavits: {
    required_keywords: ["affidavit", "undertake", "declare", "compliance"],
    min_matches: 2,
  },
  gist_submission: {
    required_keywords: ["gist", "submission", "project"],
    min_matches: 2,
  },
};

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function classifyRisk(score) {
  if (score >= 67) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function parseWildlifeDistanceKm(text) {
  const regex =
    /(\d+(?:\.\d+)?)\s*km[^.\n]{0,100}\b(wildlife sanctuary|national park|eco[- ]?sensitive zone|protected area)\b|\b(wildlife sanctuary|national park|eco[- ]?sensitive zone|protected area)\b[^.\n]{0,100}(\d+(?:\.\d+)?)\s*km/gi;
  let match;
  let minDistance = null;

  while ((match = regex.exec(text))) {
    const raw = match[1] || match[4];
    const value = raw ? Number(raw) : NaN;
    if (!Number.isNaN(value)) {
      minDistance = minDistance === null ? value : Math.min(minDistance, value);
    }
  }

  return minDistance;
}

function parseDeforestationAreaHa(text) {
  const regex =
    /\b(deforestation|forest clearance|tree felling|tree cutting)\b[^.\n]{0,100}?(\d+(?:\.\d+)?)\s*(ha|hectare|hectares)\b/gi;
  let match;
  let maxArea = null;

  while ((match = regex.exec(text))) {
    const value = Number(match[2]);
    if (!Number.isNaN(value)) {
      maxArea = maxArea === null ? value : Math.max(maxArea, value);
    }
  }

  return maxArea;
}

function parseGroundwaterUseKld(text) {
  const regex =
    /\b(groundwater|aquifer|borewell)\b[^.\n]{0,100}?(\d+(?:\.\d+)?)\s*(kld|kl\/day|m3\/day|m\^3\/day|lpd|liters?\/day)\b/gi;
  let match;
  let maxKld = null;

  while ((match = regex.exec(text))) {
    const amount = Number(match[2]);
    const unit = String(match[3] || "").toLowerCase();
    if (Number.isNaN(amount)) continue;

    let kld = amount;
    if (unit === "lpd" || unit.startsWith("liter")) {
      kld = amount / 1000;
    }

    maxKld = maxKld === null ? kld : Math.max(maxKld, kld);
  }

  return maxKld;
}

function buildSummary({ level, score, topReasons, projectName }) {
  if (!topReasons.length) {
    return `${projectName} currently shows limited high-risk signals from submitted text and document metadata.`;
  }

  const lead = `${projectName} is assessed as ${level} risk with a score of ${score}/100.`;
  const drivers = `Key drivers: ${topReasons.slice(0, 2).join("; ")}.`;
  return `${lead} ${drivers}`;
}

function buildFallbackDocumentVerification(documents) {
  return documents.map((doc) => {
    const docType = String(doc.document_type || "").toLowerCase();
    const rule = DOCUMENT_CONTENT_RULES[docType];

    if (!rule) {
      return {
        id: doc.id,
        document_type: doc.document_type,
        original_name: doc.original_name,
        status: "not_checked",
        score: null,
        required_keywords: [],
        matched_keywords: [],
        missing_keywords: [],
        message: "No content rule configured for this document type.",
      };
    }

    return {
      id: doc.id,
      document_type: doc.document_type,
      original_name: doc.original_name,
      status: "not_verified",
      score: null,
      required_keywords: rule.required_keywords,
      matched_keywords: [],
      missing_keywords: rule.required_keywords,
      message: "Content verification skipped because Python document parser is unavailable.",
    };
  });
}

function executePython(command, args, stdinPayload, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Python analyzer timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr || `Python analyzer exited with code ${code}`));
        return;
      }
      resolve(stdout);
    });

    child.stdin.write(stdinPayload);
    child.stdin.end();
  });
}

class EnvironmentalRiskService {
  static async fetchApplication(applicationId) {
    return Application.findByPk(applicationId, {
      include: [
        { model: ApplicationCategory, as: "category", attributes: ["id", "code", "name"] },
        { model: Sector, as: "sector", attributes: ["id", "name"] },
        {
          model: Document,
          as: "documents",
          attributes: ["id", "document_type", "original_name", "tag", "mime_type", "file_path", "created_at"],
          where: { is_active: true },
          required: false,
        },
      ],
    });
  }

  static normalizePythonResult(result, app, documents) {
    const documentVerification = Array.isArray(result.document_verification)
      ? result.document_verification
      : buildFallbackDocumentVerification(documents);

    return {
      application_id: app.id,
      reference_number: app.reference_number,
      project_name: app.project_name,
      risk_score: clampScore(Number(result.risk_score || 0)),
      risk_level: String(result.risk_level || classifyRisk(result.risk_score || 0)),
      summary: String(result.summary || ""),
      reasons: Array.isArray(result.reasons) ? result.reasons.slice(0, 6) : [],
      keyword_hits: Array.isArray(result.keyword_hits) ? result.keyword_hits : [],
      extracted_metrics: result.extracted_metrics || {},
      analyzed_documents:
        Array.isArray(result.analyzed_documents) && result.analyzed_documents.length > 0
          ? result.analyzed_documents
          : documents.map((doc) => ({
              id: doc.id,
              document_type: doc.document_type,
              original_name: doc.original_name,
              tag: doc.tag,
              mime_type: doc.mime_type,
            })),
      document_verification: documentVerification,
      source: result.source || "python-llm-analyzer-v1",
      generated_at: result.generated_at || new Date().toISOString(),
    };
  }

  static async tryPythonAnalysis(app, documents) {
    const enabled = String(process.env.ENABLE_PYTHON_RISK_ANALYZER || "true").toLowerCase() === "true";
    if (!enabled) return null;

    const scriptPath = path.resolve(__dirname, "../../ai/risk_analyzer.py");
    if (!fs.existsSync(scriptPath)) return null;

    const command = process.env.PYTHON_RISK_ANALYZER_CMD || "python";
    const commandArgs = String(process.env.PYTHON_RISK_ANALYZER_ARGS || "")
      .split(" ")
      .map((arg) => arg.trim())
      .filter(Boolean);

    const payload = {
      application: {
        id: app.id,
        reference_number: app.reference_number,
        project_name: app.project_name,
        project_description: app.project_description,
        project_location: app.project_location,
        project_state: app.project_state,
        project_district: app.project_district,
        project_area: app.project_area,
        estimated_cost: app.estimated_cost,
        category: app.category ? { code: app.category.code, name: app.category.name } : null,
        sector: app.sector ? { name: app.sector.name } : null,
      },
      documents: documents.map((doc) => ({
        id: doc.id,
        document_type: doc.document_type,
        original_name: doc.original_name,
        tag: doc.tag,
        mime_type: doc.mime_type,
        file_path: doc.file_path,
      })),
    };

    try {
      const output = await executePython(
        command,
        [...commandArgs, scriptPath],
        JSON.stringify(payload),
        20000
      );

      const parsed = JSON.parse(output);
      if (parsed && parsed.risk_score !== undefined && parsed.risk_level) {
        return EnvironmentalRiskService.normalizePythonResult(parsed, app, documents);
      }
      return null;
    } catch {
      return null;
    }
  }

  static analyzeRuleBased(app, documents) {
    const projectName = app.project_name || "This project";

    const textCorpus = [
      app.project_name,
      app.project_description,
      app.project_location,
      app.project_state,
      app.project_district,
      app.category?.name,
      app.sector?.name,
      ...documents.map((d) => [d.document_type, d.original_name, d.tag].filter(Boolean).join(" ")),
    ]
      .filter(Boolean)
      .join(" \n ");

    const normalizedText = textCorpus.toLowerCase();

    let score = 8;
    const reasons = [];
    const keywordHits = [];

    for (const rule of KEYWORD_RULES) {
      const count = countMatches(normalizedText, rule.pattern);
      if (count <= 0) continue;

      const contribution = Math.min(rule.maxPoints, count * rule.pointsPerHit);
      score += contribution;
      keywordHits.push({ keyword: rule.keyword, count, contribution });
      reasons.push({ text: rule.reason, contribution });
    }

    const wildlifeDistanceKm = parseWildlifeDistanceKm(normalizedText);
    if (wildlifeDistanceKm !== null) {
      if (wildlifeDistanceKm <= 8) {
        score += 22;
        reasons.push({
          text: `Located within ${wildlifeDistanceKm}km of wildlife sanctuary/protected area.`,
          contribution: 22,
        });
      } else if (wildlifeDistanceKm <= 15) {
        score += 12;
        reasons.push({
          text: `Located within ${wildlifeDistanceKm}km of a wildlife-sensitive zone.`,
          contribution: 12,
        });
      }
    }

    const deforestationAreaHa = parseDeforestationAreaHa(normalizedText);
    if (deforestationAreaHa !== null && deforestationAreaHa > 10) {
      score += 18;
      reasons.push({
        text: "Deforestation area > 10 hectares",
        contribution: 18,
      });
    }

    const groundwaterUseKld = parseGroundwaterUseKld(normalizedText);
    if (groundwaterUseKld !== null) {
      if (groundwaterUseKld >= 5000) {
        score += 18;
        reasons.push({ text: "High groundwater usage", contribution: 18 });
      } else if (groundwaterUseKld >= 1000) {
        score += 10;
        reasons.push({
          text: `Moderate-to-high groundwater usage detected (${Math.round(groundwaterUseKld)} KLD).`,
          contribution: 10,
        });
      }
    }

    const area = Number(app.project_area || 0);
    if (!Number.isNaN(area) && area > 0) {
      if (area > 50) {
        score += 12;
        reasons.push({ text: `Large project footprint (${area} hectares).`, contribution: 12 });
      } else if (area > 10) {
        score += 6;
        reasons.push({ text: `Project area exceeds 10 hectares (${area} hectares).`, contribution: 6 });
      }
    }

    const estimatedCost = Number(app.estimated_cost || 0);
    if (!Number.isNaN(estimatedCost) && estimatedCost > 0) {
      if (estimatedCost > 100 * CRORE) {
        score += 10;
        reasons.push({ text: "Project scale is high based on estimated cost (> INR 100 crore).", contribution: 10 });
      } else if (estimatedCost >= 50 * CRORE) {
        score += 6;
        reasons.push({ text: "Project scale is moderate-to-high (>= INR 50 crore).", contribution: 6 });
      }
    }

    const hasEiaOrProjectReport = documents.some((doc) =>
      ["eia_report", "project_report"].includes((doc.document_type || "").toLowerCase())
    );

    if (!hasEiaOrProjectReport) {
      score += 8;
      reasons.push({
        text: "No EIA report or project report was detected among active uploads.",
        contribution: 8,
      });
    }

    const finalScore = clampScore(score);
    const riskLevel = classifyRisk(finalScore);
    const extractedMetrics = {
      wildlife_distance_km: wildlifeDistanceKm,
      groundwater_usage_kld: groundwaterUseKld !== null ? Number(groundwaterUseKld.toFixed(2)) : null,
      deforestation_area_ha: deforestationAreaHa !== null ? Number(deforestationAreaHa.toFixed(2)) : null,
      pdf_text_extracted: false,
      docs_checked_for_content: 0,
      docs_satisfied: 0,
      docs_insufficient: 0,
      docs_not_verified: documents.length,
    };

    const rankedReasons = reasons
      .sort((a, b) => b.contribution - a.contribution)
      .map((entry) => entry.text);

    return {
      application_id: app.id,
      reference_number: app.reference_number,
      project_name: app.project_name,
      risk_score: finalScore,
      risk_level: riskLevel,
      summary: buildSummary({
        level: riskLevel,
        score: finalScore,
        topReasons: rankedReasons,
        projectName,
      }),
      reasons: rankedReasons.slice(0, 6),
      keyword_hits: keywordHits.sort((a, b) => b.contribution - a.contribution),
      extracted_metrics: extractedMetrics,
      analyzed_documents: documents.map((doc) => ({
        id: doc.id,
        document_type: doc.document_type,
        original_name: doc.original_name,
        tag: doc.tag,
        mime_type: doc.mime_type,
      })),
      document_verification: buildFallbackDocumentVerification(documents),
      source: "rule-based-analyzer-v1",
      generated_at: new Date().toISOString(),
    };
  }

  static async analyzeApplication(applicationId) {
    const app = await EnvironmentalRiskService.fetchApplication(applicationId);

    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }

    const documents = app.documents || [];

    const pythonResult = await EnvironmentalRiskService.tryPythonAnalysis(app, documents);
    if (pythonResult) return pythonResult;

    return EnvironmentalRiskService.analyzeRuleBased(app, documents);
  }
}

module.exports = EnvironmentalRiskService;