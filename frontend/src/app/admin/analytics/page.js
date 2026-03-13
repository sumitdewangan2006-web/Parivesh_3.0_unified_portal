"use client";

// ── Admin Analytics Page ────────────────────────────────────────────
// Comprehensive analytics dashboard with charts and breakdowns

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import BarChart from "@/components/charts/BarChart";
import DonutChart from "@/components/charts/DonutChart";
import TrendChart from "@/components/charts/TrendChart";
import api from "@/lib/api";

const STATUS_META = {
  draft: { label: "Draft", color: "#9ca3af" },
  submitted: { label: "Submitted", color: "#2563eb" },
  under_scrutiny: { label: "Under Scrutiny", color: "#eab308" },
  essential_document_sought: { label: "Essential Document Sought", color: "#f97316" },
  referred: { label: "Referred", color: "#16a34a" },
  mom_generated: { label: "MoM Generated", color: "#8b5cf6" },
  finalized: { label: "Finalized", color: "#06b6d4" },
};

const STATUS_ORDER = Object.keys(STATUS_META);

function getStatusLabel(status) {
  return STATUS_META[status]?.label || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusColor(status) {
  return STATUS_META[status]?.color || "#94a3b8";
}

function AnalyticsContent() {
  const [overview, setOverview] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [bySector, setBySector] = useState([]);
  const [trend, setTrend] = useState([]);
  const [byState, setByState] = useState([]);
  const [processing, setProcessing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/overview"),
      api.get("/dashboard/by-category"),
      api.get("/dashboard/by-sector"),
      api.get("/dashboard/monthly-trend"),
      api.get("/dashboard/by-state"),
      api.get("/dashboard/processing-time"),
    ])
      .then(([ov, cat, sec, tr, st, proc]) => {
        setOverview(ov.data);
        setByCategory(cat.data);
        setBySector(sec.data);
        setTrend(tr.data);
        setByState(st.data);
        setProcessing(proc.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-20" />;

  // Transform data for charts
  const statusData = overview?.by_status
    ? Object.entries(overview.by_status)
        .sort(([statusA], [statusB]) => {
          const indexA = STATUS_ORDER.indexOf(statusA);
          const indexB = STATUS_ORDER.indexOf(statusB);
          return (indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA) - (indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB);
        })
        .map(([status, count]) => ({
          label: getStatusLabel(status),
          value: Number(count),
          status,
        }))
    : [];

  const categoryData = byCategory.map((r) => ({
    label: r.category ? `${r.category.code} — ${r.category.name}` : "Unknown",
    value: parseInt(r.count, 10),
  }));

  const sectorData = bySector.map((r) => ({
    label: r.sector?.name || "Unknown",
    value: parseInt(r.count, 10),
  }));

  const trendData = trend.map((r) => ({
    label: new Date(r.month).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
    value: parseInt(r.count, 10),
  }));

  const stateData = byState.slice(0, 10).map((r) => ({
    label: r.project_state,
    value: parseInt(r.count, 10),
  }));

  return (
    <>
      <PageHeader title="Analytics & Reports" subtitle="Comprehensive system analytics" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Applications" value={overview?.total_applications || 0} icon="📋" color="primary" />
        <StatCard label="Users" value={overview?.total_users || 0} icon="👥" color="blue" />
        <StatCard label="Documents" value={overview?.total_documents || 0} icon="📄" color="yellow" />
        <StatCard label="Meetings" value={overview?.total_meetings || 0} icon="📅" color="green" />
        <StatCard label="Payments" value={overview?.completed_payments || 0} icon="💰" color="purple" />
        <StatCard
          label="Revenue (₹)"
          value={overview?.total_revenue?.toLocaleString("en-IN") || "0"}
          icon="📈"
          color="green"
        />
      </div>

      {/* Processing Time Cards */}
      {processing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">⏱️</div>
            <div>
              <p className="text-sm text-gray-500">Avg. Days to Approval</p>
              <p className="text-2xl font-bold text-gray-900">
                {processing.avg_days_to_approval ?? "—"}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-xl">📢</div>
            <div>
              <p className="text-sm text-gray-500">Avg. Days to Publication</p>
              <p className="text-2xl font-bold text-gray-900">
                {processing.avg_days_to_publication ?? "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trend */}
        <div className="card">
          <TrendChart data={trendData} title="Monthly Application Trend" height={240} />
        </div>

        {/* Status Distribution – Donut */}
        <div className="card">
          <DonutChart
            data={statusData}
            title="Application Status Distribution"
            centerLabel="Total"
            colorMap={Object.fromEntries(
              statusData.map((d) => [d.label, getStatusColor(d.status)])
            )}
          />
        </div>

        {/* By Category – Bar */}
        <div className="card">
          <BarChart data={categoryData} title="Applications by Category" horizontal height={200} />
        </div>

        {/* By Sector – Bar */}
        <div className="card">
          <BarChart data={sectorData} title="Applications by Sector" horizontal height={200} />
        </div>

        {/* By State – Horizontal Bar */}
        {stateData.length > 0 && (
          <div className="card lg:col-span-2">
            <BarChart data={stateData} title="Top States by Applications" horizontal height={280} />
          </div>
        )}
      </div>

      {/* Status Breakdown Table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Count</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">% Share</th>
                <th className="py-2 px-3 font-medium text-gray-500 w-48">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {statusData.map((row) => {
                const pct = overview?.total_applications
                  ? ((row.value / overview.total_applications) * 100).toFixed(1)
                  : 0;
                return (
                  <tr key={row.status} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getStatusColor(row.status) }} />
                      {row.label}
                    </td>
                    <td className="py-2 px-3 text-right font-medium tabular-nums">{row.value}</td>
                    <td className="py-2 px-3 text-right text-gray-500 tabular-nums">{pct}%</td>
                    <td className="py-2 px-3">
                      <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: getStatusColor(row.status) }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <AnalyticsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
