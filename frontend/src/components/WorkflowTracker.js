"use client";

// ── Workflow Tracker ─────────────────────────────────────────────────
// Horizontal step-based visualization of the EC application lifecycle
// Matches the application workflow used across backend, dashboards, and README

const WORKFLOW_STEPS = [
  { key: "draft",                        label: "Draft",                     icon: "📝", color: "gray" },
  { key: "submitted",                    label: "Submitted",                 icon: "📨", color: "blue" },
  { key: "under_scrutiny",               label: "Under Scrutiny",            icon: "🔍", color: "yellow" },
  { key: "essential_document_sought",    label: "Essential Document Sought", icon: "📄", color: "orange" },
  { key: "referred",                     label: "Referred",                  icon: "✅", color: "green" },
  { key: "mom_generated",                label: "MoM Generated",             icon: "📋", color: "purple" },
  { key: "finalized",                    label: "Finalized",                 icon: "📢", color: "emerald" },
];

const colorMap = {
  gray:    { bg: "bg-gray-200",    text: "text-gray-600",    line: "bg-gray-300" },
  blue:    { bg: "bg-blue-100",    text: "text-blue-700",    line: "bg-blue-300" },
  yellow:  { bg: "bg-yellow-100",  text: "text-yellow-700",  line: "bg-yellow-300" },
  orange:  { bg: "bg-orange-100",  text: "text-orange-700",  line: "bg-orange-300" },
  green:   { bg: "bg-green-100",   text: "text-green-700",   line: "bg-green-300" },
  purple:  { bg: "bg-purple-100",  text: "text-purple-700",  line: "bg-purple-300" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", line: "bg-emerald-300" },
};

export default function WorkflowTracker({ currentStatus, history = [] }) {
  const currentIdx = WORKFLOW_STEPS.findIndex((s) => s.key === currentStatus);

  // Build a set of statuses that have been visited (from history)
  const visitedStatuses = new Set();
  history.forEach((h) => {
    if (h.from_status) visitedStatuses.add(h.from_status);
    if (h.to_status) visitedStatuses.add(h.to_status);
  });
  if (currentStatus) visitedStatuses.add(currentStatus);

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">Application Workflow</h3>

      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-start gap-0">
        {WORKFLOW_STEPS.map((step, i) => {
          const isCurrent = step.key === currentStatus;
          const isCompleted = i < currentIdx;
          const isVisited = visitedStatuses.has(step.key);
          const isActive = isCurrent || isCompleted || isVisited;
          const colors = colorMap[step.color];

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center text-center w-full">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                  ${isCurrent ? `${colors.bg} ring-2 ring-offset-2 ring-${step.color}-400` :
                    isActive ? colors.bg : "bg-gray-100"}`}>
                  {isCompleted ? "✓" : step.icon}
                </div>
                <span className={`text-xs mt-1.5 font-medium leading-tight
                  ${isCurrent ? colors.text : isActive ? "text-gray-700" : "text-gray-400"}`}>
                  {step.label}
                </span>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className={`h-0.5 w-full mt-5 -mx-1 ${isCompleted ? colors.line : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden space-y-0">
        {WORKFLOW_STEPS.map((step, i) => {
          const isCurrent = step.key === currentStatus;
          const isCompleted = i < currentIdx;
          const isVisited = visitedStatuses.has(step.key);
          const isActive = isCurrent || isCompleted || isVisited;
          const colors = colorMap[step.color];

          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                  ${isCurrent ? `${colors.bg} ring-2 ring-offset-1 ring-${step.color}-400` :
                    isActive ? colors.bg : "bg-gray-100"}`}>
                  {isCompleted ? "✓" : step.icon}
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className={`w-0.5 h-6 ${isCompleted ? colors.line : "bg-gray-200"}`} />
                )}
              </div>
              <div className={`pb-4`}>
                <span className={`text-sm font-medium ${isCurrent ? colors.text : isActive ? "text-gray-700" : "text-gray-400"}`}>
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">Current</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
