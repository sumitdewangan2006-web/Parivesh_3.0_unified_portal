// ── MoM Routes ───────────────────────────────────────────────────────
// Meeting CRUD, agenda, MoM editing, finalize, publish

const express = require("express");
const { body, param, query } = require("express-validator");
const { authenticate, authorize, ensureLinearWorkflowForMom, validate } = require("../middleware");
const MomService = require("../services/momService");
const ExportService = require("../services/exportService");

const router = express.Router();

router.use(authenticate);
router.use(authorize("mom_team", "admin"));

// ── Create meeting ───────────────────────────────────────────────────
router.post(
  "/",
  validate([
    body("title").trim().notEmpty().withMessage("Meeting title is required"),
    body("meeting_date").isISO8601().withMessage("Valid date required (YYYY-MM-DD)"),
    body("venue").optional().trim(),
    body("agenda").optional().trim(),
  ]),
  async (req, res, next) => {
    try {
      const meeting = await MomService.createMeeting(req.user.id, req.body);
      res.status(201).json(meeting);
    } catch (err) {
      next(err);
    }
  }
);

// ── List meetings ────────────────────────────────────────────────────
router.get(
  "/",
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isIn(["draft", "finalized", "published"]),
  ]),
  async (req, res, next) => {
    try {
      const result = await MomService.listMeetings({
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

// ── Get meeting by ID ────────────────────────────────────────────────
router.get(
  "/:id",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const meeting = await MomService.findMeetingById(req.params.id);
      res.json(meeting);
    } catch (err) {
      next(err);
    }
  }
);

// ── Add applications to meeting ──────────────────────────────────────
router.post(
  "/:id/applications",
  ensureLinearWorkflowForMom,
  validate([
    param("id").isUUID(),
    body("application_ids").isArray({ min: 1 }).withMessage("At least one application ID"),
    body("application_ids.*").isUUID(),
  ]),
  async (req, res, next) => {
    try {
      const result = await MomService.addApplicationsToMeeting(
        req.params.id,
        req.body.application_ids,
        req.user.id
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── Update agenda / minutes ──────────────────────────────────────────
router.put(
  "/:id",
  validate([
    param("id").isUUID(),
    body("agenda").optional().trim(),
    body("minutes").optional().trim(),
  ]),
  async (req, res, next) => {
    try {
      const meeting = await MomService.updateMinutes(req.params.id, req.body);
      res.json(meeting);
    } catch (err) {
      next(err);
    }
  }
);

// ── Record decision for an application ───────────────────────────────
router.put(
  "/:id/applications/:applicationId/decision",
  validate([
    param("id").isUUID(),
    param("applicationId").isUUID(),
    body("decision").trim().notEmpty().withMessage("Decision text is required"),
  ]),
  async (req, res, next) => {
    try {
      const result = await MomService.recordDecision(
        req.params.id,
        req.params.applicationId,
        req.body.decision
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── Finalize meeting ─────────────────────────────────────────────────
router.post(
  "/:id/finalize",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const meeting = await MomService.finalize(req.params.id, req.user.id);
      res.json(meeting);
    } catch (err) {
      next(err);
    }
  }
);

// ── Publish meeting + MoM ────────────────────────────────────────────
router.post(
  "/:id/publish",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const meeting = await MomService.publish(req.params.id, req.user.id);
      res.json(meeting);
    } catch (err) {
      next(err);
    }
  }
);

// ── Export MoM as DOCX (Microsoft Word) ──────────────────────────────
router.get(
  "/:id/export/docx",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const meeting = await MomService.findMeetingById(req.params.id);
      const buffer = await ExportService.generateMomDocx(meeting);
      const safeName = (meeting.title || "MoM").replace(/[^a-zA-Z0-9_-]/g, "_");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.docx"`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }
);

// ── Export MoM as PDF ────────────────────────────────────────────────
router.get(
  "/:id/export/pdf",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const meeting = await MomService.findMeetingById(req.params.id);
      const buffer = await ExportService.generateMomPdf(meeting);
      const safeName = (meeting.title || "MoM").replace(/[^a-zA-Z0-9_-]/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
