// ── Payment Service ──────────────────────────────────────────────────
// Mock UPI/QR payment processing for EC application fees

const { v4: uuidv4 } = require("uuid");
const { Payment, Application, StatusHistory, Document } = require("../models");
const EnvironmentalRiskService = require("./environmentalRiskService");
const ChecklistValidationService = require("./checklistValidationService");

const CRORE = 1_00_00_000; // 1 Crore = 10,000,000 INR

class PaymentService {
  /**
   * Calculate EC fee based on estimated project cost (in INR).
   *  < 50 Cr  → ₹50,000
   *  50-100 Cr → ₹1,00,000
   *  > 100 Cr  → ₹2,00,000
   */
  static calculateFee(estimatedCost) {
    const cost = Number(estimatedCost) || 0;
    if (cost < 50 * CRORE) return 50000;
    if (cost <= 100 * CRORE) return 100000;
    return 200000;
  }

  static async ensureChecklistReadyForPayment(app) {
    if (!app.mineral_type) {
      const err = new Error("Mineral / project type is required before payment");
      err.status = 400;
      throw err;
    }

    const effectiveChecklist = await ChecklistValidationService.getEffectiveChecklist(
      app.mineral_type,
      app.sector_id
    );
    if (!effectiveChecklist.length) {
      const err = new Error("Invalid mineral / project type for checklist validation");
      err.status = 400;
      throw err;
    }

    const requiredItems = effectiveChecklist.filter((item) => item.required);
    if (!requiredItems.length) return;

    const activeDocuments = await Document.findAll({
      where: { application_id: app.id, is_active: true },
      attributes: ["document_type"],
    });

    const uploaded = new Set(
      activeDocuments
        .map((doc) => doc.document_type)
        .filter((key) => typeof key === "string" && key.trim() !== "")
    );

    const missingDocuments = requiredItems
      .filter((item) => !uploaded.has(item.key))
      .map((item) => ({ key: item.key, label: item.label, sno: item.sno }));

    if (missingDocuments.length) {
      const err = new Error(
        `Upload all required checklist documents before payment (${missingDocuments.length} pending)`
      );
      err.status = 400;
      err.code = "CHECKLIST_INCOMPLETE";
      err.details = {
        mineral_type: app.mineral_type,
        missing_documents: missingDocuments,
      };
      throw err;
    }
  }

  // ── Calculate fee for an application ──────────────────
  static async calculateFeeForApplication(applicationId, userId) {
    const app = await Application.findByPk(applicationId);
    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }
    if (app.applicant_id !== userId) {
      const err = new Error("Not authorized to view payment for this application");
      err.status = 403;
      throw err;
    }
    if (app.status !== "draft") {
      const err = new Error("Fee payment is only available while the application is in draft status");
      err.status = 400;
      throw err;
    }
    if (!app.estimated_cost) {
      const err = new Error("Estimated project cost is required before payment");
      err.status = 400;
      throw err;
    }

