# PARIVESH 3.0 — Unified Environmental Clearance Portal

A production-ready web portal that manages the complete lifecycle of Environmental Clearance (EC) applications — from submission by project proponents through scrutiny review and EAC meetings to final publication of the Minutes of the Meeting (MoM).

Built for the **PARIVESH 3.0 Government Hackathon**.

Current documentation snapshot: **March 14, 2026**.

---

## Tech Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Frontend         | React 18.3 + Next.js 14.2 (App Router) + TailwindCSS |
| Backend          | Node.js 20 + Express 4 + Sequelize 6 ORM       |
| Database         | PostgreSQL 16                                   |
| Authentication   | JWT + Role-Based Access Control (RBAC)          |
| File Storage     | Local Storage (Docker volume)                   |
| Payments         | UPI / QR Code (mock integration)                |
| DevOps           | Docker + Docker Compose                         |

---

## Features

### For Project Proponents
- Multi-step application wizard with draft save
- Document upload with drag-and-drop, version history, and inline preview
- Mandatory draft-stage fee payment with mock UPI/QR integration and auto-submit on success
- Real-time application status tracking with visual workflow indicator
- Personal dashboard with application statistics and donut charts

### For Scrutiny Team
- Review assigned applications with remarks, queries, and corrections
- Approve or send back applications with audit trail
- Document review portal grouped by document type
- Workload dashboard showing pending/resolved queries

### For MoM Team
- Create and manage EAC meetings with agenda items
- Link applications to meetings and record decisions
- Draft, finalize, and publish meeting minutes
- Meeting management dashboard

### For Administrators
- Full user management (create, activate/deactivate, role assignment)
- Application category and sector management
- Gist template management
- Comprehensive analytics dashboard with:
  - Monthly trend charts (SVG line/area)
  - Status distribution donut charts
  - Category and sector bar charts
  - State-wise distribution
  - Average processing time metrics
  - Real-time activity feed
  - Revenue tracking
- Admin can assign scrutiny officers and MoM officers to applications

---

## Application Workflow

```
Draft → Submitted → Under Scrutiny ⇄ Essential Document Sought → Referred → MoM Generated → Finalized
```

The EC fee is collected during the draft stage. A draft can move to Submitted only after payment is completed, after which the system auto-submits the application for scrutiny.

Each transition is validated and recorded with a full audit trail in the status history.

---

## Project Structure

