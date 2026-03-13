"use client";

// ── Dashboard Page ───────────────────────────────────────────────────
// Role-aware dashboard with charts, activity feed, and quick actions

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DonutChart from "@/components/charts/DonutChart";
import BarChart from "@/components/charts/BarChart";
import TrendChart from "@/components/charts/TrendChart";
import RecentActivity from "@/components/RecentActivity";
import StatusBadge from "@/components/ui/StatusBadge";
import Link from "next/link";
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

function buildStatusChartData(byStatus = {}) {
  return Object.entries(byStatus)
    .sort(([statusA], [statusB]) => {
      const indexA = STATUS_ORDER.indexOf(statusA);
      const indexB = STATUS_ORDER.indexOf(statusB);
      return (indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA) - (indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB);
    })
    .map(([status, count]) => ({
      label: getStatusLabel(status),
      value: Number(count),
      status,
    }));
}

function buildStatusColorMap(data) {
  return Object.fromEntries(
    data.map((item) => [item.label, STATUS_META[item.status]?.color || "#94a3b8"])
  );
}

function DashboardContent() {
  const { user, isAdmin, isProponent, isScrutiny, isMom } = useAuth();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [proponentStats, setProponentStats] = useState(null);
  const [scrutinyStats, setScrutinyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        if (isAdmin || isScrutiny || isMom) {
          const [ov, tr, cat, recent] = await Promise.all([
            api.get("/dashboard/overview"),
            api.get("/dashboard/monthly-trend"),
            api.get("/dashboard/by-category"),
            api.get("/dashboard/recent-applications"),
          ]);
          setStats(ov.data);
          setTrend(tr.data);
          setByCategory(cat.data);
          setRecentApps(recent.data);
        }
        if (isScrutiny) {
          const { data } = await api.get("/dashboard/scrutiny-stats");
          setScrutinyStats(data);
        }
        if (isProponent) {
          const { data } = await api.get("/dashboard/my-stats");
          setProponentStats(data);
        }
      } catch {
        // Dashboard not critical
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAdmin, isProponent, isScrutiny, isMom]);

  if (loading) return <LoadingSpinner className="py-20" />;

  // Chart data transforms
  const statusData = stats?.by_status ? buildStatusChartData(stats.by_status) : [];
  const statusColorMap = buildStatusColorMap(statusData);

  const trendData = trend.map((r) => ({
    label: new Date(r.month).toLocaleDateString("en-IN", { month: "short" }),
    value: parseInt(r.count, 10),
  }));

  const catData = byCategory.map((r) => ({
    label: r.category ? r.category.code : "?",
    value: parseInt(r.count, 10),
  }));

  const proStatusData = proponentStats?.by_status ? buildStatusChartData(proponentStats.by_status) : [];
  const proStatusColorMap = buildStatusColorMap(proStatusData);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name}`}
        subtitle={`${user?.role?.name?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Dashboard`}
      >
        {isAdmin && (
          <Link href="/admin/analytics"
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium">
            📊 Full Analytics
          </Link>
        )}
      </PageHeader>

      {/* ── ADMIN DASHBOARD ─────────────────────────────── */}
      {isAdmin && stats && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StatCard label="Applications" value={stats.total_applications} icon="📋" color="primary" />
            <StatCard label="Under Scrutiny" value={stats.by_status?.under_scrutiny || 0} icon="🔍" color="yellow" />
            <StatCard label="Referred" value={stats.by_status?.referred || 0} icon="✅" color="green" />
            <StatCard label="Finalized" value={stats.by_status?.finalized || 0} icon="📢" color="purple" />
            <StatCard label="Users" value={stats.total_users} icon="👥" color="blue" />
            <StatCard label="Revenue (₹)" value={stats.total_revenue?.toLocaleString("en-IN") || "0"} icon="💰" color="green" />
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="card lg:col-span-2">
              <TrendChart data={trendData} title="Monthly Applications" height={220} />
            </div>
            <div className="card">
              <DonutChart
                data={statusData}
                title="Status Distribution"
                size={180}
                centerLabel="Total"
                colorMap={statusColorMap}
              />
            </div>
          </div>

          {/* Bottom Row: Category + Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <BarChart data={catData} title="By Category" height={200} />
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h3>
              <RecentActivity limit={8} />
            </div>
          </div>

          {/* Recent Applications Table */}
          {recentApps.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Recent Applications</h3>
                <Link href="/admin/applications" className="text-xs text-primary-600 hover:underline">View All →</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="py-2 px-3 font-medium text-gray-500">Reference</th>
                      <th className="py-2 px-3 font-medium text-gray-500">Project</th>
                      <th className="py-2 px-3 font-medium text-gray-500">Applicant</th>
                      <th className="py-2 px-3 font-medium text-gray-500">Status</th>
                      <th className="py-2 px-3 font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApps.slice(0, 5).map((app) => (
                      <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <Link href={`/admin/applications/${app.id}`} className="text-primary-600 hover:underline font-medium">
                            {app.reference_number}
                          </Link>
                        </td>
                        <td className="py-2 px-3 max-w-48 truncate">{app.project_name}</td>
                        <td className="py-2 px-3 text-gray-600">{app.applicant?.name}</td>
                        <td className="py-2 px-3"><StatusBadge status={app.status} /></td>
                        <td className="py-2 px-3 text-gray-500 text-xs">
                          {new Date(app.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── SCRUTINY TEAM DASHBOARD ─────────────────────── */}
      {isScrutiny && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Applications" value={stats?.total_applications || 0} icon="📋" color="primary" />
            <StatCard label="Assigned to Me" value={scrutinyStats?.assigned_applications || 0} icon="📌" color="blue" />
            <StatCard label="Pending Queries" value={scrutinyStats?.pending_queries || 0} icon="❓" color="yellow" />
            <StatCard label="Resolved Queries" value={scrutinyStats?.resolved_queries || 0} icon="✅" color="green" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {statusData.length > 0 && (
              <div className="card">
                <DonutChart data={statusData} title="System Status Overview" size={180} centerLabel="Total" colorMap={statusColorMap} />
              </div>
            )}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h3>
              <RecentActivity limit={8} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Quick Actions</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/scrutiny/applications"
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium">
                📋 View Assigned Applications
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ── MOM TEAM DASHBOARD ──────────────────────────── */}
      {isMom && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Applications" value={stats?.total_applications || 0} icon="📋" color="primary" />
            <StatCard label="Meetings" value={stats?.total_meetings || 0} icon="📅" color="blue" />
            <StatCard label="Referred" value={stats?.by_status?.referred || 0} icon="✅" color="green" />
            <StatCard label="MoM Generated" value={stats?.by_status?.mom_generated || 0} icon="📝" color="purple" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {statusData.length > 0 && (
              <div className="card">
                <DonutChart data={statusData} title="Application Status" size={180} centerLabel="Total" colorMap={statusColorMap} />
              </div>
            )}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h3>
              <RecentActivity limit={8} />
            </div>
          </div>
          <div className="card">
            <div className="flex flex-wrap gap-3">
              <Link href="/mom/meetings"
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium">
                📅 Manage Meetings
              </Link>
              <Link href="/mom/applications"
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
                📋 View Applications
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ── PROPONENT DASHBOARD ─────────────────────────── */}
      {isProponent && proponentStats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard label="My Applications" value={proponentStats.total_applications} icon="📋" color="primary" />
            <StatCard label="Documents" value={proponentStats.total_documents} icon="📄" color="blue" />
            <StatCard
              label="Total Paid (₹)"
              value={proponentStats.total_paid?.toLocaleString("en-IN") || "0"}
              icon="💰"
              color="green"
            />
            <StatCard label="Finalized" value={proponentStats.by_status?.finalized || 0} icon="📢" color="purple" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {proStatusData.length > 0 && (
              <div className="card">
                <DonutChart
                  data={proStatusData}
                  title="My Application Statuses"
                  size={180}
                  centerLabel="Total"
                  colorMap={proStatusColorMap}
                />
              </div>
            )}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
              <div className="flex flex-col gap-3">
                <Link href="/proponent/applications/new"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <span className="text-2xl">➕</span>
                  <div>
                    <p className="font-medium text-gray-900">New Application</p>
                    <p className="text-xs text-gray-500">Start a new EC application</p>
                  </div>
                </Link>
                <Link href="/proponent/applications"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="font-medium text-gray-900">My Applications</p>
                    <p className="text-xs text-gray-500">View and manage your applications</p>
                  </div>
                </Link>
                <Link href="/profile"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <span className="text-2xl">👤</span>
                  <div>
                    <p className="font-medium text-gray-900">Profile</p>
                    <p className="text-xs text-gray-500">Update your account details</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
