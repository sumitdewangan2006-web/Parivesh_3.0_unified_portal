// ── Loading Spinner Component ─────────────────────────────────────────

export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizeMap = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeMap[size] || sizeMap.md}`}
      />
    </div>
  );
}
