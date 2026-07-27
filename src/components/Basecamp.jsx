import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { getUser, logout as logoutIdentity } from "@netlify/identity";
import { getBasecampProfile } from "../utils/basecampIdentity";
import TripMap from "./TripMap";
import {
  createVoteSubmissionGuard,
  getCampsiteRank,
  getCampsiteRankingStats,
  getVoteFailureMessage,
  normalizeCampsiteRankings,
  setMemberCampsiteRank,
} from "./basecampVoting";
import "./Basecamp.css";

const TRIP_DATE = new Date("2026-08-21T08:00:00+01:00");
const STORAGE_KEY = "durdle-basecamp-mvp-v1";
const LOCAL_CHAT_KEY = "durdle-basecamp-chat-preview-v1";
const MAP_LIST_URL = "https://maps.app.goo.gl/ZXMz1S5F36en7BND8";
const NAV_ITEMS = [
  { id: "overview", label: "Basecamp" },
  { id: "campsites", label: "Campsites" },
  { id: "map", label: "Map" },
  { id: "conditions", label: "Conditions" },
  { id: "fishing", label: "Fishing" },
  { id: "plan", label: "Itinerary" },
  { id: "kit", label: "Kit" },
  { id: "spend", label: "Spend" },
  { id: "photos", label: "Photos" },
  { id: "chat", label: "Chat" },
];
const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  ["overview", "campsites", "plan"].includes(item.id),
);
const SECONDARY_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  !PRIMARY_NAV_ITEMS.some((primaryItem) => primaryItem.id === item.id),
);
const RANK_SLOTS = [
  { rank: 1, label: "1st", points: 3 },
  { rank: 2, label: "2nd", points: 2 },
  { rank: 3, label: "3rd", points: 1 },
];

const crew = [
  { id: "priitivi", name: "Priitivi", home: "Ealing", role: "Crew" },
  { id: "husain", name: "Husain", home: "Edgware", role: "Crew" },
  { id: "dhanesh", name: "Dhanesh", home: "Rayners Lane", role: "Crew" },
  { id: "oliver", name: "Oliver", home: "Ealing", role: "Crew" },
];

const initialCampsites = [
  {
    id: "eweleaze",
    name: "Eweleaze Farm",
    area: "Osmington · Weymouth",
    status: "Research",
    origin: "Dhanesh’s list",
    rating: "4.5 ★",
    coordinates: [50.6384621, -2.4031664],
    image: "/campsites/eweleaze.webp",
    imageAlt: "Tents spread across the coastal fields at Eweleaze Farm",
    sourceUrl: "https://eweleaze.co.uk/eweleaze-farm/camping/",
    sourceLabel: "Eweleaze Farm",
    tripPrice: "£210 total · £52.50 pp",
    priceNote: "4 adults · Fri + Sat · 1 vehicle",
    facts: ["Tent-only", "Private beach", "Campfires + hot showers"],
    watchOut: "Open 20 July–31 August. Weekend adult rate is £24 per night; vehicle is £18 per stay.",
    votes: [],
    notes: [],
  },
  {
    id: "portesham",
    name: "Portesham Dairy Farm Campsite",
    area: "Portesham · Weymouth",
    status: "Research",
    origin: "Dhanesh’s list",
    rating: "4.7 ★",
    coordinates: [50.667977, -2.563157],
    image: "/campsites/portesham.webp",
    imageAlt: "Green pitches at Portesham Dairy Farm Campsite",
    sourceUrl: "https://www.porteshamdairyfarm.co.uk/",
    sourceLabel: "Portesham Dairy Farm",
    tripPrice: "Live quote",
    priceNote: "Exact August price is shown in the booking flow",
    facts: ["Open all year", "Level sheltered pitches", "Pub 200 yd away"],
    watchOut: "A comfortable practical option, but farther west than the Osmington and Lulworth sites.",
    votes: [],
    notes: [],
  },
  {
    id: "east-field",
    name: "East Field",
    area: "Eweleaze Farm · Osmington",
    status: "Research",
    origin: "Dhanesh’s list",
    rating: "5.0 ★",
    coordinates: [50.6375746, -2.4014606],
    image: "/campsites/east-field.webp",
    imageAlt: "Sea view from the East Field bell tent area at Eweleaze Farm",
    sourceUrl: "https://eweleaze.co.uk/eweleaze-farm/glamping/east-field/",
    sourceLabel: "Eweleaze Farm",
    tripPrice: "≈ £490 total · £122.50 pp",
    priceNote: "Eweleaze fees + one 4-person bell tent",
    facts: ["Bell-tent glamping", "Beds included", "Inside Eweleaze"],
    watchOut: "East Field is a glamping field within Eweleaze, not a separate campsite. The estimate includes its published base and weekend tent fees.",
    votes: [],
    notes: [],
  },
  {
    id: "sweet-hill",
    name: "Sweet Hill Farm",
    area: "Southwell · Portland",
    status: "Research",
    origin: "Dhanesh’s list",
    rating: "4.5 ★",
    coordinates: [50.5275055, -2.4488156],
    image: "/campsites/sweet-hill.webp",
    imageAlt: "Open coastal view from Sweet Hill Farm on Portland",
    sourceUrl: "https://sweethillfarm.co.uk/",
    sourceLabel: "Sweet Hill Farm",
    tripPrice: "£120 total · £30 pp",
    priceNote: "4 adults · 2 nights · non-electric",
    facts: ["Nearly-wild camping", "Portland coast", "Electric optional"],
    watchOut: "The published high-season adult rate is £15 per night; electric hook-up is extra.",
    votes: [],
    notes: [],
  },
  {
    id: "rosewall",
    name: "Rosewall Camping",
    area: "Osmington Mills · Weymouth",
    status: "Research",
    origin: "Dhanesh’s list",
    rating: "4.6 ★",
    coordinates: [50.641112, -2.378175],
    image: "/campsites/rosewall.webp",
    imageAlt: "Aerial view over the pitches at Rosewall Camping",
    sourceUrl: "https://www.weymouthcamping.com/camping/",
    sourceLabel: "Rosewall Camping",
    photoSourceUrl: "https://www.campsites.co.uk/search/campsites-in-dorset/weymouth/rosewall-camping",
    photoSourceLabel: "Campsites.co.uk",
    tripPrice: "£90 total · £22.50 pp",
    priceNote: "4 adults · 2 nights · published high season",
    facts: ["Two wash blocks", "No electric hook-up", "Seasonal shop"],
    watchOut: "The 2026 tariff warns that a three-night minimum may apply in peak periods—confirm before choosing.",
    votes: [],
    notes: [],
  },
  {
    id: "ringstead",
    name: "Ringstead Bay Camping",
    area: "Ringstead · Dorchester",
    status: "Research",
    origin: "Dhanesh’s list",
    rating: "5.0 ★",
    coordinates: [50.6341842, -2.3617009],
    image: "/campsites/ringstead.webp",
    imageAlt: "Coastal camping field at Ringstead Bay Camping",
    sourceUrl: "https://ringsteadbaycamping.co.uk/",
    sourceLabel: "Ringstead Bay Camping",
    tripPrice: "≈ £102 total · £25.50 pp",
    priceNote: "Standard pitch + 2 extra adults · 2 nights",
    facts: ["5-min beach walk", "Fridge + charging", "Raised campfires"],
    watchOut: "Estimate uses the published standard rate. Check the live calendar in case the August weekend is priced differently.",
    votes: [],
    notes: [],
  },
  {
    id: "sea-barn",
    name: "Sea Barn Farm Fleet",
    area: "Fleet · Weymouth",
    status: "Research",
    origin: "Dhanesh’s list",
    rating: "3.9 ★",
    coordinates: [50.623753, -2.529066],
    image: "/campsites/sea-barn.webp",
    imageAlt: "Aerial view of Sea Barn Farm beside the Fleet lagoon",
    sourceUrl: "https://www.seabarnfarm.co.uk/",
    sourceLabel: "Sea Barn Farm",
    tripPrice: "Live quote",
    priceNote: "Advance booking only",
    facts: ["Fleet Lagoon views", "Coast path 500 m", "Modern wash block"],
    watchOut: "The site says “no groups” and a maximum of two households. Four friends should ask for approval before booking.",
    votes: [],
    notes: [],
  },
  {
    id: "durdle-door-holiday-park",
    name: "Durdle Door Holiday Park",
    area: "West Lulworth · Wareham",
    status: "Extra lead",
    origin: "Nearby research",
    coordinates: [50.62615, -2.27036],
    image: "/campsites/durdle-door.jpg",
    imageAlt: "Durdle Door Holiday Park above the Jurassic Coast",
    sourceUrl: "https://www.durdledoor.co.uk/touring-and-camping",
    sourceLabel: "Durdle Door Holiday Park",
    tripPrice: "From £22 per pitch/night",
    priceNote: "Rookery tent pitch · live quote for 4 adults",
    facts: ["Walk to Durdle Door", "Tent up to 18 m²", "Shop + bar on site"],
    watchOut: "The headline price covers two people for one night; enter all four adults and both dates for the real total.",
    votes: [],
    notes: [],
  },
  {
    id: "red-lion-winfrith",
    name: "The Red Lion Campsite",
    area: "Winfrith Newburgh · Dorchester",
    status: "Extra lead",
    origin: "Nearby research",
    coordinates: [50.668327, -2.275631],
    image: "/campsites/red-lion.jpg",
    imageAlt: "The grassy camping field at The Red Lion in Winfrith Newburgh",
    sourceUrl: "https://redlionwinfrith.com/campsite/",
    sourceLabel: "The Red Lion",
    photoSourceUrl: "https://www.ukcampsite.co.uk/sites/details.asp?revid=12800",
    photoSourceLabel: "UKCampsite.co.uk",
    tripPrice: "Live quote",
    priceNote: "Pre-book for the current tent rate",
    facts: ["Pub beside pitches", "Showers + loos", "10% camper discount"],
    watchOut: "Very convenient for dinner and a short drive to Lulworth; recent reviews are mixed on peak-time wash facilities.",
    votes: [],
    notes: [],
  },
  {
    id: "longthorns-farm",
    name: "Longthorns Farm",
    area: "Wareham · Dorset",
    status: "Extra lead",
    origin: "Nearby research",
    coordinates: [50.698462, -2.215858],
    image: "/campsites/longthorns.jpg",
    imageAlt: "Camping field at Longthorns Farm in Dorset",
    sourceUrl: "https://www.longthornsfarm.co.uk/camping",
    sourceLabel: "Longthorns Farm",
    tripPrice: "From £28 per pitch/night",
    priceNote: "Live quote may add people or pitch options",
    facts: ["Campfires", "Woodland + alpacas", "Tents and campervans"],
    watchOut: "A relaxed inland base beside Monkey World; the balance is due 21 days before arrival.",
    votes: [],
    notes: [],
  },
  {
    id: "shortlake-farm",
    name: "Shortlake Farm",
    area: "Osmington · Weymouth",
    status: "Strong new lead",
    origin: "Nearby research",
    coordinates: [50.6394, -2.391],
    image: "/campsites/shortlake.jpg",
    imageAlt: "Coastal tents and hay bales at Shortlake Farm",
    sourceUrl: "https://eweleaze.co.uk/shortlake-farm/camping/",
    sourceLabel: "Shortlake Farm",
    tripPrice: "£159 total · £39.75 pp",
    priceNote: "4 adults · Fri + Sat · 1 vehicle",
    facts: ["10-min beach walk", "Campfires + hot showers", "Shop, pizza + nearby pub"],
    watchOut: "Open 3–31 August 2026. It is quieter than Eweleaze but shares access to many of the same coastal facilities.",
    votes: [],
    notes: [],
  },
];

const fishingCompanies = [
  {
    id: "coastal-catcher",
    name: "Coastal Catcher · Lone Shark III",
    badge: "Best group fit",
    image: "/fishing/coastal-catcher.jpg",
    imageAlt: "Beginner anglers fishing from Coastal Catcher off the Dorset coast",
    photoUrl: "https://fishingtripsweymouth.com/trip/4-hour-introduction-to-fishing-rod-line-coastal-catcher/",
    price: "£45 pp",
    privatePrice: "£450 whole boat · up to 10",
    duration: "4 hours",
    minimum: "6 passengers",
    groupGap: "Your four need 2 more shared passengers",
    departure: "Weymouth Harbour · live calendar",
    included: "Rod, line, bait and life vest",
    note: "A dedicated introduction to sea fishing, running 15 April–1 October 2026. The private boat works out at £112.50 each for four.",
    url: "https://fishingtripsweymouth.com/trip/4-hour-introduction-to-fishing-rod-line-coastal-catcher/",
  },
  {
    id: "amarisa",
    name: "Amarisa",
    badge: "Lowest published price",
    image: "/fishing/amarisa.png",
    imageAlt: "The blue-hulled Amarisa fishing boat in Weymouth",
    photoUrl: "https://www.amarisaweymouth.co.uk/",
    price: "£40 pp",
    privatePrice: "Ask for whole-boat quote",
    duration: "4 hours",
    minimum: "8 passengers",
    groupGap: "Your four need 4 more shared passengers",
    departure: "Morning, afternoon or evening · time varies",
    included: "Rods, reels, tackle and bait",
    note: "Daily during school holidays. Meet near Sailors Return at Cosens Quay and arrive 15 minutes early.",
    url: "https://www.amarisaweymouth.co.uk/4hour/",
  },
  {
    id: "snapper",
    name: "Snapper Charters",
    badge: "Beginner friendly",
    image: "/fishing/snapper.jpg",
    imageAlt: "A beginner fishing from Snapper Charters off Weymouth",
    photoUrl: "https://www.snapperweymouth.com/fishing-trips/half-day-fishing-trips/",
    price: "£45 pp",
    privatePrice: "Ask for whole-boat quote",
    duration: "4 hours",
    minimum: "8 passengers",
    groupGap: "Your four need 4 more shared passengers",
    departure: "Often 08:00 or 12:00 · verify live",
    included: "Rods, reels, tackle and bait",
    note: "Complete beginners are welcome. The published booking calendar commonly shows morning and midday half-days, but your August times are not posted yet.",
    url: "https://www.snapperweymouth.com/fishing-trips/half-day-fishing-trips/",
    bookingUrl: "https://bookwhen.com/snappercharters",
  },
  {
    id: "shellfish",
    name: "Weymouth Shellfish Charters",
    badge: "Weather-plan wildcard",
    image: "/fishing/shellfish.jpg",
    imageAlt: "The Weymouth Shellfish Charters crew and catamaran",
    photoUrl: "https://www.weymouthshellfishcharters.co.uk/our-story",
    price: "£25 pp",
    privatePrice: "Durdle sightseeing · £27.50 pp",
    duration: "90 minutes",
    minimum: "No minimum published",
    groupGap: "Works as a fallback for four",
    departure: "Weymouth Harbour · booking calendar",
    included: "Hands-on crab and lobster pot safari",
    note: "This is shellfish potting rather than rod-and-line fishing, so treat it as a shorter backup experience.",
    url: "https://www.weymouthshellfishcharters.co.uk/",
  },
];

