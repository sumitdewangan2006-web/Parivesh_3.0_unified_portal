// ── Document Service ─────────────────────────────────────────────────
// Upload, list, download, version management for application documents

const path = require("path");
const fs = require("fs");
const { Document, Application, User } = require("../models");
const config = require("../config");

class DocumentService {
  // Upload a document linked to an application
  static async upload(applicationId, userId, file, { document_type, tag }) {
    // Verify application exists
    const app = await Application.findByPk(applicationId);
    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
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
      uploaded_by: userId,
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
  static async listByApplication(applicationId) {
    return Document.findAll({
      where: { application_id: applicationId, is_active: true },
      include: [{ model: User, as: "uploader", attributes: ["id", "name"] }],
      order: [["document_type", "ASC"], ["created_at", "DESC"]],
    });
  }

  // Get a single document (for download)
  static async findById(documentId) {
    const doc = await Document.findByPk(documentId);
    if (!doc) {
      const err = new Error("Document not found");
      err.status = 404;
      throw err;
    }
    return doc;
  }

  // Get all versions of a document type for an application
  static async getVersionHistory(applicationId, documentType) {
    return Document.findAll({
      where: { application_id: applicationId, document_type: documentType },
      include: [{ model: User, as: "uploader", attributes: ["id", "name"] }],
      order: [["version", "DESC"]],
    });
  }

  // Delete a document (soft-delete)
  static async softDelete(documentId, userId) {
    const doc = await Document.findByPk(documentId);
    if (!doc) {
      const err = new Error("Document not found");
      err.status = 404;
      throw err;
    }

    doc.is_active = false;
    await doc.save();
    return doc;
  }
}

module.exports = DocumentService;
