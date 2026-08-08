const requestAndStream = (id, label, connectionIds) => ({
  id,
  label,
  steps: [
    ...connectionIds.map((connectionId) => ({ connectionId, tone: "prompt", duration: 380 })),
    ...[...connectionIds].reverse().map((connectionId) => ({ connectionId, reverse: true, tone: "token", duration: 390, burst: 3, burstGap: 70 })),
  ],
});

export function buildAiConnections(architecture) {
  const connections = [
    { id: "user-api", from: "ai-user", to: "ai-api", fromAnchor: "bottom", toAnchor: "top" },
  ];

  if (architecture.queue) {
    connections.push({ id: "api-queue", from: "ai-api", to: "ai-queue", fromAnchor: "bottom", toAnchor: "top" });
    if (architecture.scheduler) {
      connections.push({ id: "queue-scheduler", from: "ai-queue", to: "ai-scheduler", fromAnchor: "bottom", toAnchor: "top" });
    }
  }

  const entryNode = architecture.scheduler ? "ai-scheduler" : architecture.queue ? "ai-queue" : "ai-api";
  const entryPrefix = architecture.scheduler ? "scheduler" : architecture.queue ? "queue" : "api";

  if (architecture.routingStrategy !== "standard") {
    connections.push(
      { id: `${entryPrefix}-fast`, from: entryNode, to: "ai-fast-pool", fromAnchor: "bottom", toAnchor: "top", route: "responsive-fanout" },
      { id: `${entryPrefix}-capable`, from: entryNode, to: "ai-capable-pool", fromAnchor: "bottom", toAnchor: "top", route: "responsive-fanout" },
    );
    if (architecture.kvCacheVisible) {
      connections.push(
        { id: "fast-kv", from: "ai-fast-pool", to: "ai-kv", fromAnchor: "bottom", toAnchor: "top", route: "responsive-fanout", muted: true },
        { id: "capable-kv", from: "ai-capable-pool", to: "ai-kv", fromAnchor: "bottom", toAnchor: "top", route: "responsive-fanout", muted: true },
      );
    }
  } else {
    const displayedWorkers = Math.min(3, Math.max(1, architecture.workers));
    for (let index = 1; index <= displayedWorkers; index += 1) {
      connections.push({
        id: `${entryPrefix}-worker-${index}`,
        from: entryNode,
        to: `ai-worker-${index}`,
        fromAnchor: "bottom",
        toAnchor: "top",
        route: displayedWorkers > 1 ? "responsive-fanout" : undefined,
      });
    }
    if (architecture.kvCacheVisible) {
      const middleWorker = Math.min(2, displayedWorkers);
      connections.push({ id: `worker-${middleWorker}-kv`, from: `ai-worker-${middleWorker}`, to: "ai-kv", fromAnchor: "bottom", toAnchor: "top", muted: true });
    }
  }

  if (architecture.autoscaling) {
    connections.push({ id: "autoscaler-scheduler", from: "ai-autoscaler", to: architecture.scheduler ? "ai-scheduler" : "ai-api", fromAnchor: "left", toAnchor: "right", route: "responsive-side-right", desktopRoute: "orthogonal", muted: true });
  }

  return connections;
}

export function buildAiTraffic(architecture) {
  const frontDoor = ["user-api"];
  if (architecture.queue) frontDoor.push("api-queue");
  if (architecture.scheduler) frontDoor.push("queue-scheduler");
  const entryPrefix = architecture.scheduler ? "scheduler" : architecture.queue ? "queue" : "api";
  const traces = [];

  if (architecture.routingStrategy !== "standard") {
    if (architecture.routingStrategy !== "always-large") {
      traces.push(requestAndStream("fast-request", "SIMPLE REQUEST / FAST MODEL", [...frontDoor, `${entryPrefix}-fast`]));
    }
    if (architecture.routingStrategy !== "always-fast") {
      traces.push(requestAndStream("capable-request", "COMPLEX REQUEST / CAPABLE MODEL", [...frontDoor, `${entryPrefix}-capable`]));
    }
    if (architecture.kvCacheVisible) {
      const kvConnection = architecture.routingStrategy === "always-fast" ? "fast-kv" : "capable-kv";
      traces.push({ id: "kv-update", label: "DECODE STEP / KV BLOCK UPDATE", steps: [{ connectionId: kvConnection, tone: "memory", duration: 480 }, { connectionId: kvConnection, reverse: true, tone: "memory", duration: 480 }] });
    }
  } else {
    const displayedWorkers = Math.min(3, Math.max(1, architecture.workers));
    for (let index = 1; index <= displayedWorkers; index += 1) {
      traces.push(requestAndStream(`worker-${index}`, displayedWorkers > 1 ? `SCHEDULED REQUEST / WORKER ${index}` : "PROMPT → PREFILL → TOKEN STREAM", [...frontDoor, `${entryPrefix}-worker-${index}`]));
    }
    if (architecture.kvCacheVisible) {
      const middleWorker = Math.min(2, displayedWorkers);
      traces.push({ id: "kv-update", label: "DECODE STEP / REUSE + UPDATE KV", steps: [{ connectionId: `worker-${middleWorker}-kv`, tone: "memory", duration: 480 }, { connectionId: `worker-${middleWorker}-kv`, reverse: true, tone: "memory", duration: 480 }] });
    }
  }

  return traces;
}
