import { createLabSession, labSessionTtlSeconds, verifyLabPassword, verifyLabSession } from "./_shared/lab-security.mjs";

const COOKIE_NAME = "priit_lab_session";

function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function readCookie(cookieHeader, name) {
  return (cookieHeader || "")
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1];
}

function sessionCookie(token, requestUrl, maxAge = labSessionTtlSeconds) {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/lab; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export default async function handler(request) {
  const passwordHash = process.env.LAB_PASSWORD_HASH;
  const sessionSecret = process.env.LAB_SESSION_SECRET;

  if (!passwordHash || !sessionSecret) {
    return json({ authenticated: false, code: "LAB_NOT_CONFIGURED" }, 503);
  }

  if (request.method === "GET") {
    const token = readCookie(request.headers.get("cookie"), COOKIE_NAME);
    return json({ authenticated: verifyLabSession(token, sessionSecret) });
  }

  if (request.method === "DELETE") {
    return json(
      { authenticated: false },
      200,
      { "Set-Cookie": sessionCookie("", request.url, 0) },
    );
  }

  if (request.method !== "POST") {
    return json({ authenticated: false, code: "METHOD_NOT_ALLOWED" }, 405, { Allow: "GET, POST, DELETE" });
  }

  if (!isSameOrigin(request)) {
    return json({ authenticated: false, code: "ORIGIN_REJECTED" }, 403);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ authenticated: false, code: "INVALID_REQUEST" }, 400);
  }

  const authenticated = await verifyLabPassword(payload?.password, passwordHash);
  if (!authenticated) {
    return json({ authenticated: false, code: "INVALID_CLEARANCE" }, 401);
  }

  const token = createLabSession(sessionSecret);
  return json(
    { authenticated: true },
    200,
    { "Set-Cookie": sessionCookie(token, request.url) },
  );
}
