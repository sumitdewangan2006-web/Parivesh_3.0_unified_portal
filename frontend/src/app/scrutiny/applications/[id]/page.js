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
import { EDS_POINTS, MINERAL_TYPE_LABELS } from "@/lib/checklistData";
import { getDocumentTypeDefinitions } from "@/lib/documentTypes";

const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function ReviewContent() {
  const { id } = useParams();
  const router = useRouter();

  const [app, setApp] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edsPoints, setEdsPoints] = useState(EDS_POINTS);
  const [sectorRules, setSectorRules] = useState([]);
  const [risk, setRisk] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [citizenObservations, setCitizenObservations] = useState([]);
  const [citizenLoading, setCitizenLoading] = useState(false);
  const [moderatingObservationId, setModeratingObservationId] = useState(null);

  const [remarkType, setRemarkType] = useState("comment");
  const [remarkContent, setRemarkContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedEdsPoints, setSelectedEdsPoints] = useState([]);
  const [showEdsLibrary, setShowEdsLibrary] = useState(false);

  const toggleEdsPoint = (point) => {
    setSelectedEdsPoints((prev) =>
      prev.includes(point) ? prev.filter((p) => p !== point) : [...prev, point]
    );
  };

  const buildEdsReasonFromSelection = () => {
    if (!selectedEdsPoints.length) return "";
    return selectedEdsPoints.map((p, i) => `${i + 1}. ${p}`).join("\n");
  };

  const appendSelectedEdsToRemark = () => {
    const reason = buildEdsReasonFromSelection();
    if (!reason) {
      toast.error("Select at least one EDS point first");
      return;
    }
    setRemarkType("query");
    setRemarkContent((prev) => (prev ? `${prev}\n\n${reason}` : reason));
    toast.success("Selected EDS points appended");
  };

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

  const loadCitizenObservations = async (applicationId) => {
    setCitizenLoading(true);
    try {
      const { data } = await api.get(`/citizen-audit/application/${applicationId}/observations`);
      setCitizenObservations(Array.isArray(data.observations) ? data.observations : []);
    } catch {
      setCitizenObservations([]);
    } finally {
      setCitizenLoading(false);
    }
  };

  const moderateCitizenObservation = async (observationId, status) => {
    setModeratingObservationId(observationId);
    try {
      await api.put(`/citizen-audit/observations/${observationId}/status`, { status });
      toast.success(`Observation marked as ${status}`);
      if (app?.id) {
        await loadCitizenObservations(app.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update observation status");
    } finally {
      setModeratingObservationId(null);
    }
  };

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

      const auxCalls = [api.get("/scrutiny/eds-points")];
      if (appRes.data?.sector_id) {
        auxCalls.push(api.get(`/config/sectors/${appRes.data.sector_id}/document-rules`));
      }

      const auxResults = await Promise.all(auxCalls);
      if (Array.isArray(auxResults[0]?.data) && auxResults[0].data.length) {
        setEdsPoints(auxResults[0].data);
      }

      if (auxResults[1]?.data) {
        setSectorRules(auxResults[1].data);
      } else {
        setSectorRules([]);
      }

      await loadRiskAnalysis(id);
      await loadCitizenObservations(appRes.data.id);
    } catch {
      toast.error("Failed to load application");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

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
      const res = await api.post(`/scrutiny/applications/${id}/approve`, {
        remarks: "Application referred for meeting after scrutiny review",
      });
      toast.success("Application referred for meeting");
      if (res.data.gistGenerated) {
        toast.success("Meeting gist auto-generated from template", { duration: 5000 });
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Approval failed");
    }
  };

  const handleSendBack = async (reasonOverride = "") => {
    const reason = reasonOverride || prompt("Specify essential documents sought / reason for sending back:");
    if (!reason) return;
    try {
      await api.post(`/scrutiny/applications/${id}/send-back`, { remarks: reason });
      toast.success("Essential Document Sought: application sent back");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const handleSendBackWithSelectedEds = async () => {
    const reason = buildEdsReasonFromSelection();
    if (!reason) {
      toast.error("Select at least one EDS point first");
      return;
    }
    await handleSendBack(reason);
  };

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!app) return <p className="text-center py-20 text-gray-500">Application not found</p>;

  const canReview = ["submitted", "under_scrutiny", "essential_document_sought"].includes(app.status);
  const checklist = getDocumentTypeDefinitions({
    categoryCode: app.category?.code,
    mineralType: app.mineral_type,
    sectorRules,
  });
  const uploadedTypes = new Set((app.documents || []).map((doc) => doc.document_type));
  const missingRequiredDocs = checklist.filter((doc) => doc.required && !uploadedTypes.has(doc.value));
  const canRefer = app.status === "under_scrutiny" && missingRequiredDocs.length === 0;

  return (
    <>
      <PageHeader title={app.reference_number} subtitle={`Scrutiny Review - ${app.project_name}`}>
        <div className="flex gap-2 flex-wrap">
          {canReview && (
            <>
              <button
                onClick={handleApprove}
                disabled={!canRefer}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Refer for Meeting
              </button>
              <button
                onClick={() => handleSendBack()}
                className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium"
              >
                Essential Document Sought
              </button>
              {selectedEdsPoints.length > 0 && (
                <button
                  onClick={handleSendBackWithSelectedEds}
                  className="px-4 py-2 text-sm bg-amber-700 text-white rounded-md hover:bg-amber-800 font-medium"
                >
                  Send Back with {selectedEdsPoints.length} EDS Point{selectedEdsPoints.length > 1 ? "s" : ""}
                </button>
              )}
            </>
          )}
          <Link
            href={`/scrutiny/applications/${id}/documents`}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
          >
            View Documents
          </Link>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
          <Link
            href={`/citizen-audit/${encodeURIComponent(app.reference_number || "")}`}
            target="_blank"
            className="px-4 py-2 text-sm border border-emerald-300 text-emerald-700 rounded-md hover:bg-emerald-50"
          >
            Open Public Citizen Audit
          </Link>
        </div>
      </PageHeader>

      <WorkflowTracker currentStatus={app.status} history={history} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Project Information</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Status</dt>
              <dd><StatusBadge status={app.status} /></dd>

              <dt className="text-gray-500">Category</dt>
              <dd>{app.category?.code} - {app.category?.name}</dd>

              <dt className="text-gray-500">Sector</dt>
              <dd>{app.sector?.name}</dd>

              <dt className="text-gray-500">Mineral / Project Type</dt>
              <dd>{MINERAL_TYPE_LABELS[app.mineral_type] || app.mineral_type || "-"}</dd>

              <dt className="text-gray-500">Applicant</dt>
              <dd>{app.applicant?.name} ({app.applicant?.email})</dd>

              <dt className="text-gray-500">Location</dt>
              <dd>{app.project_location || "-"}</dd>

              <dt className="text-gray-500">State / District</dt>
              <dd>{[app.project_state, app.project_district].filter(Boolean).join(", ") || "-"}</dd>

              <dt className="text-gray-500">Khasra No.</dt>
              <dd>{app.khasra_no || "-"}</dd>

              <dt className="text-gray-500">Lease Area</dt>
              <dd>{app.lease_area ? `${app.lease_area} ha` : "-"}</dd>

              <dt className="text-gray-500">Area</dt>
              <dd>{app.project_area ? `${app.project_area} ha` : "-"}</dd>

              <dt className="text-gray-500">Est. Cost</dt>
              <dd>{app.estimated_cost ? `INR ${Number(app.estimated_cost).toLocaleString("en-IN")}` : "-"}</dd>
            </dl>
            {!canRefer && app.status === "under_scrutiny" && (
              <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                Referral is locked until all mandatory checklist documents are uploaded.
                {missingRequiredDocs.length > 0 ? ` Pending: ${missingRequiredDocs.length}` : ""}
              </p>
            )}
          </div>

          {app.project_description && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.project_description}</p>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Documents ({app.documents?.length || 0})</h3>
              <Link href={`/scrutiny/applications/${id}/documents`} className="text-xs text-primary-600 hover:underline">
                View All
              </Link>
            </div>
            <DocumentList
              documents={app.documents || []}
              applicationId={id}
              canDelete={false}
              showVersions
            />
          </div>

          {canReview && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Add Remark</h3>
              <form onSubmit={addRemark} className="space-y-3">
                <select
                  value={remarkType}
                  onChange={(e) => setRemarkType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                >
                  <option value="comment">Comment</option>
                  <option value="query">Essential Document Sought (EDS)</option>
                  <option value="correction">Correction Required</option>
                </select>

                <textarea
                  required
                  rows={3}
                  value={remarkContent}
                  onChange={(e) => setRemarkContent(e.target.value)}
                  placeholder="Enter your remark..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                />

                {remarkType === "query" && (
                  <div className="border border-amber-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-900">Standard EDS Points</p>
                        <p className="text-xs text-amber-700">Select points from organizer checklist and append to remark</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEdsLibrary((v) => !v)}
                        className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-800 hover:bg-amber-100"
                      >
                        {showEdsLibrary ? "Hide" : "Show"}
                      </button>
                    </div>

                    {showEdsLibrary && (
                      <div className="p-3 bg-white space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={appendSelectedEdsToRemark}
                            className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                          >
                            Append Selected ({selectedEdsPoints.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedEdsPoints([])}
                            className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Clear Selection
                          </button>
                        </div>

                        <div className="max-h-56 overflow-auto border border-gray-200 rounded-md divide-y divide-gray-100">
                          {edsPoints.map((point, idx) => {
                            const checked = selectedEdsPoints.includes(point);
                            return (
                              <label
                                key={`${idx}-${point.slice(0, 20)}`}
                                className={`flex items-start gap-2 p-2 text-xs cursor-pointer ${checked ? "bg-amber-50" : "bg-white"}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleEdsPoint(point)}
                                  className="mt-0.5"
                                />
                                <span className="text-gray-700">{point}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 font-medium"
                >
                  {submitting ? "Adding..." : "Add Remark"}
                </button>
              </form>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Remarks ({remarks.length})</h3>
            {remarks.length === 0 ? (
              <p className="text-sm text-gray-500">No remarks yet</p>
            ) : (
              <ul className="space-y-3">
                {remarks.map((r) => (
                  <li key={r.id} className="border-l-2 border-gray-200 pl-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          r.remark_type === "query"
                            ? "bg-yellow-100 text-yellow-700"
                            : r.remark_type === "correction"
                              ? "bg-red-100 text-red-700"
                              : r.remark_type === "approval"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.remark_type === "query" ? "EDS" : r.remark_type}
                      </span>
                      <span className="text-gray-400 text-xs">{r.author?.name || "Reviewer"}</span>
                      <span className="text-gray-300 text-xs">{new Date(r.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{r.content}</p>
                    {r.remark_type === "query" && !r.is_resolved && (
                      <button
                        onClick={() => resolveRemark(r.id)}
                        className="mt-1 text-xs text-green-600 hover:underline"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {r.is_resolved && <span className="text-xs text-green-600 mt-1 inline-block">Resolved</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Citizen Audit Feed</h3>
              <button
                onClick={() => app?.id && loadCitizenObservations(app.id)}
                disabled={citizenLoading}
                className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {citizenLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {citizenLoading ? (
              <p className="text-sm text-gray-500">Loading citizen observations...</p>
            ) : citizenObservations.length === 0 ? (
              <p className="text-sm text-gray-500">
                No citizen observations have been submitted yet.
              </p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-auto pr-1">
                {citizenObservations.slice(0, 12).map((item) => (
                  <li key={item.id} className="border border-gray-200 rounded p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-800 truncate">{item.citizen_name || "Anonymous Citizen"}</p>
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                          item.status === "published"
                            ? "bg-green-100 text-green-700"
                            : item.status === "flagged"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{item.observation_text}</p>

                    {(item.latitude !== null || item.longitude !== null) && (
                      <p className="text-[11px] text-gray-500 mt-1">Geo-tag: {item.latitude ?? "-"}, {item.longitude ?? "-"}</p>
                    )}

                    {Array.isArray(item.biodiversity_tags) && item.biodiversity_tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.biodiversity_tags.map((tag) => (
                          <span key={`${item.id}-${tag}`} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.photo_url && (
                      <img
                        src={`${PUBLIC_API_BASE}${item.photo_url}`}
                        alt="Citizen observation"
                        className="mt-2 max-h-32 rounded border border-gray-200 object-cover"
                      />
                    )}

                    <div className="mt-2 flex flex-wrap gap-1">
                      <button
                        onClick={() => moderateCitizenObservation(item.id, "published")}
                        disabled={moderatingObservationId === item.id}
                        className="text-[11px] px-2 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => moderateCitizenObservation(item.id, "flagged")}
                        disabled={moderatingObservationId === item.id}
                        className="text-[11px] px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                      >
                        Flag
                      </button>
                      <button
                        onClick={() => moderateCitizenObservation(item.id, "removed")}
                        disabled={moderatingObservationId === item.id}
                        className="text-[11px] px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
                <div
                  className={`rounded-lg border p-3 ${
                    risk.risk_level === "High"
                      ? "bg-red-50 border-red-200"
                      : risk.risk_level === "Medium"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-green-50 border-green-200"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500">Project Risk Score</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {risk.risk_score}/100
                    <span className="text-sm font-semibold ml-2">({risk.risk_level})</span>
                  </p>
                </div>

                {risk.summary && <p className="text-sm text-gray-700">{risk.summary}</p>}

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
                Risk analysis is available and can be generated on demand.
              </p>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Status History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No history</p>
            ) : (
              <ol className="space-y-3">
                {history.map((h, i) => (
                  <li key={i} className="text-sm border-l-2 border-primary-200 pl-3">
                    <div className="font-medium">
                      {h.from_status ? (
                        <>
                          <StatusBadge status={h.from_status} /> to
                        </>
                      ) : null}{" "}
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
      <DashboardLayout>
        <ReviewContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
