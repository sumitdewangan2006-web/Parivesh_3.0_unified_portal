// ── Model Index & Associations ───────────────────────────────────────
// Central file that imports every model and defines all relationships

const sequelize = require("../config/sequelize");

const Role = require("./Role");
const User = require("./User");
const ApplicationCategory = require("./ApplicationCategory");
const Sector = require("./Sector");
const Application = require("./Application");
const Document = require("./Document");
const Remark = require("./Remark");
const StatusHistory = require("./StatusHistory");
const Payment = require("./Payment");
const Meeting = require("./Meeting");
const MeetingApplication = require("./MeetingApplication");
const GistTemplate = require("./GistTemplate");

// ── Role ↔ User ──────────────────────────────────────────────────────
Role.hasMany(User, { foreignKey: "role_id", as: "users" });
User.belongsTo(Role, { foreignKey: "role_id", as: "role" });

// ── User ↔ Application (applicant) ──────────────────────────────────
User.hasMany(Application, { foreignKey: "applicant_id", as: "applications" });
Application.belongsTo(User, { foreignKey: "applicant_id", as: "applicant" });

// ── User ↔ Application (scrutiny assignment) ────────────────────────
User.hasMany(Application, { foreignKey: "assigned_scrutiny_id", as: "scrutinyApplications" });
Application.belongsTo(User, { foreignKey: "assigned_scrutiny_id", as: "scrutinyOfficer" });

// ── User ↔ Application (MoM assignment) ─────────────────────────────
User.hasMany(Application, { foreignKey: "assigned_mom_id", as: "momApplications" });
Application.belongsTo(User, { foreignKey: "assigned_mom_id", as: "momOfficer" });

// ── Category / Sector ↔ Application ─────────────────────────────────
ApplicationCategory.hasMany(Application, { foreignKey: "category_id", as: "applications" });
Application.belongsTo(ApplicationCategory, { foreignKey: "category_id", as: "category" });

Sector.hasMany(Application, { foreignKey: "sector_id", as: "applications" });
Application.belongsTo(Sector, { foreignKey: "sector_id", as: "sector" });

// ── Application ↔ Documents ─────────────────────────────────────────
Application.hasMany(Document, { foreignKey: "application_id", as: "documents" });
Document.belongsTo(Application, { foreignKey: "application_id", as: "application" });
User.hasMany(Document, { foreignKey: "uploaded_by", as: "uploadedDocuments" });
Document.belongsTo(User, { foreignKey: "uploaded_by", as: "uploader" });

// ── Application ↔ Remarks ───────────────────────────────────────────
Application.hasMany(Remark, { foreignKey: "application_id", as: "remarks" });
Remark.belongsTo(Application, { foreignKey: "application_id", as: "application" });
User.hasMany(Remark, { foreignKey: "user_id", as: "remarks" });
Remark.belongsTo(User, { foreignKey: "user_id", as: "author" });

// ── Application ↔ Status History ────────────────────────────────────
Application.hasMany(StatusHistory, { foreignKey: "application_id", as: "statusHistory" });
StatusHistory.belongsTo(Application, { foreignKey: "application_id", as: "application" });
User.hasMany(StatusHistory, { foreignKey: "changed_by", as: "statusChanges" });
StatusHistory.belongsTo(User, { foreignKey: "changed_by", as: "changedBy" });

// ── Application ↔ Payments ──────────────────────────────────────────
Application.hasMany(Payment, { foreignKey: "application_id", as: "payments" });
Payment.belongsTo(Application, { foreignKey: "application_id", as: "application" });
User.hasMany(Payment, { foreignKey: "user_id", as: "payments" });
Payment.belongsTo(User, { foreignKey: "user_id", as: "payer" });

// ── Meeting ↔ Applications (many-to-many via MeetingApplication) ────
Meeting.belongsToMany(Application, {
  through: MeetingApplication,
  foreignKey: "meeting_id",
  otherKey: "application_id",
  as: "applications",
});
Application.belongsToMany(Meeting, {
  through: MeetingApplication,
  foreignKey: "application_id",
  otherKey: "meeting_id",
  as: "meetings",
});
Meeting.hasMany(MeetingApplication, { foreignKey: "meeting_id", as: "meetingApplications" });
MeetingApplication.belongsTo(Meeting, { foreignKey: "meeting_id", as: "meeting" });
MeetingApplication.belongsTo(Application, { foreignKey: "application_id", as: "application" });

User.hasMany(Meeting, { foreignKey: "created_by", as: "createdMeetings" });
Meeting.belongsTo(User, { foreignKey: "created_by", as: "creator" });

// ── GistTemplate ↔ Category / Sector ────────────────────────────────
ApplicationCategory.hasMany(GistTemplate, { foreignKey: "category_id", as: "gistTemplates" });
GistTemplate.belongsTo(ApplicationCategory, { foreignKey: "category_id", as: "category" });
Sector.hasMany(GistTemplate, { foreignKey: "sector_id", as: "gistTemplates" });
GistTemplate.belongsTo(Sector, { foreignKey: "sector_id", as: "sector" });
User.hasMany(GistTemplate, { foreignKey: "uploaded_by", as: "gistTemplates" });
GistTemplate.belongsTo(User, { foreignKey: "uploaded_by", as: "uploader" });

module.exports = {
  sequelize,
  Role,
  User,
  ApplicationCategory,
  Sector,
  Application,
  Document,
  Remark,
  StatusHistory,
  Payment,
  Meeting,
  MeetingApplication,
  GistTemplate,
};
