import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";
import {
  createPaperStoryStatus,
  getPaperMovement,
  isPointNearLandmark,
  paintCellKey,
  PAPER_GROUND_Y,
  paperLandmarks,
  screenToWorld,
  segmentYAtX,
} from "../src/lab/paint-surfer/paperWorld.js";
import { paintSoundtracks } from "../src/lab/paint-surfer/soundtracks.js";

test("maps WASD and arrow controls into consistent 2D actions", () => {
  assert.deepEqual(getPaperMovement(new Set(["KeyD", "KeyW", "ShiftLeft", "KeyJ"])), {
    horizontal: 1,
    jump: true,
    duck: false,
    sprint: true,
    dash: true,
  });
  assert.equal(getPaperMovement(new Set(["KeyA", "KeyD"])).horizontal, 0);
  assert.equal(getPaperMovement(new Set(["ArrowDown"])).duck, true);
});

test("keeps paint cells stable and converts screen drawing into world space", () => {
  assert.equal(paintCellKey(76, 152), paintCellKey(79, 149));
  assert.notEqual(paintCellKey(76, 152), paintCellKey(160, 152));
  assert.deepEqual(screenToWorld({ x: 200, y: 300 }, 500, 2, 400), { x: 600, y: PAPER_GROUND_Y - 50 });
});

test("samples walkable paint segments while rejecting vertical strokes", () => {
  assert.equal(segmentYAtX({ x: 0, y: 500 }, { x: 100, y: 550 }, 50), 525);
  assert.equal(segmentYAtX({ x: 0, y: 500 }, { x: 10, y: 550 }, 5), null);
  assert.equal(segmentYAtX({ x: 0, y: 500 }, { x: 100, y: 550 }, 140), null);
});

test("supports restoring paper landmarks in any order", () => {
  const initial = createPaperStoryStatus();
  assert.equal(initial.progress, 0);
  assert.equal(initial.complete, false);

  const lastFirst = createPaperStoryStatus([0, 0, 0, paperLandmarks[3].goal]);
  assert.equal(lastFirst.landmarks[3].complete, true);
  assert.equal(lastFirst.landmarks[0].complete, false);

  const complete = createPaperStoryStatus(paperLandmarks.map((landmark) => landmark.goal));
  assert.equal(complete.progress, 100);
  assert.equal(complete.complete, true);
});

test("only counts pigment inside a landmark's paper region", () => {
  const landmark = paperLandmarks[0];
  assert.equal(isPointNearLandmark({ x: landmark.x, y: PAPER_GROUND_Y - 220 }, landmark), true);
  assert.equal(isPointNearLandmark({ x: landmark.x + landmark.radius + 1, y: PAPER_GROUND_Y - 220 }, landmark), false);
  assert.equal(isPointNearLandmark({ x: landmark.x, y: PAPER_GROUND_Y - 600 }, landmark), false);
});

test("all bundled paper-world soundtracks exist and contain audio", async () => {
  assert.equal(paintSoundtracks.length, 14);
  for (const track of paintSoundtracks) {
    const details = await stat(new URL(`../public${track.src}`, import.meta.url));
    assert.ok(details.size > 100_000, `${track.title} should contain audio data`);
  }
});
