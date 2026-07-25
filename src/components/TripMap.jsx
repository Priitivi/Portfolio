import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

const attractionPoints = [
  {
    id: "durdle-door",
    name: "Durdle Door",
    category: "attractions",
    coordinates: [50.6212, -2.2768],
    detail: "The headline stop. Allow for the steep path and steps down to the beach.",
    sourceUrl: "https://lulworth.com/visit/places-to-visit/durdle-door/",
  },
  {
    id: "man-o-war",
    name: "Man O’War Beach",
    category: "attractions",
    coordinates: [50.6215, -2.271],
    detail: "Sheltered cove beside Durdle Door, reached by another steep beach path.",
    sourceUrl: "https://lulworth.com/visit/places-to-visit/beaches/",
  },
  {
    id: "lulworth-cove",
    name: "Lulworth Cove",
    category: "attractions",
    coordinates: [50.6184, -2.2469],
    detail: "Cove, food stops and a useful starting point for a short wander.",
    sourceUrl: "https://lulworth.com/visit/places-to-visit/lulworth-cove/",
  },
  {
    id: "stair-hole",
    name: "Stair Hole",
    category: "attractions",
    coordinates: [50.6206, -2.2504],
    detail: "Compact coastal viewpoint near Lulworth Cove.",
    sourceUrl: "https://lulworth.com/visit/places-to-visit/",
  },
  {
    id: "mupe-bay",
    name: "Mupe Bay",
    category: "attractions",
    coordinates: [50.6191, -2.2225],
    detail: "A remote range-side bay. Access depends on the Lulworth Ranges being open.",
    sourceUrl: "https://www.gov.uk/government/publications/lulworth-firing-notice",
  },
  {
    id: "white-nothe",
    name: "White Nothe",
    category: "attractions",
    coordinates: [50.6259, -2.3262],
    detail: "High chalk headland and a proper coast-path walk, not a quick beach stop.",
    sourceUrl: "https://www.southwestcoastpath.org.uk/walksdb/665/",
  },
  {
    id: "mottrams-beach",
    name: "Mottram’s Beach",
    category: "attractions",
    coordinates: [50.6329, -2.3938],
    detail: "A geological beach below Burning Cliff, best treated as a walking objective.",
    sourceUrl: "https://en.wikipedia.org/wiki/Mottram%27s_Beach",
  },
  {
    id: "bowleaze-cove",
    name: "Bowleaze Cove",
    category: "attractions",
    coordinates: [50.6357, -2.4089],
    detail: "Easy-to-reach Weymouth-side beach stop with facilities nearby.",
  },
  {
    id: "ringstead-bay",
    name: "Ringstead Bay",
    category: "attractions",
    coordinates: [50.6337, -2.3547],
    detail: "National Trust beach and coastal viewpoint near two shortlist campsites.",
    sourceUrl: "https://www.nationaltrust.org.uk/visit/dorset/ringstead-bay",
  },
  {
    id: "chesil-beach",
    name: "Chesil Beach",
    category: "attractions",
    coordinates: [50.6206, -2.536],
    detail: "A dramatic shingle ridge beside the Fleet lagoon.",
    sourceUrl: "https://www.visit-dorset.com/listing/chesil-beach/104422301/",
  },
  {
    id: "portland-bill",
    name: "Portland Bill Lighthouse",
    category: "attractions",
    coordinates: [50.5134, -2.4563],
    detail: "Big sea views at the southern tip of Portland.",
    sourceUrl: "https://www.trinityhouse.co.uk/lighthouse-visitor-centres/portland-bill-lighthouse-visitor-centre",
  },
  {
    id: "butter-rock",
    name: "Butter Rock",
    category: "attractions",
    coordinates: [50.6216, -2.3024],
    detail: "Chalk sea stack west of Durdle Door, seen from the coast path near Bat’s Head.",
    sourceUrl: "https://www.uksouthwest.net/dorset/durdle-door-lulworth-cove/butter-rock.html",
  },
  {
    id: "pondfield-cove",
    name: "Pondfield Cove",
    category: "attractions",
    coordinates: [50.6144, -2.1823],
    detail: "Secluded cove by Worbarrow; only visit when the Lulworth Ranges are open.",
    sourceUrl: "https://www.gov.uk/government/publications/lulworth-firing-notice",
  },
  {
    id: "abbotsbury-swannery",
    name: "Abbotsbury Swannery",
    category: "attractions",
    coordinates: [50.6641, -2.5981],
    detail: "A different final-day option beside the Fleet lagoon.",
    sourceUrl: "https://abbotsbury-tourism.co.uk/swannery/",
  },
  {
    id: "lulworth-castle",
    name: "Lulworth Castle & Park",
    category: "attractions",
    coordinates: [50.6381, -2.2057],
    detail: "Castle, parkland and woodland walks. Check the date-specific closure notice.",
    sourceUrl: "https://lulworth.com/visit/places-to-visit/castle-and-park/",
  },
  {
    id: "fossil-forest",
    name: "Fossil Forest",
    category: "attractions",
    coordinates: [50.6157, -2.232],
    detail: "Geology stop east of Lulworth Cove, subject to range access and coast conditions.",
    sourceUrl: "https://lulworth.com/visit/places-to-visit/",
  },
];

