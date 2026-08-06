import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { graduateCorePack } from "../src/lab/graduate-assessment/data/packs.js";
import { contentInventory, validateContentPack } from "../src/lab/graduate-assessment/engine/content-validation.js";
import { createPracticeSession } from "../src/lab/graduate-assessment/engine/questions.js";
import { learningSignal, sessionLearningSummary } from "../src/lab/graduate-assessment/engine/learning.js";
import {
  assembleSimulation,
  createSimulationAnswer,
  createSimulationCheckpoint,
  loadSimulationCheckpoint,
  remainingSimulationSeconds,
  simulationFormats,
  simulationResults,
  validateSimulation,
} from "../src/lab/graduate-assessment/engine/simulation.js";
import { adjustedSeconds, timingProfiles } from "../src/lab/graduate-assessment/engine/timing.js";
import {
  PROGRESS_VERSION,
  createInitialProgress,
  exposureMetrics,
  getSelectionContext,
  loadProgress,
  performanceByMode,
  recordSimulationSession,
} from "../src/lab/graduate-assessment/engine/progress.js";

test("expanded authored content meets coverage, balance and metadata contracts", () => {
  const validation = validateContentPack(graduateCorePack);
  assert.equal(validation.valid, true, validation.issues.join("\n"));
  assert.deepEqual(contentInventory(graduateCorePack), validation.inventory);
  assert.deepEqual(validation.inventory.verbal.difficulties, { foundation: 14, standard: 14, advanced: 14 });
  assert.deepEqual(validation.inventory.logical.difficulties, { foundation: 10, standard: 10, advanced: 10 });
  assert.deepEqual(validation.inventory.situational.difficulties, { foundation: 10, standard: 10, advanced: 10 });
  assert.equal(validation.inventory.interview.items, 75);
  assert.equal(validation.inventory.verbal.passages, 22);
});

test("all simulation formats assemble deterministically without duplicates over repeated seeds", () => {
  for (const format of simulationFormats) {
    for (let seed = 1; seed <= 40; seed += 1) {
      const settings = { formatId: format.id, seed, includeSituational: true };
      const first = assembleSimulation(settings);
      const second = assembleSimulation(settings);
      assert.deepEqual(first, second);
      const validation = validateSimulation(first);
      assert.equal(validation.valid, true, `${format.id}/${seed}: ${validation.issues.join(", ")}`);
      const questions = first.sections.flatMap((section) => section.questions);
      assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
      assert.ok(first.sections.every((section) => section.seconds >= 8 * 60));
    }
  }
  assert.equal(assembleSimulation({ formatId: "quick", seed: 9 }).sections.flatMap((section) => section.questions).length, 12);
  assert.equal(assembleSimulation({ formatId: "standard", seed: 9 }).sections.flatMap((section) => section.questions).length, 27);
  assert.equal(assembleSimulation({ formatId: "full", seed: 9, includeSituational: true }).sections.flatMap((section) => section.questions).length, 32);
  assert.equal(assembleSimulation({ formatId: "full", seed: 9, includeSituational: false }).sections.flatMap((section) => section.questions).length, 24);
});

test("pace profiles preserve assessment content while adjusting only time pressure", () => {
  const standard = assembleSimulation({ formatId: "standard", seed: 204, timingProfileId: "standard" });
  for (const profile of timingProfiles) {
    const simulation = assembleSimulation({ formatId: "standard", seed: 204, timingProfileId: profile.id });
    assert.equal(simulation.timingProfile, profile.id);
    assert.deepEqual(simulation.sections.map((section) => section.questions.map((question) => question.id)), standard.sections.map((section) => section.questions.map((question) => question.id)));
    assert.ok(simulation.sections.every((section, index) => section.seconds === adjustedSeconds(standard.sections[index].baseSeconds, profile.id)));
    assert.equal(validateSimulation(simulation).valid, true);
  }

  const untimed = assembleSimulation({ formatId: "quick", seed: 205, timingProfileId: "untimed" });
  const checkpoint = createSimulationCheckpoint(untimed, 10_000);
  assert.equal(checkpoint.sectionDeadline, null);
  assert.equal(loadSimulationCheckpoint(JSON.stringify(checkpoint)).sectionDeadline, null);
});

