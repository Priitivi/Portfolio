import test from "node:test";
import assert from "node:assert/strict";
import { experiments } from "../src/lab/experiments.js";
import {
  cacheResources,
  chooseServer,
  deliverySummary,
  replicaDelta,
  resolveCacheRequest,
} from "../src/lab/system-design/simulationModel.js";
import { designChallenge } from "../src/lab/system-design/data/designChallenges.js";
import { heroConnections, heroRequestSequence } from "../src/lab/system-design/data/heroTopology.js";
import { anchorPoint, connectionGeometry, localBounds, pathData } from "../src/lab/system-design/components/diagramGeometry.js";
import { scaleStages, recommendedDecision } from "../src/lab/system-design/learning/scaleStages.js";
import { mergeArchitecture, simulateScale } from "../src/lab/system-design/learning/scalingModel.js";
import { buildScaleConnections, buildScaleTraffic } from "../src/lab/system-design/learning/scaleTopology.js";
import { aiStages, recommendedAiDecision } from "../src/lab/system-design/learning/ai/aiStages.js";
import { mergeAiArchitecture, mergeAiWorkload, simulateAiInference } from "../src/lab/system-design/learning/ai/aiInferenceModel.js";
import { buildAiConnections, buildAiTraffic } from "../src/lab/system-design/learning/ai/aiTopology.js";

test("cache simulation distinguishes cold, warm, and bypassed requests", () => {
  const cache = new Set();
  const resourceId = cacheResources[0].id;
  assert.deepEqual(resolveCacheRequest({ cache, resourceId }), { outcome: "miss", latency: 146, databaseQueries: 1 });
  cache.add(resourceId);
  assert.deepEqual(resolveCacheRequest({ cache, resourceId }), { outcome: "hit", latency: 18, databaseQueries: 0 });
  assert.equal(resolveCacheRequest({ cache, resourceId, enabled: false }).outcome, "bypass");
});

test("round robin skips offline instances and least connections chooses available capacity", () => {
  const servers = [
    { id: 1, online: true, active: 3, handled: 8 },
    { id: 2, online: false, active: 0, handled: 2 },
    { id: 3, online: true, active: 1, handled: 5 },
  ];
  assert.equal(chooseServer(servers, "round-robin", 1).id, 3);
  assert.equal(chooseServer(servers, "least-connections").id, 3);
  assert.equal(chooseServer(servers.map((server) => ({ ...server, online: false })), "round-robin"), null);
});

test("pub/sub summary records online deliveries and missed subscribers", () => {
  assert.deepEqual(deliverySummary([{ online: true }, { online: false }, { online: true }]), { delivered: 2, failed: 1 });
});

test("replica reconciliation reports drift until desired running count is restored", () => {
  const pods = [{ status: "running" }, { status: "failed" }, { status: "running" }];
  assert.deepEqual(replicaDelta(3, pods), { running: 2, missing: 1, healthy: false });
  pods[1].status = "running";
  assert.equal(replicaDelta(3, pods).healthy, true);
});

test("the Lab catalogue exposes experiment 009 and challenge choices are complete", () => {
  const experiment = experiments.find((item) => item.id === "system-design");
  assert.equal(experiment.route, "/lab/system-design");
  assert.equal(experiment.experimentNumber, "009");
  assert.equal(designChallenge.stages.length, 3);
  assert.ok(designChallenge.stages.every((stage) => stage.options.length >= 3 && stage.options.some((option) => option.recommended)));
});

test("diagram bounds convert viewport rectangles into one local coordinate space", () => {
  const bounds = localBounds({ left: 310, top: 225, width: 120, height: 60 }, { left: 250, top: 175 });
  assert.deepEqual(bounds, { left: 60, top: 50, right: 180, bottom: 110, width: 120, height: 60, cx: 120, cy: 80 });
  assert.deepEqual(anchorPoint(bounds, "right"), { x: 180, y: 80 });
});

test("connector endpoints are the exact borders of their source and destination nodes", () => {
  const nodes = {
    client: { left: 100, top: 20, right: 220, bottom: 80, cx: 160, cy: 50 },
    api: { left: 100, top: 150, right: 220, bottom: 210, cx: 160, cy: 180 },
  };
  const geometry = connectionGeometry({ id: "client-api", from: "client", to: "api", fromAnchor: "bottom", toAnchor: "top" }, nodes, { width: 320, height: 240 });
  assert.deepEqual(geometry.start, { x: 160, y: 80 });
  assert.deepEqual(geometry.end, { x: 160, y: 150 });
  assert.equal(geometry.d, "M160.00 80.00 L160.00 150.00");
  assert.equal(geometry.reverseD, "M160.00 150.00 L160.00 80.00");
});

