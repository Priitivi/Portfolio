const REFERENCE_PATTERNS = {
  elaboration: [
    "elaborate",
    "expand on that",
    "explain that more",
    "explain more",
    "tell me more",
    "what does that involve",
    "what do you mean by that",
    "what does it involve",
    "anything else involved",
  ],
  next: [
    "what happens next",
    "and after that",
    "after that",
    "what comes next",
    "then what",
    "what about afterwards",
  ],
  actor: [
    "who would do that",
    "who does that",
    "who is responsible for that",
    "who handles that",
    "who would normally do that",
  ],
  reason: [
    "why is that",
    "why is that important",
    "why does that matter",
    "why would that help",
  ],
  measurement: [
    "how would you know",
    "how would that be measured",
    "how do you measure that",
    "how could you tell",
  ],
  process: [
    "how does that work",
    "how would that work",
    "what does that look like",
    "what about that process",
  ],
  customer: [
    "what about the customer",
    "what do they receive",
    "what do they see",
    "what happens to them",
  ],
};

const NEXT_TRANSITIONS = {
  "core-behaviour": "client-experience",
  notification: "client-experience",
  "client-experience": "after-acceptance",
  "multiple-responses": "after-acceptance",
  waitlist: "core-behaviour",
};

function latestAnsweredTurn(turns = []) {
  return [...turns]
    .reverse()
    .find((turn) => turn.primaryIntent && !turn.clarificationNeeded);
}

function findReferenceKind(text) {
  for (const [kind, phrases] of Object.entries(REFERENCE_PATTERNS)) {
    if (phrases.some((phrase) => text.includes(phrase))) return kind;
  }
  const tokens = text.split(" ").filter(Boolean);
  if (
    tokens.length <= 9
    && /\b(it|that|this|they|them|their)\b/.test(text)
  ) {
    return "pronoun";
  }
  return null;
}

export function resolveContextualFollowUp(normalised, context = {}) {
  const referenceKind = findReferenceKind(normalised.meaningful);
  const hasExplicitAnchor = /\b(role|responsib\w*|feature|smart rebook|booknest|customer|client|email|waitlist|setup|activat\w*|enable\w*|success\w*|measure\w*|learning|content|support|help|review|launch|material|sandbox)\b/
    .test(normalised.stems.join(" "))
    || /\b(what you do|work with|who is it(?:\s+\w+){0,2} for|check my understanding|check i have got|summaris|recap|send you|after this meeting|next steps)\b/
      .test(normalised.meaningful);
  if (!referenceKind) {
    return {
      referenceDetected: false,
      referenceKind: null,
      hasExplicitAnchor,
      contextIntent: null,
      contextTopic: null,
      previousTurn: null,
    };
  }

  const previousTurn = latestAnsweredTurn(context.turns);
  if (!previousTurn) {
    return {
      referenceDetected: true,
      referenceKind,
      hasExplicitAnchor,
      contextIntent: null,
      contextTopic: null,
      previousTurn: null,
    };
  }

  let contextIntent = previousTurn.primaryIntent;
  if (
    ["elaboration", "process", "pronoun"].includes(referenceKind)
    && previousTurn.primaryIntent === "identity"
  ) {
    contextIntent = "role-responsibilities";
  } else if (referenceKind === "next") {
    contextIntent = NEXT_TRANSITIONS[previousTurn.primaryIntent] || null;
  } else if (referenceKind === "actor" && previousTurn.primaryIntent === "identity") {
    contextIntent = "role-responsibilities";
  } else if (referenceKind === "measurement") {
    contextIntent = previousTurn.topicId === "success" ? "success" : previousTurn.primaryIntent;
  } else if (
    referenceKind === "customer"
    && ["core-behaviour", "notification", "waitlist"].includes(previousTurn.primaryIntent)
  ) {
    contextIntent = "client-experience";
  }

  return {
    referenceDetected: true,
    referenceKind,
    hasExplicitAnchor,
    contextIntent,
    contextTopic: contextIntent ? previousTurn.topicId : null,
    previousTurn,
  };
}
