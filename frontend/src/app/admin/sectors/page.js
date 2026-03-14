"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import api from "@/lib/api";
import toast from "react-hot-toast";

function SectorsContent() {
  const [sectors, setSectors] = useState([]);
  const [documentCatalog, setDocumentCatalog] = useState([]);
  const [ruleMap, setRuleMap] = useState({});
  const [ruleSearch, setRuleSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingRules, setLoadingRules] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchSectors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/config/sectors");
      setSectors(data);
    } catch {
      toast.error("Failed to load sectors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSectors(); }, []);

  useEffect(() => {
    api
      .get("/config/document-catalog")
      .then(({ data }) => setDocumentCatalog(data || []))
      .catch(() => toast.error("Failed to load document catalog"));
  }, []);

  const loadSectorRules = async (sectorId) => {
    setLoadingRules(true);
    try {
      const { data } = await api.get(`/config/sectors/${sectorId}/document-rules`);
      const next = {};
      (data || []).forEach((rule) => {
        if (rule.is_required) {
          next[rule.document_key] = true;
        }
      });
      setRuleMap(next);
    } catch {
      toast.error("Failed to load sector document parameters");
      setRuleMap({});
    } finally {
      setLoadingRules(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setRuleMap({});
    setRuleSearch("");
    setShowModal(true);
  };

  const openEdit = (sec) => {
    setEditing(sec);
    setForm({ name: sec.name, description: sec.description || "" });
    setRuleSearch("");
    setShowModal(true);
    loadSectorRules(sec.id);
  };

  const toggleRule = (documentKey) => {
    setRuleMap((prev) => {
      const next = { ...prev };
      if (next[documentKey]) {
        delete next[documentKey];
      } else {
        next[documentKey] = true;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let sectorId = editing?.id;
      if (editing) {
        await api.put(`/config/sectors/${editing.id}`, form);
        toast.success("Sector updated");
      } else {
        const { data } = await api.post("/config/sectors", form);
        sectorId = data.id;
        toast.success("Sector created");
      }

      if (sectorId) {
        const rulesPayload = Object.keys(ruleMap)
          .filter((key) => ruleMap[key])
          .map((key) => ({ document_key: key, is_required: true }));

        await api.put(`/config/sectors/${sectorId}/document-rules`, { rules: rulesPayload });
      }

      setShowModal(false);
      fetchSectors();
    } catch (err) {
      toast.error(err.response?.data?.error || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const filteredCatalog = documentCatalog.filter((item) =>
    `${item.label} ${item.key}`.toLowerCase().includes(ruleSearch.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Industry Sectors" subtitle="Manage industry sectors for EC applications">
        <button onClick={openCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium transition">
          + Add Sector
        </button>
      </PageHeader>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map((sec) => (
            <div key={sec.id} className="card cursor-pointer hover:shadow-md transition" onClick={() => openEdit(sec)}>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">{sec.name}</h4>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${sec.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {sec.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {sec.description && <p className="text-sm text-gray-500">{sec.description}</p>}
            </div>
          ))}
          {sectors.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">No sectors found</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? "Edit Sector" : "New Sector"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Sector Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />
              <textarea placeholder="Description (optional)" rows={3} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring" />

              <div className="border border-gray-200 rounded-md p-3 space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Sector Parameters: Mandatory Documents</h4>
                <p className="text-xs text-gray-500">
                  Mark documents that should always be mandatory for this sector.
                </p>

                <input
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  placeholder="Search document type..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                />

                {loadingRules ? (
                  <LoadingSpinner className="py-4" />
                ) : (
                  <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-md divide-y divide-gray-100">
                    {filteredCatalog.map((item) => (
                      <label key={item.key} className="flex items-start gap-2 p-2 text-sm cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={Boolean(ruleMap[item.key])}
                          onChange={() => toggleRule(item.key)}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="text-gray-800">{item.label}</span>
                          <span className="block text-xs text-gray-400">{item.key}</span>
                        </span>
                      </label>
                    ))}
                    {filteredCatalog.length === 0 && (
                      <p className="p-3 text-xs text-gray-500">No matching document types</p>
                    )}
                  </div>
                )}
              </div>

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

export default function AdminSectorsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout><SectorsContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
