// ── Gist Templates ───────────────────────────────────────────────────
// Admin-managed templates used by scrutiny team to generate gist docs
const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const GistTemplate = sequelize.define(
  "GistTemplate",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    // Template can be linked to a specific category/sector or be generic
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "application_categories", key: "id" },
    },
    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "sectors", key: "id" },
    },
    // The template content (HTML / Markdown)
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "gist_templates",
    timestamps: true,
    underscored: true,
  }
);

module.exports = GistTemplate;
