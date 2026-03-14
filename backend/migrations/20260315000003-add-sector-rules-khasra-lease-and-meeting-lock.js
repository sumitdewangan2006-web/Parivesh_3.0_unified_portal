"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const applications = await queryInterface.describeTable("applications");
    const meetings = await queryInterface.describeTable("meetings");

    if (!applications.khasra_no) {
      await queryInterface.addColumn("applications", "khasra_no", {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Khasra number(s) for the applied land parcel",
      });
    }

    if (!applications.lease_area) {
      await queryInterface.addColumn("applications", "lease_area", {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true,
        comment: "Lease area in hectares",
      });
    }

    if (!meetings.is_locked) {
      await queryInterface.addColumn("meetings", "is_locked", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "True once MoM is finalized/published and editing should be blocked",
      });
    }

    const allTables = await queryInterface.showAllTables();
    const tableNames = allTables.map((table) => (typeof table === "string" ? table : table.tableName));

    if (!tableNames.includes("sector_document_rules")) {
      await queryInterface.createTable("sector_document_rules", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        sector_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "sectors", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        document_key: { type: Sequelize.STRING(100), allowNull: false },
        is_required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: "users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
        updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      });

      await queryInterface.addIndex("sector_document_rules", ["sector_id", "document_key"], {
        unique: true,
        name: "sector_document_rules_sector_document_key_unique",
      });
      await queryInterface.addIndex("sector_document_rules", ["sector_id"], {
        name: "sector_document_rules_sector_idx",
      });
    }
  },

  async down(queryInterface) {
    const applications = await queryInterface.describeTable("applications");
    const meetings = await queryInterface.describeTable("meetings");

    if (applications.lease_area) {
      await queryInterface.removeColumn("applications", "lease_area");
    }

    if (applications.khasra_no) {
      await queryInterface.removeColumn("applications", "khasra_no");
    }

    if (meetings.is_locked) {
      await queryInterface.removeColumn("meetings", "is_locked");
    }

    const allTables = await queryInterface.showAllTables();
    const tableNames = allTables.map((table) => (typeof table === "string" ? table : table.tableName));
    if (tableNames.includes("sector_document_rules")) {
      await queryInterface.dropTable("sector_document_rules");
    }
  },
};