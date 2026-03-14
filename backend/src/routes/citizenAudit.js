const express = require("express");
const path = require("path");
const multer = require("multer");
const { body, param } = require("express-validator");

const { authenticate, authorize, upload, validate } = require("../middleware");
const CitizenObservationService = require("../services/citizenObservationService");

const router = express.Router();

// Protected: list all observations for scrutiny/admin workflow (includes flagged/removed)
router.get(
  "/application/:applicationId/observations",
  authenticate,
  authorize("admin", "scrutiny_team"),
  validate([param("applicationId").isUUID()]),
  async (req, res, next) => {
    try {
      const data = await CitizenObservationService.listForApplication(req.params.applicationId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// Public: list observations for an application reference number
router.get(
  "/:referenceNumber/observations",
  validate([param("referenceNumber").isString().notEmpty()]),
  async (req, res, next) => {
    try {
      const data = await CitizenObservationService.listPublicObservations(req.params.referenceNumber);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// Public: submit a citizen observation with optional geo-tagged photo
router.post(
  "/:referenceNumber/observations",
  (req, res, next) => {
    upload.single("photo")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ error: "Photo too large. Maximum size is 50 MB." });
        }
        return res.status(400).json({ error: err.message });
      }
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  validate([
    param("referenceNumber").isString().notEmpty(),
    body("citizen_name").optional().isString().isLength({ max: 150 }),
    body("contact_email").optional().isEmail(),
    body("contact_phone").optional().isString().isLength({ max: 30 }),
    body("observation_text").isString().trim().isLength({ min: 10, max: 5000 }),
    body("biodiversity_tags").optional().isString().isLength({ max: 300 }),
    body("latitude").optional().isFloat({ min: -90, max: 90 }),
    body("longitude").optional().isFloat({ min: -180, max: 180 }),
  ]),
  async (req, res, next) => {
    try {
      const data = await CitizenObservationService.submitPublicObservation(
        req.params.referenceNumber,
        req.body,
        req.file,
        {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        }
      );
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  }
);

// Public: render uploaded observation photo
router.get(
  "/observations/:id/photo",
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const photo = await CitizenObservationService.getPublicPhoto(req.params.id);
      const absolutePath = path.resolve(photo.photo_path);
      res.setHeader("Content-Type", photo.photo_mime_type || "application/octet-stream");
      res.setHeader("Content-Disposition", `inline; filename="${photo.photo_original_name || "observation-photo"}"`);
      res.sendFile(absolutePath);
    } catch (err) {
      next(err);
    }
  }
);

// Moderation: scrutiny/admin can flag/remove/publish an observation
router.put(
  "/observations/:id/status",
  authenticate,
  authorize("admin", "scrutiny_team"),
  validate([
    param("id").isUUID(),
    body("status").isIn(["published", "flagged", "removed"]),
  ]),
  async (req, res, next) => {
    try {
      const result = await CitizenObservationService.updateStatus(
        req.params.id,
        req.body.status,
        req.user.id
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
