"use client";

// Inner Leaflet map — loaded only on client side (imported via next/dynamic with ssr:false)
// Uses vanilla Leaflet via dynamic import() inside useEffect to avoid SSR issues.

import { useEffect, useRef } from "react";

const INDIA_CENTER = [22.0, 82.0];
const DEFAULT_ZOOM = 5;

const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const MARKER_ICON_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const MARKER_ICON_2X_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const MARKER_SHADOW_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

function injectLeafletCSS() {
  if (document.getElementById("leaflet-css-link")) return;
  const link = document.createElement("link");
  link.id = "leaflet-css-link";
  link.rel = "stylesheet";
  link.href = LEAFLET_CSS_URL;
  document.head.appendChild(link);
}

export default function EnvironmentalSensitivityMapCore({ onLocationClick, flyTo, geojson }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geoLayersRef = useRef([]);
  const onClickRef = useRef(onLocationClick);

  // Keep callback ref up to date without re-initializing the map
  useEffect(() => {
    onClickRef.current = onLocationClick;
  }, [onLocationClick]);

  // Initialize Leaflet map once
  useEffect(() => {
    let destroyed = false;

    async function init() {
      if (!elRef.current || mapRef.current) return;

      injectLeafletCSS();

      const L = (await import("leaflet")).default;
      if (destroyed || !elRef.current || mapRef.current) return;

      // Fix broken default icon paths in webpack builds
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: MARKER_ICON_URL,
        iconRetinaUrl: MARKER_ICON_2X_URL,
        shadowUrl: MARKER_SHADOW_URL,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const map = L.map(elRef.current, {
        center: INDIA_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
        markerRef.current
          .bindPopup(`<b>Selected</b><br/>${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          .openPopup();

        onClickRef.current?.(lat, lng);
      });
    }

    init();

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Fly to an external coordinate (from geocoding / form propagation)
  useEffect(() => {
    if (!flyTo) return;

    import("leaflet").then(({ default: L }) => {
      const map = mapRef.current;
      if (!map) return;

      if (markerRef.current) {
        markerRef.current.setLatLng([flyTo.lat, flyTo.lng]);
      } else {
        markerRef.current = L.marker([flyTo.lat, flyTo.lng]).addTo(map);
      }
      markerRef.current
        .bindPopup(`<b>Selected</b><br/>${flyTo.lat.toFixed(5)}, ${flyTo.lng.toFixed(5)}`)
        .openPopup();

      map.flyTo([flyTo.lat, flyTo.lng], 12, { duration: 1.2 });
    });
  }, [flyTo]);

  // Render GeoJSON overlays (forests/rivers/protected/settlements)
  useEffect(() => {
    if (!geojson || !mapRef.current) return;

    import("leaflet").then(({ default: L }) => {
      const map = mapRef.current;
      if (!map) return;

      geoLayersRef.current.forEach((layer) => map.removeLayer(layer));
      geoLayersRef.current = [];

      const groups = [
        { key: "forests", color: "#16a34a" },
        { key: "rivers", color: "#0ea5e9" },
        { key: "protected_areas", color: "#dc2626" },
        { key: "settlements", color: "#d97706" },
      ];

      for (const group of groups) {
        const collection = geojson[group.key];
        if (!collection?.features?.length) continue;

        const layer = L.geoJSON(collection, {
          pointToLayer: (feature, latlng) =>
            L.circleMarker(latlng, {
              radius: 4,
              color: group.color,
              fillColor: group.color,
              fillOpacity: 0.35,
              weight: 1,
            }),
          onEachFeature: (feature, layerItem) => {
            const name = feature.properties?.name || "Unnamed";
            const type = feature.properties?.type || feature.properties?.category || "feature";
            layerItem.bindPopup(`<b>${name}</b><br/>${type}`);
          },
        }).addTo(map);

        geoLayersRef.current.push(layer);
      }
    });
  }, [geojson]);

  return (
    <div
      ref={elRef}
      style={{ height: "100%", width: "100%", minHeight: "320px" }}
      className="rounded-lg overflow-hidden"
    />
  );
}
