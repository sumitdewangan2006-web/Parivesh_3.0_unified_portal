"use client";

// ── SVG Donut Chart ─────────────────────────────────────────────────
// Pure SVG donut/pie — no external dependencies

const COLORS = [
  "#2563eb", "#16a34a", "#eab308", "#dc2626", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#6366f1",
];

export default function DonutChart({
  data = [],
  labelKey = "label",
  valueKey = "value",
  title,
  size = 200,
  thickness = 35,
  showLegend = true,
  centerLabel,
  colorMap,
}) {
  const total = data.reduce((sum, d) => sum + (Number(d[valueKey]) || 0), 0);

  if (!total) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height: size }}>
        No data available
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;
  const segments = data.map((item, i) => {
    const val = Number(item[valueKey]) || 0;
    const pct = val / total;
    const offset = accumulated;
    accumulated += pct;
    return {
      ...item,
      val,
      pct,
      offset,
      color: colorMap?.[item[labelKey]] || COLORS[i % COLORS.length],
    };
  });

  return (
    <div>
      {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background circle */}
            <circle cx={cx} cy={cy} r={radius}
              fill="none" stroke="#f3f4f6" strokeWidth={thickness} />
            {/* Data segments */}
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={cx} cy={cy} r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${seg.pct * circumference} ${circumference}`}
                strokeDashoffset={-seg.offset * circumference}
                transform={`rotate(-90 ${cx} ${cy})`}
                className="transition-all duration-500"
              />
            ))}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{total}</span>
            {centerLabel && <span className="text-xs text-gray-500">{centerLabel}</span>}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-col gap-1.5 text-sm min-w-0">
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-gray-600 truncate">{seg[labelKey]}</span>
                <span className="ml-auto text-gray-900 font-medium tabular-nums">{seg.val}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