test("fan-out routes and packet routes share the same generated point list", () => {
  const nodes = {
    broker: { left: 240, top: 50, right: 360, bottom: 110, cx: 300, cy: 80 },
    email: { left: 40, top: 240, right: 160, bottom: 300, cx: 100, cy: 270 },
  };
  const connection = { id: "broker-email", from: "broker", to: "email", route: "responsive-fanout", fromAnchor: "bottom", toAnchor: "top" };
  const desktop = connectionGeometry(connection, nodes, { width: 600, height: 340 });
  assert.equal(desktop.points[0].y, nodes.broker.bottom);
  assert.equal(desktop.points.at(-1).y, nodes.email.top);
  assert.equal(desktop.d, pathData(desktop.points));
  assert.equal(desktop.reverseD, pathData([...desktop.points].reverse()));

  const mobile = connectionGeometry(connection, nodes, { width: 390, height: 340 });
  assert.equal(mobile.start.x, nodes.broker.right);
  assert.equal(mobile.end.x, nodes.email.right);
  assert.ok(mobile.points.some((point) => point.x === 372));
});

test("hero topology request and response form one continuous route over visible edges", () => {
  const connections = new Map(heroConnections.map((connection) => [connection.id, connection]));

  heroRequestSequence.forEach((step, index) => {
    const connection = connections.get(step.connectionId);
    assert.ok(connection, `${step.connectionId} is a rendered connector`);
    assert.equal(step.from, step.reverse ? connection.to : connection.from);
    assert.equal(step.to, step.reverse ? connection.from : connection.to);

    const next = heroRequestSequence[(index + 1) % heroRequestSequence.length];
    assert.equal(step.to, next.from, `step ${index + 1} joins step ${index + 2} without a jump`);
  });
});

test("the scaling model is deterministic for identical workload and architecture inputs", () => {
  const stage = scaleStages[2];
  const architecture = mergeArchitecture(stage.architecture);
  assert.deepEqual(
    simulateScale({ workload: stage.workload, architecture }),
    simulateScale({ workload: stage.workload, architecture }),
  );
});

test("capacity constraints move through API, database, distance, and synchronous work", () => {
  const bottlenecks = scaleStages.map((stage) => simulateScale({
    workload: stage.workload,
    architecture: mergeArchitecture(stage.architecture),
  }).bottleneck);

  assert.deepEqual(bottlenecks, [
    "HEALTHY",
    "API TIER",
    "DATABASE",
    "DATABASE",
    "DISTANCE / ORIGIN",
    "SYNCHRONOUS WORK",
    "HEALTHY",
  ]);
});

test("fit-for-purpose decisions improve the metric tied to each active constraint", () => {
  const comparisons = [
    [1, "apiUtilization"],
    [2, "databaseUtilization"],
    [3, "databaseUtilization"],
    [4, "originTraffic"],
    [5, "p95"],
  ];

  comparisons.forEach(([stageIndex, metric]) => {
    const stage = scaleStages[stageIndex];
    const before = simulateScale({ workload: stage.workload, architecture: mergeArchitecture(stage.architecture) });
    const after = simulateScale({ workload: stage.workload, architecture: mergeArchitecture(stage.architecture, recommendedDecision(stage).patch) });
    assert.ok(after[metric] < before[metric], `${stage.id} lowers ${metric}`);
  });
});

test("alternative decisions have consistent consequences instead of no-op feedback", () => {
  const stage = scaleStages[2];
  const baseline = mergeArchitecture(stage.architecture);
  const moreApi = stage.decisions.find((decision) => decision.id === "more-api");
  const cache = recommendedDecision(stage);
  const before = simulateScale({ workload: stage.workload, architecture: baseline });
  const apiResult = simulateScale({ workload: stage.workload, architecture: mergeArchitecture(stage.architecture, moreApi.patch) });
  const cacheResult = simulateScale({ workload: stage.workload, architecture: mergeArchitecture(stage.architecture, cache.patch) });

  assert.ok(apiResult.apiUtilization < before.apiUtilization);
  assert.equal(apiResult.databaseUtilization, before.databaseUtilization);
  assert.ok(cacheResult.databaseUtilization < before.databaseUtilization);
});

test("guided progression is ordered, complete, and offers one explicit best fit per decision stage", () => {
  assert.equal(scaleStages.length, 7);
  assert.deepEqual(scaleStages.map((stage) => stage.id), ["simple", "api-bottleneck", "database-bottleneck", "read-scaling", "global-static", "asynchronous-work", "failure"]);
  assert.ok(scaleStages.every((stage, index) => index === 0 || stage.users >= scaleStages[index - 1].users));
  assert.ok(scaleStages.filter((stage) => stage.decisions).every((stage) => stage.decisions.filter((decision) => decision.recommended).length === 1));
});

