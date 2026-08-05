import { assessmentCategories } from "../data/packs.js";

export const STORAGE_KEY = "priit-lab:graduate-assessment:v1";
export const PROGRESS_VERSION = 2;
const SESSION_ID_LIMIT = 200;
const RECENT_TOPIC_LIMIT = 20;
const categoryIds = new Set(assessmentCategories.map((category) => category.id));

export const achievements = [
  { id: "first-rep", title: "First rep", description: "Complete your first reasoning practice session.", icon: "01" },
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
    targetSeconds: Math.max(1, Math.min(600, safeInteger(item?.targetSeconds) || 75)),
    completedAt: safeDate(item?.completedAt),
  }));
}

function normaliseSummary(item) {
  if (!item || typeof item.id !== "string" || !item.id.trim() || !categoryIds.has(item.category)) return null;
  return {
    id: item.id.slice(0, 120),
    type: item.type === "interview" ? "interview" : "practice",
    category: item.category,
    difficulty: ["foundation", "standard", "advanced"].includes(item.difficulty) ? item.difficulty : "standard",
    completedAt: safeDate(item.completedAt),
    accuracy: Math.max(0, Math.min(100, Math.round(safeNumber(item.accuracy, 100)))),
    attempted: Math.max(1, safeInteger(item.attempted) || 1),
    averageTime: safeInteger(item.averageTime, 3600),
    ...(typeof item.question === "string" ? { question: item.question.slice(0, 500) } : {}),
  };
}