```
parivesh-3.0/
├── docker-compose.yml              # Orchestration for all 3 services
├── .gitignore
├── README.md
│
├── backend/                         # Express API Server
│   ├── Dockerfile
│   ├── .env.example
│   ├── .sequelizerc
│   ├── package.json
│   ├── migrations/                  # Sequelize database migrations
│   │   └── 20260306000001-create-full-schema.js
│   ├── seeders/                     # Demo data (roles, categories, admin user)
│   │   └── 20260306000001-initial-data.js
│   ├── uploads/                     # File upload storage
│   └── src/
│       ├── app.js                   # Express entry point
│       ├── config/                  # Database, env, sequelize config
│       ├── middleware/              # authenticate, authorize, upload, validate
│       ├── models/                  # 12 Sequelize models with associations
│       │   ├── Application.js       # Core EC application
│       │   ├── User.js / Role.js    # Auth & RBAC
│       │   ├── Document.js          # File uploads with versioning
│       │   ├── Remark.js            # Scrutiny remarks/queries
│       │   ├── StatusHistory.js     # Audit trail
│       │   ├── Payment.js           # Fee payments
│       │   ├── Meeting.js           # EAC meetings
│       │   ├── MeetingApplication.js # Meeting–Application join
│       │   ├── ApplicationCategory.js / Sector.js
│       │   ├── GistTemplate.js      # Gist document templates
│       │   └── index.js             # Associations
│       ├── routes/                  # 10 Express route files (40+ endpoints)
│       │   ├── auth.js              # Login, register, profile
│       │   ├── admin.js             # User/category/sector management
│       │   ├── applications.js      # CRUD + submit + history
│       │   ├── documents.js         # Upload, download, versions, delete
│       │   ├── scrutiny.js          # Remarks, approve, send-back
│       │   ├── meetings.js          # CRUD, link apps, decisions, MoM
│       │   ├── payments.js          # Initiate, verify, mock
│       │   ├── dashboard.js         # 10 analytics endpoints
│       │   ├── workflow.js          # Workflow status API
│       │   └── config.js            # Categories & sectors lookup
│       ├── services/                # Business logic layer
│       │   ├── authService.js
│       │   ├── adminService.js
│       │   ├── applicationService.js
│       │   ├── documentService.js
│       │   ├── scrutinyService.js
│       │   ├── momService.js
│       │   ├── paymentService.js
│       │   ├── dashboardService.js  # Analytics aggregations
│       │   ├── statusTransitionService.js  # Workflow engine
│       │   └── configService.js
│       └── utils/
│           └── logger.js            # Winston logger
│
└── frontend/                        # Next.js Application
    ├── Dockerfile
    ├── .env.example
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js           # Custom govt-themed palette
    ├── postcss.config.js
    └── src/
        ├── styles/globals.css       # Tailwind imports + custom utilities
        ├── lib/api.js               # Axios client with JWT interceptors
        ├── contexts/AuthContext.js   # Auth state + role helpers
        ├── components/
        │   ├── DashboardLayout.js   # Sidebar + navbar layout shell
        │   ├── Navbar.js            # Top navigation bar
        │   ├── Sidebar.js           # Role-aware sidebar navigation
        │   ├── ProtectedRoute.js    # Route guard with role check
        │   ├── DocumentUploader.js  # Drag-and-drop file upload
        │   ├── DocumentList.js      # Document display with versions/preview
        │   ├── WorkflowTracker.js   # Visual workflow step indicator
        │   ├── RecentActivity.js    # Activity feed component
        │   ├── charts/
        │   │   ├── BarChart.js      # Pure CSS bar chart
        │   │   ├── DonutChart.js    # SVG donut chart
        │   │   └── TrendChart.js    # SVG line/area chart
        │   └── ui/
        │       ├── DataTable.js     # Sortable data table
        │       ├── LoadingSpinner.js
        │       ├── PageHeader.js
        │       ├── Pagination.js
        │       ├── StatCard.js      # KPI metric card
        │       └── StatusBadge.js   # Color-coded status pill
        └── app/                     # Next.js App Router (25+ pages)
            ├── layout.js            # Root layout with providers
            ├── page.js              # Public landing page
            ├── auth/
            │   ├── login/page.js
            │   └── register/page.js
            ├── dashboard/page.js    # Role-aware dashboard with charts
            ├── profile/page.js
            ├── unauthorized/page.js
            ├── admin/
            │   ├── analytics/page.js    # Full analytics dashboard
            │   ├── applications/page.js # Application list + assignment
            │   ├── applications/[id]/page.js
            │   ├── users/page.js
            │   ├── categories/page.js
            │   ├── sectors/page.js
            │   ├── templates/page.js
            │   └── payments/page.js
            ├── proponent/
            │   ├── applications/page.js     # My applications list
            │   ├── applications/new/page.js # Multi-step wizard
            │   ├── applications/[id]/page.js
            │   └── applications/[id]/documents/page.js
            ├── scrutiny/
            │   ├── applications/page.js
            │   ├── applications/[id]/page.js
            │   └── applications/[id]/documents/page.js
            └── mom/
                ├── meetings/page.js
                ├── meetings/[id]/page.js
                └── applications/page.js
```

---

## Roles & Permissions

| Role               | Key Capabilities                                                |
| ------------------- | --------------------------------------------------------------- |
| **Admin**           | Manage users, categories, sectors, templates, assign officers, view analytics |
| **Project Proponent** | Create/edit/submit applications, upload documents, make payments |
| **Scrutiny Team**   | Review applications, add remarks/queries, approve/send back     |
| **MoM Team**        | Create meetings, link applications, record decisions, publish MoM |

