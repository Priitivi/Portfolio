import { randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";
import {
  getCrewName,
  isSameOrigin,
  json,
  requireBasecampUser,
} from "./_shared/basecamp-api.mjs";

const STORE_NAME = "durdle-basecamp-photos";
const PHOTO_PREFIX = "photos/";
const MAX_PHOTOS = 60;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_REQUEST_BYTES = 2.75 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isPhotoKey(value) {
  return typeof value === "string"
    && value.startsWith(PHOTO_PREFIX)
    && !value.includes("..");
}

export default async function handler(request) {
  const { user, error } = await requireBasecampUser();
  if (error) return error;

  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const url = new URL(request.url);

  if (request.method === "GET" && url.searchParams.has("id")) {
    const key = url.searchParams.get("id");
    if (!isPhotoKey(key)) return json({ code: "INVALID_PHOTO" }, 400);

    const metadata = await store.getMetadata(key);
    if (!metadata) return json({ code: "NOT_FOUND" }, 404);

    const image = await store.get(key, { type: "arrayBuffer" });
    if (!image) return json({ code: "NOT_FOUND" }, 404);

    return new Response(image, {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Type": metadata.metadata?.contentType || "image/jpeg",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (request.method === "GET") {
    const listing = await store.list({ prefix: PHOTO_PREFIX });
    const keys = listing.blobs
      .map((blob) => blob.key)
      .sort()
      .slice(-MAX_PHOTOS);
    const photos = (await Promise.all(
      keys.map(async (key) => {
        const stored = await store.getMetadata(key);
        if (!stored?.metadata) return null;
        return {
          id: key,
          caption: stored.metadata.caption || "",
          uploadedBy: stored.metadata.uploadedBy || "Crewmate",
          uploadedAt: stored.metadata.uploadedAt || "",
          contentType: stored.metadata.contentType || "image/jpeg",
          url: `/basecamp/api/photos?id=${encodeURIComponent(key)}`,
        };
      }),
    ))
      .filter(Boolean)
      .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));

    return json({ photos });
  }

  if (!["POST", "DELETE"].includes(request.method)) {
    return json({ code: "METHOD_NOT_ALLOWED" }, 405, {
      Allow: "GET, POST, DELETE",
    });
  }

  if (!isSameOrigin(request)) {
    return json({ code: "ORIGIN_REJECTED" }, 403);
  }

  if (request.method === "DELETE") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ code: "INVALID_REQUEST" }, 400);
    }

    if (!isPhotoKey(body?.id)) return json({ code: "INVALID_PHOTO" }, 400);
    const stored = await store.getMetadata(body.id);
    if (!stored?.metadata) return json({ code: "NOT_FOUND" }, 404);
    if (stored.metadata.uploadedBy !== getCrewName(user)) {
      return json({ code: "NOT_YOUR_PHOTO" }, 403);
    }

    await store.delete(body.id);
    return json({ deleted: true });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return json({ code: "IMAGE_TOO_LARGE" }, 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ code: "INVALID_UPLOAD" }, 400);
  }

  const image = form.get("image");
  const caption = String(form.get("caption") || "").trim().slice(0, 120);
  if (!(image instanceof File) || !ALLOWED_TYPES.has(image.type)) {
    return json({ code: "UNSUPPORTED_IMAGE" }, 415);
  }
  if (!image.size || image.size > MAX_IMAGE_BYTES) {
    return json({ code: "IMAGE_TOO_LARGE" }, 413);
  }

  const uploadedAt = new Date().toISOString();
  const id = `${PHOTO_PREFIX}${uploadedAt}-${randomUUID()}`;
  const metadata = {
    caption,
    uploadedBy: getCrewName(user),
    uploadedAt,
    contentType: image.type,
  };

  await store.set(id, await image.arrayBuffer(), { metadata });
  return json({
    photo: {
      id,
      ...metadata,
      url: `/basecamp/api/photos?id=${encodeURIComponent(id)}`,
    },
  }, 201);
}
