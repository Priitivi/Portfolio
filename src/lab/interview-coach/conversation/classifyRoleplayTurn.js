import { calculateIntentScore } from "./calculateIntentScore.js";
import { detectAmbiguity } from "./detectAmbiguity.js";
import { roleplayIntentDefinitions } from "./intentDefinitions.js";
import { normaliseInput } from "./normaliseInput.js";
import { resolveContextualFollowUp } from "./resolveContextualFollowUp.js";

const SPECIAL_PATTERNS = {
  coaching: [
    /what should i ask/,
    /what question should i/,
    /help me (?:run|structure|with) (?:the|this) interview/,
    /coach me/,
    /how am i doing/,
    /give me feedback/,
    /best question/,
  ],
  revealAll: [
    /tell me everything/,
    /give me all (?:the )?(?:details|answers|information)/,
    /reveal (?:all|the hidden)/,
    /hidden (?:details|answers|scenario|information)/,
    /ignore (?:the|your) (?:role|rules|instructions)/,
    /system prompt/,
    /show me (?:the )?intent/,
  ],
  offTopic: [
    /weather/,
    /football/,
    /sports score/,
    /politics/,
    /tell me a joke/,
    /recipe/,
    /personal phone/,
    /personal email/,
    /home address/,
  ],
};

const BROAD_PATTERNS = [
  /^tell me about (?:it|that|everything)$/,
  /^explain (?:it|everything)$/,
  /^what about (?:it|that)$/,
  /^tell me all about smart rebook$/,
  /^what can you tell me$/,
];

function answeredCounts(turns = []) {
  return turns.reduce((counts, turn) => {
    if (turn.primaryIntent && !turn.clarificationNeeded) {
      counts[turn.primaryIntent] = (counts[turn.primaryIntent] || 0) + 1;
    }
    return counts;
  }, {});
}

function confidenceForScore(score) {
  if (!score) return 0;
  return Number(Math.min(0.98, 0.34 + (score / (score + 5.5)) * 0.64).toFixed(2));
}

function specialResult(normalised, type) {
  return {
    primaryIntent: null,
    secondaryIntents: [],
    confidence: type === "empty" ? 1 : 0.98,
    contextUsed: false,
    clarificationNeeded: true,
    clarificationType: type,
    matchedSignals: [`special:${type}`],
    referenceKind: null,
    topicId: null,
    inputType: type,
    normalisedInput: normalised.meaningful,
  };
}

export function classifyRoleplayTurn(input, context = {}) {
  const normalised = normaliseInput(input);
  if (!normalised.meaningful) return specialResult(normalised, "empty");

  for (const [type, patterns] of Object.entries(SPECIAL_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(normalised.meaningful))) {
      return specialResult(normalised, type);
    }
  }
  if (BROAD_PATTERNS.some((pattern) => pattern.test(normalised.meaningful))) {
    return specialResult(normalised, "broad");
  }

  const contextResolution = resolveContextualFollowUp(normalised, context);
  const counts = answeredCounts(context.turns);
  const hasMultiIntentConnector = /\b(and|also|as well as|plus|along with)\b/.test(normalised.expanded);
  const firstClause = hasMultiIntentConnector
    ? normalised.expanded.split(/\b(?:and|also|as well as|plus|along with)\b/)[0]
    : "";
  const candidates = roleplayIntentDefinitions
    .map((intent) => calculateIntentScore(intent, normalised, {
      ...contextResolution,
      answeredCounts: counts,
    }))
    .map((candidate) => {
      if (!firstClause) return candidate;
      const firstClauseScore = calculateIntentScore(
        roleplayIntentDefinitions.find((intent) => intent.id === candidate.intentId),
        normaliseInput(firstClause),
      ).score;
      return {
        ...candidate,
        score: candidate.score + Math.min(2, firstClauseScore * 0.28),
        matchedSignals: firstClauseScore >= 3
          ? [...candidate.matchedSignals, "multi-intent:first-clause"]
          : candidate.matchedSignals,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);

  const ambiguity = detectAmbiguity({
    candidates,
    hasMultiIntentConnector,
    referenceDetected: contextResolution.referenceDetected,
    previousTurn: contextResolution.previousTurn,
    hasExplicitAnchor: contextResolution.hasExplicitAnchor,
  });
  const primary = candidates[0] || null;
  const secondaryIntents = hasMultiIntentConnector
    ? candidates
      .slice(1)
      .filter((candidate) =>
        candidate.score >= Math.max(3.8, (primary?.score || 0) * 0.68)
        && candidate.intentId !== primary?.intentId)
      .slice(0, 2)
      .map((candidate) => candidate.intentId)
    : [];

  return {
    primaryIntent: ambiguity.clarificationNeeded ? null : primary?.intentId || null,
    secondaryIntents: ambiguity.clarificationNeeded ? [] : secondaryIntents,
    confidence: confidenceForScore(primary?.score || 0),
    contextUsed: Boolean(
      contextResolution.referenceDetected
      && contextResolution.previousTurn
      && primary?.matchedSignals.some((signal) => signal.startsWith("context:")),
    ),
    clarificationNeeded: ambiguity.clarificationNeeded,
    clarificationType: ambiguity.clarificationType,
    matchedSignals: primary?.matchedSignals || [],
    referenceKind: contextResolution.referenceKind,
    topicId: ambiguity.clarificationNeeded ? null : primary?.topicId || null,
    inputType: "question",
    normalisedInput: normalised.meaningful,
    candidateScores: candidates.slice(0, 4).map(({ intentId, topicId, score }) => ({
      intentId,
      topicId,
      score: Number(score.toFixed(2)),
    })),
  };
}
