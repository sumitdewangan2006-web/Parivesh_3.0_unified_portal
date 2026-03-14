"use client";

// ── Scrutiny: Document Review Page ───────────────────────────────────

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DocumentList from "@/components/DocumentList";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { getDocumentTypeDefinitions, sortDocumentsByTypeOrder } from "@/lib/documentTypes";

function ScrutinyDocsContent() {
  const { id } = useParams();
  const router = useRouter();
  const [app, setApp] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [sectorRules, setSectorRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [appRes, docsRes] = await Promise.all([
          api.get(`/applications/${id}`),
          api.get(`/documents/application/${id}`),
        ]);
        setApp(appRes.data);
        setDocuments(sortDocumentsByTypeOrder(docsRes.data));

        if (appRes.data?.sector_id) {
          const { data: rules } = await api.get(`/config/sectors/${appRes.data.sector_id}/document-rules`);
          setSectorRules(rules || []);
        } else {
          setSectorRules([]);
        }
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!app) return <p className="text-center py-20 text-gray-500">Application not found</p>;

  const definitions = getDocumentTypeDefinitions({
    categoryCode: app.category?.code,
    mineralType: app.mineral_type,
    sectorRules,
  });
  const grouped = {};
  documents.forEach((d) => {
    if (!grouped[d.document_type]) grouped[d.document_type] = [];
    grouped[d.document_type].push(d);
  });

  return (
    <>
      <PageHeader title="Document Review" subtitle={`${app.reference_number} — ${app.project_name}`}>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/scrutiny/applications/${id}`)}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium">
            Back to Review
          </button>
          <button onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">← Back</button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Summary */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">All Documents ({documents.length})</h3>
            <span className="text-sm text-gray-500">{Object.keys(grouped).length} document types</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Use the 👁️ Preview action to review documents online without downloading.</p>
        </div>

        {/* Grouped by document type */}
        {definitions.map((definition) => {
          const docs = grouped[definition.value] || [];

          return (
            <div key={definition.value} className="card">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{definition.label}</h3>
                  <p className="text-sm text-gray-500 mt-1">{definition.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    definition.required ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    {definition.required ? "Required" : "Optional"}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{docs.length} file{docs.length === 1 ? "" : "s"}</p>
                </div>
              </div>

              {docs.length > 0 ? (
                <DocumentList
                  documents={docs}
                  applicationId={id}
                  canDelete={false}
                  showVersions
                />
              ) : (
                <div className={`rounded-lg border px-4 py-3 text-sm ${
                  definition.required ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 bg-gray-50 text-gray-500"
                }`}>
                  {definition.required
                    ? "Required document has not been uploaded yet."
                    : "No document uploaded for this optional type."}
                </div>
              )}
            </div>
          );
        })}

        {documents.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-gray-500">No documents have been uploaded for this application.</p>
          </div>
        )}
      </div>
    </>
  );
}

export default function ScrutinyDocumentsPage() {
  return (
    <ProtectedRoute allowedRoles={["scrutiny_team", "admin"]}>
      <DashboardLayout><ScrutinyDocsContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
