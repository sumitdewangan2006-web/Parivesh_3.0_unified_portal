// ── Industry Sectors ─────────────────────────────────────────────────
// Mining, Infrastructure, Energy, etc. — configurable by admin
const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Sector = sequelize.define(
  "Sector",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
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
    tableName: "sectors",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Sector;
