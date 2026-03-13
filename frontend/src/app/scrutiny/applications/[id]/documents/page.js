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

function ScrutinyDocsContent() {
  const { id } = useParams();
  const router = useRouter();
  const [app, setApp] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [appRes, docsRes] = await Promise.all([
          api.get(`/applications/${id}`),
          api.get(`/documents/application/${id}`),
        ]);
        setApp(appRes.data);
        setDocuments(docsRes.data);
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

  // Group by type
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
        </div>

        {/* Grouped by document type */}
        {Object.entries(grouped).map(([docType, docs]) => (
          <div key={docType} className="card">
            <h3 className="font-semibold text-gray-900 mb-2 capitalize">
              {docType.replace(/_/g, " ")}
              <span className="ml-2 text-sm font-normal text-gray-500">({docs.length} file{docs.length > 1 ? "s" : ""})</span>
            </h3>
            <DocumentList
              documents={docs}
              applicationId={id}
              canDelete={false}
              showVersions
            />
          </div>
        ))}

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