    await PaymentService.ensureChecklistReadyForPayment(app);
    const fee = PaymentService.calculateFee(app.estimated_cost);
    return {
      application_id: app.id,
      reference_number: app.reference_number,
      estimated_cost: app.estimated_cost,
      total_fee: fee,
    };
  }

  // ── Initiate a mock payment ──────────────────────────
  static async initiate(applicationId, userId, { payment_method } = {}) {
    const app = await Application.findByPk(applicationId);
    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }
    if (app.applicant_id !== userId) {
      const err = new Error("Not authorized to pay for this application");
      err.status = 403;
      throw err;
    }
    if (app.status !== "draft") {
      const err = new Error("Payment is only available while the application is in draft status");
      err.status = 400;
      throw err;
    }
    if (!app.estimated_cost) {
      const err = new Error("Estimated project cost is required before payment");
      err.status = 400;
      throw err;
    }

    await PaymentService.ensureChecklistReadyForPayment(app);

    const completedPayment = await Payment.findOne({
      where: { application_id: applicationId, status: "completed" },
      order: [["created_at", "DESC"]],
    });
    if (completedPayment) {
      const err = new Error("Payment is already completed for this application");
      err.status = 400;
      throw err;
    }

    // Auto-calculate fee from project cost
    const amount = PaymentService.calculateFee(app.estimated_cost);

    const pendingPayment = await Payment.findOne({
      where: { application_id: applicationId, user_id: userId, status: "pending" },
      order: [["created_at", "DESC"]],
    });

    if (pendingPayment) {
      return {
        payment_id: pendingPayment.id,
        amount: pendingPayment.amount,
        currency: pendingPayment.currency,
        payment_method: pendingPayment.payment_method,
        status: pendingPayment.status,
        upi_link: `upi://pay?pa=parivesh@gov&pn=PARIVESH&am=${pendingPayment.amount}&tn=EC-Fee-${app.reference_number}`,
        qr_data: `upi://pay?pa=parivesh@gov&pn=PARIVESH&am=${pendingPayment.amount}&tn=EC-Fee-${app.reference_number}`,
      };
    }

    const payment = await Payment.create({
      application_id: applicationId,
      user_id: userId,
      amount,
      payment_method: payment_method || "mock",
      status: "pending",
    });

    // Return mock UPI payment data
    return {
      payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      payment_method: payment.payment_method,
      status: payment.status,
      upi_link: `upi://pay?pa=parivesh@gov&pn=PARIVESH&am=${amount}&tn=EC-Fee-${app.reference_number}`,
      qr_data: `upi://pay?pa=parivesh@gov&pn=PARIVESH&am=${amount}&tn=EC-Fee-${app.reference_number}`,
    };
  }

  // ── Confirm / complete payment (mock webhook) ────────
  static async confirm(paymentId, userId) {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      const err = new Error("Payment not found");
      err.status = 404;
      throw err;
    }
    if (payment.user_id !== userId) {
      const err = new Error("Not authorized to confirm this payment");
      err.status = 403;
      throw err;
    }

    if (payment.status !== "pending") {
      const err = new Error("Payment is not in pending state");
      err.status = 400;
      throw err;
    }

    const app = await Application.findByPk(payment.application_id);
    if (!app) return payment;

    if (app.status === "draft") {
      await PaymentService.ensureChecklistReadyForPayment(app);
    }

    payment.status = "completed";
    payment.transaction_id = `TXN-${uuidv4().substring(0, 12).toUpperCase()}`;
    payment.paid_at = new Date();
    await payment.save();

    // Payment happens within the draft stage and immediately submits the application.
    if (app.status === "draft") {
      app.status = "submitted";
      app.submitted_at = new Date();
      await app.save();
      await StatusHistory.create({
        application_id: app.id,
        changed_by: payment.user_id,
        from_status: "draft",
        to_status: "submitted",
        remarks: `Payment completed, application submitted — TXN: ${payment.transaction_id}`,
      });
    }

    const result = payment.toJSON ? payment.toJSON() : { ...payment };
    if (app && app.status === "submitted") {
      result.risk_analysis = await EnvironmentalRiskService.analyzeApplication(app.id);
    }

    return result;
  }

  // ── List payments for an application ─────────────────
  static async listByApplication(applicationId) {
    return Payment.findAll({
      where: { application_id: applicationId },
      order: [["created_at", "DESC"]],
    });
  }

  // ── Get public payment details (no auth — for mobile scanner page) ───
  static async getPublicDetails(paymentId) {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      const err = new Error("Payment not found");
      err.status = 404;
      throw err;
    }
    const app = await Application.findByPk(payment.application_id);
    return {
      payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      reference_number: app?.reference_number,
    };
  }

  // ── Confirm payment from mobile page (no auth) ────────────────────────
  static async confirmPublic(paymentId) {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      const err = new Error("Payment not found");
      err.status = 404;
      throw err;
    }
    // Idempotent — already completed is fine
    if (payment.status === "completed") {
      return { success: true, status: "completed", transaction_id: payment.transaction_id };
    }
    if (payment.status !== "pending") {
      const err = new Error("Payment is not in a payable state");
      err.status = 400;
      throw err;
    }

    const app = await Application.findByPk(payment.application_id);
    if (app && app.status === "draft") {
      await PaymentService.ensureChecklistReadyForPayment(app);
    }

    payment.status = "completed";
    payment.transaction_id = `TXN-${uuidv4().substring(0, 12).toUpperCase()}`;
    payment.paid_at = new Date();
    await payment.save();

    if (app && app.status === "draft") {
      app.status = "submitted";
      app.submitted_at = new Date();
      await app.save();
      await StatusHistory.create({
        application_id: app.id,
        changed_by: payment.user_id,
        from_status: "draft",
        to_status: "submitted",
        remarks: `Payment completed via UPI QR scan, application submitted — TXN: ${payment.transaction_id}`,
      });
    }

    const result = { success: true, status: "completed", transaction_id: payment.transaction_id };
    if (app && app.status === "submitted") {
      result.risk_analysis = await EnvironmentalRiskService.analyzeApplication(app.id);
    }

    return result;
  }

  // ── List all payments (admin view) ───────────────────
  static async listAll({ page = 1, limit = 20, status }) {
    const where = {};
    if (status) where.status = status;

    const offset = (page - 1) * limit;
    const { rows, count } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Application,
          as: "application",
          attributes: ["id", "reference_number", "project_name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return { payments: rows, total: count, page, totalPages: Math.ceil(count / limit) };
  }
}

module.exports = PaymentService;
