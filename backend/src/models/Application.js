// ── EC Applications ──────────────────────────────────────────────────
// Core table: each row is one Environmental Clearance application
const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Application = sequelize.define(
  "Application",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reference_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "Auto-generated unique reference, e.g. EC-2026-00001",
    },
    // ── Applicant ────────────────────────────────────────
    applicant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    // ── Category & Sector ────────────────────────────────
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "application_categories", key: "id" },
    },
    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "sectors", key: "id" },
    },
    // ── Project Details ──────────────────────────────────
    // ── Mineral / Project Sub-Type ───────────────────────
    mineral_type: {
      type: DataTypes.ENUM(
        "sand",
        "limestone",
        "bricks",
        "stones",
        "infrastructure",
        "industry",
        "others"
      ),
      allowNull: true,
      comment: "Mineral or project sub-type used to determine required document checklist",
    },
    // ── Project Details ──────────────────────────────────
    project_name: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    project_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    project_location: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    project_state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    project_district: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    khasra_no: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Khasra number(s) for the applied land parcel",
    },
    estimated_cost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Estimated project cost in INR",
    },
    lease_area: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true,
      comment: "Lease area in hectares",
    },
    project_area: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true,
      comment: "Area in hectares",
    },
    // ── Multi-step wizard progress ───────────────────────
    current_step: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: "Which step of the wizard the applicant is on (1-5)",
    },
    // ── Workflow Status ──────────────────────────────────
    status: {
      type: DataTypes.ENUM(
        "draft",
        "submitted",
        "under_scrutiny",
        "essential_document_sought",
        "referred",
        "mom_generated",
        "finalized"
      ),
      defaultValue: "draft",
    },
    // ── Assignment ───────────────────────────────────────
    assigned_scrutiny_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      comment: "Scrutiny team member assigned to this application",
    },
    assigned_mom_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      comment: "MoM team member assigned to this application",
    },
    // ── Dates ────────────────────────────────────────────
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "applications",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Application;
