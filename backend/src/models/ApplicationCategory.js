// ── Application Categories ───────────────────────────────────────────
// A, B1, B2 — configurable by admin
const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const ApplicationCategory = sequelize.define(
  "ApplicationCategory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      comment: "A, B1, B2",
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "application_categories",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ApplicationCategory;
