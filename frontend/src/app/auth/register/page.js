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
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const getInputClassName = (fieldName) => [
    "w-full rounded-md border px-3 py-2 text-sm focus-ring",
    fieldErrors[fieldName] ? "border-red-400 bg-red-50/60" : "border-gray-300",
  ].join(" ");

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = t("auth.nameRequired");
    }

    if (!form.email.trim()) {
      nextErrors.email = t("auth.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = t("auth.emailInvalid");
    }

    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) {
      nextErrors.phone = t("auth.phoneInvalid");
    }

    if (!form.password) {
      nextErrors.password = t("auth.passwordRequired");
    } else {
      if (form.password.length < 8) {
        nextErrors.password = t("auth.passwordLength");
      } else if (!/[A-Z]/.test(form.password)) {
        nextErrors.password = t("auth.passwordUppercase");
      } else if (!/[0-9]/.test(form.password)) {
        nextErrors.password = t("auth.passwordNumber");
      }
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = t("auth.confirmPasswordRequired");
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = t("auth.passwordsMismatch");
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
    const apiMessage = err.response?.data?.error || err.response?.data?.message || t("auth.registrationFailed");
    const isServerFailure = status >= 500 || /internal server error/i.test(String(apiMessage));
    const fallbackMessage = isServerFailure
      ? t("auth.registrationServerIssue")
      : details?.[0]?.message || apiMessage;

    if (err.response?.status === 409) {
      nextErrors.email = nextErrors.email || apiMessage;
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
      const { confirmPassword, ...data } = form;
      await register(data);
      toast.success(t("auth.registrationSuccess"));
      router.push("/dashboard");
    } catch (err) {
      applyApiErrors(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#eff8f1_0%,#edf6ef_52%,#e9f3eb_100%)]">
      <PublicHeader activeAction="register" />

      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="portal-serif text-3xl text-[var(--portal-green-900)]">{t("auth.registerTitle")}</h1>
            <p className="mt-2 text-gray-500">{t("auth.registerSubtitle")}</p>
          </div>

          {/* Form card */}
          <div className="card">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {formError ? (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

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
                  className={getInputClassName("name")}
                  placeholder={t("auth.fullNamePlaceholder")}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "register-name-error" : undefined}
                />
                {fieldErrors.name ? (
                  <p id="register-name-error" className="mt-1 text-sm text-red-600">
                    {fieldErrors.name}
                  </p>
                ) : null}
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
                  className={getInputClassName("email")}
                  placeholder={t("auth.emailPlaceholder")}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
                />
                {fieldErrors.email ? (
                  <p id="register-email-error" className="mt-1 text-sm text-red-600">
                    {fieldErrors.email}
                  </p>
                ) : null}
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
                  className={getInputClassName("phone")}
                  placeholder={t("auth.phonePlaceholder")}
                  pattern="[0-9]{10}"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? "register-phone-error" : undefined}
                />
                {fieldErrors.phone ? (
                  <p id="register-phone-error" className="mt-1 text-sm text-red-600">
                    {fieldErrors.phone}
                  </p>
                ) : null}
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
                  className={getInputClassName("organization")}
                  placeholder={t("auth.organizationPlaceholder")}
                  aria-invalid={Boolean(fieldErrors.organization)}
                  aria-describedby={fieldErrors.organization ? "register-organization-error" : undefined}
                />
                {fieldErrors.organization ? (
                  <p id="register-organization-error" className="mt-1 text-sm text-red-600">
                    {fieldErrors.organization}
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
                  placeholder={t("auth.passwordRules")}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "register-password-error" : undefined}
                />
                {fieldErrors.password ? (
                  <p id="register-password-error" className="mt-1 text-sm text-red-600">
                    {fieldErrors.password}
                  </p>
                ) : null}
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
                  className={getInputClassName("confirmPassword")}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={fieldErrors.confirmPassword ? "register-confirm-password-error" : undefined}
                />
                {fieldErrors.confirmPassword ? (
                  <p id="register-confirm-password-error" className="mt-1 text-sm text-red-600">
                    {fieldErrors.confirmPassword}
                  </p>
                ) : null}
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
