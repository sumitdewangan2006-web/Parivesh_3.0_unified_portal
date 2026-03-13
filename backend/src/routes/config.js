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
