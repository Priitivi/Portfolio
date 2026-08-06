import test from "node:test";
import assert from "node:assert/strict";
import { graduateCorePack, interviewQuestions, numericalTopics } from "../src/lab/graduate-assessment/data/packs.js";
import {
  availableQuestionCounts,
  createNumericalQuestion,
  createPracticeSession,
  describePattern,
  difficultySettings,
  recalculateNumericalAnswer,
  validateNumericalQuestion,
} from "../src/lab/graduate-assessment/engine/questions.js";
import {
  analyseInterviewAnswer,
  countdownStep,
  remainingFromDeadline,
  selectInterviewQuestion,
} from "../src/lab/graduate-assessment/engine/interview.js";
import {
  createSpeechRecognitionController,
  supportsSpeechRecognition,
} from "../src/lab/graduate-assessment/engine/speech.js";
import {
  MIN_READINESS_SESSIONS,
  PROGRESS_VERSION,
  accuracy,
  categoryPerformance,
  createInitialProgress,
  dailyStreak,
  estimatedReadiness,
  getRecommendations,
  hasReadinessEvidence,
  loadProgress,
  recordInterviewAnswer,
  recordPracticeSession,
  responseTime,
  spacedReviewQueue,
  topicMastery,
} from "../src/lab/graduate-assessment/engine/progress.js";

const difficulties = Object.keys(difficultySettings);

test("4,800 deterministic numerical generations satisfy arithmetic and display invariants", () => {
  let generated = 0;
  for (const topic of numericalTopics) {
    const kinds = new Set();
    for (const difficulty of difficulties) {
      const difficultyKinds = new Set();
      for (let seed = 1; seed <= 200; seed += 1) {
        const question = createNumericalQuestion({ topic, difficulty, seed });
        const validation = validateNumericalQuestion(question);
        assert.equal(validation.valid, true, `${topic}/${difficulty}/${seed}: ${validation.issues.join(", ")}`);
        assert.equal(recalculateNumericalAnswer(question.audit), question.audit.correctValue);
        assert.equal(new Set(question.options).size, 4);
        assert.equal(new Set(question.audit.optionValues).size, 4);
        assert.ok(question.options.every((option) => !/NaN|undefined|Infinity|£-|€-/.test(option)));
        assert.ok(question.explanation.length >= 35);
        if (question.audit.kind.includes("probability")) assert.ok(question.audit.optionValues.every((value) => value >= 0 && value <= 100));
        if (!["GBP"].includes(question.audit.unit)) assert.ok(question.audit.correctValue >= 0, `${topic}/${difficulty}/${seed} produced an inappropriate negative answer`);
        kinds.add(question.audit.kind);
        difficultyKinds.add(question.audit.kind);
        generated += 1;
      }
      assert.equal(difficultyKinds.size, 2, `${topic}/${difficulty} does not expose two distinct templates`);
    }
    assert.equal(kinds.size, 6, `${topic} does not provide six difficulty-specific operations`);
  }
  assert.equal(generated, 4800);
});

test("numerical sessions remain deterministic and avoid duplicate IDs and formatted answers", () => {
  for (let seed = 1; seed <= 100; seed += 1) {
    const first = createPracticeSession({ category: "numerical", difficulty: "advanced", count: 12, seed });
    const second = createPracticeSession({ category: "numerical", difficulty: "advanced", count: 12, seed });
    assert.deepEqual(first, second);
    assert.equal(new Set(first.map((item) => item.id)).size, first.length);
    assert.ok(first.every((item) => new Set(item.options).size === 4));
  }
});

test("authored practice sets keep exact difficulty, unique questions and non-repeating passages", () => {
  for (const category of ["verbal", "logical", "situational"]) {
    for (const difficulty of difficulties) {
      assert.deepEqual(availableQuestionCounts(category, difficulty), [2, 4, 6, 8]);
      const items = createPracticeSession({ category, difficulty, count: 8, seed: 72 });
      assert.equal(items.length, 8);
      assert.ok(items.every((item) => item.difficulty === difficulty));
      assert.equal(new Set(items.map((item) => item.id)).size, items.length);
      if (category === "verbal") assert.equal(new Set(items.map((item) => item.passage)).size, items.length);
    }
  }
});

test("verbal classifications are complete, passage-bound and explain Cannot Say decisions", () => {
  const items = graduateCorePack.categories.verbal.items;
  assert.equal(items.length, 42);
  assert.ok(items.every((item) => [0, 1, 2].includes(item.answer)));
  assert.ok(items.every((item) => item.passage.length > 150 && item.statement.length > 20 && item.explanation.length > 55));
  assert.ok(items.filter((item) => item.answer === 2).every((item) => /cannot|not (?:measured|define|establish)|did not|has not|may not/i.test(item.explanation)));
  assert.ok(items.every((item) => !/according to (?:research|the internet)|widely known|official provider/i.test(`${item.passage} ${item.statement}`)));
});