---

## Getting Started

### Prerequisites
- **Docker & Docker Compose** (recommended)
- Or: Node.js 20+, PostgreSQL 16

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/sumitdewangan2006-web/Parivesh_3.0_unified_portal
cd Parivesh_3.0_unified_portal

# Start all services
# Backend waits for Postgres, runs migrations automatically, then starts the API
docker compose up --build
```

| Service   | URL                            |
| --------- | ------------------------------ |
| Frontend  | http://localhost:3000          |
| API       | http://localhost:5000/api      |
| Health    | http://localhost:5000/api/health |
| Database  | localhost:5432                 |

### Local Development

```bash
# 1. Start PostgreSQL (Docker or local)
docker compose up db -d

# 2. Backend
cd backend
cp .env.example .env          # Configure your env
npm install
npm run migrate               # Run database migrations
npm run seed                  # Seed demo data
npm run dev                   # Starts on port 5000

# 3. Frontend (in another terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                   # Starts on port 3000
```

### Demo Login

The default password depends on how demo data was seeded:

| Startup Path | Default Password |
| ------------ | ---------------- |
| Docker quick start (`MIGRATE_ON_START=true`, `SEED_DEMO_DATA=true`) | `Test@123` |
| Local migration + `npm run seed` | `Admin@123` |

| Role              | Email                      |
| ----------------- | -------------------------- |
| Admin             | admin@parivesh.gov.in      |
| Project Proponent | proponent@parivesh.gov.in  |
| Scrutiny Team     | scrutiny@parivesh.gov.in   |
| MoM Team          | mom@parivesh.gov.in        |

> Register new users via the registration page. Admin can change roles from the user management panel.

### Demo Package

- Full role-by-role walkthrough script: `DEMO_SCRIPT.md`
- Quick service smoke-check command: `powershell -ExecutionPolicy Bypass -File scripts/demo-health-check.ps1`
- One-command demo environment reset: `powershell -ExecutionPolicy Bypass -File scripts/demo-reset.ps1 -FullReset`
- Judge criteria mapping sheet: `DEMO_SCORECARD.md`

---

## API Endpoints

### Authentication
| Method | Endpoint               | Description            |
| ------ | ---------------------- | ---------------------- |
| POST   | `/api/auth/register`   | Register new user      |
| POST   | `/api/auth/login`      | Login and get JWT      |
| GET    | `/api/auth/me`         | Get current user       |
| PUT    | `/api/auth/profile`    | Update profile         |
| PUT    | `/api/auth/password`   | Change password        |

### Health
| Method | Endpoint            | Description              |
| ------ | ------------------- | ------------------------ |
| GET    | `/api/health`       | Service health check     |

### Applications
| Method | Endpoint                               | Description                   |
| ------ | -------------------------------------- | ----------------------------- |
| GET    | `/api/applications`                    | List applications (admin/scrutiny/mom) |
| GET    | `/api/applications/my`                 | List own applications         |
| POST   | `/api/applications`                    | Create draft application      |
| GET    | `/api/applications/:id`                | Get application details       |
| PUT    | `/api/applications/:id`                | Update draft                  |
| POST   | `/api/applications/:id/submit`         | Manual submit after payment or scrutiny resubmission |
| GET    | `/api/applications/:id/history`        | Status change history         |

### Documents
| Method | Endpoint                                          | Description              |
| ------ | ------------------------------------------------- | ------------------------ |
| POST   | `/api/documents/application/:applicationId`       | Upload document          |
| GET    | `/api/documents/application/:applicationId`       | List documents for application |
| GET    | `/api/documents/:id/download`                     | Download file            |
| GET    | `/api/documents/application/:applicationId/versions/:documentType` | Version history |
| DELETE | `/api/documents/:id`                              | Soft-delete document     |

### Scrutiny
| Method | Endpoint                                       | Description           |
| ------ | ---------------------------------------------- | --------------------- |
| GET    | `/api/scrutiny/applications`                   | List assigned apps    |
| GET    | `/api/scrutiny/applications/:id/remarks`       | Get remarks           |
| POST   | `/api/scrutiny/applications/:id/remarks`       | Add remark/query      |
| PUT    | `/api/scrutiny/remarks/:id/resolve`            | Resolve query         |
| POST   | `/api/scrutiny/applications/:id/approve`       | Approve for meeting   |
| POST   | `/api/scrutiny/applications/:id/send-back`     | Send back with query  |

### Meetings (MoM)
| Method | Endpoint                                      | Description              |
| ------ | --------------------------------------------- | ------------------------ |
| GET    | `/api/meetings`                               | List meetings            |
| POST   | `/api/meetings`                               | Create meeting           |
| GET    | `/api/meetings/:id`                           | Meeting details          |
| PUT    | `/api/meetings/:id`                           | Update agenda/minutes    |
| POST   | `/api/meetings/:id/applications`              | Add apps to meeting      |
| PUT    | `/api/meetings/:id/applications/:applicationId/decision` | Record decision |
| POST   | `/api/meetings/:id/finalize`                  | Finalize meeting         |
| POST   | `/api/meetings/:id/publish`                   | Publish meeting/MoM      |
| GET    | `/api/meetings/:id/export/docx`               | Export MoM as DOCX       |
| GET    | `/api/meetings/:id/export/pdf`                | Export MoM as PDF        |

### Dashboard & Analytics
| Method | Endpoint                          | Description                |
| ------ | --------------------------------- | -------------------------- |
| GET    | `/api/dashboard/overview`         | System-wide KPIs           |
| GET    | `/api/dashboard/by-category`      | Category breakdown         |
| GET    | `/api/dashboard/by-sector`        | Sector breakdown           |
| GET    | `/api/dashboard/monthly-trend`    | 12-month trend             |
| GET    | `/api/dashboard/recent-applications` | Latest 10 applications  |
| GET    | `/api/dashboard/recent-activity`  | Latest status changes      |
| GET    | `/api/dashboard/by-state`         | State-wise distribution    |
| GET    | `/api/dashboard/processing-time`  | Avg. processing days       |
| GET    | `/api/dashboard/my-stats`         | Proponent personal stats   |
| GET    | `/api/dashboard/scrutiny-stats`   | Scrutiny workload stats    |

### Admin
| Method | Endpoint                               | Description              |
| ------ | -------------------------------------- | ------------------------ |
| GET    | `/api/admin/users`                     | List all users           |
| POST   | `/api/admin/users`                     | Create user              |
| PUT    | `/api/admin/users/:id/role`            | Change user role         |
| PUT    | `/api/admin/users/:id/status`          | Activate/deactivate user |
| GET    | `/api/admin/roles`                     | List available roles     |
| PUT    | `/api/applications/:id/assign-scrutiny`| Assign scrutiny officer  |
| PUT    | `/api/applications/:id/assign-mom`     | Assign MoM officer       |

### Config
| Method | Endpoint                         | Description                 |
| ------ | -------------------------------- | --------------------------- |
| GET    | `/api/config/categories`         | List categories (public)    |
| POST   | `/api/config/categories`         | Create category (admin)     |
| PUT    | `/api/config/categories/:id`     | Update category (admin)     |
| GET    | `/api/config/sectors`            | List sectors (public)       |
| POST   | `/api/config/sectors`            | Create sector (admin)       |
| PUT    | `/api/config/sectors/:id`        | Update sector (admin)       |
| GET    | `/api/config/templates`          | List templates (admin/scrutiny) |
| POST   | `/api/config/templates`          | Create template (admin)     |
| PUT    | `/api/config/templates/:id`      | Update template (admin)     |
| DELETE | `/api/config/templates/:id`      | Delete template (admin)     |

### Payments
| Method | Endpoint                                  | Description                              |
| ------ | ----------------------------------------- | ---------------------------------------- |
| GET    | `/api/payments/public/:id`                | Public payment details for mobile flow   |
| POST   | `/api/payments/public/:id/pay`            | Public mock pay confirmation             |
| GET    | `/api/payments/calculate-fee/:applicationId` | Calculate draft-stage EC fee from project cost |
| POST   | `/api/payments/initiate`                  | Initiate mock UPI/QR payment for draft   |
| POST   | `/api/payments/:id/confirm`               | Confirm payment and auto-submit draft    |
| GET    | `/api/payments/application/:applicationId`| List payments for an application         |
| GET    | `/api/payments`                           | List all payments (admin)                |

### Workflow
| Method | Endpoint                         | Description                 |
| ------ | -------------------------------- | --------------------------- |
| GET    | `/api/workflow/:applicationId`   | Workflow status by step     |

---

## Database Schema

12 tables with full referential integrity:

```
roles ──────────────── users
                         │
           ┌─────────────┼──────────────┐
           ▼             ▼              ▼
     applications ── documents    status_history
        │    │
        │    ├── remarks
        │    ├── payments
        │    └── meeting_applications ── meetings
        │
        ├── application_categories
        └── sectors

