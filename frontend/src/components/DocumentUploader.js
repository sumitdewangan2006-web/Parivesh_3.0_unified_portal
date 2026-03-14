"use client";

// ── Reusable Document Uploader ───────────────────────────────────────
// Supports drag-and-drop, document type selection, upload progress

import { useState, useRef } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "@/lib/documentTypes";

const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png";

export default function DocumentUploader({
  applicationId,
  onUploadComplete,
  compact = false,
  fixedDocumentType = null,
  showTagInput = true,
  buttonLabel,
}) {
  const [docType, setDocType] = useState(fixedDocumentType || "project_report");
  const [tag, setTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const activeDocType = fixedDocumentType || docType;

  const uploadFile = async (file) => {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size exceeds 10 MB limit");
      return;
    }
    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("document_type", activeDocType);
    if (tag && showTagInput) fd.append("tag", tag);

    try {
      const { data } = await api.post(`/documents/application/${applicationId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      toast.success(`Uploaded: ${data.original_name}`);
      setProgress(100);
      onUploadComplete?.(data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setTimeout(() => { setUploading(false); setProgress(0); }, 500);
    }
  };

  const onFileSelect = (e) => {
    uploadFile(e.target.files[0]);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {!fixedDocumentType && (
          <select value={docType} onChange={(e) => setDocType(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-md text-xs focus-ring">
            {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        )}
        <label className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-xs font-medium cursor-pointer transition inline-flex items-center gap-1">
          {uploading ? `${progress}%` : buttonLabel || `Upload ${DOCUMENT_TYPE_LABELS[activeDocType] || "Document"}`}
          <input ref={inputRef} type="file" className="hidden" accept={ACCEPT}
            onChange={onFileSelect} disabled={uploading} />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(!fixedDocumentType || showTagInput) && (
        <div className="flex flex-wrap gap-3">
          {!fixedDocumentType && (
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
              {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          )}
          {showTagInput && (
            <input type="text" placeholder="Tag (optional)" value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring w-40" />
          )}
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
          ${dragOver ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"}`}
      >
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT}
          onChange={onFileSelect} disabled={uploading} />
        {uploading ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Uploading… {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2">📁</div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-primary-600">Click to browse</span> or drag & drop a {DOCUMENT_TYPE_LABELS[activeDocType] || "file"} here
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG — max 10 MB</p>
          </>
        )}
      </div>
    </div>
  );
}
