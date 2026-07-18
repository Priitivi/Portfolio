import test from "node:test";
import assert from "node:assert/strict";
import { parsePlatform, resolveHorizontal, resolveVertical } from "../src/lab/deceptive-trial/engine/collision.js";
import { achievements, evaluateAchievements, loadSave, parseSave, persistSave } from "../src/lab/deceptive-trial/engine/progress.js";
import { levels, loadLevel, parseLevel } from "../src/lab/deceptive-trial/engine/levels.js";
import { PHYSICS, SHAKE_MAX } from "../src/lab/deceptive-trial/engine/constants.js";
import { activateCheckpoint, armHazard, canFireTrigger, getJumpApexHeight, getJumpAscentTime, getJumpRange, isVictory, mergeShakeImpact, nextUnlockedLevel, shouldBreakBridge } from "../src/lab/deceptive-trial/engine/rules.js";
import { getMusicProfile } from "../src/lab/deceptive-trial/engine/AudioEngine.js";

test("campaign ships twelve valid, unique, data-driven levels", () => {
  assert.equal(levels.length, 12);
  assert.equal(new Set(levels.map((level) => level.id)).size, 12);
  levels.forEach((level, index) => {
    const parsed = parseLevel(level);
    assert.equal(parsed.number, index + 1);
    assert.ok(parsed.platforms.length >= 4);
    assert.ok(parsed.goal);
    assert.ok(parsed.checkpoints.length >= 1);
    assert.equal(parsed.secrets.length, 1);
    assert.notEqual(loadLevel(index), parsed, "load returns an isolated runtime clone");
  });
});

test("level parsing rejects malformed geometry and duplicate entity ids", () => {
  assert.throws(() => parsePlatform({ x: 0, y: 0, w: 0, h: 10 }), /Invalid platform/);
  const duplicate = structuredClone(levels[0]);
  duplicate.signs[0].id = duplicate.checkpoints[0].id;
  assert.throws(() => parseLevel(duplicate), /Duplicate entity id/);
  assert.throws(() => loadLevel(99), /Unknown level/);
});

test("horizontal and vertical collision resolve without tunnelling through solids", () => {
  const wall = { x: 100, y: 0, w: 30, h: 200, solid: true };
  const player = { x: 90, y: 60, w: 20, h: 30, vx: 200, vy: 0 };
  resolveHorizontal(player, [wall]);
  assert.equal(player.x, 80);
  assert.equal(player.vx, 0);

  const floor = { x: 0, y: 100, w: 200, h: 20, solid: true };
  Object.assign(player, { x: 20, y: 85, w: 20, h: 30, vy: 300 });
  const landed = resolveVertical(player, [floor], 65, 1);
  assert.equal(landed, floor);
  assert.equal(player.y, 70);
  assert.equal(player.vy, 0);
});

test("upside-down collision lands on the underside of ceiling platforms", () => {
  const ceiling = { x: 0, y: 80, w: 200, h: 30, solid: true };
  const player = { x: 30, y: 95, w: 20, h: 30, vy: -240 };
  const landed = resolveVertical(player, [ceiling], 120, -1);
  assert.equal(landed, ceiling);
  assert.equal(player.y, 110);
});

test("checkpoint activation ignores fakes and produces a stable respawn", () => {
  const real = { id: "cp", x: 400, y: 560, w: 34, h: 80, fake: false };
  assert.deepEqual(activateCheckpoint(real), { checkpointId: "cp", respawnPoint: { x: 446, y: 594 } });
  assert.equal(real.activated, true);
  assert.equal(activateCheckpoint(real), null);
  assert.equal(activateCheckpoint({ ...real, id: "fake", activated: false, fake: true }), null);
});

test("trigger and victory rules are deterministic and expectation-aware", () => {
  const player = { x: 20, y: 20, w: 20, h: 20 };
  const trigger = { id: "cue", x: 10, y: 10, w: 40, h: 40, active: true, once: true };
  assert.equal(canFireTrigger(trigger, new Set(), player), true);
  assert.equal(canFireTrigger(trigger, new Set(["cue"]), player), false);
  assert.equal(canFireTrigger({ ...trigger, once: false }, new Set(["cue"]), player), true);
  assert.equal(shouldBreakBridge(339), false);
  assert.equal(shouldBreakBridge(-340), true);
  assert.equal(isVictory(player, { x: 15, y: 15, w: 50, h: 50, active: true }), true);
  assert.equal(isVictory(player, { x: 15, y: 15, w: 50, h: 50, active: false }), false);
  assert.equal(nextUnlockedLevel(3, 11), 11);
});

