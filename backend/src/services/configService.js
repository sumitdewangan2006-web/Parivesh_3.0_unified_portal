// Config Service
// Admin-managed lookups: categories, sectors, gist templates

const { ApplicationCategory, Sector, GistTemplate, SectorDocumentRule, User } = require("../models");
const {
  DOCUMENT_CHECKLISTS,
  getChecklist,
  getDocumentLabelByKey,
  getAffidavitPoints,
  getEdsPoints,
  MINERAL_TYPE_LABELS,
} = require("../config/checklistData");
const ChecklistValidationService = require("./checklistValidationService");

class ConfigService {
  // Categories CRUD
  static async listCategories() {
    return ApplicationCategory.findAll({
      where: { is_active: true },
      order: [["code", "ASC"]],
    });
  }

  static async createCategory(data) {
    return ApplicationCategory.create(data);
  }

  static async updateCategory(id, data) {
    const cat = await ApplicationCategory.findByPk(id);
    if (!cat) {
      const err = new Error("Category not found");
      err.status = 404;
      throw err;
    }
    Object.assign(cat, data);
    await cat.save();
    return cat;
  }

  // Sectors CRUD
  static async listSectors() {
    return Sector.findAll({
      where: { is_active: true },
      order: [["name", "ASC"]],
    });
  }

  static async createSector(data) {
    return Sector.create(data);
  }

  static async updateSector(id, data) {
    const sector = await Sector.findByPk(id);
    if (!sector) {
      const err = new Error("Sector not found");
      err.status = 404;
      throw err;
    }
    Object.assign(sector, data);
    await sector.save();
    return sector;
  }

  // Gist Templates CRUD
  static async listTemplates({ category_id, sector_id } = {}) {
    const where = { is_active: true };
    if (category_id) where.category_id = category_id;
    if (sector_id) where.sector_id = sector_id;

    return GistTemplate.findAll({
      where,
      include: [{ model: User, as: "uploader", attributes: ["id", "name"] }],
      order: [["name", "ASC"]],
    });
  }

  static async createTemplate(data, userId) {
    return GistTemplate.create({ ...data, uploaded_by: userId });
  }

  static async updateTemplate(id, data) {
    const tpl = await GistTemplate.findByPk(id);
    if (!tpl) {
      const err = new Error("Template not found");
      err.status = 404;
      throw err;
    }
    Object.assign(tpl, data);
    await tpl.save();
    return tpl;
  }

  static async deleteTemplate(id) {
    const tpl = await GistTemplate.findByPk(id);
    if (!tpl) {
      const err = new Error("Template not found");
      err.status = 404;
      throw err;
    }
    tpl.is_active = false;
    await tpl.save();
    return tpl;
  }

  // Checklist and affidavit data
  static getMineralTypes() {
    return Object.entries(MINERAL_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  }

  static getChecklist(mineralType) {
    return getChecklist(mineralType);
  }

  static async getChecklistForSector(mineralType, sectorId) {
    return ChecklistValidationService.getEffectiveChecklist(mineralType, sectorId);
  }

  static getDocumentCatalog() {
    const seen = new Set();
    const catalog = [];

    Object.values(DOCUMENT_CHECKLISTS)
      .flat()
      .forEach((item) => {
        if (seen.has(item.key)) return;
        seen.add(item.key);
        catalog.push({ key: item.key, label: item.label });
      });

    return catalog.sort((a, b) => a.label.localeCompare(b.label));
  }

  static async listSectorDocumentRules(sectorId) {
    return SectorDocumentRule.findAll({
      where: { sector_id: sectorId, is_active: true },
      order: [["document_key", "ASC"]],
    });
  }

  static async upsertSectorDocumentRules(sectorId, rules, userId) {
    const sector = await Sector.findByPk(sectorId);
    if (!sector) {
      const err = new Error("Sector not found");
      err.status = 404;
      throw err;
    }

    // Deactivate all existing rules first; provided payload becomes source of truth.
    await SectorDocumentRule.update(
      { is_active: false },
      { where: { sector_id: sectorId } }
    );

    for (const rule of rules) {
      const documentKey = (rule.document_key || "").trim();
      if (!documentKey) continue;

      const [record] = await SectorDocumentRule.findOrCreate({
        where: { sector_id: sectorId, document_key: documentKey },
        defaults: {
          is_required: Boolean(rule.is_required),
          is_active: true,
          created_by: userId,
        },
      });

      record.is_required = Boolean(rule.is_required);
      record.is_active = true;
      record.created_by = userId;
      await record.save();
    }

    const saved = await ConfigService.listSectorDocumentRules(sectorId);
    return saved.map((rule) => ({
      id: rule.id,
      sector_id: rule.sector_id,
      document_key: rule.document_key,
      label: getDocumentLabelByKey(rule.document_key),
      is_required: rule.is_required,
      is_active: rule.is_active,
    }));
  }

  static getAffidavits(mineralType) {
    return getAffidavitPoints(mineralType);
  }

  static getEdsPoints() {
    return getEdsPoints();
  }
}

module.exports = ConfigService;
