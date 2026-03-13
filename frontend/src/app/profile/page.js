"use client";

// ── Profile Page ─────────────────────────────────────────────────────

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import api from "@/lib/api";
import toast from "react-hot-toast";

function ProfileContent() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    organization: user?.organization || "",
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePwChange = (e) =>
    setPwForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPw(true);
    try {
      await api.put("/auth/password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password changed");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Password change failed");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <>
      <PageHeader title="My Profile" subtitle="Manage your account information" />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile Form */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value={user?.role?.name?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-500"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input id="name" name="name" type="text" required value={form.name} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm" pattern="[0-9]{10}" />
            </div>
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <input id="organization" name="organization" type="text" value={form.organization} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm" />
            </div>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 text-sm font-medium transition">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Password Form */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input id="currentPassword" name="currentPassword" type="password" required value={pwForm.currentPassword} onChange={handlePwChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm" />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input id="newPassword" name="newPassword" type="password" required value={pwForm.newPassword} onChange={handlePwChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm" placeholder="Min 8 chars, 1 uppercase, 1 number" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required value={pwForm.confirmPassword} onChange={handlePwChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-ring text-sm" />
            </div>
            <button type="submit" disabled={changingPw}
              className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition">
              {changingPw ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ProfileContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
