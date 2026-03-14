const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const CitizenObservation = sequelize.define(
  "CitizenObservation",
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
    citizen_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      defaultValue: "Anonymous Citizen",
    },
    contact_email: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    contact_phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    observation_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    biodiversity_tags: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    photo_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    photo_original_name: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    photo_mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    photo_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "citizen_audit",
    },
    status: {
      type: DataTypes.ENUM("published", "flagged", "removed"),
      allowNull: false,
      defaultValue: "published",
    },
    submitted_ip: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    submitted_user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: "citizen_observations",
    timestamps: true,
    underscored: true,
  }
);

module.exports = CitizenObservation;
