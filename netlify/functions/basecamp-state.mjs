import { getStore } from "@netlify/blobs";
import {
  getCrewId,
  getCrewName,
  getCrewProfile,
  isSameOrigin,
  json,
  requireBasecampUser,
} from "./_shared/basecamp-api.mjs";

const STORE_NAME = "durdle-basecamp";
const STATE_KEY = "trip-state";
const MAX_BODY_BYTES = 250_000;

export function enforcePackingAcknowledgements(nextState, previousState, activeCrewId) {
  if (!Array.isArray(nextState?.packing)) return nextState;

  const previousPacking = Array.isArray(previousState?.packing)
    ? previousState.packing
    : [];
  const packing = nextState.packing.map((item) => {
    if (item?.completionMode !== "individual") {
      return { ...item, acknowledgements: [] };
    }

    const previousItem = previousPacking.find((candidate) => candidate?.id === item.id);
    const previousAcknowledgements = Array.isArray(previousItem?.acknowledgements)
      ? previousItem.acknowledgements
      : [];
    const requestedAcknowledgements = Array.isArray(item.acknowledgements)
      ? item.acknowledgements
      : [];
    const protectedAcknowledgements = previousAcknowledgements.filter(
      (memberId) => memberId !== activeCrewId,
    );

    if (requestedAcknowledgements.includes(activeCrewId)) {
      protectedAcknowledgements.push(activeCrewId);
    }

    return {
      ...item,
      acknowledgements: [...new Set(protectedAcknowledgements)],
    };
  });

  return { ...nextState, packing };
}

export function enforceCampsiteRankings(nextState, previousState, activeCrewId) {
  const validCampsiteIds = new Set(
    Array.isArray(nextState.campsites)
      ? nextState.campsites.map((campsite) => campsite?.id).filter(Boolean)
      : [],
  );
  const previousRankings = previousState?.campsiteRankings
    && typeof previousState.campsiteRankings === "object"
    ? previousState.campsiteRankings
    : {};
  const nextRankings = nextState?.campsiteRankings
    && typeof nextState.campsiteRankings === "object"
    ? nextState.campsiteRankings
    : {};
  const requestedRanking = Array.isArray(nextRankings[activeCrewId])
    ? nextRankings[activeCrewId]
    : previousRankings[activeCrewId] ?? [];
  const protectedRankings = Object.fromEntries(
    Object.entries(previousRankings).map(([memberId, ranking]) => [
      memberId,
      Array.isArray(ranking) ? ranking : [],
    ]),
  );

  protectedRankings[activeCrewId] = [...new Set(requestedRanking)]
    .filter((campsiteId) => validCampsiteIds.has(campsiteId))
    .slice(0, 3);

  return { ...nextState, campsiteRankings: protectedRankings };
}

export function canSetCrewCampsiteRank(state, activeCrewId, campsiteId, rank) {
  if (!Number.isInteger(rank) || rank < 1 || rank > 3) return false;
  const currentRanking = Array.isArray(state?.campsiteRankings?.[activeCrewId])
    ? state.campsiteRankings[activeCrewId]
    : [];
  const isAlreadyRanked = currentRanking.includes(campsiteId);
  const highestReachableRank = isAlreadyRanked
    ? currentRanking.length
    : Math.min(3, currentRanking.length + 1);
  return rank <= highestReachableRank;
}

export function setCrewCampsiteRank(state, activeCrewId, campsiteId, rank) {
  const currentRanking = Array.isArray(state?.campsiteRankings?.[activeCrewId])
    ? state.campsiteRankings[activeCrewId]
    : [];
  if (rank > 0 && !canSetCrewCampsiteRank(state, activeCrewId, campsiteId, rank)) {
    return state;
  }
  const nextRanking = currentRanking.filter((id) => id !== campsiteId);
  if (rank > 0) nextRanking.splice(rank - 1, 0, campsiteId);

  return {
    ...state,
    campsiteRankings: {
      ...(state?.campsiteRankings ?? {}),
      [activeCrewId]: nextRanking.slice(0, 3),
    },
  };
}

