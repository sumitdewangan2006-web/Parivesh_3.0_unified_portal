"use client";

import { getChecklist, MINERAL_TYPE_LABELS } from "@/lib/checklistData";

/**
 * Displays the official document checklist for a given mineral/project type.
 * Shows required (●) and optional (○) items, with a count badge.
 */
export default function MineralChecklist({ mineralType, checklistItems, uploadedDocumentKeys = [] }) {
  const checklist = checklistItems?.length ? checklistItems : getChecklist(mineralType);
  if (!checklist.length) return null;

  const label = MINERAL_TYPE_LABELS[mineralType] || mineralType;
  const uploadedSet = new Set(uploadedDocumentKeys);

  const required = checklist.filter((item) => item.required);
  const optional = checklist.filter((item) => !item.required);
  const uploadedRequired = required.filter((item) => uploadedSet.has(item.key)).length;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-primary-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-primary-900 text-sm">
            {label} — Required Document Checklist
          </h3>
          <p className="text-xs text-primary-600 mt-0.5">
            {uploadedRequired}/{required.length} required documents uploaded
          </p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          uploadedRequired === required.length
            ? "bg-green-100 text-green-700"
            : "bg-amber-100 text-amber-700"
        }`}>
          {uploadedRequired === required.length ? "✓ Complete" : `${required.length - uploadedRequired} pending`}
        </span>
      </div>

      {/* Required items */}
      <div className="divide-y divide-gray-100">
        {required.map((item) => {
          const uploaded = uploadedSet.has(item.key);
          return (
            <div key={item.key} className={`flex items-start gap-3 px-4 py-2.5 text-sm ${
              uploaded ? "bg-green-50" : "bg-white"
            }`}>
              <span className={`mt-0.5 text-base leading-none ${uploaded ? "text-green-500" : "text-amber-500"}`}>
                {uploaded ? "✓" : "●"}
              </span>
              <div className="flex-1 min-w-0">
                <span className={uploaded ? "text-green-800" : "text-gray-800"}>
                  <span className="text-gray-400 mr-1 text-xs">{item.sno}.</span>
                  {item.label}
                </span>
                <span className="ml-2 text-xs font-medium text-red-600">Required</span>
              </div>
            </div>
          );
        })}

        {/* Optional items */}
        {optional.length > 0 && (
          <>
            <div className="px-4 py-1.5 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Optional</span>
            </div>
            {optional.map((item) => {
              const uploaded = uploadedSet.has(item.key);
              return (
                <div key={item.key} className="flex items-start gap-3 px-4 py-2.5 text-sm bg-white">
                  <span className={`mt-0.5 text-base leading-none ${uploaded ? "text-green-500" : "text-gray-300"}`}>
                    {uploaded ? "✓" : "○"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-600">
                      <span className="text-gray-400 mr-1 text-xs">{item.sno}.</span>
                      {item.label}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">Optional</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