test("Level 5 has a physically reachable route, readable boulder tell, checkpoint, and exit", () => {
  const level = loadLevel(4);
  const apex = getJumpApexHeight();
  const elevatedPlatforms = level.platforms.filter((platform) => platform.type === "stone" && platform.y < 640);
  const groundGaps = level.hazards.filter((hazard) => hazard.type === "spikes").map((hazard) => hazard.w);
  const trigger = level.triggers.find((item) => item.id === "camera-cue");
  const boulder = level.hazards.find((hazard) => hazard.id === "rolling-ruin");
  const finalGround = level.platforms.find((platform) => platform.type === "ground" && platform.x <= level.goal.x && platform.x + platform.w >= level.goal.x + level.goal.w);

  assert.ok(elevatedPlatforms.every((platform) => 640 - platform.y <= apex), "every elevated platform fits below the jump apex");
  assert.ok(groundGaps.every((gap) => gap < getJumpRange(PHYSICS.walkSpeed)), "every required ground gap is clearable without run speed");
  assert.equal(trigger.target, boulder.id);
  const armedBoulder = structuredClone(boulder);
  assert.equal(armHazard(armedBoulder, trigger), .28);
  assert.equal(armedBoulder.dormant, false);
  assert.equal(armedBoulder.warningDuration, .28);
  assert.equal(boulder.vx, -430, "the intended boulder speed remains unchanged");
  assert.ok(boulder.activationDelay >= .25, "the boulder telegraphs before moving");
  const triggerContactX = trigger.x - PHYSICS.playerWidth;
  const closingGap = boulder.x - (triggerContactX + PHYSICS.playerWidth);
  const reactionWindow = boulder.activationDelay + closingGap / (PHYSICS.runSpeed + Math.abs(boulder.vx));
  const clearanceTime = getJumpAscentTime(640 - boulder.rollY);
  assert.ok(reactionWindow > clearanceTime + .1, "the boulder tell leaves a readable jump window even at run speed");
  assert.ok(level.checkpoints[0].x < trigger.x && trigger.x < boulder.x, "checkpoint, cue, and boulder occur in a recoverable order");
  assert.equal(level.platforms.some((platform) => platform.type === "moving"), false, "Level 5 has no moving-platform dependency");
  assert.ok(finalGround, "the exit sits on a continuous final ground segment");
  assert.ok(level.goal.x > level.hazards.at(-1).x + level.hazards.at(-1).w, "the exit remains reachable beyond the final hazard");
});

test("shake impacts are differentiated and repeated events remain clamped", () => {
  const landing = mergeShakeImpact(0, 0, "landing");
  const checkpoint = mergeShakeImpact(0, 0, "checkpoint");
  const death = mergeShakeImpact(0, 0, "death");
  const major = mergeShakeImpact(0, 0, "major");
  assert.ok(landing.shake < checkpoint.shake);
  assert.ok(checkpoint.shake < death.shake);
  assert.ok(death.shake < major.shake);
  assert.ok(death.shake / death.decay <= .21, "death shake decays in roughly 200 ms");
  assert.ok(major.shake / major.decay <= .21, "major shake remains brief despite its larger amplitude");
  let repeated = major;
  for (let index = 0; index < 20; index += 1) repeated = mergeShakeImpact(repeated.shake, repeated.decay, "major");
  assert.equal(repeated.shake, SHAKE_MAX);
});

test("procedural music escalates across four campaign acts without changing mid-act", () => {
  const acts = [0, 3, 6, 9].map(getMusicProfile);
  assert.equal(getMusicProfile(0), getMusicProfile(2));
  assert.equal(getMusicProfile(9), getMusicProfile(11));
  for (let index = 1; index < acts.length; index += 1) {
    assert.ok(acts[index].tempo > acts[index - 1].tempo);
    assert.ok(acts[index].density > acts[index - 1].density);
    assert.ok(acts[index].bass > acts[index - 1].bass);
  }
});

test("save parsing recovers from corrupt data and retains accessibility defaults", () => {
  assert.equal(parseSave("{bad").currentLevel, 0);
  assert.deepEqual(parseSave("[]").completedLevels, []);
  const restored = parseSave(JSON.stringify({ deaths: 7, settings: { reducedShake: true } }));
  assert.equal(restored.deaths, 7);
  assert.equal(restored.settings.reducedShake, true);
  assert.ok(restored.settings.bindings.jump.includes("Space"));
});

test("save persistence reads, writes, and falls back safely", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  const save = parseSave({ deaths: 4, jumps: 18 });
  assert.equal(persistSave(save, storage), true);
  assert.equal(loadSave(storage).deaths, 4);
  assert.equal(loadSave({ getItem: () => { throw new Error("blocked"); } }).deaths, 0);
});

test("achievement evaluation covers milestone, secret, statistics, and victory conditions", () => {
  assert.ok(achievements.length >= 30);
  assert.equal(new Set(achievements.map((achievement) => achievement.id)).size, achievements.length);
  const save = parseSave({
    deaths: 100, jumps: 250, runTime: 65, collected: 10,
    completedLevels: Array.from({ length: 12 }, (_, index) => index),
    secrets: Array.from({ length: 12 }, (_, index) => `secret-${index}`),
    signsRead: ["a", "b", "c", "d", "e"], bestTimes: { 0: 19 },
  });
  const unlocked = evaluateAchievements(save, { clearedWithoutDeath: true, developerRoom: true, fakeExit: true, airtime: 2.2 });
  ["hundred-deaths", "all-levels", "all-secrets", "jumper", "runner", "collector", "speedrunner", "developer-room", "fake-exit", "airtime"].forEach((id) => assert.ok(unlocked.includes(id), id));
});
