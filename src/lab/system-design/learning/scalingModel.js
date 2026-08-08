const DEFAULT_ARCHITECTURE = {
  loadBalancer: false,
  apiInstances: 1,
  apiCapacityPerInstance: 1400,
  verticalMultiplier: 1,
  databaseCapacity: 1600,
  connectionLimit: 640,
  cache: false,
  cacheHitRate: 0,
  replicas: 0,
  replicaCapacity: 1600,
  shards: 1,
  cdn: false,
  cdnHitRate: 0,
  originRegions: 1,
  compressionRatio: 1,
  queue: false,
  workers: 0,
  workerCapacity: 1050,
  syncWorkMultiplier: 1,
  failedApiCount: 0,
};

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const round = (value, decimals = 0) => Number(value.toFixed(decimals));

export function mergeArchitecture(base = {}, patch = {}) {
  return { ...DEFAULT_ARCHITECTURE, ...base, ...patch };
}

export function simulateScale({ workload, architecture: inputArchitecture }) {
  const architecture = mergeArchitecture(inputArchitecture);
  const onlineApiInstances = Math.max(0, architecture.apiInstances - architecture.failedApiCount);
  const apiCapacity = onlineApiInstances * architecture.apiCapacityPerInstance * architecture.verticalMultiplier;
  const staticRequests = workload.requestsPerSecond * workload.staticShare;
  const dynamicRequests = workload.requestsPerSecond - staticRequests;
  const cdnHits = architecture.cdn ? staticRequests * architecture.cdnHitRate : 0;
  const originTraffic = workload.requestsPerSecond - cdnHits;
  const apiPressure = apiCapacity ? originTraffic / apiCapacity : 4;

  const reads = dynamicRequests * workload.readRatio;
  const writes = dynamicRequests - reads;
  const cacheHits = architecture.cache ? reads * architecture.cacheHitRate : 0;
  const databaseReads = reads - cacheHits;
  const primaryReads = architecture.replicas ? databaseReads * 0.12 : databaseReads;
  const replicaReads = architecture.replicas ? databaseReads - primaryReads : 0;
  const effectivePrimaryCapacity = architecture.databaseCapacity * architecture.shards;
  const primaryPressure = (writes + primaryReads) / effectivePrimaryCapacity;
  const replicaPressure = architecture.replicas
    ? (replicaReads / architecture.replicas) / architecture.replicaCapacity
    : 0;
  const databasePressure = Math.max(primaryPressure, replicaPressure);

  const synchronousWork = architecture.queue
    ? 18
    : workload.expensiveWorkShare * workload.expensiveWorkMs * architecture.syncWorkMultiplier;
  const regionalFactor = architecture.originRegions > 1 ? 0.62 : 1;
  const edgeDistance = architecture.cdn ? 24 : 165 * workload.geographicFactor * regionalFactor;
  const transferFactor = architecture.compressionRatio;
  const geographicPenalty = workload.staticShare * edgeDistance * transferFactor;
  const pressure = Math.max(apiPressure, databasePressure);
  const queueingPenalty = pressure <= 0.7
    ? pressure * 12
    : pressure <= 1
      ? 10 + ((pressure - 0.7) / 0.3) ** 2 * 520
      : 530 + (pressure - 1) * 1100;
  const p50 = 34 + synchronousWork + geographicPenalty + queueingPenalty;
  const p95 = p50 * (1.7 + Math.min(pressure, 1.5) * 0.12);
  const p99 = p95 * (1.24 + Math.min(pressure, 1.5) * 0.08);

  let errorRate = pressure <= 0.9
    ? 0.08
    : pressure <= 1
      ? 0.08 + (pressure - 0.9) * 18
      : 1.88 + (pressure - 1) * 22;
  if (architecture.failedApiCount && !architecture.loadBalancer) {
    errorRate += (architecture.failedApiCount / architecture.apiInstances) * 100;
  }
  errorRate = clamp(errorRate, 0.08, 42);

  const expensiveJobs = dynamicRequests * workload.expensiveWorkShare;
  const workerCapacity = architecture.workers * architecture.workerCapacity;
  const queueDepth = architecture.queue ? Math.max(0, (expensiveJobs - workerCapacity) * 6) : 0;
  const throughput = workload.requestsPerSecond * (1 - errorRate / 100);
  const dbConnections = Math.min(architecture.connectionLimit, Math.ceil((databaseReads + writes) / 4.2));
  const bandwidth = (originTraffic * architecture.compressionRatio * 0.085) / 1024;
  const replicationLag = architecture.replicas ? 180 + Math.round(replicaPressure * 420) : 0;

  return {
    requestsPerSecond: workload.requestsPerSecond,
    apiUtilization: round(apiPressure * 100, 1),
    primaryUtilization: round(primaryPressure * 100, 1),
    replicaUtilization: round(replicaPressure * 100, 1),
    databaseUtilization: round(databasePressure * 100, 1),
    cacheHitRate: architecture.cache ? round(architecture.cacheHitRate * 100, 0) : 0,
    cdnHitRate: architecture.cdn ? round(architecture.cdnHitRate * 100, 0) : 0,
    originTraffic: round(originTraffic, 0),
    dbConnections,
    connectionLimit: architecture.connectionLimit,
    p50: round(p50, 0),
    p95: round(p95, 0),
    p99: round(p99, 0),
    errorRate: round(errorRate, 2),
    throughput: round(throughput, 0),
    queueDepth: round(queueDepth, 0),
    edgeLatency: round(edgeDistance * transferFactor, 0),
    bandwidthGbps: round(bandwidth, 2),
    replicationLag,
    availability: architecture.loadBalancer && onlineApiInstances > 0 ? 99.99 : errorRate < 1 ? 99.9 : 100 - errorRate,
    onlineApiInstances,
    bottleneck: identifyBottleneck({
      workload,
      architecture,
      apiPressure,
      databasePressure,
      synchronousWork,
    }),
  };
}

