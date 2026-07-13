import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";
import { calculatePaintProgress, clampToCanvas, getMovementAxes, paintCellKey } from "../src/lab/paint-surfer/paintMath.js";
import { paintSoundtracks } from "../src/lab/paint-surfer/soundtracks.js";
import { createStoryStatus, isInsideStoryChapter, paintStoryChapters } from "../src/lab/paint-surfer/storyConfig.js";

test("maps nearby strokes into stable paint cells", () => {
  assert.equal(paintCellKey(1.1, -2.2), paintCellKey(1.25, -2.3));
  assert.notEqual(paintCellKey(1.1, -2.2), paintCellKey(4.2, -2.2));
});

test("clamps progress and world positions", () => {
  assert.equal(calculatePaintProgress(0, 140), 0);
  assert.equal(calculatePaintProgress(70, 140), 50);
  assert.equal(calculatePaintProgress(300, 140), 100);
  assert.equal(calculatePaintProgress(10, 0), 0);
  assert.equal(clampToCanvas(28), 23);
  assert.equal(clampToCanvas(-28), -23);
});

test("bundled chamber soundtracks exist and are non-empty", async () => {
  assert.equal(paintSoundtracks.length, 10);
  for (const track of paintSoundtracks) {
    const details = await stat(new URL(`../public${track.src}`, import.meta.url));
    assert.ok(details.size > 100_000, `${track.title} should contain audio data`);
  }
});

test("normalizes WASD and arrow keys into stable screen-relative axes", () => {
  assert.deepEqual(getMovementAxes(new Set(["KeyW", "KeyD"])), { right: 1, forward: 1 });
  assert.deepEqual(getMovementAxes(new Set(["ArrowDown", "ArrowLeft"])), { right: -1, forward: -1 });
  assert.deepEqual(getMovementAxes(new Set(["KeyW", "KeyS", "KeyA", "KeyD"])), { right: 0, forward: 0 });
});

test("advances the guided paint story one chapter at a time", () => {
  const initial = createStoryStatus();
  assert.equal(initial.activeIndex, 0);
  assert.equal(initial.progress, 0);

  const firstComplete = createStoryStatus([paintStoryChapters[0].goal, 0, 0]);
  assert.equal(firstComplete.activeIndex, 1);
  assert.equal(firstComplete.chapters[0].complete, true);

  const complete = createStoryStatus(paintStoryChapters.map((chapter) => chapter.goal));
  assert.equal(complete.progress, 100);
  assert.equal(complete.complete, true);
});

test("only counts paint inside the active story beacon", () => {
  const chapter = paintStoryChapters[0];
  assert.equal(isInsideStoryChapter(chapter.position, chapter), true);
  assert.equal(isInsideStoryChapter({ x: chapter.position.x + chapter.radius + 0.1, z: chapter.position.z }, chapter), false);
});
