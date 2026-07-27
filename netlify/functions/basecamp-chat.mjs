import { randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";
import {
  getCrewId,
  getCrewName,
  isSameOrigin,
  json,
  requireBasecampUser,
} from "./_shared/basecamp-api.mjs";
import { getKnownBasecampNameById } from "../../src/utils/basecampIdentity.js";

const STORE_NAME = "durdle-basecamp";
const MESSAGE_PREFIX = "messages/";
const MAX_MESSAGE_LENGTH = 500;
const MAX_MESSAGES = 100;

function cleanStoredName(value) {
  return typeof value === "string" ? value.trim().slice(0, 40) : "";
}

export function resolveChatMessage(message, profiles = {}) {
  if (!message || typeof message !== "object") return message;
  const authorId = typeof message.authorId === "string" ? message.authorId : "";
  const profileName = cleanStoredName(profiles?.[authorId]?.name);
  const knownName = getKnownBasecampNameById(authorId);

  return {
    ...message,
    author: profileName || knownName || cleanStoredName(message.author) || "Crewmate",
  };
}

export function createChatMessage(user, text, {
  id = randomUUID(),
  createdAt = new Date().toISOString(),
} = {}) {
  return {
    id,
    authorId: getCrewId(user),
    author: getCrewName(user),
    text,
    createdAt,
  };
}

export default async function handler(request) {
  const { user, error } = await requireBasecampUser({
    requireProfile: request.method === "POST",
  });
  if (error) return error;

  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (request.method === "GET") {
    const listing = await store.list({ prefix: MESSAGE_PREFIX });
    const keys = listing.blobs
      .map((blob) => blob.key)
      .sort()
      .slice(-MAX_MESSAGES);
    const messages = (await Promise.all(
      keys.map((key) => store.get(key, { type: "json" })),
    ))
      .filter(Boolean)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    const savedState = await store.get("trip-state", { type: "json" });
    const profiles = savedState?.state?.campsiteVoters ?? {};

    return json({
      messages: messages.map((message) => resolveChatMessage(message, profiles)),
    });
  }

  if (request.method !== "POST") {
    return json({ code: "METHOD_NOT_ALLOWED" }, 405, { Allow: "GET, POST" });
  }

  if (!isSameOrigin(request)) {
    return json({ code: "ORIGIN_REJECTED" }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ code: "INVALID_REQUEST" }, 400);
  }

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_MESSAGE_LENGTH) {
    return json({ code: "INVALID_MESSAGE" }, 400);
  }

  const message = createChatMessage(user, text);

  await store.setJSON(
    `${MESSAGE_PREFIX}${message.createdAt}-${message.id}`,
    message,
  );
  return json({ message }, 201);
}