test("formative learning signals distinguish method, accuracy and pace", () => {
  const [question] = createPracticeSession({ category: "numerical", difficulty: "standard", count: 2, seed: 88 });
  const accurate = learningSignal(question, { correct: true, selected: question.answer, seconds: 20 }, "standard");
  const timeout = learningSignal(question, { correct: false, selected: -1, seconds: 75 }, "standard");
  const untimed = learningSignal(question, { correct: true, selected: question.answer, seconds: 300 }, "untimed");
  assert.equal(accurate.withinTarget, true);
  assert.match(accurate.headline, /on pace/);
  assert.match(timeout.nextStep, /Untimed learning/);
  assert.equal(untimed.withinTarget, null);
  assert.match(untimed.pace, /not scored/);
  assert.deepEqual(sessionLearningSummary([question], [{ correct: false, selected: -1, seconds: 75 }]), { timedOut: 1, correctOnPace: 0, focusTopic: question.topic });
});

test("simulation checkpoints recover safely and section deadlines never become negative", () => {
  const simulation = assembleSimulation({ formatId: "standard", seed: 52 });
  const checkpoint = createSimulationCheckpoint(simulation, 10_000);
  const firstQuestion = simulation.sections[0].questions[0];
  const restored = loadSimulationCheckpoint(JSON.stringify({ ...checkpoint, questionIndex: 999, answers: [createSimulationAnswer(firstQuestion, firstQuestion.answer, 20), createSimulationAnswer(firstQuestion, firstQuestion.answer, 20), { questionId: "unknown" }] }));
  assert.equal(restored.version, 1);
  assert.equal(restored.questionIndex, simulation.sections[0].questions.length - 1);
  assert.equal(restored.answers.length, 1);
  assert.equal(loadSimulationCheckpoint("{bad"), null);
  assert.equal(loadSimulationCheckpoint(JSON.stringify({ version: 0 })), null);
  assert.equal(remainingSimulationSeconds(12_500, 10_001), 3);
  assert.equal(remainingSimulationSeconds(12_500, 13_000), 0);
});

test("completed simulations produce section results and migration-safe analytics", () => {
  const simulation = assembleSimulation({ formatId: "full", seed: 81, includeSituational: true });
  const answers = simulation.sections.flatMap((section) => section.questions.map((question) => createSimulationAnswer(question, question.answer, 34)));
  const results = simulationResults(simulation, answers);
  assert.equal(results.accuracy, 100);
  assert.equal(results.sections.length, 4);
  const recorded = recordSimulationSession(createInitialProgress(), {
    id: simulation.id,
    formatId: simulation.formatId,
    timingProfile: simulation.timingProfile,
    completedAt: "2026-08-05T12:00:00.000Z",
    answers,
    results,
  });
  assert.equal(recorded.ignored, false);
  assert.equal(recorded.progress.totals.attempted, 32);
  assert.equal(recorded.progress.totals.sessions, 1);
  assert.equal(recorded.progress.byMode.simulation.sessions, 1);
  assert.equal(recorded.progress.recentSessions[0].type, "simulation");
  assert.equal(recorded.progress.recentSessions[0].category, "mixed");
  assert.equal(recorded.progress.recentSessions[0].timingProfile, "standard");
  assert.ok(exposureMetrics(recorded.progress).recentQuestions >= 30);
  assert.ok(performanceByMode(recorded.progress).find((mode) => mode.id === "simulation").performance === 100);
  assert.equal(recordSimulationSession(recorded.progress, { id: simulation.id, answers }).ignored, true);

  const legacy = createInitialProgress();
  legacy.version = 2;
  delete legacy.byDifficulty;
  delete legacy.byMode;
  delete legacy.exposure;
  legacy.totals.attempted = 7;
  legacy.totals.correct = 5;
  const migrated = loadProgress(JSON.stringify(legacy));
  assert.equal(migrated.version, PROGRESS_VERSION);
  assert.equal(migrated.totals.attempted, 7);
  assert.deepEqual(migrated.exposure, { questionIds: [], passageIds: [], templateIds: [] });
  assert.ok(migrated.byMode.practice);
});

