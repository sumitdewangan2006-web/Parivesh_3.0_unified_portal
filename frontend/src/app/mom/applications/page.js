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
  "", "referred", "mom_generated", "finalized",
];

function MomApplicationsContent() {
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
      else params.status = "referred"; // default filter
      const { data } = await api.get("/applications", { params });
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
  ];

  return (
    <>
      <PageHeader title="Applications for MoM" subtitle="Applications eligible for or undergoing meeting process" />

      <div className="flex gap-3 mb-4">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "Referred"}</option>
          ))}
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
    </>
  );
}

export default function MomApplicationsPage() {
  return (
    <ProtectedRoute allowedRoles={["mom_team", "admin"]}>
      <DashboardLayout><MomApplicationsContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
