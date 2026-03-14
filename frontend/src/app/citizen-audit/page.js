"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";

export default function CitizenAuditLookupPage() {
  const router = useRouter();
  const [referenceNumber, setReferenceNumber] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const value = referenceNumber.trim();
    if (!value) return;
    router.push(`/citizen-audit/${encodeURIComponent(value)}`);
  };

  return (
    <main className="min-h-screen bg-[var(--portal-canvas)]">
      <PublicHeader activeNav="Home" />
      <section className="portal-shell px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto rounded-3xl border border-[var(--portal-border)] bg-white p-8 shadow-sm">
          <p className="portal-kicker">Public Transparency</p>
          <h1 className="portal-serif mt-2 text-3xl text-[var(--portal-green-900)]">
            Citizen Audit Submission
          </h1>
          <p className="mt-3 text-sm text-[var(--portal-muted)] leading-6">
            Enter an application reference number to view community observations and submit
            geo-tagged comments/photos about biodiversity near the project site.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-gray-700">Application Reference Number</label>
            <input
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Example: EC-DEMO-20260314213733"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
            />
            <button type="submit" className="portal-button-primary w-full sm:w-auto">
              Open Citizen Audit Page
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
