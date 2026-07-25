import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { getUser, logout as logoutIdentity } from "@netlify/identity";
import TripMap from "./TripMap";
import "./Basecamp.css";

const TRIP_DATE = new Date("2026-08-21T08:00:00+01:00");
const STORAGE_KEY = "durdle-basecamp-mvp-v1";
const LOCAL_CHAT_KEY = "durdle-basecamp-chat-preview-v1";
const MAP_LIST_URL = "https://maps.app.goo.gl/ZXMz1S5F36en7BND8";
const NAV_ITEMS = [
  { id: "overview", label: "Basecamp" },
  { id: "campsites", label: "Campsites" },
  { id: "map", label: "Map" },
  { id: "plan", label: "Itinerary" },
  { id: "kit", label: "Kit" },
  { id: "spend", label: "Spend" },
  { id: "chat", label: "Chat" },
];

const crew = [
  { id: "priitivi", name: "Priitivi", home: "Ealing", role: "Crew" },
  { id: "husain", name: "Husain", home: "Edgware", role: "Crew" },
  { id: "dhanesh", name: "Dhanesh", home: "Rayners Lane", role: "Crew" },
  { id: "oliver", name: "Oliver", home: "Ealing", role: "Crew" },
];

const crewByEmail = {
  "priitivi@gmail.com": "priitivi",
  "husainabedi@gmail.com": "husain",
  "dhaneshlian@gmail.com": "dhanesh",
};

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
    sourceUrl: "https://www.campsites.co.uk/search/campsites-in-dorset/weymouth/rosewall-camping",
    sourceLabel: "Campsites.co.uk",
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
    sourceUrl: "https://www.durdledoor.co.uk/accommodation",
    sourceLabel: "Durdle Door Holiday Park",
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
    sourceUrl: "https://redlionwinfrith.com/campsite/",
    sourceLabel: "The Red Lion",
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
    sourceUrl: "https://www.longthornsfarm.co.uk/camping",
    sourceLabel: "Longthorns Farm",
    votes: [],
    notes: [],
  },
];

const initialTrip = {
  activeMember: "priitivi",
  albumUrl: "",
  campsites: initialCampsites,
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
    { id: "tent", label: "Tent and pegs", category: "Camp", owner: "Group", done: false },
    { id: "sleep", label: "Sleeping bags and mats", category: "Camp", owner: "Group", done: false },
    { id: "torch", label: "Torches and spare batteries", category: "Camp", owner: "Group", done: false },
    { id: "charter", label: "Fishing charter confirmation", category: "Bookings", owner: "Dhanesh", done: false },
    { id: "campsite", label: "Campsite confirmation", category: "Bookings", owner: "Priitivi", done: false },
    { id: "waterproof", label: "Waterproof layer", category: "Boat", owner: "Everyone", done: false },
    { id: "sun", label: "Sun protection", category: "Boat", owner: "Everyone", done: false },
    { id: "food", label: "Breakfast, snacks and water", category: "Food", owner: "Group", done: false },
  ],
  expenses: [],
};

