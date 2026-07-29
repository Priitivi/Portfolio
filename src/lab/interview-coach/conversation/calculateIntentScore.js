import { normaliseInput, stemToken, tokeniseInput } from "./normaliseInput.js";

const SIMILARITY_STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "are",
  "can",
  "could",
  "do",
  "does",
  "for",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "of",
  "on",
  "please",
  "that",
  "the",
  "this",
  "to",
  "what",
  "when",
  "which",
  "who",
  "would",
  "you",
  "your",
]);

function editDistance(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = previous[rightIndex - 1]
        + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        substitution,
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function phrasePresent(text, phrase) {
  const normalisedPhrase = normaliseInput(phrase).meaningful;
  return normalisedPhrase && (` ${text} `).includes(` ${normalisedPhrase} `);
}

function fuzzyTokenPresent(tokens, expected) {
  if (expected.length < 5) return false;
  return tokens.some((token) => {
    if (Math.abs(token.length - expected.length) > 1) return false;
    return editDistance(token, expected) <= 1;
  });
}

function signalPresent(normalised, signal) {
  const expectedTokens = normaliseInput(signal).tokens;
  if (expectedTokens.length > 1) return phrasePresent(normalised.meaningful, signal);
  const expected = expectedTokens[0] || signal;
  return normalised.tokens.includes(expected)
    || normalised.stems.includes(stemToken(expected))
    || fuzzyTokenPresent(normalised.tokens, expected);
}

function exampleSimilarity(inputStems, example) {
  const exampleTokens = tokeniseInput(normaliseInput(example).meaningful)
    .map(stemToken)
    .filter((token) => !SIMILARITY_STOP_WORDS.has(token));
  const filteredInput = inputStems.filter((token) => !SIMILARITY_STOP_WORDS.has(token));
  if (!exampleTokens.length || !filteredInput.length) return 0;
  const inputSet = new Set(filteredInput);
  const exampleSet = new Set(exampleTokens);
  const overlap = [...exampleSet].filter((token) => inputSet.has(token)).length;
  const precision = overlap / inputSet.size;
  const recall = overlap / exampleSet.size;
  return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
}

export function calculateIntentScore(intent, normalised, options = {}) {
  const {
    contextIntent = null,
    contextTopic = null,
    referenceDetected = false,
    hasExplicitAnchor = false,
    answeredCounts = {},
  } = options;
  const matchedSignals = [];
  const tokenSet = new Set(normalised.tokens);
  const stemSet = new Set(normalised.stems);
  let score = 0;

  for (const phrase of intent.phrases || []) {
    if (phrasePresent(normalised.meaningful, phrase)) {
      score += Math.min(6.5, 3.5 + normaliseInput(phrase).tokens.length * 0.55);
      matchedSignals.push(`phrase:${phrase}`);
    }
  }

  for (const keyword of intent.keywords || []) {
    const expected = normaliseInput(keyword).tokens[0] || keyword;
    const stem = stemToken(expected);
    if (tokenSet.has(expected) || stemSet.has(stem)) {
      score += 1.7;
      matchedSignals.push(`keyword:${keyword}`);
    } else if (fuzzyTokenPresent(normalised.tokens, expected)) {
      score += 0.85;
      matchedSignals.push(`fuzzy:${keyword}`);
    }
  }

  for (const synonymGroup of intent.synonyms || []) {
    const match = synonymGroup.find((synonym) =>
      synonym.includes(" ")
        ? phrasePresent(normalised.meaningful, synonym)
        : stemSet.has(stemToken(normaliseInput(synonym).tokens[0] || synonym)));
    if (match) {
      score += 2.1;
      matchedSignals.push(`synonym:${match}`);
    }
  }

  const bestExample = Math.max(
    0,
    ...(intent.examples || []).map((example) => exampleSimilarity(normalised.stems, example)),
  );
  if (bestExample >= 0.34) {
    score += bestExample * 5.2;
    matchedSignals.push(`example:${bestExample.toFixed(2)}`);
  }

  if (intent.questionWords?.some((word) => normalised.questionWords.includes(word))) {
    score += 0.8;
    matchedSignals.push("question-word");
  }

  const missingRequired = referenceDetected && contextIntent === intent.id
    ? []
    : (intent.requiredSignals || []).filter((group) =>
      !group.some((signal) => signalPresent(normalised, signal)));
  if (missingRequired.length) {
    score -= missingRequired.length * 4.5;
  }

  for (const signal of intent.negativeSignals || []) {
    if (signalPresent(normalised, signal)) {
      score -= 3.8;
      matchedSignals.push(`negative:${signal}`);
    }
  }

  if (referenceDetected && contextIntent === intent.id) {
    score += hasExplicitAnchor ? 2.4 : 13.5;
    matchedSignals.push("context:intent");
  } else if (referenceDetected && contextTopic && contextTopic === intent.topicId) {
    score += 3.4;
    matchedSignals.push("context:topic");
  }

  const priorAnswers = answeredCounts[intent.id] || 0;
  if (priorAnswers > 0 && !referenceDetected) {
    score -= Math.min(1.5, priorAnswers * 0.45);
    matchedSignals.push("repetition-penalty");
  }

  score += (intent.priority || 0) * 0.08;

  return {
    intentId: intent.id,
    topicId: intent.topicId || intent.id,
    score: Math.max(0, score),
    matchedSignals,
  };
}
