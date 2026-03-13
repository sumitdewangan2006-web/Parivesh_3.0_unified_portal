// ── Documents ────────────────────────────────────────────────────────
// All uploaded files linked to applications, with version tracking
const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Document = sequelize.define(
  "Document",
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
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    file_name: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Size in bytes",
    },
    // ── Categorization ───────────────────────────────────
    document_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "e.g. EIA Report, NOC, Site Map, Gist, MoM",
    },
    tag: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Free-form tag for filtering",
    },
    // ── Versioning ───────────────────────────────────────
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Soft-delete: false means replaced by newer version",
    },
  },
  {
    tableName: "documents",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Document;
