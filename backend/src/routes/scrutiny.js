// ── Scrutiny Routes ──────────────────────────────────────────────────
// Scrutiny team: review, remark, approve, send-back

const express = require("express");
const { body, param, query } = require("express-validator");
const { authenticate, authorize, validate } = require("../middleware");
const ScrutinyService = require("../services/scrutinyService");

const router = express.Router();

router.use(authenticate);
router.use(authorize("scrutiny_team", "admin"));

// ── My assigned applications ─────────────────────────────────────────
router.get(
  "/applications",
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isString(),
  ]),
  async (req, res, next) => {
    try {
      const result = await ScrutinyService.listAssigned(req.user.id, {
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

// ── Add remark / query ───────────────────────────────────────────────
router.post(
  "/applications/:id/remarks",
  validate([
    param("id").isUUID(),
    body("remark_type")
      .isIn(["comment", "query", "correction", "approval"])
      .withMessage("Invalid remark type"),
    body("content").trim().notEmpty().withMessage("Content is required"),
  ]),
  async (req, res, next) => {
    try {
      const remark = await ScrutinyService.addRemark(req.params.id, req.user.id, req.body);
      res.status(201).json(remark);
    } catch (err) {
      next(err);
    }
  }
);

// ── List remarks for an application ──────────────────────────────────
router.get(
  "/applications/:id/remarks",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const remarks = await ScrutinyService.listRemarks(req.params.id);
      res.json(remarks);
    } catch (err) {
      next(err);
    }
  }
);

// ── Resolve a query ──────────────────────────────────────────────────
router.put(
  "/remarks/:id/resolve",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const remark = await ScrutinyService.resolveQuery(req.params.id, req.user.id);
      res.json(remark);
    } catch (err) {
      next(err);
    }
  }
);

// ── Approve application for meeting ──────────────────────────────────
router.post(
  "/applications/:id/approve",
  validate([
    param("id").isUUID(),
    body("remarks").optional().trim(),
  ]),
  async (req, res, next) => {
    try {
      const result = await ScrutinyService.approve(req.params.id, req.user.id, req.body.remarks);
      res.json({ application: result, gistGenerated: !!result.gist });
    } catch (err) {
      next(err);
    }
  }
);

// ── Send back for correction ─────────────────────────────────────────
router.post(
  "/applications/:id/send-back",
  validate([
    param("id").isUUID(),
    body("remarks").trim().notEmpty().withMessage("Remarks are required when sending back"),
  ]),
  async (req, res, next) => {
    try {
      const app = await ScrutinyService.sendBack(req.params.id, req.user.id, req.body.remarks);
      res.json(app);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
