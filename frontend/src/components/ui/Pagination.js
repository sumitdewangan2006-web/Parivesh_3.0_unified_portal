// ── Pagination Component ─────────────────────────────────────────────

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50 transition"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
