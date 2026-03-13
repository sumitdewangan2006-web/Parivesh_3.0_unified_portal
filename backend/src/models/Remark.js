// ── Remarks / Queries ────────────────────────────────────────────────
// Scrutiny team adds remarks or raises queries on an application
const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Remark = sequelize.define(
  "Remark",
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
      comment: "The team member who wrote this remark",
    },
    remark_type: {
      type: DataTypes.ENUM("comment", "query", "correction", "approval"),
      defaultValue: "comment",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // If type is 'query', track whether the proponent has responded
    is_resolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "remarks",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Remark;