export function identifyBottleneck({ workload, architecture, apiPressure, databasePressure, synchronousWork }) {
  if (!architecture.cdn && workload.geographicFactor > 1.4 && workload.staticShare > 0.3) return "DISTANCE / ORIGIN";
  if (!architecture.queue && synchronousWork > 120) return "SYNCHRONOUS WORK";
  if (apiPressure >= 0.9 && apiPressure >= databasePressure) return "API TIER";
  if (databasePressure >= 0.9) return architecture.replicas ? "READ CAPACITY" : "DATABASE";
  return "HEALTHY";
}

export function metricTone(key, metrics) {
  if (key === "errorRate") return metrics.errorRate >= 2 ? "bad" : metrics.errorRate >= 0.5 ? "warn" : "good";
  if (["apiUtil", "dbUtil", "primaryUtil", "replicaUtil"].includes(key)) {
    const values = { apiUtil: metrics.apiUtilization, dbUtil: metrics.databaseUtilization, primaryUtil: metrics.primaryUtilization, replicaUtil: metrics.replicaUtilization };
    return values[key] >= 90 ? "bad" : values[key] >= 72 ? "warn" : "good";
  }
  if (key === "p95" || key === "p99") return metrics[key] >= 700 ? "bad" : metrics[key] >= 250 ? "warn" : "good";
  if (key === "queueDepth") return metrics.queueDepth > 2000 ? "bad" : metrics.queueDepth > 0 ? "warn" : "good";
  if (["cacheHit", "cdnHit", "availability"].includes(key)) return "good";
  return "";
}

export function metricDisplay(key, metrics) {
  const definitions = {
    traffic: ["TRAFFIC", `${metrics.requestsPerSecond.toLocaleString()} req/s`],
    p50: ["P50 LATENCY", `${metrics.p50} ms`],
    p95: ["P95 LATENCY", `${metrics.p95} ms`],
    p99: ["P99 LATENCY", `${metrics.p99} ms`],
    errorRate: ["ERROR RATE", `${metrics.errorRate.toFixed(2)}%`],
    apiUtil: ["API UTILISATION", `${metrics.apiUtilization.toFixed(1)}%`],
    dbUtil: ["DB UTILISATION", `${metrics.databaseUtilization.toFixed(1)}%`],
    primaryUtil: ["PRIMARY LOAD", `${metrics.primaryUtilization.toFixed(1)}%`],
    replicaUtil: ["REPLICA LOAD", `${metrics.replicaUtilization.toFixed(1)}%`],
    dbConnections: ["DB CONNECTIONS", `${metrics.dbConnections} / ${metrics.connectionLimit}`],
    cacheHit: ["CACHE HIT RATE", `${metrics.cacheHitRate}%`],
    cdnHit: ["EDGE HIT RATE", `${metrics.cdnHitRate}%`],
    queueDepth: ["QUEUE DEPTH", metrics.queueDepth.toLocaleString()],
    throughput: ["THROUGHPUT", `${metrics.throughput.toLocaleString()} req/s`],
    originTraffic: ["ORIGIN TRAFFIC", `${metrics.originTraffic.toLocaleString()} req/s`],
    edgeLatency: ["STATIC RTT", `${metrics.edgeLatency} ms`],
    bandwidth: ["ORIGIN BANDWIDTH", `${metrics.bandwidthGbps.toFixed(2)} Gb/s`],
    replicationLag: ["REPLICATION LAG", metrics.replicationLag ? `${metrics.replicationLag} ms` : "—"],
    availability: ["AVAILABILITY", `${metrics.availability.toFixed(2)}%`],
  };
  return definitions[key];
}
