// Checklist Validation Service
// Applies sector-level rule overrides and validates required document completeness.

const { SectorDocumentRule } = require("../models");
const { getChecklist, getDocumentLabelByKey } = require("../config/checklistData");

class ChecklistValidationService {
  static async getSectorRuleMap(sectorId) {
    if (!sectorId) return new Map();

    const rules = await SectorDocumentRule.findAll({
      where: { sector_id: sectorId, is_active: true },
      attributes: ["document_key", "is_required"],
      order: [["document_key", "ASC"]],
    });

    return new Map(rules.map((rule) => [rule.document_key, Boolean(rule.is_required)]));
  }

  static applySectorRules(baseChecklist, sectorRuleMap) {
    const merged = baseChecklist.map((item) => {
      if (!sectorRuleMap.has(item.key)) return { ...item };
      return { ...item, required: sectorRuleMap.get(item.key) };
    });

    // Allow admin to enforce additional document keys not present in base checklist.
    for (const [documentKey, isRequired] of sectorRuleMap.entries()) {
      if (merged.some((item) => item.key === documentKey)) continue;
      merged.push({
        sno: merged.length + 1,
        key: documentKey,
        label: getDocumentLabelByKey(documentKey),
        required: Boolean(isRequired),
      });
    }

    return merged;
  }

  static async getEffectiveChecklist(mineralType, sectorId) {
    const baseChecklist = getChecklist(mineralType);
    if (!baseChecklist.length) return [];

    const sectorRuleMap = await ChecklistValidationService.getSectorRuleMap(sectorId);
    return ChecklistValidationService.applySectorRules(baseChecklist, sectorRuleMap);
  }

  static async getMissingRequiredDocuments({ mineralType, sectorId, uploadedDocumentTypes = [] }) {
    const effectiveChecklist = await ChecklistValidationService.getEffectiveChecklist(mineralType, sectorId);
    const requiredItems = effectiveChecklist.filter((item) => item.required);

    const uploaded = new Set(
      uploadedDocumentTypes
        .filter((key) => typeof key === "string")
        .map((key) => key.trim())
        .filter(Boolean)
    );

    return requiredItems
      .filter((item) => !uploaded.has(item.key))
      .map((item) => ({ key: item.key, label: item.label, sno: item.sno }));
  }
}

module.exports = ChecklistValidationService;
