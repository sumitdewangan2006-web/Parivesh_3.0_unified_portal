"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import toast from "react-hot-toast";

function MeetingDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add applications
  const [availableApps, setAvailableApps] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);
  const [showAddApps, setShowAddApps] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);

  // Edit
  const [editMinutes, setEditMinutes] = useState("");
  const [editAgenda, setEditAgenda] = useState("");
  const [savingMinutes, setSavingMinutes] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/meetings/${id}`);
      setMeeting(data);
      setEditMinutes(data.minutes || "");
      setEditAgenda(data.agenda || "");
    } catch {
      toast.error("Failed to load meeting");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const openAddApps = async () => {
    setShowAddApps(true);
    setLoadingApps(true);
    try {
      const { data } = await api.get("/applications", { params: { status: "referred", limit: 100 } });
      setAvailableApps(data.applications || []);
    } catch {
      toast.error("Failed to load available applications");
    } finally {
      setLoadingApps(false);
    }
  };

  const handleAddApps = async () => {
    if (selectedApps.length === 0) return;
    try {
      await api.post(`/meetings/${id}/applications`, { application_ids: selectedApps });
      toast.success(`${selectedApps.length} application(s) added`);
      setShowAddApps(false);
      setSelectedApps([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add applications");
    }
  };

  const handleSaveMinutes = async () => {
    setSavingMinutes(true);
    try {
      await api.put(`/meetings/${id}`, { agenda: editAgenda, minutes: editMinutes });
      toast.success("Saved");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed");
    } finally {
      setSavingMinutes(false);
    }
  };

  const handleDecision = async (applicationId, currentDecision) => {
    const decision = prompt("Enter decision for this application:", currentDecision || "");
    if (decision === null) return;
    try {
      await api.put(`/meetings/${id}/applications/${applicationId}/decision`, { decision });
      toast.success("Decision recorded");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const handleFinalize = async () => {
    if (!confirm("Finalize this meeting? This cannot be undone.")) return;
    try {
      await api.post(`/meetings/${id}/finalize`);
      toast.success("Meeting finalized");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Finalize failed");
    }
  };

  const handlePublish = async () => {
    if (!confirm("Publish meeting and MoM? All linked applications will be finalized.")) return;
    try {
      await api.post(`/meetings/${id}/publish`);
      toast.success("Meeting published — MoM finalized");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Publish failed");
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/meetings/${id}/export/${format}`, { responseType: "blob" });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `MoM_${meeting?.title?.replace(/[^a-zA-Z0-9]/g, "_") || "export"}.${format === "docx" ? "docx" : "pdf"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error(`Export failed`);
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!meeting) return <p className="text-center py-20 text-gray-500">Meeting not found</p>;

  const isDraft = meeting.status === "draft";
  const isFinalized = meeting.status === "finalized";
  const isPublished = meeting.status === "published";
  const isLocked = isFinalized || isPublished;
  const applications = meeting.applications || [];

  return (
    <>
      <PageHeader title={meeting.title} subtitle={meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleString("en-IN") : ""}>
        <div className="flex gap-2 flex-wrap">
          {isDraft && (
            <>
              <button onClick={openAddApps}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium">
                + Add Applications
              </button>
              <button onClick={handleFinalize}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                Finalize Meeting
              </button>
            </>
          )}
          {isFinalized && (
            <button onClick={handlePublish}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
              📢 Publish MoM
            </button>
          )}
          {isLocked && (
            <>
              <button onClick={() => handleExport("docx")}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium">
                📄 Export Word
              </button>
              <button onClick={() => handleExport("pdf")}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">
                📄 Export PDF
              </button>
            </>
          )}
          <button onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">← Back</button>
        </div>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Meeting Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Meeting Details</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Status</dt>
              <dd>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  meeting.status === "published" ? "bg-green-100 text-green-700" :
                  meeting.status === "finalized" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-700"
                }`}>{meeting.status}</span>
              </dd>
              <dt className="text-gray-500">Date</dt>
              <dd>{meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleString("en-IN") : "—"}</dd>
              <dt className="text-gray-500">Venue</dt><dd>{meeting.venue || "—"}</dd>
              <dt className="text-gray-500">Applications</dt><dd>{applications.length}</dd>
            </dl>
          </div>

          {/* Agenda & Minutes (editable in draft) */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Agenda & Minutes</h3>
              {isDraft && (
                <button onClick={handleSaveMinutes} disabled={savingMinutes}
                  className="text-sm text-primary-600 hover:underline disabled:opacity-50">
                  {savingMinutes ? "Saving…" : "Save"}
                </button>
              )}
              {isLocked && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">🔒 Locked</span>
              )}
            </div>
            {isDraft ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
                  <textarea rows={3} value={editAgenda}
                    onChange={(e) => setEditAgenda(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minutes of Meeting</label>
                  <textarea rows={6} value={editMinutes}
                    onChange={(e) => setEditMinutes(e.target.value)}
                    placeholder="Record meeting minutes here…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {meeting.agenda && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Agenda</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{meeting.agenda}</p>
                  </div>
                )}
                {meeting.minutes && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Minutes</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{meeting.minutes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Applications in meeting */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Agenda Applications ({applications.length})</h3>
            {applications.length === 0 ? (
              <p className="text-sm text-gray-500">No applications added yet</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {applications.map((app) => {
                  const pivot = app.MeetingApplication || {};
                  return (
                    <div key={app.id} className="py-3 flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{app.reference_number}</span>
                          <StatusBadge status={app.status} />
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{app.project_name}</p>
                        {pivot.agenda_item_number && (
                          <span className="text-xs text-gray-400">Agenda Item #{pivot.agenda_item_number}</span>
                        )}
                        {pivot.decision && (
                          <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded mt-1 inline-block">
                            Decision: {pivot.decision}
                          </p>
                        )}
                      </div>
                      {isDraft && (
                        <button onClick={() => handleDecision(app.id, pivot.decision)}
                          className="text-xs px-2 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded hover:bg-primary-100">
                          Record Decision
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2 text-sm">
              {isDraft && <p className="text-gray-500">Add applications and record decisions, then finalize.</p>}
              {isFinalized && <p className="text-gray-500">Review the minutes and publish when ready. MoM is locked.</p>}
              {isPublished && <p className="text-green-600 font-medium">✓ Meeting published &amp; MoM finalized successfully</p>}
              {isLocked && <p className="text-red-500 text-xs mt-2">🔒 Editing is locked after finalization.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Add Applications Modal */}
      {showAddApps && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Add Applications to Meeting</h3>
            {loadingApps ? <LoadingSpinner className="py-10" /> : (
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {availableApps.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No applications approved for meeting</p>
                ) : availableApps.map((app) => (
                  <label key={app.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedApps.includes(app.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedApps((p) => [...p, app.id]);
                        else setSelectedApps((p) => p.filter((x) => x !== app.id));
                      }}
                      className="rounded border-gray-300" />
                    <div className="text-sm">
                      <div className="font-medium">{app.reference_number}</div>
                      <div className="text-gray-500">{app.project_name}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <button onClick={() => { setShowAddApps(false); setSelectedApps([]); }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddApps} disabled={selectedApps.length === 0}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                Add {selectedApps.length} Application(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MeetingDetailPage() {
  return (
    <ProtectedRoute allowedRoles={["mom_team", "admin"]}>
      <DashboardLayout><MeetingDetailContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
