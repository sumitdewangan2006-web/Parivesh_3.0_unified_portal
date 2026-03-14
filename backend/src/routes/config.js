// ── Config Routes ────────────────────────────────────────────────────
// Public: list categories, sectors
// Admin: CRUD categories, sectors, gist templates

const express = require("express");
const { body, param } = require("express-validator");
const { authenticate, authorize, validate } = require("../middleware");
const ConfigService = require("../services/configService");

const router = express.Router();

// ── Public: List categories ──────────────────────────────────────────
router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await ConfigService.listCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// ── Public: List sectors ─────────────────────────────────────────────
router.get("/sectors", async (_req, res, next) => {
  try {
    const sectors = await ConfigService.listSectors();
    res.json(sectors);
  } catch (err) {
    next(err);
  }
});

// ── Public: List mineral types ───────────────────────────────────────
router.get("/mineral-types", (_req, res) => {
  res.json(ConfigService.getMineralTypes());
});

// ── Public: Get document checklist for a mineral/project type ────────
router.get("/checklists/:mineralType", (req, res) => {
  const { mineralType } = req.params;
  const checklist = ConfigService.getChecklist(mineralType);
  if (!checklist.length) {
    return res.status(404).json({ error: "No checklist found for the specified mineral type" });
  }
  res.json(checklist);
});

// ── Public: Effective checklist for mineral type + sector rules ─────
router.get("/sectors/:id/checklists/:mineralType", async (req, res, next) => {
  try {
    const checklist = await ConfigService.getChecklistForSector(
      req.params.mineralType,
      Number(req.params.id)
    );
    if (!checklist.length) {
      return res.status(404).json({ error: "No checklist found for the specified mineral type" });
    }
    res.json(checklist);
  } catch (err) {
    next(err);
  }
});

// ── Public: Master document key catalog for admin sector rules UI ───
router.get("/document-catalog", (_req, res) => {
  res.json(ConfigService.getDocumentCatalog());
});

// ── Public: View active sector document rules ───────────────────────
router.get("/sectors/:id/document-rules", async (req, res, next) => {
  try {
    const rules = await ConfigService.listSectorDocumentRules(Number(req.params.id));
    res.json(rules);
  } catch (err) {
    next(err);
  }
});

// ── Public: Get affidavit points for a mineral/project type ──────────
router.get("/affidavits/:mineralType", (req, res) => {
  const { mineralType } = req.params;
  const points = ConfigService.getAffidavits(mineralType);
  res.json(points);
});

// ── Public: Get all standard EDS points ─────────────────────────────
router.get("/eds-points", (_req, res) => {
  res.json(ConfigService.getEdsPoints());
});

// ── Admin-only routes below ──────────────────────────────────────────

// Create category
router.post(
  "/categories",
  authenticate,
  authorize("admin"),
  validate([
    body("code").trim().notEmpty().withMessage("Code is required"),
    body("name").trim().notEmpty().withMessage("Name is required"),
  ]),
  async (req, res, next) => {
    try {
      const cat = await ConfigService.createCategory(req.body);
      res.status(201).json(cat);
    } catch (err) {
      next(err);
    }
  }
);

// Update category
router.put(
  "/categories/:id",
  authenticate,
  authorize("admin"),
  validate([param("id").isInt()]),
  async (req, res, next) => {
    try {
      const cat = await ConfigService.updateCategory(req.params.id, req.body);
      res.json(cat);
    } catch (err) {
      next(err);
    }
  }
);

// Create sector
router.post(
  "/sectors",
  authenticate,
  authorize("admin"),
  validate([
    body("name").trim().notEmpty().withMessage("Sector name is required"),
  ]),
  async (req, res, next) => {
    try {
      const sector = await ConfigService.createSector(req.body);
      res.status(201).json(sector);
    } catch (err) {
      next(err);
    }
  }
);

// Update sector
router.put(
  "/sectors/:id",
  authenticate,
  authorize("admin"),
  validate([param("id").isInt()]),
  async (req, res, next) => {
    try {
      const sector = await ConfigService.updateSector(req.params.id, req.body);
      res.json(sector);
    } catch (err) {
      next(err);
    }
  }
);

// Replace sector document rules (source-of-truth payload)
router.put(
  "/sectors/:id/document-rules",
  authenticate,
  authorize("admin"),
  validate([
    param("id").isInt(),
    body("rules").isArray(),
    body("rules.*.document_key").isString().notEmpty(),
    body("rules.*.is_required").isBoolean(),
  ]),
  async (req, res, next) => {
    try {
      const saved = await ConfigService.upsertSectorDocumentRules(
        Number(req.params.id),
        req.body.rules,
        req.user.id
      );
      res.json(saved);
    } catch (err) {
      next(err);
    }
  }
);

// ── Gist Templates ───────────────────────────────────────────────────

// List templates (authenticated — scrutiny/admin)
router.get(
  "/templates",
  authenticate,
  authorize("admin", "scrutiny_team"),
  async (req, res, next) => {
    try {
      const templates = await ConfigService.listTemplates({
        category_id: req.query.category_id,
        sector_id: req.query.sector_id,
      });
      res.json(templates);
    } catch (err) {
      next(err);
    }
  }
);

// Create template
router.post(
  "/templates",
  authenticate,
  authorize("admin"),
  validate([
    body("name").trim().notEmpty().withMessage("Template name is required"),
    body("content").trim().notEmpty().withMessage("Template content is required"),
  ]),
  async (req, res, next) => {
    try {
      const tpl = await ConfigService.createTemplate(req.body, req.user.id);
      res.status(201).json(tpl);
    } catch (err) {
      next(err);
    }
  }
);

// Update template
router.put(
  "/templates/:id",
  authenticate,
  authorize("admin"),
  validate([param("id").isInt()]),
  async (req, res, next) => {
    try {
      const tpl = await ConfigService.updateTemplate(req.params.id, req.body);
      res.json(tpl);
    } catch (err) {
      next(err);
    }
  }
);

// Delete template (soft)
router.delete(
  "/templates/:id",
  authenticate,
  authorize("admin"),
  validate([param("id").isInt()]),
  async (req, res, next) => {
    try {
      await ConfigService.deleteTemplate(req.params.id);
      res.json({ message: "Template deleted" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
