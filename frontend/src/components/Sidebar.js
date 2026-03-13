"use client";

// ── Sidebar Navigation ──────────────────────────────────────────────
// Role-aware sidebar — shows different links per role

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function SidebarIcon({ icon }) {
  const commonProps = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (icon) {
    case "analytics":
      return (
        <svg {...commonProps}>
          <path d="M4 19h16" />
          <path d="M7 16V9" />
          <path d="M12 16V5" />
          <path d="M17 16v-4" />
        </svg>
      );
    case "users":
      return (
        <svg {...commonProps}>
          <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
          <circle cx="10" cy="7" r="3" />
          <path d="M20 19v-1a4 4 0 0 0-3-3.87" />
          <path d="M16 4.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "applications":
      return (
        <svg {...commonProps}>
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M9 8h6" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </svg>
      );
    case "categories":
      return (
        <svg {...commonProps}>
          <path d="M20 12 12 20 4 12 12 4z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "sectors":
      return (
        <svg {...commonProps}>
          <path d="M4 20h16" />
          <path d="M6 20V9l6-4v15" />
          <path d="M12 11h6v9" />
          <path d="M8 13h.01" />
          <path d="M8 16h.01" />
          <path d="M15 14h.01" />
          <path d="M15 17h.01" />
        </svg>
      );
    case "templates":
      return (
        <svg {...commonProps}>
          <path d="M7 4h7l5 5v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
          <path d="M14 4v5h5" />
          <path d="M9 13h6" />
          <path d="M9 17h4" />
        </svg>
      );
    case "payments":
      return (
        <svg {...commonProps}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 14h3" />
        </svg>
      );
    case "new":
      return (
        <svg {...commonProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "meetings":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4" />
          <path d="M8 3v4" />
          <path d="M3 10h18" />
        </svg>
      );
    case "profile":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "dashboard":
    default:
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="5" rx="1.5" />
          <rect x="13" y="11" width="7" height="9" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
  }
}

// Navigation items per role
const navItems = {
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
    { label: "Users", href: "/admin/users", icon: "users" },
    { label: "Applications", href: "/admin/applications", icon: "applications" },
    { label: "Categories", href: "/admin/categories", icon: "categories" },
    { label: "Sectors", href: "/admin/sectors", icon: "sectors" },
    { label: "Gist Templates", href: "/admin/templates", icon: "templates" },
    { label: "Payments", href: "/admin/payments", icon: "payments" },
  ],
  project_proponent: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { label: "My Applications", href: "/proponent/applications", icon: "applications" },
    { label: "New Application", href: "/proponent/applications/new", icon: "new" },
    { label: "Profile", href: "/profile", icon: "profile" },
  ],
  scrutiny_team: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { label: "Assigned Applications", href: "/scrutiny/applications", icon: "applications" },
    { label: "Profile", href: "/profile", icon: "profile" },
  ],
  mom_team: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { label: "Meetings", href: "/mom/meetings", icon: "meetings" },
    { label: "Applications", href: "/mom/applications", icon: "applications" },
    { label: "Profile", href: "/profile", icon: "profile" },
  ],
};

const roleTitles = {
  admin: "Administrative Console",
  project_proponent: "Proponent Console",
  scrutiny_team: "Scrutiny Console",
  mom_team: "MoM Console",
};

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const roleName = user?.role?.name || "";
  const items = navItems[roleName] || [];
  const roleTitle = roleTitles[roleName] || "Workflow Console";

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
          fixed top-0 left-0 z-50 h-full w-64 border-r border-[var(--portal-border)] bg-[linear-gradient(180deg,#173d32_0%,#1d4d3f_46%,#214f3f_100%)] text-white
          flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="shrink-0 border-b border-white/10 px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-white/80">
                {roleTitle}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-auto rounded-lg px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            >
              ✕
            </button>
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
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/10 text-white/90">
                  <SidebarIcon icon={item.icon} />
                </span>
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