test("logical patterns have valid unique options and deterministic accessible descriptions", () => {
  const items = graduateCorePack.categories.logical.items;
  assert.equal(items.length, 30);
  for (const item of items) {
    assert.ok(item.sequence.length >= 4);
    assert.equal(item.options.length, 4);
    assert.ok(item.answer >= 0 && item.answer < 4);
    const labels = item.options.map(describePattern);
    assert.equal(new Set(labels).size, 4, `${item.id} has visually duplicate options`);
    assert.equal(describePattern(item.options[item.answer]), labels[item.answer]);
    for (const pattern of [...item.sequence, ...item.options]) {
      assert.ok(["circle", "square", "triangle", "diamond"].includes(pattern.shape));
      assert.ok(Number.isFinite(pattern.rotation));
      assert.ok(pattern.count >= 1 && pattern.count <= 4);
      assert.match(describePattern(pattern), new RegExp(pattern.shape));
    }
  }
});

test("situational scenarios have one strongest response and acknowledge realistic trade-offs", () => {
  const items = graduateCorePack.categories.situational.items;
  assert.equal(items.length, 30);
  for (const item of items) {
    assert.equal(item.options.length, 4);
    const scores = item.options.map((option) => option.score);
    assert.deepEqual([...scores].sort((left, right) => right - left), [4, 3, 2, 1]);
    assert.equal(scores.filter((score) => score === Math.max(...scores)).length, 1);
    assert.ok(item.options.every((option) => option.text.length > 55 && option.rationale.length > 70));
    assert.doesNotMatch(`${item.scenario} ${item.options.map((option) => option.text).join(" ")}`, /SOVA|SHL|Cappfinity|Arctic Shores/i);
  }
});

test("interview analysis separates measurements, suggestions and unavailable delivery evidence", () => {
  const empty = analyseInterviewAnswer("");
  const short = analyseInterviewAnswer("I helped and it worked.");
  const strong = analyseInterviewAnswer("During a six-week student project, our team was two weeks behind. I needed to restore the delivery plan. I analysed twelve blocked items, asked each owner for the cause and prioritised the four dependencies affecting everyone else. I then created a daily ten-minute review. As a result, we delivered two days early and reduced unresolved items by 35%. I learned to expose dependencies sooner.");
  const overlong = analyseInterviewAnswer(Array.from({ length: 12 }, () => "During the project I analysed the same issue, made a plan and the result improved by 10 percent, but this sentence repeats secondary context without adding new evidence.").join(" "));
  assert.equal(empty.total, 0);
  assert.match(empty.observations[0], /No transcript/);
  assert.ok(strong.total > short.total);
  assert.ok(strong.metrics.star >= 80);
  assert.ok(strong.specifics >= 4);
  assert.ok(overlong.wordCount > 260);
  assert.ok(overlong.metrics.completeness < strong.metrics.completeness);
  assert.ok(strong.limitations.some((item) => /confidence|emotion|pronunciation/i.test(item)));
  assert.ok(strong.feedback.every((item) => !/you (?:sound|seem|are) confident/i.test(item)));
});

test("interview selection avoids recent repeats and timers expire without negatives", () => {
  const first = selectInterviewQuestion(interviewQuestions, "standard", [], () => 0);
  const second = selectInterviewQuestion(interviewQuestions, "standard", [first.id], () => 0);
  assert.notEqual(second.id, first.id);
  assert.deepEqual(countdownStep(1), { remaining: 0, expired: true });
  assert.deepEqual(countdownStep(0), { remaining: 0, expired: true });
  assert.deepEqual(countdownStep(3), { remaining: 2, expired: false });
  assert.equal(remainingFromDeadline(10_000, 8_001), 2);
  assert.equal(remainingFromDeadline(10_000, 11_000), 0);
});

class MockRecognition {
  start() { this.onstart?.(); }
  stop() { this.onend?.(); }
  abort() { this.onerror?.({ error: "aborted" }); this.onend?.(); }
}

test("speech recognition handles unsupported, denial, final text and unexpected stopping", () => {
  assert.equal(supportsSpeechRecognition({}), false);
  assert.equal(createSpeechRecognitionController({ windowObject: {} }).start(), false);
  const events = { errors: [], transcripts: [], listening: [] };
  const controller = createSpeechRecognitionController({
    windowObject: { SpeechRecognition: MockRecognition },
    onFinalTranscript: (value) => events.transcripts.push(value),
    onListeningChange: (value) => events.listening.push(value),
    onError: (value) => { if (value) events.errors.push(value); },
  });
  assert.equal(controller.start(), true);
  const finalResult = [{ 0: { transcript: "edited final answer" }, isFinal: true }];
  controller.recognition.onresult({ resultIndex: 0, results: finalResult });
  assert.deepEqual(events.transcripts, ["edited final answer"]);
  controller.recognition.onerror({ error: "not-allowed" });
  assert.match(events.errors.at(-1), /not allowed/i);
  controller.start();
  controller.recognition.onend();
  assert.match(events.errors.at(-1), /stopped unexpectedly/i);
  const errorCount = events.errors.length;
  controller.start();
  controller.stop();
  assert.equal(events.errors.length, errorCount);
});

