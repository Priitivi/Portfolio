import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { candidateEvidence, CANDIDATE_SOURCE_TYPE } from "../src/lab/interview-coach/data/candidateEvidence.js";
import {
  candidatePreparationNotes,
  competencies,
  PREPARATION_PROMPT_TYPE,
  preparationAreas,
  ROLE_SOURCE_TYPE,
  smartRebookDiscoveryChecklist,
} from "../src/lab/interview-coach/data/competencies.js";
import {
  confirmedSourceFacts,
  CONFIRMED_SOURCE_TYPE,
  fictionalExerciseAssumptions,
  FICTIONAL_ASSUMPTION_TYPE,
} from "../src/lab/interview-coach/data/smartRebookScenario.js";
import { experiments } from "../src/lab/experiments.js";
import {
  createMockState,
  mockProgress,
  progressMockInterview,
} from "../src/lab/interview-coach/utils/questionProgression.js";
import { matchRoleplayResponse } from "../src/lab/interview-coach/utils/roleplayMatcher.js";
import { scoreMockInterview, scoreRoleplay } from "../src/lab/interview-coach/utils/scoring.js";
import {
  clearCoachSession,
  COACH_SESSION_KEY,
  createInitialCoachSession,
  loadCoachSession,
  saveCoachSession,
} from "../src/lab/interview-coach/utils/sessionState.js";
import {
  advanceTimer,
  createTimerState,
  ROLEPLAY_DURATION_SECONDS,
  setTimerRunning,
} from "../src/lab/interview-coach/utils/timer.js";

test("Interview Coach is registered as a chamber and renders only after the shared Lab gate", async () => {
  const experiment = experiments.find((item) => item.id === "interview-coach");
  assert.equal(experiment?.route, "/lab/interview-coach");

  const labApp = await readFile(new URL("../src/lab/LabApp.jsx", import.meta.url), "utf8");
  const gateIndex = labApp.indexOf('if (authState !== "unlocked")');
  const coachRouteIndex = labApp.indexOf('pathname === "/lab/interview-coach"');
  assert.ok(gateIndex > -1);
  assert.ok(coachRouteIndex > gateIndex);
  assert.match(labApp, /lazy\(\(\) => import\("\.\/interview-coach\/InterviewCoach"\)\)/);
});

test("mock interview progresses one question at a time and inserts one deterministic follow-up", () => {
  const initial = createMockState();
  assert.equal(initial.currentIndex, 0);
  assert.equal(mockProgress(initial).completed, 0);

  const progressed = progressMockInterview(
    initial,
    "When I delivered school training, I adapted the explanation and used feedback to check the result.",
  );
  assert.equal(progressed.currentIndex, 1);
  assert.equal(progressed.answers.length, 1);
  assert.equal(progressed.queue[1].kind, "follow-up");
  assert.equal(progressed.queue[1].parentId, initial.queue[0].id);
  assert.equal(mockProgress(progressed).completed, 1);

  const unchanged = progressMockInterview(progressed, "   ");
  assert.equal(unchanged, progressed);
});

test("role-play matcher answers only the detected topic and does not volunteer unrelated assumptions", () => {
  const activation = matchRoleplayResponse("How is Smart Rebook enabled and configured?");
  const success = matchRoleplayResponse("How will you measure success?");
  assert.equal(activation.intent, "activation");
  assert.equal(activation.sourceType, FICTIONAL_ASSUMPTION_TYPE);
  assert.equal(activation.response.includes(success.response), false);
  assert.doesNotMatch(activation.response, /help centre|four weeks away/i);

  const confirmed = matchRoleplayResponse("What does Smart Rebook do after a cancellation?");
  assert.equal(confirmed.intent, "core-behaviour");
  assert.equal(confirmed.sourceType, CONFIRMED_SOURCE_TYPE);

  const booknest = matchRoleplayResponse("Tell me about BookNest and its core product.");
  assert.equal(booknest.intent, "booknest-context");
  assert.equal(booknest.sourceType, CONFIRMED_SOURCE_TYPE);
  assert.match(booknest.response, /five years/i);
  assert.match(booknest.response, /online booking page/i);
  assert.doesNotMatch(booknest.response, /enabled|waitlist|support/i);

  const customers = matchRoleplayResponse("What types of businesses are typical BookNest customers?");
  assert.equal(customers.intent, "customer-profile");
  assert.match(customers.response, /hair and beauty salons/i);
  assert.match(customers.response, /dog walkers/i);

  const sourceNoteVariations = [
    ["What level of technical knowledge do learners already have?", "prior-knowledge"],
    ["What is the aim of the learning?", "learning-outcomes"],
    ["What does the customer receive?", "client-experience"],
    ["Is there a test instance available?", "test-access"],
    ["Which SME should review the content for proofing?", "signoff"],
  ];
  sourceNoteVariations.forEach(([question, expectedIntent]) => {
    assert.equal(matchRoleplayResponse(question).intent, expectedIntent);
  });

  const unknown = matchRoleplayResponse("What should I ask you next?");
  assert.equal(unknown.intent, "unknown");
  assert.doesNotMatch(unknown.response, /waitlist|activation|measure|support/i);
});

