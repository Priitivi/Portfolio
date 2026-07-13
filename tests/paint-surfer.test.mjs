import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";
import { calculatePaintProgress, clampToCanvas, paintCellKey } from "../src/lab/paint-surfer/paintMath.js";
import { paintSoundtracks } from "../src/lab/paint-surfer/soundtracks.js";

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
  assert.equal(paintSoundtracks.length, 2);
  for (const track of paintSoundtracks) {
    const details = await stat(new URL(`../public${track.src}`, import.meta.url));
    assert.ok(details.size > 100_000, `${track.title} should contain audio data`);
  }
});
