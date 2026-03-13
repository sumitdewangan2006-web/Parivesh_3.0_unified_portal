// ── Document Routes ──────────────────────────────────────────────────
// Upload, list, download, version history

const express = require("express");
const path = require("path");
const multer = require("multer");
const { param, body } = require("express-validator");
const { authenticate, validate, upload } = require("../middleware");
const DocumentService = require("../services/documentService");

const router = express.Router();

router.use(authenticate);

// ── Upload document to an application ────────────────────────────────
router.post(
  "/application/:applicationId",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ error: "File too large. Maximum size is 50 MB." });
        }
        return res.status(400).json({ error: err.message });
      }
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  validate([
    param("applicationId").isUUID(),
  ]),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const doc = await DocumentService.upload(
        req.params.applicationId,
        req.user.id,
        req.file,
        {
          document_type: req.body.document_type,
          tag: req.body.tag,
        }
      );
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  }
);

// ── List documents for an application ────────────────────────────────
router.get(
  "/application/:applicationId",
  validate([param("applicationId").isUUID()]),
  async (req, res, next) => {
    try {
      const docs = await DocumentService.listByApplication(req.params.applicationId);
      res.json(docs);
    } catch (err) {
      next(err);
    }
  }
);

// ── Download a document ──────────────────────────────────────────────
router.get(
  "/:id/download",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const doc = await DocumentService.findById(req.params.id);
      res.download(doc.file_path, doc.original_name);
    } catch (err) {
      next(err);
    }
  }
);

// ── Version history ──────────────────────────────────────────────────
router.get(
  "/application/:applicationId/versions/:documentType",
  validate([param("applicationId").isUUID()]),
  async (req, res, next) => {
    try {
      const versions = await DocumentService.getVersionHistory(
        req.params.applicationId,
        req.params.documentType
      );
      res.json(versions);
    } catch (err) {
      next(err);
    }
  }
);

// ── Soft-delete a document ───────────────────────────────────────────
router.delete(
  "/:id",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const doc = await DocumentService.softDelete(req.params.id, req.user.id);
      res.json({ message: "Document removed", id: doc.id });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
