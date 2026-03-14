"use client";

import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AdminRoleManagementScreen from "@/components/AdminRoleManagementScreen";
import api from "@/lib/api";
import toast from "react-hot-toast";

function UsersContent() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("");
  const [search, setSearch] = useState("");
  const [switchingUserId, setSwitchingUserId] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", roleName: "project_proponent", phone: "", organization: "" });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterRole) params.role = filterRole;
      if (search) params.search = search;
      const { data } = await api.get("/admin/users", { params });
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, filterRole, search]);

  useEffect(() => {
    api.get("/admin/roles").then((r) => setRoles(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}/status`, { isActive: !user.is_active });
      toast.success(`User ${user.is_active ? "deactivated" : "activated"}`);
      fetchUsers();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const changeRole = async (userId, roleName) => {
    try {
      setSwitchingUserId(userId);
      await api.put(`/admin/users/${userId}/role`, { roleName });
      toast.success("Role updated");
      fetchUsers();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setSwitchingUserId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/users", form);
      toast.success("User created");
      setShowModal(false);
      setForm({ name: "", email: "", password: "", roleName: "project_proponent", phone: "", organization: "" });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "organization", label: "Organization", render: (r) => r.organization || "—" },
    {
      key: "role", label: "Role", render: (r) => (
        <select value={r.role?.name || ""} onChange={(e) => changeRole(r.id, e.target.value)}
          className="text-xs border border-gray-300 rounded px-1 py-0.5">
          {roles.map((role) => <option key={role.id} value={role.name}>{role.name.replace(/_/g, " ")}</option>)}
        </select>
      ),
    },
    {
      key: "status", label: "Status", render: (r) => (
        <button onClick={() => toggleStatus(r)}
          className={`text-xs font-medium px-2 py-0.5 rounded ${r.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {r.is_active ? "Active" : "Inactive"}
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="User Management" subtitle="Manage portal users and roles">
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium transition">
          + Create User
        </button>
      </PageHeader>

      <AdminRoleManagementScreen
        users={users}
        onRoleSwitch={changeRole}
        switchingUserId={switchingUserId}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" placeholder="Search name or email…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring w-64" />
        <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
          <option value="">All Roles</option>
          {roles.map((r) => <option key={r.id} value={r.name}>{r.name.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <>
          <DataTable columns={columns} data={users} emptyMessage="No users found" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input name="name" required placeholder="Full Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <input name="email" type="email" required placeholder="Email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <input name="password" type="password" required placeholder="Password (min 8 chars)" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <select name="roleName" value={form.roleName}
                onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
                {roles.map((r) => <option key={r.id} value={r.name}>{r.name.replace(/_/g, " ")}</option>)}
              </select>
              <input name="phone" placeholder="Phone (optional)" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <input name="organization" placeholder="Organization (optional)" value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                  {saving ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout><UsersContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
