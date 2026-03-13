"use strict";
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

// ── Seed Data ────────────────────────────────────────────────────────
// Populates roles, categories, sectors, gist templates, and demo users

const ADMIN_ID = uuidv4();
const PROPONENT_ID = uuidv4();
const SCRUTINY_ID = uuidv4();
const MOM_ID = uuidv4();

module.exports = {
  async up(queryInterface) {
    // ── Roles ────────────────────────────────────────────
    await queryInterface.bulkInsert("roles", [
      { id: 1, name: "admin",              description: "System administrator",                  created_at: new Date(), updated_at: new Date() },
      { id: 2, name: "project_proponent",  description: "Project Proponent / RQP",               created_at: new Date(), updated_at: new Date() },
      { id: 3, name: "scrutiny_team",      description: "Scrutiny and review team member",        created_at: new Date(), updated_at: new Date() },
      { id: 4, name: "mom_team",           description: "Minutes of Meeting preparation team",    created_at: new Date(), updated_at: new Date() },
    ]);

    // ── Demo Users ───────────────────────────────────────
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash("Admin@123", salt);

    await queryInterface.bulkInsert("users", [
      {
        id: ADMIN_ID,
        name: "System Admin",
        email: "admin@parivesh.gov.in",
        password_hash: hash,
        phone: "9999999999",
        organization: "MoEFCC",
        role_id: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: PROPONENT_ID,
        name: "Demo Proponent",
        email: "proponent@parivesh.gov.in",
        password_hash: hash,
        phone: "9999999998",
        organization: "Green Infra Pvt Ltd",
        role_id: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: SCRUTINY_ID,
        name: "Demo Scrutiny Officer",
        email: "scrutiny@parivesh.gov.in",
        password_hash: hash,
        phone: "9999999997",
        organization: "MoEFCC Scrutiny Cell",
        role_id: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: MOM_ID,
        name: "Demo MoM Officer",
        email: "mom@parivesh.gov.in",
        password_hash: hash,
        phone: "9999999996",
        organization: "MoEFCC MoM Cell",
        role_id: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // ── Application Categories ───────────────────────────
    await queryInterface.bulkInsert("application_categories", [
      { id: 1, code: "A",  name: "Category A",  description: "Projects appraised at Central level by EAC",      is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 2, code: "B1", name: "Category B1", description: "Projects appraised at State level requiring EIA", is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 3, code: "B2", name: "Category B2", description: "Projects appraised at State level without EIA",   is_active: true, created_at: new Date(), updated_at: new Date() },
    ]);

    // ── Industry Sectors ─────────────────────────────────
    await queryInterface.bulkInsert("sectors", [
      { id: 1,  name: "Mining",                         description: "Mining and mineral extraction projects",        is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 2,  name: "Infrastructure",                 description: "Roads, bridges, airports, ports",               is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 3,  name: "Energy",                         description: "Thermal, solar, wind, and hydro power",         is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 4,  name: "Industrial Projects",            description: "Manufacturing and industrial complexes",        is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 5,  name: "Construction & Township",        description: "Real estate and township development",          is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 6,  name: "River Valley & Hydroelectric",   description: "Dams, irrigation, and hydroelectric projects",  is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 7,  name: "Nuclear",                        description: "Nuclear power and related facilities",          is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 8,  name: "Waste Management",               description: "Solid waste, hazardous waste, e-waste",         is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 9,  name: "Coastal Regulation Zone (CRZ)",  description: "Projects in CRZ areas",                         is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 10, name: "Defence & Strategic",             description: "Defence and nationally strategic projects",     is_active: true, created_at: new Date(), updated_at: new Date() },
    ]);

    // ── Gist Templates ───────────────────────────────────
    await queryInterface.bulkInsert("gist_templates", [
      {
        id: 1,
        name: "General EAC Meeting Gist",
        category_id: null,
        sector_id: null,
        content: `<h1>Meeting Gist — Environmental Clearance Application</h1>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
<tr><th>Reference No.</th><td>{{reference_number}}</td></tr>
<tr><th>Project Name</th><td>{{project_name}}</td></tr>
<tr><th>Category</th><td>{{category_name}} ({{category_code}})</td></tr>
<tr><th>Sector</th><td>{{sector_name}}</td></tr>
<tr><th>Applicant</th><td>{{applicant_name}} — {{applicant_organization}}</td></tr>
<tr><th>Contact</th><td>{{applicant_email}}</td></tr>
<tr><th>Location</th><td>{{project_location}}, {{project_district}}, {{project_state}}</td></tr>
<tr><th>Estimated Cost (INR)</th><td>{{estimated_cost}}</td></tr>
<tr><th>Project Area</th><td>{{project_area}}</td></tr>
<tr><th>Date Referred</th><td>{{date}}</td></tr>
</table>
<h2>Project Description</h2>
<p>{{project_description}}</p>
<h2>Scrutiny Observations</h2>
<p><em>(To be filled by the committee during the EAC meeting)</em></p>
<h2>Recommendation</h2>
<p><em>(To be filled after discussion)</em></p>`,
        uploaded_by: ADMIN_ID,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: "Category A — Detailed Gist",
        category_id: 1,
        sector_id: null,
        content: `<h1>EAC Meeting Gist — Category A Project</h1>
<h2>Project Summary</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
<tr><th>Reference No.</th><td>{{reference_number}}</td></tr>
<tr><th>Project Name</th><td>{{project_name}}</td></tr>
<tr><th>Category</th><td>{{category_name}} ({{category_code}})</td></tr>
<tr><th>Sector</th><td>{{sector_name}}</td></tr>
<tr><th>Proponent</th><td>{{applicant_name}} — {{applicant_organization}}</td></tr>
<tr><th>Email</th><td>{{applicant_email}}</td></tr>
<tr><th>Location</th><td>{{project_location}}, {{project_district}}, {{project_state}}</td></tr>
<tr><th>Estimated Cost (INR)</th><td>{{estimated_cost}}</td></tr>
<tr><th>Project Area</th><td>{{project_area}}</td></tr>
<tr><th>Date of Referral</th><td>{{date}}</td></tr>
</table>
<h2>Project Description</h2>
<p>{{project_description}}</p>
<h2>EIA Report Summary</h2>
<p><em>(EIA report review to be appended by the committee)</em></p>
<h2>Environmental Impact Assessment</h2>
<p><em>(Assessment details to be filled during the EAC meeting)</em></p>
<h2>Conditions &amp; Recommendations</h2>
<p><em>(To be filled after committee deliberation)</em></p>`,
        uploaded_by: ADMIN_ID,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("gist_templates", null, {});
    await queryInterface.bulkDelete("sectors", null, {});
    await queryInterface.bulkDelete("application_categories", null, {});
    await queryInterface.bulkDelete("users", null, {});
    await queryInterface.bulkDelete("roles", null, {});
  },
};
