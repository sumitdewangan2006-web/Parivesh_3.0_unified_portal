require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const config = require("./config");
const { sequelize, Role, User, ApplicationCategory, Sector, GistTemplate } = require("./models");
const logger = require("./utils/logger");
const bcrypt = require("bcryptjs");

const app = express();
const shouldAutoSync = String(process.env.AUTO_SYNC || "false").toLowerCase() === "true";
const shouldSeedDemoData = String(process.env.SEED_DEMO_DATA || "false").toLowerCase() === "true";

// ── Security Middleware ──────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "frame-ancestors": ["'self'", "http://localhost:3000"],
      },
    },
    frameguard: false, // Managed via CSP frame-ancestors instead
  })
);
app.use(
  cors({
    // Reflect any requesting origin so the app works from phones on LAN IPs
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);

// Rate limiting — 500 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// ── Body Parsing ─────────────────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ── Ensure upload directory exists ───────────────────────────────────
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

// ── API Routes ───────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/scrutiny", require("./routes/scrutiny"));
app.use("/api/meetings", require("./routes/meetings"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/config", require("./routes/config"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/workflow", require("./routes/workflow"));
app.use("/api/citizen-audit", require("./routes/citizenAudit"));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 Handler ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global Error Handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });
  const status = err.status || 500;
  res.status(status).json({
    error:
      config.env === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ── Seed default data if tables are empty ────────────────────────────
async function seedDefaults() {
  const roleCount = await Role.count();
  if (roleCount > 0) return; // already seeded

  logger.info("Seeding default data...");

  await Role.bulkCreate([
    { id: 1, name: "admin", description: "System administrator" },
    { id: 2, name: "project_proponent", description: "Project Proponent / RQP" },
    { id: 3, name: "scrutiny_team", description: "Scrutiny and review team member" },
    { id: 4, name: "mom_team", description: "Minutes of Meeting preparation team" },
  ]);

  const hash = await bcrypt.hash("Test@123", 12);
  await User.bulkCreate([
    { name: "System Admin",      email: "admin@parivesh.gov.in",      password_hash: hash, phone: "9999999999", organization: "MoEFCC",              role_id: 1, is_active: true },
    { name: "Rajesh Kumar",      email: "proponent@parivesh.gov.in",  password_hash: hash, phone: "9876543210", organization: "GreenTech Pvt Ltd",   role_id: 2, is_active: true },
    { name: "Priya Sharma",      email: "scrutiny@parivesh.gov.in",   password_hash: hash, phone: "9876543211", organization: "MoEFCC - Scrutiny",   role_id: 3, is_active: true },
    { name: "Amit Verma",        email: "mom@parivesh.gov.in",        password_hash: hash, phone: "9876543212", organization: "MoEFCC - EAC",        role_id: 4, is_active: true },
  ]);

  await ApplicationCategory.bulkCreate([
    { id: 1, code: "A", name: "Category A", description: "Projects appraised at Central level by EAC", is_active: true },
    { id: 2, code: "B1", name: "Category B1", description: "Projects appraised at State level requiring EIA", is_active: true },
    { id: 3, code: "B2", name: "Category B2", description: "Projects appraised at State level without EIA", is_active: true },
  ]);

  await Sector.bulkCreate([
    { id: 1, name: "Mining", description: "Mining and mineral extraction projects", is_active: true },
    { id: 2, name: "Infrastructure", description: "Roads, bridges, airports, ports", is_active: true },
    { id: 3, name: "Energy", description: "Thermal, solar, wind, and hydro power", is_active: true },
    { id: 4, name: "Industrial Projects", description: "Manufacturing and industrial complexes", is_active: true },
    { id: 5, name: "Construction & Township", description: "Real estate and township development", is_active: true },
    { id: 6, name: "River Valley & Hydroelectric", description: "Dams, irrigation, and hydroelectric projects", is_active: true },
    { id: 7, name: "Nuclear", description: "Nuclear power and related facilities", is_active: true },
    { id: 8, name: "Waste Management", description: "Solid waste, hazardous waste, e-waste", is_active: true },
    { id: 9, name: "Coastal Regulation Zone (CRZ)", description: "Projects in CRZ areas", is_active: true },
    { id: 10, name: "Defence & Strategic", description: "Defence and nationally strategic projects", is_active: true },
  ]);

  logger.info("Default data seeded successfully.");
}

// ── Start Server ─────────────────────────────────────────────────────
async function start() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info("Database connection established successfully.");

    if (shouldAutoSync) {
      logger.info("AUTO_SYNC enabled. Applying model sync for demo/local startup.");

      // Ensure all enum values exist for PostgreSQL when using demo auto-sync.
      try {
        const enumValues = [
          "draft", "submitted", "under_scrutiny",
          "essential_document_sought", "referred", "mom_generated",
          "finalized",
        ];
        for (const val of enumValues) {
          await sequelize.query(`ALTER TYPE "enum_applications_status" ADD VALUE IF NOT EXISTS '${val}'`);
        }
      } catch (e) {
        // Ignore if enum type doesn't exist yet (first run) or values already exist.
        logger.info("Enum migration note: " + e.message);
      }

      await sequelize.sync();
      logger.info("Database models synced.");
    } else {
      logger.info("AUTO_SYNC disabled. Expecting database migrations to be run before startup.");
    }

    if (shouldSeedDemoData) {
      logger.info("SEED_DEMO_DATA enabled. Seeding demo defaults if database is empty.");
      await seedDefaults();
    } else {
      logger.info("SEED_DEMO_DATA disabled. Skipping automatic demo seeding.");
    }

    app.listen(config.port, () => {
      logger.info(
        `PARIVESH 3.0 API running on port ${config.port} [${config.env}]`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

module.exports = app;
