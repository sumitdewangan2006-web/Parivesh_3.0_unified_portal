"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function formatDate(value) {
  try {
    return new Date(value).toLocaleString("en-IN");
  } catch {
    return value;
  }
}

export default function CitizenAuditPublicPage() {
  const { referenceNumber } = useParams();
  const decodedReference = useMemo(
    () => decodeURIComponent(String(referenceNumber || "")).trim(),
    [referenceNumber]
  );

  const [application, setApplication] = useState(null);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    citizen_name: "",
    contact_email: "",
    contact_phone: "",
    biodiversity_tags: "",
    observation_text: "",
    latitude: "",
    longitude: "",
  });
  const [photoFile, setPhotoFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/citizen-audit/${encodeURIComponent(decodedReference)}/observations`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load citizen observations");
      }
      setApplication(data.application);
      setObservations(Array.isArray(data.observations) ? data.observations : []);
    } catch (err) {
      toast.error(err.message || "Failed to load citizen audit page");
      setApplication(null);
      setObservations([]);
    } finally {
      setLoading(false);
    }
  }, [decodedReference]);

  useEffect(() => {
    load();
  }, [load]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude.toFixed(7)),
          longitude: String(position.coords.longitude.toFixed(7)),
        }));
      },
      () => {
        toast.error("Unable to retrieve your location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitObservation = async (e) => {
    e.preventDefault();

    if (!form.observation_text.trim() || form.observation_text.trim().length < 10) {
      toast.error("Observation must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          fd.append(key, String(value).trim());
        }
      });
      if (photoFile) fd.append("photo", photoFile);

      const response = await fetch(
        `${API_BASE}/citizen-audit/${encodeURIComponent(decodedReference)}/observations`,
        {
          method: "POST",
          body: fd,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit observation");
      }

      toast.success("Observation submitted. Thank you for contributing.");
      setForm({
        citizen_name: "",
        contact_email: "",
        contact_phone: "",
        biodiversity_tags: "",
        observation_text: "",
        latitude: "",
        longitude: "",
      });
      setPhotoFile(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--portal-canvas)]">
      <PublicHeader activeNav="Home" />

      <section className="portal-shell px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[var(--portal-border)] bg-white p-6 sm:p-8 shadow-sm">
          <p className="portal-kicker">Government to Citizen Transparency Layer</p>
          <h1 className="portal-serif mt-2 text-3xl text-[var(--portal-green-900)]">
            Public Sentiment and Observation
          </h1>
          <p className="mt-3 text-sm text-[var(--portal-muted)] leading-6">
            Local communities can submit geo-tagged observations, biodiversity concerns, and
            supporting photos related to this proposed project.
          </p>

          <div className="mt-5 rounded-2xl bg-[var(--portal-soft)] p-4 text-sm">
            <div className="font-semibold text-[var(--portal-green-900)]">
              Reference: {decodedReference || "-"}
            </div>
            {application ? (
              <>
                <div className="mt-1 text-[var(--portal-muted)]">{application.project_name}</div>
                <div className="text-[var(--portal-muted)]">
                  {[application.project_location, application.project_district, application.project_state]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </>
            ) : !loading ? (
              <div className="mt-1 text-red-600">Application not found or unavailable for public audit.</div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[var(--portal-border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Submit Observation</h2>
            <form onSubmit={submitObservation} className="mt-4 space-y-3">
              <input
                value={form.citizen_name}
                onChange={(e) => setForm((prev) => ({ ...prev, citizen_name: e.target.value }))}
                placeholder="Your name (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={form.contact_email}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="Email (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                />
                <input
                  value={form.contact_phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="Phone (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                />
              </div>
              <textarea
                rows={5}
                required
                value={form.observation_text}
                onChange={(e) => setForm((prev) => ({ ...prev, observation_text: e.target.value }))}
                placeholder="Describe biodiversity observations, local ecological concerns, water bodies, flora/fauna impact, or issues missed in official reports..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
              />
              <input
                value={form.biodiversity_tags}
                onChange={(e) => setForm((prev) => ({ ...prev, biodiversity_tags: e.target.value }))}
                placeholder="Tags (comma separated): wetland, migratory birds, sacred grove"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={form.latitude}
                  onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                  placeholder="Latitude"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                />
                <input
                  value={form.longitude}
                  onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                  placeholder="Longitude"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus-ring"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={useCurrentLocation} className="px-3 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50">
                  Use Current Location
                </button>
                <label className="px-3 py-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  Upload Geo-tagged Photo
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {photoFile && <span className="text-xs text-gray-500 self-center truncate max-w-[220px]">{photoFile.name}</span>}
              </div>

              <button
                type="submit"
                disabled={submitting || !application}
                className="portal-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Public Observation"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-[var(--portal-border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Community Observation Feed</h2>
            <p className="text-xs text-gray-500 mt-1">Published citizen observations for this project reference.</p>

            {loading ? (
              <p className="text-sm text-gray-500 mt-4">Loading observations...</p>
            ) : observations.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4">No public observations yet.</p>
            ) : (
              <ul className="mt-4 space-y-3 max-h-[620px] overflow-auto pr-1">
                {observations.map((item) => (
                  <li key={item.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">{item.citizen_name || "Anonymous Citizen"}</p>
                      <p className="text-[11px] text-gray-400">{formatDate(item.created_at)}</p>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{item.observation_text}</p>

                    {Array.isArray(item.biodiversity_tags) && item.biodiversity_tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.biodiversity_tags.map((tag) => (
                          <span key={`${item.id}-${tag}`} className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {(item.latitude !== null || item.longitude !== null) && (
                      <p className="mt-2 text-xs text-gray-500">
                        Geo-tag: {item.latitude ?? "-"}, {item.longitude ?? "-"}
                      </p>
                    )}

                    {item.photo_url && (
                      <div className="mt-3">
                        <img
                          src={`${API_BASE}${item.photo_url}`}
                          alt="Citizen submitted evidence"
                          className="max-h-52 rounded border border-gray-200 object-cover"
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