const initialTrip = {
  activeMember: "priitivi",
  albumUrl: "",
  campsites: initialCampsites,
  campsiteRankings: {},
  campsiteVoters: {},
  campsiteDecision: {
    deadline: "2026-08-02",
  },
  itinerary: [
    {
      id: "fri-meet",
      day: "Friday",
      time: "07:00–08:00",
      title: "Meet in Edgware",
      detail: "Load Husain’s car and run the departure checklist.",
      status: "Confirmed",
    },
    {
      id: "fri-camp",
      day: "Friday",
      time: "After arrival",
      title: "Pitch basecamp",
      detail: "Check in, set up tents and keep the first evening flexible.",
      status: "Idea",
    },
    {
      id: "sat-fish",
      day: "Saturday",
      time: "Time TBC",
      title: "Beginner fishing charter",
      detail: "Aim for a four-to-five-hour shared or private boat trip.",
      status: "Idea",
    },
    {
      id: "sat-coast",
      day: "Saturday",
      time: "After fishing",
      title: "Coast and camp dinner",
      detail: "Durdle Door, Man O’War Beach or Lulworth Cove depending on energy.",
      status: "Idea",
    },
    {
      id: "sun-home",
      day: "Sunday",
      time: "Morning",
      title: "Pack down and final stop",
      detail: "Leave room for one viewpoint before the drive home.",
      status: "Idea",
    },
  ],
  packing: [
    {
      id: "tent",
      label: "Tent and pegs",
      category: "Camp",
      owner: "Group",
      completionMode: "individual",
      acknowledgements: [],
      done: false,
    },
    {
      id: "sleep",
      label: "Sleeping bags and mats",
      category: "Camp",
      owner: "Group",
      completionMode: "individual",
      acknowledgements: [],
      done: false,
    },
    {
      id: "torch",
      label: "Torches and spare batteries",
      category: "Camp",
      owner: "Group",
      completionMode: "individual",
      acknowledgements: [],
      done: false,
    },
    {
      id: "charter",
      label: "Fishing charter confirmation",
      category: "Bookings",
      owner: "Dhanesh",
      completionMode: "shared",
      acknowledgements: [],
      done: false,
    },
    {
      id: "campsite",
      label: "Campsite confirmation",
      category: "Bookings",
      owner: "Priitivi",
      completionMode: "shared",
      acknowledgements: [],
      done: false,
    },
    {
      id: "waterproof",
      label: "Waterproof layer",
      category: "Boat",
      owner: "Everyone",
      completionMode: "individual",
      acknowledgements: [],
      done: false,
    },
    {
      id: "sun",
      label: "Sun protection",
      category: "Boat",
      owner: "Everyone",
      completionMode: "individual",
      acknowledgements: [],
      done: false,
    },
    {
      id: "food",
      label: "Breakfast, snacks and water",
      category: "Food",
      owner: "Group",
      completionMode: "shared",
      acknowledgements: [],
      done: false,
    },
  ],
  expenses: [],
};

function getPackingCompletionMode(item) {
  return item?.completionMode === "individual" ? "individual" : "shared";
}

function isPackingItemComplete(item) {
  if (getPackingCompletionMode(item) === "shared") return Boolean(item.done);
  const acknowledgements = Array.isArray(item.acknowledgements)
    ? item.acknowledgements
    : [];
  return crew.every((member) => acknowledgements.includes(member.id));
}

