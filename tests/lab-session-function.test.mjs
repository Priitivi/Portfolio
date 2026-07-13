import test from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/lab-session.mjs";
import { hashLabPassword } from "../netlify/functions/_shared/lab-security.mjs";

test("session function rejects bad clearance and restores a signed cookie session", async () => {
  const previousHash = process.env.LAB_PASSWORD_HASH;
  const previousSecret = process.env.LAB_SESSION_SECRET;
  process.env.LAB_PASSWORD_HASH = await hashLabPassword("temporary-test-clearance", Buffer.alloc(16, 3));
  process.env.LAB_SESSION_SECRET = "temporary-test-session-secret-that-is-long-enough";

  try {
    const denied = await handler(new Request("https://portfolio.test/lab/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://portfolio.test" },
      body: JSON.stringify({ password: "wrong-clearance" }),
    }));
    assert.equal(denied.status, 401);

    const unlocked = await handler(new Request("https://portfolio.test/lab/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://portfolio.test" },
      body: JSON.stringify({ password: "temporary-test-clearance" }),
    }));
    assert.equal(unlocked.status, 200);
    const setCookie = unlocked.headers.get("set-cookie");
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /Secure/);
    assert.match(setCookie, /SameSite=Strict/);

    const cookie = setCookie.split(";")[0];
    const restored = await handler(new Request("https://portfolio.test/lab/api/session", {
      method: "GET",
      headers: { Cookie: cookie },
    }));
    assert.deepEqual(await restored.json(), { authenticated: true });

    const logout = await handler(new Request("https://portfolio.test/lab/api/session", {
      method: "DELETE",
      headers: { Cookie: cookie },
    }));
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
  } finally {
    if (previousHash === undefined) delete process.env.LAB_PASSWORD_HASH;
    else process.env.LAB_PASSWORD_HASH = previousHash;
    if (previousSecret === undefined) delete process.env.LAB_SESSION_SECRET;
    else process.env.LAB_SESSION_SECRET = previousSecret;
  }
});
