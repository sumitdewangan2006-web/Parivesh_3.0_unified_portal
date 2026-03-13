// ── Config Service ───────────────────────────────────────────────────
// Admin-managed lookups: categories, sectors, gist templates

const { ApplicationCategory, Sector, GistTemplate, User } = require("../models");

class ConfigService {
  // ── Categories CRUD ──────────────────────────────────
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
    if (!cat) { const err = new Error("Category not found"); err.status = 404; throw err; }
    Object.assign(cat, data);
    await cat.save();
    return cat;
  }

  // ── Sectors CRUD ─────────────────────────────────────
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
    if (!sector) { const err = new Error("Sector not found"); err.status = 404; throw err; }
    Object.assign(sector, data);
    await sector.save();
    return sector;
  }

  // ── Gist Templates CRUD ─────────────────────────────
  static async listTemplates({ category_id, sector_id } = {}) {
    const where = { is_active: true };
    if (category_id) where.category_id = category_id;
    if (sector_id) where.sector_id = sector_id;

    return GistTemplate.findAll({
      where,
      include: [
        { model: User, as: "uploader", attributes: ["id", "name"] },
      ],
      order: [["name", "ASC"]],
    });
  }

  static async createTemplate(data, userId) {
    return GistTemplate.create({ ...data, uploaded_by: userId });
  }

  static async updateTemplate(id, data) {
    const tpl = await GistTemplate.findByPk(id);
    if (!tpl) { const err = new Error("Template not found"); err.status = 404; throw err; }
    Object.assign(tpl, data);
    await tpl.save();
    return tpl;
  }

  static async deleteTemplate(id) {
    const tpl = await GistTemplate.findByPk(id);
    if (!tpl) { const err = new Error("Template not found"); err.status = 404; throw err; }
    tpl.is_active = false;
    await tpl.save();
    return tpl;
  }
}

module.exports = ConfigService;