function mergeTripState(savedTrip) {
  try {
    const savedCampsites = Array.isArray(savedTrip.campsites) ? savedTrip.campsites : [];
    const knownIds = new Set(initialCampsites.map((campsite) => campsite.id));
    const restoredCampsites = initialCampsites.map((campsite) => {
      const savedCampsite = savedCampsites.find((candidate) => candidate.id === campsite.id);
      return savedCampsite
        ? {
            ...campsite,
            ...savedCampsite,
            area: campsite.area,
            rating: campsite.rating,
            coordinates: campsite.coordinates,
            image: campsite.image,
            imageAlt: campsite.imageAlt,
            sourceUrl: campsite.sourceUrl,
            sourceLabel: campsite.sourceLabel,
            origin: campsite.origin,
          }
        : campsite;
    });

    return {
      ...initialTrip,
      ...savedTrip,
      campsites: [
        ...restoredCampsites,
        ...savedCampsites.filter((campsite) => !knownIds.has(campsite.id)),
      ],
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

function getCrewMemberForUser(user) {
  const email = user?.email?.trim().toLowerCase();
  const knownMember = crew.find((member) => member.id === crewByEmail[email]);
  if (knownMember) return knownMember;

  const fallbackName =
    user?.name?.trim()
    || email?.split("@")[0]?.replace(/[._-]+/g, " ")
    || "Crew member";

  return {
    id: `identity-${user?.id || "crew"}`,
    name: fallbackName.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    home: "Signed-in account",
    role: "Crew",
  };
}

function Basecamp() {
  const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const [trip, setTrip] = useState(getInitialTrip);
  const [identityMember, setIdentityMember] = useState(isLocalPreview ? crew[0] : null);
  const [activeView, setActiveView] = useState("overview");
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
  const tripRef = useRef(trip);
  const remoteReadyRef = useRef(false);
  const applyingRemoteRef = useRef(false);
  const lastRemoteUpdateRef = useRef("");
  const touchStartRef = useRef(null);
  const tabRefs = useRef({});
  const chatEndRef = useRef(null);

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
        if (!response.ok) throw new Error(`State request failed: ${response.status}`);
        const payload = await response.json();
        if (cancelled) return;

        if (payload.state && payload.updatedAt !== lastRemoteUpdateRef.current) {
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
    if (isLocalPreview || !remoteReadyRef.current) return undefined;
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
    tabRefs.current[activeView]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeView]);

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
  const completedPacking = trip.packing.filter((item) => item.done).length;
  const packingProgress = trip.packing.length
    ? Math.round((completedPacking / trip.packing.length) * 100)
    : 0;
  const totalSpent = trip.expenses.reduce((total, expense) => total + expense.amount, 0);
  const perPersonSpent = totalSpent / crew.length;
  const perPersonRemaining = Math.max(0, 250 - perPersonSpent);
  const albumHref = getSafeExternalUrl(trip.albumUrl);
  const rankedCampsites = useMemo(
    () => [...trip.campsites].sort((a, b) => b.votes.length - a.votes.length),
    [trip.campsites],
  );

  const updateTrip = (updater) => {
    setTrip((current) => updater(current));
  };

  const toggleVote = (campsiteId) => {
    updateTrip((current) => ({
      ...current,
      campsites: current.campsites.map((campsite) => {
        if (campsite.id !== campsiteId) return campsite;
        const hasVoted = campsite.votes.includes(activeMember.id);
        return {
          ...campsite,
          votes: hasVoted
            ? campsite.votes.filter((vote) => vote !== activeMember.id)
            : [...campsite.votes, activeMember.id],
        };
      }),
    }));
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
          votes: [activeMember.id],
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
          done: false,
        },
      ],
    }));
    setPackingForm({ label: "", category: "Camp", owner: "Group" });
  };

  const togglePackingItem = (itemId) => {
    updateTrip((current) => ({
      ...current,
      packing: current.packing.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    }));
  };

  const startEditingPacking = (item) => {
    setEditingPackingId(item.id);
    setPackingEditForm({
      label: item.label,
      category: item.category,
      owner: item.owner,
    });
  };

  const savePackingItem = (event, itemId) => {
    event.preventDefault();
    if (!packingEditForm.label.trim()) return;

    updateTrip((current) => ({
      ...current,
      packing: current.packing.map((item) =>
        item.id === itemId
          ? {
              ...item,
              label: packingEditForm.label.trim(),
              category: packingEditForm.category,
              owner: packingEditForm.owner,
            }
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

  const changeView = (nextView) => {
    if (NAV_ITEMS.some((item) => item.id === nextView)) {
      setActiveView(nextView);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const moveBetweenViews = (direction) => {
    const currentIndex = NAV_ITEMS.findIndex((item) => item.id === activeView);
    const nextIndex = Math.min(
      NAV_ITEMS.length - 1,
      Math.max(0, currentIndex + direction),
    );
    if (nextIndex !== currentIndex) changeView(NAV_ITEMS[nextIndex].id);
  };

  const handleTouchStart = (event) => {
    const target = event.target;
    if (
      target instanceof Element
      && target.closest("input, textarea, select, button, a, .leaflet-container")
    ) {
      touchStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
    moveBetweenViews(deltaX < 0 ? 1 : -1);
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

      <nav className="basecamp-tabs" aria-label="Trip workspace">
        {NAV_ITEMS.map((item) => (
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
      </nav>

      <main
        className="basecamp-main"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
                  <h1>Big bass IRL<br />with the boys.</h1>
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
                  <div className="ranked-list">
                    {rankedCampsites.slice(0, 3).map((campsite, index) => (
                      <button
                        type="button"
                        key={campsite.id}
                        onClick={() => changeView("campsites")}
                      >
                        <span>0{index + 1}</span>
                        <strong>{campsite.name}</strong>
                        <small>{campsite.votes.length} votes</small>
                      </button>
                    ))}
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
                  <button type="button" onClick={() => changeView("plan")}>
                    View weekend plan
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
                    <h2>Shared photo album</h2>
                    <p>
                      Keep Google Photos as the group album, then choose highlights
                      for the trip story later.
                    </p>
                  </div>
                  <label>
                    <span>Private album link</span>
                    <input
                      type="url"
                      placeholder="Paste the Google Photos link"
                      value={trip.albumUrl}
                      onChange={(event) =>
                        updateTrip((current) => ({
                          ...current,
                          albumUrl: event.target.value,
                        }))
                      }
                    />
                  </label>
                  {albumHref && (
                    <a href={albumHref} target="_blank" rel="noreferrer">
                      Open shared album ↗
                    </a>
                  )}
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
                    All seven campsites from Dhanesh’s list are here, plus three
                    nearby leads. Your votes and comments post as {activeMember.name}.
                  </p>
                </div>
                <a href={MAP_LIST_URL} target="_blank" rel="noreferrer">
                  Open all 25 places ↗
                </a>
              </section>

              <div className="shortlist-ribbon" aria-label="Campsite shortlist">
                {rankedCampsites.map((campsite, index) => (
                  <span key={campsite.id}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    {campsite.name}
                  </span>
                ))}
              </div>

              <section className="candidate-grid">
                {rankedCampsites.map((campsite, index) => {
                  const hasVoted = campsite.votes.includes(activeMember.id);
                  return (
                    <article className="basecamp-card candidate-card" key={campsite.id}>
                      {campsite.image && (
                        <figure className="candidate-photo">
                          <img
                            src={campsite.image}
                            alt={campsite.imageAlt || `${campsite.name} campsite`}
                            loading="lazy"
                          />
                          {campsite.sourceUrl && (
                            <a href={campsite.sourceUrl} target="_blank" rel="noreferrer">
                              Photo: {campsite.sourceLabel || "source"} ↗
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
                      <div className="vote-row">
                        <div className="vote-stack" aria-label={`${campsite.votes.length} votes`}>
                          {crew.map((member) => (
                            <span
                              key={member.id}
                              className={campsite.votes.includes(member.id) ? "has-voted" : ""}
                              title={member.name}
                            >
                              {member.name.charAt(0)}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          className={hasVoted ? "is-selected" : ""}
                          aria-pressed={hasVoted}
                          onClick={() => toggleVote(campsite.id)}
                        >
                          {hasVoted ? "Voted" : "Vote"}
                        </button>
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

              <section className="itinerary-board">
                {["Friday", "Saturday", "Sunday"].map((day, dayIndex) => (
                  <article className="day-column" key={day}>
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
                        .map((item) => (
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
                                <h2>{item.title}</h2>
                                <p>{item.detail}</p>
                                <div className="item-actions">
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
                        {trip.packing.filter((item) => item.category === category && item.done).length}
                        /{trip.packing.filter((item) => item.category === category).length}
                      </span>
                    </header>
                    <div>
                      {trip.packing
                        .filter((item) => item.category === category)
                        .map((item) => (
                          <div
                            className={`kit-item ${item.done ? "is-done" : ""}`}
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
                                <div className="item-actions">
                                  <button type="submit" className="primary-action">Save</button>
                                  <button type="button" onClick={() => setEditingPackingId("")}>
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <label className="kit-check">
                                  <input
                                    type="checkbox"
                                    checked={item.done}
                                    onChange={() => togglePackingItem(item.id)}
                                  />
                                  <span>
                                    <strong>{item.label}</strong>
                                    <small>{item.owner}</small>
                                  </span>
                                </label>
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

              <form className="basecamp-card add-form" onSubmit={addPackingItem}>
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
                        <button
                          type="button"
                          className={expense.settled ? "is-settled" : ""}
                          onClick={() => toggleExpenseSettled(expense.id)}
                        >
                          {expense.settled ? "Settled" : "Settle externally"}
                        </button>
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
                          message.author === activeMember.name ? "is-self" : ""
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
        </AnimatePresence>
      </main>

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
    </div>
  );
}

export default Basecamp;
