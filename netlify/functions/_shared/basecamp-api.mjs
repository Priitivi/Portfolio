import { getUser } from "@netlify/identity";

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
  const knownCrew = [
    ["priit", "Priitivi"],
    ["husain", "Husain"],
    ["dhanesh", "Dhanesh"],
    ["oliver", "Oliver"],
  ];
  const matchedCrew = knownCrew.find(([fragment]) => normalizedEmail.includes(fragment));
  if (matchedCrew) return matchedCrew[1];

  const profileName = typeof user.name === "string" ? user.name.trim() : "";
  return profileName.slice(0, 40) || "Crewmate";
}
