"use client";

// ── Protected Route Wrapper ──────────────────────────────────────────
// Redirects unauthenticated users to login
// Optionally restricts by role(s)

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }

    if (
      !loading &&
      isAuthenticated &&
      allowedRoles.length > 0 &&
      !allowedRoles.includes(user?.role?.name)
    ) {
      router.replace("/unauthorized");
    }
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role?.name)) {
    return null;
  }

  return children;
}