function formatDecisionDeadline(value) {
  if (!value) return "No deadline";
  const date = new Date(`${value}T12:00:00+01:00`);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDecisionDaysLeft(value) {
  if (!value) return null;
  const deadline = new Date(`${value}T23:59:59+01:00`);
  if (Number.isNaN(deadline.getTime())) return null;
  return Math.ceil((deadline.getTime() - Date.now()) / 86400000);
}

function formatConditionsDate(value) {
  if (!value) return "Date TBC";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00+01:00`));
}

function formatConditionsTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(`${value}:00+01:00`));
}

function weatherToken(label) {
  const tokens = {
    Clear: "CLR",
    "Mostly clear": "SUN",
    Cloudy: "CLD",
    Fog: "FOG",
    Drizzle: "DRZ",
    Rain: "RAN",
    Snow: "SNW",
    Thunder: "STM",
    Mixed: "MIX",
  };
  return tokens[label] ?? "OBS";
}

function displayMetric(value, suffix = "", digits = 0) {
  return Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : "—";
}

function mergeTripState(savedTrip) {
  try {
    const savedCampsites = Array.isArray(savedTrip.campsites) ? savedTrip.campsites : [];
    const knownIds = new Set(initialCampsites.map((campsite) => campsite.id));
    const restoredCampsites = initialCampsites.map((campsite) => {
      const savedCampsite = savedCampsites.find((candidate) => candidate.id === campsite.id);
      return savedCampsite
        ? {
            ...savedCampsite,
            ...campsite,
            votes: Array.isArray(savedCampsite.votes) ? savedCampsite.votes : [],
            notes: Array.isArray(savedCampsite.notes) ? savedCampsite.notes : [],
          }
        : campsite;
    });
    const savedPacking = Array.isArray(savedTrip.packing) ? savedTrip.packing : [];
    const knownPackingIds = new Set(initialTrip.packing.map((item) => item.id));
    const normalizePackingItem = (item, defaults = {}) => {
      const completionMode = item?.completionMode === "individual"
        || (!item?.completionMode && defaults.completionMode === "individual")
        ? "individual"
        : "shared";
      const acknowledgements = Array.isArray(item?.acknowledgements)
        ? item.acknowledgements.filter((memberId) =>
            crew.some((member) => member.id === memberId),
          )
        : completionMode === "individual" && item?.done
          ? crew.map((member) => member.id)
          : [];

      return {
        ...defaults,
        ...item,
        completionMode,
        acknowledgements,
        done: Boolean(item?.done),
      };
    };
    const restoredPacking = initialTrip.packing.map((item) => {
      const savedItem = savedPacking.find((candidate) => candidate.id === item.id);
      return savedItem ? normalizePackingItem(savedItem, item) : item;
    });
    const allCampsiteIds = new Set([
      ...restoredCampsites.map((campsite) => campsite.id),
      ...savedCampsites
        .filter((campsite) => !knownIds.has(campsite.id))
        .map((campsite) => campsite.id),
    ]);

    return {
      ...initialTrip,
      ...savedTrip,
      campsites: [
        ...restoredCampsites,
        ...savedCampsites.filter((campsite) => !knownIds.has(campsite.id)),
      ],
      packing: [
        ...restoredPacking,
        ...savedPacking
          .filter((item) => !knownPackingIds.has(item.id))
          .map((item) => normalizePackingItem(item)),
      ],
      campsiteRankings: normalizeCampsiteRankings(
        savedTrip.campsiteRankings,
        allCampsiteIds,
      ),
      campsiteDecision: {
        ...initialTrip.campsiteDecision,
        ...(savedTrip.campsiteDecision ?? {}),
      },
    };
  } catch {
    return initialTrip;
  }
}

function getInitialTrip() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? mergeTripState(JSON.parse(saved)) : initialTrip;
  } catch {
    return initialTrip;
  }
}

function getInitialChat() {
  try {
    const saved = window.localStorage.getItem(LOCAL_CHAT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function getSharedTrip(trip) {
  const sharedTrip = { ...trip };
  delete sharedTrip.activeMember;
  return sharedTrip;
}

function getDaysUntilTrip() {
  const difference = TRIP_DATE.getTime() - Date.now();
  return Math.max(0, Math.ceil(difference / 86400000));
}

function getSafeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

async function preparePhotoUpload(file) {
  const browserReadyTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (browserReadyTypes.has(file.type) && file.size <= 1.6 * 1024 * 1024) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("This photo format cannot be read."));
      element.src = objectUrl;
    });
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = Math.min(1, 1600 / longestSide);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
    if (!blob) throw new Error("This photo could not be prepared.");
    const filename = `${file.name.replace(/\.[^.]+$/, "") || "basecamp-photo"}.jpg`;
    return new File([blob], filename, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function getCrewMemberForUser(user) {
  const profile = getBasecampProfile(user);
  const knownMember = crew.find((member) => member.id === profile.id);
  if (knownMember) return knownMember;

  return {
    id: profile.id,
    name: profile.name,
    home: "Signed-in account",
    role: "Crew",
  };
}

function Basecamp() {
  const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const [trip, setTrip] = useState(getInitialTrip);
  const [identityMember, setIdentityMember] = useState(isLocalPreview ? crew[0] : null);
  const [activeView, setActiveView] = useState(
    window.location.pathname.toLowerCase().endsWith("/docs") ? "docs" : "overview",
  );
  const [candidateForm, setCandidateForm] = useState({ name: "", area: "", note: "" });
  const [itineraryForm, setItineraryForm] = useState({
    day: "Friday",
    time: "",
    title: "",
  });
  const [packingForm, setPackingForm] = useState({
    label: "",
    category: "Camp",
    owner: "Group",
    completionMode: "shared",
  });
  const [editingItineraryId, setEditingItineraryId] = useState("");
  const [itineraryEditForm, setItineraryEditForm] = useState({
    day: "Friday",
    time: "",
    title: "",
    detail: "",
  });
  const [editingPackingId, setEditingPackingId] = useState("");
  const [packingEditForm, setPackingEditForm] = useState({
    label: "",
    category: "Camp",
    owner: "Group",
    completionMode: "shared",
  });
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
  });
  const [noteDrafts, setNoteDrafts] = useState({});
  const [syncStatus, setSyncStatus] = useState(isLocalPreview ? "Local preview" : "Connecting");
  const [chatMessages, setChatMessages] = useState(isLocalPreview ? getInitialChat : []);
  const [chatDraft, setChatDraft] = useState("");
  const [chatStatus, setChatStatus] = useState(isLocalPreview ? "Saved on this device" : "Connecting");
  const [chatSending, setChatSending] = useState(false);
  const [mobilePlanDay, setMobilePlanDay] = useState("Friday");
  const [photos, setPhotos] = useState([]);
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoFileName, setPhotoFileName] = useState("");
  const [photoStatus, setPhotoStatus] = useState(isLocalPreview ? "Preview only" : "Connecting");
  const [photoError, setPhotoError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [conditions, setConditions] = useState(null);
  const [conditionsStatus, setConditionsStatus] = useState(
    isLocalPreview ? "Production data" : "Waiting",
  );
  const [conditionsError, setConditionsError] = useState("");
  const [voteStatus, setVoteStatus] = useState({
    phase: "idle",
    campsiteId: "",
    message: "",
    requiresSignIn: false,
  });
  const [identityConfirmed, setIdentityConfirmed] = useState(isLocalPreview);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [moreMenuLeft, setMoreMenuLeft] = useState(null);
  const tripRef = useRef(trip);
  const remoteReadyRef = useRef(false);
  const applyingRemoteRef = useRef(false);
  const skipNextAutoSaveRef = useRef(false);
  const lastRemoteUpdateRef = useRef("");
  const voteSubmissionRef = useRef(createVoteSubmissionGuard());
  const tabRefs = useRef({});
  const moreButtonRef = useRef(null);
  const moreMenuRef = useRef(null);
  const rankingSelectRefs = useRef([]);
  const chatEndRef = useRef(null);
  const photoFileRef = useRef(null);

  useEffect(() => {
    if (isLocalPreview) {
      setIdentityMember(crew[0]);
      return undefined;
    }

    let cancelled = false;
    getUser()
      .then((user) => {
        if (cancelled) return;
        if (!user || !user.roles?.includes("basecamp")) {
          window.location.assign("/basecamp-login");
          return;
        }
        setIdentityMember(getCrewMemberForUser(user));
      })
      .catch(() => {
        if (!cancelled) window.location.assign("/basecamp-login");
      });

    return () => {
      cancelled = true;
    };
  }, [isLocalPreview]);

  useEffect(() => {
    tripRef.current = trip;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  }, [trip]);

  useEffect(() => {
    if (!isLocalPreview) return undefined;
    window.localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(chatMessages));
    return undefined;
  }, [chatMessages, isLocalPreview]);

  useEffect(() => {
    if (isLocalPreview) return undefined;

    let cancelled = false;

    const loadSharedTrip = async () => {
      try {
        const response = await fetch("/basecamp/api/state", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        if (response.status === 401 || response.status === 403) {
          window.location.assign("/basecamp-login?session=expired");
          return;
        }
        if (!response.ok) throw new Error(`State request failed: ${response.status}`);
        const payload = await response.json();
        if (cancelled) return;
        if (payload.activeProfile?.hasDisplayName === false) {
          window.location.assign("/basecamp-login?profile=1");
          return;
        }
        if (payload.activeProfile?.id && payload.activeProfile?.name) {
          const knownMember = crew.find(
            (member) => member.id === payload.activeProfile.id,
          );
          setIdentityMember(knownMember ?? {
            id: payload.activeProfile.id,
            name: payload.activeProfile.name,
            home: "Signed-in account",
            role: "Crew",
          });
          setIdentityConfirmed(true);
        }

        if (
          payload.state
          && payload.updatedAt !== lastRemoteUpdateRef.current
          && !voteSubmissionRef.current.isPending()
        ) {
          applyingRemoteRef.current = true;
          lastRemoteUpdateRef.current = payload.updatedAt || "";
          setTrip((current) => ({
            ...mergeTripState(payload.state),
            activeMember: current.activeMember,
          }));
        } else if (!payload.state && !remoteReadyRef.current) {
          const initialiseResponse = await fetch("/basecamp/api/state", {
            method: "PUT",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: getSharedTrip(tripRef.current) }),
          });
          if (!initialiseResponse.ok) {
            throw new Error(`State initialise failed: ${initialiseResponse.status}`);
          }
          const initialisePayload = await initialiseResponse.json();
          lastRemoteUpdateRef.current = initialisePayload.updatedAt || "";
        }

        remoteReadyRef.current = true;
        setSyncStatus("Shared");
      } catch {
        if (!cancelled) setSyncStatus("Offline copy");
      }
    };

    loadSharedTrip();
    const intervalId = window.setInterval(loadSharedTrip, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isLocalPreview]);

  useEffect(() => {
    if (isLocalPreview || activeView !== "photos") return undefined;

    let cancelled = false;
    const loadPhotos = async () => {
      try {
        const response = await fetch("/basecamp/api/photos", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Photo request failed: ${response.status}`);
        const payload = await response.json();
        if (cancelled) return;
        setPhotos(Array.isArray(payload.photos) ? payload.photos : []);
        setPhotoStatus("Shared");
      } catch {
        if (!cancelled) setPhotoStatus("Offline");
      }
    };

    loadPhotos();
    const intervalId = window.setInterval(loadPhotos, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeView, isLocalPreview]);

  useEffect(() => {
    if (activeView !== "conditions") return undefined;
    if (isLocalPreview) {
      setConditionsStatus("Production data");
      setConditionsError("Live models load on the protected production route.");
      return undefined;
    }

    let cancelled = false;
    const loadConditions = async () => {
      setConditionsStatus((current) => current === "Live" ? "Refreshing" : "Loading");
      try {
        const response = await fetch("/basecamp/api/conditions", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Conditions request failed: ${response.status}`);
        const payload = await response.json();
        if (cancelled) return;
        setConditions(payload);
        setConditionsStatus(payload.stale ? "Cached" : "Live");
        setConditionsError("");
      } catch {
        if (cancelled) return;
        setConditionsStatus("Unavailable");
        setConditionsError(
          "The live models could not be reached. Use the Met Office and tide links below.",
        );
      }
    };

    loadConditions();
    const intervalId = window.setInterval(loadConditions, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeView, isLocalPreview]);

  useEffect(() => {
    if (isLocalPreview || !remoteReadyRef.current) return undefined;
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return undefined;
    }
    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false;
      return undefined;
    }

    setSyncStatus("Saving");
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch("/basecamp/api/state", {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: getSharedTrip(trip) }),
        });
        if (!response.ok) throw new Error(`State save failed: ${response.status}`);
        const payload = await response.json();
        lastRemoteUpdateRef.current = payload.updatedAt || "";
        setSyncStatus("Shared");
      } catch {
        setSyncStatus("Offline copy");
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [trip, isLocalPreview]);

  useEffect(() => {
    if (isLocalPreview) return undefined;

    let cancelled = false;
    const loadChat = async () => {
      try {
        const response = await fetch("/basecamp/api/chat", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);
        const payload = await response.json();
        if (cancelled) return;
        setChatMessages(Array.isArray(payload.messages) ? payload.messages : []);
        setChatStatus("Live");
      } catch {
        if (!cancelled) setChatStatus("Offline");
      }
    };

    loadChat();
    const intervalId = window.setInterval(loadChat, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isLocalPreview]);

  useEffect(() => {
    const activeTab = tabRefs.current[activeView]
      ?? (SECONDARY_NAV_ITEMS.some((item) => item.id === activeView)
        ? moreButtonRef.current
        : null);
    activeTab?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeView]);

  useEffect(() => {
    if (!moreMenuOpen) return undefined;

    const closeMenu = () => setMoreMenuOpen(false);
    const triggerBounds = moreButtonRef.current?.getBoundingClientRect();
    if (triggerBounds) {
      const menuWidth = Math.min(260, window.innerWidth - 24);
      setMoreMenuLeft(
        window.innerWidth <= 620
          ? 8
          : Math.max(12, Math.min(triggerBounds.right - menuWidth, window.innerWidth - menuWidth - 12)),
      );
    }
    const handlePointerDown = (event) => {
      if (
        moreButtonRef.current?.contains(event.target)
        || moreMenuRef.current?.contains(event.target)
      ) {
        return;
      }
      closeMenu();
    };
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeMenu();
      moreButtonRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu);
    };
  }, [moreMenuOpen]);

  useEffect(() => {
    if (activeView === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeView, chatMessages]);

  useEffect(() => {
    const previousTitle = document.title;
    const socialImage = new URL("/basecamp-og.png", window.location.origin).href;
    const metadata = [
      ['meta[name="description"]', "A private planning workspace for four friends heading to Durdle Door in August 2026."],
      ['meta[property="og:title"]', "Durdle Basecamp 2026"],
      ['meta[property="og:description"]', "Camping, coastline and a first fishing trip—planned together."],
      ['meta[property="og:image"]', socialImage],
      ['meta[name="twitter:title"]', "Durdle Basecamp 2026"],
      ['meta[name="twitter:description"]', "Camping, coastline and a first fishing trip—planned together."],
      ['meta[name="twitter:image"]', socialImage],
    ];
    const previousMetadata = metadata.map(([selector, content]) => {
      const element = document.querySelector(selector);
      const previousContent = element?.getAttribute("content") ?? "";
      element?.setAttribute("content", content);
      return [element, previousContent];
    });

    document.title = "Durdle Basecamp 2026";
    return () => {
      document.title = previousTitle;
      previousMetadata.forEach(([element, previousContent]) => {
        element?.setAttribute("content", previousContent);
      });
    };
  }, []);

  const activeMember = identityMember ?? crew[0];
  const votingMembers = useMemo(() => {
    const profiles = trip.campsiteVoters && typeof trip.campsiteVoters === "object"
      ? trip.campsiteVoters
      : {};
    const knownIds = new Set(crew.map((member) => member.id));
    const extraIds = new Set([
      ...Object.keys(profiles),
      ...Object.keys(trip.campsiteRankings ?? {}),
    ]);
    if (identityMember && !knownIds.has(identityMember.id)) extraIds.add(identityMember.id);

    return [
      ...crew,
      ...[...extraIds]
        .filter((memberId) => !knownIds.has(memberId))
        .map((memberId) => ({
          id: memberId,
          name: profiles[memberId]?.name
            || (identityMember?.id === memberId ? identityMember.name : "Crew member"),
          home: "Signed-in account",
          role: "Crew",
        })),
    ];
  }, [identityMember, trip.campsiteRankings, trip.campsiteVoters]);
  const completedPacking = trip.packing.filter(isPackingItemComplete).length;
  const packingProgress = trip.packing.length
    ? Math.round((completedPacking / trip.packing.length) * 100)
    : 0;
  const totalSpent = trip.expenses.reduce((total, expense) => total + expense.amount, 0);
  const perPersonSpent = totalSpent / crew.length;
  const perPersonRemaining = Math.max(0, 250 - perPersonSpent);
  const albumHref = getSafeExternalUrl(trip.albumUrl);
  const decisionDaysLeft = getDecisionDaysLeft(trip.campsiteDecision?.deadline);
  const rankedCrewCount = votingMembers.filter(
    (member) => (trip.campsiteRankings?.[member.id] ?? []).length > 0,
  ).length;
  const rankedCampsites = useMemo(
    () => [...trip.campsites].sort((a, b) => {
      const left = getCampsiteRankingStats(trip.campsiteRankings, a.id, votingMembers);
      const right = getCampsiteRankingStats(trip.campsiteRankings, b.id, votingMembers);
      return right.score - left.score
        || right.firstChoices - left.firstChoices
        || a.name.localeCompare(b.name);
    }),
    [trip.campsiteRankings, trip.campsites, votingMembers],
  );
  const leadingCampsite = rankedCampsites[0] ?? null;
  const leadingCampsiteStats = leadingCampsite
    ? getCampsiteRankingStats(trip.campsiteRankings, leadingCampsite.id, votingMembers)
    : null;
  const maximumRankingScore = votingMembers.length * 3;
  const activeRanking = Array.isArray(trip.campsiteRankings?.[activeMember.id])
    ? trip.campsiteRankings[activeMember.id]
    : [];
  const activeRankingCount = activeRanking.length;
  const hasCrewVotes = Boolean(leadingCampsiteStats?.score);
  const isVoteSaving = voteStatus.phase === "saving";
  const votingAvailable = isLocalPreview || identityConfirmed;
  const rankingChartTicks = [
    0,
    Math.round(maximumRankingScore * 0.25),
    Math.round(maximumRankingScore * 0.5),
    Math.round(maximumRankingScore * 0.75),
    maximumRankingScore,
  ];

  const updateTrip = (updater) => {
    setTrip((current) => updater(current));
  };

  const setCampsiteRank = async (campsiteId, rank) => {
    if (!isLocalPreview && (!identityMember || !identityConfirmed)) {
      setVoteStatus({
        phase: "unavailable",
        campsiteId,
        message: identityMember
          ? "Confirming your Basecamp profile. Try again in a moment."
          : "Sign in to Basecamp before casting a vote.",
        requiresSignIn: !identityMember,
      });
      return;
    }

    await voteSubmissionRef.current.run(async () => {
      const memberId = activeMember.id;
      const currentTrip = tripRef.current;
      const previousRanking = Array.isArray(currentTrip.campsiteRankings?.[memberId])
        ? currentTrip.campsiteRankings[memberId]
        : [];
      const nextRankings = setMemberCampsiteRank(
        currentTrip.campsiteRankings,
        memberId,
        campsiteId,
        rank,
      );
      const nextTrip = { ...currentTrip, campsiteRankings: nextRankings };

      if (!isLocalPreview) skipNextAutoSaveRef.current = true;
      tripRef.current = nextTrip;
      setTrip(nextTrip);
      setVoteStatus({
        phase: "saving",
        campsiteId,
        message: rank ? "Saving your vote…" : "Removing your vote…",
        requiresSignIn: false,
      });

      if (isLocalPreview) {
        setVoteStatus({
          phase: "saved",
          campsiteId,
          message: rank ? "Vote saved on this device." : "Vote removed on this device.",
          requiresSignIn: false,
        });
        return;
      }

      try {
        const response = await fetch("/basecamp/api/state", {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ campsiteId, rank }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const voteError = new Error("Vote save failed");
          voteError.status = response.status;
          voteError.code = payload.code;
          throw voteError;
        }

        if (payload.state) {
          const serverTrip = mergeTripState(payload.state);
          const savedTrip = {
            ...tripRef.current,
            campsiteRankings: serverTrip.campsiteRankings,
            campsiteVoters: serverTrip.campsiteVoters,
          };
          skipNextAutoSaveRef.current = true;
          tripRef.current = savedTrip;
          setTrip(savedTrip);
        }
        lastRemoteUpdateRef.current = payload.updatedAt || "";
        setSyncStatus("Shared");
        setVoteStatus({
          phase: "saved",
          campsiteId,
          message: rank ? "Vote saved for the crew." : "Vote removed.",
          requiresSignIn: false,
        });
      } catch (error) {
        const rolledBackTrip = {
          ...tripRef.current,
          campsiteRankings: {
            ...(tripRef.current.campsiteRankings ?? {}),
            [memberId]: previousRanking,
          },
        };
        skipNextAutoSaveRef.current = true;
        tripRef.current = rolledBackTrip;
        setTrip(rolledBackTrip);
        setSyncStatus("Offline copy");
        setVoteStatus({
          phase: "error",
          campsiteId,
          message: getVoteFailureMessage(error?.status, error?.code),
          requiresSignIn: error?.status === 401
            || error?.status === 403
            || error?.code === "PROFILE_REQUIRED",
        });
      }
    });
  };

  const addCandidate = (event) => {
    event.preventDefault();
    const name = candidateForm.name.trim();
    if (!name) return;

    const candidateId = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    const firstNote = candidateForm.note.trim()
      ? [{
          id: `${candidateId}-note`,
          authorId: activeMember.id,
          author: activeMember.name,
          text: candidateForm.note.trim(),
        }]
      : [];

    updateTrip((current) => ({
      ...current,
      campsites: [
        ...current.campsites,
        {
          id: candidateId,
          name,
          area: candidateForm.area.trim() || "Location to confirm",
          status: "New lead",
          votes: [],
          notes: firstNote,
        },
      ],
    }));
    setCandidateForm({ name: "", area: "", note: "" });
  };

  const addNote = (campsiteId) => {
    const text = noteDrafts[campsiteId]?.trim();
    if (!text) return;

    updateTrip((current) => ({
      ...current,
      campsites: current.campsites.map((campsite) =>
        campsite.id === campsiteId
          ? {
              ...campsite,
              notes: [
                ...campsite.notes,
                {
                  id: `${campsiteId}-${Date.now()}`,
                  authorId: activeMember.id,
                  author: activeMember.name,
                  text,
                },
              ],
            }
          : campsite,
      ),
    }));
    setNoteDrafts((current) => ({ ...current, [campsiteId]: "" }));
  };

  const removeNote = (campsiteId, note) => {
    const isOwnNote =
      note.authorId === activeMember.id
      || (!note.authorId && note.author === activeMember.name);
    if (!isOwnNote || !window.confirm("Remove your comment from this campsite?")) return;

    updateTrip((current) => ({
      ...current,
      campsites: current.campsites.map((campsite) =>
        campsite.id === campsiteId
          ? {
              ...campsite,
              notes: campsite.notes.filter((candidate) => candidate.id !== note.id),
            }
          : campsite,
      ),
    }));
  };

  const addItineraryItem = (event) => {
    event.preventDefault();
    if (!itineraryForm.title.trim()) return;

    updateTrip((current) => ({
      ...current,
      itinerary: [
        ...current.itinerary,
        {
          id: `plan-${Date.now()}`,
          day: itineraryForm.day,
          time: itineraryForm.time.trim() || "Time TBC",
          title: itineraryForm.title.trim(),
          detail: `Added by ${activeMember.name}.`,
          status: "Idea",
        },
      ],
    }));
    setItineraryForm({ day: "Friday", time: "", title: "" });
  };

  const toggleItineraryStatus = (itemId) => {
    updateTrip((current) => ({
      ...current,
      itinerary: current.itinerary.map((item) =>
        item.id === itemId
          ? { ...item, status: item.status === "Confirmed" ? "Idea" : "Confirmed" }
          : item,
      ),
    }));
  };

  const moveItineraryItem = (itemId, direction) => {
    updateTrip((current) => {
      const selectedItem = current.itinerary.find((item) => item.id === itemId);
      if (!selectedItem) return current;

      const dayItems = current.itinerary.filter((item) => item.day === selectedItem.day);
      const currentDayIndex = dayItems.findIndex((item) => item.id === itemId);
      const targetItem = dayItems[currentDayIndex + direction];
      if (!targetItem) return current;

      const reordered = [...current.itinerary];
      const currentIndex = reordered.findIndex((item) => item.id === itemId);
      const targetIndex = reordered.findIndex((item) => item.id === targetItem.id);
      [reordered[currentIndex], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[currentIndex],
      ];

      return { ...current, itinerary: reordered };
    });
  };

  const startEditingItinerary = (item) => {
    setEditingItineraryId(item.id);
    setItineraryEditForm({
      day: item.day,
      time: item.time,
      title: item.title,
      detail: item.detail,
    });
  };

  const saveItineraryItem = (event, itemId) => {
    event.preventDefault();
    if (!itineraryEditForm.title.trim()) return;

    updateTrip((current) => ({
      ...current,
      itinerary: current.itinerary.map((item) =>
        item.id === itemId
          ? {
              ...item,
              day: itineraryEditForm.day,
              time: itineraryEditForm.time.trim() || "Time TBC",
              title: itineraryEditForm.title.trim(),
              detail: itineraryEditForm.detail.trim() || `Updated by ${activeMember.name}.`,
            }
          : item,
      ),
    }));
    setEditingItineraryId("");
  };

  const removeItineraryItem = (itemId) => {
    if (!window.confirm("Remove this activity from the shared itinerary?")) return;
    updateTrip((current) => ({
      ...current,
      itinerary: current.itinerary.filter((item) => item.id !== itemId),
    }));
    if (editingItineraryId === itemId) setEditingItineraryId("");
  };

  const addPackingItem = (event) => {
    event.preventDefault();
    if (!packingForm.label.trim()) return;

    updateTrip((current) => ({
      ...current,
      packing: [
        ...current.packing,
        {
          id: `kit-${Date.now()}`,
          label: packingForm.label.trim(),
          category: packingForm.category,
          owner: packingForm.owner,
          completionMode: packingForm.completionMode,
          acknowledgements: [],
          done: false,
        },
      ],
    }));
    setPackingForm({
      label: "",
      category: "Camp",
      owner: "Group",
      completionMode: "shared",
    });
  };

  const togglePackingItem = (itemId) => {
    updateTrip((current) => ({
      ...current,
      packing: current.packing.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    }));
  };

  const togglePackingAcknowledgement = (itemId) => {
    updateTrip((current) => ({
      ...current,
      packing: current.packing.map((item) => {
        if (item.id !== itemId || getPackingCompletionMode(item) !== "individual") {
          return item;
        }

        const acknowledgements = Array.isArray(item.acknowledgements)
          ? item.acknowledgements
          : [];
        const hasAcknowledged = acknowledgements.includes(activeMember.id);
        return {
          ...item,
          acknowledgements: hasAcknowledged
            ? acknowledgements.filter((memberId) => memberId !== activeMember.id)
            : [...acknowledgements, activeMember.id],
        };
      }),
    }));
  };

  const startEditingPacking = (item) => {
    setEditingPackingId(item.id);
    setPackingEditForm({
      label: item.label,
      category: item.category,
      owner: item.owner,
      completionMode: getPackingCompletionMode(item),
    });
  };

  const savePackingItem = (event, itemId) => {
    event.preventDefault();
    if (!packingEditForm.label.trim()) return;

    updateTrip((current) => ({
      ...current,
      packing: current.packing.map((item) =>
        item.id === itemId
          ? (() => {
              const previousMode = getPackingCompletionMode(item);
              const nextMode = packingEditForm.completionMode;
              const modeChanged = previousMode !== nextMode;
              const wasComplete = isPackingItemComplete(item);

              return {
                ...item,
                label: packingEditForm.label.trim(),
                category: packingEditForm.category,
                owner: packingEditForm.owner,
                completionMode: nextMode,
                done: modeChanged && nextMode === "shared" ? wasComplete : item.done,
                acknowledgements: modeChanged && nextMode === "individual"
                  ? (wasComplete ? crew.map((member) => member.id) : [])
                  : (item.acknowledgements ?? []),
              };
            })()
          : item,
      ),
    }));
    setEditingPackingId("");
  };

  const removePackingItem = (itemId) => {
    if (!window.confirm("Remove this item from the shared kit list?")) return;
    updateTrip((current) => ({
      ...current,
      packing: current.packing.filter((item) => item.id !== itemId),
    }));
    if (editingPackingId === itemId) setEditingPackingId("");
  };

  const addExpense = (event) => {
    event.preventDefault();
    const amount = Number.parseFloat(expenseForm.amount);
    if (!expenseForm.description.trim() || !Number.isFinite(amount) || amount <= 0) return;

    updateTrip((current) => ({
      ...current,
      expenses: [
        ...current.expenses,
        {
          id: `expense-${Date.now()}`,
          description: expenseForm.description.trim(),
          amount,
          paidBy: activeMember.name,
          settled: false,
        },
      ],
    }));
    setExpenseForm({ description: "", amount: "" });
  };

  const toggleExpenseSettled = (expenseId) => {
    updateTrip((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === expenseId
          ? { ...expense, settled: !expense.settled }
          : expense,
      ),
    }));
  };

  const removeExpense = (expense) => {
    const amount = Number.isFinite(expense.amount)
      ? ` (£${expense.amount.toFixed(2)})`
      : "";
    if (!window.confirm(`Remove "${expense.description}"${amount} from the shared spend list?`)) {
      return;
    }

    updateTrip((current) => ({
      ...current,
      expenses: current.expenses.filter((item) => item.id !== expense.id),
    }));
  };

  const changeView = (nextView) => {
    if (NAV_ITEMS.some((item) => item.id === nextView)) {
      setMoreMenuOpen(false);
      setActiveView(nextView);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const focusMoreMenuItem = (index) => {
    window.requestAnimationFrame(() => {
      const items = moreMenuRef.current?.querySelectorAll('[role="menuitem"]');
      items?.[index]?.focus();
    });
  };

  const openMoreMenu = (focusIndex) => {
    setMoreMenuOpen(true);
    if (Number.isInteger(focusIndex)) focusMoreMenuItem(focusIndex);
  };

  const handleMoreTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMoreMenu(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMoreMenu(SECONDARY_NAV_ITEMS.length - 1);
    }
  };

  const handleMoreMenuKeyDown = (event) => {
    const items = [...(moreMenuRef.current?.querySelectorAll('[role="menuitem"]') ?? [])];
    const currentIndex = items.indexOf(document.activeElement);

    if (event.key === "Tab") {
      setMoreMenuOpen(false);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : event.key === "ArrowDown"
          ? (currentIndex + 1 + items.length) % items.length
          : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex]?.focus();
  };

  const focusRankingBoard = (rank = 1) => {
    const select = rankingSelectRefs.current[rank - 1];
    select?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.requestAnimationFrame(() => select?.focus());
  };

  const moveBetweenViews = (direction) => {
    const currentIndex = NAV_ITEMS.findIndex((item) => item.id === activeView);
    const nextIndex = Math.min(
      NAV_ITEMS.length - 1,
      Math.max(0, currentIndex + direction),
    );
    if (nextIndex !== currentIndex) changeView(NAV_ITEMS[nextIndex].id);
  };

  const uploadPhoto = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const selectedFile = photoFileRef.current?.files?.[0];
    if (!selectedFile || photoUploading) return;

    setPhotoUploading(true);
    setPhotoError("");
    try {
      const readyFile = await preparePhotoUpload(selectedFile);
      if (readyFile.size > 2 * 1024 * 1024) {
        throw new Error("That photo is still over 2 MB after resizing.");
      }

      if (isLocalPreview) {
        setPhotos((current) => [{
          id: `preview-${Date.now()}`,
          caption: photoCaption.trim(),
          uploadedBy: activeMember.name,
          uploadedAt: new Date().toISOString(),
          url: URL.createObjectURL(readyFile),
        }, ...current]);
        setPhotoStatus("Preview only");
      } else {
        const form = new FormData();
        form.append("image", readyFile);
        form.append("caption", photoCaption.trim());
        const response = await fetch("/basecamp/api/photos", {
          method: "POST",
          credentials: "same-origin",
          body: form,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            payload.code === "IMAGE_TOO_LARGE"
              ? "That photo is too large. Try a different image."
              : "The upload could not be saved.",
          );
        }
        setPhotos((current) => [
          payload.photo,
          ...current.filter((photo) => photo.id !== payload.photo.id),
        ]);
        setPhotoStatus("Shared");
      }

      setPhotoCaption("");
      setPhotoFileName("");
      formElement.reset();
    } catch (error) {
      setPhotoError(error.message || "The upload could not be saved.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const removePhoto = async (photo) => {
    if (!window.confirm("Remove this photo from Basecamp?")) return;

    if (isLocalPreview) {
      if (photo.url?.startsWith("blob:")) URL.revokeObjectURL(photo.url);
      setPhotos((current) => current.filter((candidate) => candidate.id !== photo.id));
      return;
    }

    setPhotoError("");
    try {
      const response = await fetch("/basecamp/api/photos", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photo.id }),
      });
      if (!response.ok) throw new Error("The photo could not be removed.");
      setPhotos((current) => current.filter((candidate) => candidate.id !== photo.id));
    } catch (error) {
      setPhotoError(error.message);
    }
  };

  const sendChatMessage = async (event) => {
    event.preventDefault();
    const text = chatDraft.trim();
    if (!text || chatSending) return;

    setChatSending(true);
    if (isLocalPreview) {
      setChatMessages((current) => [
        ...current,
        {
          id: `preview-${Date.now()}`,
          authorId: activeMember.id,
          author: activeMember.name,
          text,
          createdAt: new Date().toISOString(),
        },
      ]);
      setChatDraft("");
      setChatSending(false);
      return;
    }

    try {
      const response = await fetch("/basecamp/api/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error(`Message send failed: ${response.status}`);
      const payload = await response.json();
      setChatMessages((current) => [
        ...current.filter((message) => message.id !== payload.message.id),
        payload.message,
      ]);
      setChatDraft("");
      setChatStatus("Live");
    } catch {
      setChatStatus("Could not send");
    } finally {
      setChatSending(false);
    }
  };

  const signOut = async () => {
    try {
      await logoutIdentity();
    } finally {
      window.location.assign("/basecamp-login");
    }
  };

  const activeViewIndex = NAV_ITEMS.findIndex((item) => item.id === activeView);
  const isSecondaryView = SECONDARY_NAV_ITEMS.some((item) => item.id === activeView);

  return (
    <div className="basecamp-shell">
      <header className="basecamp-header">
        <a className="basecamp-back" href="/" aria-label="Back to Priitivi’s portfolio">
          <span aria-hidden="true">←</span> Portfolio
        </a>

        <div className="basecamp-identity">
          <span className="basecamp-mark" aria-hidden="true">DB</span>
          <div>
            <strong>Durdle Basecamp</strong>
            <span>Invite-only · {syncStatus}</span>
          </div>
        </div>

        <div className="basecamp-user-actions">
          <div className="signed-in-member" aria-label={`Signed in as ${activeMember.name}`}>
            <span className="signed-in-avatar" aria-hidden="true">
              {activeMember.name.charAt(0)}
            </span>
            <span>
              <small>Signed in as</small>
              <strong>{activeMember.name}</strong>
            </span>
          </div>
          <button type="button" className="basecamp-signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      {activeView !== "docs" && (
        <nav className="basecamp-tabs" aria-label="Trip workspace">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              ref={(element) => {
                tabRefs.current[item.id] = element;
              }}
              type="button"
              className={activeView === item.id ? "is-active" : ""}
              aria-current={activeView === item.id ? "page" : undefined}
              onClick={() => changeView(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button
            ref={moreButtonRef}
            type="button"
            className={`basecamp-more-trigger ${
              isSecondaryView || moreMenuOpen ? "is-active" : ""
            }`}
            aria-haspopup="menu"
            aria-expanded={moreMenuOpen}
            aria-controls="basecamp-more-menu"
            aria-label={
              isSecondaryView
                ? `More sections. Current section: ${
                  NAV_ITEMS.find((item) => item.id === activeView)?.label
                }`
                : "More sections"
            }
            onClick={() => setMoreMenuOpen((open) => !open)}
            onKeyDown={handleMoreTriggerKeyDown}
          >
            More
            <span aria-hidden="true">⌄</span>
          </button>
        </nav>
      )}

      {activeView !== "docs" && moreMenuOpen && (
        <div
          ref={moreMenuRef}
          id="basecamp-more-menu"
          className="basecamp-more-menu"
          role="menu"
          aria-label="More Basecamp sections"
          style={moreMenuLeft === null ? undefined : { left: `${moreMenuLeft}px` }}
          onKeyDown={handleMoreMenuKeyDown}
        >
          {SECONDARY_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={activeView === item.id ? "is-active" : ""}
              aria-current={activeView === item.id ? "page" : undefined}
              onClick={() => changeView(item.id)}
            >
              <span>{item.label}</span>
              {activeView === item.id && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}

      <main className="basecamp-main">
        <AnimatePresence mode="wait">
          {activeView === "overview" && (
            <Motion.div
              key="overview"
              className="basecamp-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <section className="trip-hero">
                <div className="trip-hero-copy">
                  <span className="section-kicker">Durdle Door · 21–23 August 2026</span>
                  <h1>Big Bass IRL</h1>
                  <p>Three days. One car. A very optimistic amount of fishing.</p>
                  <div className="hero-actions">
                    <button type="button" onClick={() => changeView("campsites")}>
                      Choose basecamp
                    </button>
                    <a href={MAP_LIST_URL} target="_blank" rel="noreferrer">
                      Open Dhanesh’s map ↗
                    </a>
                  </div>
                </div>

                <div className="trip-hero-stats" aria-label="Trip summary">
                  <div>
                    <span>Departure</span>
                    <strong>21 Aug</strong>
                    <small>Meet 07:00–08:00</small>
                  </div>
                  <div>
                    <span>Countdown</span>
                    <strong>{getDaysUntilTrip()} days</strong>
                    <small>Friday to Sunday</small>
                  </div>
                  <div>
                    <span>Target</span>
                    <strong>£250 pp</strong>
                    <small>All-in working budget</small>
                  </div>
                </div>

                <div className="trip-hero-art" aria-hidden="true">
                  <img src="/basecamp-og.png" alt="" />
                </div>
              </section>

              <section className="crew-strip" aria-label="Trip crew">
                <div className="strip-heading">
                  <span className="section-kicker">Party lobby</span>
                  <strong>4 / 4 ready to plan</strong>
                </div>
                <div className="crew-list">
                  {crew.map((member, index) => (
                    <div className="crew-member" key={member.id}>
                      <span className="crew-avatar">{member.name.charAt(0)}</span>
                      <div>
                        <strong>{member.name}</strong>
                        <small>{member.role} · {member.home}</small>
                      </div>
                      <span className="crew-number">0{index + 1}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="overview-grid">
                <article className="basecamp-card decision-card">
                  <div className="card-heading">
                    <div>
                      <span className="section-kicker">Decision needed</span>
                      <h2>Where do we pitch?</h2>
                    </div>
                    <span className="card-count">{trip.campsites.length} leads</span>
                  </div>
                  <div className="campsite-vote-chart">
                    <div className="vote-chart-axis" aria-hidden="true">
                      {rankingChartTicks.map((score) => (
                        <span key={score}>{score}</span>
                      ))}
                    </div>
                    <div className="vote-chart-bars">
                      {rankedCampsites.slice(0, 4).map((campsite) => {
                        const ranking = getCampsiteRankingStats(
                          trip.campsiteRankings,
                          campsite.id,
                          votingMembers,
                        );
                        return (
                          <button
                            type="button"
                            key={campsite.id}
                            onClick={() => changeView("campsites")}
                            aria-label={`${campsite.name}: ${ranking.score} of ${maximumRankingScore} ranking points. Open campsites.`}
                          >
                          <span className="vote-chart-label">{campsite.name}</span>
                          <span className="vote-chart-track" aria-hidden="true">
                            <span
                              style={{
                                  width: `${(ranking.score / maximumRankingScore) * 100}%`,
                              }}
                            />
                          </span>
                            <strong>{ranking.score}/{maximumRankingScore}</strong>
                          </button>
                        );
                      })}
                    </div>
                    <small className="vote-chart-caption">
                      1st = 3 pts · 2nd = 2 · 3rd = 1 · deadline{" "}
                      {formatDecisionDeadline(trip.campsiteDecision?.deadline)}
                    </small>
                  </div>
                </article>

                <article className="basecamp-card mission-card">
                  <span className="section-kicker">Primary mission</span>
                  <div className="mission-number">04–05</div>
                  <h2>Hours on the water</h2>
                  <p>
                    Compare beginner-friendly Weymouth charters and keep Sunday as
                    the weather fallback.
                  </p>
                  <button type="button" onClick={() => changeView("fishing")}>
                    Compare fishing trips
                  </button>
                </article>

                <article className="basecamp-card progress-card">
                  <div className="card-heading">
                    <div>
                      <span className="section-kicker">Expedition prep</span>
                      <h2>Kit progress</h2>
                    </div>
                    <strong>{packingProgress}%</strong>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-valuenow={packingProgress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <span style={{ width: `${packingProgress}%` }} />
                  </div>
                  <p>{completedPacking} of {trip.packing.length} items ready.</p>
                  <button type="button" onClick={() => changeView("kit")}>
                    Open packing list
                  </button>
                </article>

                <article className="basecamp-card photo-card">
                  <div>
                    <span className="section-kicker">Memories</span>
                    <h2>{photos.length ? `${photos.length} Basecamp photos` : "Shared photo album"}</h2>
                    <p>
                      Upload private trip photos here and keep Google Photos linked
                      as the full group album.
                    </p>
                  </div>
                  <button type="button" onClick={() => changeView("photos")}>
                    Open trip photos
                  </button>
                </article>

                <article className="basecamp-card conditions-overview-card">
                  <div>
                    <span className="section-kicker">Coast intelligence</span>
                    <h2>Weather, waves and tide trend.</h2>
                    <p>
                      Live Durdle Door model data, a clear forecast-window countdown,
                      and the safety links to cross-check before leaving.
                    </p>
                  </div>
                  <div className="conditions-overview-window">
                    <span>Full weekend weather</span>
                    <strong>08 Aug</strong>
                    <small>Tide + wave window · 16 Aug</small>
                  </div>
                  <button type="button" onClick={() => changeView("conditions")}>
                    Open safety board
                  </button>
                </article>
              </section>

              <aside className="prototype-notice">
                <strong>{isLocalPreview ? "Local preview" : "Invite-only access active"}</strong>
                <p>
                  {isLocalPreview
                    ? "Local development bypasses the production sign-in gate. The deployed Basecamp route requires an invited crew account."
                    : "Netlify verifies the signed-in crew role before serving this page. New accounts cannot register without an invitation."}
                </p>
              </aside>
            </Motion.div>
          )}

          {activeView === "campsites" && (
            <Motion.div
              key="campsites"
              className="basecamp-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <section className="view-intro">
                <div>
                  <span className="section-kicker">Field map · Decision board</span>
                  <h1>Choose our basecamp.</h1>
                  <p>
                    All seven campsites from Dhanesh’s list are here, plus four
                    researched nearby leads. Prices below estimate your exact
                    four-person, two-night trip where published tariffs allow it.
                  </p>
                </div>
                <a href={MAP_LIST_URL} target="_blank" rel="noreferrer">
                  Open all 25 places ↗
                </a>
              </section>

              <section className="basecamp-card decision-console">
                <div className="decision-console-copy">
                  <span className="section-kicker">Ranked decision · top three</span>
                  <h2>
                    {leadingCampsiteStats?.score
                      ? `${leadingCampsite.name} leads with ${leadingCampsiteStats.score} points.`
                      : "The ranking board is open."}
                  </h2>
                  <p>
                    Give your first choice 3 points, second choice 2 and third
                    choice 1. You can change your own ranking until booking day.
                  </p>
                  <div className="decision-crew-progress" aria-label="Crew ranking progress">
                    {votingMembers.map((member) => {
                      const choices = trip.campsiteRankings?.[member.id] ?? [];
                      return (
                        <span className={choices.length ? "is-ready" : ""} key={member.id}>
                          <b>{member.name.charAt(0)}</b>
                          {choices.length ? `${choices.length}/3` : "Waiting"}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <label className="deadline-control">
                  <span>Booking deadline</span>
                  <input
                    type="date"
                    min="2026-07-25"
                    max="2026-08-20"
                    value={trip.campsiteDecision?.deadline ?? ""}
                    onChange={(event) =>
                      updateTrip((current) => ({
                        ...current,
                        campsiteDecision: {
                          ...(current.campsiteDecision ?? {}),
                          deadline: event.target.value,
                        },
                      }))
                    }
                  />
                  <strong>{formatDecisionDeadline(trip.campsiteDecision?.deadline)}</strong>
                  <small>
                    {decisionDaysLeft === null
                      ? "Set a date before the trip"
                      : decisionDaysLeft < 0
                        ? "Deadline passed"
                        : decisionDaysLeft === 0
                          ? "Decision due today"
                          : `${decisionDaysLeft} days left · ${rankedCrewCount}/${votingMembers.length} ranked`}
                  </small>
                </label>
              </section>

              <section className="crew-results-board" aria-labelledby="crew-results-title">
                <header>
                  <div>
                    <span className="section-kicker">Live crew result</span>
                    <h2 id="crew-results-title">
                      {hasCrewVotes ? "The current top three." : "Results begin with the first vote."}
                    </h2>
                  </div>
                  <p>
                    Each crew member contributes up to six points. Your ranking is
                    included in these totals as soon as it saves.
                  </p>
                </header>
                <div className="crew-result-grid">
                  {rankedCampsites.slice(0, 3).map((campsite, index) => {
                    const result = getCampsiteRankingStats(
                      trip.campsiteRankings,
                      campsite.id,
                      votingMembers,
                    );
                    return (
                      <article
                        className={index === 0 && hasCrewVotes ? "is-leading" : ""}
                        key={campsite.id}
                      >
                        <div className="crew-result-place">
                          <span>{hasCrewVotes ? String(index + 1).padStart(2, "0") : "–"}</span>
                          <small>{hasCrewVotes ? `${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : "rd"}` : "Waiting"}</small>
                        </div>
                        <div className="crew-result-copy">
                          <strong>{campsite.name}</strong>
                          <span>
                            {result.firstChoices} first-choice
                            {result.firstChoices === 1 ? " vote" : " votes"}
                          </span>
                          <div aria-hidden="true">
                            <i
                              style={{
                                width: `${maximumRankingScore
                                  ? (result.score / maximumRankingScore) * 100
                                  : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <strong className="crew-result-score">
                          {result.score}<small>/{maximumRankingScore}</small>
                        </strong>
                      </article>
                    );
                  })}
                </div>
              </section>

              <div className="campsite-decision-layout">
                <aside
                  className={`ranking-board is-${isVoteSaving ? "saving" : voteStatus.phase}`}
                  aria-labelledby="your-ranking-title"
                  aria-busy={isVoteSaving}
                >
                  <header>
                    <div>
                      <span className="section-kicker">Your ballot</span>
                      <h2 id="your-ranking-title">Your top three</h2>
                    </div>
                    <span className="ranking-progress">{activeRankingCount}/3</span>
                  </header>
                  <p className="ranking-board-intro">
                    Pick in order. Moving a campsite up shifts lower choices down;
                    when all slots are full, a new choice replaces the old third.
                  </p>

                  <div className="ranking-slots">
                    {RANK_SLOTS.map(({ rank, label, points }) => {
                      const selectedId = activeRanking[rank - 1] ?? "";
                      const selectedCampsite = trip.campsites.find(
                        (campsite) => campsite.id === selectedId,
                      );
                      const slotUnlocked = Boolean(selectedCampsite)
                        || rank <= activeRankingCount + 1;
                      return (
                        <div
                          className={`ranking-slot ${
                            selectedCampsite ? "is-filled" : "is-empty"
                          }`}
                          key={rank}
                        >
                          <div className="ranking-slot-label" aria-hidden="true">
                            <strong>{label}</strong>
                            <span>{points} {points === 1 ? "pt" : "pts"}</span>
                          </div>
                          <label>
                            <span className="sr-only">
                              {label} choice, worth {points} {points === 1 ? "point" : "points"}
                            </span>
                            <select
                              ref={(element) => {
                                rankingSelectRefs.current[rank - 1] = element;
                              }}
                              value={selectedId}
                              disabled={!slotUnlocked || isVoteSaving || !votingAvailable}
                              onChange={(event) => {
                                if (event.target.value) {
                                  setCampsiteRank(event.target.value, rank);
                                }
                              }}
                            >
                              <option value="">
                                {slotUnlocked ? "Choose a campsite" : "Complete the previous slot first"}
                              </option>
                              {trip.campsites.map((campsite) => {
                                const existingRank = getCampsiteRank(
                                  trip.campsiteRankings,
                                  activeMember.id,
                                  campsite.id,
                                );
                                return (
                                  <option value={campsite.id} key={campsite.id}>
                                    {campsite.name}
                                    {existingRank && existingRank !== rank
                                      ? ` · currently ${RANK_SLOTS[existingRank - 1].label}`
                                      : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </label>
                          <div className="ranking-slot-actions">
                            <button
                              type="button"
                              aria-label={`Move ${selectedCampsite?.name ?? `${label} choice`} up`}
                              disabled={
                                !selectedCampsite
                                || rank === 1
                                || isVoteSaving
                                || !votingAvailable
                              }
                              onClick={() => setCampsiteRank(selectedId, rank - 1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              aria-label={`Move ${selectedCampsite?.name ?? `${label} choice`} down`}
                              disabled={
                                !selectedCampsite
                                || rank >= activeRankingCount
                                || rank === 3
                                || isVoteSaving
                                || !votingAvailable
                              }
                              onClick={() => setCampsiteRank(selectedId, rank + 1)}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="ranking-remove"
                              aria-label={`Remove ${selectedCampsite?.name ?? `${label} choice`} from your ranking`}
                              disabled={!selectedCampsite || isVoteSaving || !votingAvailable}
                              onClick={() => setCampsiteRank(selectedId, 0)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p
                    className={`ranking-save-status ${
                      !votingAvailable ? "is-unavailable" : `is-${voteStatus.phase}`
                    }`}
                    role={voteStatus.phase === "error" ? "alert" : "status"}
                    aria-live="polite"
                  >
                    {!votingAvailable
                      ? "Confirming your Basecamp access…"
                      : voteStatus.message
                        || (activeRankingCount === 3
                          ? "Ranking complete. You can still reorder or remove a choice."
                          : activeRankingCount
                            ? `${activeRankingCount} of 3 ranked. Choose your next campsite.`
                            : "Start with your 1st choice. It is worth 3 points.")}
                    {voteStatus.requiresSignIn && (
                      <> <a href="/basecamp-login">Sign in again</a></>
                    )}
                  </p>
                </aside>

                <section className="candidate-grid" aria-label="Compare campsite options">
                {rankedCampsites.map((campsite, index) => {
                  const ranking = getCampsiteRankingStats(
                    trip.campsiteRankings,
                    campsite.id,
                    votingMembers,
                  );
                  const currentRank = getCampsiteRank(
                    trip.campsiteRankings,
                    activeMember.id,
                    campsite.id,
                  );
                  const isThisVoteSaving =
                    voteStatus.phase === "saving" && voteStatus.campsiteId === campsite.id;
                  return (
                    <article
                      className={`basecamp-card candidate-card ${
                        currentRank ? "is-ranked" : ""
                      }`}
                      key={campsite.id}
                    >
                      {campsite.image && (
                        <figure className="candidate-photo">
                          <img
                            src={campsite.image}
                            alt={campsite.imageAlt || `${campsite.name} campsite`}
                            loading="lazy"
                          />
                          {(campsite.photoSourceUrl || campsite.sourceUrl) && (
                            <a
                              href={campsite.photoSourceUrl || campsite.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Photo: {campsite.photoSourceLabel || campsite.sourceLabel || "source"} ↗
                            </a>
                          )}
                        </figure>
                      )}
                      {!campsite.image && (
                        <div className="candidate-photo candidate-photo-placeholder">
                          <span>{campsite.name}</span>
                          {campsite.sourceUrl && (
                            <a href={campsite.sourceUrl} target="_blank" rel="noreferrer">
                              Research source ↗
                            </a>
                          )}
                        </div>
                      )}
                      <div className="candidate-topline">
                        <span className="candidate-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <small className="candidate-origin">{campsite.origin || "Crew lead"}</small>
                          <span className="status-pill">{campsite.status}</span>
                        </span>
                      </div>
                      <div>
                        <h2>{campsite.name}</h2>
                        <p>{campsite.area}</p>
                        {campsite.rating && (
                          <span className="candidate-rating">
                            {campsite.rating} <small>Google rating</small>
                          </span>
                        )}
                      </div>
                      {campsite.tripPrice && (
                        <div className="candidate-research">
                          <div className="candidate-price">
                            <span>Trip estimate</span>
                            <strong>{campsite.tripPrice}</strong>
                            <small>{campsite.priceNote}</small>
                          </div>
                          {Array.isArray(campsite.facts) && (
                            <div className="candidate-facts" aria-label="Key campsite facts">
                              {campsite.facts.map((fact) => (
                                <span key={fact}>{fact}</span>
                              ))}
                            </div>
                          )}
                          <details>
                            <summary>Research notes</summary>
                            <p>{campsite.watchOut}</p>
                            <a href={campsite.sourceUrl} target="_blank" rel="noreferrer">
                              Check official details and availability ↗
                            </a>
                          </details>
                        </div>
                      )}
                      <div
                        className={`candidate-vote-summary ${
                          currentRank ? "is-ranked" : ""
                        } ${isThisVoteSaving ? "is-saving" : ""}`}
                        aria-busy={isThisVoteSaving}
                      >
                        <div className="candidate-vote-result">
                          <div className="candidate-score">
                            <strong>{ranking.score}</strong>
                            <span>crew points</span>
                          </div>
                          <div
                            className="vote-stack candidate-voter-stack"
                            aria-label={`${campsite.name} crew rankings`}
                          >
                            {ranking.memberRanks.map(({ member, rank }) => (
                              <span
                                key={member.id}
                                className={rank ? "has-voted" : ""}
                                title={`${member.name}: ${rank ? `choice ${rank}` : "not ranked"}`}
                              >
                                <b>{member.name.charAt(0)}</b>
                                <small>{rank || "–"}</small>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="candidate-vote-action">
                          {currentRank ? (
                            <>
                              <span>
                                Your <strong>{RANK_SLOTS[currentRank - 1].label}</strong> choice
                                {" · "}
                                {RANK_SLOTS[currentRank - 1].points}
                                {RANK_SLOTS[currentRank - 1].points === 1 ? " point" : " points"}
                              </span>
                              <button
                                type="button"
                                onClick={() => focusRankingBoard(currentRank)}
                              >
                                Manage ranking
                              </button>
                            </>
                          ) : activeRankingCount < 3 ? (
                            <>
                              <span>
                                Next: <strong>{RANK_SLOTS[activeRankingCount].label}</strong>
                                {" · "}
                                {RANK_SLOTS[activeRankingCount].points}
                                {RANK_SLOTS[activeRankingCount].points === 1 ? " point" : " points"}
                              </span>
                              <button
                                type="button"
                                disabled={isVoteSaving || !votingAvailable}
                                onClick={() => setCampsiteRank(campsite.id, activeRankingCount + 1)}
                              >
                                Add to my ranking
                              </button>
                            </>
                          ) : (
                            <>
                              <span>Your top three is full</span>
                              <button
                                type="button"
                                onClick={() => focusRankingBoard(1)}
                              >
                                Review top three
                              </button>
                            </>
                          )}
                          {isThisVoteSaving && (
                            <span className="candidate-saving" role="status">
                              Saving…
                            </span>
                          )}
                        </div>
                      </div>

                      {campsite.notes.length > 0 && (
                        <div className="candidate-notes">
                          {campsite.notes.map((note) => {
                            const isOwnNote =
                              note.authorId === activeMember.id
                              || (!note.authorId && note.author === activeMember.name);
                            return (
                              <div key={note.id}>
                                <p>
                                  <strong>{note.author}</strong> {note.text}
                                </p>
                                {isOwnNote && (
                                  <button
                                    type="button"
                                    aria-label={`Remove your comment: ${note.text}`}
                                    onClick={() => removeNote(campsite.id, note)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="note-composer">
                        <input
                          type="text"
                          value={noteDrafts[campsite.id] ?? ""}
                          placeholder="Add a useful note"
                          aria-label={`Add a note about ${campsite.name}`}
                          onChange={(event) =>
                            setNoteDrafts((current) => ({
                              ...current,
                              [campsite.id]: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") addNote(campsite.id);
                          }}
                        />
                        <button type="button" onClick={() => addNote(campsite.id)}>
                          Add
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
              </div>

              <form className="basecamp-card add-form" onSubmit={addCandidate}>
                <div>
                  <span className="section-kicker">New lead</span>
                  <h2>Add a campsite</h2>
                  <p>Found another option while you’re discussing the trip?</p>
                </div>
                <label>
                  <span>Name</span>
                  <input
                    type="text"
                    value={candidateForm.name}
                    onChange={(event) =>
                      setCandidateForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Campsite name"
                    required
                  />
                </label>
                <label>
                  <span>Area</span>
                  <input
                    type="text"
                    value={candidateForm.area}
                    onChange={(event) =>
                      setCandidateForm((current) => ({
                        ...current,
                        area: event.target.value,
                      }))
                    }
                    placeholder="Town or coastline"
                  />
                </label>
                <label>
                  <span>First note</span>
                  <input
                    type="text"
                    value={candidateForm.note}
                    onChange={(event) =>
                      setCandidateForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder="Why should we consider it?"
                  />
                </label>
                <button type="submit">Add to shortlist</button>
              </form>
            </Motion.div>
          )}

          {activeView === "map" && (
            <Motion.div
              key="map"
              className="basecamp-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <section className="view-intro map-view-intro">
                <div>
                  <span className="section-kicker">Camps · coast · low-effort wanders</span>
                  <h1>Plot the weekend.</h1>
                  <p>
                    Compare all campsite leads with beaches, walks, food stops and
                    beginner fishing departures saved by the crew.
                  </p>
                </div>
                <a href={MAP_LIST_URL} target="_blank" rel="noreferrer">
                  Open Dhanesh’s list ↗
                </a>
              </section>

              <TripMap campsites={trip.campsites} />

              <section className="map-insight-grid" aria-label="Local research notes">
                <article className="basecamp-card">
                  <span>01 · easiest coastal start</span>
                  <h2>Lulworth Cove</h2>
                  <p>
                    The cove and Visitor Centre are the low-effort option. The
                    coast-path sections beyond them are a steeper commitment.
                  </p>
                  <a
                    href="https://lulworth.com/accessibility-lulworth-cove/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Check access information ↗
                  </a>
                </article>
                <article className="basecamp-card">
                  <span>02 · bring proper shoes</span>
                  <h2>Durdle Door is steep</h2>
                  <p>
                    The beach is reached by a steep descent and steps. Treat Man
                    O’War and the Durdle-to-Lulworth path as real walks, not lay-bys.
                  </p>
                  <a
                    href="https://lulworth.com/visit/places-to-visit/beaches/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read the beach guidance ↗
                  </a>
                </article>
                <article className="basecamp-card">
                  <span>03 · breakfast or lunch</span>
                  <h2>The Boat Shed Café</h2>
                  <p>
                    Right on Lulworth Cove. Its current listing says breakfast,
                    light lunches and daily opening from 08:30 to 17:00.
                  </p>
                  <a
                    href="https://lulworth.com/visit/food-drink/boat-shed-cafe/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Check the current menu ↗
                  </a>
                </article>
                <article className="basecamp-card">
                  <span>04 · evening food</span>
                  <h2>Two Lulworth pubs</h2>
                  <p>
                    Save The Castle Inn in the village and Lulworth Cove Inn by the
                    Heritage Centre as flexible post-walk dinner options.
                  </p>
                  <a
                    href="https://westlulworth.org.uk/places-to-eat-drink/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Compare local food stops ↗
                  </a>
                </article>
                <article className="basecamp-card">
                  <span>05 · beginner mission</span>
                  <h2>Four hours from Weymouth</h2>
                  <p>
                    The researched operators explicitly welcome beginners. A
                    four-hour trip matches the group’s preferred session length.
                  </p>
                  <a
                    href="https://fishingtripsweymouth.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Check fishing trips ↗
                  </a>
                </article>
                <article className="basecamp-card">
                  <span>06 · date-specific note</span>
                  <h2>Lulworth Castle</h2>
                  <p>
                    The current 2026 notice lists the Castle and grounds closed on
                    Friday 21 August, so only consider it on Saturday or Sunday.
                  </p>
                  <a
                    href="https://lulworth.com/visit/places-to-visit/castle-and-park/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Recheck before the trip ↗
                  </a>
                </article>
              </section>
            </Motion.div>
          )}

          {activeView === "conditions" && (
            <Motion.div
              key="conditions"
              className="basecamp-view conditions-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <section className="view-intro conditions-intro">
                <div>
                  <span className="section-kicker">
                    Field conditions · {conditionsStatus}
                  </span>
                  <h1>Read the coast.</h1>
                  <p>
                    One board for the Durdle Door weather, sea state, modelled tide
                    trend and the official checks that matter before a coastal day.
                  </p>
                </div>
                <a
                  href="https://weather.metoffice.gov.uk/forecast/gbyrupkxw"
                  target="_blank"
                  rel="noreferrer"
                >
                  Met Office forecast ↗
                </a>
              </section>

              {conditionsError && (
                <aside className="conditions-error" role="status">
                  <strong>{isLocalPreview ? "Production-only live feed" : "Live feed unavailable"}</strong>
                  <p>{conditionsError}</p>
                </aside>
              )}

              {!conditions && !conditionsError && (
                <section className="basecamp-card conditions-loading" aria-live="polite">
                  <span className="conditions-pulse" aria-hidden="true" />
                  <div>
                    <strong>Pulling the Durdle Door model snapshot…</strong>
                    <p>Weather, sea state and tide trend are refreshed every 30 minutes.</p>
                  </div>
                </section>
              )}

              {conditions && (
                <>
                  <section
                    className={`conditions-signal is-${conditions.signal?.tone ?? "calm"}`}
                    aria-label={`${conditions.signal?.level ?? "Monitor"} coastal planning signal`}
                  >
                    <div className="conditions-signal-copy">
                      <span className="section-kicker">Planning signal · not a go/no-go decision</span>
                      <strong>{conditions.signal?.level ?? "Monitor"}</strong>
                      <p>{conditions.signal?.summary}</p>
                      <small>
                        Model snapshot {formatConditionsTime(conditions.current?.time)}
                        {conditions.stale ? " · cached fallback" : ""}
                      </small>
                    </div>
                    <div className="conditions-current-grid" aria-label="Current model values">
                      <div>
                        <span>Air</span>
                        <strong>{displayMetric(conditions.current?.temperature, "°C", 1)}</strong>
                        <small>{conditions.current?.weather ?? "—"}</small>
                      </div>
                      <div>
                        <span>Wind</span>
                        <strong>{displayMetric(conditions.current?.windSpeed, " mph")}</strong>
                        <small>gust {displayMetric(conditions.current?.windGust, " mph")}</small>
                      </div>
                      <div>
                        <span>Wave</span>
                        <strong>{displayMetric(conditions.current?.waveHeight, " m", 1)}</strong>
                        <small>{displayMetric(conditions.current?.wavePeriod, " sec", 1)} period</small>
                      </div>
                      <div>
                        <span>Sea</span>
                        <strong>{displayMetric(conditions.current?.seaTemperature, "°C", 1)}</strong>
                        <small>
                          current {displayMetric(conditions.current?.currentVelocity, " km/h", 1)}
                        </small>
                      </div>
                    </div>
                  </section>

                  <section className="forecast-window-banner">
                    <div>
                      <span className="section-kicker">Forecast horizon</span>
                      <strong>
                        {conditions.forecast?.mode === "trip"
                          ? "The full weekend weather is now in range."
                          : "The board is showing a near-term planning preview."}
                      </strong>
                    </div>
                    <div className="forecast-window-milestones">
                      <span className={conditions.forecast?.hasFullTripWeather ? "is-ready" : ""}>
                        <b>{conditions.forecast?.hasFullTripWeather ? "Ready" : "08 Aug"}</b>
                        full weekend weather
                      </span>
                      <span className={conditions.forecast?.hasFullTripMarine ? "is-ready" : ""}>
                        <b>{conditions.forecast?.hasFullTripMarine ? "Ready" : "16 Aug"}</b>
                        wave + tide window
                      </span>
                    </div>
                  </section>

                  <section className="conditions-forecast" aria-label={conditions.forecast?.label}>
                    <div className="conditions-section-heading">
                      <div>
                        <span className="section-kicker">Outlook</span>
                        <h2>{conditions.forecast?.label}</h2>
                      </div>
                      <small>Weather model · Europe/London</small>
                    </div>
                    <div className="conditions-forecast-grid">
                      {(conditions.forecast?.days ?? []).map((day) => (
                        <article className="basecamp-card conditions-day" key={day.date}>
                          <header>
                            <div>
                              <span>{formatConditionsDate(day.date)}</span>
                              <strong>{day.label}</strong>
                            </div>
                            <b aria-hidden="true">{weatherToken(day.label)}</b>
                          </header>
                          <div className="conditions-temperature">
                            <strong>{displayMetric(day.temperatureMax, "°")}</strong>
                            <span>{displayMetric(day.temperatureMin, "°")}</span>
                          </div>
                          <dl>
                            <div>
                              <dt>Rain</dt>
                              <dd>{displayMetric(day.precipitationProbability, "%")}</dd>
                            </div>
                            <div>
                              <dt>Gust</dt>
                              <dd>{displayMetric(day.windGustMax, " mph")}</dd>
                            </div>
                            <div>
                              <dt>Wave</dt>
                              <dd>{displayMetric(day.waveHeightMax, " m", 1)}</dd>
                            </div>
                          </dl>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="conditions-detail-grid">
                    <article className="basecamp-card tide-card">
                      <div className="conditions-section-heading">
                        <div>
                          <span className="section-kicker">Modelled tide trend</span>
                          <h2>Next 24 hours</h2>
                        </div>
                        <small>Not chart datum</small>
                      </div>
                      <div className="tide-chart" aria-label="Modelled sea-level trend">
                        {(conditions.tide?.series ?? []).slice(0, 25).map((point) => (
                          <span
                            key={point.time}
                            style={{ height: `${12 + (point.position * 0.8)}%` }}
                            title={`${formatConditionsTime(point.time)} · ${displayMetric(point.level, " m", 2)}`}
                          />
                        ))}
                      </div>
                      <div className="tide-chart-axis" aria-hidden="true">
                        <span>Now</span>
                        <span>+12 hr</span>
                        <span>+24 hr</span>
                      </div>
                      <div className="tide-events">
                        {(conditions.tide?.events ?? []).length ? (
                          conditions.tide.events.slice(0, 4).map((event) => (
                            <span key={`${event.type}-${event.time}`}>
                              <b>{event.type}</b>
                              {formatConditionsTime(event.time)} ·{" "}
                              {displayMetric(event.level, " m", 2)}
                            </span>
                          ))
                        ) : (
                          <span>
                            <b>No turning point in this slice</b>
                            Use the official tide table before committing.
                          </span>
                        )}
                      </div>
                      <p>
                        This sea-level model uses global mean sea level and has limited
                        accuracy close to shore. It is useful for a trend, not coastal
                        navigation or deciding whether a route is safe.
                      </p>
                    </article>

                    <article className="basecamp-card safety-checklist">
                      <div>
                        <span className="section-kicker">Before beach or boat</span>
                        <h2>Cross-check the signal.</h2>
                      </div>
                      <ol>
                        <li>
                          <b>Weather warning</b>
                          <span>Check the Met Office on the morning you leave.</span>
                        </li>
                        <li>
                          <b>Tide cut-off</b>
                          <span>Use a trusted tide table and leave an escape margin.</span>
                        </li>
                        <li>
                          <b>Boat operator</b>
                          <span>Let the skipper make the final sea-state call.</span>
                        </li>
                        <li>
                          <b>Cold water</b>
                          <span>Assume the water is cold enough to shock.</span>
                        </li>
                      </ol>
                      <div className="safety-links">
                        <a href={conditions.sources?.rnliTides} target="_blank" rel="noreferrer">
                          RNLI tide safety ↗
                        </a>
                        <a href={conditions.sources?.metOffice} target="_blank" rel="noreferrer">
                          Met Office ↗
                        </a>
                        <a href={conditions.sources?.admiraltyTides} target="_blank" rel="noreferrer">
                          Admiralty tides ↗
                        </a>
                      </div>
                    </article>
                  </section>

                  <aside className="range-access-note">
                    <span>Trip-specific access note</span>
                    <strong>Lulworth’s 2026 summer range stand-down covers 21–23 August.</strong>
                    <p>
                      Published access runs from 25 July to 31 August, but red flags,
                      barriers and on-site instructions always take priority.
                    </p>
                    <a href={conditions.sources?.lulworthRanges} target="_blank" rel="noreferrer">
                      Check the official access notice ↗
                    </a>
                  </aside>

                  <p className="conditions-attribution">
                    Weather and marine model data: Open-Meteo, including DWD model
                    inputs. Refreshed at most every 30 minutes.{" "}
                    <a href={conditions.sources?.openMeteoWeather} target="_blank" rel="noreferrer">
                      Weather methodology
                    </a>
                    {" · "}
                    <a href={conditions.sources?.openMeteoMarine} target="_blank" rel="noreferrer">
                      Marine methodology
                    </a>
                  </p>
                </>
              )}
            </Motion.div>
          )}

          {activeView === "fishing" && (
            <Motion.div
              key="fishing"
              className="basecamp-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <section className="view-intro fishing-intro">
                <div>
                  <span className="section-kicker">Beginner boat shortlist · Weymouth Harbour</span>
                  <h1>Four hours on the water.</h1>
                  <p>
                    These are the clearest beginner-friendly options close to the
                    campsite search area. Published prices and booking rules were
                    checked for the 2026 season.
                  </p>
                </div>
              </section>

              <aside className="fishing-callout">
                <span className="section-kicker">The important bit</span>
                <strong>Four people do not meet any shared fishing boat minimum yet.</strong>
                <p>
                  Coastal Catcher is the closest fit at six passengers. Either join a
                  sailing that attracts two more people, invite two more, or pay the
                  £450 whole-boat price. Departure times remain tide, weather and
                  live-calendar dependent.
                </p>
              </aside>

              <section className="fishing-grid" aria-label="Fishing company shortlist">
                {fishingCompanies.map((company, index) => (
                  <article className="basecamp-card fishing-card" key={company.id}>
                    <figure>
                      <img src={company.image} alt={company.imageAlt} loading="lazy" />
                      <a href={company.photoUrl} target="_blank" rel="noreferrer">
                        Photo: official operator ↗
                      </a>
                    </figure>
                    <div className="fishing-card-body">
                      <div className="fishing-card-topline">
                        <span>0{index + 1}</span>
                        <small>{company.badge}</small>
                      </div>
                      <div>
                        <h2>{company.name}</h2>
                        <p>{company.note}</p>
                      </div>
                      <dl className="fishing-facts">
                        <div>
                          <dt>Price</dt>
                          <dd>{company.price}</dd>
                        </div>
                        <div>
                          <dt>Duration</dt>
                          <dd>{company.duration}</dd>
                        </div>
                        <div>
                          <dt>Minimum</dt>
                          <dd>{company.minimum}</dd>
                        </div>
                        <div>
                          <dt>Departure</dt>
                          <dd>{company.departure}</dd>
                        </div>
                      </dl>
                      <div className="fishing-group-fit">
                        <strong>{company.groupGap}</strong>
                        <span>{company.privatePrice}</span>
                        <span>{company.included}</span>
                      </div>
                      <div className="fishing-actions">
                        <a href={company.url} target="_blank" rel="noreferrer">
                          Check operator ↗
                        </a>
                        {company.bookingUrl && (
                          <a href={company.bookingUrl} target="_blank" rel="noreferrer">
                            Live departures ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </section>

              <aside className="prototype-notice fishing-disclaimer">
                <strong>Recheck before paying</strong>
                <p>
                  Exact 21–23 August departure times are not published this far ahead.
                  Operators can also cancel for weather or if the passenger minimum is
                  not reached, so keep Sunday available as the fallback boat day.
                </p>
              </aside>
            </Motion.div>
          )}

          {activeView === "plan" && (
            <Motion.div
              key="plan"
              className="basecamp-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <section className="view-intro">
                <div>
                  <span className="section-kicker">Field plan 01</span>
                  <h1>Three days, loosely held.</h1>
                  <p>
                    Confirm only what matters. The boat day can move if the weather
                    says so.
                  </p>
                </div>
              </section>

              <div className="itinerary-day-tabs" aria-label="Choose itinerary day">
                {["Friday", "Saturday", "Sunday"].map((day, index) => (
                  <button
                    type="button"
                    key={day}
                    className={mobilePlanDay === day ? "is-active" : ""}
                    aria-pressed={mobilePlanDay === day}
                    onClick={() => setMobilePlanDay(day)}
                  >
                    <span>{day.slice(0, 3)}</span>
                    <strong>{21 + index}</strong>
                    <small>Aug</small>
                  </button>
                ))}
              </div>

              <section className="itinerary-board">
                {["Friday", "Saturday", "Sunday"].map((day, dayIndex) => (
                  <article
                    className={`day-column ${
                      mobilePlanDay !== day ? "is-mobile-hidden" : ""
                    }`}
                    key={day}
                  >
                    <header>
                      <span>0{dayIndex + 1}</span>
                      <div>
                        <strong>{day}</strong>
                        <small>{["21 August", "22 August", "23 August"][dayIndex]}</small>
                      </div>
                    </header>
                    <div className="day-events">
                      {trip.itinerary
                        .filter((item) => item.day === day)
                        .map((item, itemIndex, dayItems) => (
                          <div className="basecamp-card itinerary-item" key={item.id}>
                            {editingItineraryId === item.id ? (
                              <form
                                className="inline-editor itinerary-editor"
                                onSubmit={(event) => saveItineraryItem(event, item.id)}
                              >
                                <div className="inline-editor-pair">
                                  <label>
                                    <span>Day</span>
                                    <select
                                      value={itineraryEditForm.day}
                                      onChange={(event) =>
                                        setItineraryEditForm((current) => ({
                                          ...current,
                                          day: event.target.value,
                                        }))
                                      }
                                    >
                                      <option>Friday</option>
                                      <option>Saturday</option>
                                      <option>Sunday</option>
                                    </select>
                                  </label>
                                  <label>
                                    <span>Time</span>
                                    <input
                                      value={itineraryEditForm.time}
                                      onChange={(event) =>
                                        setItineraryEditForm((current) => ({
                                          ...current,
                                          time: event.target.value,
                                        }))
                                      }
                                    />
                                  </label>
                                </div>
                                <label>
                                  <span>Activity</span>
                                  <input
                                    value={itineraryEditForm.title}
                                    onChange={(event) =>
                                      setItineraryEditForm((current) => ({
                                        ...current,
                                        title: event.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </label>
                                <label>
                                  <span>Notes</span>
                                  <textarea
                                    rows="3"
                                    value={itineraryEditForm.detail}
                                    onChange={(event) =>
                                      setItineraryEditForm((current) => ({
                                        ...current,
                                        detail: event.target.value,
                                      }))
                                    }
                                  />
                                </label>
                                <div className="item-actions">
                                  <button type="submit" className="primary-action">Save</button>
                                  <button type="button" onClick={() => setEditingItineraryId("")}>
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div className="itinerary-time">{item.time}</div>
                                <div className="itinerary-copy">
                                  <h2>{item.title}</h2>
                                  <p>{item.detail}</p>
                                  <div className="item-actions">
                                    <div className="itinerary-order-actions">
                                      <button
                                        type="button"
                                        disabled={itemIndex === 0}
                                        onClick={() => moveItineraryItem(item.id, -1)}
                                        aria-label={`Move ${item.title} earlier on ${day}`}
                                        title="Move earlier"
                                      >
                                        ↑
                                      </button>
                                      <button
                                        type="button"
                                        disabled={itemIndex === dayItems.length - 1}
                                        onClick={() => moveItineraryItem(item.id, 1)}
                                        aria-label={`Move ${item.title} later on ${day}`}
                                        title="Move later"
                                      >
                                        ↓
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      className={item.status === "Confirmed" ? "is-confirmed" : ""}
                                      onClick={() => toggleItineraryStatus(item.id)}
                                    >
                                      {item.status}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => startEditingItinerary(item)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="danger-action"
                                      onClick={() => removeItineraryItem(item.id)}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                    </div>
                  </article>
                ))}
              </section>

              <form className="basecamp-card add-form itinerary-form" onSubmit={addItineraryItem}>
                <div>
                  <span className="section-kicker">New plan</span>
                  <h2>Add an activity</h2>
                </div>
                <label>
                  <span>Day</span>
                  <select
                    value={itineraryForm.day}
                    onChange={(event) =>
                      setItineraryForm((current) => ({
                        ...current,
                        day: event.target.value,
                      }))
                    }
                  >
                    <option>Friday</option>
                    <option>Saturday</option>
                    <option>Sunday</option>
                  </select>
                </label>
                <label>
                  <span>Time</span>
                  <input
                    type="text"
                    value={itineraryForm.time}
                    onChange={(event) =>
                      setItineraryForm((current) => ({
                        ...current,
                        time: event.target.value,
                      }))
                    }
                    placeholder="Time TBC"
                  />
                </label>
                <label>
                  <span>Activity</span>
                  <input
                    type="text"
                    value={itineraryForm.title}
                    onChange={(event) =>
                      setItineraryForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="What should we do?"
                    required
                  />
                </label>
                <button type="submit">Add activity</button>
              </form>
            </Motion.div>
          )}

          {activeView === "kit" && (
            <Motion.div
              key="kit"
              className="basecamp-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <section className="view-intro">
                <div>
                  <span className="section-kicker">Shared inventory</span>
                  <h1>Pack once. Pack well.</h1>
                  <p>Assign shared items and see what is actually ready.</p>
                </div>
                <div className="large-progress">
                  <strong>{packingProgress}%</strong>
                  <span>{completedPacking} / {trip.packing.length} ready</span>
                </div>
              </section>

              <section className="kit-board">
                {["Bookings", "Camp", "Boat", "Food"].map((category) => (
                  <article className="basecamp-card kit-category" key={category}>
                    <header>
                      <h2>{category}</h2>
                      <span>
                        {trip.packing.filter(
                          (item) => item.category === category && isPackingItemComplete(item),
                        ).length}
                        /{trip.packing.filter((item) => item.category === category).length}
                      </span>
                    </header>
                    <div>
                      {trip.packing
                        .filter((item) => item.category === category)
                        .map((item) => (
                          <div
                            className={`kit-item ${
                              isPackingItemComplete(item) ? "is-done" : ""
                            }`}
                            key={item.id}
                          >
                            {editingPackingId === item.id ? (
                              <form
                                className="inline-editor kit-editor"
                                onSubmit={(event) => savePackingItem(event, item.id)}
                              >
                                <label>
                                  <span>Item</span>
                                  <input
                                    value={packingEditForm.label}
                                    onChange={(event) =>
                                      setPackingEditForm((current) => ({
                                        ...current,
                                        label: event.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </label>
                                <div className="inline-editor-pair">
                                  <label>
                                    <span>Category</span>
                                    <select
                                      value={packingEditForm.category}
                                      onChange={(event) =>
                                        setPackingEditForm((current) => ({
                                          ...current,
                                          category: event.target.value,
                                        }))
                                      }
                                    >
                                      <option>Camp</option>
                                      <option>Boat</option>
                                      <option>Food</option>
                                      <option>Bookings</option>
                                    </select>
                                  </label>
                                  <label>
                                    <span>Owner</span>
                                    <select
                                      value={packingEditForm.owner}
                                      onChange={(event) =>
                                        setPackingEditForm((current) => ({
                                          ...current,
                                          owner: event.target.value,
                                        }))
                                      }
                                    >
                                      <option>Group</option>
                                      <option>Everyone</option>
                                      {![activeMember.name, "Group", "Everyone"].includes(
                                        packingEditForm.owner,
                                      ) && <option>{packingEditForm.owner}</option>}
                                      <option>{activeMember.name}</option>
                                    </select>
                                  </label>
                                </div>
                                <label>
                                  <span>How is it completed?</span>
                                  <select
                                    value={packingEditForm.completionMode}
                                    onChange={(event) =>
                                      setPackingEditForm((current) => ({
                                        ...current,
                                        completionMode: event.target.value,
                                      }))
                                    }
                                  >
                                    <option value="shared">One group tick</option>
                                    <option value="individual">Everyone ticks their own</option>
                                  </select>
                                </label>
                                <div className="item-actions">
                                  <button type="submit" className="primary-action">Save</button>
                                  <button type="button" onClick={() => setEditingPackingId("")}>
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                {getPackingCompletionMode(item) === "shared" ? (
                                  <label className="kit-check">
                                    <input
                                      type="checkbox"
                                      checked={item.done}
                                      onChange={() => togglePackingItem(item.id)}
                                    />
                                    <span>
                                      <strong>{item.label}</strong>
                                      <small>{item.owner} · one group tick</small>
                                    </span>
                                  </label>
                                ) : (
                                  <div className="kit-individual">
                                    <div className="kit-item-heading">
                                      <strong>{item.label}</strong>
                                      <small>
                                        {item.owner} · everyone ticks their own
                                      </small>
                                    </div>
                                    <div
                                      className="kit-personal-checks"
                                      aria-label={`${item.label} personal confirmations`}
                                    >
                                      {crew.map((member) => {
                                        const isActiveMember = member.id === activeMember.id;
                                        const hasAcknowledged = (
                                          item.acknowledgements ?? []
                                        ).includes(member.id);

                                        return (
                                          <label
                                            className={`kit-member-check ${
                                              isActiveMember ? "is-you" : ""
                                            } ${hasAcknowledged ? "is-checked" : ""}`}
                                            key={member.id}
                                            title={
                                              isActiveMember
                                                ? `Tick for ${member.name}`
                                                : `${member.name} must tick this themselves`
                                            }
                                          >
                                            <input
                                              type="checkbox"
                                              checked={hasAcknowledged}
                                              disabled={!isActiveMember}
                                              onChange={() =>
                                                togglePackingAcknowledgement(item.id)
                                              }
                                              aria-label={`${member.name} has packed ${item.label}`}
                                            />
                                            <span>{member.name.slice(0, 1)}</span>
                                            <small>
                                              {isActiveMember ? "You" : member.name}
                                            </small>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                <div className="item-actions kit-item-actions">
                                  <button type="button" onClick={() => startEditingPacking(item)}>
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="danger-action"
                                    onClick={() => removePackingItem(item.id)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                    </div>
                  </article>
                ))}
              </section>

              <form className="basecamp-card add-form kit-add-form" onSubmit={addPackingItem}>
                <div>
                  <span className="section-kicker">New item</span>
                  <h2>Add to the kit list</h2>
                </div>
                <label>
                  <span>Item</span>
                  <input
                    type="text"
                    value={packingForm.label}
                    onChange={(event) =>
                      setPackingForm((current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                    placeholder="What are we missing?"
                    required
                  />
                </label>
                <label>
                  <span>Category</span>
                  <select
                    value={packingForm.category}
                    onChange={(event) =>
                      setPackingForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  >
                    <option>Camp</option>
                    <option>Boat</option>
                    <option>Food</option>
                    <option>Bookings</option>
                  </select>
                </label>
                <label>
                  <span>Owner</span>
                  <select
                    value={packingForm.owner}
                    onChange={(event) =>
                      setPackingForm((current) => ({
                        ...current,
                        owner: event.target.value,
                      }))
                    }
                  >
                    <option>Group</option>
                    <option>Everyone</option>
                    <option>{activeMember.name}</option>
                  </select>
                </label>
                <label>
                  <span>Completion</span>
                  <select
                    value={packingForm.completionMode}
                    onChange={(event) =>
                      setPackingForm((current) => ({
                        ...current,
                        completionMode: event.target.value,
                      }))
                    }
                  >
                    <option value="shared">One group tick</option>
                    <option value="individual">Everyone ticks their own</option>
                  </select>
                </label>
                <button type="submit">Add item</button>
              </form>
            </Motion.div>
          )}

          {activeView === "spend" && (
            <Motion.div
              key="spend"
              className="basecamp-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <section className="view-intro spend-intro">
                <div>
                  <span className="section-kicker">Group spend</span>
                  <h1>Keep the weekend honest.</h1>
                  <p>
                    Record shared costs here; settle the actual balances through
                    Monzo or Revolut.
                  </p>
                </div>
              </section>

              <section className="budget-grid" aria-label="Budget summary">
                <article className="basecamp-card budget-stat">
                  <span>Group target</span>
                  <strong>£1,000.00</strong>
                  <small>£250 per person</small>
                </article>
                <article className="basecamp-card budget-stat">
                  <span>Recorded</span>
                  <strong>£{totalSpent.toFixed(2)}</strong>
                  <small>£{perPersonSpent.toFixed(2)} per person</small>
                </article>
                <article className="basecamp-card budget-stat">
                  <span>Left per person</span>
                  <strong>£{perPersonRemaining.toFixed(2)}</strong>
                  <small>Working estimate</small>
                </article>
              </section>

              <section className="expense-layout">
                <div className="basecamp-card expense-list">
                  <div className="card-heading">
                    <div>
                      <span className="section-kicker">Ledger</span>
                      <h2>Shared expenses</h2>
                    </div>
                  </div>

                  {trip.expenses.length === 0 ? (
                    <div className="empty-state">
                      <strong>No costs recorded yet.</strong>
                      <span>Add the campsite or fishing deposit when somebody books it.</span>
                    </div>
                  ) : (
                    trip.expenses.map((expense) => (
                      <div className="expense-row" key={expense.id}>
                        <div>
                          <strong>{expense.description}</strong>
                          <span>Paid by {expense.paidBy}</span>
                        </div>
                        <strong>£{expense.amount.toFixed(2)}</strong>
                        <div className="expense-actions">
                          <button
                            type="button"
                            className={expense.settled ? "is-settled" : ""}
                            onClick={() => toggleExpenseSettled(expense.id)}
                          >
                            {expense.settled ? "Settled" : "Settle externally"}
                          </button>
                          <button
                            type="button"
                            className="expense-remove"
                            aria-label={`Remove ${expense.description} from the spend list`}
                            onClick={() => removeExpense(expense)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form className="basecamp-card expense-form" onSubmit={addExpense}>
                  <span className="section-kicker">New cost</span>
                  <h2>Add an expense</h2>
                  <label>
                    <span>Description</span>
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={(event) =>
                        setExpenseForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Campsite deposit"
                      required
                    />
                  </label>
                  <label>
                    <span>Amount</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(event) =>
                        setExpenseForm((current) => ({
                          ...current,
                          amount: event.target.value,
                        }))
                      }
                      placeholder="0.00"
                      required
                    />
                  </label>
                  <div className="expense-author">
                    <span>Paid by</span>
                    <strong>{activeMember.name} · you</strong>
                  </div>
                  <button type="submit">Record expense</button>
                </form>
              </section>
            </Motion.div>
          )}

          {activeView === "photos" && (
            <Motion.div
              key="photos"
              className="basecamp-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <section className="view-intro">
                <div>
                  <span className="section-kicker">Private roll · {photoStatus}</span>
                  <h1>Proof it happened.</h1>
                  <p>
                    Basecamp uploads appear here for the invited crew. Google Photos
                    stays linked as the full shared album.
                  </p>
                </div>
              </section>

              <section className="photo-tools">
                <form className="basecamp-card photo-upload-card" onSubmit={uploadPhoto}>
                  <div>
                    <span className="section-kicker">Basecamp upload</span>
                    <h2>Add a photo</h2>
                    <p>
                      Phone photos are resized before upload. The private file is then
                      stored separately from the shared planning data.
                    </p>
                  </div>
                  <label className="photo-file-field" htmlFor="basecamp-photo-file">
                    <span>Photo</span>
                    <span className={`photo-file-picker ${photoFileName ? "has-file" : ""}`}>
                      <strong>{photoFileName || "Choose from phone or computer"}</strong>
                      <small>{photoFileName ? "Tap to choose a different photo" : "Camera, photo library or files"}</small>
                      <input
                        ref={photoFileRef}
                        id="basecamp-photo-file"
                        type="file"
                        name="image"
                        accept="image/*,.heic,.heif"
                        onChange={(event) => {
                          setPhotoFileName(event.target.files?.[0]?.name || "");
                          setPhotoError("");
                        }}
                        required
                      />
                    </span>
                  </label>
                  <label>
                    <span>Caption · optional</span>
                    <input
                      type="text"
                      maxLength="120"
                      value={photoCaption}
                      onChange={(event) => setPhotoCaption(event.target.value)}
                      placeholder="First catch, camp setup…"
                    />
                  </label>
                  <button type="submit" disabled={photoUploading}>
                    {photoUploading ? "Uploading…" : "Upload privately"}
                  </button>
                  {photoError && <p className="photo-error" role="alert">{photoError}</p>}
                </form>

                <article className="basecamp-card google-album-card">
                  <div>
                    <span className="section-kicker">Google Photos</span>
                    <h2>Link the crew album</h2>
                    <p>
                      Paste the shared album URL once. Google does not provide a stable
                      public gallery feed, so the album opens in Google Photos while
                      Basecamp uploads appear directly below.
                    </p>
                  </div>
                  <label>
                    <span>Shared album link</span>
                    <input
                      type="url"
                      placeholder="https://photos.app.goo.gl/…"
                      value={trip.albumUrl}
                      onChange={(event) =>
                        updateTrip((current) => ({
                          ...current,
                          albumUrl: event.target.value,
                        }))
                      }
                    />
                  </label>
                  {albumHref ? (
                    <a href={albumHref} target="_blank" rel="noreferrer">
                      Open shared Google Photos album ↗
                    </a>
                  ) : (
                    <small>No Google Photos album linked yet.</small>
                  )}
                </article>
              </section>

              {photos.length === 0 ? (
                <section className="basecamp-card empty-state photo-empty">
                  <strong>No Basecamp photos yet.</strong>
                  <span>The first private upload will appear here for the crew.</span>
                </section>
              ) : (
                <section className="photo-gallery" aria-label="Crew photo uploads">
                  {photos.map((photo) => (
                    <figure className="basecamp-card trip-photo" key={photo.id}>
                      <img
                        src={photo.url}
                        alt={photo.caption || `Photo uploaded by ${photo.uploadedBy}`}
                        loading="lazy"
                      />
                      <figcaption>
                        <div>
                          {photo.caption && <strong>{photo.caption}</strong>}
                          <span>
                            {photo.uploadedBy}
                            {photo.uploadedAt && (
                              <> · {new Intl.DateTimeFormat("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }).format(new Date(photo.uploadedAt))}</>
                            )}
                          </span>
                        </div>
                        {photo.uploadedBy === activeMember.name && (
                          <button type="button" onClick={() => removePhoto(photo)}>
                            Remove
                          </button>
                        )}
                      </figcaption>
                    </figure>
                  ))}
                </section>
              )}
            </Motion.div>
          )}

          {activeView === "chat" && (
            <Motion.div
              key="chat"
              className="basecamp-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <section className="view-intro">
                <div>
                  <span className="section-kicker">Crew radio · {chatStatus}</span>
                  <h1>Keep the plans moving.</h1>
                  <p>
                    A private thread for the four of you. Messages are kept with
                    the shared trip data, not posted publicly.
                  </p>
                </div>
              </section>

              <section className="basecamp-card chat-room" aria-label="Crew chat">
                <div className="chat-feed" aria-live="polite">
                  {chatMessages.length === 0 ? (
                    <div className="empty-state chat-empty">
                      <strong>No messages yet.</strong>
                      <span>Start with campsite preferences or fishing availability.</span>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <article
                        className={`chat-message ${
                          (message.authorId
                            ? message.authorId === activeMember.id
                            : message.author === activeMember.name)
                            ? "is-self"
                            : ""
                        }`}
                        key={message.id}
                      >
                        <header>
                          <strong>{message.author}</strong>
                          <time dateTime={message.createdAt}>
                            {new Intl.DateTimeFormat("en-GB", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(message.createdAt))}
                          </time>
                        </header>
                        <p>{message.text}</p>
                      </article>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form className="chat-composer" onSubmit={sendChatMessage}>
                  <label>
                    <span>Message the crew</span>
                    <textarea
                      rows="3"
                      maxLength="500"
                      value={chatDraft}
                      onChange={(event) => setChatDraft(event.target.value)}
                      placeholder="What do the boys need to know?"
                      required
                    />
                  </label>
                  <div>
                    <small>{chatDraft.length}/500</small>
                    <button type="submit" disabled={chatSending || !chatDraft.trim()}>
                      {chatSending ? "Sending…" : "Send message"}
                    </button>
                  </div>
                </form>
              </section>
            </Motion.div>
          )}

          {activeView === "docs" && (
            <Motion.div
              key="docs"
              className="basecamp-view docs-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <section className="docs-hero">
                <div>
                  <span className="section-kicker">System README · July 2026</span>
                  <h1>How Basecamp is built.</h1>
                  <p>
                    A plain-English architecture and security guide for the four
                    people using this trip room—what protects it, where the data
                    lives, and where the trust boundaries really are.
                  </p>
                </div>
                <div className="docs-trust-stamp">
                  <span>Access model</span>
                  <strong>Invite-only</strong>
                  <small>Netlify Identity + Basecamp role</small>
                </div>
              </section>

              <section className="docs-summary" aria-label="Basecamp trust summary">
                <span>Short version</span>
                <p>
                  The public portfolio and private Basecamp share one deployment,
                  but Netlify checks the signed-in account before serving Basecamp.
                  Every shared-data API checks the same role again. Passwords never
                  enter the trip database, and uploaded photos are private to
                  authorized accounts—not end-to-end encrypted from the site owner.
                </p>
              </section>

              <section className="docs-flow" aria-label="System architecture">
                <div>
                  <span>01</span>
                  <strong>Your browser</strong>
                  <small>React mobile/desktop UI</small>
                </div>
                <i aria-hidden="true">→</i>
                <div>
                  <span>02</span>
                  <strong>Netlify edge</strong>
                  <small>Identity + role gate</small>
                </div>
                <i aria-hidden="true">→</i>
                <div>
                  <span>03</span>
                  <strong>Functions</strong>
                  <small>Authorization + validation</small>
                </div>
                <i aria-hidden="true">→</i>
                <div>
                  <span>04</span>
                  <strong>Blob stores</strong>
                  <small>Plans, chat and photos</small>
                </div>
              </section>

              <section className="docs-card-grid">
                <article className="basecamp-card docs-card">
                  <span className="section-kicker">Passwords</span>
                  <h2>Priitivi cannot read them.</h2>
                  <p>
                    Netlify Identity handles account creation and login. The
                    application never receives or stores a plaintext password.
                    Identity’s GoTrue service stores a one-way bcrypt hash, so the
                    supported recovery route is a reset—not revealing the original.
                  </p>
                  <small>Stored by Netlify Identity · not in Git or Blobs</small>
                </article>
                <article className="basecamp-card docs-card">
                  <span className="section-kicker">Photos</span>
                  <h2>Private, but not end-to-end encrypted.</h2>
                  <p>
                    Basecamp uploads are resized in the browser, sent over HTTPS and
                    stored in a dedicated Netlify Blob store. Only a signed-in
                    Basecamp role can request them, but the Netlify project owner can
                    administer stored files.
                  </p>
                  <small>Google Photos remains a separate optional external album</small>
                </article>
                <article className="basecamp-card docs-card">
                  <span className="section-kicker">Shared planning</span>
                  <h2>One source of truth.</h2>
                  <p>
                    Campsites, rankings, deadline, itinerary, Kit and spend are one
                    JSON document in Netlify Blobs. Browsers poll for updates and keep
                    a local offline cache. Chat and photos use separate records.
                  </p>
                  <small>Last write wins for most shared fields</small>
                </article>
                <article className="basecamp-card docs-card">
                  <span className="section-kicker">Personal actions</span>
                  <h2>Your tick and your ranking.</h2>
                  <p>
                    The server maps the signed-in email to a crew identity. It
                    preserves everyone else’s individual Kit acknowledgements and
                    campsite ranking even if a modified browser tries to submit
                    changes for another person.
                  </p>
                  <small>Authorization is enforced by the function, not only the UI</small>
                </article>
                <article className="basecamp-card docs-card">
                  <span className="section-kicker">Conditions board</span>
                  <h2>Live data without browser secrets.</h2>
                  <p>
                    An authenticated function requests Open-Meteo weather and marine
                    models, calculates a simple planning signal and caches the result
                    for 30 minutes. The tide chart is a modelled trend—not an
                    Admiralty tide table or permission to enter the water.
                  </p>
                  <small>Full weather window about 8 Aug · marine about 16 Aug</small>
                </article>
                <article className="basecamp-card docs-card docs-limit-card">
                  <span className="section-kicker">Honest limitations</span>
                  <h2>What this does not promise.</h2>
                  <ul>
                    <li>No end-to-end encryption from the Netlify project owner.</li>
                    <li>No instant multi-user conflict merge for every shared field.</li>
                    <li>No nautical-grade tide or sea-state decision.</li>
                    <li>No access for someone until their exact account is invited.</li>
                  </ul>
                </article>
              </section>

              <section className="basecamp-card docs-data-map">
                <div>
                  <span className="section-kicker">Data map</span>
                  <h2>What goes where.</h2>
                </div>
                <dl>
                  <div>
                    <dt>Identity account</dt>
                    <dd>Netlify Identity · email, bcrypt password hash, role</dd>
                  </div>
                  <div>
                    <dt>Trip state</dt>
                    <dd>Netlify Blob · rankings, deadline, plan, Kit, spend, album link</dd>
                  </div>
                  <div>
                    <dt>Chat</dt>
                    <dd>Netlify Blob · stable author ID, display name, message and timestamp</dd>
                  </div>
                  <div>
                    <dt>Photos</dt>
                    <dd>Netlify Blob · resized image, caption and uploader metadata</dd>
                  </div>
                  <div>
                    <dt>Offline copy</dt>
                    <dd>Your browser · latest trip document in localStorage</dd>
                  </div>
                  <div>
                    <dt>Conditions cache</dt>
                    <dd>Netlify Blob · public model response, cached for 30 minutes</dd>
                  </div>
                </dl>
              </section>

              <section className="docs-links">
                <div>
                  <span className="section-kicker">Further reading</span>
                  <h2>Inspect the moving parts.</h2>
                </div>
                <div>
                  <a
                    href="https://docs.netlify.com/manage/security/secure-access-to-sites/identity/overview/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Netlify Identity ↗
                  </a>
                  <a
                    href="https://docs.netlify.com/build/data-and-storage/netlify-blobs/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Netlify Blobs ↗
                  </a>
                  <a
                    href="https://open-meteo.com/en/docs/marine-weather-api"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Marine model notes ↗
                  </a>
                  <a href="/basecamp">Return to the planner →</a>
                </div>
              </section>
            </Motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className={`basecamp-footer ${activeView === "docs" ? "is-docs" : ""}`}>
        <div>
          <strong>Durdle Basecamp · 21–23 August 2026</strong>
          <span>React · Netlify Identity · Functions · Blobs</span>
        </div>
        <a href={activeView === "docs" ? "/basecamp" : "/basecamp/docs"}>
          {activeView === "docs" ? "Back to the planner →" : "Architecture & security guide →"}
        </a>
      </footer>

      {activeView !== "docs" && (
        <>
          <div className="basecamp-page-controls" aria-label="Move between sections">
            <button
              type="button"
              aria-label="Previous section"
              disabled={activeViewIndex === 0}
              onClick={() => moveBetweenViews(-1)}
            >
              <span aria-hidden="true">←</span>
            </button>
            <span aria-hidden="true">{activeViewIndex + 1} / {NAV_ITEMS.length}</span>
            <button
              type="button"
              aria-label="Next section"
              disabled={activeViewIndex === NAV_ITEMS.length - 1}
              onClick={() => moveBetweenViews(1)}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            {NAV_ITEMS[activeViewIndex]?.label} section
          </p>
        </>
      )}
    </div>
  );
}

export default Basecamp;
