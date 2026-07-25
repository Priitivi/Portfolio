import { getStore } from "@netlify/blobs";
import { isSameOrigin, json, requireBasecampUser } from "./_shared/basecamp-api.mjs";

const STORE_NAME = "durdle-basecamp";
const STATE_KEY = "trip-state";
const MAX_BODY_BYTES = 250_000;

export default async function handler(request) {
  const { error } = await requireBasecampUser();
  if (error) return error;

  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (request.method === "GET") {
    const saved = await store.get(STATE_KEY, { type: "json" });
    return json(saved ?? { state: null, updatedAt: null });
  }

  if (request.method !== "PUT") {
    return json({ code: "METHOD_NOT_ALLOWED" }, 405, { Allow: "GET, PUT" });
  }

  if (!isSameOrigin(request)) {
    return json({ code: "ORIGIN_REJECTED" }, 403);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ code: "INVALID_REQUEST" }, 400);
  }

  if (!body?.state || typeof body.state !== "object" || Array.isArray(body.state)) {
    return json({ code: "INVALID_STATE" }, 400);
  }

  const updatedAt = new Date().toISOString();
  const saved = { state: body.state, updatedAt };
  const encoded = JSON.stringify(saved);
  if (Buffer.byteLength(encoded, "utf8") > MAX_BODY_BYTES) {
    return json({ code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  await store.setJSON(STATE_KEY, saved);
  return json({ updatedAt });
}
