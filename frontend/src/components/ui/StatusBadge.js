// ── Status Badge Component ───────────────────────────────────────────
// Renders a colored badge for application workflow statuses
// Uses the same labels shown in the workflow tracker and analytics views

const statusConfig = {
  draft:                        { label: "Draft",                       className: "badge-draft" },
  submitted:                    { label: "Submitted",                   className: "badge-submitted" },
  under_scrutiny:               { label: "Under Scrutiny",              className: "badge-scrutiny" },
  essential_document_sought:    { label: "Essential Document Sought",   className: "badge-query" },
  referred:                     { label: "Referred",                    className: "badge-approved" },
  mom_generated:                { label: "MoM Generated",               className: "badge-mom" },
  finalized:                    { label: "Finalized",                   className: "badge-published" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: "badge-draft" };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
}
