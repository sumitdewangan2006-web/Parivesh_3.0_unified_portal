"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("applications");

    if (!table.mineral_type) {
      await queryInterface.addColumn("applications", "mineral_type", {
        type: Sequelize.ENUM(
          "sand",
          "limestone",
          "bricks",
          "stones",
          "infrastructure",
          "industry",
          "others"
        ),
        allowNull: true,
        comment: "Mineral or project sub-type for document checklist selection",
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("applications");

    if (table.mineral_type) {
      await queryInterface.removeColumn("applications", "mineral_type");
      // Clean up enum type in Postgres if it exists.
      await queryInterface.sequelize.query(
        "DROP TYPE IF EXISTS \"enum_applications_mineral_type\";"
      );
    }
  },
};
