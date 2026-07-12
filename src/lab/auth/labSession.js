const endpoint = "/lab/api/session";

async function requestSession(options) {
  const response = await fetch(endpoint, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = { code: "AUTH_SERVICE_UNAVAILABLE" };
  }

  return { ok: response.ok, status: response.status, ...payload };
}

export function readLabSession() {
  return requestSession({ method: "GET" });
}

export function unlockLab(password) {
  return requestSession({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export function clearLabSession() {
  return requestSession({ method: "DELETE" });
}
