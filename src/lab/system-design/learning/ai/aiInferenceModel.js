const DEFAULT_ARCHITECTURE = {
  queue: false,
  queueCapacity: 900,
  scheduler: false,
  workers: 1,
  failedWorkers: 0,
  startingWorkers: 0,
  workerBaseRps: 6,
  batching: "none",
  batchSize: 1,
  kvCacheVisible: false,
  kvMemoryEfficiency: 1,
  streaming: false,
  prefixCache: false,
  prefixHitRate: 0,
  repeatedPrefixTokens: 0,
  autoscaling: false,
  routingStrategy: "standard",
  fallbackEnabled: false,
};

const DEFAULT_WORKLOAD = {
  requestRate: 0.25,
  concurrency: 1,
  promptTokens: 128,
  outputTokens: 64,
  simpleRequestShare: 0.65,
  backlog: 0,
  queueWindowSeconds: 6,
};

const BATCH_FACTORS = { none: 1, static: 1.42, continuous: 2.12 };
const BATCH_OCCUPANCY = { none: 0.75, static: 1.16, continuous: 1.48 };

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const round = (value, decimals = 0) => Number(value.toFixed(decimals));

export function mergeAiArchitecture(base = {}, patch = {}) {
  return { ...DEFAULT_ARCHITECTURE, ...base, ...patch };
}

export function mergeAiWorkload(base = {}, patch = {}) {
  return { ...DEFAULT_WORKLOAD, ...base, ...patch };
}

function routingProfile(strategy, simpleRequestShare) {
  if (strategy === "always-large") return { largeShare: 1, compute: 1.7, cost: 1.7, quality: 94, modelMemory: 64 };
  if (strategy === "always-fast") return { largeShare: 0, compute: 0.68, cost: 0.65, quality: 74, modelMemory: 34 };
  if (strategy === "balanced") {
    const largeShare = clamp(1 - simpleRequestShare * 0.78, 0.2, 0.72);
    return {
      largeShare,
      compute: 0.68 * (1 - largeShare) + 1.7 * largeShare,
      cost: 0.65 * (1 - largeShare) + 1.7 * largeShare,
      quality: 74 * (1 - largeShare) + 94 * largeShare - 1.5,
      modelMemory: 34 * (1 - largeShare) + 64 * largeShare,
    };
  }
  return { largeShare: 0, compute: 1, cost: 1, quality: 84, modelMemory: 48 };
}