test("timer pauses, resumes and expires without producing negative time", () => {
  const initial = createTimerState();
  assert.equal(initial.remainingSeconds, ROLEPLAY_DURATION_SECONDS);
  assert.equal(advanceTimer(initial, 5), initial);

  const running = setTimerRunning(initial, true);
  const advanced = advanceTimer(running, 15);
  assert.equal(advanced.remainingSeconds, ROLEPLAY_DURATION_SECONDS - 15);
  assert.equal(advanced.running, true);

  const paused = setTimerRunning(advanced, false);
  assert.equal(advanceTimer(paused, 30), paused);

  const expired = advanceTimer(setTimerRunning(advanced, true), ROLEPLAY_DURATION_SECONDS);
  assert.deepEqual(expired, { remainingSeconds: 0, running: false, expired: true });
});

test("practice scoring uses labelled heuristics and reports coverage without false precision", () => {
  const mockReport = scoreMockInterview([
    {
      questionId: "simplify",
      kind: "core",
      prompt: "Explain complexity",
      answer: "For example, when I delivered iSAMS training to a school client, my role was to adapt the software explanation to the learner need, ask for feedback and confirm understanding. As a result, I could resolve the query and agree the next step.",
    },
  ]);
  assert.match(mockReport.overall, /Strong|Developing|Needs more evidence/);
  assert.match(mockReport.heuristicNote, /keyword, coverage and structure/i);
  assert.equal(mockReport.questionsCovered.length, 1);
  assert.ok(mockReport.topicsNotCovered.length > 0);

  const roleplayReport = scoreRoleplay({
    messages: [
      { role: "candidate", text: "What customer problem does this solve?" },
      { role: "candidate", text: "Who is the target audience?" },
      { role: "candidate", text: "What should they be able to do?" },
    ],
    coveredIntents: ["purpose", "audience", "learning-outcomes"],
    timer: { remainingSeconds: 480, running: false, expired: false },
  });
  assert.equal(roleplayReport.mode, "Smart Rebook Role-play");
  assert.ok(roleplayReport.questionsCovered.includes("Purpose and customer problem"));
  assert.ok(roleplayReport.topicsNotCovered.includes("Support and escalation"));
  assert.equal("score" in roleplayReport, false);

  const contextReport = scoreRoleplay({
    messages: [{ role: "candidate", text: "What is BookNest?" }],
    coveredIntents: ["booknest-context"],
    timer: { remainingSeconds: 570, running: false, expired: false },
  });
  assert.ok(contextReport.questionsCovered.includes("BookNest product context"));
  assert.ok(contextReport.topicsNotCovered.includes("Purpose and customer problem"));
});

test("session state is namespaced, recoverable and fully cleared", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const session = createInitialCoachSession();
  session.screen = "mock";
  session.mock.answers.push({ answer: "Private practice answer" });
  saveCoachSession(session, storage);

  assert.equal(values.has(COACH_SESSION_KEY), true);
  assert.equal(loadCoachSession(storage).mock.answers[0].answer, "Private practice answer");

  const reset = clearCoachSession(storage);
  assert.equal(values.has(COACH_SESSION_KEY), false);
  assert.equal(reset.screen, "welcome");
  assert.deepEqual(reset.mock.answers, []);
});

test("source-backed facts, prompts and fictional assumptions remain explicitly separated", () => {
  assert.ok(candidateEvidence.every((item) => item.sourceType === CANDIDATE_SOURCE_TYPE));
  assert.ok(competencies.every((item) => item.sourceType === ROLE_SOURCE_TYPE));
  assert.ok(preparationAreas.every((item) => item.sourceType === PREPARATION_PROMPT_TYPE));
  assert.ok(candidatePreparationNotes.every((item) => item.sourceType === "candidate-preparation-note"));
  assert.ok(smartRebookDiscoveryChecklist.every((item) => item.sourceType === PREPARATION_PROMPT_TYPE));
  assert.ok(confirmedSourceFacts.every((item) => item.sourceType === CONFIRMED_SOURCE_TYPE));
  assert.ok(fictionalExerciseAssumptions.every((item) => item.sourceType === FICTIONAL_ASSUMPTION_TYPE));

  const confirmedIds = new Set(confirmedSourceFacts.map((item) => item.id));
  assert.equal(fictionalExerciseAssumptions.some((item) => confirmedIds.has(item.id)), false);
});

test("private source documents are explicitly excluded from Git and public application paths", async () => {
  const gitignore = await readFile(new URL("../.gitignore", import.meta.url), "utf8");
  assert.match(gitignore, /^docs\/private-source\/$/m);
  assert.match(gitignore, /^tmp\/pdfs\/$/m);

  const coachSource = await readFile(
    new URL("../src/lab/interview-coach/InterviewCoach.jsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(coachSource, /private-source|Induction\.pdf|Sim-CV\.pdf/);
});
