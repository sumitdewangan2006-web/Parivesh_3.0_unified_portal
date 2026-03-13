"use client";

// ── Proponent: Document Management Page ──────────────────────────────

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DocumentUploader from "@/components/DocumentUploader";
import DocumentList from "@/components/DocumentList";
import api from "@/lib/api";
import toast from "react-hot-toast";

function DocumentsContent() {
  const { id } = useParams();
  const router = useRouter();
  const [app, setApp] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
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
  };

  useEffect(() => { loadData(); }, [id]);

  const handleUploadComplete = (newDoc) => {
    setDocuments((prev) => {
      // Replace superseded versions
      const updated = prev.map((d) =>
        d.document_type === newDoc.document_type && d.id !== newDoc.id
          ? { ...d, is_active: false }
          : d
      );
      return [newDoc, ...updated.filter((d) => d.is_active !== false)];
    });
  };

  const handleDocDeleted = (docId) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!app) return <p className="text-center py-20 text-gray-500">Application not found</p>;

  const canUpload = ["draft", "essential_document_sought"].includes(app.status);

  return (
    <>
      <PageHeader title="Documents" subtitle={`${app.reference_number || "Draft"} — ${app.project_name}`}>
        <button onClick={() => router.back()}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">← Back</button>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Section */}
          {canUpload && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Upload Document</h3>
              <DocumentUploader applicationId={id} onUploadComplete={handleUploadComplete} />
            </div>
          )}

          {/* Required Documents Checklist */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Document Checklist</h3>
            <DocumentChecklist documents={documents} categoryCode={app.category?.code} />
          </div>

          {/* All Documents */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Uploaded Documents ({documents.length})</h3>
            <DocumentList
              documents={documents}
              applicationId={id}
              onDocumentDeleted={handleDocDeleted}
              canDelete={canUpload}
              showVersions
            />
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Info</h3>
            <dl className="text-sm space-y-2">
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium capitalize">{app.status?.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd>{app.category?.code} — {app.category?.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Total Documents</dt>
                <dd className="font-medium">{documents.length}</dd>
              </div>
            </dl>
            {!canUpload && (
              <p className="text-xs text-yellow-600 mt-3 bg-yellow-50 p-2 rounded">
                Uploads are only allowed when the application is in Draft or Query Raised status.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Document Checklist ───────────────────────────────────────────────
function DocumentChecklist({ documents, categoryCode }) {
  const requiredDocs = [
    { type: "project_report", label: "Project Report", required: true },
    { type: "eia_report", label: "EIA Report", required: categoryCode === "A" },
    { type: "environmental_management_plan", label: "Environmental Management Plan", required: categoryCode === "A" },
    { type: "map_layout", label: "Map / Layout", required: true },
    { type: "noc_certificate", label: "NOC / Certificate", required: false },
    { type: "financial_document", label: "Financial Document", required: false },
    { type: "identity_proof", label: "Identity Proof", required: true },
  ];

  const uploadedTypes = new Set(documents.map((d) => d.document_type));

  return (
    <ul className="space-y-2">
      {requiredDocs.map((doc) => {
        const uploaded = uploadedTypes.has(doc.type);
        return (
          <li key={doc.type} className="flex items-center gap-2 text-sm">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              uploaded ? "bg-green-100 text-green-600" : doc.required ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-400"
            }`}>
              {uploaded ? "✓" : doc.required ? "!" : "—"}
            </span>
            <span className={uploaded ? "text-gray-700" : doc.required ? "text-gray-900 font-medium" : "text-gray-500"}>
              {doc.label}
            </span>
            {doc.required && !uploaded && (
              <span className="text-xs text-red-500">Required</span>
            )}
            {uploaded && (
              <span className="text-xs text-green-600">Uploaded</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function ProponentDocumentsPage() {
  return (
    <ProtectedRoute allowedRoles={["project_proponent"]}>
      <DashboardLayout><DocumentsContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
