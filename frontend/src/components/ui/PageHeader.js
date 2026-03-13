// ── Page Header Component ────────────────────────────────────────────
// Consistent page title + optional action button

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--portal-muted)]">PARIVESH Portal</div>
        <h1 className="portal-serif text-3xl text-[var(--portal-green-900)]">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm leading-6 text-[var(--portal-muted)]">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
