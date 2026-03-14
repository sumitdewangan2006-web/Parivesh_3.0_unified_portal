// ── Application Service ──────────────────────────────────────────────
// CRUD + workflow transitions for EC applications

const { Op } = require("sequelize");
const {
  Application,
  ApplicationCategory,
  Sector,
  User,
  Role,
  Document,
  StatusHistory,
  Payment,
  sequelize,
} = require("../models");
const EnvironmentalRiskService = require("./environmentalRiskService");
const ChecklistValidationService = require("./checklistValidationService");

const VALID_MINERAL_TYPES = ["sand", "limestone", "bricks", "stones", "infrastructure", "industry", "others"];

class ApplicationService {
  // ── Generate unique reference number ─────────────────
  static async generateRefNumber() {
    const year = new Date().getFullYear();
    const prefix = `EC-${year}-`;

    const last = await Application.findOne({
      where: { reference_number: { [Op.like]: `${prefix}%` } },
      order: [["created_at", "DESC"]],
    });

    let seq = 1;
    if (last) {
      const lastSeq = parseInt(last.reference_number.replace(prefix, ""), 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(5, "0")}`;
  }

  // ── Create draft application ─────────────────────────
  static async create(applicantId, data) {
    const refNumber = await ApplicationService.generateRefNumber();

    const application = await Application.create({
      reference_number: refNumber,
      applicant_id: applicantId,
      category_id: data.category_id,
      sector_id: data.sector_id,
      mineral_type: data.mineral_type || null,
      project_name: data.project_name,
      project_description: data.project_description || null,
      project_location: data.project_location || null,
      project_state: data.project_state || null,
      project_district: data.project_district || null,
      khasra_no: data.khasra_no || null,
      estimated_cost: data.estimated_cost || null,
      lease_area: data.lease_area || null,
      project_area: data.project_area || null,
      current_step: 1,
      status: "draft",
    });

    // Record initial status
    await StatusHistory.create({
      application_id: application.id,
      changed_by: applicantId,
      from_status: null,
      to_status: "draft",
      remarks: "Application created",
    });

    return ApplicationService.findById(application.id);
  }

  // ── Update draft (wizard steps) ──────────────────────
  static async update(applicationId, applicantId, data) {
    const app = await Application.findByPk(applicationId);

    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }
    if (app.applicant_id !== applicantId) {
      const err = new Error("Not authorized to edit this application");
      err.status = 403;
      throw err;
    }
    if (app.status !== "draft" && app.status !== "essential_document_sought") {
      const err = new Error("Application cannot be edited in current status");
      err.status = 400;
      throw err;
    }

    const allowedFields = [
      "category_id", "sector_id", "project_name", "project_description",
      "project_location", "project_state", "project_district", "khasra_no",
      "estimated_cost", "lease_area", "project_area", "current_step",
    ];

    const numericFields = ["category_id", "sector_id", "estimated_cost", "lease_area", "project_area", "current_step"];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        let value = data[field];
        if (numericFields.includes(field)) {
          value = value === "" || value === null ? null : Number(value);
          if (value !== null && isNaN(value)) value = null;
        }
        app[field] = value;
      }
    }

    // Validate and set mineral_type separately (string ENUM, not numeric)
    if (data.mineral_type !== undefined) {
      const mt = data.mineral_type === "" || data.mineral_type === null ? null : data.mineral_type;
      if (mt !== null && !VALID_MINERAL_TYPES.includes(mt)) {
        const err = new Error(`Invalid mineral_type. Must be one of: ${VALID_MINERAL_TYPES.join(", ")}`);
        err.status = 400;
        throw err;
      }
      app.mineral_type = mt;
    }

    await app.save();
    return ApplicationService.findById(app.id);
  }

  // ── Submit application ───────────────────────────────
  static async submit(applicationId, applicantId) {
    const app = await Application.findByPk(applicationId);

    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }
    if (app.applicant_id !== applicantId) {
      const err = new Error("Not authorized");
      err.status = 403;
      throw err;
    }

    // Allow submit from draft only when payment is already completed, or from
    // essential_document_sought during scrutiny resubmission.
    if (app.status !== "draft" && app.status !== "essential_document_sought") {
      const err = new Error("Application cannot be submitted in current status. Complete payment first.");
      err.status = 400;
      throw err;
    }

    // ── Workflow Guardrail: payment must be completed before initial submission ──
    if (app.status === "draft") {
      const completedPayment = await Payment.findOne({
        where: { application_id: applicationId, status: "completed" },
      });
      if (!completedPayment) {
        const err = new Error("Payment must be completed before submitting the application");
        err.status = 400;
        throw err;
      }
    }

    await ApplicationService.ensureChecklistDocumentsPresent(app);

    const prevStatus = app.status;
    app.status = "submitted";
    app.submitted_at = new Date();
    await app.save();

    await StatusHistory.create({
      application_id: app.id,
      changed_by: applicantId,
      from_status: prevStatus,
      to_status: "submitted",
      remarks: "Application submitted for review",
    });

    const result = await ApplicationService.findById(app.id);
    result.setDataValue(
      "risk_analysis",
      await EnvironmentalRiskService.analyzeApplication(app.id)
    );

    return result;
  }

  // ── Enforce required checklist documents before submission ─────────
  static async ensureChecklistDocumentsPresent(app) {
    if (!app.mineral_type || !VALID_MINERAL_TYPES.includes(app.mineral_type)) {
      const err = new Error("Mineral / project type is required before submission");
      err.status = 400;
      throw err;
    }

    const effectiveChecklist = await ChecklistValidationService.getEffectiveChecklist(
      app.mineral_type,
      app.sector_id
    );
    const requiredItems = effectiveChecklist.filter((item) => item.required);
    if (!effectiveChecklist.length || !requiredItems.length) return;

    const activeDocuments = await Document.findAll({
      where: { application_id: app.id, is_active: true },
      attributes: ["document_type"],
    });

    const uploadedKeys = new Set(
      activeDocuments
        .map((doc) => doc.document_type)
        .filter((key) => typeof key === "string" && key.trim() !== "")
    );

    const missingDocuments = requiredItems
      .filter((item) => !uploadedKeys.has(item.key))
      .map((item) => ({ key: item.key, label: item.label, sno: item.sno }));

    if (missingDocuments.length) {
      const err = new Error(
        `Required checklist documents are missing (${missingDocuments.length} pending)`
      );
      err.status = 400;
      err.code = "CHECKLIST_INCOMPLETE";
      err.details = {
        mineral_type: app.mineral_type,
        missing_documents: missingDocuments,
        total_required: requiredItems.length,
        uploaded_required: requiredItems.length - missingDocuments.length,
      };
      throw err;
    }
  }

  // ── Get environmental risk analysis for an application ───────────
  static async getRiskAnalysis(applicationId, requester) {
    const app = await Application.findByPk(applicationId, {
      attributes: ["id", "applicant_id"],
    });

    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }

    const requesterRole = requester?.role?.name;
    if (requesterRole === "project_proponent" && app.applicant_id !== requester.id) {
      const err = new Error("Not authorized to view analysis for this application");
      err.status = 403;
      throw err;
    }

    return EnvironmentalRiskService.analyzeApplication(applicationId);
  }

  // ── Find by ID with all eager loads ──────────────────
  static async findById(id) {
    const app = await Application.findByPk(id, {
      include: [
        { model: User, as: "applicant", attributes: ["id", "name", "email", "organization"] },
        { model: ApplicationCategory, as: "category" },
        { model: Sector, as: "sector" },
        { model: User, as: "scrutinyOfficer", attributes: ["id", "name", "email"] },
        { model: User, as: "momOfficer", attributes: ["id", "name", "email"] },
        { model: Document, as: "documents", where: { is_active: true }, required: false },
      ],
    });

    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }

    return app;
  }

  // ── List for applicant dashboard ─────────────────────
  static async listByApplicant(applicantId, { page = 1, limit = 20, status }) {
    const where = { applicant_id: applicantId };
    if (status) where.status = status;

    const offset = (page - 1) * limit;
    const { rows, count } = await Application.findAndCountAll({
      where,
      include: [
        { model: ApplicationCategory, as: "category", attributes: ["id", "code", "name"] },
        { model: Sector, as: "sector", attributes: ["id", "name"] },
      ],
      order: [["updated_at", "DESC"]],
      limit,
      offset,
    });

    return { applications: rows, total: count, page, totalPages: Math.ceil(count / limit) };
  }

  // ── List all applications (admin / reporting) ────────
  static async listAll({ page = 1, limit = 20, status, category_id, sector_id, search }) {
    const where = {};
    if (status) where.status = status;
    if (category_id) where.category_id = category_id;
    if (sector_id) where.sector_id = sector_id;
    if (search) {
      where[Op.or] = [
        { project_name: { [Op.iLike]: `%${search}%` } },
        { reference_number: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Application.findAndCountAll({
      where,
      include: [
        { model: User, as: "applicant", attributes: ["id", "name", "email"] },
        { model: ApplicationCategory, as: "category", attributes: ["id", "code", "name"] },
        { model: Sector, as: "sector", attributes: ["id", "name"] },
      ],
      order: [["updated_at", "DESC"]],
      limit,
      offset,
    });

    return { applications: rows, total: count, page, totalPages: Math.ceil(count / limit) };
  }

  // ── Get status history for an application ────────────
  static async getHistory(applicationId) {
    return StatusHistory.findAll({
      where: { application_id: applicationId },
      include: [{ model: User, as: "changedBy", attributes: ["id", "name"] }],
      order: [["created_at", "ASC"]],
    });
  }

  // ── Assign scrutiny officer (admin) ──────────────────
  static async assignScrutiny(applicationId, scrutinyUserId, adminId) {
    const app = await Application.findByPk(applicationId);
    if (!app) { const err = new Error("Application not found"); err.status = 404; throw err; }

    app.assigned_scrutiny_id = scrutinyUserId;
    if (app.status === "submitted") {
      const prev = app.status;
      app.status = "under_scrutiny";
      await StatusHistory.create({
        application_id: app.id,
        changed_by: adminId,
        from_status: prev,
        to_status: "under_scrutiny",
        remarks: "Assigned to scrutiny team",
      });
    }
    await app.save();
    return ApplicationService.findById(app.id);
  }

  // ── Assign MoM officer (admin) ───────────────────────
  static async assignMom(applicationId, momUserId, adminId) {
    const app = await Application.findByPk(applicationId);
    if (!app) { const err = new Error("Application not found"); err.status = 404; throw err; }

    app.assigned_mom_id = momUserId;
    await app.save();
    return ApplicationService.findById(app.id);
  }
}

module.exports = ApplicationService;
