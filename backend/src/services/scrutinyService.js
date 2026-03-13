// ── Scrutiny Service ─────────────────────────────────────────────────
// Review, remarks, queries, approve/reject for scrutiny team

const path = require("path");
const fs = require("fs");
const {
  Application,
  Remark,
  StatusHistory,
  User,
  ApplicationCategory,
  Sector,
  Document,
  GistTemplate,
} = require("../models");

class ScrutinyService {
  // ── List applications assigned to a scrutiny officer ──
  static async listAssigned(scrutinyUserId, { page = 1, limit = 20, status }) {
    const where = { assigned_scrutiny_id: scrutinyUserId };
    if (status) where.status = status;

    const offset = (page - 1) * limit;
    const { rows, count } = await Application.findAndCountAll({
      where,
      include: [
        { model: User, as: "applicant", attributes: ["id", "name", "email", "organization"] },
        { model: ApplicationCategory, as: "category", attributes: ["id", "code", "name"] },
        { model: Sector, as: "sector", attributes: ["id", "name"] },
      ],
      order: [["updated_at", "DESC"]],
      limit,
      offset,
    });

    return { applications: rows, total: count, page, totalPages: Math.ceil(count / limit) };
  }

  // ── Add a remark/query to an application ─────────────
  static async addRemark(applicationId, userId, { remark_type, content }) {
    const app = await Application.findByPk(applicationId);
    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }

    const remark = await Remark.create({
      application_id: applicationId,
      user_id: userId,
      remark_type,
      content,
    });

    // If raising a query, transition status to essential_document_sought
    if (remark_type === "query" && app.status === "under_scrutiny") {
      const prev = app.status;
      app.status = "essential_document_sought";
      await app.save();

      await StatusHistory.create({
        application_id: applicationId,
        changed_by: userId,
        from_status: prev,
        to_status: "essential_document_sought",
        remarks: `Essential Document Sought: ${content.substring(0, 100)}`,
      });
    }

    return remark;
  }

  // ── List remarks for an application ──────────────────
  static async listRemarks(applicationId) {
    return Remark.findAll({
      where: { application_id: applicationId },
      include: [{ model: User, as: "author", attributes: ["id", "name"] }],
      order: [["created_at", "ASC"]],
    });
  }

  // ── Resolve a query ──────────────────────────────────
  static async resolveQuery(remarkId, userId) {
    const remark = await Remark.findByPk(remarkId);
    if (!remark) {
      const err = new Error("Remark not found");
      err.status = 404;
      throw err;
    }

    remark.is_resolved = true;
    remark.resolved_at = new Date();
    await remark.save();
    return remark;
  }

  // ── Approve application (move to referred) ─────────────
  static async approve(applicationId, userId, remarks) {
    const app = await Application.findByPk(applicationId, {
      include: [
        { model: ApplicationCategory, as: "category" },
        { model: Sector, as: "sector" },
        { model: User, as: "applicant", attributes: ["id", "name", "email", "organization"] },
      ],
    });
    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }

    if (app.status !== "under_scrutiny") {
      const err = new Error("Application must be under scrutiny to approve");
      err.status = 400;
      throw err;
    }

    const prev = app.status;
    app.status = "referred";
    app.approved_at = new Date();
    await app.save();

    // Record approval remark
    await Remark.create({
      application_id: applicationId,
      user_id: userId,
      remark_type: "approval",
      content: remarks || "Application referred for meeting",
    });

    await StatusHistory.create({
      application_id: applicationId,
      changed_by: userId,
      from_status: prev,
      to_status: "referred",
      remarks: remarks || "Application referred by scrutiny team",
    });

    // ── Auto-generate meeting gist from template ─────────
    let gistDocument = null;
    try {
      gistDocument = await ScrutinyService._generateGist(app, userId);
    } catch (gistErr) {
      // Log but don't block the approval if gist generation fails
      console.error("Auto gist generation failed:", gistErr.message);
    }

    const result = app.toJSON();
    if (gistDocument) {
      result.gist = gistDocument;
    }
    return result;
  }

  // ── Internal: generate gist document from template ───
  static async _generateGist(app, userId) {
    // Find a template matching category + sector first, then category only, then any active
    let template = await GistTemplate.findOne({
      where: { category_id: app.category_id, sector_id: app.sector_id, is_active: true },
    });
    if (!template) {
      template = await GistTemplate.findOne({
        where: { category_id: app.category_id, is_active: true },
      });
    }
    if (!template) {
      template = await GistTemplate.findOne({
        where: { is_active: true },
      });
    }
    if (!template) {
      return null; // No template available — skip gist generation
    }

    // Populate placeholders in the template content
    const placeholders = {
      "{{project_name}}": app.project_name || "",
      "{{reference_number}}": app.reference_number || "",
      "{{project_description}}": app.project_description || "",
      "{{project_location}}": app.project_location || "",
      "{{project_state}}": app.project_state || "",
      "{{project_district}}": app.project_district || "",
      "{{estimated_cost}}": app.estimated_cost ? Number(app.estimated_cost).toLocaleString("en-IN") : "",
      "{{project_area}}": app.project_area ? `${app.project_area} hectares` : "",
      "{{category_name}}": app.category ? app.category.name : "",
      "{{category_code}}": app.category ? app.category.code : "",
      "{{sector_name}}": app.sector ? app.sector.name : "",
      "{{applicant_name}}": app.applicant ? app.applicant.name : "",
      "{{applicant_email}}": app.applicant ? app.applicant.email : "",
      "{{applicant_organization}}": app.applicant ? app.applicant.organization : "",
      "{{date}}": new Date().toLocaleDateString("en-IN"),
    };

    let gistContent = template.content;
    for (const [key, value] of Object.entries(placeholders)) {
      gistContent = gistContent.split(key).join(value);
    }

    // Write gist file to uploads directory
    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const fileName = `gist_${app.reference_number.replace(/[^a-zA-Z0-9-]/g, "_")}_${Date.now()}.html`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, gistContent, "utf8");

    // Create Document record
    const doc = await Document.create({
      application_id: app.id,
      uploaded_by: userId,
      file_name: fileName,
      original_name: `Meeting Gist - ${app.project_name}.html`,
      file_path: `uploads/${fileName}`,
      mime_type: "text/html",
      file_size: Buffer.byteLength(gistContent, "utf8"),
      document_type: "Gist",
      tag: "auto_generated",
    });

    return doc;
  }

  // ── Send back for correction (Essential Document Sought) ─
  static async sendBack(applicationId, userId, remarks) {
    const app = await Application.findByPk(applicationId);
    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }

    const prev = app.status;
    app.status = "essential_document_sought";
    await app.save();

    await Remark.create({
      application_id: applicationId,
      user_id: userId,
      remark_type: "correction",
      content: remarks,
    });

    await StatusHistory.create({
      application_id: applicationId,
      changed_by: userId,
      from_status: prev,
      to_status: "essential_document_sought",
      remarks: `Essential Document Sought: ${remarks.substring(0, 100)}`,
    });

    return app;
  }
}

module.exports = ScrutinyService;
