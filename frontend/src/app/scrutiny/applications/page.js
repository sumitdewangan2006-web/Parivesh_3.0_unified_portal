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

function ScrutinyApplicationsContent() {
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
      const { data } = await api.get("/scrutiny/applications", { params });
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
    { key: "reference_number", label: "Ref #" },
    { key: "project_name", label: "Project Name" },
    { key: "applicant", label: "Applicant", render: (r) => r.applicant?.name || "—" },
    { key: "category", label: "Category", render: (r) => r.category?.code || "—" },
    { key: "sector", label: "Sector", render: (r) => r.sector?.name || "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "submitted", label: "Submitted",
      render: (r) => r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("en-IN") : "—",
    },
  ];

  return (
    <>
      <PageHeader title="Assigned Applications" subtitle="Review applications assigned to you for scrutiny" />

      <div className="flex gap-3 mb-4">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_scrutiny">Under Scrutiny</option>
          <option value="essential_document_sought">Essential Document Sought</option>
          <option value="referred">Referred</option>
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <>
          <DataTable columns={columns} data={apps}
            onRowClick={(r) => router.push(`/scrutiny/applications/${r.id}`)}
            emptyMessage="No applications assigned yet" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </>
  );
}

export default function ScrutinyApplicationsPage() {
  return (
    <ProtectedRoute allowedRoles={["scrutiny_team", "admin"]}>
      <DashboardLayout><ScrutinyApplicationsContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