gist_templates ── categories / sectors
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
NODE_ENV=development
AUTO_SYNC=false
MIGRATE_ON_START=false
SEED_DEMO_DATA=false
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parivesh_db
DB_USER=parivesh_admin
DB_PASSWORD=parivesh_secure_2024
DB_WAIT_MAX_ATTEMPTS=30
DB_WAIT_DELAY_MS=2000
JWT_SECRET=your_jwt_secret_change_in_production
JWT_EXPIRY=24h
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
CORS_ORIGIN=http://localhost:3000
```

`AUTO_SYNC` should remain disabled once migrations are in use. For Docker startup, `MIGRATE_ON_START=true` lets the backend wait for PostgreSQL and apply pending migrations before booting. `SEED_DEMO_DATA` is still optional and should only be enabled for demo/local environments.

Note: if `MAX_FILE_SIZE_MB` is omitted, runtime fallback in backend config is 50 MB.

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
# Optional for Docker/proxy route support
BACKEND_INTERNAL_URL=http://backend:5000/api
```

---

## Security Features

- **JWT Authentication** with route protection and automatic logout on 401
- **Role-Based Access Control** on every API route
- **Helmet.js** security headers
- **Rate Limiting** — 500 requests per 15 minutes per IP
- **CORS** currently reflects requesting origins (use stricter origin policy for hardened deployment)
- **Input Validation** via express-validator
- **File Upload Restrictions** — MIME type whitelist, size controlled by `MAX_FILE_SIZE_MB`
- **Password Hashing** — bcrypt with 12 salt rounds
- **Soft Deletes** — documents are deactivated, not destroyed
- **Audit Trail** — every status change logged with user & timestamp

