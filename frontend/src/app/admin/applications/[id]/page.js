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
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";

function AppDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [app, setApp] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrutinyUsers, setScrutinyUsers] = useState([]);
  const [momUsers, setMomUsers] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [appRes, histRes] = await Promise.all([
          api.get(`/applications/${id}`),
          api.get(`/applications/${id}/history`),
        ]);
        setApp(appRes.data);
        setHistory(histRes.data);

        // Admin-only: load users for officer assignment (ignore if not admin)
        try {
          const [scrutinyRes, momRes] = await Promise.all([
            api.get("/admin/users", { params: { role: "scrutiny_team", limit: 100 } }),
            api.get("/admin/users", { params: { role: "mom_team", limit: 100 } }),
          ]);
          setScrutinyUsers(scrutinyRes.data.users || []);
          setMomUsers(momRes.data.users || []);
        } catch { /* non-admin users won't have access */ }
      } catch {
        toast.error("Failed to load application");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const assignScrutiny = async (userId) => {
    setAssigning(true);
    try {
      const { data } = await api.put(`/applications/${id}/assign-scrutiny`, { scrutiny_user_id: userId });
      setApp(data);
      toast.success("Scrutiny officer assigned");
      const histRes = await api.get(`/applications/${id}/history`);
      setHistory(histRes.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const assignMom = async (userId) => {
    setAssigning(true);
    try {
      const { data } = await api.put(`/applications/${id}/assign-mom`, { mom_user_id: userId });
      setApp(data);
      toast.success("MoM officer assigned");
    } catch (err) {
      toast.error(err.response?.data?.error || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!app) return <p className="text-center py-20 text-gray-500">Application not found</p>;

  return (
    <>
      <PageHeader title={app.reference_number || "Application Detail"} subtitle={app.project_name}>
        <button onClick={() => router.back()}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">← Back</button>
      </PageHeader>

      <WorkflowTracker currentStatus={app.status} history={history} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Project Information</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Status</dt><dd><StatusBadge status={app.status} /></dd>
              <dt className="text-gray-500">Category</dt><dd>{app.category?.code} — {app.category?.name}</dd>
              <dt className="text-gray-500">Sector</dt><dd>{app.sector?.name}</dd>
              <dt className="text-gray-500">Applicant</dt><dd>{app.applicant?.name} ({app.applicant?.email})</dd>
              <dt className="text-gray-500">Location</dt><dd>{app.project_location || "—"}</dd>
              <dt className="text-gray-500">State</dt><dd>{app.project_state || "—"}</dd>
              <dt className="text-gray-500">District</dt><dd>{app.project_district || "—"}</dd>
              <dt className="text-gray-500">Est. Cost (₹)</dt><dd>{app.estimated_cost ? Number(app.estimated_cost).toLocaleString("en-IN") : "—"}</dd>
              <dt className="text-gray-500">Area (hectares)</dt><dd>{app.project_area || "—"}</dd>
              <dt className="text-gray-500">Scrutiny Officer</dt><dd>{app.scrutinyOfficer?.name || "Not assigned"}</dd>
              <dt className="text-gray-500">MoM Officer</dt><dd>{app.momOfficer?.name || "Not assigned"}</dd>
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
            <h3 className="font-semibold text-gray-900 mb-3">Documents ({app.documents?.length || 0})</h3>
            <DocumentList
              documents={app.documents || []}
              applicationId={id}
              canDelete={false}
              showVersions
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Panel — admin only */}
          {isAdmin && <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Officer Assignment</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Scrutiny Officer</label>
                <select
                  disabled={assigning}
                  value={app.assigned_scrutiny_id || ""}
                  onChange={(e) => e.target.value && assignScrutiny(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus-ring"
                >
                  <option value="">— Select scrutiny officer —</option>
                  {scrutinyUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">MoM Officer</label>
                <select
                  disabled={assigning}
                  value={app.assigned_mom_id || ""}
                  onChange={(e) => e.target.value && assignMom(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus-ring"
                >
                  <option value="">— Select MoM officer —</option>
                  {momUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>}

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Status History</h3>
            {history.length === 0 ? <p className="text-sm text-gray-500">No history yet</p> : (
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

          {/* Payments */}
          {app.payments?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Payments</h3>
              <ul className="space-y-2">
                {app.payments.map((p) => (
                  <li key={p.id} className="text-sm flex justify-between">
                    <span>₹{Number(p.amount).toLocaleString("en-IN")}</span>
                    <span className={`text-xs font-medium ${p.status === "completed" ? "text-green-600" : "text-yellow-600"}`}>
                      {p.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminAppDetailPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "mom_team"]}>
      <DashboardLayout><AppDetailContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
