const STAR_PATTERNS = {
  situation: /\b(?:situation|context|when|during|at the time|project|team|course|placement|work)\b/i,
  task: /\b(?:task|goal|objective|challenge|responsib|needed to|had to|was asked|priority)\w*/i,
  action: /\b(?:i|my)\s+(?:analysed|analyzed|asked|built|changed|chose|contacted|created|decided|designed|developed|drafted|escalated|explained|led|made|mapped|negotiated|organised|organized|planned|prioritised|prioritized|proposed|reviewed|spoke|tested|worked)\b/i,
  result: /\b(?:result|outcome|impact|improved|reduced|increased|delivered|saved|completed|achieved|learned|meant that|as a result|eventually)\b/i,
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function specificitySignals(raw) {
  const signals = new Set();
  for (const match of raw.matchAll(/\b\d+(?:[.,]\d+)?%?\b/g)) signals.add(match[0].toLowerCase());
  for (const match of raw.matchAll(/\b(?:one|two|three|four|five|six|seven|eight|nine|ten)[\s-]+(?:[a-z-]+\s+){0,2}(?:day|week|month|hour|person|people|customer|user|issue|item|project|team)s?\b/gi)) signals.add(match[0].toLowerCase());
  return [...signals];
}

export function countdownStep(current) {
  const safe = Math.max(0, Math.floor(Number(current) || 0));
  return { remaining: Math.max(0, safe - 1), expired: safe <= 1 };
}

export function remainingFromDeadline(deadline, now = Date.now()) {
  const target = Number(deadline);
  const current = Number(now);
  if (!Number.isFinite(target) || !Number.isFinite(current)) return 0;
  return Math.max(0, Math.ceil((target - current) / 1000));
}

export function selectInterviewQuestion(items, difficulty, excludedIds = [], random = Math.random) {
  const matching = items.filter((item) => item.difficulty === difficulty);
  const excluded = new Set(excludedIds);
  const fresh = matching.filter((item) => !excluded.has(item.id));
  const pool = fresh.length ? fresh : matching;
  if (!pool.length) return items[0] || null;
  return pool[Math.floor(Math.max(0, Math.min(0.999999, random())) * pool.length)];
}

export function analyseInterviewAnswer(answer) {
  const raw = String(answer || "").trim();
  if (!raw) {
    return {
      total: 0,
      wordCount: 0,
      metrics: { clarity: 0, organisation: 0, star: 0, completeness: 0 },
      star: { situation: false, task: false, action: false, result: false },
      specifics: 0,
      observations: ["No transcript text was captured."],
      feedback: ["Add a typed or browser-generated transcript before using the structural feedback."],
      limitations: ["No speaking delivery, confidence, emotion, pronunciation or body-language information is available."],
    };
  }

  const text = raw.toLowerCase();
  const words = raw.split(/\s+/).filter(Boolean);
  const sentences = raw.split(/[.!?]+/).filter((part) => part.trim().length > 0);
  const paragraphs = raw.split(/\n+/).filter((part) => part.trim().length > 0);
  const star = Object.fromEntries(Object.entries(STAR_PATTERNS).map(([key, pattern]) => [key, pattern.test(raw)]));
  const starCoverage = Object.values(star).filter(Boolean).length;
  const specificity = specificitySignals(raw);
  const firstPersonActions = (text.match(/\b(?:i|my)\s+(?:analysed|analyzed|asked|built|changed|chose|created|decided|designed|developed|escalated|explained|led|made|mapped|negotiated|organised|organized|planned|prioritised|prioritized|proposed|reviewed|spoke|tested|worked)\b/g) || []).length;
  const fillerCount = (text.match(/\b(?:basically|obviously|just|like|you know|sort of|kind of)\b/g) || []).length;
  const averageSentenceLength = sentences.length ? words.length / sentences.length : words.length;
  const shortPenalty = words.length < 45 ? (45 - words.length) * 0.65 : 0;
  const longPenalty = words.length > 220 ? Math.min(45, (words.length - 220) * 0.25) : 0;
  const sentencePenalty = averageSentenceLength > 35 ? Math.min(18, (averageSentenceLength - 35) * 0.7) : 0;

  const clarity = clamp(55 + Math.min(sentences.length, 8) * 3 + Math.min(specificity.length, 3) * 4 - fillerCount * 4 - shortPenalty - longPenalty - sentencePenalty);
  const organisation = clamp(34 + starCoverage * 11 + Math.min(paragraphs.length, 3) * 5 + (sentences.length >= 4 ? 8 : 0) - longPenalty * 0.45);
  const starScore = clamp(starCoverage * 20 + Math.min(firstPersonActions, 3) * 5 + (star.result && specificity.length ? 5 : 0));
  const completeness = clamp(25 + Math.min(words.length, 140) * 0.35 + Math.min(specificity.length, 3) * 6 - longPenalty * 1.5);
  const total = clamp((clarity + organisation + starScore + completeness) / 4);

  const observations = [
    `${words.length} transcript words across ${sentences.length} sentence${sentences.length === 1 ? "" : "s"}.`,
    `${starCoverage} of 4 STAR-related text signals detected.`,
    `${specificity.length} concrete number or quantity signal${specificity.length === 1 ? "" : "s"} detected.`,
  ];
  const feedback = [];
  if (words.length < 45) feedback.push("Add enough context and action detail for a reader to follow the decision, not only the outcome.");
  if (words.length > 260) feedback.push("Consider cutting repeated context or secondary detail so the main decision and result are easier to locate.");
  if (!star.situation || !star.task) feedback.push("Consider opening with a compact situation and the specific task, goal or tension you faced.");
  if (!star.action || firstPersonActions === 0) feedback.push("Make your personal contribution explicit with the decisions or actions you owned.");
  if (!star.result) feedback.push("Close the loop with the observable result or what you learned; STAR is a guide, not a required script.");
  if (!specificity.length) feedback.push("Consider adding one concrete detail such as scale, time, audience or measurable outcome.");
  if (fillerCount > 2 || sentencePenalty > 0) feedback.push("Review long sentences and filler phrases in the transcript; shorter clauses may improve readability.");
  if (!feedback.length) feedback.push("The transcript contains a clear structural evidence trail. A human listener can now review relevance and delivery.");

  return {
    total,
    wordCount: words.length,
    metrics: { clarity, organisation, star: starScore, completeness },
    star,
    specifics: specificity.length,
    observations,
    feedback: feedback.slice(0, 4),
    limitations: [
      "Scores are text heuristics, not validated recruitment measures.",
      "Speaking delivery, confidence, emotion, pronunciation and body language are not assessed.",
      "Only the transcript is available; recognition errors may change the detected evidence.",
    ],
  };
}
