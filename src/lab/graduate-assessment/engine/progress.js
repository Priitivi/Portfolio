import { assessmentCategories, numericalTopics } from "../data/catalog.js";
import { adjustedSeconds } from "./timing.js";

export const STORAGE_KEY = "priit-lab:graduate-assessment:v1";
export const PROGRESS_VERSION = 3;
// Progress is only recorded after a runner or interview completes. One completed
// session is therefore the first meaningful evidence boundary across every mode.
export const MIN_READINESS_SESSIONS = 1;
export const DAILY_PRACTICE_TARGET = 10;
const SESSION_ID_LIMIT = 200;
const RECENT_TOPIC_LIMIT = 20;
const QUESTION_EXPOSURE_LIMIT = 160;
const PASSAGE_EXPOSURE_LIMIT = 80;
const TEMPLATE_EXPOSURE_LIMIT = 80;
const difficulties = ["foundation", "standard", "advanced"];
const modes = ["practice", "simulation", "interview"];
const categoryIds = new Set(assessmentCategories.map((category) => category.id));

export const achievements = [
  { id: "first-rep", title: "First rep", description: "Complete your first reasoning session.", icon: "01" },
  { id: "century", title: "Century", description: "Answer 100 assessment questions.", icon: "100" },
  { id: "clean-sheet", title: "Clean sheet", description: "Complete a reasoning session with 100% accuracy.", icon: "✓" },
  { id: "five-day", title: "Five-day signal", description: "Practise on five consecutive days.", icon: "5D" },
  { id: "all-rounder", title: "All-rounder", description: "Record practice in all five categories.", icon: "360" },
  { id: "under-pressure", title: "Under pressure", description: "Score at least 80% on Advanced difficulty.", icon: "UP" },
  { id: "camera-ready", title: "Camera ready", description: "Complete three mock interview answers.", icon: "REC" },
  { id: "sharp-eye", title: "Sharp eye", description: "Answer ten logical questions correctly.", icon: "◇" },
];

const achievementIdSet = new Set(achievements.map((item) => item.id));

function safeNumber(value, maximum = 1_000_000_000) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.min(numeric, maximum);
}

function safeInteger(value, maximum = 1_000_000_000) {
  return Math.floor(safeNumber(value, maximum));
}

function safeDate(value, fallback = new Date().toISOString()) {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : fallback;
}

