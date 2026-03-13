import Link from "next/link";

// ── Unauthorized Page ────────────────────────────────────────────────

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500">403</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-500">
          You do not have permission to access this page.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block px-6 py-2.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
