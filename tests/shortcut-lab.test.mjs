import test from "node:test";
import assert from "node:assert/strict";
import { challenges, challengeById } from "../src/lab/shortcut-lab/data/challenges.js";
import { workflows } from "../src/lab/shortcut-lab/data/workflows.js";
import {
  formatShortcut,
  getShortcutRisk,
  matchChallengeShortcut,
  normalizeShortcutEvent,
  shortcutMatches,
} from "../src/lab/shortcut-lab/core/shortcuts.js";
import {
  applyAttempt,
  createScoreState,
  getDailyChallengeIds,
  parsePersistedProgress,
  scoreMetrics,
  updateMastery,
} from "../src/lab/shortcut-lab/core/progress.js";

test("normalizes keyboard events into consistent shortcut definitions", () => {
  assert.deepEqual(normalizeShortcutEvent({ key:"P", ctrlKey:true, altKey:false, shiftKey:true, metaKey:false }), {
    key:"p", ctrl:true, alt:false, shift:true, meta:false,
  });
  assert.equal(normalizeShortcutEvent({ key:"Esc" }).key, "Escape");
});

test("matches exact modifiers and rejects incorrect combinations", () => {
  const expected = { key:"p", ctrl:true, shift:true };
  assert.equal(shortcutMatches({ key:"P", ctrl:true, shift:true }, expected), true);
  assert.equal(shortcutMatches({ key:"p", ctrl:true, shift:false }, expected), false);
  assert.equal(shortcutMatches({ key:"p", ctrl:true, shift:true, alt:true }, expected), false);
});

test("maps primary Ctrl shortcuts to Command on macOS", () => {
  assert.equal(shortcutMatches({ key:"s", meta:true }, { key:"s", ctrl:true }, "mac"), true);
  assert.equal(formatShortcut({ key:"s", ctrl:true }, "mac"), "⌘ + S");
  assert.equal(formatShortcut({ key:"ArrowDown", alt:true, shift:true }, "mac"), "⌥ + Shift + ↓");
});

test("classifies unsafe browser and operating-system shortcuts", () => {
  assert.equal(getShortcutRisk({ key:"w", ctrl:true }), "browser-reserved");
  assert.equal(getShortcutRisk({ key:"Tab", alt:true }), "os-reserved");
  assert.equal(getShortcutRisk({ key:"s", ctrl:true }), "safe");
});

test("validates challenge training inputs without accepting the reserved real chord", () => {
  const challenge = challengeById["browser-close-tab"];
  assert.equal(matchChallengeShortcut({ key:"w", ctrl:true, alt:true, shift:true }, challenge), true);
  assert.equal(matchChallengeShortcut({ key:"w", ctrl:true }, challenge), false);
});

test("updates score, speed bonus, accuracy, and combo", () => {
  const first = applyAttempt(createScoreState(), { correct:true, responseMs:700, points:100 });
  const second = applyAttempt(first, { correct:true, responseMs:1400, points:100 });
  assert.equal(first.correct, 1);
  assert.equal(second.combo, 2);
  assert.equal(second.bestCombo, 2);
  assert.ok(second.score > 200);
  assert.deepEqual(scoreMetrics(second), { accuracy:100, averageReaction:1050 });
});

test("incorrect input resets combo and records the miss", () => {
  const correct = applyAttempt(createScoreState(), { correct:true, responseMs:900 });
  const missed = applyAttempt(correct, { correct:false, responseMs:1200 });
  assert.equal(missed.combo, 0);
  assert.equal(missed.incorrect, 1);
  assert.equal(scoreMetrics(missed).accuracy, 50);
});

test("mastery increases after repeated fast correct attempts and drops on error", () => {
  let mastery = updateMastery({}, "editor-save", { correct:true, responseMs:900, now:1000 });
  mastery = updateMastery(mastery, "editor-save", { correct:true, responseMs:800, now:2000 });
  assert.equal(mastery["editor-save"].level, 1);
  assert.equal(mastery["editor-save"].consecutiveCorrect, 2);
  mastery = updateMastery(mastery, "editor-save", { correct:false, responseMs:4000, now:3000 });
  assert.equal(mastery["editor-save"].level, 0);
  assert.equal(mastery["editor-save"].consecutiveCorrect, 0);
});

test("daily challenge selection is deterministic for a local calendar date", () => {
  const date = new Date(2026, 6, 18, 9, 30);
  const sameDay = new Date(2026, 6, 18, 22, 15);
  const nextDay = new Date(2026, 6, 19, 9, 30);
  assert.deepEqual(getDailyChallengeIds(date), getDailyChallengeIds(sameDay));
  assert.notDeepEqual(getDailyChallengeIds(date), getDailyChallengeIds(nextDay));
  assert.equal(new Set(getDailyChallengeIds(date)).size, 10);
});

test("persistence parsing recovers safely from invalid local data", () => {
  assert.deepEqual(parsePersistedProgress("{broken").mastery, {});
  assert.deepEqual(parsePersistedProgress("[]").bestScores, {});
  const restored = parsePersistedProgress(JSON.stringify({ platform:"mac", mastery:{ save:{ attempts:2 } } }));
  assert.equal(restored.platform, "mac");
  assert.equal(restored.sound, false);
  assert.equal(restored.mastery.save.attempts, 2);
});

test("ships a substantial data-driven curriculum and three valid workflows", () => {
  assert.ok(challenges.length >= 30);
  assert.equal(new Set(challenges.map((challenge) => challenge.id)).size, challenges.length);
  assert.ok(challenges.every((challenge) => challenge.expectedShortcut && challenge.explanation && challenge.action));
  assert.equal(workflows.length, 3);
  assert.ok(workflows.every((workflow) => workflow.challengeIds.every((id) => challengeById[id])));
});
