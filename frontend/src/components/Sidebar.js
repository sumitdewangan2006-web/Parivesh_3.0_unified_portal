"use client";

// ── Sidebar Navigation ──────────────────────────────────────────────
// Role-aware sidebar — shows different links per role

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LogoSlot from "./LogoSlot";
import PortalBrandMark from "./PortalBrandMark";

// Navigation items per role
const navItems = {
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Analytics", href: "/admin/analytics", icon: "📈" },
    { label: "Users", href: "/admin/users", icon: "👥" },
    { label: "Applications", href: "/admin/applications", icon: "📋" },
    { label: "Categories", href: "/admin/categories", icon: "🏷️" },
    { label: "Sectors", href: "/admin/sectors", icon: "🏭" },
    { label: "Gist Templates", href: "/admin/templates", icon: "📝" },
    { label: "Payments", href: "/admin/payments", icon: "💰" },
  ],
  project_proponent: [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "My Applications", href: "/proponent/applications", icon: "📋" },
    { label: "New Application", href: "/proponent/applications/new", icon: "➕" },
    { label: "Profile", href: "/profile", icon: "👤" },
  ],
  scrutiny_team: [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Assigned Applications", href: "/scrutiny/applications", icon: "📋" },
    { label: "Profile", href: "/profile", icon: "👤" },
  ],
  mom_team: [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Meetings", href: "/mom/meetings", icon: "📅" },
    { label: "Applications", href: "/mom/applications", icon: "📋" },
    { label: "Profile", href: "/profile", icon: "👤" },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const roleName = user?.role?.name || "";
  const items = navItems[roleName] || [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 border-r border-[var(--portal-border)] bg-[linear-gradient(180deg,#173d32_0%,#1d4d3f_46%,#214f3f_100%)] text-white
          flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="shrink-0 border-b border-white/10 px-5 py-5">
          <div className="flex items-start gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/60">Government Console</div>
              <div className="mt-3">
                <PortalBrandMark
                  subtitle="Green clearance workflow stack"
                  variant="dark"
                  className="max-w-full"
                />
              </div>
            </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            ✕
          </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <LogoSlot title="GoI" subtitle="Asset Slot" shortLabel="GOI" variant="dark" className="min-w-[104px]" />
            <LogoSlot title="NIC" subtitle="Asset Slot" shortLabel="NIC" variant="dark" className="min-w-[104px]" />
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition
                  ${
                    isActive
                      ? "bg-white text-[var(--portal-green-900)] shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/10 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/8 p-4 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-white/55">Logged in as</div>
            <div className="mt-2 truncate text-sm font-semibold text-white">{user?.name}</div>
            <div className="truncate text-xs text-white/60">{user?.email}</div>
          </div>
        </div>
      </aside>
    </>
  );
}
