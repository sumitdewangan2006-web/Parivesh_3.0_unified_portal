const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const SectorDocumentRule = sequelize.define(
  "SectorDocumentRule",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "sectors", key: "id" },
    },
    document_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "sector_document_rules",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["sector_id", "document_key"],
      },
    ],
  }
);

module.exports = SectorDocumentRule;