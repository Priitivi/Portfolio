import {
  CONFIRMED_SOURCE_TYPE,
  exerciseAssumptionById,
  confirmedSourceFacts,
} from "../data/smartRebookScenario.js";

const coreBehaviour = confirmedSourceFacts.find((fact) => fact.id === "core-behaviour");

export const roleplayTopicLabels = {
  opening: "Opening and agenda",
  purpose: "Purpose and customer problem",
  audience: "Target audience",
  "prior-knowledge": "Current user knowledge",
  "learning-outcomes": "Desired learning outcomes",
  "core-behaviour": "Confirmed end-to-end trigger",
  activation: "Setup and activation",
  waitlist: "Waitlist behaviour",
  notification: "Notifications and triggers",
  "client-experience": "Client experience",
  "multiple-responses": "Multiple responses",
  "after-acceptance": "After acceptance",
  errors: "Errors and likely confusion",
  support: "Support and escalation",
  success: "Measures of success",
  materials: "Existing source materials",
  "test-access": "Test access",
  signoff: "Review and sign-off",
  timing: "Launch timing and dependencies",
  summary: "Summary and confirmation",
  "next-steps": "Closing and next steps",
};

const intents = [
  {
    id: "opening",
    phrases: ["agenda", "time together", "cover today", "aim for this meeting", "like to understand"],
    response: "That works for me. I have ten minutes now, and I can answer questions about the feature and the learning brief.",
    sourceType: "practice-interaction",
  },
  {
    id: "summary",
    phrases: ["to summarise", "to summarize", "have i understood", "have i got that", "let me check my understanding", "does that sound right"],
    response: "That is a useful point to check. I can confirm the details you have repeated from our conversation; anything not yet discussed should remain an open question.",
    sourceType: "practice-interaction",
  },
  {
    id: "next-steps",
    phrases: ["next step", "follow up", "send me", "come back to you", "another meeting", "actions from here"],
    response: "Please send a short summary of your understanding, the open questions and the assets you need. I will confirm product accuracy and the owners for any gaps.",
    sourceType: "practice-interaction",
  },
  {
    id: "multiple-responses",
    phrases: ["multiple people", "more than one", "respond at once", "responds first", "already taken", "competing response", "same time"],
  },
  {
    id: "after-acceptance",
    phrases: ["after acceptance", "after they accept", "after someone accepts", "once accepted", "once they claim", "successful client", "successful customer"],
  },
  {
    id: "client-experience",
    phrases: ["what does the client see", "what do clients see", "what does the customer see", "email look like", "message contain", "claim button", "end client"],
  },
  {
    id: "core-behaviour",
    phrases: ["how does smart rebook work", "what does smart rebook do", "end to end", "what triggers", "after a cancellation", "when someone cancels", "when a customer cancels"],
    response: coreBehaviour.statement,
    sourceType: CONFIRMED_SOURCE_TYPE,
  },
  {
    id: "activation",
    phrases: ["enable", "enabled", "activate", "activation", "turn it on", "set up", "setup", "configure", "configuration"],
  },
  {
    id: "waitlist",
    phrases: ["waitlist created", "create a waitlist", "join the waitlist", "added to", "populate", "who is on the waitlist", "maintain the waitlist"],
  },
  {
    id: "notification",
    phrases: ["notification", "email", "communication", "trigger communication", "who receives", "sent to"],
  },
  {
    id: "errors",
    phrases: ["error", "go wrong", "failure", "fails", "confus", "common issue", "edge case", "mistake", "troubleshoot"],
  },
  {
    id: "support",
    phrases: ["support", "escalat", "help centre", "help center", "contact for help", "raise a ticket"],
  },
  {
    id: "success",
    phrases: ["measure", "metric", "success", "effective", "impact", "data", "analytics"],
  },
  {
    id: "materials",
    phrases: ["documentation", "documents", "screenshots", "demo", "source material", "help article", "existing content", "assets"],
  },
  {
    id: "test-access",
    phrases: ["test environment", "sandbox", "test access", "try it", "test account", "test inbox"],
  },
  {
    id: "signoff",
    phrases: ["sign off", "sign-off", "reviewer", "review and approval", "approve", "accuracy review", "stakeholder"],
  },
  {
    id: "timing",
    phrases: ["launch", "release", "deadline", "timeline", "dependency", "dependencies", "when is it due", "go live"],
  },
  {
    id: "prior-knowledge",
    phrases: ["already know", "prior knowledge", "current knowledge", "familiar with", "prerequisite", "starting knowledge"],
  },
  {
    id: "learning-outcomes",
    phrases: ["learning outcome", "able to do", "need to learn", "desired outcome", "after the learning", "training outcome"],
  },
  {
    id: "audience",
    phrases: ["target audience", "who is this for", "who uses", "which users", "which customer", "learner", "administrator", "front desk"],
  },
  {
    id: "purpose",
    phrases: ["why does", "why was", "purpose", "customer problem", "problem solve", "benefit", "value", "why now", "need for the feature"],
  },
];

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchRoleplayResponse(input) {
  const normalized = normalize(input);
  if (!normalized) {
    return {
      intent: "unknown",
      response: "I did not catch a question there. Could you rephrase the specific detail you need?",
      sourceType: "practice-interaction",
    };
  }

  const match = intents.find((intent) => intent.phrases.some((phrase) => normalized.includes(phrase)));
  if (!match) {
    return {
      intent: "unknown",
      response: "Could you rephrase that as a more specific question? I do not want to assume which detail you need.",
      sourceType: "practice-interaction",
    };
  }

  const assumption = exerciseAssumptionById[match.id];
  return {
    intent: match.id,
    response: match.response || assumption.response,
    sourceType: match.sourceType || assumption.sourceType,
  };
}
