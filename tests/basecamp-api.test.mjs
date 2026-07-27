import assert from "node:assert/strict";
import test from "node:test";
import {
  getBasecampAccessError,
  getCrewId,
} from "../netlify/functions/_shared/basecamp-api.mjs";

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
  const user = { id: "new-user-id", roles: ["basecamp"] };
  assert.equal(getBasecampAccessError(user), null);
  assert.equal(getCrewId(user), "identity-new-user-id");
});
