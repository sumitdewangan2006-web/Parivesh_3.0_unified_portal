// ── Roles Table ──────────────────────────────────────────────────────
// Static lookup: admin, project_proponent, scrutiny_team, mom_team
const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "admin | project_proponent | scrutiny_team | mom_team",
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "roles",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Role;
