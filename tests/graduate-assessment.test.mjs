import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { experiments } from "../src/lab/experiments.js";
import { graduateCorePack, interviewQuestions, numericalTopics } from "../src/lab/graduate-assessment/data/packs.js";
import { analyseInterviewAnswer } from "../src/lab/graduate-assessment/engine/interview.js";
import { validateContentPack } from "../src/lab/graduate-assessment/engine/content-validation.js";
import { createPracticeSession, isCorrectAnswer, verbalOptions } from "../src/lab/graduate-assessment/engine/questions.js";
import {
  MIN_READINESS_SESSIONS,
  accuracy,
  PROGRESS_VERSION,
  createInitialProgress,
  estimatedReadiness,
  hasReadinessEvidence,
  heatmapDays,
  loadProgress,
  recordInterviewAnswer,
  recordPracticeSession,
  topicMastery,
} from "../src/lab/graduate-assessment/engine/progress.js";

test("Graduate Assessment Lab is registered and lazy loaded behind the shared Lab gate", async () => {
  const experiment = experiments.find((item) => item.id === "graduate-assessment");
  assert.equal(experiment?.route, "/lab/graduate-assessment");
  assert.equal(experiment?.experimentNumber, "008");
  const source = await readFile(new URL("../src/lab/LabApp.jsx", import.meta.url), "utf8");
  assert.match(source, /lazy\(\(\) => import\("\.\/graduate-assessment\/GraduateAssessmentLab"\)\)/);
  assert.ok(source.indexOf('authState !== "unlocked"') < source.indexOf('pathname === "/lab/graduate-assessment"'));
});

test("the core pack meets the expanded original-content contracts", () => {
  assert.deepEqual(graduateCorePack.categories.numerical.topics, numericalTopics);
  assert.deepEqual(numericalTopics.sort(), ["averages", "charts", "currency", "percentages", "probability", "profit-loss", "ratios", "tables"].sort());
  assert.equal(graduateCorePack.categories.verbal.items.length, 42);
  assert.equal(graduateCorePack.categories.logical.items.length, 30);
  assert.equal(graduateCorePack.categories.situational.items.length, 30);
  assert.equal(interviewQuestions.length, 75);
  assert.ok(graduateCorePack.categories.situational.items.every((item) => item.options.every((option) => option.rationale.length > 30)));
  assert.equal(validateContentPack(graduateCorePack).valid, true);
});

test("numerical generation is deterministic, balanced and produces valid answer keys", () => {
  const settings = { category: "numerical", difficulty: "advanced", count: 8, seed: 4512 };
  const first = createPracticeSession(settings);
  const second = createPracticeSession(settings);
  assert.deepEqual(first, second);
  assert.equal(first.length, 8);
  assert.deepEqual(new Set(first.map((item) => item.topic)), new Set(numericalTopics));
  assert.ok(first.every((item) => item.options.length === 4 && item.answer >= 0 && item.answer < 4));
  assert.ok(first.every((item) => isCorrectAnswer(item, item.answer)));
});

test("verbal and logical sessions normalise their answer formats without mutating source packs", () => {
  const verbal = createPracticeSession({ category: "verbal", difficulty: "standard", count: 4, seed: 88 });
  const logical = createPracticeSession({ category: "logical", difficulty: "advanced", count: 4, seed: 22 });
  assert.ok(verbal.every((item) => item.options === verbalOptions || item.options.join("|") === verbalOptions.join("|")));
  assert.ok(logical.every((item) => item.options.every((option) => typeof option === "object" && option.shape)));
  assert.ok(logical.every((item) => item.sequence.length >= 4 && item.explanation.length > 50));
});

