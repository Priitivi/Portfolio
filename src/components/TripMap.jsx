import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

const attractionPoints = [
  {
    id: "durdle-door",
    name: "Durdle Door",
    category: "attractions",
    coordinates: [50.6212, -2.2768],
    detail: "The headline stop: limestone arch, beach and steep coastal views.",
  },
  {
    id: "man-o-war",
    name: "Man O’War Beach",
    category: "attractions",
    coordinates: [50.6215, -2.271],
    detail: "Sheltered cove beside Durdle Door.",
  },
  {
    id: "lulworth-cove",
    name: "Lulworth Cove",
    category: "attractions",
    coordinates: [50.6184, -2.2469],
    detail: "Cove, food stops and a useful starting point for a short wander.",
  },
  {
    id: "stair-hole",
    name: "Stair Hole",
    category: "attractions",
    coordinates: [50.6206, -2.2504],
    detail: "Compact coastal viewpoint near Lulworth Cove.",
  },
  {
    id: "chesil-beach",
    name: "Chesil Beach",
    category: "attractions",
    coordinates: [50.6206, -2.536],
    detail: "A dramatic shingle ridge beside the Fleet lagoon.",
  },
  {
    id: "portland-bill",
    name: "Portland Bill Lighthouse",
    category: "attractions",
    coordinates: [50.5134, -2.4563],
    detail: "Big sea views at the southern tip of Portland.",
  },
  {
    id: "weymouth-harbour",
    name: "Weymouth Harbour",
    category: "attractions",
    coordinates: [50.6091, -2.454],
    detail: "Likely departure area for a beginner fishing charter.",
  },
];

const walkPoints = [
  {
    id: "lulworth-shoreline",
    name: "Lulworth Cove shoreline",
    category: "walks",
    coordinates: [50.6195, -2.249],
    detail: "Gentle five-minute approach from the main car park to the cove.",
  },
  {
    id: "stair-hole-viewpoint",
    name: "Stair Hole viewpoint",
    category: "walks",
    coordinates: [50.621, -2.251],
    detail: "Short accessible section; the longer 3.5 km coast route is moderate.",
  },
  {
    id: "portland-flat-path",
    name: "Portland Bill lighthouse path",
    category: "walks",
    coordinates: [50.5143, -2.4553],
    detail: "Wide, flat viewpoint path from the lighthouse car park.",
  },
];

const categoryConfig = {
  campsites: { label: "Campsites", colour: "#e66b3c" },
  attractions: { label: "Attractions", colour: "#24483d" },
  walks: { label: "Easy walk ideas", colour: "#e1aa3a" },
};

function buildPopup(point) {
  const wrapper = document.createElement("div");
  wrapper.className = "trip-map-popup";

  const eyebrow = document.createElement("span");
  eyebrow.textContent = categoryConfig[point.category].label;
  wrapper.appendChild(eyebrow);

  const title = document.createElement("strong");
  title.textContent = point.name;
  wrapper.appendChild(title);

  const detail = document.createElement("p");
  detail.textContent = point.detail;
  wrapper.appendChild(detail);

  const link = document.createElement("a");
  const [latitude, longitude] = point.coordinates;
  link.href = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "Open directions ↗";
  wrapper.appendChild(link);

  return wrapper;
}

function TripMap({ campsites }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const leafletRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState(() => new Set(Object.keys(categoryConfig)));

  const points = useMemo(() => {
    const campsitePoints = campsites
      .filter((campsite) => Array.isArray(campsite.coordinates))
      .map((campsite) => ({
        id: campsite.id,
        name: campsite.name,
        category: "campsites",
        coordinates: campsite.coordinates,
        detail: `${campsite.area}${campsite.rating ? ` · ${campsite.rating} on Google` : ""}`,
      }));

    return [...campsitePoints, ...attractionPoints, ...walkPoints];
  }, [campsites]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return undefined;

    let isDisposed = false;

    async function initialiseMap() {
      const leafletModule = await import("leaflet");
      if (isDisposed || !mapElementRef.current) return;

      const leaflet = leafletModule.default;
      const map = leaflet.map(mapElementRef.current, {
        center: [50.605, -2.41],
        zoom: 10,
        scrollWheelZoom: false,
        zoomControl: false,
      });

      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      leaflet.control.zoom({ position: "bottomright" }).addTo(map);

      leafletRef.current = leaflet;
      markerLayerRef.current = leaflet.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);

      window.requestAnimationFrame(() => map.invalidateSize());
    }

    initialiseMap();

    return () => {
      isDisposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!leaflet || !map || !markerLayer || !mapReady) return;

    markerLayer.clearLayers();
    const visiblePoints = points.filter((point) => visibleCategories.has(point.category));

    visiblePoints.forEach((point) => {
      const config = categoryConfig[point.category];
      leaflet.circleMarker(point.coordinates, {
        radius: point.category === "campsites" ? 9 : 7,
        color: "#f7f2e8",
        weight: 3,
        fillColor: config.colour,
        fillOpacity: 1,
      })
        .bindPopup(buildPopup(point), { maxWidth: 240 })
        .addTo(markerLayer);
    });

    if (visiblePoints.length) {
      map.fitBounds(
        leaflet.latLngBounds(visiblePoints.map((point) => point.coordinates)).pad(0.12),
        { maxZoom: 11 },
      );
    }
  }, [mapReady, points, visibleCategories]);

  const toggleCategory = (category) => {
    setVisibleCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <section className="trip-map-panel" aria-labelledby="trip-map-title">
      <div className="trip-map-toolbar">
        <div>
          <span className="section-kicker">Explore the coast</span>
          <h2 id="trip-map-title">Pins worth discussing.</h2>
        </div>
        <div className="trip-map-filters" aria-label="Map filters">
          {Object.entries(categoryConfig).map(([category, config]) => (
            <button
              key={category}
              type="button"
              className={visibleCategories.has(category) ? "is-active" : ""}
              aria-pressed={visibleCategories.has(category)}
              onClick={() => toggleCategory(category)}
            >
              <span style={{ "--pin-colour": config.colour }} aria-hidden="true" />
              {config.label}
            </button>
          ))}
        </div>
      </div>
      <div className="trip-map-canvas" ref={mapElementRef} />
      <p className="trip-map-note">
        Walk pins are gentle starting ideas, not full route guidance. Check weather,
        tide and coast-path conditions before heading out.
      </p>
    </section>
  );
}

export default TripMap;
