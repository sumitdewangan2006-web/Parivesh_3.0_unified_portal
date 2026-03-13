"use client";

import Link from "next/link";
import LogoSlot from "./LogoSlot";
import PortalBrandMark from "./PortalBrandMark";
import { usePortalUi } from "@/contexts/PortalUiContext";

export default function PortalFooter() {
  const { t } = usePortalUi();
  const policyLinks = [
    { label: t("footer.privacy"), href: "#" },
    { label: t("footer.terms"), href: "#" },
    { label: t("footer.hyperlinking"), href: "#" },
    { label: t("footer.accessibility"), href: "#" },
    { label: t("footer.disclaimer"), href: "#" },
  ];

  return (
    <footer className="portal-footer mt-auto border-t border-[var(--portal-border)]">
      <div className="portal-shell px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <div>
              <p className="portal-kicker">{t("footer.kicker")}</p>
              <h2 className="portal-serif text-2xl text-[var(--portal-green-900)]">
                {t("footer.title")}
              </h2>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-[var(--portal-muted)]">
              {t("footer.description")}
            </p>
            <div className="flex flex-wrap gap-3">
              <LogoSlot title="GoI" subtitle={t("footer.stateEmblemSlot")} shortLabel="GOI" />
              <LogoSlot title="MoEFCC" subtitle={t("footer.officialDepartmentAsset")} shortLabel="ENV" />
              <LogoSlot title="NIC" subtitle={t("footer.hostingPartnerSlot")} shortLabel="NIC" />
              <PortalBrandMark subtitle={t("footer.officialPortalMark")} />
            </div>
          </div>

          <div className="space-y-5 rounded-[28px] border border-[var(--portal-border)] bg-white/80 p-6 shadow-sm backdrop-blur">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--portal-green-900)]">
                {t("footer.policyLinks")}
              </h3>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--portal-muted)]">
                {policyLinks.map((item) => (
                  <Link key={item.label} href={item.href} className="hover:text-[var(--portal-green-900)]">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--portal-soft)] p-4 text-sm leading-6 text-[var(--portal-muted)]">
              {t("footer.note")}
            </div>
            <div className="text-xs leading-5 text-[var(--portal-muted)]">
              {t("footer.context")}
              <br />
              {t("footer.implementation")}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}