export function enforceCampsiteVoters(
  nextState,
  previousState,
  activeCrewId,
  activeCrewName,
) {
  const previousProfiles = previousState?.campsiteVoters
    && typeof previousState.campsiteVoters === "object"
    && !Array.isArray(previousState.campsiteVoters)
    ? previousState.campsiteVoters
    : {};
  const safeName = typeof activeCrewName === "string"
    ? activeCrewName.trim().slice(0, 40)
    : "Crewmate";

  return {
    ...nextState,
    campsiteVoters: {
      ...previousProfiles,
      [activeCrewId]: { name: safeName || "Crewmate" },
    },
  };
}

async function readRequestBody(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return { error: json({ code: "PAYLOAD_TOO_LARGE" }, 413) };
  }

  try {
    return { body: await request.json() };
  } catch {
    return { error: json({ code: "INVALID_REQUEST" }, 400) };
  }
}

async function saveTripState(store, state) {
  const updatedAt = new Date().toISOString();
  const saved = { state, updatedAt };
  const encoded = JSON.stringify(saved);
  if (Buffer.byteLength(encoded, "utf8") > MAX_BODY_BYTES) {
    return { error: json({ code: "PAYLOAD_TOO_LARGE" }, 413) };
  }

  await store.setJSON(STATE_KEY, saved);
  return { saved };
}

export default async function handler(request) {
  const { user, error } = await requireBasecampUser({
    requireProfile: request.method !== "GET",
  });
  if (error) return error;

  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (request.method === "GET") {
    const saved = await store.get(STATE_KEY, { type: "json" });
    return json({
      ...(saved ?? { state: null, updatedAt: null }),
      activeProfile: getCrewProfile(user),
    });
  }

  if (!["PUT", "PATCH"].includes(request.method)) {
    return json({ code: "METHOD_NOT_ALLOWED" }, 405, { Allow: "GET, PUT, PATCH" });
  }

  if (!isSameOrigin(request)) {
    return json({ code: "ORIGIN_REJECTED" }, 403);
  }

  const parsed = await readRequestBody(request);
  if (parsed.error) return parsed.error;
  const { body } = parsed;
  const activeCrewId = getCrewId(user);
  const activeCrewName = getCrewName(user);
  const previous = await store.get(STATE_KEY, { type: "json" });

  if (request.method === "PATCH") {
    const campsiteId = typeof body?.campsiteId === "string" ? body.campsiteId : "";
    const rank = body?.rank;
    if (!campsiteId || !Number.isInteger(rank) || rank < 0 || rank > 3) {
      return json({ code: "INVALID_VOTE" }, 400);
    }
    if (!previous?.state) {
      return json({ code: "STATE_NOT_READY" }, 409);
    }
    const validCampsite = Array.isArray(previous.state.campsites)
      && previous.state.campsites.some((campsite) => campsite?.id === campsiteId);
    if (!validCampsite) {
      return json({ code: "INVALID_CAMPSITE" }, 400);
    }
    if (
      rank > 0
      && !canSetCrewCampsiteRank(previous.state, activeCrewId, campsiteId, rank)
    ) {
      return json({ code: "INVALID_RANK_POSITION" }, 400);
    }

    const rankedState = setCrewCampsiteRank(
      previous.state,
      activeCrewId,
      campsiteId,
      rank,
    );
    const protectedState = enforceCampsiteVoters(
      rankedState,
      previous.state,
      activeCrewId,
      activeCrewName,
    );
    const result = await saveTripState(store, protectedState);
    if (result.error) return result.error;
    return json(result.saved);
  }

  if (!body?.state || typeof body.state !== "object" || Array.isArray(body.state)) {
    return json({ code: "INVALID_STATE" }, 400);
  }

  const packingProtectedState = enforcePackingAcknowledgements(
    body.state,
    previous?.state,
    activeCrewId,
  );
  const rankingsProtectedState = enforceCampsiteRankings(
    packingProtectedState,
    previous?.state,
    activeCrewId,
  );
  const protectedState = enforceCampsiteVoters(
    rankingsProtectedState,
    previous?.state,
    activeCrewId,
    activeCrewName,
  );
  const result = await saveTripState(store, protectedState);
  if (result.error) return result.error;
  return json(result.saved);
}
