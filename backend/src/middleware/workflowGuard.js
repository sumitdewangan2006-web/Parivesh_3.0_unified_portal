// Workflow Guard Middleware
// Prevents non-linear status jumps for meeting/MoM stage transitions.

const { Application, StatusHistory } = require("../models");

async function ensureLinearWorkflowForMom(req, res, next) {
  try {
    const applicationIds = req.body.application_ids || [];
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return next();
    }

    for (const applicationId of applicationIds) {
      const app = await Application.findByPk(applicationId, {
        attributes: ["id", "reference_number", "status"],
      });

      if (!app) {
        return res.status(404).json({ error: `Application not found: ${applicationId}` });
      }

      if (app.status !== "referred") {
        return res.status(400).json({
          error: `Linear workflow guard: ${app.reference_number || app.id} must be in Referred status before MoM stage`,
        });
      }

      const hadScrutinyStage = await StatusHistory.findOne({
        where: { application_id: app.id, to_status: "under_scrutiny" },
      });

      if (!hadScrutinyStage) {
        return res.status(400).json({
          error: `Linear workflow guard: ${app.reference_number || app.id} cannot move to MoM stage before Under Scrutiny`,
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  ensureLinearWorkflowForMom,
};
