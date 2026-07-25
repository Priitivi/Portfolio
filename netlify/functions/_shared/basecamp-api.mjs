import { getUser } from "@netlify/identity";

const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
};

const crewByEmail = new Map([
  ["priitivi@gmail.com", { id: "priitivi", name: "Priitivi" }],
  ["husainabedi@gmail.com", { id: "husain", name: "Husain" }],
  ["dhaneshlian@gmail.com", { id: "dhanesh", name: "Dhanesh" }],
]);

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

export async function requireBasecampUser() {
  const user = await getUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  if (!user) {
    return { error: json({ code: "UNAUTHENTICATED" }, 401) };
  }

  if (!roles.includes("basecamp")) {
    return { error: json({ code: "FORBIDDEN" }, 403) };
  }

  return { user };
}

export function getCrewName(user) {
  const normalizedEmail = user.email?.toLowerCase() ?? "";
  const knownCrew = crewByEmail.get(normalizedEmail);
  if (knownCrew) return knownCrew.name;

  const profileName = typeof user.name === "string" ? user.name.trim() : "";
  return profileName.slice(0, 40) || "Crewmate";
}

export function getCrewId(user) {
  const normalizedEmail = user.email?.toLowerCase() ?? "";
  return crewByEmail.get(normalizedEmail)?.id || `identity-${user.id || "crew"}`;
}
