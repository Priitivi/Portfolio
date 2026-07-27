import assert from "node:assert/strict";
import test from "node:test";
import {
  getBasecampAccessError,
  getCrewId,
  getCrewName,
} from "../netlify/functions/_shared/basecamp-api.mjs";
import { getBasecampProfile } from "../src/utils/basecampIdentity.js";

test("an unauthenticated voting request is rejected", () => {
  assert.deepEqual(getBasecampAccessError(null), {
    code: "UNAUTHENTICATED",
    status: 401,
  });
});

test("a signed-in account without the Basecamp role cannot vote", () => {
  assert.deepEqual(getBasecampAccessError({ roles: ["other"] }), {
    code: "FORBIDDEN",
    status: 403,
  });
});

test("a newly authorized account receives a stable personal voting id", () => {
  const user = {
    id: "new-user-id",
    roles: ["basecamp"],
    userMetadata: { full_name: "New Crew Member" },
  };
  assert.equal(getBasecampAccessError(user), null);
  assert.equal(getCrewId(user), "identity-new-user-id");
});

test("an invited user display name is resolved from normalized identity metadata", () => {
  const user = {
    id: "invite-subject",
    roles: ["basecamp"],
    userMetadata: { full_name: "  Oliver   Example  " },
  };

  assert.deepEqual(getBasecampProfile(user), {
    id: "identity-invite-subject",
    name: "Oliver Example",
    hasDisplayName: true,
    source: "identity",
  });
});

test("an invited user missing optional metadata receives only the deliberate fallback", () => {
  const user = { id: "missing-name", roles: ["basecamp"] };

  assert.equal(getCrewName(user), "Crewmate");
  assert.deepEqual(
    getBasecampAccessError(user, { requireProfile: true }),
    { code: "PROFILE_REQUIRED", status: 409 },
  );
});

test("server-managed metadata keeps voting and chat on the same canonical identity", () => {
  const firstSession = {
    id: "netlify-subject",
    roles: ["basecamp"],
    appMetadata: { basecampId: "oliver", basecampName: "Oliver" },
  };
  const refreshedSession = {
    ...firstSession,
    userMetadata: { full_name: "A different optional name" },
  };

  assert.equal(getCrewId(firstSession), "oliver");
  assert.equal(getCrewName(firstSession), "Oliver");
  assert.equal(getCrewId(refreshedSession), "oliver");
  assert.equal(getCrewName(refreshedSession), "Oliver");
});

test("server-only profile configuration resolves an existing invited account immediately", () => {
  const previousNetlify = globalThis.Netlify;
  globalThis.Netlify = {
    env: {
      get(key) {
        return key === "BASECAMP_MEMBER_PROFILES"
          ? JSON.stringify({
            "invited@example.test": { id: "oliver", name: "Oliver" },
          })
          : "";
      },
    },
  };

  try {
    const user = {
      id: "existing-subject",
      email: "invited@example.test",
      roles: ["basecamp"],
    };
    assert.equal(getCrewId(user), "oliver");
    assert.equal(getCrewName(user), "Oliver");
    assert.equal(
      getBasecampAccessError(user, { requireProfile: true }),
      null,
    );
  } finally {
    globalThis.Netlify = previousNetlify;
  }
});

test("legacy Dhanesh and Husain identities remain stable", () => {
  assert.deepEqual(
    [getBasecampProfile({
      id: "subject-a",
      email: "dhaneshlian@gmail.com",
      userMetadata: { full_name: "Spoofed" },
    }), getBasecampProfile({
      id: "subject-b",
      email: "husainabedi@gmail.com",
    })].map(({ id, name }) => ({ id, name })),
    [
      { id: "dhanesh", name: "Dhanesh" },
      { id: "husain", name: "Husain" },
    ],
  );
});
