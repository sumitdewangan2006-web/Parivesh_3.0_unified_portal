const { Sequelize } = require("sequelize");
const config = require("./index");
const logger = require("../utils/logger");

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: "postgres",
    logging: config.env === "development" ? (msg) => logger.debug(msg) : false,
    pool: config.db.pool || {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