test("representative traffic traces only use visible edges and remain continuous within each trace", () => {
  const architecture = mergeArchitecture(scaleStages.at(-1).architecture);
  const connections = buildScaleConnections(architecture);
  const byId = new Map(connections.map((connection) => [connection.id, connection]));
  const traces = buildScaleTraffic(architecture);

  traces.forEach((trace) => trace.steps.forEach((step, index) => {
    const connection = byId.get(step.connectionId);
    assert.ok(connection, `${step.connectionId} is visible`);
    if (index === trace.steps.length - 1) return;
    const destination = step.reverse ? connection.from : connection.to;
    const next = trace.steps[index + 1];
    const nextConnection = byId.get(next.connectionId);
    const nextSource = next.reverse ? nextConnection.to : nextConnection.from;
    assert.equal(destination, nextSource, `${trace.id} has no packet jump between segments`);
  }));
});

test("one failed API instance raises utilisation while health-aware routing preserves service", () => {
  const stage = scaleStages.at(-1);
  const healthy = simulateScale({ workload: stage.workload, architecture: mergeArchitecture(stage.architecture) });
  const degraded = simulateScale({ workload: stage.workload, architecture: mergeArchitecture(stage.architecture, { failedApiCount: 1 }) });
  assert.ok(degraded.apiUtilization > healthy.apiUtilization);
  assert.ok(degraded.errorRate < 0.2);
  assert.ok(degraded.availability >= 99.99);
});

test("AI inference calculations are deterministic and expose an ordered eleven-stage journey", () => {
  const stage = aiStages[5];
  const input = { workload: mergeAiWorkload(stage.workload), architecture: mergeAiArchitecture(stage.architecture) };
  assert.deepEqual(simulateAiInference(input), simulateAiInference(input));
  assert.equal(aiStages.length, 11);
  assert.deepEqual(aiStages.map((item) => item.id), ["one-worker", "traffic", "queue", "workers", "batching", "kv-cache", "streaming", "prefix-cache", "autoscaling", "routing", "failure"]);
  assert.ok(aiStages.filter((item) => item.decisions).every((item) => item.decisions.filter((decision) => decision.recommended).length === 1));
});

test("arrival beyond inference capacity grows an explicit queue", () => {
  const architecture = mergeAiArchitecture({ workers: 1, queue: true });
  const low = simulateAiInference({ workload: mergeAiWorkload({ requestRate: 2, promptTokens: 512, outputTokens: 128 }), architecture });
  const high = simulateAiInference({ workload: mergeAiWorkload({ requestRate: 14, concurrency: 24, promptTokens: 512, outputTokens: 128 }), architecture });
  assert.equal(low.queueDepth, 0);
  assert.ok(high.queueDepth > low.queueDepth);
  assert.ok(high.queueWait > low.queueWait);
});

test("ready workers increase service capacity and recover a queued spike", () => {
  const workload = mergeAiWorkload({ requestRate: 120, concurrency: 180, promptTokens: 512, outputTokens: 128, backlog: 180 });
  const four = simulateAiInference({ workload, architecture: mergeAiArchitecture({ workers: 4, queue: true, scheduler: true, batching: "continuous", batchSize: 12 }) });
  const ten = simulateAiInference({ workload: { ...workload, backlog: 0 }, architecture: mergeAiArchitecture({ workers: 10, queue: true, scheduler: true, batching: "continuous", batchSize: 12 }) });
  assert.ok(ten.serviceCapacity > four.serviceCapacity);
  assert.ok(ten.queueDepth < four.queueDepth);
  assert.ok(ten.ttft < four.ttft);
});

test("longer prompts increase prefill work and time to first token", () => {
  const architecture = mergeAiArchitecture({ workers: 4, queue: true, batching: "continuous", batchSize: 12 });
  const shortPrompt = simulateAiInference({ workload: mergeAiWorkload({ requestRate: 4, concurrency: 8, promptTokens: 128 }), architecture });
  const longPrompt = simulateAiInference({ workload: mergeAiWorkload({ requestRate: 4, concurrency: 8, promptTokens: 8192 }), architecture });
  assert.ok(longPrompt.prefillMs > shortPrompt.prefillMs);
  assert.ok(longPrompt.ttft > shortPrompt.ttft);
});

test("concurrent long sequences increase KV-cache and GPU-memory pressure", () => {
  const architecture = mergeAiArchitecture({ workers: 4, batching: "continuous", batchSize: 16, kvCacheVisible: true });
  const low = simulateAiInference({ workload: mergeAiWorkload({ requestRate: 4, concurrency: 4, promptTokens: 4096, outputTokens: 256 }), architecture });
  const high = simulateAiInference({ workload: mergeAiWorkload({ requestRate: 4, concurrency: 64, promptTokens: 4096, outputTokens: 256 }), architecture });
  assert.ok(high.kvCacheUtilization > low.kvCacheUtilization);
  assert.ok(high.gpuMemoryUtilization > low.gpuMemoryUtilization);
});

