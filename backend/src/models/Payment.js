// ── Payments ─────────────────────────────────────────────────────────
// Fee payments for EC applications (UPI / QR mock integration)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    application_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "applications", key: "id" },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "INR",
    },
    payment_method: {
      type: DataTypes.ENUM("upi", "qr_code", "net_banking", "mock"),
      defaultValue: "mock",
    },
    transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: "External payment gateway transaction reference",
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
      defaultValue: "pending",
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "payments",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Payment;
