"use client";

import { getAffidavitPoints, MINERAL_TYPE_LABELS } from "@/lib/checklistData";

/**
 * Displays the official affidavit points for a given mineral/project type.
 * These are the regulatory undertakings the PP must include in their notarized affidavit.
 */
export default function AffidavitPoints({ mineralType }) {
  const points = getAffidavitPoints(mineralType);
  if (!points.length) return null;

  const label = MINERAL_TYPE_LABELS[mineralType] || mineralType;

  return (
    <div className="border border-amber-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
        <h3 className="font-semibold text-amber-900 text-sm">
          {label} — Affidavit Points
        </h3>
        <p className="text-xs text-amber-600 mt-0.5">
          {points.length} undertaking{points.length !== 1 ? "s" : ""} required in the notarized affidavit
        </p>
      </div>

      {/* Points list */}
      <ol className="divide-y divide-amber-100">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-2.5 text-sm bg-white hover:bg-amber-50 transition-colors">
            <span className="mt-0.5 text-xs font-bold text-amber-500 min-w-[1.5rem] text-right">{i + 1}.</span>
            <span className="text-gray-700 leading-relaxed">{point}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
