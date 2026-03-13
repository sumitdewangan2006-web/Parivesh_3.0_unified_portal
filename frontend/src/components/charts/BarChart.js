"use client";

// ── CSS Bar Chart ───────────────────────────────────────────────────
// Pure CSS horizontal/vertical bar chart — no external dependencies

const COLORS = [
  "#2563eb", "#16a34a", "#eab308", "#dc2626", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#6366f1",
];

export default function BarChart({
  data = [],
  labelKey = "label",
  valueKey = "value",
  title,
  horizontal = false,
  height = 240,
  showValues = true,
  colorMap,
}) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        No data available
      </div>
    );
  }

  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);

  if (horizontal) {
    return (
      <div>
        {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
        <div className="space-y-2">
          {data.map((item, i) => {
            const val = Number(item[valueKey]) || 0;
            const pct = (val / max) * 100;
            const color = colorMap?.[item[labelKey]] || COLORS[i % COLORS.length];
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-28 text-gray-600 text-xs truncate text-right">{item[labelKey]}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
                  >
                    {showValues && pct > 15 && (
                      <span className="text-[10px] font-medium text-white">{val}</span>
                    )}
                  </div>
                </div>
                {showValues && pct <= 15 && (
                  <span className="text-xs text-gray-500 w-8">{val}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical bar chart
  return (
    <div>
      {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
      <div className="flex items-end gap-2 justify-around" style={{ height }}>
        {data.map((item, i) => {
          const val = Number(item[valueKey]) || 0;
          const pct = (val / max) * 100;
          const color = colorMap?.[item[labelKey]] || COLORS[i % COLORS.length];
          return (
            <div key={i} className="flex flex-col items-center flex-1 max-w-16">
              {showValues && (
                <span className="text-xs font-semibold text-gray-700 mb-1">{val}</span>
              )}
              <div className="w-full bg-gray-100 rounded-t-md overflow-hidden" style={{ height: height - 40 }}>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(pct, 2)}%`,
                    backgroundColor: color,
                    marginTop: `${100 - Math.max(pct, 2)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-1 text-center leading-tight truncate w-full">
                {item[labelKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
