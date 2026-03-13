const path = require("path");
const dbConfig = require("./database");

// Resolve upload directory from env or default
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, "../../uploads");

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,

  // Database config for current environment
  db: dbConfig[process.env.NODE_ENV || "development"],

  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET || "dev_secret_change_me",
    expiry: process.env.JWT_EXPIRY || "24h",
  },

  // File upload settings
  upload: {
    dir: uploadDir,
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50,
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ],
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
};

module.exports = config;