function safeOptionalDate(value) {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function emptyCategory() {
  return { attempted: 0, correct: 0, totalTime: 0, sessions: 0, scoreTotal: 0 };
}

function normaliseStats(value) {
  const attempted = safeInteger(value?.attempted);
  return {
    attempted,
    correct: Math.min(safeNumber(value?.correct), attempted),
    totalTime: safeNumber(value?.totalTime),
    sessions: safeInteger(value?.sessions),
    scoreTotal: safeNumber(value?.scoreTotal, attempted * 100),
  };
}

function normaliseRecentTopic(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(-RECENT_TOPIC_LIMIT).map((item) => ({
    correct: Boolean(item?.correct),
    seconds: Math.max(1, Math.min(3600, safeInteger(item?.seconds) || 1)),
    targetSeconds: item?.targetSeconds === null ? null : Math.max(1, Math.min(600, safeInteger(item?.targetSeconds) || 75)),
    // Older schema-v3 topic samples did not carry a timestamp. Preserve that
    // absence so loading legacy data cannot make an old attempt appear new.
    completedAt: safeOptionalDate(item?.completedAt),
  }));
}

function normaliseSummary(item) {
  const type = item?.type === "interview" ? "interview" : item?.type === "simulation" ? "simulation" : "practice";
  const category = type === "simulation" && item?.category === "mixed" ? "mixed" : item?.category;
  if (!item || typeof item.id !== "string" || !item.id.trim() || !categoryIds.has(category) && category !== "mixed") return null;
  return {
    id: item.id.slice(0, 120),
    type,
    category,
    difficulty: difficulties.includes(item.difficulty) ? item.difficulty : "standard",
    completedAt: safeDate(item.completedAt),
    accuracy: Math.max(0, Math.min(100, Math.round(safeNumber(item.accuracy, 100)))),
    attempted: Math.max(1, safeInteger(item.attempted) || 1),
    averageTime: safeInteger(item.averageTime, 3600),
    ...(typeof item.question === "string" ? { question: item.question.slice(0, 500) } : {}),
    ...(typeof item.formatId === "string" ? { formatId: item.formatId.slice(0, 40) } : {}),
    ...(["standard", "extended", "untimed"].includes(item.timingProfile) ? { timingProfile: item.timingProfile } : {}),
  };
}

function normaliseExposureList(items, limit) {
  if (!Array.isArray(items)) return [];
  return [...new Set(items.filter((item) => typeof item === "string" && item.trim()).map((item) => item.slice(0, 120)))].slice(-limit);
}

export function createInitialProgress() {
  return {
    version: PROGRESS_VERSION,
    createdAt: new Date().toISOString(),
    totals: { attempted: 0, correct: 0, totalTime: 0, sessions: 0, scoreTotal: 0 },
    byCategory: Object.fromEntries(assessmentCategories.map((category) => [category.id, emptyCategory()])),
    byDifficulty: Object.fromEntries(difficulties.map((difficulty) => [difficulty, emptyCategory()])),
    byMode: Object.fromEntries(modes.map((mode) => [mode, emptyCategory()])),
    byTopic: {},
    exposure: { questionIds: [], passageIds: [], templateIds: [] },
    practiceDates: {},
    recentSessions: [],
    completedSessionIds: [],
    unlocked: [],
    bestAnswerStreak: 0,
    interviewAnswers: 0,
  };
}

function normaliseProgress(parsed) {
  const initial = createInitialProgress();
  const recentSessions = [];
  const seen = new Set();
  if (Array.isArray(parsed?.recentSessions)) {
    for (const rawSummary of parsed.recentSessions) {
      const summary = normaliseSummary(rawSummary);
      if (!summary || seen.has(summary.id)) continue;
      seen.add(summary.id);
      recentSessions.push(summary);
      if (recentSessions.length === 12) break;
    }
  }
  const byCategory = { ...initial.byCategory };
  for (const category of assessmentCategories) byCategory[category.id] = normaliseStats(parsed?.byCategory?.[category.id]);
  if (!byCategory.interview.scoreTotal) {
    byCategory.interview.scoreTotal = recentSessions.filter((item) => item.type === "interview").reduce((sum, item) => sum + item.accuracy, 0);
  }
  const byDifficulty = { ...initial.byDifficulty };
  for (const difficulty of difficulties) byDifficulty[difficulty] = normaliseStats(parsed?.byDifficulty?.[difficulty]);
  const byMode = { ...initial.byMode };
  for (const mode of modes) byMode[mode] = normaliseStats(parsed?.byMode?.[mode]);
  if (!parsed?.byMode) {
    const reasoningTotals = normaliseStats(parsed?.totals);
    const interviewStats = byCategory.interview;
    byMode.practice = {
      ...reasoningTotals,
      sessions: Math.max(0, reasoningTotals.sessions - interviewStats.sessions),
    };
    byMode.interview = { ...interviewStats };
  }
  const byTopic = {};
  if (parsed?.byTopic && typeof parsed.byTopic === "object") {
    for (const [key, value] of Object.entries(parsed.byTopic)) {
      if (!key.includes(":")) continue;
      byTopic[key.slice(0, 120)] = { ...normaliseStats(value), recent: normaliseRecentTopic(value?.recent) };
    }
  }
  const practiceDates = {};
  if (parsed?.practiceDates && typeof parsed.practiceDates === "object") {
    for (const [key, value] of Object.entries(parsed.practiceDates)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key) && safeInteger(value, 10000) > 0) practiceDates[key] = safeInteger(value, 10000);
    }
  }
  const completedSessionIds = [...new Set([
    ...(Array.isArray(parsed?.completedSessionIds) ? parsed.completedSessionIds.filter((id) => typeof id === "string") : []),
    ...recentSessions.map((item) => item.id),
  ])].slice(-SESSION_ID_LIMIT);
  return {
    version: PROGRESS_VERSION,
    createdAt: safeDate(parsed?.createdAt, initial.createdAt),
    totals: normaliseStats(parsed?.totals),
    byCategory,
    byDifficulty,
    byMode,
    byTopic,
    exposure: {
      questionIds: normaliseExposureList(parsed?.exposure?.questionIds, QUESTION_EXPOSURE_LIMIT),
      passageIds: normaliseExposureList(parsed?.exposure?.passageIds, PASSAGE_EXPOSURE_LIMIT),
      templateIds: normaliseExposureList(parsed?.exposure?.templateIds, TEMPLATE_EXPOSURE_LIMIT),
    },
    practiceDates,
    recentSessions,
    completedSessionIds,
    unlocked: [...new Set((Array.isArray(parsed?.unlocked) ? parsed.unlocked : []).filter((id) => achievementIdSet.has(id)))],
    bestAnswerStreak: safeInteger(parsed?.bestAnswerStreak),
    interviewAnswers: safeInteger(parsed?.interviewAnswers),
  };
}

