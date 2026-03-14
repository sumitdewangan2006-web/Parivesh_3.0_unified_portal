"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const allTables = await queryInterface.showAllTables();
    const tableNames = allTables.map((table) => (typeof table === "string" ? table : table.tableName));

    if (tableNames.includes("citizen_observations")) {
      return;
    }

    await queryInterface.createTable("citizen_observations", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "applications", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      citizen_name: { type: Sequelize.STRING(150), allowNull: false, defaultValue: "Anonymous Citizen" },
      contact_email: { type: Sequelize.STRING(150), allowNull: true },
      contact_phone: { type: Sequelize.STRING(30), allowNull: true },
      observation_text: { type: Sequelize.TEXT, allowNull: false },
      biodiversity_tags: { type: Sequelize.STRING(300), allowNull: true },
      latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      photo_path: { type: Sequelize.STRING(500), allowNull: true },
      photo_original_name: { type: Sequelize.STRING(300), allowNull: true },
      photo_mime_type: { type: Sequelize.STRING(100), allowNull: true },
      photo_size: { type: Sequelize.INTEGER, allowNull: true },
      source: { type: Sequelize.STRING(50), allowNull: false, defaultValue: "citizen_audit" },
      status: {
        type: Sequelize.ENUM("published", "flagged", "removed"),
        allowNull: false,
        defaultValue: "published",
      },
      submitted_ip: { type: Sequelize.STRING(64), allowNull: true },
      submitted_user_agent: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.addIndex("citizen_observations", ["application_id"], {
      name: "citizen_observations_application_idx",
    });
    await queryInterface.addIndex("citizen_observations", ["status"], {
      name: "citizen_observations_status_idx",
    });
    await queryInterface.addIndex("citizen_observations", ["created_at"], {
      name: "citizen_observations_created_idx",
    });
  },

  async down(queryInterface) {
    const allTables = await queryInterface.showAllTables();
    const tableNames = allTables.map((table) => (typeof table === "string" ? table : table.tableName));

    if (tableNames.includes("citizen_observations")) {
      await queryInterface.dropTable("citizen_observations");
    }

    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS \"enum_citizen_observations_status\";"
    );
  },
};
