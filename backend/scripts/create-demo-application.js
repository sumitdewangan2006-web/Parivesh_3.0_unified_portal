/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const {
  sequelize,
  Role,
  User,
  ApplicationCategory,
  Sector,
  Application,
  Document,
  CitizenObservation,
  Payment,
  StatusHistory,
} = require("../src/models");
const { DOCUMENT_CHECKLISTS, MINERAL_TYPE_LABELS } = require("../src/config/checklistData");
const EnvironmentalRiskService = require("../src/services/environmentalRiskService");

const DOC_CONTENT_HINTS = {
  pre_feasibility_report: ["project", "baseline", "environment", "impact"],
  emp: ["mitigation", "monitoring", "environment", "management plan"],
  form_caf: ["form", "applicant", "project", "location"],
  eia_report: ["impact", "baseline", "mitigation", "public hearing"],
  project_report: ["project", "capacity", "location", "environment"],
  land_documents: ["khasra", "land", "ownership", "survey"],
  all_affidavits: ["affidavit", "undertake", "declare", "compliance"],
  gist_submission: ["gist", "submission", "project"],
};

function formatStamp(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function createPdf(filePath, lines) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const out = fs.createWriteStream(filePath);

    out.on("finish", resolve);
    out.on("error", reject);
    doc.on("error", reject);

    doc.pipe(out);

    doc.fontSize(14).text("PARIVESH Demo Document", { underline: true });
    doc.moveDown(0.8);

    for (const line of lines) {
      doc.fontSize(11).text(line);
      doc.moveDown(0.4);
    }

    doc.end();
  });
}

function buildDocLines({ app, item, index, hints }) {
  const requiredSignals = hints.length
    ? `Expected content markers: ${hints.join(", ")}.`
    : "Expected content markers: project, environment, compliance.";

  return [
    `Demo Document ${index + 1}`,
    `Reference Number: ${app.reference_number}`,
    `Project Name: ${app.project_name}`,
    `Document Type: ${item.key}`,
    `Document Label: ${item.label}`,
    `Mineral Type: ${MINERAL_TYPE_LABELS[app.mineral_type] || app.mineral_type}`,
    "Location: Raipur district, Chhattisgarh.",
    "Baseline environment, impact assessment, mitigation plan, and monitoring framework are included.",
    "Groundwater usage, biodiversity sensitivity, pollution control, and wildlife safeguards are described.",
    requiredSignals,
    "This file is generated for hackathon demonstration of summarizer and document checker.",
  ];
}

async function findUserByRole(roleName, fallbackEmail) {
  const user = await User.findOne({
    include: [{ model: Role, as: "role", where: { name: roleName }, attributes: ["id", "name"] }],
    order: [["created_at", "ASC"]],
  });

  if (user) return user;

  if (fallbackEmail) {
    return User.findOne({
      where: { email: fallbackEmail },
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    });
  }

  return null;
}

