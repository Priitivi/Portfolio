import { roleplayIntentById } from "./intentDefinitions.js";
import {
  boundaryResponses,
  MIXED_SCENARIO_SOURCE_TYPE,
  roleplayResponseLibrary,
  sourceTypesForReferences,
} from "../data/roleplayResponses.js";

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function selectVariant(variants, seed, previousResponseId, idPrefix) {
  if (variants.length === 1) {
    return { text: variants[0], responseId: `${idPrefix}-0` };
  }
  let index = stableHash(seed) % variants.length;
  if (`${idPrefix}-${index}` === previousResponseId) {
    index = (index + 1) % variants.length;
  }
  return { text: variants[index], responseId: `${idPrefix}-${index}` };
}

function previousResponse(roleplay = {}) {
  return [...(roleplay.turns || [])]
    .reverse()
    .find((turn) => turn.responseId);
}

function occurrences(roleplay, intentId) {
  return (roleplay.turns || []).filter((turn) =>
    turn.primaryIntent === intentId && !turn.clarificationNeeded).length;
}

function detailLevelFor(classification, roleplay) {
  const priorOccurrences = occurrences(roleplay, classification.primaryIntent);
  const contextualDepth = classification.contextUsed
    && ["elaboration", "next", "actor", "reason", "measurement", "process", "customer", "pronoun"]
      .includes(classification.referenceKind)
    ? 1
    : 0;
  return Math.min(2, priorOccurrences + contextualDepth);
}

function sourceMetadata(sourceRefs) {
  const sourceTypes = sourceTypesForReferences(sourceRefs);
  return {
    sourceRefs,
    sourceTypes,
    sourceType: sourceTypes.length === 1 ? sourceTypes[0] : MIXED_SCENARIO_SOURCE_TYPE,
  };
}

function boundaryResult(classification, roleplay) {
  const boundaryKey = classification.clarificationType || classification.inputType || "lowConfidence";
  const boundary = boundaryResponses[boundaryKey] || boundaryResponses.lowConfidence;
  const previous = previousResponse(roleplay);
  const selected = selectVariant(
    boundary.variants,
    `${classification.normalisedInput}:${(roleplay.turns || []).length}`,
    previous?.responseId,
    `boundary-${boundaryKey}`,
  );
  return {
    intent: "unknown",
    intents: [],
    answeredIntents: [],
    response: selected.text,
    responseId: selected.responseId,
    detailLevel: 0,
    classification,
    ...sourceMetadata(boundary.sourceRefs),
  };
}

export function selectRoleplayResponse(classification, roleplay = {}) {
  if (classification.clarificationNeeded || !classification.primaryIntent) {
    return boundaryResult(classification, roleplay);
  }

  const libraryEntry = roleplayResponseLibrary[classification.primaryIntent];
  if (!libraryEntry) return boundaryResult({
    ...classification,
    primaryIntent: null,
    clarificationNeeded: true,
    clarificationType: "lowConfidence",
  }, roleplay);

  const detailLevel = detailLevelFor(classification, roleplay);
  const previous = previousResponse(roleplay);
  const variants = libraryEntry.levels[detailLevel] || libraryEntry.levels.at(-1);
  const selected = selectVariant(
    variants,
    `${classification.normalisedInput}:${classification.primaryIntent}:${detailLevel}:${(roleplay.turns || []).length}`,
    previous?.responseId,
    `${classification.primaryIntent}-${detailLevel}`,
  );

  const primaryTopic = roleplayIntentById[classification.primaryIntent]?.topicId;
  const relatedSecondary = classification.secondaryIntents.find((intentId) =>
    roleplayIntentById[intentId]?.topicId === primaryTopic
    && roleplayResponseLibrary[intentId]);
  const unrelatedSecondary = classification.secondaryIntents.find((intentId) =>
    roleplayIntentById[intentId]?.topicId !== primaryTopic);
  let response = selected.text;
  let responseId = selected.responseId;
  let sourceRefs = [...libraryEntry.sourceRefs];
  const answeredIntents = [classification.primaryIntent];
  if (relatedSecondary) {
    const secondaryEntry = roleplayResponseLibrary[relatedSecondary];
    const secondarySelection = selectVariant(
      secondaryEntry.levels[0],
      `${classification.normalisedInput}:${relatedSecondary}:related`,
      previous?.responseId,
      `${relatedSecondary}-0`,
    );
    response += ` ${secondarySelection.text}`;
    responseId += `+${secondarySelection.responseId}`;
    sourceRefs = [...new Set([...sourceRefs, ...secondaryEntry.sourceRefs])];
    answeredIntents.push(relatedSecondary);
  }
  if (unrelatedSecondary) {
    const secondaryLabel = roleplayIntentById[unrelatedSecondary]?.topicId
      ?.replaceAll("-", " ");
    response += ` You also asked about ${secondaryLabel}; I have kept this answer to the primary question so the two topics do not get mixed together.`;
  }

  return {
    intent: classification.primaryIntent,
    intents: [classification.primaryIntent, ...classification.secondaryIntents],
    answeredIntents,
    response,
    responseId,
    detailLevel,
    classification,
    ...sourceMetadata(sourceRefs),
  };
}