export function loadProgress(raw) {
  if (!raw) return createInitialProgress();
  try {
    const parsed = JSON.parse(raw);
    if (![1, 2, PROGRESS_VERSION].includes(parsed?.version) || !parsed.totals || !parsed.byCategory) return createInitialProgress();
    return normaliseProgress(parsed);
  } catch {
    return createInitialProgress();
  }
}

export function dateKey(date = new Date()) {
  const local = new Date(date);
  const safe = Number.isFinite(local.getTime()) ? local : new Date();
  return `${safe.getFullYear()}-${String(safe.getMonth() + 1).padStart(2, "0")}-${String(safe.getDate()).padStart(2, "0")}`;
}

export function accuracy(stats) {
  return stats?.attempted ? Math.round((safeNumber(stats.correct) / safeNumber(stats.attempted)) * 100) : 0;
}

export function categoryPerformance(stats, category) {
  if (!stats?.attempted) return 0;
  if (category === "interview") return Math.round(safeNumber(stats.scoreTotal) / safeNumber(stats.attempted));
  return accuracy(stats);
}

export function responseTime(stats) {
  return stats?.attempted ? Math.round(safeNumber(stats.totalTime) / safeNumber(stats.attempted)) : 0;
}

export function evidenceStrength(progress) {
  const attempted = safeInteger(progress?.totals?.attempted) + safeInteger(progress?.interviewAnswers) * 3;
  const sessions = safeInteger(progress?.totals?.sessions);
  const breadth = assessmentCategories.filter((category) => safeInteger(progress?.byCategory?.[category.id]?.attempted) > 0).length;
  if (!hasReadinessEvidence(progress)) return { label: "No evidence", level: "none", attempted, sessions, breadth };
  if (attempted < 20 || sessions < 3 || breadth < 2) return { label: "Early evidence", level: "early", attempted, sessions, breadth };
  if (attempted < 60 || sessions < 6 || breadth < 4) return { label: "Developing evidence", level: "developing", attempted, sessions, breadth };
  return { label: "Broad evidence", level: "broad", attempted, sessions, breadth };
}

export function dailyPracticeGoal(progress, now = new Date(), target = DAILY_PRACTICE_TARGET) {
  const safeTarget = Math.max(1, safeInteger(target, 100) || DAILY_PRACTICE_TARGET);
  const completed = safeInteger(progress?.practiceDates?.[dateKey(now)], 10_000);
  return {
    target: safeTarget,
    completed,
    remaining: Math.max(0, safeTarget - completed),
    percent: Math.min(100, Math.round(completed / safeTarget * 100)),
    complete: completed >= safeTarget,
  };
}

export function nextAchievementProgress(progress, now = new Date()) {
  const activeCategories = assessmentCategories.filter((category) => safeInteger(progress?.byCategory?.[category.id]?.attempted) > 0).length;
  const candidates = [
    { id: "first-rep", current: Math.min(1, (progress?.recentSessions || []).some((item) => item.type !== "interview") ? 1 : 0), target: 1 },
    { id: "century", current: Math.min(100, safeInteger(progress?.totals?.attempted)), target: 100 },
    { id: "five-day", current: Math.min(5, dailyStreak(progress?.practiceDates || {}, now)), target: 5 },
    { id: "all-rounder", current: Math.min(5, activeCategories), target: 5 },
    { id: "camera-ready", current: Math.min(3, safeInteger(progress?.interviewAnswers)), target: 3 },
    { id: "sharp-eye", current: Math.min(10, safeInteger(progress?.byCategory?.logical?.correct)), target: 10 },
  ];
  const next = candidates
    .filter((candidate) => !progress?.unlocked?.includes(candidate.id))
    .sort((left, right) => right.current / right.target - left.current / left.target)[0];
  if (!next) return null;
  const achievement = achievements.find((item) => item.id === next.id);
  return { ...achievement, ...next, percent: Math.round(next.current / next.target * 100) };
}

function achievementIds(progress, referenceDate = new Date()) {
  const session = progress.recentSessions[0];
  const activeCategories = Object.values(progress.byCategory).filter((item) => item.attempted > 0).length;
  const unlocked = [];
  if (progress.recentSessions.some((item) => item.type === "practice" || item.type === "simulation")) unlocked.push("first-rep");
  if (progress.totals.attempted >= 100) unlocked.push("century");
  if (session?.accuracy === 100 && session?.attempted >= 2 && (session?.type === "practice" || session?.type === "simulation")) unlocked.push("clean-sheet");
  if (dailyStreak(progress.practiceDates, referenceDate) >= 5) unlocked.push("five-day");
  if (activeCategories >= 5) unlocked.push("all-rounder");
  if (session?.difficulty === "advanced" && session.accuracy >= 80) unlocked.push("under-pressure");
  if (progress.interviewAnswers >= 3) unlocked.push("camera-ready");
  if ((progress.byCategory.logical?.correct || 0) >= 10) unlocked.push("sharp-eye");
  return unlocked;
}

