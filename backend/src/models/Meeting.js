// ── Meeting (MoM) ────────────────────────────────────────────────────
// Each meeting produces a Minutes of Meeting document
const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Meeting = sequelize.define(
  "Meeting",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    meeting_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    venue: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    // The MoM team member who created this meeting
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    agenda: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Meeting agenda text / HTML",
    },
    minutes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Final minutes of the meeting content",
    },
    status: {
      type: DataTypes.ENUM("draft", "finalized", "published"),
      defaultValue: "draft",
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "True once meeting minutes are finalized/published and should not be editable",
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "meetings",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Meeting;
