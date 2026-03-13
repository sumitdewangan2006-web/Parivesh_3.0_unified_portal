"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import toast from "react-hot-toast";

function CategoriesContent() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/config/categories");
      setCategories(data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", name: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ code: cat.code, name: cat.name, description: cat.description || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/config/categories/${editing.id}`, form);
        toast.success("Category updated");
      } else {
        await api.post("/config/categories", form);
        toast.success("Category created");
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Application Categories" subtitle="Manage EC application categories (A, B1, B2)">
        <button onClick={openCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium transition">
          + Add Category
        </button>
      </PageHeader>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="card cursor-pointer hover:shadow-md transition" onClick={() => openEdit(cat)}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-primary-600">{cat.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${cat.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {cat.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900">{cat.name}</h4>
              {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
            </div>
          ))}
          {categories.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">No categories found</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? "Edit Category" : "New Category"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Code (e.g. A, B1)" value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <input required placeholder="Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <textarea placeholder="Description (optional)" rows={3} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                  {saving ? "Saving…" : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminCategoriesPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout><CategoriesContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
