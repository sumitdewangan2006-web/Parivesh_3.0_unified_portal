"use client";

// ── Top Navigation Bar ───────────────────────────────────────────────
// Shows app title, user info, and logout button

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
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
      <div className="px-4 py-3 lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              onClick={onToggleSidebar}
              className="rounded-xl border border-[var(--portal-border)] bg-white p-2 text-[var(--portal-green-900)] hover:bg-[var(--portal-soft)] lg:hidden"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="shrink-0">
              <PortalBrandMark
                framed={false}
                imageWidthClass="w-[200px] sm:w-[240px]"
                imageHeightClass="h-12 sm:h-14"
                className="max-w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <Link
              href="/citizen-audit/projects"
              className="rounded-xl border border-[var(--portal-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--portal-green-900)] transition hover:bg-[var(--portal-soft)]"
            >
              Citizen Audit
            </Link>
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
