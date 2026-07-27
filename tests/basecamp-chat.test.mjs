import assert from "node:assert/strict";
import test from "node:test";
import {
  createChatMessage,
  resolveChatMessage,
} from "../netlify/functions/basecamp-chat.mjs";

test("new chat messages store the authenticated stable identity", () => {
  const user = {
    id: "netlify-subject",
    roles: ["basecamp"],
    appMetadata: { basecampId: "oliver", basecampName: "Oliver" },
  };
  const message = createChatMessage(user, "Ready for camp.", {
    id: "message-1",
    createdAt: "2026-07-27T10:00:00.000Z",
    author: "Forged author",
    authorId: "dhanesh",
  });

  assert.deepEqual(message, {
    id: "message-1",
    authorId: "oliver",
    author: "Oliver",
    text: "Ready for camp.",
    createdAt: "2026-07-27T10:00:00.000Z",
  });
});

test("stored chat authors resolve through a server-owned voter profile", () => {
  const stored = {
    id: "message-2",
    authorId: "identity-subject",
    author: "Old name",
    text: "A message",
    createdAt: "2026-07-27T10:00:00.000Z",
  };

  assert.equal(
    resolveChatMessage(stored, {
      "identity-subject": { name: "Current Name" },
    }).author,
    "Current Name",
  );
});

test("historical messages without an author id remain backwards-compatible", () => {
  const historical = {
    id: "legacy-message",
    author: "Crewmate",
    text: "Historical message",
    createdAt: "2026-07-01T10:00:00.000Z",
  };

  assert.deepEqual(resolveChatMessage(historical, {
    oliver: { name: "Oliver" },
  }), historical);
});

test("a missing stored author deliberately falls back to Crewmate", () => {
  const resolved = resolveChatMessage({
    id: "missing-author",
    authorId: "identity-unknown",
    text: "Message",
    createdAt: "2026-07-01T10:00:00.000Z",
  });

  assert.equal(resolved.author, "Crewmate");
});
