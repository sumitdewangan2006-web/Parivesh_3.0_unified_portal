// ── Dashboard Service ────────────────────────────────────────────────
// Aggregated statistics for the admin dashboard and reports

const { Op } = require("sequelize");
const { Application, ApplicationCategory, Sector, Payment, User, Role, Document, StatusHistory, Meeting, Remark, sequelize } = require("../models");
const { fn, col, literal } = require("sequelize");

class DashboardService {
  // ── Overview stats ───────────────────────────────────
  static async getOverview() {
    const [
      totalApplications,
      statusCounts,
      totalUsers,
      totalPayments,
      revenueResult,
      totalDocuments,
      totalMeetings,
    ] = await Promise.all([
      Application.count(),
      Application.findAll({
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        group: ["status"],
        raw: true,
      }),
      User.count(),
      Payment.count({ where: { status: "completed" } }),
      Payment.findOne({
        attributes: [[fn("SUM", col("amount")), "total_revenue"]],
        where: { status: "completed" },
        raw: true,
      }),
      Document.count({ where: { is_active: true } }),
      Meeting.count(),
    ]);

    // Convert statusCounts array into an object
    const byStatus = {};
    for (const row of statusCounts) {
      byStatus[row.status] = parseInt(row.count, 10);
    }

    return {
      total_applications: totalApplications,
      by_status: byStatus,
      total_users: totalUsers,
      completed_payments: totalPayments,
      total_revenue: parseFloat(revenueResult?.total_revenue || 0),
      total_documents: totalDocuments,
      total_meetings: totalMeetings,
    };
  }

  // ── Applications by category ─────────────────────────
  static async byCategory() {
    const results = await Application.findAll({
      attributes: ["category_id", [fn("COUNT", col("Application.id")), "count"]],
      include: [{ model: ApplicationCategory, as: "category", attributes: ["code", "name"] }],
      group: ["category_id", "category.id"],
      raw: true,
      nest: true,
    });
    return results;
  }

  // ── Applications by sector ───────────────────────────
  static async bySector() {
    const results = await Application.findAll({
      attributes: ["sector_id", [fn("COUNT", col("Application.id")), "count"]],
      include: [{ model: Sector, as: "sector", attributes: ["name"] }],
      group: ["sector_id", "sector.id"],
      raw: true,
      nest: true,
    });
    return results;
  }

  // ── Monthly application trend (last 12 months) ──────
  static async monthlyTrend() {
    const results = await Application.findAll({
      attributes: [
        [fn("DATE_TRUNC", "month", col("created_at")), "month"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: {
        created_at: {
          [Op.gte]: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        },
      },
      group: [fn("DATE_TRUNC", "month", col("created_at"))],
      order: [[fn("DATE_TRUNC", "month", col("created_at")), "ASC"]],
      raw: true,
    });
    return results;
  }

  // ── Recent applications (last 10) ───────────────────
  static async recentApplications(limit = 10) {
    return Application.findAll({
      include: [
        { model: User, as: "applicant", attributes: ["id", "name"] },
        { model: ApplicationCategory, as: "category", attributes: ["code", "name"] },
        { model: Sector, as: "sector", attributes: ["name"] },
      ],
      order: [["created_at", "DESC"]],
      limit,
    });
  }

  // ── Recent activity (status changes) ─────────────────
  static async recentActivity(limit = 15) {
    return StatusHistory.findAll({
      include: [
        { model: User, as: "changedBy", attributes: ["id", "name"] },
        {
          model: Application,
          as: "application",
          attributes: ["id", "reference_number", "project_name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
    });
  }

  // ── State-wise distribution ──────────────────────────
  static async byState() {
    const results = await Application.findAll({
      attributes: [
        "project_state",
        [fn("COUNT", col("id")), "count"],
      ],
      where: { project_state: { [Op.not]: null } },
      group: ["project_state"],
      order: [[fn("COUNT", col("id")), "DESC"]],
      raw: true,
    });
    return results;
  }

  // ── Average processing time (submitted → final) ─────
  static async avgProcessingDays() {
    // Calculate average days between submitted_at and approved_at for approved apps
    const result = await Application.findOne({
      attributes: [
        [fn("AVG",
          literal("EXTRACT(EPOCH FROM (approved_at - submitted_at)) / 86400")
        ), "avg_days_to_approval"],
      ],
      where: {
        submitted_at: { [Op.not]: null },
        approved_at: { [Op.not]: null },
      },
      raw: true,
    });

    const pubResult = await Application.findOne({
      attributes: [
        [fn("AVG",
          literal("EXTRACT(EPOCH FROM (published_at - submitted_at)) / 86400")
        ), "avg_days_to_publication"],
      ],
      where: {
        submitted_at: { [Op.not]: null },
        published_at: { [Op.not]: null },
      },
      raw: true,
    });

    return {
      avg_days_to_approval: result?.avg_days_to_approval ? parseFloat(Number(result.avg_days_to_approval).toFixed(1)) : null,
      avg_days_to_publication: pubResult?.avg_days_to_publication ? parseFloat(Number(pubResult.avg_days_to_publication).toFixed(1)) : null,
    };
  }

  // ── Proponent-specific stats ─────────────────────────
  static async proponentStats(userId) {
    const [total, statusCounts, docCount, paymentTotal] = await Promise.all([
      Application.count({ where: { applicant_id: userId } }),
      Application.findAll({
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        where: { applicant_id: userId },
        group: ["status"],
        raw: true,
      }),
      Document.count({
        include: [{ model: Application, as: "application", where: { applicant_id: userId }, attributes: [] }],
        where: { is_active: true },
      }),
      Payment.findOne({
        attributes: [[fn("SUM", col("Payment.amount")), "total_paid"]],
        include: [{ model: Application, as: "application", where: { applicant_id: userId }, attributes: [] }],
        where: { status: "completed" },
        raw: true,
      }),
    ]);

    const byStatus = {};
    for (const row of statusCounts) {
      byStatus[row.status] = parseInt(row.count, 10);
    }

    return {
      total_applications: total,
      by_status: byStatus,
      total_documents: docCount,
      total_paid: parseFloat(paymentTotal?.total_paid || 0),
    };
  }

  // ── Scrutiny team stats ──────────────────────────────
  static async scrutinyStats(userId) {
    const [assigned, pendingRemarks, resolved] = await Promise.all([
      Application.count({ where: { assigned_scrutiny_id: userId } }),
      Remark.count({
        where: { remark_type: "query", is_resolved: false },
        include: [{
          model: Application,
          as: "application",
          where: { assigned_scrutiny_id: userId },
          attributes: [],
        }],
      }),
      Remark.count({
        where: { remark_type: "query", is_resolved: true },
        include: [{
          model: Application,
          as: "application",
          where: { assigned_scrutiny_id: userId },
          attributes: [],
        }],
      }),
    ]);

    return {
      assigned_applications: assigned,
      pending_queries: pendingRemarks,
      resolved_queries: resolved,
    };
  }
}

module.exports = DashboardService;
