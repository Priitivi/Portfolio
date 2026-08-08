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
