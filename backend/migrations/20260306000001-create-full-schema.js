"use strict";

// ── Full Schema Migration ────────────────────────────────────────────
// Creates all tables for the PARIVESH 3.0 portal in the correct order
// respecting foreign key dependencies.

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── 1. Roles ─────────────────────────────────────────
    await queryInterface.createTable("roles", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      description: { type: Sequelize.STRING(255) },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── 2. Users ─────────────────────────────────────────
    await queryInterface.createTable("users", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(15) },
      organization: { type: Sequelize.STRING(255) },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "roles", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── 3. Application Categories ────────────────────────
    await queryInterface.createTable("application_categories", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: Sequelize.STRING(10), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── 4. Sectors ───────────────────────────────────────
    await queryInterface.createTable("sectors", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── 4.1 Sector Document Rules ──────────────────────
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
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── 5. Applications ──────────────────────────────────
    await queryInterface.createTable("applications", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      reference_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      applicant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "application_categories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      sector_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "sectors", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      project_name: { type: Sequelize.STRING(300), allowNull: false },
      project_description: { type: Sequelize.TEXT },
      project_location: { type: Sequelize.STRING(500) },
      project_state: { type: Sequelize.STRING(100) },
      project_district: { type: Sequelize.STRING(100) },
      khasra_no: { type: Sequelize.STRING(255) },
      estimated_cost: { type: Sequelize.DECIMAL(15, 2) },
      lease_area: { type: Sequelize.DECIMAL(12, 4) },
      project_area: { type: Sequelize.DECIMAL(12, 4) },
      current_step: { type: Sequelize.INTEGER, defaultValue: 1 },
      mineral_type: {
        type: Sequelize.ENUM("sand", "limestone", "bricks", "stones", "infrastructure", "industry", "others"),
        allowNull: true,
        comment: "Mineral or project sub-type for document checklist selection",
      },
      status: {
        type: Sequelize.ENUM(
          "draft",
          "submitted",
          "under_scrutiny",
          "essential_document_sought",
          "referred",
          "mom_generated",
          "finalized"
        ),
        defaultValue: "draft",
      },
      assigned_scrutiny_id: {
        type: Sequelize.UUID,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      assigned_mom_id: {
        type: Sequelize.UUID,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      submitted_at: { type: Sequelize.DATE },
      approved_at: { type: Sequelize.DATE },
      published_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── 6. Documents ─────────────────────────────────────
    await queryInterface.createTable("documents", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "applications", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      file_name: { type: Sequelize.STRING(300), allowNull: false },
      original_name: { type: Sequelize.STRING(300), allowNull: false },
      file_path: { type: Sequelize.STRING(500), allowNull: false },
      mime_type: { type: Sequelize.STRING(100), allowNull: false },
      file_size: { type: Sequelize.INTEGER, allowNull: false },
      document_type: { type: Sequelize.STRING(100) },
      tag: { type: Sequelize.STRING(100) },
      version: { type: Sequelize.INTEGER, defaultValue: 1 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── 7. Remarks ───────────────────────────────────────
    await queryInterface.createTable("remarks", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "applications", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      remark_type: {
        type: Sequelize.ENUM("comment", "query", "correction", "approval"),
        defaultValue: "comment",
      },
      content: { type: Sequelize.TEXT, allowNull: false },
      is_resolved: { type: Sequelize.BOOLEAN, defaultValue: false },
      resolved_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── 8. Status History ────────────────────────────────
    await queryInterface.createTable("status_history", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "applications", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      changed_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      from_status: { type: Sequelize.STRING(50) },
      to_status: { type: Sequelize.STRING(50), allowNull: false },
      remarks: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── 9. Payments ──────────────────────────────────────
    await queryInterface.createTable("payments", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "applications", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), defaultValue: "INR" },
      payment_method: {
        type: Sequelize.ENUM("upi", "qr_code", "net_banking", "mock"),
        defaultValue: "mock",
      },
      transaction_id: { type: Sequelize.STRING(100), unique: true },
      status: {
        type: Sequelize.ENUM("pending", "completed", "failed", "refunded"),
        defaultValue: "pending",
      },
      paid_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── 10. Meetings ─────────────────────────────────────
    await queryInterface.createTable("meetings", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      title: { type: Sequelize.STRING(300), allowNull: false },
      meeting_date: { type: Sequelize.DATEONLY, allowNull: false },
      venue: { type: Sequelize.STRING(300) },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      agenda: { type: Sequelize.TEXT },
      minutes: { type: Sequelize.TEXT },
      status: {
        type: Sequelize.ENUM("draft", "finalized", "published"),
        defaultValue: "draft",
      },
      is_locked: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      published_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── 11. Meeting–Application join ─────────────────────
    await queryInterface.createTable("meeting_applications", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      meeting_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "meetings", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "applications", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      agenda_item_number: { type: Sequelize.INTEGER },
      decision: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── 12. Gist Templates ──────────────────────────────
    await queryInterface.createTable("gist_templates", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(200), allowNull: false },
      category_id: {
        type: Sequelize.INTEGER,
        references: { model: "application_categories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      sector_id: {
        type: Sequelize.INTEGER,
        references: { model: "sectors", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      content: { type: Sequelize.TEXT, allowNull: false },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // ── Indexes ──────────────────────────────────────────
    await queryInterface.addIndex("applications", ["status"]);
    await queryInterface.addIndex("applications", ["applicant_id"]);
    await queryInterface.addIndex("applications", ["assigned_scrutiny_id"]);
    await queryInterface.addIndex("applications", ["assigned_mom_id"]);
    await queryInterface.addIndex("sector_document_rules", ["sector_id"]);
    await queryInterface.addIndex("sector_document_rules", ["sector_id", "document_key"], {
      unique: true,
      name: "sector_document_rules_sector_document_key_unique",
    });
    await queryInterface.addIndex("documents", ["application_id"]);
    await queryInterface.addIndex("remarks", ["application_id"]);
    await queryInterface.addIndex("status_history", ["application_id"]);
    await queryInterface.addIndex("payments", ["application_id"]);
  },

  async down(queryInterface) {
    // Drop in reverse dependency order
    await queryInterface.dropTable("gist_templates");
    await queryInterface.dropTable("meeting_applications");
    await queryInterface.dropTable("meetings");
    await queryInterface.dropTable("payments");
    await queryInterface.dropTable("status_history");
    await queryInterface.dropTable("remarks");
    await queryInterface.dropTable("documents");
    await queryInterface.dropTable("applications");
    await queryInterface.dropTable("sector_document_rules");
    await queryInterface.dropTable("sectors");
    await queryInterface.dropTable("application_categories");
    await queryInterface.dropTable("users");
    await queryInterface.dropTable("roles");
  },
};
