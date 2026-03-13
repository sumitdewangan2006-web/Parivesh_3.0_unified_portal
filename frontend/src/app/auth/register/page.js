"use client";

// ── Registration Page ────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalUi } from "@/contexts/PortalUiContext";
import PublicHeader from "@/components/PublicHeader";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = usePortalUi();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    organization: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (form.password !== form.confirmPassword) {
      toast.error(t("auth.passwordsMismatch"));
      return;
    }
    if (form.password.length < 8) {
      toast.error(t("auth.passwordLength"));
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await register(data);
      toast.success(t("auth.registrationSuccess"));
      router.push("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.error || err.response?.data?.details?.[0]?.message || t("auth.registrationFailed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 to-white">
      <PublicHeader activeAction="register" />

      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="portal-serif text-3xl text-[var(--portal-green-900)]">{t("auth.registerTitle")}</h1>
            <p className="mt-2 text-gray-500">{t("auth.registerSubtitle")}</p>
          </div>

          {/* Form card */}
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.fullName")}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm"
                  placeholder={t("auth.fullNamePlaceholder")}
                />
              </div>

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

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.phone")}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm"
                  placeholder={t("auth.phonePlaceholder")}
                  pattern="[0-9]{10}"
                />
              </div>

              {/* Organization */}
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.organization")}
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  value={form.organization}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm"
                  placeholder={t("auth.organizationPlaceholder")}
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
                  placeholder={t("auth.passwordRules")}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.confirmPassword")}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm"
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
              </button>
            </form>

            {/* Login link */}
            <p className="mt-6 text-center text-sm text-gray-500">
              {t("auth.alreadyAccount")}{" "}
              <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">
                {t("auth.signInLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
