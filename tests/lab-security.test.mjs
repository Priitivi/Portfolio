import test from "node:test";
import assert from "node:assert/strict";
import { createLabSession, hashLabPassword, verifyLabPassword, verifyLabSession } from "../netlify/functions/_shared/lab-security.mjs";

test("password hashes verify without storing the plaintext", async () => {
  const hash = await hashLabPassword("correct-horse-battery-staple", Buffer.alloc(16, 7));
  assert.match(hash, /^scrypt\$/);
  assert.equal(hash.includes("correct-horse-battery-staple"), false);
  assert.equal(await verifyLabPassword("correct-horse-battery-staple", hash), true);
  assert.equal(await verifyLabPassword("incorrect-password", hash), false);
});

test("signed sessions expire and reject tampering", () => {
  const secret = "a-development-only-secret-with-32-characters";
  const issuedAt = 1_000_000;
  const session = createLabSession(secret, issuedAt);

  assert.equal(verifyLabSession(session, secret, issuedAt + 1000), true);
  assert.equal(verifyLabSession(`${session}tampered`, secret, issuedAt + 1000), false);
  assert.equal(verifyLabSession(session, secret, issuedAt + 31 * 60 * 1000), false);
});
