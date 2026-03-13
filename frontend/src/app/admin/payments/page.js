"use client";

import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import toast from "react-hot-toast";

function PaymentsContent() {
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get("/payments", { params });
      setPayments(data.payments);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const columns = [
    { key: "transaction_id", label: "Transaction ID", render: (r) => r.transaction_id || "—" },
    {
      key: "application", label: "Application",
      render: (r) => r.application?.reference_number || r.application_id?.substring(0, 8) || "—",
    },
    {
      key: "amount", label: "Amount (₹)",
      render: (r) => Number(r.amount).toLocaleString("en-IN"),
    },
    { key: "payment_method", label: "Method", render: (r) => (r.payment_method || "upi").toUpperCase() },
    {
      key: "status", label: "Status",
      render: (r) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          r.status === "completed" ? "bg-green-100 text-green-700" :
          r.status === "pending" ? "bg-yellow-100 text-yellow-700" :
          "bg-red-100 text-red-700"
        }`}>{r.status}</span>
      ),
    },
    {
      key: "date", label: "Date",
      render: (r) => new Date(r.createdAt).toLocaleDateString("en-IN"),
    },
  ];

  return (
    <>
      <PageHeader title="Payments" subtitle="View all payment transactions" />

      <div className="flex gap-3 mb-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <>
          <DataTable columns={columns} data={payments} emptyMessage="No payments found" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </>
  );
}

export default function AdminPaymentsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout><PaymentsContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
