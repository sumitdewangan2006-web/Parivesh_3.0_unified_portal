"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function formatLocation(project) {
  return [project.project_location, project.project_district, project.project_state]
    .filter(Boolean)
    .join(", ") || "-";
}

export default function CitizenAuditProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadApprovedProjects() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE}/citizen-audit/approved-projects?limit=500`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load accepted projects");
        }

        if (!cancelled) {
          setProjects(Array.isArray(data.projects) ? data.projects : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load accepted projects");
          setProjects([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadApprovedProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const states = new Set(
      projects
        .map((project) => String(project.project_state || "").trim())
        .filter(Boolean)
    );

    const sectors = new Set(
      projects
        .map((project) => String(project.sector?.name || "").trim())
        .filter(Boolean)
    );

    return {
      totalProjects: projects.length,
      statesCovered: states.size,
      sectorsCovered: sectors.size,
    };
  }, [projects]);

  const filterOptions = useMemo(() => {
    const states = Array.from(
      new Set(
        projects
          .map((project) => String(project.project_state || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    const districts = Array.from(
      new Set(
        projects
          .map((project) => String(project.project_district || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    const sectors = Array.from(
      new Set(
        projects
          .map((project) => String(project.sector?.name || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    return { states, districts, sectors };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return projects.filter((project) => {
      if (stateFilter && String(project.project_state || "").trim() !== stateFilter) {
        return false;
      }

      if (districtFilter && String(project.project_district || "").trim() !== districtFilter) {
        return false;
      }

      if (sectorFilter && String(project.sector?.name || "").trim() !== sectorFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        project.reference_number,
        project.project_name,
        project.project_location,
        project.project_district,
        project.project_state,
        project.sector?.name,
        project.category?.code,
        project.category?.name,
        project.applicant?.name,
        project.applicant?.organization,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [projects, searchText, stateFilter, districtFilter, sectorFilter]);

  return (
    <main className="min-h-screen bg-[var(--portal-canvas)]">
      <PublicHeader activeNav="Home" />

      <section className="portal-shell px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[var(--portal-border)] bg-white p-6 sm:p-8 shadow-sm">
          <p className="portal-kicker">Citizen Transparency Register</p>
          <h1 className="portal-serif mt-2 text-3xl text-[var(--portal-green-900)]">
            Accepted Projects for Public Citizen Audit
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--portal-muted)]">
            Browse all accepted projects and open the public audit page for any project to view
            and submit community observations with geotagged evidence.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.12em] text-[var(--portal-muted)]">Accepted Projects</div>
              <div className="mt-1 text-2xl font-semibold text-[var(--portal-green-900)]">{stats.totalProjects}</div>
            </div>
            <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.12em] text-[var(--portal-muted)]">States Covered</div>
              <div className="mt-1 text-2xl font-semibold text-[var(--portal-green-900)]">{stats.statesCovered}</div>
            </div>
            <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3">
              <div className="text-xs uppercase tracking-[0.12em] text-[var(--portal-muted)]">Showing</div>
              <div className="mt-1 text-2xl font-semibold text-[var(--portal-green-900)]">
                {filteredProjects.length}
                <span className="ml-1 text-sm font-medium text-[var(--portal-muted)]">of {stats.totalProjects}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-[var(--portal-border)] bg-white p-4 sm:p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-gray-500">Loading accepted projects...</p>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div>
              <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by reference, project, proponent..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-ring lg:col-span-2"
                />

                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-ring"
                >
                  <option value="">All States</option>
                  {filterOptions.states.map((stateName) => (
                    <option key={stateName} value={stateName}>{stateName}</option>
                  ))}
                </select>

                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-ring"
                >
                  <option value="">All Districts</option>
                  {filterOptions.districts.map((districtName) => (
                    <option key={districtName} value={districtName}>{districtName}</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <select
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-ring"
                  >
                    <option value="">All Sectors</option>
                    {filterOptions.sectors.map((sectorName) => (
                      <option key={sectorName} value={sectorName}>{sectorName}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchText("");
                      setStateFilter("");
                      setDistrictFilter("");
                      setSectorFilter("");
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {filteredProjects.length > 0 ? (
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-[0.08em] text-gray-500">
                        <th className="px-3 py-3">Reference</th>
                        <th className="px-3 py-3">Project</th>
                        <th className="px-3 py-3">Sector / Category</th>
                        <th className="px-3 py-3">Location</th>
                        <th className="px-3 py-3">Approved On</th>
                        <th className="px-3 py-3">Citizen Audit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((project) => (
                        <tr key={project.id} className="border-b border-gray-100 align-top last:border-b-0">
                          <td className="px-3 py-3 font-semibold text-[var(--portal-green-900)]">{project.reference_number}</td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-gray-900">{project.project_name}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              Proponent: {project.applicant?.organization || project.applicant?.name || "-"}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-gray-700">
                            <p>{project.sector?.name || "-"}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {project.category?.code || "-"}
                              {project.category?.name ? ` (${project.category.name})` : ""}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-gray-700">{formatLocation(project)}</td>
                          <td className="px-3 py-3 text-gray-700">
                            {formatDate(project.approved_at || project.published_at || project.submitted_at)}
                          </td>
                          <td className="px-3 py-3">
                            <Link
                              href={`/citizen-audit/${encodeURIComponent(project.reference_number)}`}
                              className="inline-flex rounded-lg border border-[var(--portal-border)] px-3 py-1.5 text-xs font-semibold text-[var(--portal-green-900)] transition hover:bg-[var(--portal-soft)]"
                            >
                              Open Audit Page
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-500">No projects match the current filters.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