export function simulateAiInference({ workload: workloadInput, architecture: architectureInput }) {
  const workload = mergeAiWorkload(workloadInput);
  const architecture = mergeAiArchitecture(architectureInput);
  const onlineWorkers = Math.max(0, architecture.workers - architecture.failedWorkers);
  const baseRouting = routingProfile(architecture.routingStrategy, workload.simpleRequestShare);
  const fallbackShift = architecture.failedWorkers && architecture.fallbackEnabled && architecture.routingStrategy !== "standard"
    ? Math.min(baseRouting.largeShare, architecture.failedWorkers * 0.12)
    : 0;
  const fallbackLargeShare = baseRouting.largeShare - fallbackShift;
  const routing = fallbackShift
    ? {
        largeShare: fallbackLargeShare,
        compute: 0.68 * (1 - fallbackLargeShare) + 1.7 * fallbackLargeShare,
        cost: 0.65 * (1 - fallbackLargeShare) + 1.7 * fallbackLargeShare,
        quality: baseRouting.quality - fallbackShift * 18 - 1.3,
        modelMemory: 34 * (1 - fallbackLargeShare) + 64 * fallbackLargeShare,
      }
    : baseRouting;
  const prefixReusable = Math.min(workload.promptTokens, architecture.repeatedPrefixTokens);
  const cachedPromptTokens = architecture.prefixCache ? prefixReusable * architecture.prefixHitRate : 0;
  const effectivePromptTokens = Math.max(16, workload.promptTokens - cachedPromptTokens);

  const promptWork = (effectivePromptTokens / 512) * 0.58;
  const decodeWork = (workload.outputTokens / 128) * 0.42;
  const requestWork = Math.max(0.28, (promptWork + decodeWork) * routing.compute);
  const batchFactor = BATCH_FACTORS[architecture.batching] || 1;
  const serviceCapacity = onlineWorkers
    ? (onlineWorkers * architecture.workerBaseRps * batchFactor) / requestWork
    : 0;
  const capacityPressure = serviceCapacity ? workload.requestRate / serviceCapacity : 4;
  const backlogDelta = workload.requestRate - serviceCapacity;
  const queueDepth = Math.max(0, workload.backlog + backlogDelta * workload.queueWindowSeconds);
  const controlledQueueDepth = architecture.queue ? queueDepth : Math.min(queueDepth, 36);
  const queueWait = architecture.queue && serviceCapacity
    ? (controlledQueueDepth / serviceCapacity) * 1000
    : Math.max(0, capacityPressure - 0.82) * 420;

  const schedulingDelay = architecture.batching === "static" ? 62 : architecture.batching === "continuous" ? 24 : 4;
  const prefillMs = 48 + effectivePromptTokens * 0.105 * routing.compute;
  const ttft = 24 + queueWait + schedulingDelay + prefillMs;
  const activeLimit = Math.max(1, onlineWorkers * Math.max(1, architecture.batchSize));
  const activeSequences = Math.min(workload.concurrency, activeLimit);
  const decodeContention = 1 + Math.max(0, activeSequences / Math.max(1, onlineWorkers * 5) - 1) * 0.34;
  const interTokenMs = (31 * routing.compute * decodeContention) / (architecture.batching === "continuous" ? 0.92 : 1);
  const generationMs = Math.max(0, workload.outputTokens - 1) * interTokenMs;
  const endToEndLatency = ttft + generationMs;
  const p95Latency = endToEndLatency * (1.18 + Math.min(1.5, capacityPressure) * 0.08);

  const unbatchedPressure = onlineWorkers ? (workload.requestRate * requestWork) / (onlineWorkers * architecture.workerBaseRps) : 4;
  const gpuUtilization = clamp(unbatchedPressure * 100 * (BATCH_OCCUPANCY[architecture.batching] || 1), 3, 100);
  const tokensPerSequence = workload.promptTokens + workload.outputTokens * 0.5;
  const kvCacheUtilization = onlineWorkers
    ? (activeSequences / onlineWorkers) * (tokensPerSequence / 4096) * 4.5 / architecture.kvMemoryEfficiency * 100 / 100
    : 0;
  const prefixMemory = architecture.prefixCache ? (prefixReusable / 4096) * 7 : 0;
  const gpuMemoryUtilization = routing.modelMemory + kvCacheUtilization + prefixMemory;

  let errorRate = 0.08;
  if (!architecture.queue && capacityPressure > 1) errorRate += Math.min(22, (capacityPressure - 1) * 12);
  if (architecture.queue && controlledQueueDepth > architecture.queueCapacity) errorRate += Math.min(18, ((controlledQueueDepth - architecture.queueCapacity) / architecture.queueCapacity) * 20);
  if (architecture.failedWorkers && !architecture.fallbackEnabled) errorRate += Math.min(2.4, architecture.failedWorkers * 0.35);
  if (!onlineWorkers) errorRate = architecture.fallbackEnabled ? 4.5 : 100;
  errorRate = clamp(errorRate, 0.08, 100);

  const completedRps = Math.min(workload.requestRate, serviceCapacity) * (1 - errorRate / 100);
  const outputTokensPerSecond = completedRps * workload.outputTokens;
  const costIndex = architecture.workers * routing.cost + architecture.startingWorkers * routing.cost * 0.35;
  const costEfficiency = costIndex ? completedRps / costIndex : 0;
  const perceivedWait = architecture.streaming ? ttft : endToEndLatency;
  const availability = !onlineWorkers
    ? architecture.fallbackEnabled ? 95.5 : 0
    : architecture.failedWorkers && architecture.fallbackEnabled ? 99.97
      : architecture.failedWorkers && architecture.scheduler ? 99.6
        : architecture.failedWorkers ? 100 - errorRate : 99.99;
  const qualityProxy = routing.quality;

  const metrics = {
    requestRate: round(workload.requestRate, 1),
    concurrency: workload.concurrency,
    promptTokens: workload.promptTokens,
    outputTokens: workload.outputTokens,
    effectivePromptTokens: round(effectivePromptTokens),
    cachedPromptTokens: round(cachedPromptTokens),
    serviceCapacity: round(serviceCapacity, 1),
    capacityPressure: round(capacityPressure, 2),
    queueDepth: round(controlledQueueDepth),
    queueWait: round(queueWait),
    prefillMs: round(prefillMs),
    ttft: round(ttft),
    interTokenMs: round(interTokenMs, 1),
    endToEndLatency: round(endToEndLatency),
    p95Latency: round(p95Latency),
    perceivedWait: round(perceivedWait),
    gpuUtilization: round(gpuUtilization, 1),
    gpuMemoryUtilization: round(gpuMemoryUtilization, 1),
    kvCacheUtilization: round(kvCacheUtilization, 1),
    activeSequences,
    outputTokensPerSecond: round(outputTokensPerSecond),
    throughput: round(completedRps, 1),
    errorRate: round(errorRate, 2),
    onlineWorkers,
    readyWorkers: onlineWorkers,
    startingWorkers: architecture.startingWorkers,
    costIndex: round(costIndex, 2),
    costEfficiency: round(costEfficiency, 2),
    qualityProxy: round(qualityProxy, 0),
    largeModelShare: round(routing.largeShare * 100, 0),
    prefixHitRate: architecture.prefixCache ? round(architecture.prefixHitRate * 100) : 0,
    availability: round(availability, 2),
  };

  return { ...metrics, bottleneck: identifyAiBottleneck(metrics, architecture) };
}

