import assert from "node:assert/strict";
import test from "node:test";
import {
  createFluidSettings,
  detectFluidQuality,
  FLUID_PALETTES,
  FLUID_QUALITY_PRESETS,
  fluidColourForSplat,
  normaliseFluidPointer,
  resolveFluidDimensions,
} from "../src/lab/fluid-lab/fluidConfig.js";
import {
  advectionShader,
  divergenceShader,
  gradientSubtractShader,
  pressureShader,
  vorticityShader,
} from "../src/lab/fluid-lab/shaders.js";

test("ships the requested fluid palettes as bounded RGB splat colours", () => {
  assert.deepEqual(Object.keys(FLUID_PALETTES), ["aurora", "neon", "sunset", "ocean", "monochrome", "rainbow"]);
  for (const [id, palette] of Object.entries(FLUID_PALETTES)) {
    assert.ok(palette.colours.length >= 4);
    const colour = fluidColourForSplat(id, palette.colours.length + 1);
    assert.equal(colour.length, 3);
    colour.forEach((channel) => assert.ok(channel >= 0 && channel <= 1));
  }
});

test("selects conservative automatic quality on mobile and stronger buffers on capable hardware", () => {
  assert.equal(detectFluidQuality({ memory: 1, cores: 2 }), "low");
  assert.equal(detectFluidQuality({ memory: 16, cores: 12 }), "high");
  assert.equal(detectFluidQuality({ memory: 16, cores: 12, mobile: true }), "low");
  assert.ok(FLUID_QUALITY_PRESETS.high.simulationResolution > FLUID_QUALITY_PRESETS.balanced.simulationResolution);
  assert.ok(FLUID_QUALITY_PRESETS.ultra.pressureIterations > FLUID_QUALITY_PRESETS.low.pressureIterations);
});

test("preserves aspect ratio while capping the longest fluid-buffer edge", () => {
  assert.deepEqual(resolveFluidDimensions(128, 2), { width: 128, height: 64 });
  assert.deepEqual(resolveFluidDimensions(128, 0.5), { width: 64, height: 128 });
  assert.deepEqual(resolveFluidDimensions(16, 1), { width: 32, height: 32 });
});

test("maps pointer coordinates into bottom-left WebGL UV space", () => {
  const bounds = { left: 100, top: 50, width: 400, height: 200 };
  assert.deepEqual(normaliseFluidPointer(100, 50, bounds), { x: 0, y: 1 });
  assert.deepEqual(normaliseFluidPointer(500, 250, bounds), { x: 1, y: 0 });
  assert.deepEqual(normaliseFluidPointer(300, 150, bounds), { x: 0.5, y: 0.5 });
});

test("reduced-motion defaults soften force and vorticity without disabling interaction", () => {
  const regular = createFluidSettings(false);
  const reduced = createFluidSettings(true);
  assert.ok(reduced.force < regular.force);
  assert.ok(reduced.vorticity < regular.vorticity);
  assert.ok(reduced.brush > 0);
});

test("includes every required GPU solver stage", () => {
  assert.match(advectionShader, /uVelocity/);
  assert.match(divergenceShader, /right - left \+ top - bottom/);
  assert.match(pressureShader, /left \+ right \+ bottom \+ top - divergence/);
  assert.match(gradientSubtractShader, /velocity -=/);
  assert.match(vorticityShader, /uCurlStrength/);
});
