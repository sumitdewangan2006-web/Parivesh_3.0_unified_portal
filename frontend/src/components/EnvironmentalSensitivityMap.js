"use client";

// Environmental Sensitivity Map
// Renders a Leaflet/OSM map; on location click, queries the Overpass API proxied
// through /api/environmental-check and shows a real-time sensitivity scorecard.

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

// Leaflet map is loaded client-only to avoid SSR issues
const MapCore = dynamic(() => import("./EnvironmentalSensitivityMapCore"), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

// ── Sensitivity score helpers ────────────────────────────────────────

const RISK_META = {
  very_high: { label: "Very High", bar: "bg-red-500", badge: "bg-red-100 text-red-700 border-red-200" },
  high:      { label: "High",      bar: "bg-orange-500", badge: "bg-orange-100 text-orange-700 border-orange-200" },
  moderate:  { label: "Moderate",  bar: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  low:       { label: "Low",       bar: "bg-green-500", badge: "bg-green-100 text-green-700 border-green-200" },
};

function ScoreBar({ score, riskClass }) {
  const meta = RISK_META[riskClass] || RISK_META.low;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Sensitivity Score</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${meta.badge}`}>
          {meta.label}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${meta.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-right text-xs text-gray-400 mt-0.5">{score} / 100</p>
    </div>
  );
}

function FeatureRow({ icon, title, result, notFoundRadius }) {
  if (!result) {
    return (
      <div className="flex items-start gap-3 py-2 text-sm">
        <span className="text-lg leading-none">{icon}</span>
        <div>
          <p className="font-medium text-gray-700">{title}</p>
          <p className="text-xs text-gray-400">Not found within {notFoundRadius}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 py-2 text-sm">
      <span className="text-lg leading-none">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-700">{title}</p>
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-800">{result.distance_km} km</span>
          {result.name ? ` — ${result.name}` : ""}
          {result.type ? (
            <span className="ml-1 text-gray-400 capitalize">({result.type.replace(/_/g, " ")})</span>
          ) : null}
        </p>
      </div>
      <span
        className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
          result.distance_km < 1
            ? "bg-red-100 text-red-600"
            : result.distance_km < 3
              ? "bg-orange-100 text-orange-600"
              : "bg-green-100 text-green-600"
        }`}
      >
        {result.distance_km < 1 ? "Very Near" : result.distance_km < 3 ? "Near" : "Far"}
      </span>
    </div>
  );
}

// ── Address geocoder (Nominatim) ─────────────────────────────────────

function AddressSearch({ onResult }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q || q.length < 3) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const pick = (item) => {
    onResult({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), label: item.display_name });
    setQuery(item.display_name.split(",")[0]);
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleInput}
            placeholder="Search location in India..."
            className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus-ring"
          />
          {searching && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>
      {results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-[9999] text-sm max-h-48 overflow-auto">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 truncate"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────

export default function EnvironmentalSensitivityMap({
  onLocationSelect,
  onAnalysisComplete,
  initialCoords = null,
}) {
  const [coords, setCoords] = useState(initialCoords);     // { lat, lng }
  const [flyTo, setFlyTo] = useState(initialCoords);       // triggers MapCore fly
  const [analysis, setAnalysis] = useState(null);
  const [geojson, setGeojson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = useCallback(
    async (lat, lng) => {
      setLoading(true);
      setError(null);
      onLocationSelect?.({ lat, lng });

      try {
        const res = await fetch(`/api/environmental-check?lat=${lat}&lng=${lng}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Analysis failed");
        }
        const data = await res.json();
        setAnalysis(data.analysis);
        setGeojson(data.geojson || null);
        onAnalysisComplete?.(data.analysis);
      } catch (err) {
        setError(err.message || "Could not complete analysis");
        setGeojson(null);
      } finally {
        setLoading(false);
      }
    },
    [onLocationSelect, onAnalysisComplete]
  );

  const handleMapClick = useCallback(
    (lat, lng) => {
      setCoords({ lat, lng });
      runAnalysis(lat, lng);
    },
    [runAnalysis]
  );

  const handleGeocode = useCallback(
    ({ lat, lng, label }) => {
      const newCoords = { lat, lng };
      setCoords(newCoords);
      setFlyTo(newCoords);
      runAnalysis(lat, lng);
    },
    [runAnalysis]
  );

  return (
    <div className="space-y-3">
      {/* Address search */}
      <AddressSearch onResult={handleGeocode} />

      <div className="grid lg:grid-cols-3 gap-3">
        {/* Map */}
        <div className="lg:col-span-2 rounded-lg overflow-hidden border border-gray-200 shadow-sm" style={{ height: "380px" }}>
          <MapCore onLocationClick={handleMapClick} flyTo={flyTo} geojson={geojson} />
        </div>

        {/* Analysis panel */}
        <div className="flex flex-col gap-3">
          {!coords && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <span className="text-4xl mb-2">📍</span>
              <p className="text-sm font-medium text-gray-700">Click on the map or search above</p>
              <p className="text-xs text-gray-400 mt-1">
                The system will check nearby forests, rivers, protected areas, and settlements
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
              <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium text-gray-700">Analyzing location...</p>
              <p className="text-xs text-gray-400 mt-1">Querying OpenStreetMap data</p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">Analysis failed</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              {coords && (
                <button
                  type="button"
                  onClick={() => runAnalysis(coords.lat, coords.lng)}
                  className="mt-2 text-xs text-red-700 underline hover:no-underline"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {analysis && !loading && (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Score header */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Environmental Sensitivity Score
                </p>
                <ScoreBar
                  score={analysis.sensitivity_score}
                  riskClass={analysis.risk_class}
                />
              </div>

              {/* Feature rows */}
              <div className="px-4 divide-y divide-gray-100">
                <FeatureRow
                  icon="🌲"
                  title="Nearest Forest"
                  result={analysis.forest}
                  notFoundRadius="10 km"
                />
                <FeatureRow
                  icon="🌊"
                  title="Nearest Water Body"
                  result={analysis.river}
                  notFoundRadius="10 km"
                />
                <FeatureRow
                  icon="🛡️"
                  title="Protected / Wildlife Area"
                  result={analysis.protected_area}
                  notFoundRadius="10 km"
                />
                <FeatureRow
                  icon="🏘️"
                  title="Nearest Settlement"
                  result={analysis.settlement}
                  notFoundRadius="10 km"
                />
              </div>

              {/* Coordinates & feature counts */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 space-y-0.5">
                <p>
                  {coords?.lat?.toFixed(5)}, {coords?.lng?.toFixed(5)}
                </p>
                <p>
                  {analysis.counts.forests} forests · {analysis.counts.rivers} water bodies ·{" "}
                  {analysis.counts.protected_areas} protected areas · {analysis.counts.settlements}{" "}
                  settlements found within 10 km
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Data from{" "}
        <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer" className="underline">
          OpenStreetMap
        </a>{" "}
        via Overpass API. Distances are straight-line. For regulatory assessments, consult official
        Forest/Wildlife Department maps.
      </p>
    </div>
  );
}
