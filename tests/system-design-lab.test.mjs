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
import { anchorPoint, connectionGeometry, localBounds, pathData } from "../src/lab/system-design/components/diagramGeometry.js";

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
