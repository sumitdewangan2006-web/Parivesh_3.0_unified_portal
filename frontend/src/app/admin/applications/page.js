"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import toast from "react-hot-toast";

const STATUSES = [
  "", "draft", "submitted", "under_scrutiny", "essential_document_sought",
  "referred", "mom_generated", "finalized",
];

function ApplicationsContent() {
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [catFilter, setCatFilter] = useState("");
  const [secFilter, setSecFilter] = useState("");

  // Assign modal
  const [assignModal, setAssignModal] = useState(null); // { appId, type: "scrutiny"|"mom" }
  const [teamUsers, setTeamUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/config/categories"),
      api.get("/config/sectors"),
    ]).then(([c, s]) => { setCategories(c.data); setSectors(s.data); }).catch(() => {});
  }, []);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (status) params.status = status;
      if (search) params.search = search;
      if (catFilter) params.category_id = catFilter;
      if (secFilter) params.sector_id = secFilter;
      const { data } = await api.get("/applications", { params });
      setApps(data.applications);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [page, status, search, catFilter, secFilter]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const openAssign = async (appId, type) => {
    setAssignModal({ appId, type });
    setSelectedUser("");
    try {
      const roleName = type === "scrutiny" ? "scrutiny_team" : "mom_team";
      const { data } = await api.get("/admin/users", { params: { role: roleName, limit: 100 } });
      setTeamUsers(data.users);
    } catch {
      toast.error("Failed to load team members");
    }
  };

  const handleAssign = async () => {
    if (!selectedUser) return;
    try {
      const { appId, type } = assignModal;
      const endpoint = type === "scrutiny"
        ? `/applications/${appId}/assign-scrutiny`
        : `/applications/${appId}/assign-mom`;
      const body = type === "scrutiny" ? { scrutiny_user_id: selectedUser } : { mom_user_id: selectedUser };
      await api.put(endpoint, body);
      toast.success(`${type === "scrutiny" ? "Scrutiny" : "MoM"} officer assigned`);
      setAssignModal(null);
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.error || "Assignment failed");
    }
  };

  const columns = [
    { key: "reference_number", label: "Ref #" },
    { key: "project_name", label: "Project Name" },
    {
      key: "applicant", label: "Applicant",
      render: (r) => r.applicant?.name || "—",
    },
    {
      key: "category", label: "Category",
      render: (r) => r.category?.code || "—",
    },
    {
      key: "sector", label: "Sector",
      render: (r) => r.sector?.name || "—",
    },
    {
      key: "status", label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions", label: "Actions",
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); openAssign(r.id, "scrutiny"); }}
            className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded hover:bg-yellow-100"
            title="Assign Scrutiny">🔍</button>
          <button onClick={(e) => { e.stopPropagation(); openAssign(r.id, "mom"); }}
            className="text-xs px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100"
            title="Assign MoM">📅</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="All Applications" subtitle="View and manage all EC applications" />

      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" placeholder="Search ref # or project…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring w-56" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "All Statuses"}</option>)}
        </select>
        <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </select>
        <select value={secFilter} onChange={(e) => { setSecFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
          <option value="">All Sectors</option>
          {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <>
          <DataTable columns={columns} data={apps}
            onRowClick={(r) => router.push(`/admin/applications/${r.id}`)}
            emptyMessage="No applications found" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-4">
              Assign {assignModal.type === "scrutiny" ? "Scrutiny Officer" : "MoM Officer"}
            </h3>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring mb-4">
              <option value="">Select team member…</option>
              {teamUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setAssignModal(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button onClick={handleAssign} disabled={!selectedUser}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminApplicationsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout><ApplicationsContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
