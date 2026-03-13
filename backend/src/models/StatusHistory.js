// ── Status History ───────────────────────────────────────────────────
// Audit trail of every status change for an application
const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const StatusHistory = sequelize.define(
  "StatusHistory",
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
    changed_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    from_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "null for initial creation",
    },
    to_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "status_history",
    timestamps: true,
    underscored: true,
    updatedAt: false, // Immutable log — no updates
  }
);

module.exports = StatusHistory;