function practiceSession(id, answers, completedAt = "2026-08-05T12:00:00.000Z", category = "numerical", difficulty = "standard") {
  return { id, category, difficulty, completedAt, answers: answers.map((item, index) => ({ questionId: `${id}-${index}`, topic: "ratios", ...item })) };
}

test("version-one progress migrates and malformed numeric fields are sanitised", () => {
  const migrated = loadProgress(JSON.stringify({
    version: 1,
    createdAt: "bad",
    totals: { attempted: "9", correct: "50", totalTime: "nope", sessions: -4 },
    byCategory: { numerical: { attempted: "4", correct: "2", totalTime: "80", sessions: 1 } },
    recentSessions: [{ id: "same", category: "numerical", type: "practice", accuracy: 50 }, { id: "same", category: "numerical", type: "practice", accuracy: 60 }],
    practiceDates: { bad: 9, "2026-08-05": "3" },
    unlocked: ["first-rep", "invented", "first-rep"],
  }));
  assert.equal(migrated.version, PROGRESS_VERSION);
  assert.equal(migrated.totals.attempted, 9);
  assert.equal(migrated.totals.correct, 9);
  assert.equal(migrated.totals.totalTime, 0);
  assert.equal(migrated.recentSessions.length, 1);
  assert.deepEqual(migrated.unlocked, ["first-rep"]);
  assert.deepEqual(migrated.practiceDates, { "2026-08-05": 3 });
  assert.equal(migrated.completedSessionIds.includes("same"), true);
});

test("practice and interview completion are idempotent", () => {
  const initial = createInitialProgress();
  const session = practiceSession("one", [{ correct: true, seconds: 20 }, { correct: false, seconds: 40 }]);
  const first = recordPracticeSession(initial, session);
  const duplicate = recordPracticeSession(first.progress, session);
  assert.equal(first.ignored, false);
  assert.equal(duplicate.ignored, true);
  assert.equal(duplicate.progress.totals.attempted, 2);
  assert.equal(duplicate.progress.recentSessions.length, 1);
  const interview = { id: "interview-one", difficulty: "standard", question: "Question", score: 80, seconds: 90, completedAt: "2026-08-05T12:00:00.000Z" };
  const recorded = recordInterviewAnswer(duplicate.progress, interview);
  const duplicateInterview = recordInterviewAnswer(recorded.progress, interview);
  assert.equal(duplicateInterview.progress.interviewAnswers, 1);
  assert.equal(duplicateInterview.progress.recentSessions.length, 2);
  assert.equal(categoryPerformance(duplicateInterview.progress.byCategory.interview, "interview"), 80);
});

test("streaks follow local calendar days and tolerate daylight-boundary times", () => {
  const dates = { "2026-03-27": 1, "2026-03-28": 2, "2026-03-29": 1, "2026-03-30": 1 };
  assert.equal(dailyStreak(dates, new Date(2026, 2, 30, 0, 5)), 4);
  assert.equal(dailyStreak(dates, new Date(2026, 2, 31, 23, 55)), 4);
  assert.equal(dailyStreak({ "2026-03-29": 1 }, new Date(2026, 2, 31, 12, 0)), 0);
});

test("response time, mastery and recommendations retain evidence quality", () => {
  let strongSlow = createInitialProgress();
  strongSlow = recordPracticeSession(strongSlow, practiceSession("slow", Array.from({ length: 10 }, () => ({ correct: true, seconds: 150 })))).progress;
  let weakFast = createInitialProgress();
  weakFast = recordPracticeSession(weakFast, practiceSession("fast", Array.from({ length: 10 }, () => ({ correct: false, seconds: 10 })))).progress;
  assert.equal(responseTime(strongSlow.byCategory.numerical), 150);
  assert.ok(topicMastery(strongSlow)[0].mastery > topicMastery(weakFast)[0].mastery);
  assert.ok(topicMastery(strongSlow)[0].mastery < 100, "slow timing should temper otherwise perfect mastery");

  const improvingAnswers = [false, false, false, true, true, true].map((correct) => ({ correct, seconds: 40 }));
  const improving = recordPracticeSession(createInitialProgress(), practiceSession("trend", improvingAnswers)).progress;
  assert.equal(topicMastery(improving)[0].trend, "improving");
});

