"use client";

import DocumentUploader from "@/components/DocumentUploader";
import { getDocumentTypeDefinitions } from "@/lib/documentTypes";

export default function DocumentTypeUploadGrid({
  applicationId,
  categoryCode,
  mineralType,
  sectorRules,
  documents = [],
  canUpload = true,
  onUploadComplete,
}) {
  const definitions = getDocumentTypeDefinitions({ categoryCode, mineralType, sectorRules });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {definitions.map((docType) => {
        const docForType = documents.find((doc) => doc.document_type === docType.value);

        return (
          <div key={docType.value} className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{docType.label}</h4>
                <p className="text-xs text-gray-500 mt-1">{docType.description}</p>
              </div>
              <span className={`shrink-0 text-[11px] px-2 py-1 rounded-full font-medium ${
                docType.required
                  ? "bg-red-50 text-red-600"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {docType.required ? "Required" : "Optional"}
              </span>
            </div>

            <div className={`rounded-lg border px-3 py-2 mb-3 text-sm ${
              docForType ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
            }`}>
              {docForType ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{docForType.original_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Uploaded and available for scrutiny review</p>
                  </div>
                  <span className="text-xs font-medium text-green-600 shrink-0">{`v${docForType.version || 1}`}</span>
                </div>
              ) : (
                <p className="text-gray-500">No file uploaded yet.</p>
              )}
            </div>

            {canUpload && (
              <DocumentUploader
                applicationId={applicationId}
                fixedDocumentType={docType.value}
                showTagInput={false}
                compact
                buttonLabel={docForType ? `Replace ${docType.label}` : `Upload ${docType.label}`}
                onUploadComplete={onUploadComplete}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}