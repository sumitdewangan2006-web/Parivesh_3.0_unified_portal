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
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const getInputClassName = (fieldName) => [
    "w-full rounded-md border px-3 py-2 text-sm focus-ring",
    fieldErrors[fieldName] ? "border-red-400 bg-red-50/60" : "border-gray-300",
  ].join(" ");

  const validateForm = () => {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = t("auth.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = t("auth.emailInvalid");
    }

    if (!form.password) {
      nextErrors.password = t("auth.passwordRequired");
    }

    return nextErrors;
  };

  const applyApiErrors = (err) => {
    const details = err.response?.data?.details;
    const nextErrors = {};

    if (Array.isArray(details)) {
      details.forEach((detail) => {
        if (detail.field) {
          nextErrors[detail.field] = detail.message;
        }
      });
    }

    const status = err.response?.status;
    const apiMessage = err.response?.data?.error || err.response?.data?.message || t("auth.loginFailed");
    const isServerFailure = status >= 500 || /internal server error/i.test(String(apiMessage));
    const fallbackMessage = isServerFailure
      ? t("auth.loginServerIssue")
      : details?.[0]?.message || apiMessage;

    if (err.response?.status === 401) {
      nextErrors.password = nextErrors.password || t("auth.invalidCredentials");
      setFieldErrors(nextErrors);
      setFormError("");
      return;
    }

    if (err.response?.status === 403) {
      nextErrors.email = nextErrors.email || fallbackMessage;
      setFieldErrors(nextErrors);
      setFormError("");
      return;
    }

    setFieldErrors(nextErrors);
    setFormError(Object.keys(nextErrors).length > 0 && !isServerFailure ? "" : fallbackMessage);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }

      const nextErrors = { ...prev };
      delete nextErrors[name];
      return nextErrors;
    });
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(t("auth.fixHighlightedFields"));
      return;
    }

    setFieldErrors({});
    setFormError("");
    setLoading(true);

    try {
      await login(form.email, form.password);
      toast.success(t("auth.loginSuccess"));
      router.push("/dashboard");
    } catch (err) {
      applyApiErrors(err);
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
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {formError ? (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

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
                  className={getInputClassName("email")}
                  placeholder={t("auth.emailPlaceholder")}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                />
                {fieldErrors.email ? (
                  <p id="login-email-error" className="mt-1 text-sm text-red-600">
                    {fieldErrors.email}
                  </p>
                ) : null}
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
                  className={getInputClassName("password")}
                  placeholder={t("auth.passwordPlaceholder")}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                />
                {fieldErrors.password ? (
                  <p id="login-password-error" className="mt-1 text-sm text-red-600">
                    {fieldErrors.password}
                  </p>
                ) : null}
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
