export default function LogoSlot({
  title,
  subtitle,
  shortLabel,
  variant = "light",
  className = "",
}) {
  const palette =
    variant === "dark"
      ? {
          shell: "border-white/15 bg-white/10 text-white",
          badge: "bg-white/15 text-white",
          text: "text-white/80",
        }
      : {
          shell: "border-[var(--portal-border)] bg-[var(--portal-panel)] text-[var(--portal-ink)]",
          badge: "bg-[var(--portal-soft-green)] text-[var(--portal-green-900)]",
          text: "text-[var(--portal-muted)]",
        };

  return (
    <div
      className={`inline-flex min-w-[118px] items-center gap-3 rounded-2xl border px-3 py-2 shadow-sm ${palette.shell} ${className}`}
      title={`${title}${subtitle ? ` • ${subtitle}` : ""}`}
      aria-label={title}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-bold uppercase tracking-[0.18em] ${palette.badge}`}>
        {shortLabel}
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold uppercase tracking-[0.16em]">
          {title}
        </div>
        {subtitle ? <div className={`truncate text-[11px] ${palette.text}`}>{subtitle}</div> : null}
      </div>
    </div>
  );
}