const walkPoints = [
  {
    id: "lulworth-shoreline",
    name: "Lulworth Cove shoreline",
    category: "walks",
    coordinates: [50.6195, -2.249],
    detail: "Gentle five-minute approach from the main car park to the cove.",
    sourceUrl: "https://lulworth.com/accessibility-lulworth-cove/",
  },
  {
    id: "stair-hole-viewpoint",
    name: "Stair Hole viewpoint",
    category: "walks",
    coordinates: [50.621, -2.251],
    detail: "Short accessible section; the longer 3.5 km coast route is moderate.",
    sourceUrl: "https://www.durdledoor.co.uk/see-do/walks",
  },
  {
    id: "portland-flat-path",
    name: "Portland Bill lighthouse path",
    category: "walks",
    coordinates: [50.5143, -2.4553],
    detail: "Wide, flat viewpoint path from the lighthouse car park.",
    sourceUrl: "https://www.visit-dorset.com/visitor-information/accessibility/accessible-viewpoints/",
  },
  {
    id: "durdle-to-lulworth",
    name: "Durdle Door to Lulworth Cove",
    category: "walks",
    coordinates: [50.6228, -2.2621],
    detail: "Iconic coast-path link with steep climbs; save it for good weather and fresh legs.",
    sourceUrl: "https://www.durdledoor.co.uk/see-do/walks",
  },
];

const foodPoints = [
  {
    id: "boat-shed-cafe",
    name: "The Boat Shed Café",
    category: "food",
    coordinates: [50.6182, -2.246],
    detail: "Cove-side breakfast, light lunch, cakes and coffee; currently listed 08:30–17:00.",
    sourceUrl: "https://lulworth.com/visit/food-drink/boat-shed-cafe/",
  },
  {
    id: "lulworth-cove-inn",
    name: "Lulworth Cove Inn",
    category: "food",
    coordinates: [50.6202, -2.2484],
    detail: "Pub food opposite the Heritage Centre, useful after a cove walk.",
    sourceUrl: "https://www.lulworth-coveinn.co.uk/contact-us/",
  },
  {
    id: "castle-inn",
    name: "The Castle Inn",
    category: "food",
    coordinates: [50.62641, -2.24618],
    detail: "Historic village pub on Main Road in West Lulworth.",
    sourceUrl: "https://westlulworth.org.uk/castle-inn/",
  },
  {
    id: "man-o-war-bar",
    name: "Man O’War Bar & Restaurant",
    category: "food",
    coordinates: [50.6262, -2.2678],
    detail: "On-site option at Durdle Door Holiday Park.",
    sourceUrl: "https://www.durdledoor.co.uk/see-do/local-area",
  },
  {
    id: "red-lion-pub",
    name: "The Red Lion",
    category: "food",
    coordinates: [50.668327, -2.275631],
    detail: "Pub beside its campsite; campers are currently offered a food-and-drink discount.",
    sourceUrl: "https://redlionwinfrith.com/campsite/",
  },
  {
    id: "fat-badger",
    name: "The Fat Badger",
    category: "food",
    coordinates: [50.6038, -2.5009],
    detail: "Dhanesh’s saved restaurant lead at Pebble Bank, west of Weymouth.",
  },
];

const fishingPoints = [
  {
    id: "mackerel-fishing-weymouth",
    name: "Mackerel Fishing Trips Weymouth",
    category: "fishing",
    coordinates: [50.6087, -2.4526],
    detail: "Beginner-friendly four-hour rod-and-line and shorter handline options.",
    sourceUrl: "https://fishingtripsweymouth.com/",
  },
  {
    id: "weymouth-shellfish-charters",
    name: "Weymouth Shellfish Charters",
    category: "fishing",
    coordinates: [50.6089, -2.4536],
    detail: "One of the Weymouth Harbour operators saved in Dhanesh’s list.",
  },
  {
    id: "snapper-charters",
    name: "Snapper Charters",
    category: "fishing",
    coordinates: [50.6093, -2.4544],
    detail: "Another saved charter lead departing around Weymouth Harbour.",
  },
  {
    id: "amarisa-weymouth",
    name: "Amarisa four-hour fishing",
    category: "fishing",
    coordinates: [50.6096, -2.453],
    detail: "Researched four-hour harbour trip welcoming beginners and private groups.",
    sourceUrl: "https://www.amarisaweymouth.co.uk/4hour/",
  },
];

const categoryConfig = {
  campsites: { label: "Campsites", colour: "#e66b3c" },
  attractions: { label: "Attractions", colour: "#24483d" },
  walks: { label: "Walks", colour: "#e1aa3a" },
  food: { label: "Food", colour: "#9a4f68" },
  fishing: { label: "Fishing", colour: "#287b8e" },
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

  const links = document.createElement("div");
  links.className = "trip-map-popup-links";

  const link = document.createElement("a");
  const [latitude, longitude] = point.coordinates;
  link.href = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "Open directions ↗";
  links.appendChild(link);

  if (point.sourceUrl) {
    const source = document.createElement("a");
    source.href = point.sourceUrl;
    source.target = "_blank";
    source.rel = "noreferrer";
    source.textContent = "Check source ↗";
    links.appendChild(source);
  }

  wrapper.appendChild(links);

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
        sourceUrl: campsite.sourceUrl,
      }));

    return [
      ...campsitePoints,
      ...attractionPoints,
      ...walkPoints,
      ...foodPoints,
      ...fishingPoints,
    ];
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
