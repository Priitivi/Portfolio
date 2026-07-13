import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const HASH_LENGTH = 64;
const SESSION_TTL_MS = 30 * 60 * 1000;

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function hashLabPassword(password, salt = randomBytes(16)) {
  if (!password || password.length < 10) {
    throw new Error("The lab password must contain at least 10 characters.");
  }

  const derivedKey = await scrypt(password, salt, HASH_LENGTH);
  return `scrypt$${Buffer.from(salt).toString("base64url")}$${Buffer.from(derivedKey).toString("base64url")}`;
}

export async function verifyLabPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const [scheme, encodedSalt, encodedHash] = storedHash.split("$");
  if (scheme !== "scrypt" || !encodedSalt || !encodedHash) return false;

  try {
    const salt = Buffer.from(encodedSalt, "base64url");
    const expected = Buffer.from(encodedHash, "base64url");
    const actual = await scrypt(password, salt, expected.length);
    return safeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function createLabSession(secret, now = Date.now()) {
  if (!secret || secret.length < 32) {
    throw new Error("LAB_SESSION_SECRET must contain at least 32 characters.");
  }

  const payload = Buffer.from(JSON.stringify({ exp: now + SESSION_TTL_MS })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyLabSession(token, secret, now = Date.now()) {
  if (!token || !secret) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  try {
    const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");
    if (!safeEqual(signature, expectedSignature)) return false;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(session.exp) && session.exp > now;
  } catch {
    return false;
  }
}

export const labSessionTtlSeconds = SESSION_TTL_MS / 1000;
