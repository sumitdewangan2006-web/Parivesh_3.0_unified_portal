const { Sequelize } = require("sequelize");
const databaseConfig = require("../src/config/database");

const env = process.env.NODE_ENV === "production" ? "production" : "development";
const config = databaseConfig[env];

const maxAttempts = Number(process.env.DB_WAIT_MAX_ATTEMPTS || 30);
const delayMs = Number(process.env.DB_WAIT_DELAY_MS || 2000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const sequelize = new Sequelize(config.database, config.username, config.password, config);

    try {
      await sequelize.authenticate();
      await sequelize.close();
      console.log(`Database is ready after ${attempt} attempt(s)`);
      return;
    } catch (error) {
      await sequelize.close().catch(() => {});

      const message = error?.message || String(error);
      console.log(`Waiting for database (${attempt}/${maxAttempts}): ${message}`);

      if (attempt === maxAttempts) {
        throw error;
      }

      await sleep(delayMs);
    }
  }
}

main().catch((error) => {
  console.error("Database did not become ready:", error?.message || error);
  process.exit(1);
});
