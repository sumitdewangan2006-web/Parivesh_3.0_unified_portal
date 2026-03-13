# PARIVESH 3.0 Judge Scorecard Mapping

Use this one-page sheet during judging to connect criteria to concrete system evidence.

## 1) Problem Understanding

- Government EC lifecycle is multi-role, compliance-heavy, and often fragmented.
- Portal covers proposer submission, scrutiny review, EAC meeting handling, and final publication.

Evidence:
- End-to-end workflow stages in README and workflow tracker.
- Role-specific route protections and dashboards.

## 2) Technical Depth

- Structured architecture: Next.js frontend + Express service layer + Sequelize + PostgreSQL.
- Explicit transition validation with history logging.
- Payment guardrail integrated with workflow progression.

Evidence:
- Status transition service and status history model usage.
- Payment service checks for ownership, state, and cost dependencies.
- CI workflow running backend tests and frontend lint.

## 3) Innovation and Practicality

- Draft-stage fee gating ensures payment-complete submissions only.
- Auto-submit after payment confirmation removes manual inconsistencies.
- Analytics supports operational visibility for administrators.

Evidence:
- Payment flow in proponent wizard and detail view.
- Dashboard and analytics pages with canonical status mapping.

## 4) User Experience

- Guided multi-step application process.
- Role-aware navigation and protected routes.
- Visual workflow tracker and status badges for clarity.

Evidence:
- Proponent new application flow.
- Shared UI components and route protection setup.

## 5) Reliability and Engineering Quality

- Unit tests for core payment and submission guardrails.
- CI enforcement on push and pull request.
- Demo scripts for reproducible environment setup.

Evidence:
- Backend test suite under backend/tests.
- GitHub workflow under .github/workflows/ci.yml.
- Demo runbook and reset/health scripts.

## 6) Security and Governance

- JWT auth with RBAC middleware.
- Helmet, rate limiting, input validation, and upload constraints.
- Auditable status changes with actor and timestamp.

Evidence:
- Middleware stack and documented security features.
- Status history endpoints and dashboard activity feed.

## Suggested Closing Line

PARIVESH 3.0 is not only feature-complete for a hackathon scenario, but engineered as an operationally credible workflow platform with enforceable guardrails, auditability, and repeatable demo reliability.
