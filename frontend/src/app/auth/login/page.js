"use client";

// ── Login Page ───────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalUi } from "@/contexts/PortalUiContext";
import PublicHeader from "@/components/PublicHeader";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = usePortalUi();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success(t("auth.loginSuccess"));
      router.push("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.error || err.response?.data?.details?.[0]?.message || t("auth.loginFailed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#eff8f1_0%,#edf6ef_52%,#e9f3eb_100%)]">
      <PublicHeader activeAction="login" />

      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="portal-serif text-3xl text-[var(--portal-green-900)]">{t("auth.loginTitle")}</h1>
            <p className="mt-2 text-gray-500">{t("auth.loginSubtitle")}</p>
          </div>

          {/* Form card */}
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm"
                  placeholder={t("auth.emailPlaceholder")}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.password")}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm"
                  placeholder={t("auth.passwordPlaceholder")}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {loading ? t("auth.signingIn") : t("auth.signIn")}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-6 text-center text-sm text-gray-500">
              {t("auth.noAccount")}{" "}
              <Link href="/auth/register" className="text-primary-600 font-medium hover:underline">
                {t("auth.registerHere")}
              </Link>
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-4 text-center text-xs text-gray-400">
            {t("auth.demoAdmin")}
          </div>
        </div>
      </div>
    </div>
  );
}
