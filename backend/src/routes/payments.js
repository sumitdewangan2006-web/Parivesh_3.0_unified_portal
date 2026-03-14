// ── Payment Routes ───────────────────────────────────────────────────
// Initiate, confirm, list payments

const express = require("express");
const { body, param, query } = require("express-validator");
const { authenticate, authorize, validate } = require("../middleware");
const PaymentService = require("../services/paymentService");

const router = express.Router();

// ── Public endpoints (no auth — mobile QR scanner flow) ───────────────
// These must be registered BEFORE router.use(authenticate)

// Get payment details for display on mobile pay page
router.get("/public/:id", async (req, res, next) => {
  try {
    const result = await PaymentService.getPublicDetails(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Confirm payment from mobile pay page (mock UPI tap-to-pay)
router.post("/public/:id/pay", async (req, res, next) => {
  try {
    const result = await PaymentService.confirmPublic(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.use(authenticate);

// ── Calculate fee for an application ─────────────────────────────────
router.get(
  "/calculate-fee/:applicationId",
  authorize("project_proponent"),
  validate([param("applicationId").isUUID()]),
  async (req, res, next) => {
    try {
      const result = await PaymentService.calculateFeeForApplication(
        req.params.applicationId,
        req.user.id
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── Initiate payment ─────────────────────────────────────────────────
router.post(
  "/initiate",
  authorize("project_proponent"),
  validate([
    body("application_id").isUUID().withMessage("Valid application ID required"),
    body("payment_method")
      .optional()
      .isIn(["upi", "qr_code", "net_banking", "mock"]),
  ]),
  async (req, res, next) => {
    try {
      const result = await PaymentService.initiate(
        req.body.application_id,
        req.user.id,
        req.body
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── Confirm payment (mock webhook) ───────────────────────────────────
router.post(
  "/:id/confirm",
  authorize("project_proponent"),
  validate([param("id").isUUID()]),
  async (req, res, next) => {
    try {
      const payment = await PaymentService.confirm(req.params.id, req.user.id);
      res.json(payment);
    } catch (err) {
      next(err);
    }
  }
);

// ── List payments for an application ─────────────────────────────────
router.get(
  "/application/:applicationId",
  validate([param("applicationId").isUUID()]),
  async (req, res, next) => {
    try {
      const payments = await PaymentService.listByApplication(req.params.applicationId);
      res.json(payments);
    } catch (err) {
      next(err);
    }
  }
);

// ── Admin: List all payments ─────────────────────────────────────────
router.get(
  "/",
  authorize("admin"),
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isIn(["pending", "completed", "failed", "refunded"]),
  ]),
  async (req, res, next) => {
    try {
      const result = await PaymentService.listAll({
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
        status: req.query.status,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
