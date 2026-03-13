// ── Workflow Routes ───────────────────────────────────────────────────
// GET /api/workflow/:applicationId — Full workflow status for an application

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware");
const { getWorkflowStatus } = require("../services/statusTransitionService");

// Get workflow status for an application
router.get("/:applicationId", authenticate, async (req, res, next) => {
  try {
    const data = await getWorkflowStatus(req.params.applicationId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