test("selection context favours unseen questions, passages and templates with graceful fallback", () => {
  const firstVerbal = createPracticeSession({ category: "verbal", difficulty: "standard", count: 8, seed: 401 });
  const secondVerbal = createPracticeSession({
    category: "verbal",
    difficulty: "standard",
    count: 8,
    seed: 401,
    selectionContext: {
      recentQuestionIds: firstVerbal.map((question) => question.id),
      recentPassageIds: firstVerbal.map((question) => question.passageId),
    },
  });
  assert.ok(secondVerbal.filter((question) => !firstVerbal.some((prior) => prior.id === question.id)).length >= 6);
  assert.equal(new Set(secondVerbal.map((question) => question.passageId)).size, secondVerbal.length);

  const firstNumerical = createPracticeSession({ category: "numerical", difficulty: "advanced", count: 8, seed: 91 });
  const secondNumerical = createPracticeSession({ category: "numerical", difficulty: "advanced", count: 8, seed: 91, selectionContext: { recentTemplateIds: firstNumerical.map((question) => question.templateId) } });
  assert.equal(secondNumerical.filter((question) => firstNumerical.some((prior) => prior.templateId === question.templateId)).length, 0);

  const context = getSelectionContext(recordSimulationSession(createInitialProgress(), {
    id: "selection-simulation",
    formatId: "quick",
    completedAt: "2026-08-05T12:00:00.000Z",
    answers: firstNumerical.map((question) => createSimulationAnswer(question, question.answer, 30)),
  }).progress);
  assert.ok(context.recentTemplateIds.length > 0);
  assert.ok(context.recentQuestionIds.length > 0);
});

test("explicit adaptive focus outranks general weak and unanswered topic hints", () => {
  const numerical = createPracticeSession({
    category: "numerical",
    difficulty: "standard",
    count: 4,
    seed: 82,
    selectionContext: { focusTopics: ["probability"], unansweredTopics: ["ratios", "charts"], weakTopics: ["averages"] },
  });
  assert.equal(numerical[0].topic, "probability");

  const verbal = createPracticeSession({
    category: "verbal",
    difficulty: "standard",
    count: 4,
    seed: 82,
    selectionContext: { focusTopics: ["causation"], unansweredTopics: ["scope"] },
  });
  assert.equal(verbal[0].topic, "causation");
});

test("simulation UI contracts keep feedback delayed and preserve accessible timing", async () => {
  const source = await readFile(new URL("../src/lab/graduate-assessment/components/Simulation.jsx", import.meta.url), "utf8");
  const practiceSource = await readFile(new URL("../src/lab/graduate-assessment/components/Practice.jsx", import.meta.url), "utf8");
  const interviewSource = await readFile(new URL("../src/lab/graduate-assessment/components/InterviewPractice.jsx", import.meta.url), "utf8");
  const analyticsSource = await readFile(new URL("../src/lab/graduate-assessment/components/Analytics.jsx", import.meta.url), "utf8");
  const shellSource = await readFile(new URL("../src/lab/graduate-assessment/GraduateAssessmentLab.jsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/lab/graduate-assessment/graduate-assessment.css", import.meta.url), "utf8");
  assert.match(source, /Answers and rationales remain hidden until the assessment is submitted/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /role="timer"/);
  assert.match(source, /tabIndex=\{-1\}/);
  assert.match(source, /aria-pressed=\{formatId === format.id\}/);
  assert.match(source, /aria-pressed=\{timingProfileId === profile.id\}/);
  assert.match(source, /role="progressbar"/);
  assert.match(source, /Untimed rehearsal/);
  assert.match(source, /question\.optionDetails\.map/);
  assert.match(source, /ReviewNavigator/);
  assert.match(source, /AnswerExplanation/);
  assert.match(source, /Save & exit/);
  assert.match(source, /not an employer pass prediction or validated percentile/);
  assert.match(practiceSource, /Practice pace/);
  assert.match(practiceSource, /role="progressbar"/);
  assert.match(practiceSource, /ADAPTIVE FOCUS/);
  assert.match(practiceSource, /aria-label=\{`Answer choices/);
  assert.match(interviewSource, /Untimed rehearsal/);
  assert.match(interviewSource, /Heuristic transcript score/);
  assert.match(interviewSource, /Your preparation plan/);
  assert.match(analyticsSource, /Spacing-aware review/);
  assert.match(analyticsSource, /not a calibrated memory prediction/);
  assert.match(shellSource, /id="ga-content" tabIndex=\{-1\}/);
  assert.match(shellSource, /event\.preventDefault\(\); document\.getElementById\("ga-content"\)\?\.focus\(\)/);
  assert.match(shellSource, /lazy\(\(\) => import/);
  assert.match(shellSource, /aria-live="polite"/);
  assert.match(css, /\.ga-simulation-format-grid/);
  assert.match(css, /\.ga-review-queue/);
  assert.match(css, /min-height:4\.5rem/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /@media \(max-width:980px\)[\s\S]*backdrop-filter:none/);
});
