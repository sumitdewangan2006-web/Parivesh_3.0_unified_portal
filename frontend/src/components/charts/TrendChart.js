"use client";

// ── SVG Area/Line Chart ─────────────────────────────────────────────
// Pure SVG trend chart — no external dependencies

export default function TrendChart({
  data = [],
  labelKey = "label",
  valueKey = "value",
  title,
  height = 200,
  color = "#2563eb",
  fillOpacity = 0.15,
  showDots = true,
  showGrid = true,
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        Not enough data for trend
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const width = 600;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map((d) => Number(d[valueKey]) || 0);
  const maxVal = Math.max(...values, 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  // Generate points
  const points = values.map((v, i) => ({
    x: padding.left + (i / (values.length - 1)) * chartW,
    y: padding.top + chartH - ((v - minVal) / range) * chartH,
    value: v,
    label: data[i][labelKey],
  }));

  // Line path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Area path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Grid lines (4 horizontal)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: padding.top + chartH - pct * chartH,
    label: Math.round(minVal + pct * range),
  }));

  return (
    <div>
      {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid */}
        {showGrid && gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padding.left} y1={g.y} x2={width - padding.right} y2={g.y}
              stroke="#e5e7eb" strokeDasharray="4 4" />
            <text x={padding.left - 8} y={g.y + 4} textAnchor="end"
              className="text-[10px]" fill="#9ca3af">{g.label}</text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={color} opacity={fillOpacity} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {showDots && points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="white" stroke={color} strokeWidth={2} />
            <text x={p.x} y={padding.top + chartH + 18} textAnchor="middle"
              className="text-[9px]" fill="#6b7280">{p.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