function unchangedResult(progress) {
  return { progress: normaliseProgress(progress), newlyUnlocked: [], ignored: true };
}

function addStats(stats, { attempted, correct, totalTime, sessions = 0, scoreTotal = 0 }) {
  return {
    ...stats,
    attempted: stats.attempted + attempted,
    correct: stats.correct + correct,
    totalTime: stats.totalTime + totalTime,
    sessions: stats.sessions + sessions,
    scoreTotal: stats.scoreTotal + scoreTotal,
  };
}

function recordExposure(progress, answers) {
  progress.exposure = {
    questionIds: normaliseExposureList([...progress.exposure.questionIds, ...answers.map((item) => item.questionId)], QUESTION_EXPOSURE_LIMIT),
    passageIds: normaliseExposureList([...progress.exposure.passageIds, ...answers.map((item) => item.passageId).filter(Boolean)], PASSAGE_EXPOSURE_LIMIT),
    templateIds: normaliseExposureList([...progress.exposure.templateIds, ...answers.map((item) => item.templateId).filter(Boolean)], TEMPLATE_EXPOSURE_LIMIT),
  };
}

export function recordPracticeSession(progress, session) {
  if (!session?.id || !Array.isArray(session.answers) || !session.answers.length || !categoryIds.has(session.category) || session.category === "interview") return unchangedResult(progress);
  const next = normaliseProgress(progress);
  if (next.completedSessionIds.includes(session.id)) return { progress: next, newlyUnlocked: [], ignored: true };
  const difficulty = difficulties.includes(session.difficulty) ? session.difficulty : "standard";
  const completedAt = safeDate(session.completedAt);
  const answers = session.answers.map((item) => ({
    questionId: String(item?.questionId || "unknown").slice(0, 120),
    topic: String(item?.topic || "general").slice(0, 80),
    correct: Boolean(item?.correct),
    seconds: Math.max(1, Math.min(3600, safeInteger(item?.seconds) || 1)),
    ...(typeof item?.passageId === "string" ? { passageId: item.passageId.slice(0, 120) } : {}),
    ...(typeof item?.templateId === "string" ? { templateId: item.templateId.slice(0, 120) } : {}),
  }));
  const attempted = answers.length;
  const correct = answers.filter((item) => item.correct).length;
  const totalTime = answers.reduce((sum, item) => sum + item.seconds, 0);
  const currentDate = dateKey(completedAt);
  const categoryStats = next.byCategory[session.category] || emptyCategory();
  next.totals = { ...next.totals, attempted: next.totals.attempted + attempted, correct: next.totals.correct + correct, totalTime: next.totals.totalTime + totalTime, sessions: next.totals.sessions + 1 };
  next.byCategory[session.category] = { ...categoryStats, attempted: categoryStats.attempted + attempted, correct: categoryStats.correct + correct, totalTime: categoryStats.totalTime + totalTime, sessions: categoryStats.sessions + 1 };
  next.byDifficulty[difficulty] = addStats(next.byDifficulty[difficulty] || emptyCategory(), { attempted, correct, totalTime, sessions: 1 });
  next.byMode.practice = addStats(next.byMode.practice, { attempted, correct, totalTime, sessions: 1 });
  const targetSeconds = adjustedSeconds({ foundation: 105, standard: 75, advanced: 55 }[difficulty], session.timingProfile);
  answers.forEach((item) => {
    const key = `${session.category}:${item.topic}`;
    const topic = next.byTopic[key] || { ...emptyCategory(), recent: [] };
    next.byTopic[key] = {
      ...topic,
      attempted: topic.attempted + 1,
      correct: topic.correct + (item.correct ? 1 : 0),
      totalTime: topic.totalTime + item.seconds,
      recent: [...(topic.recent || []), { correct: item.correct, seconds: item.seconds, targetSeconds, completedAt }].slice(-RECENT_TOPIC_LIMIT),
    };
  });
  next.practiceDates[currentDate] = (next.practiceDates[currentDate] || 0) + attempted;
  const summary = { id: String(session.id).slice(0, 120), type: "practice", category: session.category, difficulty, completedAt, accuracy: Math.round(correct / attempted * 100), attempted, averageTime: Math.round(totalTime / attempted), ...(["standard", "extended", "untimed"].includes(session.timingProfile) ? { timingProfile: session.timingProfile } : {}) };
  next.recentSessions = [summary, ...next.recentSessions].slice(0, 12);
  next.completedSessionIds = [...next.completedSessionIds, summary.id].slice(-SESSION_ID_LIMIT);
  recordExposure(next, answers);
  let running = 0;
  let best = next.bestAnswerStreak;
  answers.forEach((item) => { running = item.correct ? running + 1 : 0; best = Math.max(best, running); });
  next.bestAnswerStreak = best;
  const before = new Set(next.unlocked);
  next.unlocked = [...new Set([...next.unlocked, ...achievementIds(next, completedAt)])];
  return { progress: next, newlyUnlocked: next.unlocked.filter((id) => !before.has(id)), ignored: false };
}

