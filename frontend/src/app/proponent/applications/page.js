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
import Link from "next/link";

const STATUSES = [
  "", "draft", "submitted", "under_scrutiny", "essential_document_sought",
  "referred", "mom_generated", "finalized",
];

function MyApplicationsContent() {
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (status) params.status = status;
      const { data } = await api.get("/applications/my", { params });
      setApps(data.applications);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const columns = [
    { key: "reference_number", label: "Ref #", render: (r) => r.reference_number || "Draft" },
    { key: "project_name", label: "Project Name" },
    { key: "category", label: "Category", render: (r) => r.category?.code || "—" },
    { key: "sector", label: "Sector", render: (r) => r.sector?.name || "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "date", label: "Submitted",
      render: (r) => r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("en-IN") : "—",
    },
  ];

  return (
    <>
      <PageHeader title="My Applications" subtitle="Track your environmental clearance applications">
        <Link href="/proponent/applications/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium transition inline-block">
          + New Application
        </Link>
      </PageHeader>

      <div className="flex gap-3 mb-4">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "All Statuses"}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <>
          <DataTable columns={columns} data={apps}
            onRowClick={(r) => router.push(`/proponent/applications/${r.id}`)}
            emptyMessage="You haven't created any applications yet." />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </>
  );
}

export default function ProponentApplicationsPage() {
  return (
    <ProtectedRoute allowedRoles={["project_proponent"]}>
      <DashboardLayout><MyApplicationsContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
