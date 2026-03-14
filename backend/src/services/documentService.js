// ── Document Service ─────────────────────────────────────────────────
// Upload, list, download, version management for application documents

const path = require("path");
const fs = require("fs");
const { Document, Application, User } = require("../models");
const config = require("../config");

class DocumentService {
  static assertApplicationAccess(app, user) {
    const role = user?.role?.name;

    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }

    if (role === "admin") return;

    if (role === "project_proponent" && app.applicant_id === user.id) {
      return;
    }

    if (role === "scrutiny_team" && app.assigned_scrutiny_id === user.id) {
      return;
    }

    if (role === "mom_team") {
      if (app.assigned_mom_id === user.id) return;
      if (["referred", "mom_generated", "finalized"].includes(app.status)) return;
    }

    const err = new Error("Not authorized to access documents for this application");
    err.status = 403;
    throw err;
  }

  static async getApplicationForAccess(applicationId) {
    return Application.findByPk(applicationId, {
      attributes: ["id", "applicant_id", "assigned_scrutiny_id", "assigned_mom_id", "status"],
    });
  }

  // Upload a document linked to an application
  static async upload(applicationId, user, file, { document_type, tag }) {
    // Verify application exists
    const app = await DocumentService.getApplicationForAccess(applicationId);
    DocumentService.assertApplicationAccess(app, user);

    // Upload permissions are restricted to the owning proponent while draft/query is open.
    if (user.role?.name !== "project_proponent" || app.applicant_id !== user.id) {
      const err = new Error("Only the project proponent can upload documents");
      err.status = 403;
      throw err;
    }

    if (!["draft", "essential_document_sought"].includes(app.status)) {
      const err = new Error("Documents can only be uploaded in Draft or Essential Document Sought status");
      err.status = 400;
      throw err;
    }

    // Determine version: bump if same type already exists
    let version = 1;
    const existing = await Document.findOne({
      where: {
        application_id: applicationId,
        document_type: document_type || null,
        is_active: true,
      },
      order: [["version", "DESC"]],
    });

    if (existing) {
      version = existing.version + 1;
      // Deactivate old version (soft-delete)
      existing.is_active = false;
      await existing.save();
    }

    const doc = await Document.create({
      application_id: applicationId,
      uploaded_by: user.id,
      file_name: file.filename,
      original_name: file.originalname,
      file_path: file.path,
      mime_type: file.mimetype,
      file_size: file.size,
      document_type: document_type || null,
      tag: tag || null,
      version,
      is_active: true,
    });

    return doc;
  }

  // List active documents for an application
  static async listByApplication(applicationId, user) {
    const app = await DocumentService.getApplicationForAccess(applicationId);
    DocumentService.assertApplicationAccess(app, user);

    return Document.findAll({
      where: { application_id: applicationId, is_active: true },
      include: [{ model: User, as: "uploader", attributes: ["id", "name"] }],
      order: [["document_type", "ASC"], ["created_at", "DESC"]],
    });
  }

  // Get a single document (for download)
  static async findById(documentId, user) {
    const doc = await Document.findByPk(documentId, {
      include: [
        {
          model: Application,
          as: "application",
          attributes: ["id", "applicant_id", "assigned_scrutiny_id", "assigned_mom_id", "status"],
        },
      ],
    });
    if (!doc) {
      const err = new Error("Document not found");
      err.status = 404;
      throw err;
    }

    DocumentService.assertApplicationAccess(doc.application, user);
    return doc;
  }

  // Get all versions of a document type for an application
  static async getVersionHistory(applicationId, documentType, user) {
    const app = await DocumentService.getApplicationForAccess(applicationId);
    DocumentService.assertApplicationAccess(app, user);

    return Document.findAll({
      where: { application_id: applicationId, document_type: documentType },
      include: [{ model: User, as: "uploader", attributes: ["id", "name"] }],
      order: [["version", "DESC"]],
    });
  }

  // Delete a document (soft-delete)
  static async softDelete(documentId, user) {
    const doc = await DocumentService.findById(documentId, user);

    const role = user.role?.name;
    if (role !== "admin") {
      if (role !== "project_proponent" || doc.application.applicant_id !== user.id) {
        const err = new Error("Only the owning project proponent can delete this document");
        err.status = 403;
        throw err;
      }

      if (!["draft", "essential_document_sought"].includes(doc.application.status)) {
        const err = new Error("Documents can only be removed in Draft or Essential Document Sought status");
        err.status = 400;
        throw err;
      }
    }

    doc.is_active = false;
    await doc.save();
    return doc;
  }
}

module.exports = DocumentService;
