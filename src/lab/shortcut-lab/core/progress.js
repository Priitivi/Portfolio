import { challenges, challengeById, challengesForCategory } from "../data/challenges.js";

export const STORAGE_KEY = "priit-shortcut-lab-v1";

export const defaultProgress = {
  onboardingComplete: false,
  platform: null,
  sound: false,
  motion: "full",
  textScale: "regular",
  mastery: {},
  bestScores: {},
  daily: {},
  lastMode: null,
};

export function parsePersistedProgress(raw) {
  if (!raw) return { ...defaultProgress };
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return { ...defaultProgress };
    return {
      ...defaultProgress,
      ...value,
      mastery: value.mastery && typeof value.mastery === "object" ? value.mastery : {},
      bestScores: value.bestScores && typeof value.bestScores === "object" ? value.bestScores : {},
      daily: value.daily && typeof value.daily === "object" ? value.daily : {},
    };
  } catch {
    return { ...defaultProgress };
  }
}

export function readProgress(storage = globalThis.localStorage) {
  try { return parsePersistedProgress(storage?.getItem(STORAGE_KEY)); }
  catch { return { ...defaultProgress }; }
}

export function writeProgress(progress, storage = globalThis.localStorage) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
}

export function createScoreState() {
  return {
    score: 0,
    correct: 0,
    incorrect: 0,
    combo: 0,
    bestCombo: 0,
    reactionTotal: 0,
    fastest: null,
    timeline: [],
  };
}

export function applyAttempt(score, { correct, responseMs = 0, points = 100, hinted = false }) {
  if (!correct) {
    return {
      ...score,
      incorrect: score.incorrect + 1,
      combo: 0,
      timeline: [...score.timeline, { correct: false, responseMs }],
    };
  }
  const nextCombo = score.combo + 1;
  const speedBonus = responseMs < 1000 ? 1.45 : responseMs < 2000 ? 1.2 : responseMs < 4000 ? 1 : .8;
  const comboBonus = 1 + Math.min(nextCombo, 10) * .05;
  const hintPenalty = hinted ? .7 : 1;
  return {
    ...score,
    score: score.score + Math.round(points * speedBonus * comboBonus * hintPenalty),
    correct: score.correct + 1,
    combo: nextCombo,
    bestCombo: Math.max(score.bestCombo, nextCombo),
    reactionTotal: score.reactionTotal + responseMs,
    fastest: score.fastest === null ? responseMs : Math.min(score.fastest, responseMs),
    timeline: [...score.timeline, { correct: true, responseMs }],
  };
}

export function scoreMetrics(score) {
  const attempts = score.correct + score.incorrect;
  return {
    accuracy: attempts ? Math.round((score.correct / attempts) * 100) : 100,
    averageReaction: score.correct ? Math.round(score.reactionTotal / score.correct) : 0,
  };
}

export function updateMastery(mastery, challengeId, { correct, responseMs = 0, hinted = false, now = Date.now() }) {
  const previous = mastery[challengeId] || {
    attempts: 0,
    correctAttempts: 0,
    averageResponseTime: 0,
    lastPractised: null,
    level: 0,
    consecutiveCorrect: 0,
  };
  const attempts = previous.attempts + 1;
  const correctAttempts = previous.correctAttempts + (correct ? 1 : 0);
  const timedAttempts = previous.attempts || 0;
  const averageResponseTime = Math.round(((previous.averageResponseTime * timedAttempts) + responseMs) / attempts);
  const consecutiveCorrect = correct ? previous.consecutiveCorrect + 1 : 0;
  const quality = correct && !hinted && responseMs < 3500;
  const level = Math.max(0, Math.min(5, previous.level + (quality ? (consecutiveCorrect >= 2 ? 1 : 0) : -1)));
  return {
    ...mastery,
    [challengeId]: { attempts, correctAttempts, averageResponseTime, lastPractised: now, level, consecutiveCorrect },
  };
}

function hashDate(dateKey) {
  let hash = 2166136261;
  for (const char of dateKey) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = seed || 1;
  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyChallengeIds(date = new Date(), count = 10) {
  const random = seededRandom(hashDate(dateKey(date)));
  return [...challenges]
    .sort(() => random() - .5)
    .slice(0, count)
    .map((challenge) => challenge.id);
}

function weaknessWeight(challenge, mastery) {
  const record = mastery[challenge.id];
  if (!record) return 8;
  const accuracy = record.attempts ? record.correctAttempts / record.attempts : 0;
  const ageDays = record.lastPractised ? (Date.now() - record.lastPractised) / 86400000 : 30;
  return Math.max(1, (1 - accuracy) * 8 + Math.max(0, 4 - record.level) + Math.min(ageDays / 5, 4));
}

export function buildAdaptiveQueue({ category = "mixed", mastery = {}, count = 25 }) {
  const pool = challengesForCategory(category);
  const weighted = pool.flatMap((challenge) => Array(Math.ceil(weaknessWeight(challenge, mastery))).fill(challenge));
  const queue = [];
  let cursor = 0;
  const offset = pool.length ? Math.floor(Date.now() / 60000) % weighted.length : 0;
  while (queue.length < count && weighted.length) {
    const candidate = weighted[(offset + cursor * 7) % weighted.length];
    if (queue.at(-1)?.id !== candidate.id || pool.length === 1) queue.push(candidate);
    cursor += 1;
  }
  return queue;
}

export function resolveChallengeIds(ids) {
  return ids.map((id) => challengeById[id]).filter(Boolean);
}

export function masterySummary(mastery) {
  const records = Object.entries(mastery);
  const learned = records.filter(([, record]) => record.level >= 2).length;
  const mastered = records.filter(([, record]) => record.level >= 4).length;
  const attempts = records.reduce((total, [, record]) => total + record.attempts, 0);
  const correct = records.reduce((total, [, record]) => total + record.correctAttempts, 0);
  return { learned, mastered, attempts, accuracy: attempts ? Math.round(correct / attempts * 100) : 0 };
}
