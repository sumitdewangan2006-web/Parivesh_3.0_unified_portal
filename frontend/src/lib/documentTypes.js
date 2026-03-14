export const DOCUMENT_TYPES = [
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

export const DOCUMENT_TYPE_LABELS = Object.fromEntries(
  DOCUMENT_TYPES.map((item) => [item.value, item.label])
);

export function getDocumentTypeDefinitions(categoryCode) {
  return DOCUMENT_TYPES.map((item) => ({
    ...item,
    required: item.isRequired(categoryCode),
  }));
}

export function sortDocumentsByTypeOrder(documents = []) {
  const orderMap = new Map(DOCUMENT_TYPES.map((item, index) => [item.value, index]));

  return [...documents].sort((left, right) => {
    const leftOrder = orderMap.has(left.document_type) ? orderMap.get(left.document_type) : Number.MAX_SAFE_INTEGER;
    const rightOrder = orderMap.has(right.document_type) ? orderMap.get(right.document_type) : Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) return leftOrder - rightOrder;

    return new Date(right.createdAt || right.created_at || 0) - new Date(left.createdAt || left.created_at || 0);
  });
}