export function identifyAiBottleneck(metrics, architecture) {
  if (metrics.onlineWorkers === 0) return architecture.fallbackEnabled ? "FALLBACK ACTIVE" : "UNAVAILABLE";
  if (metrics.gpuMemoryUtilization >= 94) return "MEMORY BOUND";
  if (architecture.queue && metrics.queueDepth >= 48) return "QUEUE BOUND";
  if (metrics.capacityPressure >= 1) return "CAPACITY LIMITED";
  if (metrics.gpuUtilization >= 90) return "COMPUTE BOUND";
  if (architecture.failedWorkers) return "DEGRADED / ROUTED";
  return "HEALTHY";
}

export function aiMetricDisplay(key, metrics) {
  const definitions = {
    traffic: ["TRAFFIC", `${metrics.requestRate.toFixed(1)} req/s`],
    concurrency: ["CONCURRENCY", metrics.concurrency.toLocaleString()],
    ttft: ["TTFT", `${metrics.ttft.toLocaleString()} ms`],
    itl: ["INTER-TOKEN LATENCY", `${metrics.interTokenMs.toFixed(1)} ms`],
    p95: ["P95 END-TO-END", `${metrics.p95Latency.toLocaleString()} ms`],
    perceivedWait: ["FIRST VISIBLE OUTPUT", `${metrics.perceivedWait.toLocaleString()} ms`],
    outputTps: ["OUTPUT TOKENS / SEC", metrics.outputTokensPerSecond.toLocaleString()],
    gpuUtil: ["GPU UTILISATION", `${metrics.gpuUtilization.toFixed(1)}%`],
    gpuMemory: ["GPU MEMORY", `${metrics.gpuMemoryUtilization.toFixed(1)}%`],
    kvCache: ["KV CACHE PRESSURE", `${metrics.kvCacheUtilization.toFixed(1)}%`],
    active: ["ACTIVE SEQUENCES", metrics.activeSequences.toLocaleString()],
    queueDepth: ["QUEUE DEPTH", metrics.queueDepth.toLocaleString()],
    queueWait: ["QUEUE WAIT", `${metrics.queueWait.toLocaleString()} ms`],
    throughput: ["COMPLETED", `${metrics.throughput.toFixed(1)} req/s`],
    capacity: ["SERVICE CAPACITY", `${metrics.serviceCapacity.toFixed(1)} req/s`],
    cost: ["COST INDEX", metrics.costIndex.toFixed(2)],
    costEfficiency: ["REQ / COST UNIT", metrics.costEfficiency.toFixed(2)],
    quality: ["QUALITY PROXY", `${metrics.qualityProxy} / 100`],
    largeShare: ["CAPABLE MODEL SHARE", `${metrics.largeModelShare}%`],
    prefixHit: ["PREFIX HIT RATE", `${metrics.prefixHitRate}%`],
    cachedPrompt: ["PREFILL TOKENS SKIPPED", metrics.cachedPromptTokens.toLocaleString()],
    workers: ["READY WORKERS", metrics.onlineWorkers.toLocaleString()],
    availability: ["AVAILABILITY", `${metrics.availability.toFixed(2)}%`],
    errors: ["ERROR RATE", `${metrics.errorRate.toFixed(2)}%`],
  };
  return definitions[key];
}

export function aiMetricTone(key, metrics) {
  if (key === "gpuUtil") return metrics.gpuUtilization >= 94 ? "bad" : metrics.gpuUtilization >= 78 ? "warn" : "good";
  if (key === "gpuMemory" || key === "kvCache") return metrics.gpuMemoryUtilization >= 94 ? "bad" : metrics.gpuMemoryUtilization >= 78 ? "warn" : "good";
  if (key === "queueDepth" || key === "queueWait") return metrics.queueDepth >= 100 ? "bad" : metrics.queueDepth > 0 ? "warn" : "good";
  if (key === "ttft" || key === "p95" || key === "perceivedWait") return metrics.ttft >= 1200 ? "bad" : metrics.ttft >= 450 ? "warn" : "good";
  if (key === "errors") return metrics.errorRate >= 2 ? "bad" : metrics.errorRate > 0.2 ? "warn" : "good";
  if (["availability", "throughput", "outputTps", "prefixHit", "cachedPrompt"].includes(key)) return "good";
  return "";
}