export function recordSimulationSession(progress, session) {
  if (!session?.id || !Array.isArray(session.answers) || !session.answers.length) return unchangedResult(progress);
  const next = normaliseProgress(progress);
  if (next.completedSessionIds.includes(session.id)) return { progress: next, newlyUnlocked: [], ignored: true };
  const completedAt = safeDate(session.completedAt);
  const answers = session.answers
    .filter((item) => categoryIds.has(item?.category) && item.category !== "interview")
    .map((item) => ({
      questionId: String(item.questionId || "unknown").slice(0, 120),
      category: item.category,
      difficulty: difficulties.includes(item.difficulty) ? item.difficulty : "standard",
      topic: String(item.topic || "general").slice(0, 80),
      correct: Boolean(item.correct),
      seconds: Math.max(1, Math.min(3600, safeInteger(item.seconds) || 1)),
      ...(typeof item.passageId === "string" ? { passageId: item.passageId.slice(0, 120) } : {}),
      ...(typeof item.templateId === "string" ? { templateId: item.templateId.slice(0, 120) } : {}),
    }));
  if (!answers.length) return unchangedResult(progress);
  const attempted = answers.length;
  const correct = answers.filter((item) => item.correct).length;
  const totalTime = answers.reduce((sum, item) => sum + item.seconds, 0);
  next.totals = addStats(next.totals, { attempted, correct, totalTime, sessions: 1 });
  next.byMode.simulation = addStats(next.byMode.simulation, { attempted, correct, totalTime, sessions: 1 });

  for (const category of new Set(answers.map((item) => item.category))) {
    const categoryAnswers = answers.filter((item) => item.category === category);
    next.byCategory[category] = addStats(next.byCategory[category], {
      attempted: categoryAnswers.length,
      correct: categoryAnswers.filter((item) => item.correct).length,
      totalTime: categoryAnswers.reduce((sum, item) => sum + item.seconds, 0),
      sessions: 1,
    });
  }
  for (const difficulty of new Set(answers.map((item) => item.difficulty))) {
    const difficultyAnswers = answers.filter((item) => item.difficulty === difficulty);
    next.byDifficulty[difficulty] = addStats(next.byDifficulty[difficulty], {
      attempted: difficultyAnswers.length,
      correct: difficultyAnswers.filter((item) => item.correct).length,
      totalTime: difficultyAnswers.reduce((sum, item) => sum + item.seconds, 0),
      sessions: 1,
    });
  }

  for (const item of answers) {
    const key = `${item.category}:${item.topic}`;
    const topic = next.byTopic[key] || { ...emptyCategory(), recent: [] };
    const targetSeconds = adjustedSeconds({ foundation: 105, standard: 75, advanced: 55 }[item.difficulty], session.timingProfile);
    next.byTopic[key] = {
      ...topic,
      attempted: topic.attempted + 1,
      correct: topic.correct + (item.correct ? 1 : 0),
      totalTime: topic.totalTime + item.seconds,
      recent: [...(topic.recent || []), { correct: item.correct, seconds: item.seconds, targetSeconds, completedAt }].slice(-RECENT_TOPIC_LIMIT),
    };
  }

  const currentDate = dateKey(completedAt);
  next.practiceDates[currentDate] = (next.practiceDates[currentDate] || 0) + attempted;
  const summary = {
    id: String(session.id).slice(0, 120),
    type: "simulation",
    category: "mixed",
    difficulty: "standard",
    formatId: String(session.formatId || "custom").slice(0, 40),
    ...(["standard", "extended", "untimed"].includes(session.timingProfile) ? { timingProfile: session.timingProfile } : {}),
    completedAt,
    accuracy: Math.round(correct / attempted * 100),
    attempted,
    averageTime: Math.round(totalTime / attempted),
  };
  next.recentSessions = [summary, ...next.recentSessions].slice(0, 12);
  next.completedSessionIds = [...next.completedSessionIds, summary.id].slice(-SESSION_ID_LIMIT);
  recordExposure(next, answers);
  let running = 0;
  let best = next.bestAnswerStreak;
  for (const item of answers) {
    running = item.correct ? running + 1 : 0;
    best = Math.max(best, running);
  }
  next.bestAnswerStreak = best;
  const before = new Set(next.unlocked);
  next.unlocked = [...new Set([...next.unlocked, ...achievementIds(next, completedAt)])];
  return { progress: next, newlyUnlocked: next.unlocked.filter((id) => !before.has(id)), ignored: false };
}

