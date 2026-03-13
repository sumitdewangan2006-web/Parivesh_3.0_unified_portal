// ── Stat Card Component ──────────────────────────────────────────────
// Dashboard metric card with icon, label, and value

export default function StatCard({ label, value, icon, color = "primary" }) {
  const colorMap = {
    primary: "bg-primary-50 text-primary-700 border-primary-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className={`rounded-lg border p-5 ${colorMap[color] || colorMap.primary}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
        </div>
        {icon && <span className="text-4xl opacity-50">{icon}</span>}
      </div>
    </div>
  );
}