export function createInitialProgress() {
  return {
    version: PROGRESS_VERSION,
    createdAt: new Date().toISOString(),
    totals: { attempted: 0, correct: 0, totalTime: 0, sessions: 0, scoreTotal: 0 },
    byCategory: Object.fromEntries(assessmentCategories.map((category) => [category.id, emptyCategory()])),
    byTopic: {},
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
    byTopic,
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
    if (![1, PROGRESS_VERSION].includes(parsed?.version) || !parsed.totals || !parsed.byCategory) return createInitialProgress();
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

function achievementIds(progress, referenceDate = new Date()) {
  const session = progress.recentSessions[0];
  const activeCategories = Object.values(progress.byCategory).filter((item) => item.attempted > 0).length;
  const unlocked = [];
  if (progress.recentSessions.some((item) => item.type === "practice")) unlocked.push("first-rep");
  if (progress.totals.attempted >= 100) unlocked.push("century");
  if (session?.accuracy === 100 && session?.attempted >= 2 && session?.type === "practice") unlocked.push("clean-sheet");
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

export function recordPracticeSession(progress, session) {
  if (!session?.id || !Array.isArray(session.answers) || !session.answers.length || !categoryIds.has(session.category) || session.category === "interview") return unchangedResult(progress);
  const next = normaliseProgress(progress);
  if (next.completedSessionIds.includes(session.id)) return { progress: next, newlyUnlocked: [], ignored: true };
  const completedAt = safeDate(session.completedAt);
  const answers = session.answers.map((item) => ({
    questionId: String(item?.questionId || "unknown").slice(0, 120),
    topic: String(item?.topic || "general").slice(0, 80),
    correct: Boolean(item?.correct),
    seconds: Math.max(1, Math.min(3600, safeInteger(item?.seconds) || 1)),
  }));
  const attempted = answers.length;
  const correct = answers.filter((item) => item.correct).length;
  const totalTime = answers.reduce((sum, item) => sum + item.seconds, 0);
  const currentDate = dateKey(completedAt);
  const categoryStats = next.byCategory[session.category] || emptyCategory();
  next.totals = { ...next.totals, attempted: next.totals.attempted + attempted, correct: next.totals.correct + correct, totalTime: next.totals.totalTime + totalTime, sessions: next.totals.sessions + 1 };
  next.byCategory[session.category] = { ...categoryStats, attempted: categoryStats.attempted + attempted, correct: categoryStats.correct + correct, totalTime: categoryStats.totalTime + totalTime, sessions: categoryStats.sessions + 1 };
  const targetSeconds = { foundation: 105, standard: 75, advanced: 55 }[session.difficulty] || 75;
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
  const summary = { id: String(session.id).slice(0, 120), type: "practice", category: session.category, difficulty: session.difficulty, completedAt, accuracy: Math.round(correct / attempted * 100), attempted, averageTime: Math.round(totalTime / attempted) };
  next.recentSessions = [summary, ...next.recentSessions].slice(0, 12);
  next.completedSessionIds = [...next.completedSessionIds, summary.id].slice(-SESSION_ID_LIMIT);
  let running = 0;
  let best = next.bestAnswerStreak;
  answers.forEach((item) => { running = item.correct ? running + 1 : 0; best = Math.max(best, running); });
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
  next.totals.sessions += 1;
  const summary = { id: String(entry.id).slice(0, 120), type: "interview", category: "interview", difficulty: entry.difficulty, completedAt, accuracy: score, attempted: 1, averageTime: seconds, question: String(entry.question || "").slice(0, 500) };
  next.recentSessions = [summary, ...next.recentSessions].slice(0, 12);
  next.completedSessionIds = [...next.completedSessionIds, summary.id].slice(-SESSION_ID_LIMIT);
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
    const averageSeconds = recent.length ? recent.reduce((sum, item) => sum + item.seconds, 0) / recent.length : responseTime(stats);
    const averageTarget = recent.length ? recent.reduce((sum, item) => sum + item.targetSeconds, 0) / recent.length : 75;
    const slowPenalty = Math.min(12, Math.max(0, averageSeconds / averageTarget - 1) * 20);
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
    return { id, ...stats, accuracy: accuracy(stats), recentAccuracy: Math.round(recentAccuracy), averageTime: Math.round(averageSeconds), mastery, confidence: Math.round(confidence * 100), trend };
  }).sort((left, right) => left.mastery - right.mastery || right.attempted - left.attempted);
}

export function getRecommendations(progress) {
  const reasoning = assessmentCategories.filter((category) => category.id !== "interview");
  const unattempted = reasoning.filter((category) => !progress.byCategory[category.id]?.attempted);
  if (unattempted.length) {
    return [
      { category: unattempted[0].id, title: `Set a ${unattempted[0].label.toLowerCase()} baseline`, reason: "No evidence yet. Start with a short Foundation set before interpreting readiness." },
      progress.interviewAnswers < 1
        ? { category: "interview", title: "Add one interview rep", reason: "A transcript-based practice answer broadens the estimate beyond multiple-choice work." }
        : { category: unattempted[1]?.id || reasoning[0].id, title: "Broaden the evidence", reason: "An unpractised category currently limits the practice readiness estimate." },
    ];
  }
  const mastery = topicMastery(progress);
  const weakestTopic = mastery[0];
  const weakestCategory = weakestTopic?.id.split(":")[0] || reasoning.sort((left, right) => accuracy(progress.byCategory[left.id]) - accuracy(progress.byCategory[right.id]))[0].id;
  const stats = progress.byCategory[weakestCategory];
  const limitedEvidence = stats.attempted < 4;
  const slow = responseTime(stats) > 85;
  return [
    {
      category: weakestCategory,
      title: limitedEvidence ? "Gather more evidence" : `Revisit ${weakestCategory}`,
      reason: limitedEvidence ? "A single result is too fragile for a strong recommendation. Add a short set." : slow && accuracy(stats) >= 70 ? `Accuracy is ${accuracy(stats)}%, but average response time is ${responseTime(stats)}s. Practise the same rules with a measured pace target.` : `Current accuracy is ${accuracy(stats)}%. Use Foundation mode to isolate the rule before adding time pressure.`,
    },
    progress.interviewAnswers < 2
      ? { category: "interview", title: "Add a structured answer", reason: "Interview evidence is still limited; one more rep will make the practice profile broader." }
      : { category: mastery[1]?.id.split(":")[0] || "verbal", title: "Protect breadth", reason: "Keep a second topic active instead of concentrating all practice in one area." },
  ];
}

export function estimatedReadiness(progress) {
  const active = assessmentCategories.filter((category) => progress.byCategory[category.id]?.attempted > 0);
  if (!active.length) return 8;
  const quality = active.reduce((sum, category) => sum + categoryPerformance(progress.byCategory[category.id], category.id), 0) / active.length;
  const breadth = active.length / assessmentCategories.length;
  const evidence = Math.min(1, (progress.totals.attempted + progress.interviewAnswers * 3) / 60);
  return Math.max(8, Math.min(99, Math.round(8 + breadth * 18 + evidence * 24 + quality * 0.5 * evidence)));
}
