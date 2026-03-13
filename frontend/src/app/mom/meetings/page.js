"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import toast from "react-hot-toast";

function MeetingsContent() {
  const router = useRouter();
  const [meetings, setMeetings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", meeting_date: "", venue: "", agenda: "" });
  const [saving, setSaving] = useState(false);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get("/meetings", { params });
      setMeetings(data.meetings);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/meetings", form);
      toast.success("Meeting created");
      setShowModal(false);
      setForm({ title: "", meeting_date: "", venue: "", agenda: "" });
      router.push(`/mom/meetings/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create meeting");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      finalized: "bg-blue-100 text-blue-700",
      published: "bg-green-100 text-green-700",
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  const columns = [
    { key: "title", label: "Meeting Title" },
    {
      key: "meeting_date", label: "Date",
      render: (r) => r.meeting_date ? new Date(r.meeting_date).toLocaleDateString("en-IN") : "—",
    },
    { key: "venue", label: "Venue", render: (r) => r.venue || "—" },
    { key: "status", label: "Status", render: (r) => statusBadge(r.status) },
    {
      key: "apps", label: "Applications",
      render: (r) => r.applications?.length || r.MeetingApplications?.length || 0,
    },
  ];

  return (
    <>
      <PageHeader title="EAC Meetings" subtitle="Manage Expert Appraisal Committee meetings">
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium transition">
          + New Meeting
        </button>
      </PageHeader>

      <div className="flex gap-3 mb-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="finalized">Finalized</option>
          <option value="published">Published</option>
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <>
          <DataTable columns={columns} data={meetings}
            onRowClick={(r) => router.push(`/mom/meetings/${r.id}`)}
            emptyMessage="No meetings found" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Create Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Schedule New Meeting</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Meeting Title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <input required type="datetime-local" value={form.meeting_date}
                onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <input placeholder="Venue (optional)" value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <textarea placeholder="Agenda (optional)" rows={3} value={form.agenda}
                onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                  {saving ? "Creating…" : "Create Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function MomMeetingsPage() {
  return (
    <ProtectedRoute allowedRoles={["mom_team", "admin"]}>
      <DashboardLayout><MeetingsContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