test("spacing-aware review is deterministic and legacy topic timestamps remain honest", () => {
  const completedAt = "2026-08-01T12:00:00.000Z";
  const weak = recordPracticeSession(createInitialProgress(), practiceSession("spaced", Array.from({ length: 10 }, () => ({ correct: false, seconds: 25 })), completedAt)).progress;
  const reference = new Date("2026-08-03T12:00:00.000Z");
  const [due] = spacedReviewQueue(weak, reference);
  assert.equal(due.intervalDays, 2);
  assert.equal(due.daysSince, 2);
  assert.equal(due.due, true);
  let broad = weak;
  for (const [index, category] of ["verbal", "logical", "situational"].entries()) {
    broad = recordPracticeSession(broad, practiceSession(`spaced-${category}-${index}`, [{ correct: false, seconds: 25 }], completedAt, category)).progress;
  }
  assert.match(getRecommendations(broad, reference)[0].title, /Review ratios/);

  const legacy = structuredClone(weak);
  for (const item of legacy.byTopic["numerical:ratios"].recent) delete item.completedAt;
  const migrated = loadProgress(JSON.stringify(legacy));
  assert.equal(migrated.byTopic["numerical:ratios"].recent[0].completedAt, null);
  assert.equal(spacedReviewQueue(migrated, reference)[0].due, true, "the session timestamp should provide the legacy fallback");
});

test("optional timing profiles persist without changing the progress schema", () => {
  const recorded = recordPracticeSession(createInitialProgress(), {
    ...practiceSession("extended", [{ correct: true, seconds: 50 }]),
    timingProfile: "extended",
  }).progress;
  assert.equal(recorded.version, PROGRESS_VERSION);
  assert.equal(recorded.recentSessions[0].timingProfile, "extended");
  assert.equal(recorded.byTopic["numerical:ratios"].recent[0].targetSeconds, 113);
  assert.equal(loadProgress(JSON.stringify(recorded)).recentSessions[0].timingProfile, "extended");

  const untimed = recordPracticeSession(createInitialProgress(), {
    ...practiceSession("untimed", Array.from({ length: 10 }, () => ({ correct: true, seconds: 600 }))),
    timingProfile: "untimed",
  }).progress;
  assert.equal(untimed.byTopic["numerical:ratios"].recent[0].targetSeconds, null);
  assert.equal(topicMastery(untimed)[0].mastery, 100, "untimed method work must not receive a pace penalty");
});

test("readiness requires a completed session and resists limited-evidence overconfidence", () => {
  const empty = createInitialProgress();
  const uncompletedEvidence = createInitialProgress();
  uncompletedEvidence.totals.attempted = 4;
  uncompletedEvidence.totals.correct = 4;
  uncompletedEvidence.byCategory.numerical.attempted = 4;
  uncompletedEvidence.byCategory.numerical.correct = 4;
  const onePerfect = recordPracticeSession(empty, practiceSession("single", [{ correct: true, seconds: 20 }, { correct: true, seconds: 20 }])).progress;
  assert.equal(MIN_READINESS_SESSIONS, 1);
  assert.equal(hasReadinessEvidence(empty), false);
  assert.equal(hasReadinessEvidence(uncompletedEvidence), false);
  assert.equal(estimatedReadiness(empty), null);
  assert.equal(estimatedReadiness(uncompletedEvidence), null);
  assert.match(getRecommendations(empty)[0].reason, /Complete a practice session to generate your readiness estimate\./);
  assert.equal(hasReadinessEvidence(onePerfect), true);
  assert.equal(typeof estimatedReadiness(onePerfect), "number");
  assert.ok(estimatedReadiness(onePerfect) >= 8, "the assessed-state floor applies after the evidence threshold");
  assert.ok(estimatedReadiness(onePerfect) < 25);
  let broad = createInitialProgress();
  for (const [index, category] of ["numerical", "verbal", "logical", "situational"].entries()) {
    broad = recordPracticeSession(broad, practiceSession(`broad-${index}`, Array.from({ length: 12 }, () => ({ correct: true, seconds: 40 })), `2026-08-0${index + 1}T12:00:00.000Z`, category)).progress;
  }
  for (let index = 0; index < 4; index += 1) broad = recordInterviewAnswer(broad, { id: `int-${index}`, difficulty: "standard", question: "Question", score: 85, seconds: 90, completedAt: `2026-08-0${index + 1}T13:00:00.000Z` }).progress;
  assert.ok(estimatedReadiness(broad) > estimatedReadiness(onePerfect));
  assert.ok(estimatedReadiness(broad) <= 99);
  assert.equal(accuracy(broad.totals), 100);
});
