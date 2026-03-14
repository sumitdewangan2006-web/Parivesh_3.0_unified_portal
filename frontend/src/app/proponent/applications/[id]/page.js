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
import DocumentUploader from "@/components/DocumentUploader";
import MockPaymentGateway from "@/components/MockPaymentGateway";
import api from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

function AppDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const [app, setApp] = useState(null);
  const [history, setHistory] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [risk, setRisk] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Payment state
  const [showPay, setShowPay] = useState(false);

  const loadRiskAnalysis = async (applicationId) => {
    setRiskLoading(true);
    try {
      const { data } = await api.get(`/applications/${applicationId}/risk-analysis`);
      setRisk(data);
    } catch {
      setRisk(null);
    } finally {
      setRiskLoading(false);
    }
  };

  const load = async () => {
    try {
      const [appRes, histRes] = await Promise.all([
        api.get(`/applications/${id}`),
        api.get(`/applications/${id}/history`),
      ]);
      setApp(appRes.data);
      setHistory(histRes.data);
      // Load remarks if in scrutiny
      if (["under_scrutiny", "essential_document_sought"].includes(appRes.data.status)) {
        try {
          const { data } = await api.get(`/scrutiny/applications/${id}/remarks`);
          setRemarks(data);
        } catch { /* proponent may not have access */ }
      }

      if (appRes.data.status !== "draft") {
        await loadRiskAnalysis(id);
      } else {
        setRisk(null);
      }
    } catch {
      toast.error("Failed to load application");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!app) return <p className="text-center py-20 text-gray-500">Application not found</p>;

  return (
    <>
      <PageHeader title={app.reference_number || "Draft Application"} subtitle={app.project_name}>
        <div className="flex gap-2">
          {app.status === "draft" && (
            <button onClick={() => setShowPay(true)}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
              💳 Pay & Submit
            </button>
          )}
          <Link href={`/proponent/applications/${id}/documents`}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium">
            📁 Manage Documents
          </Link>
          <button onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">← Back</button>
        </div>
      </PageHeader>

      <WorkflowTracker currentStatus={app.status} history={history} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upload area when query raised */}
          {app.status === "essential_document_sought" && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Upload Response to Query</h3>
              <DocumentUploader applicationId={id} onUploadComplete={() => load()} />
            </div>
          )}

          {/* Project Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Project Information</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Status</dt><dd><StatusBadge status={app.status} /></dd>
              <dt className="text-gray-500">Category</dt><dd>{app.category?.code} — {app.category?.name}</dd>
              <dt className="text-gray-500">Sector</dt><dd>{app.sector?.name}</dd>
              <dt className="text-gray-500">Location</dt><dd>{app.project_location || "—"}</dd>
              <dt className="text-gray-500">State</dt><dd>{app.project_state || "—"}</dd>
              <dt className="text-gray-500">District</dt><dd>{app.project_district || "—"}</dd>
              <dt className="text-gray-500">Khasra No.</dt><dd>{app.khasra_no || "—"}</dd>
              <dt className="text-gray-500">Lease Area</dt><dd>{app.lease_area ? `${app.lease_area} ha` : "—"}</dd>
              <dt className="text-gray-500">Est. Cost</dt><dd>{app.estimated_cost ? `₹${Number(app.estimated_cost).toLocaleString("en-IN")}` : "—"}</dd>
              <dt className="text-gray-500">Area</dt><dd>{app.project_area ? `${app.project_area} ha` : "—"}</dd>
            </dl>
            {app.status === "draft" && (
              <p className="mt-3 text-xs text-gray-500">
                This application is still a draft. Complete the EC fee payment to submit it to the scrutiny team.
              </p>
            )}
          </div>

          {app.project_description && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.project_description}</p>
            </div>
          )}

          {/* Remarks from scrutiny */}
          {remarks.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Scrutiny Remarks</h3>
              <ul className="space-y-3">
                {remarks.map((r) => (
                  <li key={r.id} className="border-l-2 border-yellow-300 pl-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        r.remark_type === "query" ? "bg-yellow-100 text-yellow-700" :
                        r.remark_type === "correction" ? "bg-red-100 text-red-700" :
                        r.remark_type === "approval" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{r.remark_type}</span>
                      <span className="text-gray-400 text-xs">{r.user?.name}</span>
                      {r.is_resolved && <span className="text-xs text-green-600">✓ Resolved</span>}
                    </div>
                    <p className="text-gray-700">{r.content}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Documents */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Documents ({app.documents?.length || 0})</h3>
              <Link href={`/proponent/applications/${id}/documents`}
                className="text-xs text-primary-600 hover:underline">Manage All →</Link>
            </div>
            <DocumentList
              documents={app.documents || []}
              applicationId={id}
              canDelete={["draft", "essential_document_sought"].includes(app.status)}
              onDocumentDeleted={() => load()}
              showVersions
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">AI Environmental Risk Analyzer</h3>
              <button
                onClick={() => loadRiskAnalysis(id)}
                disabled={riskLoading}
                className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {riskLoading ? "Analyzing..." : "Run Analysis"}
              </button>
            </div>

            {riskLoading && <p className="text-sm text-gray-500">Analyzing project risk signals...</p>}

            {!riskLoading && risk && (
              <div className="space-y-3">
                <div className={`rounded-lg border p-3 ${
                  risk.risk_level === "High"
                    ? "bg-red-50 border-red-200"
                    : risk.risk_level === "Medium"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-green-50 border-green-200"
                }`}>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Project Risk Score</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {risk.risk_score}/100
                    <span className="text-sm font-semibold ml-2">({risk.risk_level})</span>
                  </p>
                </div>

                {risk.summary && (
                  <p className="text-sm text-gray-700">{risk.summary}</p>
                )}

                {Array.isArray(risk.reasons) && risk.reasons.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Reasons</p>
                    <ul className="space-y-1">
                      {risk.reasons.slice(0, 4).map((reason, idx) => (
                        <li key={idx} className="text-sm text-gray-700">• {reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(risk.keyword_hits) && risk.keyword_hits.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Detected Risk Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {risk.keyword_hits.map((hit) => (
                        <span key={hit.keyword} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {hit.keyword} ({hit.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {risk.extracted_metrics && Object.values(risk.extracted_metrics).some((value) => value !== null && value !== false) && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Extracted Metrics</p>
                    <dl className="grid grid-cols-1 gap-1 text-sm text-gray-700">
                      {risk.extracted_metrics.wildlife_distance_km !== null && risk.extracted_metrics.wildlife_distance_km !== undefined && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500">Wildlife distance</dt>
                          <dd>{risk.extracted_metrics.wildlife_distance_km} km</dd>
                        </div>
                      )}
                      {risk.extracted_metrics.groundwater_usage_kld !== null && risk.extracted_metrics.groundwater_usage_kld !== undefined && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500">Groundwater usage</dt>
                          <dd>{risk.extracted_metrics.groundwater_usage_kld} KLD</dd>
                        </div>
                      )}
                      {risk.extracted_metrics.deforestation_area_ha !== null && risk.extracted_metrics.deforestation_area_ha !== undefined && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500">Deforestation area</dt>
                          <dd>{risk.extracted_metrics.deforestation_area_ha} ha</dd>
                        </div>
                      )}
                      {risk.extracted_metrics.pdf_text_extracted && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500">PDF text parsed</dt>
                          <dd>Yes</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {Array.isArray(risk.document_verification) && risk.document_verification.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Document Content Verification</p>
                    <ul className="space-y-1.5 max-h-52 overflow-auto pr-1">
                      {risk.document_verification.slice(0, 8).map((item) => (
                        <li key={item.id || `${item.document_type}-${item.original_name}`} className="text-xs border border-gray-200 rounded p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-gray-700 truncate">
                              {item.document_type || "document"}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-full font-semibold ${
                                item.status === "satisfied"
                                  ? "bg-green-100 text-green-700"
                                  : item.status === "insufficient"
                                    ? "bg-red-100 text-red-700"
                                    : item.status === "not_verified"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {item.status === "satisfied"
                                ? "Satisfied"
                                : item.status === "insufficient"
                                  ? "Insufficient"
                                  : item.status === "not_verified"
                                    ? "Not Verified"
                                    : "Not Checked"}
                            </span>
                          </div>
                          {item.score !== null && item.score !== undefined && (
                            <p className="text-[11px] text-gray-500 mt-0.5">Content score: {item.score}%</p>
                          )}
                          {item.message && <p className="text-[11px] text-gray-500 mt-0.5">{item.message}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!riskLoading && !risk && (
              <p className="text-sm text-gray-500">
                Risk analysis will appear after proposal submission and can also be generated on demand.
              </p>
            )}
          </div>

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

      {/* Payment Modal */}
      {showPay && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <MockPaymentGateway
              applicationId={id}
              onPaymentSuccess={() => {
                setShowPay(false);
                load();
              }}
              onCancel={() => setShowPay(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function ProponentAppDetailPage() {
  return (
    <ProtectedRoute allowedRoles={["project_proponent"]}>
      <DashboardLayout><AppDetailContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
