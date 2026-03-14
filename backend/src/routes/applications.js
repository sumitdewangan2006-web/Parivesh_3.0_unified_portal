// ── Application Routes ───────────────────────────────────────────────
// CRUD + submit + wizard steps for project proponents
// Admin: list all, assign scrutiny/mom officers

const express = require("express");
const { body, param, query } = require("express-validator");
const { authenticate, authorize, validate } = require("../middleware");
const ApplicationService = require("../services/applicationService");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ── Proponent: Create application ────────────────────────────────────
router.post(
  "/",
  authorize("project_proponent"),
  validate([
    body("category_id").isInt().withMessage("Category is required"),
    body("sector_id").isInt().withMessage("Sector is required"),
    body("project_name").trim().notEmpty().withMessage("Project name is required"),
  ]),
  async (req, res, next) => {
    try {
      const app = await ApplicationService.create(req.user.id, req.body);
      res.status(201).json(app);
    } catch (err) {
      next(err);
    }
  }
);

// ── Proponent: Update draft ──────────────────────────────────────────
router.put(
  "/:id",
  authorize("project_proponent"),
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const app = await ApplicationService.update(req.params.id, req.user.id, req.body);
      res.json(app);
    } catch (err) {
      next(err);
    }
  }
);

// ── Proponent: Submit application ────────────────────────────────────
router.post(
  "/:id/submit",
  authorize("project_proponent"),
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const app = await ApplicationService.submit(req.params.id, req.user.id);
      res.json(app);
    } catch (err) {
      next(err);
    }
  }
);

// ── Proponent: My applications ───────────────────────────────────────
router.get(
  "/my",
  authorize("project_proponent"),
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isString(),
  ]),
  async (req, res, next) => {
    try {
      const result = await ApplicationService.listByApplicant(req.user.id, {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
        status: req.query.status,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── Admin: List all applications ─────────────────────────────────────
router.get(
  "/",
  authorize("admin", "scrutiny_team", "mom_team"),
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isString(),
    query("category_id").optional().isInt(),
    query("sector_id").optional().isInt(),
    query("search").optional().isString(),
  ]),
  async (req, res, next) => {
    try {
      const result = await ApplicationService.listAll({
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
        status: req.query.status,
        category_id: req.query.category_id ? parseInt(req.query.category_id, 10) : null,
        sector_id: req.query.sector_id ? parseInt(req.query.sector_id, 10) : null,
        search: req.query.search,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── Get single application ───────────────────────────────────────────
router.get(
  "/:id",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const app = await ApplicationService.findById(req.params.id);
      res.json(app);
    } catch (err) {
      next(err);
    }
  }
);

// ── Get status history ───────────────────────────────────────────────
router.get(
  "/:id/history",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const history = await ApplicationService.getHistory(req.params.id);
      res.json(history);
    } catch (err) {
      next(err);
    }
  }
);

// ── Get environmental risk analysis ─────────────────────────────────
router.get(
  "/:id/risk-analysis",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const analysis = await ApplicationService.getRiskAnalysis(req.params.id, req.user);
      res.json(analysis);
    } catch (err) {
      next(err);
    }
  }
);

// ── Admin: Assign scrutiny officer ───────────────────────────────────
router.put(
  "/:id/assign-scrutiny",
  authorize("admin"),
  validate([
    param("id").isUUID(),
    body("scrutiny_user_id").isUUID().withMessage("Valid scrutiny user ID required"),
  ]),
  async (req, res, next) => {
    try {
      const app = await ApplicationService.assignScrutiny(
        req.params.id,
        req.body.scrutiny_user_id,
        req.user.id
      );
      res.json(app);
    } catch (err) {
      next(err);
    }
  }
);

// ── Admin: Assign MoM officer ────────────────────────────────────────
router.put(
  "/:id/assign-mom",
  authorize("admin"),
  validate([
    param("id").isUUID(),
    body("mom_user_id").isUUID().withMessage("Valid MoM user ID required"),
  ]),
  async (req, res, next) => {
    try {
      const app = await ApplicationService.assignMom(
        req.params.id,
        req.body.mom_user_id,
        req.user.id
      );
      res.json(app);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
