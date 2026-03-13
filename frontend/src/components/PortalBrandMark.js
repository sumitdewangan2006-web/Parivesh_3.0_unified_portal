import Image from "next/image";

export default function PortalBrandMark({
  subtitle,
  variant = "light",
  className = "",
  priority = false,
  framed = true,
  imageWidthClass = "w-[156px] sm:w-[182px]",
  imageHeightClass = "h-10 sm:h-11",
}) {
  const palette =
    variant === "dark"
      ? {
          shell: "border-white/10 bg-white/95 text-[var(--portal-green-900)]",
          text: "text-[var(--portal-muted)]",
        }
      : {
          shell: "border-[var(--portal-border)] bg-white/92 text-[var(--portal-green-900)]",
          text: "text-[var(--portal-muted)]",
        };

  return (
    <div
      className={[
        "inline-flex items-center gap-3",
        framed ? `rounded-[26px] border px-4 py-3 shadow-sm ${palette.shell}` : "",
        className,
      ].join(" ")}
    >
      <div className={`relative shrink-0 ${imageHeightClass} ${imageWidthClass}`}>
        <Image
          src="/branding/parivesh-logo.svg"
          alt="PARIVESH"
          fill
          priority={priority}
          className="object-contain object-left"
          sizes="182px"
        />
      </div>
      {subtitle ? <div className={`hidden text-xs leading-5 sm:block ${palette.text}`}>{subtitle}</div> : null}
    </div>
  );
}