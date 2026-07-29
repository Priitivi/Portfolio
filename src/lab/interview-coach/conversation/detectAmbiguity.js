export function detectAmbiguity({
  candidates,
  hasMultiIntentConnector,
  referenceDetected,
  previousTurn,
  hasExplicitAnchor,
}) {
  const [primary, secondary] = candidates;
  if (!primary || primary.score < 3.4) {
    return { clarificationNeeded: true, clarificationType: "lowConfidence" };
  }

  if (referenceDetected && !previousTurn && !hasExplicitAnchor) {
    return { clarificationNeeded: true, clarificationType: "ambiguousReference" };
  }

  if (
    secondary
    && primary.topicId !== secondary.topicId
    && Math.abs(primary.score - secondary.score) < 0.85
    && !hasMultiIntentConnector
    && !hasExplicitAnchor
  ) {
    return { clarificationNeeded: true, clarificationType: "ambiguousCandidates" };
  }

  return { clarificationNeeded: false, clarificationType: null };
}