---

## AI Environmental Risk Analyzer

When a proposal is submitted, the system runs an environmental risk analysis pipeline.

### What it does

- Parses uploaded PDF documents (for example EIA reports)
- Summarizes likely environmental impact
- Detects risk keywords (deforestation, pollution, wildlife impact, groundwater)
- Generates a risk score and category

### Example Output

Project Risk Score: 72/100 (High)

Reasons:
- Located within 8km of wildlife sanctuary
- High groundwater usage
- Deforestation area > 10 hectares

### Tech Stack (Analyzer)

- Python
- PDF parsing with `pypdf`
- LLM summarization with OpenAI API (fallback to extractive summary if API key is not configured)

### Configuration

Set these in [backend/.env.example](backend/.env.example):

```env
ENABLE_PYTHON_RISK_ANALYZER=true
PYTHON_RISK_ANALYZER_CMD=python
PYTHON_RISK_ANALYZER_ARGS=
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

Analyzer files:
- [backend/ai/risk_analyzer.py](backend/ai/risk_analyzer.py)
- [backend/ai/requirements.txt](backend/ai/requirements.txt)

API endpoint:
- `GET /api/applications/:id/risk-analysis`

---

## License

Built for the **PARIVESH 3.0 Government Hackathon** — Ministry of Environment, Forest and Climate Change (MoEFCC), Government of India.
