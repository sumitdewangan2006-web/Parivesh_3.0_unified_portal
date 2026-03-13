# PARIVESH 3.0 Demo Script (10-12 minutes)

This runbook is designed for hackathon judging. It demonstrates the full lifecycle from draft creation to final publication using pre-seeded demo users.

## 1. Environment Setup (1 min)

1. Start services:
   - `docker-compose up --build`
2. Verify health:
   - `powershell -ExecutionPolicy Bypass -File scripts/demo-health-check.ps1`
3. Open UI:
   - Frontend: http://localhost:3000

## 2. Demo Accounts

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | admin@parivesh.gov.in | Admin@123 |
| Project Proponent | proponent@parivesh.gov.in | Admin@123 |
| Scrutiny Team | scrutiny@parivesh.gov.in | Admin@123 |
| MoM Team | mom@parivesh.gov.in | Admin@123 |

## 3. Storyline (Suggested Narration)

- Problem: EC processing is multi-stakeholder, document-heavy, and often opaque.
- Solution: One portal with role-based workflow, auditability, and measurable processing visibility.
- Innovation highlight: Payment gating in draft stage with automatic submit only after successful payment.

## 4. Live Walkthrough

### A) Proponent creates a draft and pays (3 min)

1. Login as Project Proponent.
2. Go to New Application wizard.
3. Fill project details and estimated cost.
4. Upload at least one document.
5. Open payment step and simulate payment.
6. Show result: draft is auto-submitted after payment confirmation.

What to call out:
- Fee slab is computed from project cost.
- Submission is blocked until payment completes.
- Status and history are recorded.

### B) Admin assignment and visibility (2 min)

1. Login as Admin.
2. Open applications list and open the newly submitted item.
3. Assign a scrutiny officer and MoM officer.
4. Show analytics dashboard overview and status distribution.

What to call out:
- Central control for assignment and governance.
- Real-time dashboard snapshots for administrators.

### C) Scrutiny action (2 min)

1. Login as Scrutiny Team.
2. Open assigned applications.
3. Add a remark and move the application forward (or send back once, then re-submit).

What to call out:
- Query loop and audit trail support compliance.
- Every status transition is validated by role and current state.

### D) MoM stage and closure (2 min)

1. Login as MoM Team.
2. Create or open meeting, attach referred application.
3. Generate/finalize minutes and publish outcome.

What to call out:
- End-to-end flow closes with MoM publication.
- System maintains continuity from first draft to final status.

## 5. Judge-Focused Evidence Checklist

- Show one status history timeline for the same application.
- Show one dashboard card/chart that changed after your actions.
- Show payment entry linked to that application.
- Show role-based access by quickly switching users.

## 6. Backup Plan (if live network or UI issue)

1. Keep backend health endpoint open: http://localhost:5000/api/health
2. Keep one browser tab per role already logged in.
3. Use the same seeded credentials above to recover quickly.

## 7. Closing Statement (30 sec)

PARIVESH 3.0 demonstrates a realistic government workflow with enforceable payment guardrails, role-specific operations, and auditable lifecycle transitions from proposal to decision publication.
