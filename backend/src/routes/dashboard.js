// ── Dashboard Routes ─────────────────────────────────────────────────
// Analytics and statistics endpoints

const express = require("express");
const { authenticate, authorize } = require("../middleware");
const DashboardService = require("../services/dashboardService");

const router = express.Router();

router.use(authenticate);

// ── Overview statistics (admin/scrutiny/mom) ─────────────────────────
router.get("/overview", authorize("admin", "scrutiny_team", "mom_team"), async (_req, res, next) => {
  try {
    const stats = await DashboardService.getOverview();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// ── By category breakdown ────────────────────────────────────────────
router.get("/by-category", authorize("admin", "scrutiny_team", "mom_team"), async (_req, res, next) => {
  try {
    const data = await DashboardService.byCategory();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── By sector breakdown ──────────────────────────────────────────────
router.get("/by-sector", authorize("admin", "scrutiny_team", "mom_team"), async (_req, res, next) => {
  try {
    const data = await DashboardService.bySector();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Monthly trend ────────────────────────────────────────────────────
router.get("/monthly-trend", authorize("admin", "scrutiny_team", "mom_team"), async (_req, res, next) => {
  try {
    const data = await DashboardService.monthlyTrend();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Recent applications ──────────────────────────────────────────────
router.get("/recent-applications", authorize("admin", "scrutiny_team", "mom_team"), async (_req, res, next) => {
  try {
    const data = await DashboardService.recentApplications();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Recent activity (status changes) ─────────────────────────────────
router.get("/recent-activity", authorize("admin", "scrutiny_team", "mom_team"), async (_req, res, next) => {
  try {
    const data = await DashboardService.recentActivity();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── State-wise distribution ──────────────────────────────────────────
router.get("/by-state", authorize("admin"), async (_req, res, next) => {
  try {
    const data = await DashboardService.byState();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Average processing time ──────────────────────────────────────────
router.get("/processing-time", authorize("admin"), async (_req, res, next) => {
  try {
    const data = await DashboardService.avgProcessingDays();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Proponent personal stats ─────────────────────────────────────────
router.get("/my-stats", authorize("project_proponent"), async (req, res, next) => {
  try {
    const data = await DashboardService.proponentStats(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Scrutiny team stats ──────────────────────────────────────────────
router.get("/scrutiny-stats", authorize("scrutiny_team"), async (req, res, next) => {
  try {
    const data = await DashboardService.scrutinyStats(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
