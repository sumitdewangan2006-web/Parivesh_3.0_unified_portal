"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import MockPaymentGateway from "@/components/MockPaymentGateway";
import DocumentTypeUploadGrid from "@/components/DocumentTypeUploadGrid";
import MineralChecklist from "@/components/MineralChecklist";
import AffidavitPoints from "@/components/AffidavitPoints";
import AffidavitDeclarationEngine from "@/components/AffidavitDeclarationEngine";
import EnvironmentalSensitivityMap from "@/components/EnvironmentalSensitivityMap";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { sortDocumentsByTypeOrder } from "@/lib/documentTypes";
import { CORE_AFFIDAVIT_DECLARATIONS, getChecklist, MINERAL_TYPES } from "@/lib/checklistData";

const STEPS = [
  "Category & Sector",
  "Project Details",
  "Location & Cost",
  "Documents",
  "Review",
  "Pay & Auto-Submit",
];

function NewApplicationContent() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appId, setAppId] = useState(null);
  const [sectorRules, setSectorRules] = useState([]);
  const [effectiveChecklist, setEffectiveChecklist] = useState([]);
  const [checkedDeclarations, setCheckedDeclarations] = useState([]);
  const [envAnalysis, setEnvAnalysis] = useState(null);
  const [showEnvMap, setShowEnvMap] = useState(false);

  const [form, setForm] = useState({
    category_id: "",
    sector_id: "",
    mineral_type: "",
    project_name: "",
    project_description: "",
    project_location: "",
    project_state: "",
    project_district: "",
    khasra_no: "",
    lease_area: "",
    project_area: "",
    estimated_cost: "",
  });

  const selectedMineralType = form.mineral_type || "";

  // Document upload state
  const [files, setFiles] = useState([]);

  const uploadedDocumentKeys = files.map((f) => f.document_type);
  const uploadedDocumentSet = new Set(uploadedDocumentKeys);
  const checklistSource = effectiveChecklist.length ? effectiveChecklist : getChecklist(selectedMineralType);
  const requiredChecklistItems = checklistSource.filter((item) => item.required);
  const missingRequiredChecklistItems = requiredChecklistItems.filter(
    (item) => !uploadedDocumentSet.has(item.key)
  );
  const allDeclarationsChecked = CORE_AFFIDAVIT_DECLARATIONS.every((point) =>
    checkedDeclarations.includes(point)
  );

  useEffect(() => {
    Promise.all([api.get("/config/categories"), api.get("/config/sectors")])
      .then(([c, s]) => {
        setCategories(c.data.filter((cat) => cat.is_active));
        setSectors(s.data.filter((sec) => sec.is_active));
      })
      .catch(() => toast.error("Failed to load form data"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSectorChecklist() {
      if (!form.sector_id || !selectedMineralType) {
        setSectorRules([]);
        setEffectiveChecklist([]);
        return;
      }

      try {
        const [rulesRes, checklistRes] = await Promise.all([
          api.get(`/config/sectors/${form.sector_id}/document-rules`),
          api.get(`/config/sectors/${form.sector_id}/checklists/${selectedMineralType}`),
        ]);

        if (cancelled) return;
        setSectorRules(rulesRes.data || []);
        setEffectiveChecklist(checklistRes.data || []);
      } catch {
        if (cancelled) return;
        setSectorRules([]);
        setEffectiveChecklist(getChecklist(selectedMineralType));
      }
    }

    loadSectorChecklist();
    return () => {
      cancelled = true;
    };
  }, [form.sector_id, selectedMineralType]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (field === "sector_id" || field === "mineral_type") {
      setFiles([]);
      setCheckedDeclarations([]);
    }
  };

  // Step save: create draft first, then update on subsequent steps.
  const saveStep = async () => {
    setSaving(true);
    try {
      if (!appId) {
        const { data } = await api.post("/applications", {
          category_id: Number(form.category_id),
          sector_id: Number(form.sector_id),
          mineral_type: form.mineral_type,
          project_name: form.project_name,
        });
        setAppId(data.id);
        toast.success("Draft created");
      } else {
        await api.put(`/applications/${appId}`, form);
        toast.success("Draft saved");
      }
      setStep((s) => s + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Save latest draft data before entering payment step.
  const saveAndProceedToPayment = async () => {
    if (missingRequiredChecklistItems.length > 0) {
      toast.error(`Upload all required checklist documents before payment (${missingRequiredChecklistItems.length} pending)`);
      setStep(3);
      return;
    }

    if (!allDeclarationsChecked) {
      toast.error("Complete all affidavit declarations before payment");
      setStep(3);
      return;
    }

    setSaving(true);
    try {
      await api.put(`/applications/${appId}`, form);
      setStep(5);
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <>
      <PageHeader title="New Application" subtitle="Create a draft, pay the EC fee, and submit automatically" />

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap
                ${i === step ? "bg-primary-100 text-primary-700" : i < step ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${i === step ? "bg-primary-600 text-white" : i < step ? "bg-green-500 text-white" : "bg-gray-300 text-white"}`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              {label}
            </div>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      <div className="card max-w-2xl">
        {/* Step 0: Category & Sector */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Category *</label>
              <select
                required
                value={form.category_id}
                onChange={(e) => update("category_id", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry Sector *</label>
              <select
                required
                value={form.sector_id}
                onChange={(e) => update("sector_id", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
              >
                <option value="">Select sector...</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mineral / Project Type *
                <span className="ml-1 text-xs font-normal text-gray-400">
                  (used for checklist and affidavit points)
                </span>
              </label>
              <select
                required
                value={form.mineral_type}
                onChange={(e) => update("mineral_type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
              >
                <option value="">Select mineral / project type...</option>
                {MINERAL_TYPES.map((mt) => (
                  <option key={mt.value} value={mt.value}>
                    {mt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input
                required
                value={form.project_name}
                onChange={(e) => update("project_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                placeholder="E.g. 500 MW Solar Power Plant"
              />
            </div>
          </div>
        )}

        {/* Step 1: Project Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
              <textarea
                rows={5}
                value={form.project_description}
                onChange={(e) => update("project_description", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                placeholder="Describe project scope, activities, and expected environmental impact..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Location & Cost */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  value={form.project_state}
                  onChange={(e) => update("project_state", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input
                  value={form.project_district}
                  onChange={(e) => update("project_district", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Khasra No.</label>
              <input
                value={form.khasra_no}
                onChange={(e) => update("khasra_no", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                placeholder="E.g. 123/1, 123/2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address</label>
              <input
                value={form.project_location}
                onChange={(e) => update("project_location", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                placeholder="Full address or coordinates"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lease Area (hectares)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.lease_area}
                  onChange={(e) => update("lease_area", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Area (hectares)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.project_area}
                  onChange={(e) => update("project_area", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (INR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={form.estimated_cost}
                  onChange={(e) => update("estimated_cost", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                  placeholder="Required - fee is calculated from this"
                />
              </div>
            </div>

            {/* Environmental Sensitivity Map */}
            <div className="rounded-lg border border-green-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowEnvMap((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 text-sm font-medium text-green-900"
              >
                <span>🗺&#xFE0E; Environmental Sensitivity Check (Recommended)</span>
                <span className="text-xs text-green-600">{showEnvMap ? "Hide map ▲" : "Show map ▼"}</span>
              </button>
              {showEnvMap && (
                <div className="p-4 bg-white">
                  <p className="text-xs text-gray-500 mb-3">
                    Click on the map or search for your project location to automatically check
                    proximity to forests, rivers, protected areas, and population zones.
                  </p>
                  <EnvironmentalSensitivityMap
                    onLocationSelect={({ lat, lng }) => {
                      if (!form.project_location) {
                        update("project_location", `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                      }
                    }}
                    onAnalysisComplete={(result) => setEnvAnalysis(result)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload documents into dedicated slots so the scrutiny team receives them already sorted by type.
            </p>
            <DocumentTypeUploadGrid
              applicationId={appId}
              categoryCode={categories.find((c) => String(c.id) === String(form.category_id))?.code}
              mineralType={selectedMineralType}
              sectorRules={sectorRules}
              documents={files}
              canUpload
              onUploadComplete={(data) =>
                setFiles((prev) =>
                  sortDocumentsByTypeOrder([
                    ...prev.filter((doc) => doc.document_type !== data.document_type),
                    data,
                  ])
                )
              }
            />

            {selectedMineralType && (
              <div className="space-y-4 pt-2">
                <MineralChecklist
                  mineralType={selectedMineralType}
                  checklistItems={checklistSource}
                  uploadedDocumentKeys={uploadedDocumentKeys}
                />
                <AffidavitPoints mineralType={selectedMineralType} />
                <AffidavitDeclarationEngine
                  checkedDeclarations={checkedDeclarations}
                  onCheckedChange={setCheckedDeclarations}
                />

                {missingRequiredChecklistItems.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-medium">
                      {missingRequiredChecklistItems.length} required document(s) still pending.
                    </p>
                    <p className="text-xs mt-1 text-amber-800">
                      Upload all required checklist documents to proceed to payment and submission.
                    </p>
                  </div>
                )}
                {!allDeclarationsChecked && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-medium">Affidavit declaration is incomplete.</p>
                    <p className="text-xs mt-1 text-amber-800">
                      Please check all affidavit declaration boxes before continuing.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold text-gray-900">Review Your Application</h4>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-gray-500">Category</dt>
              <dd>{categories.find((c) => String(c.id) === String(form.category_id))?.name || "-"}</dd>

              <dt className="text-gray-500">Sector</dt>
              <dd>{sectors.find((s) => String(s.id) === String(form.sector_id))?.name || "-"}</dd>

              <dt className="text-gray-500">Mineral/Project Type</dt>
              <dd>{MINERAL_TYPES.find((mt) => mt.value === form.mineral_type)?.label || "-"}</dd>

              <dt className="text-gray-500">Project</dt>
              <dd>{form.project_name || "-"}</dd>

              <dt className="text-gray-500">State</dt>
              <dd>{form.project_state || "-"}</dd>

              <dt className="text-gray-500">District</dt>
              <dd>{form.project_district || "-"}</dd>

              <dt className="text-gray-500">Khasra No.</dt>
              <dd>{form.khasra_no || "-"}</dd>

              <dt className="text-gray-500">Lease Area</dt>
              <dd>{form.lease_area ? `${form.lease_area} ha` : "-"}</dd>

              <dt className="text-gray-500">Area</dt>
              <dd>{form.project_area ? `${form.project_area} ha` : "-"}</dd>

              <dt className="text-gray-500">Estimated Cost</dt>
              <dd>{form.estimated_cost ? `INR ${Number(form.estimated_cost).toLocaleString("en-IN")}` : "-"}</dd>

              <dt className="text-gray-500">Documents</dt>
              <dd>{files.length} uploaded</dd>

              <dt className="text-gray-500">Required Checklist Docs</dt>
              <dd>
                {requiredChecklistItems.length
                  ? `${requiredChecklistItems.length - missingRequiredChecklistItems.length}/${requiredChecklistItems.length} complete`
                  : "-"}
              </dd>

              <dt className="text-gray-500">Affidavit Declaration</dt>
              <dd>{allDeclarationsChecked ? "Complete" : "Pending"}</dd>

              {envAnalysis && (
                <>
                  <dt className="text-gray-500">Env. Sensitivity</dt>
                  <dd>
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        envAnalysis.risk_class === "very_high"
                          ? "bg-red-100 text-red-700"
                          : envAnalysis.risk_class === "high"
                            ? "bg-orange-100 text-orange-700"
                            : envAnalysis.risk_class === "moderate"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                      }`}
                    >
                      {envAnalysis.sensitivity_label} ({envAnalysis.sensitivity_score}/100)
                    </span>
                  </dd>
                  {envAnalysis.forest && (
                    <>
                      <dt className="text-gray-500">Distance to Forest</dt>
                      <dd>{envAnalysis.forest.distance_km} km{envAnalysis.forest.name ? ` — ${envAnalysis.forest.name}` : ""}</dd>
                    </>
                  )}
                  {envAnalysis.river && (
                    <>
                      <dt className="text-gray-500">Distance to Water Body</dt>
                      <dd>{envAnalysis.river.distance_km} km{envAnalysis.river.name ? ` — ${envAnalysis.river.name}` : ""}</dd>
                    </>
                  )}
                  {envAnalysis.protected_area && (
                    <>
                      <dt className="text-gray-500">Protected Area</dt>
                      <dd>{envAnalysis.protected_area.distance_km} km — {envAnalysis.protected_area.name || "Protected area nearby"}</dd>
                    </>
                  )}
                </>
              )}
            </dl>
            {missingRequiredChecklistItems.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-semibold mb-1">Pending required documents:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {missingRequiredChecklistItems.map((item) => (
                    <li key={item.key}>{item.label}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Please review details above. The next step collects the mandatory EC fee and auto-submits the draft.
            </p>
          </div>
        )}

        {/* Step 5: Pay & Auto-Submit */}
        {step === 5 && appId && (
          <MockPaymentGateway
            applicationId={appId}
            onPaymentSuccess={() => {
              toast.success("Application submitted to Scrutiny Team!");
              router.push(`/proponent/applications/${appId}`);
            }}
            onCancel={() => setStep(4)}
          />
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-30"
            >
              Previous
            </button>
            <button
              onClick={step <= 2 ? saveStep : step === 4 ? saveAndProceedToPayment : () => setStep((s) => s + 1)}
              disabled={
                saving ||
                (step === 0 && (!form.category_id || !form.sector_id || !form.mineral_type || !form.project_name)) ||
                (step === 2 && !form.estimated_cost) ||
                (step === 3 && (missingRequiredChecklistItems.length > 0 || !allDeclarationsChecked)) ||
                (step === 4 && (missingRequiredChecklistItems.length > 0 || !allDeclarationsChecked))
              }
              className="px-5 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 font-medium"
            >
              {saving ? "Saving..." : step === 4 ? "Proceed to Payment" : "Next"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function NewApplicationPage() {
  return (
    <ProtectedRoute allowedRoles={["project_proponent"]}>
      <DashboardLayout>
        <NewApplicationContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
