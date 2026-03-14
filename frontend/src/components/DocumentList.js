"use client";

// ── Reusable Document List ───────────────────────────────────────────
// Displays documents with version history, delete, download, inline preview

import { useState } from "react";
import Cookies from "js-cookie";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { DOCUMENT_TYPE_LABELS } from "@/lib/documentTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken() {
  if (typeof window === "undefined") return "";
  return Cookies.get("token") || "";
}

function downloadUrl(docId) {
  return `${API_BASE}/documents/${docId}/download?token=${encodeURIComponent(getToken())}`;
}

function previewUrl(docId) {
  return `${API_BASE}/documents/${docId}/preview?token=${encodeURIComponent(getToken())}`;
}

const fileIcon = (mime) => {
  if (!mime) return "📄";
  if (mime.includes("pdf")) return "📕";
  if (mime.includes("image")) return "🖼️";
  if (mime.includes("word") || mime.includes("doc")) return "📘";
  return "📄";
};

const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentList({
  documents = [],
  applicationId,
  onDocumentDeleted,
  canDelete = false,
  showVersions = true,
}) {
  const [versionModal, setVersionModal] = useState(null); // { docType, versions }
  const [previewDoc, setPreviewDoc] = useState(null); // { url, mimeType, originalName }
  const [loadingVersions, setLoadingVersions] = useState(false);

  const canIframePreview = (mimeType) => {
    if (!mimeType) return false;
    return (
      mimeType.includes("pdf") ||
      mimeType.includes("image") ||
      mimeType.startsWith("text/") ||
      mimeType.includes("html")
    );
  };

  const handleDelete = async (docId, docName) => {
    if (!confirm(`Delete "${docName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success("Document deleted");
      onDocumentDeleted?.(docId);
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  const showVersionHistory = async (docType) => {
    setLoadingVersions(true);
    try {
      const { data } = await api.get(`/documents/application/${applicationId}/versions/${docType}`);
      setVersionModal({ docType, versions: data });
    } catch {
      toast.error("Failed to load version history");
    } finally {
      setLoadingVersions(false);
    }
  };

  const openPreview = (doc) => {
    setPreviewDoc({
      url: previewUrl(doc.id),
      mimeType: doc.mime_type,
      originalName: doc.original_name,
    });
  };

  if (documents.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">No documents uploaded yet</p>;
  }

  return (
    <>
      <div className="divide-y divide-gray-100">
        {documents.map((doc) => (
          <div key={doc.id} className="py-3 flex items-start gap-3 group">
            <span className="text-xl mt-0.5">{fileIcon(doc.mime_type)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button onClick={() => openPreview(doc)}
                  className="font-medium text-sm text-gray-900 hover:text-primary-600 truncate text-left">
                  {doc.original_name}
                </button>
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">
                  v{doc.version}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                <span>{DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}</span>
                {doc.tag && <span>• {doc.tag}</span>}
                <span>• {formatSize(doc.file_size)}</span>
                {doc.uploader && <span>• {doc.uploader.name}</span>}
                <span>• {new Date(doc.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-100 transition shrink-0">
              <button onClick={() => openPreview(doc)}
                className="text-xs px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded"
                title="Preview Online">👁️</button>
              {showVersions && (
                <button onClick={() => showVersionHistory(doc.document_type)}
                  disabled={loadingVersions}
                  className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                  title="Version History">🕐</button>
              )}
              <a href={downloadUrl(doc.id)}
                target="_blank" rel="noopener noreferrer"
                className="text-xs px-2 py-1 text-primary-600 hover:bg-primary-50 rounded"
                title="Download">⬇️</a>
              {canDelete && (
                <button onClick={() => handleDelete(doc.id, doc.original_name)}
                  className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                  title="Delete">🗑️</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Version History Modal */}
      {versionModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[70vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-1">Version History</h3>
            <p className="text-sm text-gray-500 mb-4">
              {DOCUMENT_TYPE_LABELS[versionModal.docType] || versionModal.docType}
            </p>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {versionModal.versions.map((v) => (
                <div key={v.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">v{v.version}</span>
                    <span className="ml-2 text-gray-500">{v.original_name}</span>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatSize(v.file_size)} • {new Date(v.createdAt).toLocaleString("en-IN")}
                      {!v.is_active && <span className="ml-1 text-red-400">(superseded)</span>}
                    </div>
                  </div>
                  <a href={downloadUrl(v.id)}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline">Download</a>
                </div>
              ))}
              {versionModal.versions.length === 0 && (
                <p className="text-sm text-gray-500 py-4 text-center">No versions found</p>
              )}
            </div>
            <button onClick={() => setVersionModal(null)}
              className="mt-4 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 self-end">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 truncate">Preview: {previewDoc.originalName}</h3>
              <div className="flex items-center gap-2">
                <a href={previewDoc.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:underline">Open in new tab</a>
                <button onClick={() => setPreviewDoc(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              </div>
            </div>
            <div className="flex-1 p-1">
              {canIframePreview(previewDoc.mimeType) ? (
                <iframe src={previewDoc.url} className="w-full h-full rounded border border-gray-100"
                  title="Document Preview" />
              ) : (
                <div className="w-full h-full rounded border border-gray-100 flex items-center justify-center bg-gray-50 p-6 text-center">
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Inline preview is limited for this file type.</p>
                    <p className="text-xs text-gray-500 mt-1">Use "Open in new tab" to view using browser-supported plugins.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