async function main() {
  const mineralType = process.env.DEMO_MINERAL_TYPE || "limestone";
  const checklist = DOCUMENT_CHECKLISTS[mineralType] || [];

  if (!checklist.length) {
    throw new Error(`No checklist found for mineral type: ${mineralType}`);
  }

  await sequelize.authenticate();

  const applicant = await findUserByRole("project_proponent", "proponent@parivesh.gov.in");
  const scrutinyOfficer = await findUserByRole("scrutiny_team", "scrutiny@parivesh.gov.in");

  if (!applicant) throw new Error("No project_proponent user found in database");
  if (!scrutinyOfficer) throw new Error("No scrutiny_team user found in database");

  const category =
    (await ApplicationCategory.findOne({ where: { code: "B1" } })) ||
    (await ApplicationCategory.findOne({ order: [["id", "ASC"]] }));
  const sector =
    (await Sector.findOne({ where: { name: "Mining" } })) ||
    (await Sector.findOne({ order: [["id", "ASC"]] }));

  if (!category) throw new Error("No application category found");
  if (!sector) throw new Error("No sector found");

  const now = new Date();
  const stamp = formatStamp(now);

  const referenceNumber = `EC-DEMO-${stamp}`;

  const app = await Application.create({
    reference_number: referenceNumber,
    applicant_id: applicant.id,
    category_id: category.id,
    sector_id: sector.id,
    mineral_type: mineralType,
    project_name: `Hackathon Demo Application (${MINERAL_TYPE_LABELS[mineralType] || mineralType})`,
    project_description:
      "Demo-ready environmental clearance proposal generated for presentation. Includes rich document set for summarizer and checker verification.",
    project_location: "Demo Site, Near Raipur, Chhattisgarh",
    project_state: "Chhattisgarh",
    project_district: "Raipur",
    khasra_no: "123/1, 123/2, 124/1",
    lease_area: 22.5,
    project_area: 36.75,
    estimated_cost: 6200000000,
    current_step: 5,
    status: "under_scrutiny",
    assigned_scrutiny_id: scrutinyOfficer.id,
    submitted_at: now,
  });

  const uploadRoot = process.env.UPLOAD_DIR
    ? path.isAbsolute(process.env.UPLOAD_DIR)
      ? process.env.UPLOAD_DIR
      : path.resolve(__dirname, "..", process.env.UPLOAD_DIR)
    : path.resolve(__dirname, "../uploads");

  const demoDir = path.resolve(uploadRoot, "demo");
  fs.mkdirSync(demoDir, { recursive: true });

  for (let i = 0; i < checklist.length; i += 1) {
    const item = checklist[i];
    const hints = DOC_CONTENT_HINTS[item.key] || [];
    const tagText = hints.length ? hints.join(" ") : "project environment compliance";

    const safeKey = String(item.key || "document").replace(/[^a-z0-9_-]/gi, "_");
    const fileName = `${app.id}-${String(i + 1).padStart(2, "0")}-${safeKey}.pdf`;
    const absoluteFilePath = path.resolve(demoDir, fileName);

    const lines = buildDocLines({ app, item, index: i, hints });
    await createPdf(absoluteFilePath, lines);

    const fileStat = fs.statSync(absoluteFilePath);

    await Document.create({
      application_id: app.id,
      uploaded_by: applicant.id,
      file_name: fileName,
      original_name: `${safeKey}.pdf`,
      file_path: absoluteFilePath,
      mime_type: "application/pdf",
      file_size: fileStat.size,
      document_type: item.key,
      tag: tagText,
      version: 1,
      is_active: true,
    });
  }

  await Payment.create({
    application_id: app.id,
    user_id: applicant.id,
    amount: 125000,
    currency: "INR",
    payment_method: "mock",
    transaction_id: `DEMO-TXN-${stamp}`,
    status: "completed",
    paid_at: now,
  });

  await StatusHistory.bulkCreate([
    {
      application_id: app.id,
      changed_by: applicant.id,
      from_status: "draft",
      to_status: "submitted",
      remarks: "Demo script: auto-submitted with all checklist documents uploaded",
      created_at: new Date(now.getTime() - 15 * 60 * 1000),
    },
    {
      application_id: app.id,
      changed_by: scrutinyOfficer.id,
      from_status: "submitted",
      to_status: "under_scrutiny",
      remarks: "Demo script: moved to scrutiny for hackathon walkthrough",
      created_at: new Date(now.getTime() - 5 * 60 * 1000),
    },
  ]);

  await CitizenObservation.bulkCreate([
    {
      application_id: app.id,
      citizen_name: "Village Environment Committee",
      contact_email: "vec.demo@example.com",
      observation_text:
        "Community has observed seasonal migratory birds and wetland vegetation near the proposed project zone. Local biodiversity mapping should be included in clearance conditions.",
      biodiversity_tags: "wetland,migratory birds,community biodiversity",
      latitude: 21.2514,
      longitude: 81.6296,
      source: "citizen_audit",
      status: "published",
      submitted_ip: "127.0.0.1",
      submitted_user_agent: "demo-seed-script",
    },
    {
      application_id: app.id,
      citizen_name: "Local Fisherfolk Association",
      contact_email: "fisherfolk.demo@example.com",
      observation_text:
        "Riverbank nesting patches and fish breeding zones exist downstream of the project location. Monitoring and mitigation commitments should include these habitats.",
      biodiversity_tags: "river ecosystem,fish breeding,riverbank nesting",
      latitude: 21.2578,
      longitude: 81.6212,
      source: "citizen_audit",
      status: "published",
      submitted_ip: "127.0.0.1",
      submitted_user_agent: "demo-seed-script",
    },
  ]);

  let riskScoreInfo = "Risk analyzer run skipped";
  try {
    const risk = await EnvironmentalRiskService.analyzeApplication(app.id);
    riskScoreInfo = `${risk.risk_score}/100 (${risk.risk_level})`;
  } catch (err) {
    riskScoreInfo = `Risk analyzer failed: ${err.message}`;
  }

  console.log("\n=== Demo Application Created Successfully ===");
  console.log(`Application ID: ${app.id}`);
  console.log(`Reference Number: ${app.reference_number}`);
  console.log(`Status: ${app.status}`);
  console.log(`Mineral Type: ${app.mineral_type}`);
  console.log(`Documents Uploaded: ${checklist.length}`);
  console.log("Citizen Observations Added: 2");
  console.log(`Risk Analysis Snapshot: ${riskScoreInfo}`);
  console.log("\nUse these demo users:");
  console.log(`- Proponent: ${applicant.email}`);
  console.log(`- Scrutiny:  ${scrutinyOfficer.email}`);
  console.log("- Password:  Admin@123 (or your seeded password)");
  console.log("===========================================\n");
}

main()
  .catch((err) => {
    console.error("Failed to create demo application:", err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await sequelize.close();
    } catch {
      // ignore close error
    }
  });
