export function buildScaleConnections(architecture) {
  const connections = [];

  if (architecture.cdn) {
    connections.push(
      { id: "client-cdn", from: "scale-client", to: "scale-cdn", fromAnchor: "bottom", toAnchor: "top" },
      { id: "cdn-origin", from: "scale-cdn", to: "scale-origin", fromAnchor: "right", toAnchor: "left", route: "responsive-stack", desktopRoute: "orthogonal", muted: true },
    );
  }

  if (architecture.loadBalancer) {
    connections.push(
      { id: "client-lb", from: "scale-client", to: "scale-lb", fromAnchor: "bottom", toAnchor: "top", route: architecture.cdn ? "responsive-side-right" : undefined },
      { id: "lb-api", from: "scale-lb", to: "scale-api", fromAnchor: "bottom", toAnchor: "top" },
    );
  } else {
    connections.push({ id: "client-api", from: "scale-client", to: "scale-api", fromAnchor: "bottom", toAnchor: "top" });
  }

  if (architecture.cache) {
    connections.push({ id: "api-cache", from: "scale-api", to: "scale-cache", fromAnchor: "bottom", toAnchor: "top" });
    if (architecture.replicas) {
      connections.push(
        { id: "cache-replica-1", from: "scale-cache", to: "scale-replica-1", route: "responsive-fanout", fromAnchor: "bottom", toAnchor: "top" },
        { id: "cache-replica-2", from: "scale-cache", to: "scale-replica-2", route: "responsive-fanout", fromAnchor: "bottom", toAnchor: "top" },
        { id: "api-db", from: "scale-api", to: "scale-db", fromAnchor: "bottom", toAnchor: "top", route: "responsive-side-right" },
      );
    } else {
      connections.push({ id: "cache-db", from: "scale-cache", to: "scale-db", fromAnchor: "right", toAnchor: "left", route: "responsive-stack" });
    }
  } else {
    connections.push({ id: "api-db", from: "scale-api", to: "scale-db", fromAnchor: "bottom", toAnchor: "top" });
  }

  if (architecture.replicas) {
    connections.push(
      { id: "db-replica-1", from: "scale-db", to: "scale-replica-1", route: "responsive-fanout", fromAnchor: "bottom", toAnchor: "top", muted: true },
      { id: "db-replica-2", from: "scale-db", to: "scale-replica-2", route: "responsive-fanout", fromAnchor: "bottom", toAnchor: "top", muted: true },
    );
  }

  if (architecture.queue) {
    connections.push(
      { id: "api-queue", from: "scale-api", to: "scale-queue", fromAnchor: "bottom", toAnchor: "top", route: "responsive-side-right" },
      { id: "queue-workers", from: "scale-queue", to: "scale-workers", fromAnchor: "bottom", toAnchor: "top" },
    );
  }

  return connections;
}

const reverseSteps = (connectionIds, tone) => [...connectionIds].reverse().map((connectionId) => ({ connectionId, reverse: true, tone }));
const roundTrip = (connectionIds, tone = "read") => [
  ...connectionIds.map((connectionId) => ({ connectionId, tone })),
  ...reverseSteps(connectionIds, tone),
];

export function buildScaleTraffic(architecture) {
  const frontDoor = architecture.loadBalancer ? ["client-lb", "lb-api"] : ["client-api"];
  const traces = [];

  if (architecture.cdn) {
    traces.push(
      { id: "edge-hit", label: "STATIC ASSET / EDGE HIT", steps: roundTrip(["client-cdn"], "static") },
      { id: "edge-miss", label: "STATIC ASSET / EDGE MISS → ORIGIN", steps: roundTrip(["client-cdn", "cdn-origin"], "static") },
    );
  }

  if (!architecture.cache) {
    traces.push({ id: "database-read", label: "DYNAMIC READ / DATABASE", steps: roundTrip([...frontDoor, "api-db"], "read") });
  } else {
    traces.push({ id: "cache-hit", label: "DYNAMIC READ / CACHE HIT", steps: roundTrip([...frontDoor, "api-cache"], "read") });
    const readStore = architecture.replicas ? "cache-replica-1" : "cache-db";
    traces.push({ id: "cache-miss", label: architecture.replicas ? "CACHE MISS / READ REPLICA" : "CACHE MISS / PRIMARY", steps: roundTrip([...frontDoor, "api-cache", readStore], "read") });
  }

  if (architecture.replicas) {
    traces.push(
      { id: "write", label: "WRITE / PRIMARY DATABASE", steps: roundTrip([...frontDoor, "api-db"], "write") },
      { id: "replication", label: "REPLICATION / ASYNC COPY", steps: [{ connectionId: "db-replica-2", tone: "write" }] },
    );
  }

  if (architecture.queue) {
    traces.push({ id: "background-job", label: "BACKGROUND JOB / QUEUED", steps: [{ connectionId: "api-queue", tone: "job" }, { connectionId: "queue-workers", tone: "job" }] });
  }

  return traces;
}
