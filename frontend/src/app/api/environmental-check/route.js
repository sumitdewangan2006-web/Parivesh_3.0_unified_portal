// Environmental Sensitivity Check — Overpass API proxy
// Queries OpenStreetMap data within 10 km of a coordinate for:
//   forests, rivers/water bodies, protected areas, settlements

import { NextResponse } from "next/server";

// ── Geometry distance helpers ────────────────────────────────────────

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function elementToPoint(el) {
  if (el.type === "node") return { lat: el.lat, lon: el.lon };
  if (el.center) return { lat: el.center.lat, lon: el.center.lon };
  return null;
}

function closestElement(lat, lng, elements) {
  let best = null;
  let bestDist = Infinity;
  for (const el of elements) {
    const pt = elementToPoint(el);
    if (!pt) continue;
    const dist = haversine(lat, lng, pt.lat, pt.lon);
    if (dist < bestDist) {
      bestDist = dist;
      best = { element: el, distance: Math.round(dist * 100) / 100 };
    }
  }
  return best;
}

function toGeoJsonFeatureCollection(elements, category) {
  const features = elements
    .map((el) => {
      const pt = elementToPoint(el);
      if (!pt) return null;
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [pt.lon, pt.lat],
        },
        properties: {
          id: `${el.type}-${el.id}`,
          category,
          name: el.tags?.name || null,
          type:
            el.tags?.landuse ||
            el.tags?.natural ||
            el.tags?.waterway ||
            el.tags?.boundary ||
            el.tags?.leisure ||
            el.tags?.place ||
            null,
        },
      };
    })
    .filter(Boolean);

  return {
    type: "FeatureCollection",
    features,
  };
}

// ── Sensitivity scoring ──────────────────────────────────────────────
// Max score 100 → higher = more environmentally sensitive

function computeScore({ distForest, distRiver, distProtected, distSettlement }) {
  let score = 0;

  // Forest: 0–30
  if (distForest !== null) {
    if (distForest < 1) score += 30;
    else if (distForest < 3) score += 22;
    else if (distForest < 5) score += 12;
    else score += 5;
  }

  // River/water: 0–25
  if (distRiver !== null) {
    if (distRiver < 0.5) score += 25;
    else if (distRiver < 2) score += 15;
    else if (distRiver < 5) score += 8;
    else score += 3;
  }

  // Protected area: 0–30
  if (distProtected !== null) {
    if (distProtected < 1) score += 30;
    else if (distProtected < 3) score += 22;
    else if (distProtected < 5) score += 15;
    else if (distProtected < 10) score += 8;
  }

  // Settlement (population impact): 0–15
  if (distSettlement !== null) {
    if (distSettlement < 0.5) score += 15;
    else if (distSettlement < 2) score += 10;
    else if (distSettlement < 5) score += 5;
  }

  return Math.min(100, score);
}

function sensitivityMeta(score) {
  if (score >= 70) return { label: "Very High", risk_class: "very_high" };
  if (score >= 50) return { label: "High", risk_class: "high" };
  if (score >= 30) return { label: "Moderate", risk_class: "moderate" };
  return { label: "Low", risk_class: "low" };
}

// ── API Route ────────────────────────────────────────────────────────

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat"));
  const lng = parseFloat(searchParams.get("lng"));

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const RADIUS_M = 10000; // 10 km

  const query = `[out:json][timeout:30];
(
  way[landuse=forest](around:${RADIUS_M},${lat},${lng});
  way[natural=wood](around:${RADIUS_M},${lat},${lng});
  relation[landuse=forest](around:${RADIUS_M},${lat},${lng});
  relation[natural=wood](around:${RADIUS_M},${lat},${lng});
  way[waterway=river](around:${RADIUS_M},${lat},${lng});
  way[waterway=stream](around:${RADIUS_M},${lat},${lng});
  way[natural=water](around:${RADIUS_M},${lat},${lng});
  relation[natural=water](around:${RADIUS_M},${lat},${lng});
  relation[boundary=protected_area](around:${RADIUS_M},${lat},${lng});
  way[boundary=protected_area](around:${RADIUS_M},${lat},${lng});
  way[leisure=nature_reserve](around:${RADIUS_M},${lat},${lng});
  relation[leisure=nature_reserve](around:${RADIUS_M},${lat},${lng});
  node[place=village](around:${RADIUS_M},${lat},${lng});
  node[place=hamlet](around:${RADIUS_M},${lat},${lng});
  node[place=town](around:${RADIUS_M},${lat},${lng});
  node[place=city](around:${RADIUS_M},${lat},${lng});
  node[place=suburb](around:${RADIUS_M},${lat},${lng});
);
out center tags;`;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(32000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Overpass API returned an error" }, { status: 502 });
    }

    const data = await res.json();
    const elements = data.elements || [];

    const forests = elements.filter(
      (el) => el.tags?.landuse === "forest" || el.tags?.natural === "wood"
    );
    const rivers = elements.filter(
      (el) =>
        el.tags?.waterway === "river" ||
        el.tags?.waterway === "stream" ||
        el.tags?.natural === "water"
    );
    const protectedAreas = elements.filter(
      (el) =>
        el.tags?.boundary === "protected_area" ||
        el.tags?.leisure === "nature_reserve"
    );
    const settlements = elements.filter(
      (el) =>
        el.tags?.place === "village" ||
        el.tags?.place === "hamlet" ||
        el.tags?.place === "town" ||
        el.tags?.place === "city" ||
        el.tags?.place === "suburb"
    );

    const forestHit = closestElement(lat, lng, forests);
    const riverHit = closestElement(lat, lng, rivers);
    const protectedHit = closestElement(lat, lng, protectedAreas);
    const settlementHit = closestElement(lat, lng, settlements);

    const distForest = forestHit?.distance ?? null;
    const distRiver = riverHit?.distance ?? null;
    const distProtected = protectedHit?.distance ?? null;
    const distSettlement = settlementHit?.distance ?? null;

    const score = computeScore({ distForest, distRiver, distProtected, distSettlement });
    const { label, risk_class } = sensitivityMeta(score);

    const buildResult = (hit, defaultType) =>
      hit
        ? {
            distance_km: hit.distance,
            name: hit.element.tags?.name || null,
            type:
              hit.element.tags?.landuse ||
              hit.element.tags?.natural ||
              hit.element.tags?.waterway ||
              hit.element.tags?.boundary ||
              hit.element.tags?.leisure ||
              hit.element.tags?.place ||
              defaultType,
          }
        : null;

    return NextResponse.json({
      lat,
      lng,
      analysis: {
        sensitivity_score: score,
        sensitivity_label: label,
        risk_class,
        forest: buildResult(forestHit, "forest"),
        river: buildResult(riverHit, "water"),
        protected_area: buildResult(protectedHit, "protected_area"),
        settlement: buildResult(settlementHit, "settlement"),
        counts: {
          forests: forests.length,
          rivers: rivers.length,
          protected_areas: protectedAreas.length,
          settlements: settlements.length,
        },
      },
      geojson: {
        forests: toGeoJsonFeatureCollection(forests, "forest"),
        rivers: toGeoJsonFeatureCollection(rivers, "river"),
        protected_areas: toGeoJsonFeatureCollection(protectedAreas, "protected_area"),
        settlements: toGeoJsonFeatureCollection(settlements, "settlement"),
      },
    });
  } catch (err) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      return NextResponse.json(
        { error: "Analysis timed out — Overpass API is busy, try again shortly" },
        { status: 504 }
      );
    }
    console.error("Environmental check error:", err?.message || err);
    return NextResponse.json({ error: "Environmental check failed" }, { status: 500 });
  }
}