export function recordInterviewAnswer(progress, entry) {
  if (!entry?.id) return unchangedResult(progress);
  const next = normaliseProgress(progress);
  if (next.completedSessionIds.includes(entry.id)) return { progress: next, newlyUnlocked: [], ignored: true };
  const completedAt = safeDate(entry.completedAt);
  const currentDate = dateKey(completedAt);
  const score = Math.max(0, Math.min(100, Math.round(safeNumber(entry.score, 100))));
  const seconds = Math.max(1, Math.min(3600, safeInteger(entry.seconds) || 1));
  next.interviewAnswers += 1;
  next.practiceDates[currentDate] = (next.practiceDates[currentDate] || 0) + 1;
  const current = next.byCategory.interview || emptyCategory();
  next.byCategory.interview = { ...current, attempted: current.attempted + 1, totalTime: current.totalTime + seconds, sessions: current.sessions + 1, scoreTotal: current.scoreTotal + score };
  const difficulty = difficulties.includes(entry.difficulty) ? entry.difficulty : "standard";
  next.byMode.interview = addStats(next.byMode.interview, { attempted: 1, correct: 0, totalTime: seconds, sessions: 1, scoreTotal: score });
  next.totals.sessions += 1;
  const summary = { id: String(entry.id).slice(0, 120), type: "interview", category: "interview", difficulty, completedAt, accuracy: score, attempted: 1, averageTime: seconds, question: String(entry.question || "").slice(0, 500) };
  next.recentSessions = [summary, ...next.recentSessions].slice(0, 12);
  next.completedSessionIds = [...next.completedSessionIds, summary.id].slice(-SESSION_ID_LIMIT);
  recordExposure(next, [{ questionId: String(entry.questionId || entry.id).slice(0, 120) }]);
  const before = new Set(next.unlocked);
  next.unlocked = [...new Set([...next.unlocked, ...achievementIds(next, completedAt)])];
  return { progress: next, newlyUnlocked: next.unlocked.filter((id) => !before.has(id)), ignored: false };
}

