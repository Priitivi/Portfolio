import test from "node:test";
import assert from "node:assert/strict";
import { parsePlatform, resolveHorizontal, resolveVertical } from "../src/lab/deceptive-trial/engine/collision.js";
import { achievements, evaluateAchievements, loadSave, parseSave, persistSave } from "../src/lab/deceptive-trial/engine/progress.js";
import { levels, loadLevel, parseLevel } from "../src/lab/deceptive-trial/engine/levels.js";
import { PHYSICS, SHAKE_MAX } from "../src/lab/deceptive-trial/engine/constants.js";
import { activateCheckpoint, armHazard, canFireTrigger, getJumpApexHeight, getJumpAscentTime, getJumpRange, isVictory, mergeShakeImpact, nextUnlockedLevel, shouldBreakBridge } from "../src/lab/deceptive-trial/engine/rules.js";
import { getMusicProfile } from "../src/lab/deceptive-trial/engine/AudioEngine.js";
import GameEngine from "../src/lab/deceptive-trial/engine/GameEngine.js";

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

test("opposing wind always leaves enough authority to walk toward the exit", () => {
  const opposingWinds = levels
    .flatMap((level) => level.triggers)
    .filter((trigger) => trigger.action === "wind" && trigger.value < 0);

  assert.ok(opposingWinds.length > 0);
  opposingWinds.forEach((trigger) => {
    assert.ok(Math.abs(trigger.value) < PHYSICS.walkSpeed, `${trigger.id} should not overpower rightward walking`);
  });
});

test("a deterministic fixed-step playthrough can complete every campaign level", () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  globalThis.window = {
    AudioContext: undefined,
    webkitAudioContext: undefined,
    matchMedia: () => ({ matches: true }),
    setInterval: () => 0,
    clearInterval: () => {},
  };
  globalThis.document = {
    hidden: false,
    visibilityState: "visible",
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  class SimulationInput {
    constructor() {
      this.down = new Set();
      this.pressed = new Set();
      this.enabled = true;
    }

    set(action, active) {
      if (active) {
        if (!this.down.has(action)) this.pressed.add(action);
        this.down.add(action);
      } else {
        this.down.delete(action);
      }
    }

    isDown(action) { return this.down.has(action); }
    consumePressed(action) {
      const value = this.pressed.has(action);
      this.pressed.delete(action);
      return value;
    }
    endFrame() { this.pressed.clear(); }
    clear() { this.down.clear(); this.pressed.clear(); }
  }

  const settings = {
    reducedShake: true,
    reducedFlashing: true,
    colourblind: false,
    masterVolume: 0,
    musicVolume: 0,
    effectsVolume: 0,
  };
  const canvas = { getContext: () => ({}) };
  const results = [];

  try {
    levels.forEach((level, levelIndex) => {
      const input = new SimulationInput();
      const engine = new GameEngine({ canvas, input, settings, levelIndex });
      let jumpHold = 0;
      const deathPositions = [];
      const jumpPositions = [];
      const recentStates = [];
      let previousDeaths = 0;

      for (let frame = 0; frame < 120 * 120 && !engine.completed; frame += 1) {
        const dt = 1 / 120;
        const fragileBridge = (levelIndex === 3 && engine.player.x < 1050)
          || (levelIndex === 11 && engine.player.x < 930);
        input.set("run", !fragileBridge);
        input.set("right", !engine.controlsReversed);
        input.set("left", engine.controlsReversed);

        const boulderThreat = engine.hazards.some((hazard) => {
          if (!hazard.active || hazard.dormant || hazard.type !== "boulder") return false;
          const distance = hazard.x - (engine.player.x + engine.player.w);
          return distance > -40 && distance < 180 && hazard.warningTimer < .2;
        });
        const hazardThreat = boulderThreat || engine.hazards.some((hazard) => {
          if (!hazard.active || hazard.dormant) return false;
          const distance = hazard.x - (engine.player.x + engine.player.w);
          if (hazard.type === "boulder") return false;
          if (hazard.type === "fallingSpike") return false;
          const onElevatedSurface = engine.player.y + engine.player.h < 600;
          if (onElevatedSurface && hazard.w > 200) return false;
          const approachDistance = onElevatedSurface ? 140 : hazard.w > 200 ? 100 : 50;
          const remainingHazard = hazard.x + hazard.w - engine.player.x;
          return remainingHazard > engine.player.w && distance < approachDistance;
        });
        const platformStepThreat = engine.platforms.some((platform) => {
          if (!platform.active || !platform.solid) return false;
          const distance = platform.x - (engine.player.x + engine.player.w);
          const rise = engine.player.y + engine.player.h - platform.y;
          const approachDistance = (fragileBridge ? PHYSICS.walkSpeed : PHYSICS.runSpeed) * getJumpAscentTime(rise) + 24;
          return distance >= 0 && distance < approachDistance && rise > 10 && rise < getJumpApexHeight();
        });
        const enemyThreat = engine.enemies.some((enemy) => (
          enemy.active
          && enemy.x - (engine.player.x + engine.player.w) > -20
          && enemy.x - (engine.player.x + engine.player.w) < 90
        ));
        const platformEdgeThreat = engine.platforms.some((platform) => {
          const playerBottom = engine.player.y + engine.player.h;
          const remainingPlatform = platform.x + platform.w - (engine.player.x + engine.player.w);
          return platform.active
            && platform.solid
            && platform.y < 600
            && Math.abs(playerBottom - platform.y) < 2
            && engine.player.x + engine.player.w > platform.x
            && remainingPlatform > 0
            && remainingPlatform < 45;
        });
        const jumpThreat = hazardThreat || platformStepThreat || enemyThreat || platformEdgeThreat;

        if (jumpHold > 0) {
          jumpHold -= dt;
          if (jumpHold <= 0) input.set("jump", false);
        } else if (engine.player.onGround && engine.dying <= 0 && jumpThreat) {
          input.set("jump", true);
          jumpPositions.push(Math.round(engine.player.x));
          jumpHold = .5;
        }

        engine.update(dt);
        input.endFrame();
        if (engine.deathsThisLevel === 0 && frame % 8 === 0) {
          recentStates.push(`${Math.round(engine.player.x)}/${Math.round(engine.player.y)}/${Math.round(engine.player.vy)}/${engine.wind}`);
          if (recentStates.length > 16) recentStates.shift();
        }
        if (engine.deathsThisLevel > previousDeaths) {
          deathPositions.push(`${Math.round(engine.player.x)}:${Math.round(engine.player.y)}`);
          previousDeaths = engine.deathsThisLevel;
        }
      }

      results.push({ level: level.number, completed: engine.completed, deaths: engine.deathsThisLevel, x: Math.round(engine.player.x) });
      assert.equal(engine.completed, true, `Level ${level.number} stalled near x=${Math.round(engine.player.x)} after ${engine.deathsThisLevel} deaths; jumps ${jumpPositions.slice(0, 12).join(", ")}; deaths ${deathPositions.slice(0, 8).join(", ")}; trace ${recentStates.join(", ")}`);
    });
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  }

  assert.equal(results.length, 12);
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
