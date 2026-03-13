// ── Status Transition Service ─────────────────────────────────────────
// Centralized workflow validation and status history recording
// Workflow stages: Draft → Submitted → Under Scrutiny → Essential Document Sought → Referred → MoM Generated → Finalized

const { Application, StatusHistory, User, Role } = require("../models");

const VALID_TRANSITIONS = {
  draft:                        ["submitted"],
  submitted:                    ["under_scrutiny"],
  under_scrutiny:               ["essential_document_sought", "referred"],
  essential_document_sought:    ["under_scrutiny", "referred"],
  referred:                     ["mom_generated"],
  mom_generated:                ["finalized"],
};

const STATUS_LABELS = {
  draft:                        "Draft",
  submitted:                    "Submitted",
  under_scrutiny:               "Under Scrutiny",
  essential_document_sought:    "Essential Document Sought",
  referred:                     "Referred",
  mom_generated:                "MoM Generated",
  finalized:                    "Finalized",
};

/**
 * Validate whether a status transition is allowed.
 */
function canTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Perform a status transition with audit trail.
 * @param {string} applicationId
 * @param {string} newStatus
 * @param {string} changedBy – User UUID
 * @param {string} [remarks]
 * @param {import('sequelize').Transaction} [transaction]
 */
async function transition(applicationId, newStatus, changedBy, remarks, transaction) {
  const app = await Application.findByPk(applicationId, { transaction });
  if (!app) throw Object.assign(new Error("Application not found"), { status: 404 });

  const from = app.status;
  if (!canTransition(from, newStatus)) {
    throw Object.assign(
      new Error(`Invalid transition: ${from} → ${newStatus}`),
      { status: 400 }
    );
  }

  // Update application status
  const updates = { status: newStatus };
  if (newStatus === "submitted" && !app.submitted_at) updates.submitted_at = new Date();
  if (newStatus === "referred") updates.approved_at = new Date();
  if (newStatus === "finalized") updates.published_at = new Date();

  await app.update(updates, { transaction });

  // Create audit trail
  await StatusHistory.create({
    application_id: applicationId,
    changed_by: changedBy,
    from_status: from,
    to_status: newStatus,
    remarks: remarks || null,
  }, { transaction });

  return app;
}

/**
 * Get full workflow status for an application.
 */
async function getWorkflowStatus(applicationId) {
  const app = await Application.findByPk(applicationId, {
    attributes: ["id", "status", "submitted_at", "approved_at", "published_at"],
  });
  if (!app) throw Object.assign(new Error("Application not found"), { status: 404 });

  const history = await StatusHistory.findAll({
    where: { application_id: applicationId },
    order: [["createdAt", "ASC"]],
    include: [{ model: User, as: "changedBy", attributes: ["id", "name"] }],
  });

  const allStatuses = Object.keys(VALID_TRANSITIONS).concat(["finalized"])
    .filter((status, index, statuses) => statuses.indexOf(status) === index);
  const currentIdx = allStatuses.indexOf(app.status);
  const visitedStatuses = new Set();
  history.forEach((h) => {
    if (h.from_status) visitedStatuses.add(h.from_status);
    if (h.to_status) visitedStatuses.add(h.to_status);
  });
  visitedStatuses.add(app.status);

  return {
    application_id: applicationId,
    current_status: app.status,
    current_status_label: STATUS_LABELS[app.status] || app.status,
    steps: allStatuses.map((s, i) => ({
      status: s,
      label: STATUS_LABELS[s] || s,
      is_current: s === app.status,
      is_completed: i < currentIdx,
      is_visited: visitedStatuses.has(s),
    })),
    history: history.map((h) => ({
      from_status: h.from_status,
      to_status: h.to_status,
      from_label: STATUS_LABELS[h.from_status] || h.from_status,
      to_label: STATUS_LABELS[h.to_status] || h.to_status,
      remarks: h.remarks,
      changed_by: h.changedBy?.name || null,
      timestamp: h.createdAt,
    })),
    timestamps: {
      submitted_at: app.submitted_at,
      approved_at: app.approved_at,
      published_at: app.published_at,
    },
    allowed_next: VALID_TRANSITIONS[app.status] || [],
  };
}

module.exports = {
  VALID_TRANSITIONS,
  STATUS_LABELS,
  canTransition,
  transition,
  getWorkflowStatus,
};