export function dailyStreak(practiceDates, now = new Date()) {
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  if (!practiceDates[dateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (practiceDates[dateKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function heatmapDays(practiceDates, count = 98, now = new Date()) {
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - index - 1));
    const key = dateKey(date);
    const value = safeInteger(practiceDates[key], 10000);
    return { key, value, level: value === 0 ? 0 : value < 3 ? 1 : value < 6 ? 2 : value < 10 ? 3 : 4 };
  });
}

export function topicMastery(progress) {
  return Object.entries(progress.byTopic).map(([id, stats]) => {
    const recent = normaliseRecentTopic(stats.recent);
    const recentCorrect = recent.filter((item) => item.correct).length;
    const recentAccuracy = recent.length ? recentCorrect / recent.length * 100 : accuracy(stats);
    const pacedRecent = recent.filter((item) => item.targetSeconds !== null);
    const averageSeconds = pacedRecent.length ? pacedRecent.reduce((sum, item) => sum + item.seconds, 0) / pacedRecent.length : responseTime(stats);
    const averageTarget = pacedRecent.length ? pacedRecent.reduce((sum, item) => sum + item.targetSeconds, 0) / pacedRecent.length : null;
    const slowPenalty = averageTarget === null ? 0 : Math.min(12, Math.max(0, averageSeconds / averageTarget - 1) * 20);
    const performance = Math.max(0, recentAccuracy - slowPenalty);
    const confidence = Math.min(1, safeInteger(stats.attempted) / 10);
    const mastery = Math.round(50 + (performance - 50) * confidence);
    let trend = "steady";
    if (recent.length >= 6) {
      const earlier = recent.slice(-6, -3).filter((item) => item.correct).length;
      const later = recent.slice(-3).filter((item) => item.correct).length;
      if (later > earlier) trend = "improving";
      if (later < earlier) trend = "declining";
    }
    const targetTime = averageTarget === null ? null : Math.round(averageTarget);
    const opportunity = recentAccuracy >= 70
      ? averageTarget === null || averageSeconds <= averageTarget ? "accurate and fluent" : "accurate; build speed"
      : averageTarget !== null && averageSeconds <= averageTarget ? "fast; verify the rule" : "rebuild the method";
    return { id, ...stats, accuracy: accuracy(stats), recentAccuracy: Math.round(recentAccuracy), averageTime: Math.round(averageSeconds), targetTime, mastery, confidence: Math.round(confidence * 100), trend, opportunity };
  }).sort((left, right) => left.mastery - right.mastery || right.attempted - left.attempted);
}

export function spacedReviewQueue(progress, now = new Date()) {
  const reference = new Date(now);
  const referenceTime = Number.isFinite(reference.getTime()) ? reference.getTime() : Date.now();
  return topicMastery(progress).map((topic) => {
    const recent = normaliseRecentTopic(progress.byTopic?.[topic.id]?.recent);
    const category = topic.id.split(":")[0];
    const categorySession = (progress.recentSessions || []).find((session) => session.category === category || session.category === "mixed");
    const lastCompletedAt = [...recent].reverse().find((item) => item.completedAt)?.completedAt
      || safeOptionalDate(categorySession?.completedAt)
      || safeOptionalDate(progress.createdAt);
    const lastTime = lastCompletedAt ? new Date(lastCompletedAt).getTime() : referenceTime;
    // These compact intervals intentionally support retrieval practice rather
    // than claim a calibrated memory model: fragile topics return after two
    // days, developing topics after four, and stronger topics after one week.
    const intervalDays = topic.mastery >= 75 ? 7 : topic.mastery >= 60 ? 4 : 2;
    const dueTime = lastTime + intervalDays * 86_400_000;
    const daysSince = Math.max(0, Math.floor((referenceTime - lastTime) / 86_400_000));
    const overdueDays = Math.max(0, Math.floor((referenceTime - dueTime) / 86_400_000));
    return {
      ...topic,
      lastCompletedAt,
      intervalDays,
      dueAt: new Date(dueTime).toISOString(),
      daysSince,
      overdueDays,
      due: dueTime <= referenceTime,
    };
  }).sort((left, right) => Number(right.due) - Number(left.due) || right.overdueDays - left.overdueDays || left.mastery - right.mastery);
}

export function performanceByMode(progress) {
  return modes.map((mode) => {
    const stats = progress.byMode?.[mode] || emptyCategory();
    const performance = mode === "interview"
      ? (stats.attempted ? Math.round(stats.scoreTotal / stats.attempted) : 0)
      : accuracy(stats);
    return { id: mode, ...stats, performance, averageTime: responseTime(stats) };
  });
}

export function recentPerformanceTrend(progress) {
  const sessions = (progress.recentSessions || []).filter((session) => session.type !== "interview").slice(0, 6);
  if (sessions.length < 4) return { label: "Limited evidence", delta: null, sample: sessions.length };
  const midpoint = Math.ceil(sessions.length / 2);
  const recent = sessions.slice(0, midpoint);
  const earlier = sessions.slice(midpoint);
  const recentAverage = recent.reduce((sum, session) => sum + session.accuracy, 0) / recent.length;
  const earlierAverage = earlier.reduce((sum, session) => sum + session.accuracy, 0) / earlier.length;
  const delta = Math.round(recentAverage - earlierAverage);
  return { label: delta >= 5 ? "Improving" : delta <= -5 ? "Cooling" : "Steady", delta, sample: sessions.length };
}

export function exposureMetrics(progress) {
  return {
    recentQuestions: progress.exposure?.questionIds?.length || 0,
    recentPassages: progress.exposure?.passageIds?.length || 0,
    recentTemplates: progress.exposure?.templateIds?.length || 0,
  };
}

export function getSelectionContext(progress) {
  const mastery = topicMastery(progress);
  const dueTopics = spacedReviewQueue(progress).filter((topic) => topic.due).map((topic) => topic.id.split(":").slice(1).join(":"));
  return {
    recentQuestionIds: [...(progress.exposure?.questionIds || [])],
    recentPassageIds: [...(progress.exposure?.passageIds || [])],
    recentTemplateIds: [...(progress.exposure?.templateIds || [])],
    weakTopics: [...new Set([...dueTopics, ...mastery.slice(0, 8).map((item) => item.id.split(":").slice(1).join(":"))])].slice(0, 8),
    unansweredTopics: numericalTopics.filter((topic) => !progress.byTopic?.[`numerical:${topic}`]?.attempted),
  };
}

export function getRecommendations(progress, now = new Date()) {
  const reasoning = assessmentCategories.filter((category) => category.id !== "interview");
  const unattempted = reasoning.filter((category) => !progress.byCategory[category.id]?.attempted);
  if (unattempted.length) {
    return [
      { category: unattempted[0].id, difficulty: "foundation", timingProfile: "untimed", questionCount: 4, title: `Set a ${unattempted[0].label.toLowerCase()} baseline`, reason: hasReadinessEvidence(progress) ? "This category has no evidence yet. Start with a short Foundation set." : "Complete a practice session to generate your readiness estimate. Start with a short untimed Foundation set." },
      progress.interviewAnswers < 1
        ? { category: "interview", title: "Add one interview rep", reason: "A transcript-based practice answer broadens the estimate beyond multiple-choice work." }
        : { category: unattempted[1]?.id || reasoning[0].id, difficulty: "foundation", timingProfile: "untimed", questionCount: 4, title: "Broaden the evidence", reason: "An unpractised category currently limits the practice readiness estimate." },
    ];
  }
  const mastery = topicMastery(progress);
  const dueReview = spacedReviewQueue(progress, now).find((topic) => topic.due);
  const weakestTopic = mastery[0];
  const weakestCategory = weakestTopic?.id.split(":")[0] || reasoning.sort((left, right) => accuracy(progress.byCategory[left.id]) - accuracy(progress.byCategory[right.id]))[0].id;
  const stats = progress.byCategory[weakestCategory];
  const limitedEvidence = stats.attempted < 4;
  const slow = responseTime(stats) > 85;
  return [
    dueReview ? {
      category: dueReview.id.split(":")[0],
      difficulty: dueReview.mastery >= 60 ? "standard" : "foundation",
      timingProfile: dueReview.mastery >= 70 ? "standard" : "untimed",
      questionCount: 4,
      focusTopic: dueReview.id.split(":").slice(1).join(":"),
      title: `Review ${dueReview.id.split(":").slice(1).join(":").replaceAll("-", " ")}`,
      reason: `This topic is due after ${dueReview.daysSince} day${dueReview.daysSince === 1 ? "" : "s"}. A short retrieval set now is more useful than waiting for it to feel unfamiliar.`,
    } : {
      category: weakestCategory,
      difficulty: limitedEvidence || accuracy(stats) < 60 ? "foundation" : "standard",
      timingProfile: accuracy(stats) < 70 ? "untimed" : "standard",
      questionCount: 4,
      focusTopic: weakestTopic?.id.split(":").slice(1).join(":") || null,
      title: limitedEvidence ? "Gather more evidence" : `Revisit ${weakestCategory}`,
      reason: limitedEvidence ? "A single result is too fragile for a strong recommendation. Add a short set." : slow && accuracy(stats) >= 70 ? `Accuracy is ${accuracy(stats)}%, but average response time is ${responseTime(stats)}s. Practise the same rules with a measured pace target.` : `Current accuracy is ${accuracy(stats)}%. Use Foundation mode to isolate the rule before adding time pressure.`,
    },
    progress.interviewAnswers < 2
      ? { category: "interview", title: "Add a structured answer", reason: "Interview evidence is still limited; one more rep will make the practice profile broader." }
      : { category: mastery[1]?.id.split(":")[0] || "verbal", difficulty: "standard", timingProfile: "untimed", questionCount: 4, focusTopic: mastery[1]?.id.split(":").slice(1).join(":") || null, title: "Protect breadth", reason: "Keep a second topic active instead of concentrating all practice in one area." },
  ];
}

export function hasReadinessEvidence(progress) {
  const completedSessions = Math.max(
    safeInteger(progress?.totals?.sessions),
    Array.isArray(progress?.recentSessions) ? progress.recentSessions.length : 0,
  );
  const hasRecordedCategoryEvidence = assessmentCategories.some((category) => safeInteger(progress?.byCategory?.[category.id]?.attempted) > 0);
  return completedSessions >= MIN_READINESS_SESSIONS && hasRecordedCategoryEvidence;
}

export function estimatedReadiness(progress) {
  if (!hasReadinessEvidence(progress)) return null;
  const active = assessmentCategories.filter((category) => progress.byCategory[category.id]?.attempted > 0);
  const quality = active.reduce((sum, category) => sum + categoryPerformance(progress.byCategory[category.id], category.id), 0) / active.length;
  const breadth = active.length / assessmentCategories.length;
  const evidence = Math.min(1, (progress.totals.attempted + progress.interviewAnswers * 3) / 60);
  return Math.max(8, Math.min(99, Math.round(8 + breadth * 18 + evidence * 24 + quality * 0.5 * evidence)));
}
