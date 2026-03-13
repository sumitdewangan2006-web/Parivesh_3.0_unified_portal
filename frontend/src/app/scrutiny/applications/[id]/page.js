"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import WorkflowTracker from "@/components/WorkflowTracker";
import DocumentList from "@/components/DocumentList";
import api from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

function ReviewContent() {
  const { id } = useParams();
  const router = useRouter();
  const [app, setApp] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // New remark form
  const [remarkType, setRemarkType] = useState("comment");
  const [remarkContent, setRemarkContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [appRes, remarkRes, histRes] = await Promise.all([
        api.get(`/applications/${id}`),
        api.get(`/scrutiny/applications/${id}/remarks`),
        api.get(`/applications/${id}/history`),
      ]);
      setApp(appRes.data);
      setRemarks(remarkRes.data);
      setHistory(histRes.data);
    } catch {
      toast.error("Failed to load application");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const addRemark = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/scrutiny/applications/${id}/remarks`, {
        remark_type: remarkType,
        content: remarkContent,
      });
      toast.success("Remark added");
      setRemarkContent("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add remark");
    } finally {
      setSubmitting(false);
    }
  };

  const resolveRemark = async (remarkId) => {
    try {
      await api.put(`/scrutiny/remarks/${remarkId}/resolve`);
      toast.success("Query resolved");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to resolve");
    }
  };

  const handleApprove = async () => {
    if (!confirm("Approve and refer this application for EAC meeting?")) return;
    try {
      const res = await api.post(`/scrutiny/applications/${id}/approve`, { remarks: "Application referred for meeting after scrutiny review" });
      toast.success("Application referred for meeting");
      if (res.data.gistGenerated) {
        toast.success("Meeting gist auto-generated from template", { duration: 5000, icon: "📄" });
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Approval failed");
    }
  };

  const handleSendBack = async () => {
    const reason = prompt("Specify essential documents sought / reason for sending back:");
    if (!reason) return;
    try {
      await api.post(`/scrutiny/applications/${id}/send-back`, { remarks: reason });
      toast.success("Essential Document Sought — application sent back");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!app) return <p className="text-center py-20 text-gray-500">Application not found</p>;

  const canReview = ["submitted", "under_scrutiny", "essential_document_sought"].includes(app.status);

  return (
    <>
      <PageHeader title={app.reference_number} subtitle={`Scrutiny Review — ${app.project_name}`}>
        <div className="flex gap-2">
          {canReview && (
            <>
              <button onClick={handleApprove}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
                ✓ Refer for Meeting
              </button>
              <button onClick={handleSendBack}
                className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium">
                ↩ Essential Document Sought
              </button>
            </>
          )}
          <Link href={`/scrutiny/applications/${id}/documents`}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium">
            📁 View Documents
          </Link>
          <button onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">← Back</button>
        </div>
      </PageHeader>

      <WorkflowTracker currentStatus={app.status} history={history} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Project Information</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Status</dt><dd><StatusBadge status={app.status} /></dd>
              <dt className="text-gray-500">Category</dt><dd>{app.category?.code} — {app.category?.name}</dd>
              <dt className="text-gray-500">Sector</dt><dd>{app.sector?.name}</dd>
              <dt className="text-gray-500">Applicant</dt><dd>{app.applicant?.name} ({app.applicant?.email})</dd>
              <dt className="text-gray-500">Location</dt><dd>{app.project_location || "—"}</dd>
              <dt className="text-gray-500">State / District</dt><dd>{[app.project_state, app.project_district].filter(Boolean).join(", ") || "—"}</dd>
              <dt className="text-gray-500">Area</dt><dd>{app.project_area ? `${app.project_area} ha` : "—"}</dd>
              <dt className="text-gray-500">Est. Cost</dt><dd>{app.estimated_cost ? `₹${Number(app.estimated_cost).toLocaleString("en-IN")}` : "—"}</dd>
            </dl>
          </div>

          {app.project_description && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.project_description}</p>
            </div>
          )}

          {/* Documents */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Documents ({app.documents?.length || 0})</h3>
              <Link href={`/scrutiny/applications/${id}/documents`}
                className="text-xs text-primary-600 hover:underline">View All →</Link>
            </div>
            <DocumentList
              documents={app.documents || []}
              applicationId={id}
              canDelete={false}
              showVersions
            />
          </div>

          {/* Add Remark */}
          {canReview && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Add Remark</h3>
              <form onSubmit={addRemark} className="space-y-3">
                <select value={remarkType} onChange={(e) => setRemarkType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
                  <option value="comment">Comment</option>
                  <option value="query">Essential Document Sought (EDS)</option>
                  <option value="correction">Correction Required</option>
                </select>
                <textarea required rows={3} value={remarkContent}
                  onChange={(e) => setRemarkContent(e.target.value)}
                  placeholder="Enter your remark…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 font-medium">
                  {submitting ? "Adding…" : "Add Remark"}
                </button>
              </form>
            </div>
          )}

          {/* Remarks List */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Remarks ({remarks.length})</h3>
            {remarks.length === 0 ? <p className="text-sm text-gray-500">No remarks yet</p> : (
              <ul className="space-y-3">
                {remarks.map((r) => (
                  <li key={r.id} className="border-l-2 border-gray-200 pl-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        r.remark_type === "query" ? "bg-yellow-100 text-yellow-700" :
                        r.remark_type === "correction" ? "bg-red-100 text-red-700" :
                        r.remark_type === "approval" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{r.remark_type === "query" ? "EDS" : r.remark_type}</span>
                      <span className="text-gray-400 text-xs">{r.user?.name}</span>
                      <span className="text-gray-300 text-xs">{new Date(r.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                    <p className="text-gray-700">{r.content}</p>
                    {r.remark_type === "query" && !r.is_resolved && (
                      <button onClick={() => resolveRemark(r.id)}
                        className="mt-1 text-xs text-green-600 hover:underline">Mark Resolved</button>
                    )}
                    {r.is_resolved && <span className="text-xs text-green-600 mt-1 inline-block">✓ Resolved</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Status History</h3>
            {history.length === 0 ? <p className="text-sm text-gray-500">No history</p> : (
              <ol className="space-y-3">
                {history.map((h, i) => (
                  <li key={i} className="text-sm border-l-2 border-primary-200 pl-3">
                    <div className="font-medium">
                      {h.from_status ? <><StatusBadge status={h.from_status} /> → </> : null}
                      <StatusBadge status={h.to_status} />
                    </div>
                    {h.remarks && <p className="text-gray-500 mt-0.5">{h.remarks}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(h.createdAt).toLocaleString("en-IN")}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ScrutinyReviewPage() {
  return (
    <ProtectedRoute allowedRoles={["scrutiny_team", "admin"]}>
      <DashboardLayout><ReviewContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