test("continuous batching improves normalized capacity, occupancy, and useful throughput", () => {
  const workload = mergeAiWorkload({ requestRate: 20, concurrency: 48, promptTokens: 512, outputTokens: 160, backlog: 24 });
  const sequential = simulateAiInference({ workload, architecture: mergeAiArchitecture({ workers: 3, queue: true, scheduler: true, batching: "none", batchSize: 1 }) });
  const continuous = simulateAiInference({ workload, architecture: mergeAiArchitecture({ workers: 3, queue: true, scheduler: true, batching: "continuous", batchSize: 12 }) });
  assert.ok(continuous.serviceCapacity > sequential.serviceCapacity);
  assert.ok(continuous.gpuUtilization > sequential.gpuUtilization);
  assert.ok(continuous.throughput > sequential.throughput);
});

test("worker failure removes available capacity and fallback changes availability and quality", () => {
  const stage = aiStages.at(-1);
  const healthy = simulateAiInference({ workload: stage.workload, architecture: mergeAiArchitecture(stage.architecture) });
  const failed = simulateAiInference({ workload: stage.workload, architecture: mergeAiArchitecture(stage.architecture, { failedWorkers: 1 }) });
  const fallback = simulateAiInference({ workload: stage.workload, architecture: mergeAiArchitecture(stage.architecture, { failedWorkers: 1, fallbackEnabled: true }) });
  assert.ok(failed.serviceCapacity < healthy.serviceCapacity);
  assert.ok(failed.queueDepth > healthy.queueDepth);
  assert.ok(fallback.availability > failed.availability);
  assert.ok(fallback.queueDepth < failed.queueDepth);
  assert.ok(fallback.ttft < failed.ttft);
  assert.ok(fallback.costIndex < failed.costIndex);
  assert.ok(fallback.qualityProxy < failed.qualityProxy);
});

test("routing policies trade normalized quality for latency and cost consistently", () => {
  const stage = aiStages.find((item) => item.id === "routing");
  const large = simulateAiInference({ workload: stage.workload, architecture: mergeAiArchitecture(stage.architecture, { routingStrategy: "always-large" }) });
  const balanced = simulateAiInference({ workload: stage.workload, architecture: mergeAiArchitecture(stage.architecture, recommendedAiDecision(stage).patch) });
  const fast = simulateAiInference({ workload: stage.workload, architecture: mergeAiArchitecture(stage.architecture, { routingStrategy: "always-fast" }) });
  assert.ok(large.qualityProxy > balanced.qualityProxy && balanced.qualityProxy > fast.qualityProxy);
  assert.ok(large.costIndex > balanced.costIndex && balanced.costIndex > fast.costIndex);
  assert.ok(large.ttft > balanced.ttft && balanced.ttft > fast.ttft);
});

test("AI representative traffic stays on visible generated edges and joins continuously", () => {
  const architecture = mergeAiArchitecture(aiStages.at(-1).architecture);
  const connections = buildAiConnections(architecture);
  const byId = new Map(connections.map((connection) => [connection.id, connection]));
  buildAiTraffic(architecture).forEach((trace) => trace.steps.forEach((step, index) => {
    const connection = byId.get(step.connectionId);
    assert.ok(connection, `${step.connectionId} is visible`);
    if (index === trace.steps.length - 1) return;
    const destination = step.reverse ? connection.from : connection.to;
    const next = trace.steps[index + 1];
    const nextConnection = byId.get(next.connectionId);
    const nextSource = next.reverse ? nextConnection.to : nextConnection.from;
    assert.equal(destination, nextSource, `${trace.id} has no inter-segment packet jump`);
  }));
});

test("AI routing traces follow the selected model policy", () => {
  const stage = aiStages.find((item) => item.id === "routing");
  const tracesFor = (routingStrategy) => buildAiTraffic(mergeAiArchitecture(stage.architecture, { routingStrategy }));

  assert.deepEqual(tracesFor("always-fast").filter((trace) => trace.id.endsWith("request")).map((trace) => trace.id), ["fast-request"]);
  assert.deepEqual(tracesFor("always-large").filter((trace) => trace.id.endsWith("request")).map((trace) => trace.id), ["capable-request"]);
  assert.deepEqual(tracesFor("balanced").filter((trace) => trace.id.endsWith("request")).map((trace) => trace.id), ["fast-request", "capable-request"]);
  assert.ok(tracesFor("always-fast").every((trace) => trace.steps.every((step) => !step.connectionId.includes("capable"))));
});
