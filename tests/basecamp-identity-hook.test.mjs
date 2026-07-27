import assert from "node:assert/strict";
import test from "node:test";
import identityHandler, {
  getConfiguredMemberProfile,
} from "../netlify/functions/identity.mjs";

test("managed member profile configuration is normalized without exposing its source", () => {
  const configuration = JSON.stringify({
    "invited@example.test": {
      id: "Oliver_2026",
      name: "  Oliver  ",
    },
  });

  assert.deepEqual(
    getConfiguredMemberProfile("INVITED@example.test", configuration),
    { id: "oliver_2026", name: "Oliver" },
  );
  assert.equal(getConfiguredMemberProfile("unknown@example.test", configuration), null);
  assert.equal(getConfiguredMemberProfile("invited@example.test", "not json"), null);
});

test("a configured invitation receives the role and canonical server-managed profile", () => {
  const previousNetlify = globalThis.Netlify;
  const configuration = JSON.stringify({
    "invited@example.test": { id: "oliver", name: "Oliver" },
  });
  globalThis.Netlify = {
    env: {
      get(key) {
        if (key === "BASECAMP_ALLOWED_EMAILS") return "invited@example.test";
        if (key === "BASECAMP_MEMBER_PROFILES") return configuration;
        return "";
      },
    },
  };

  try {
    const result = identityHandler.userSignup({
      user: {
        id: "subject",
        email: "invited@example.test",
        appMetadata: { roles: ["existing"] },
      },
      deny() {
        throw new Error("An allowed invitation should not be denied.");
      },
    });

    assert.deepEqual(result.user.appMetadata, {
      roles: ["existing", "basecamp"],
      basecampId: "oliver",
      basecampName: "Oliver",
    });
  } finally {
    globalThis.Netlify = previousNetlify;
  }
});