test("progress records category, topic, heatmap, session and achievement data", () => {
  const initial = createInitialProgress();
  const session = {
    id: "session-1",
    category: "numerical",
    difficulty: "advanced",
    completedAt: "2026-08-05T10:00:00.000Z",
    answers: [
      { questionId: "one", topic: "ratios", correct: true, seconds: 31 },
      { questionId: "two", topic: "ratios", correct: true, seconds: 29 },
      { questionId: "three", topic: "tables", correct: false, seconds: 48 },
    ],
  };
  const result = recordPracticeSession(initial, session);
  assert.equal(result.progress.totals.attempted, 3);
  assert.equal(result.progress.byCategory.numerical.correct, 2);
  assert.equal(accuracy(result.progress.byCategory.numerical), 67);
  assert.equal(result.progress.byTopic["numerical:ratios"].attempted, 2);
  assert.equal(result.progress.bestAnswerStreak, 2);
  assert.ok(result.progress.unlocked.includes("first-rep"));
  assert.ok(heatmapDays(result.progress.practiceDates, 1, new Date("2026-08-05T12:00:00")).at(-1).level > 0);
  assert.equal(topicMastery(result.progress)[0].id, "numerical:tables");
});

test("corrupt or outdated local progress recovers safely", () => {
  assert.equal(loadProgress("{broken").totals.attempted, 0);
  assert.equal(loadProgress(JSON.stringify({ version: 0 })).version, PROGRESS_VERSION);
});

test("interview analysis rewards structured, specific first-person evidence", () => {
  const thin = analyseInterviewAnswer("We did a project and it went well.");
  const strong = analyseInterviewAnswer("The situation was a delayed student project with a two-week deadline. My task was to restore delivery confidence. I analysed the backlog, asked each owner about blockers and created a daily priority board. I led a scope review and removed three low-value items. The result was that I delivered the core release two days early and reduced open issues by 35%. I learned to make trade-offs visible sooner.");
  assert.ok(strong.total > thin.total);
  assert.ok(strong.metrics.star >= 80);
  assert.ok(strong.specifics >= 3);
  assert.equal(strong.star.action, true);
  assert.equal(strong.star.result, true);
});

test("interview practice contributes to readiness and camera-ready progression", () => {
  let progress = createInitialProgress();
  const baseline = estimatedReadiness(progress);
  assert.equal(MIN_READINESS_SESSIONS, 1);
  assert.equal(hasReadinessEvidence(progress), false);
  assert.equal(baseline, null);
  for (let index = 0; index < 3; index += 1) {
    progress = recordInterviewAnswer(progress, {
      id: `interview-${index}`,
      difficulty: "standard",
      question: "Tell me about a project.",
      score: 82,
      seconds: 92,
      completedAt: `2026-08-0${index + 1}T10:00:00.000Z`,
    }).progress;
  }
  assert.equal(progress.interviewAnswers, 3);
  assert.ok(progress.unlocked.includes("camera-ready"));
  assert.equal(hasReadinessEvidence(progress), true);
  assert.equal(typeof estimatedReadiness(progress), "number");
});

test("responsive and reduced-motion safeguards are present", async () => {
  const css = await readFile(new URL("../src/lab/graduate-assessment/graduate-assessment.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/lab/graduate-assessment/GraduateAssessmentLab.jsx", import.meta.url), "utf8");
  const dashboard = await readFile(new URL("../src/lab/graduate-assessment/components/Dashboard.jsx", import.meta.url), "utf8");
  const analytics = await readFile(new URL("../src/lab/graduate-assessment/components/Analytics.jsx", import.meta.url), "utf8");
  const simulation = await readFile(new URL("../src/lab/graduate-assessment/components/Simulation.jsx", import.meta.url), "utf8");
  assert.match(css, /@media \(max-width:420px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /:focus-visible/);
  assert.match(app, /ga-skip-link/);
  assert.match(app, /window\.localStorage/);
  assert.match(dashboard, /Practice readiness not assessed yet/);
  assert.match(dashboard, /Complete a practice session to generate your readiness estimate\./);
  assert.match(dashboard, /isReadinessAssessed && <div className="ga-readiness-ring"/);
  assert.match(analytics, /Practice readiness not assessed yet/);
  assert.match(analytics, /isReadinessAssessed && <><div className="ga-readiness-scale"/);
  assert.match(simulation, /aria-live="polite"/);
  assert.match(simulation, /REVIEW LOCKED/);
  assert.match(simulation, /Save & exit/);
});
