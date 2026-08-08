export const cacheResources = [
  { id: "profile:42", label: "User profile", payload: "Priit / London" },
  { id: "catalog:7", label: "Product catalogue", payload: "128 products" },
  { id: "feed:home", label: "Home feed", payload: "24 stories" },
];

export function resolveCacheRequest({ cache, resourceId, enabled = true }) {
  if (enabled && cache.has(resourceId)) {
    return { outcome: "hit", latency: 18, databaseQueries: 0 };
  }
  return { outcome: enabled ? "miss" : "bypass", latency: enabled ? 146 : 132, databaseQueries: 1 };
}

export function chooseServer(servers, strategy, roundRobinCursor = 0) {
  const online = servers.filter((server) => server.online);
  if (!online.length) return null;
  if (strategy === "least-connections") {
    return [...online].sort((a, b) => a.active - b.active || a.handled - b.handled)[0];
  }
  return online[roundRobinCursor % online.length];
}

export function deliverySummary(subscribers) {
  const delivered = subscribers.filter((subscriber) => subscriber.online).length;
  return { delivered, failed: subscribers.length - delivered };
}

export function replicaDelta(desired, pods) {
  const running = pods.filter((pod) => pod.status === "running").length;
  return { running, missing: Math.max(0, desired - running), healthy: running === desired };
}
