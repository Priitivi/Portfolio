import { randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";
import {
  getCrewName,
  isSameOrigin,
  json,
  requireBasecampUser,
} from "./_shared/basecamp-api.mjs";

const STORE_NAME = "durdle-basecamp";
const MESSAGE_PREFIX = "messages/";
const MAX_MESSAGE_LENGTH = 500;
const MAX_MESSAGES = 100;

export default async function handler(request) {
  const { user, error } = await requireBasecampUser();
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

    return json({ messages });
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

  const createdAt = new Date().toISOString();
  const id = randomUUID();
  const message = {
    id,
    author: getCrewName(user),
    text,
    createdAt,
  };

  await store.setJSON(`${MESSAGE_PREFIX}${createdAt}-${id}`, message);
  return json({ message }, 201);
}
