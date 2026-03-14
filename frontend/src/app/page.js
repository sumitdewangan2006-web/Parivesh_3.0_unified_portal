"use client";

import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import { usePortalUi } from "@/contexts/PortalUiContext";

export default function HomePage() {
  const { t } = usePortalUi();
  const clearances = [
    {
      id: "clearance-environmental",
      title: t("home.modules.environmentalTitle"),
      note: t("home.modules.environmentalNote"),
      detail: t("home.clearance.environmentalDetail"),
    },
    {
      id: "clearance-forest",
      title: t("home.modules.forestTitle"),
      note: t("home.modules.forestNote"),
      detail: t("home.clearance.forestDetail"),
    },
    {
      id: "clearance-wildlife",
      title: t("home.modules.wildlifeTitle"),
      note: t("home.modules.wildlifeNote"),
      detail: t("home.clearance.wildlifeDetail"),
    },
    {
      id: "clearance-crz",
      title: t("home.modules.crzTitle"),
      note: t("home.modules.crzNote"),
      detail: t("home.clearance.crzDetail"),
    },
  ];

  const quickActions = [
    { title: t("home.trackProposal"), href: "/auth/login", style: "primary" },
    { title: t("home.knowApproval"), href: "/auth/register", style: "secondary" },
    { title: t("home.openDashboard"), href: "/dashboard", style: "secondary" },
    { title: "Citizen Audit", href: "/citizen-audit", style: "secondary" },
  ];

  const features = [
    { title: t("home.features.submissionTitle"), desc: t("home.features.submissionDesc"), icon: "01" },
    { title: t("home.features.scrutinyTitle"), desc: t("home.features.scrutinyDesc"), icon: "02" },
    { title: t("home.features.momTitle"), desc: t("home.features.momDesc"), icon: "03" },
    { title: t("home.features.analyticsTitle"), desc: t("home.features.analyticsDesc"), icon: "04" },
  ];

  const aboutDetails = [
    { title: t("home.about.workflowTitle"), note: t("home.about.workflowNote") },
    { title: t("home.about.rolesTitle"), note: t("home.about.rolesNote") },
    { title: t("home.about.transparencyTitle"), note: t("home.about.transparencyNote") },
    { title: t("home.about.digitalTitle"), note: t("home.about.digitalNote") },
  ];

  const downloadResources = [
    { id: "downloads-demo-script", title: t("home.downloads.demoScriptTitle"), note: t("home.downloads.demoScriptNote") },
    { id: "downloads-scorecard", title: t("home.downloads.scorecardTitle"), note: t("home.downloads.scorecardNote") },
    { id: "downloads-health-check", title: t("home.downloads.healthCheckTitle"), note: t("home.downloads.healthCheckNote") },
    { id: "downloads-reset", title: t("home.downloads.resetTitle"), note: t("home.downloads.resetNote") },
  ];

  const guideDetails = [
    { id: "guide-proponent", title: t("home.guide.proponentTitle"), note: t("home.guide.proponentNote") },
    { id: "guide-scrutiny", title: t("home.guide.scrutinyTitle"), note: t("home.guide.scrutinyNote") },
    { id: "guide-mom", title: t("home.guide.momTitle"), note: t("home.guide.momNote") },
    { id: "guide-admin", title: t("home.guide.adminTitle"), note: t("home.guide.adminNote") },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-[var(--portal-canvas)]">
      <PublicHeader activeNav="Home" />

      <section className="border-b border-[var(--portal-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(232,244,236,0.96),rgba(248,242,230,0.98))]">
        <div className="portal-shell px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl space-y-5">
              <div className="space-y-3">
                <p className="portal-kicker">{t("home.kicker")}</p>
                <h1 className="portal-serif max-w-4xl text-4xl leading-tight text-[var(--portal-green-900)] sm:text-5xl lg:text-6xl">
                  {t("home.title")}
                </h1>
                <p className="max-w-3xl text-base leading-7 text-[var(--portal-muted)] sm:text-lg">
                  {t("home.description")}
                </p>
              </div>

              <div className="portal-notice-strip max-w-4xl rounded-[28px] px-5 py-4 text-sm leading-6 text-[var(--portal-green-900)] shadow-sm">
                {t("home.notice")}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className={action.style === "primary" ? "portal-button-primary" : "portal-button-secondary"}
                  >
                    {action.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="w-full max-w-xl rounded-[34px] border border-[var(--portal-border)] bg-white/85 p-5 shadow-[0_24px_70px_rgba(27,80,60,0.08)] backdrop-blur">
              <div className="rounded-[28px] bg-[var(--portal-soft)] p-6">
                <p className="portal-kicker">{t("home.modulesKicker")}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {clearances.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[var(--portal-border)] bg-white px-4 py-4 shadow-sm">
                      <div className="text-sm font-semibold text-[var(--portal-green-900)]">{item.title}</div>
                      <div className="mt-1 text-sm leading-6 text-[var(--portal-muted)]">{item.note}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-[var(--portal-green-900)] px-4 py-4 text-sm text-white/90">
                  {t("home.modulesBanner")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-28 border-b border-[var(--portal-border)] bg-white/80 py-14 sm:py-16">
        <div className="portal-shell px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
            <div className="space-y-4">
              <p className="portal-kicker">{t("home.aboutKicker")}</p>
              <h2 className="portal-serif text-3xl text-[var(--portal-green-900)] sm:text-4xl">{t("home.aboutTitle")}</h2>
              <p className="max-w-3xl text-[15px] leading-7 text-[var(--portal-muted)]">{t("home.aboutDescription")}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {aboutDetails.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-5 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--portal-green-900)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--portal-muted)]">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="clearance" className="scroll-mt-28 border-b border-[var(--portal-border)] bg-[linear-gradient(180deg,rgba(232,244,236,0.45),rgba(255,255,255,0.92))] py-14 sm:py-16">
        <div className="portal-shell px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 text-center">
            <p className="portal-kicker">{t("home.clearanceKicker")}</p>
            <h2 className="portal-serif text-3xl text-[var(--portal-green-900)] sm:text-4xl">{t("home.clearanceTitle")}</h2>
            <p className="mx-auto max-w-3xl text-[15px] leading-7 text-[var(--portal-muted)]">
              {t("home.clearanceDescription")}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {clearances.map((item, index) => (
              <article
                key={item.id}
                id={item.id}
                className="scroll-mt-32 rounded-[28px] border border-[var(--portal-border)] bg-white p-6 shadow-[0_18px_50px_rgba(27,80,60,0.08)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-green-900)]">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="rounded-full bg-[var(--portal-soft-green)] px-3 py-1 text-xs font-semibold text-[var(--portal-green-900)]">
                    {t("home.clearanceLabel")}
                  </div>
                </div>
                <h3 className="portal-serif mt-5 text-2xl text-[var(--portal-green-900)]">{item.title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-[var(--portal-green-900)]/80">{item.note}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--portal-muted)]">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="downloads" className="scroll-mt-28 border-b border-[var(--portal-border)] bg-white/85 py-14 sm:py-16">
        <div className="portal-shell px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 text-center">
            <p className="portal-kicker">{t("home.downloadsKicker")}</p>
            <h2 className="portal-serif text-3xl text-[var(--portal-green-900)] sm:text-4xl">{t("home.downloadsTitle")}</h2>
            <p className="mx-auto max-w-3xl text-[15px] leading-7 text-[var(--portal-muted)]">{t("home.downloadsDescription")}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {downloadResources.map((item) => (
              <article key={item.id} id={item.id} className="scroll-mt-32 rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[var(--portal-green-900)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--portal-muted)]">{item.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="guide" className="scroll-mt-28 border-b border-[var(--portal-border)] bg-[linear-gradient(180deg,rgba(248,242,230,0.7),rgba(255,255,255,0.94))] py-14 sm:py-16">
        <div className="portal-shell px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 text-center">
            <p className="portal-kicker">{t("home.guideKicker")}</p>
            <h2 className="portal-serif text-3xl text-[var(--portal-green-900)] sm:text-4xl">{t("home.guideTitle")}</h2>
            <p className="mx-auto max-w-3xl text-[15px] leading-7 text-[var(--portal-muted)]">{t("home.guideDescription")}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {guideDetails.map((item) => (
              <article key={item.id} id={item.id} className="scroll-mt-32 rounded-[24px] border border-[var(--portal-border)] bg-white p-6 shadow-sm">
                <h3 className="portal-serif text-2xl text-[var(--portal-green-900)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--portal-muted)]">{item.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-28 border-b border-[var(--portal-border)] bg-white/85 py-14 sm:py-16">
        <div className="portal-shell px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="portal-kicker">{t("home.contactKicker")}</p>
              <h2 className="portal-serif mt-3 text-3xl text-[var(--portal-green-900)] sm:text-4xl">{t("home.contactTitle")}</h2>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[var(--portal-muted)]">{t("home.contactDescription")}</p>
            </div>
            <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--portal-green-900)]">{t("home.contact.supportTitle")}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--portal-muted)]">{t("home.contact.supportNote")}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/auth/login" className="portal-button-primary">{t("header.login")}</Link>
                <Link href="/auth/register" className="portal-button-secondary">{t("header.register")}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="complaint" className="scroll-mt-28 border-b border-[var(--portal-border)] bg-[linear-gradient(180deg,rgba(232,244,236,0.38),rgba(255,255,255,0.95))] py-14 sm:py-16">
        <div className="portal-shell px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-[var(--portal-border)] bg-white p-8 shadow-sm">
            <p className="portal-kicker">{t("home.complaintKicker")}</p>
            <h2 className="portal-serif mt-3 text-3xl text-[var(--portal-green-900)] sm:text-4xl">{t("home.complaintTitle")}</h2>
            <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[var(--portal-muted)]">{t("home.complaintDescription")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/auth/login" className="portal-button-primary">{t("home.complaint.primaryAction")}</Link>
              <Link href="/auth/register" className="portal-button-secondary">{t("home.complaint.secondaryAction")}</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="vacancies" className="scroll-mt-28 border-b border-[var(--portal-border)] bg-white/85 py-14 sm:py-16">
        <div className="portal-shell px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-dashed border-[var(--portal-border-strong)] bg-[var(--portal-panel)] p-8 text-center shadow-sm">
            <p className="portal-kicker">{t("home.vacanciesKicker")}</p>
            <h2 className="portal-serif mt-3 text-3xl text-[var(--portal-green-900)] sm:text-4xl">{t("home.vacanciesTitle")}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-7 text-[var(--portal-muted)]">{t("home.vacanciesDescription")}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/#contact" className="portal-button-secondary">{t("header.nav.contact")}</Link>
              <Link href="/dashboard" className="portal-button-primary">{t("header.nav.dashboard")}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="portal-shell px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 text-center">
            <p className="portal-kicker">{t("home.featuresKicker")}</p>
            <h2 className="portal-serif text-3xl text-[var(--portal-green-900)] sm:text-4xl">{t("home.featuresTitle")}</h2>
            <p className="mx-auto max-w-3xl text-[15px] leading-7 text-[var(--portal-muted)]">
              {t("home.featuresDescription")}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="portal-feature-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--portal-soft-green)] text-sm font-bold tracking-[0.16em] text-[var(--portal-green-900)]">
                  {feature.icon}
                </div>
                <h3 className="portal-serif mt-5 text-2xl text-[var(--portal-green-900)]">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--portal-muted)]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
