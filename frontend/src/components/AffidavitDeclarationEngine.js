"use client";

import { useMemo } from "react";
import toast from "react-hot-toast";
import { CORE_AFFIDAVIT_DECLARATIONS } from "@/lib/checklistData";

export default function AffidavitDeclarationEngine({
  declarations = CORE_AFFIDAVIT_DECLARATIONS,
  checkedDeclarations = [],
  onCheckedChange,
}) {
  const checkedSet = useMemo(() => new Set(checkedDeclarations), [checkedDeclarations]);
  const allChecked = declarations.every((point) => checkedSet.has(point));

  const generatedText = [
    "AFFIDAVIT DECLARATION",
    "",
    "I hereby undertake and declare the following:",
    ...declarations.map((point, index) => `${index + 1}. ${point}`),
    "",
    "I understand that any false declaration may attract legal action under applicable rules.",
  ].join("\n");

  const toggle = (point) => {
    const next = checkedSet.has(point)
      ? checkedDeclarations.filter((item) => item !== point)
      : [...checkedDeclarations, point];

    onCheckedChange?.(next);
  };

  const copyDeclaration = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      toast.success("Affidavit declaration copied");
    } catch {
      toast.error("Unable to copy affidavit text");
    }
  };

  return (
    <div className="border border-emerald-200 rounded-lg overflow-hidden">
      <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-emerald-900 text-sm">Affidavit Declaration Engine</h3>
          <p className="text-xs text-emerald-700 mt-0.5">
            Check all declarations to generate notarized affidavit content
          </p>
        </div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${
            allChecked ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {allChecked ? "Ready" : "Pending"}
        </span>
      </div>

      <div className="p-3 space-y-2 bg-white">
        {declarations.map((point) => (
          <label key={point} className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={checkedSet.has(point)}
              onChange={() => toggle(point)}
            />
            <span>{point}</span>
          </label>
        ))}
      </div>

      <div className="px-3 pb-3">
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-wrap">
          {generatedText}
        </div>
        <button
          type="button"
          onClick={copyDeclaration}
          className="mt-2 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
        >
          Copy Affidavit Text
        </button>
      </div>
    </div>
  );
}
