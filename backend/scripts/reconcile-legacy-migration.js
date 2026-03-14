const { Sequelize, QueryTypes } = require("sequelize");
const databaseConfig = require("../src/config/database");

const env = process.env.NODE_ENV === "production" ? "production" : "development";
const config = databaseConfig[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const INITIAL_MIGRATION = "20260306000001-create-full-schema.js";
const legacyCoreTables = [
  "roles",
  "users",
  "application_categories",
  "sectors",
  "applications",
  "documents",
  "remarks",
  "status_history",
  "payments",
  "meetings",
  "meeting_applications",
  "gist_templates",
];

async function listPublicTables() {
  const rows = await sequelize.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'`,
    { type: QueryTypes.SELECT }
  );

  return new Set(rows.map((row) => row.table_name));
}

async function hasMigrationRecord(name) {
  const rows = await sequelize.query(
    'SELECT name FROM "SequelizeMeta" WHERE name = :name',
    {
      replacements: { name },
      type: QueryTypes.SELECT,
    }
  );

  return rows.length > 0;
}

async function main() {
  try {
    const tables = await listPublicTables();

    if (!tables.has("SequelizeMeta")) {
      console.log("SequelizeMeta table not present yet. Fresh database detected.");
      return;
    }

    const looksLikeLegacyBootstrappedSchema = legacyCoreTables.every((tableName) => tables.has(tableName));
    if (!looksLikeLegacyBootstrappedSchema) {
      console.log("Legacy schema reconciliation not needed.");
      return;
    }

    if (await hasMigrationRecord(INITIAL_MIGRATION)) {
      console.log("Initial schema migration already recorded.");
      return;
    }

    await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (:name)', {
      replacements: { name: INITIAL_MIGRATION },
      type: QueryTypes.INSERT,
    });

    console.log(`Recorded legacy schema as applied migration: ${INITIAL_MIGRATION}`);
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error("Failed to reconcile legacy migration metadata:", error?.message || error);
  process.exit(1);
});