// ── Meeting–Application join table ───────────────────────────────────
// Links multiple applications to a single meeting
const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const MeetingApplication = sequelize.define(
  "MeetingApplication",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    meeting_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "meetings", key: "id" },
    },
    application_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "applications", key: "id" },
    },
    agenda_item_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    decision: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Decision recorded against this application in the meeting",
    },
  },
  {
    tableName: "meeting_applications",
    timestamps: true,
    underscored: true,
  }
);

module.exports = MeetingApplication;
