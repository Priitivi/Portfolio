import { getUser } from "@netlify/identity";
import {
  getConfiguredBasecampProfile,
  getBasecampProfile,
} from "../../../src/utils/basecampIdentity.js";

const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
};

export function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      ...responseHeaders,
      ...headers,
    },
  });
}

export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
}

function getConfiguredProfiles() {
  return globalThis.Netlify?.env?.get?.("BASECAMP_MEMBER_PROFILES")
    ?? process.env.BASECAMP_MEMBER_PROFILES
    ?? "";
}

export function getCrewProfile(user) {
  const configuredProfile = getConfiguredBasecampProfile(
    user?.email,
    getConfiguredProfiles(),
  );
  if (configuredProfile) {
    return {
      ...configuredProfile,
      hasDisplayName: true,
      source: "configured",
    };
  }
  return getBasecampProfile(user);
}

export function getBasecampAccessError(user, { requireProfile = false } = {}) {
  if (!user) return { code: "UNAUTHENTICATED", status: 401 };
  const roles = Array.isArray(user.roles) ? user.roles : [];
  if (!roles.includes("basecamp")) return { code: "FORBIDDEN", status: 403 };
  if (requireProfile && !getCrewProfile(user).hasDisplayName) {
    return { code: "PROFILE_REQUIRED", status: 409 };
  }
  return null;
}

export async function requireBasecampUser(options) {
  const user = await getUser();
  const accessError = getBasecampAccessError(user, options);
  if (accessError) {
    return { error: json({ code: accessError.code }, accessError.status) };
  }

  return { user };
}

export function getCrewName(user) {
  return getCrewProfile(user).name;
}

export function getCrewId(user) {
  return getCrewProfile(user).id;
}
