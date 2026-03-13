"use client";

import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import toast from "react-hot-toast";

function TemplatesContent() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", content: "", category_id: "", sector_id: "" });
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [filterSec, setFilterSec] = useState("");

  useEffect(() => {
    Promise.all([api.get("/config/categories"), api.get("/config/sectors")])
      .then(([c, s]) => { setCategories(c.data); setSectors(s.data); });
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCat) params.category_id = filterCat;
      if (filterSec) params.sector_id = filterSec;
      const { data } = await api.get("/config/templates", { params });
      setTemplates(data);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [filterCat, filterSec]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", content: "", category_id: "", sector_id: "" });
    setShowModal(true);
  };

  const openEdit = (tpl) => {
    setEditing(tpl);
    setForm({
      name: tpl.name,
      content: tpl.content || "",
      category_id: tpl.category_id || "",
      sector_id: tpl.sector_id || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.category_id) delete payload.category_id;
      if (!payload.sector_id) delete payload.sector_id;
      if (editing) {
        await api.put(`/config/templates/${editing.id}`, payload);
        toast.success("Template updated");
      } else {
        await api.post("/config/templates", payload);
        toast.success("Template created");
      }
      setShowModal(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.error || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this template?")) return;
    try {
      await api.delete(`/config/templates/${id}`);
      toast.success("Template deleted");
      fetchTemplates();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const columns = [
    { key: "name", label: "Template Name" },
    { key: "category", label: "Category", render: (r) => r.category?.code || "All" },
    { key: "sector", label: "Sector", render: (r) => r.sector?.name || "All" },
    {
      key: "actions", label: "", render: (r) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }}
            className="text-xs text-primary-600 hover:underline">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
            className="text-xs text-red-600 hover:underline">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Gist Templates" subtitle="Manage reusable templates for applications">
        <button onClick={openCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium transition">
          + New Template
        </button>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
        <select value={filterSec} onChange={(e) => setFilterSec(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
          <option value="">All Sectors</option>
          {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <DataTable columns={columns} data={templates} onRowClick={openEdit} emptyMessage="No templates found" />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? "Edit Template" : "New Template"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Template Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
                  <option value="">Any Category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
                <select value={form.sector_id}
                  onChange={(e) => setForm({ ...form, sector_id: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring">
                  <option value="">Any Sector</option>
                  {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <textarea required placeholder="Template content…" rows={8} value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring font-mono" />
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

export default function AdminTemplatesPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout><TemplatesContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
