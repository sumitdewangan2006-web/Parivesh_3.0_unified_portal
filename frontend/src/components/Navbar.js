"use client";

// ── Top Navigation Bar ───────────────────────────────────────────────
// Shows app title, user info, and logout button

import { useAuth } from "@/contexts/AuthContext";
import PortalBrandMark from "./PortalBrandMark";

const roleBadgeColor = {
  admin: "bg-red-100 text-red-700",
  project_proponent: "bg-blue-100 text-blue-700",
  scrutiny_team: "bg-yellow-100 text-yellow-700",
  mom_team: "bg-purple-100 text-purple-700",
};

const roleLabel = {
  admin: "Admin",
  project_proponent: "Project Proponent",
  scrutiny_team: "Scrutiny Team",
  mom_team: "MoM Team",
};

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const roleName = user?.role?.name || "";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--portal-border)] bg-[rgba(255,251,244,0.94)] backdrop-blur">
      <div className="tricolor-bar" />
      <div className="flex flex-col gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.18em] text-[var(--portal-muted)]">
          <div className="flex items-center gap-2">
            <span>Government Workflow Console</span>
            <span className="hidden text-[var(--portal-border-strong)] sm:inline">|</span>
            <span className="hidden sm:inline">PARIVESH 3.0</span>
          </div>
          <span className="hidden md:inline">Ministry of Environment, Forest and Climate Change</span>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="rounded-xl border border-[var(--portal-border)] bg-white p-2 text-[var(--portal-green-900)] hover:bg-[var(--portal-soft)] lg:hidden"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="space-y-1">
              <PortalBrandMark
                subtitle="Administrative and proposal workflow console"
                className="max-w-full"
              />
              <p className="text-sm text-[var(--portal-muted)]">Unified portal for green clearance processing and administrative review</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <span className={`badge ${roleBadgeColor[roleName] || "bg-gray-100 text-gray-700"}`}>
              {roleLabel[roleName] || roleName}
            </span>
            <span className="hidden text-sm text-[var(--portal-muted)] sm:inline">{user?.name}</span>
            <button
              onClick={logout}
              className="rounded-xl border border-[#e7c9c9] bg-white px-4 py-2 text-sm font-semibold text-[#9b2c2c] transition hover:bg-[#fff4f4]"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
