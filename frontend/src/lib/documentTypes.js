import { DOCUMENT_CHECKLISTS } from "@/lib/checklistData";

// ── Legacy document types (kept for backward compatibility) ──────────
const LEGACY_DOCUMENT_TYPES = [
  {
    value: "project_report",
    label: "Project Report",
    description: "Core proposal narrative, project scope, and baseline project details.",
    isRequired: () => true,
  },
  {
    value: "eia_report",
    label: "EIA Report",
    description: "Environmental impact assessment report for appraisal-stage review.",
    isRequired: (categoryCode) => categoryCode === "A",
  },
  {
    value: "environmental_management_plan",
    label: "Environmental Management Plan",
    description: "Mitigation, monitoring, and compliance plan for environmental controls.",
    isRequired: (categoryCode) => categoryCode === "A",
  },
  {
    value: "map_layout",
    label: "Map / Layout",
    description: "Site layout, project boundary, and location drawings or maps.",
    isRequired: () => true,
  },
  {
    value: "noc_certificate",
    label: "NOC / Certificate",
    description: "No-objection certificates, permissions, and statutory clearances.",
    isRequired: () => false,
  },
  {
    value: "financial_document",
    label: "Financial Document",
    description: "Project cost sheets, financial approvals, and related supporting documents.",
    isRequired: () => false,
  },
  {
    value: "identity_proof",
    label: "Identity Proof",
    description: "Applicant or authorized representative identity documents.",
    isRequired: () => true,
  },
  {
    value: "additional_document",
    label: "Additional Document",
    description: "Any additional supporting material helpful for scrutiny review.",
    isRequired: () => false,
  },
];

// ── New checklist-based document types ───────────────────────────────
// Generate a deduplicated map from all checklist item keys.
const checklistItems = Object.values(DOCUMENT_CHECKLISTS).flat();
const checklistTypeMap = new Map();

for (const item of checklistItems) {
  if (!checklistTypeMap.has(item.key)) {
    checklistTypeMap.set(item.key, {
      value: item.key,
      label: item.label,
      description: "Checklist document required as per regulatory category guidance.",
      // Requiredness is computed contextually in getDocumentTypeDefinitions.
      isRequired: () => false,
    });
  }
}

// Keep legacy values too, so already-uploaded docs continue rendering.
for (const legacy of LEGACY_DOCUMENT_TYPES) {
  if (!checklistTypeMap.has(legacy.value)) {
    checklistTypeMap.set(legacy.value, legacy);
  }
}

export const DOCUMENT_TYPES = Array.from(checklistTypeMap.values());

export const DOCUMENT_TYPE_LABELS = Object.fromEntries(
  DOCUMENT_TYPES.map((item) => [item.value, item.label])
);

/**
 * Returns document type definitions based on either:
 * 1) mineral_type (preferred, checklist-driven), or
 * 2) legacy categoryCode fallback.
 *
 * @param {string | object} input
 */
export function getDocumentTypeDefinitions(input) {
  // Backward compatible signature support:
  // old: getDocumentTypeDefinitions(categoryCode)
  // new: getDocumentTypeDefinitions({ categoryCode, mineralType })
  let categoryCode = input;
  let mineralType = null;
  let sectorRules = [];

  if (input && typeof input === "object") {
    categoryCode = input.categoryCode;
    mineralType = input.mineralType;
    sectorRules = Array.isArray(input.sectorRules) ? input.sectorRules : [];
  }

  const sectorRuleMap = new Map(
    sectorRules
      .filter((rule) => rule && typeof rule.document_key === "string")
      .map((rule) => [rule.document_key, Boolean(rule.is_required)])
  );

  if (mineralType && DOCUMENT_CHECKLISTS[mineralType]) {
    const base = DOCUMENT_CHECKLISTS[mineralType].map((item) => {
      const meta = checklistTypeMap.get(item.key) || {
        value: item.key,
        label: item.label,
        description: "Checklist document.",
      };

      return {
        ...meta,
        value: item.key,
        label: item.label,
        required: sectorRuleMap.has(item.key)
          ? Boolean(sectorRuleMap.get(item.key))
          : Boolean(item.required),
      };
    });

    // Include admin-forced sector keys even if absent in mineral checklist.
    for (const [documentKey, isRequired] of sectorRuleMap.entries()) {
      if (base.some((item) => item.value === documentKey)) continue;
      const meta = checklistTypeMap.get(documentKey) || {
        value: documentKey,
        label: DOCUMENT_TYPE_LABELS[documentKey] || documentKey,
        description: "Sector-specific checklist document.",
      };

      base.push({
        ...meta,
        value: documentKey,
        required: Boolean(isRequired),
      });
    }

    return base;
  }

  // Legacy fallback for old category-code-only flows.
  return LEGACY_DOCUMENT_TYPES.map((item) => ({
    ...item,
    required: item.isRequired(categoryCode),
  }));
}

export function sortDocumentsByTypeOrder(documents = []) {
  const orderMap = new Map(DOCUMENT_TYPES.map((item, index) => [item.value, index]));

  return [...documents].sort((left, right) => {
    const leftOrder = orderMap.has(left.document_type)
      ? orderMap.get(left.document_type)
      : Number.MAX_SAFE_INTEGER;
    const rightOrder = orderMap.has(right.document_type)
      ? orderMap.get(right.document_type)
      : Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) return leftOrder - rightOrder;

    return new Date(right.createdAt || right.created_at || 0) - new Date(left.createdAt || left.created_at || 0);
  });
}
