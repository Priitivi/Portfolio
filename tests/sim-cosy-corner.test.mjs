import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { experiments } from "../src/lab/experiments.js";
import { colouringGallery, colouringTechniques, cosyTheme, hobbies, pokopiaBuilds } from "../src/lab/sim-cosy-corner/simCosyContent.js";
import {
  buildChecklistText,
  completedTutorialSteps,
  createStoredEnvelope,
  generatePalette,
  materialSummary,
  normaliseHex,
  paletteRoles,
  parseStoredEnvelope,
  removeById,
  safeOwnedQuantity,
  validatePalettes,
} from "../src/lab/sim-cosy-corner/cosyUtils.js";

test("Sim’s Cosy Corner is registered and route-level lazy loaded behind the shared Lab gate", async () => {
  const experiment = experiments.find((item) => item.id === "sim-cosy-corner");
  assert.equal(experiment?.route, "/lab/sim-cosy-corner");
  assert.equal(experiment?.experimentNumber, "007");
  const source = await readFile(new URL("../src/lab/LabApp.jsx", import.meta.url), "utf8");
  assert.match(source, /lazy\(\(\) => import\("\.\/sim-cosy-corner\/SimCosyCorner"\)\)/);
  assert.ok(source.indexOf('authState !== "unlocked"') < source.indexOf('pathname === "/lab/sim-cosy-corner"'));
});

test("Lavender Daydream exposes strong ink and the full supporting pastel system", async () => {
  assert.equal(cosyTheme.id, "lavender-daydream");
  assert.equal(cosyTheme.tokens.plum, "#3f304b");
  for (const token of ["cream","lavender","lilac","violet","periwinkle","blush","peach","butter","blue","sage","plum"]) assert.ok(normaliseHex(cosyTheme.tokens[token]));
  const css = await readFile(new URL("../src/lab/sim-cosy-corner/sim-cosy-corner.css", import.meta.url), "utf8");
  assert.match(css, /--cosy-lavender:#c9b6e4/);
  assert.match(css, /--cosy-plum:#3f304b/);
});

test("palette generation is deterministic, sized safely and preserves locked colours", () => {
  const options = { size:6, softness:80, base:"#8f75ad", seed:.42 };
  const first = generatePalette(options);
  assert.deepEqual(first, generatePalette(options));
  assert.equal(first.length, 6);
  assert.ok(first.every(normaliseHex));
  const regenerated = generatePalette({ ...options, seed:.83, previous:first, locks:[true,false,true,false,false,false] });
  assert.equal(regenerated[0], first[0]);
  assert.equal(regenerated[2], first[2]);
  assert.notEqual(regenerated[1], first[1]);
  assert.deepEqual(paletteRoles(5), ["Dominant","Supporting","Supporting","Accent","Accent"]);
});

test("palette persistence validates saved records, recovers from corruption and supports deletion", () => {
  const palettes = [{ id:"one", name:"Lavender", colours:["#8f75ad","#c9b6e4","#f2d98c"] }, { id:"two", name:"Sage", colours:["#745b91","#b8c9aa","#fff8e9"] }];
  const stored = createStoredEnvelope(palettes);
  assert.deepEqual(parseStoredEnvelope(stored, [], validatePalettes), palettes);
  assert.deepEqual(parseStoredEnvelope("{broken", [], validatePalettes), []);
  assert.deepEqual(parseStoredEnvelope(JSON.stringify({ version:0, value:palettes }), [], validatePalettes), []);
  assert.deepEqual(removeById(palettes, "one").map((item) => item.id), ["two"]);
});

test("material calculations reject invalid ownership and report completion accurately", () => {
  const materials = [{ id:"path", name:"Path", category:"Structure", required:20 }, { id:"flowers", name:"Flowers", category:"Plants", required:8 }];
  assert.equal(safeOwnedQuantity(-4, 20), 0);
  assert.equal(safeOwnedQuantity("nope", 20), 0);
  assert.equal(safeOwnedQuantity(99, 20), 20);
  const partial = materialSummary(materials, { path:12, flowers:8 });
  assert.equal(partial.rows[0].remaining, 8);
  assert.equal(partial.percent, 71);
  assert.equal(partial.complete, false);
  const ready = materialSummary(materials, { path:20, flowers:8 });
  assert.equal(ready.complete, true);
  assert.match(buildChecklistText({ name:"Garden", status:"Concept" }, partial), /8 remaining/);
});

test("tutorial progress clamps malformed values and concept builds carry explicit status", () => {
  assert.equal(completedTutorialSteps(-20, 7), 0);
  assert.equal(completedTutorialSteps(4, 7), 4);
  assert.equal(completedTutorialSteps(99, 7), 6);
  assert.ok(pokopiaBuilds.length >= 5);
  assert.ok(pokopiaBuilds.every((build) => build.status === "Concept" && /confirm|not verified|in-game/i.test(build.notes)));
  assert.equal(pokopiaBuilds[0].stages.length, 7);
});

test("hobby, technique and gallery starter content is substantial and openly labelled", async () => {
  assert.ok(hobbies.length >= 8);
  assert.ok(colouringTechniques.length >= 8);
  assert.ok(colouringTechniques.every((item) => item.steps.length >= 3 && item.notes.length > 0));
  assert.ok(colouringGallery.every((item) => /placeholder|original CSS/i.test(`${item.book} ${item.notes}`)));
  const source = await readFile(new URL("../src/lab/sim-cosy-corner/components/ColouringStudio.jsx", import.meta.url), "utf8");
  assert.match(source, /Editable example content/);
});

test("gallery dialog, empty states, section navigation and reduced motion hooks remain in the UI", async () => {
  const [app, colouring, hobbiesSource, css] = await Promise.all([
    readFile(new URL("../src/lab/sim-cosy-corner/SimCosyCorner.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lab/sim-cosy-corner/components/ColouringStudio.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lab/sim-cosy-corner/components/HobbyShelf.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lab/sim-cosy-corner/sim-cosy-corner.css", import.meta.url), "utf8"),
  ]);
  assert.match(app, /section === "hobbies"/);
  assert.match(app, /section === "colouring"/);
  assert.match(app, /section === "pokopia"/);
  assert.match(colouring, /role="dialog"/);
  assert.match(colouring, /aria-modal="true"/);
  assert.match(colouring, /event\.key === "Escape"/);
  assert.match(colouring, /closeRef\.current\?\.focus/);
  assert.match(hobbiesSource, /Nothing pinned here yet/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /@media \(max-width:420px\)/);
});
