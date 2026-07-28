import { candidateEvidence } from "../data/candidateEvidence.js";
import { mockQuestions } from "../data/mockQuestions.js";
import { roleplayTopicLabels } from "./roleplayMatcher.js";
import { ROLEPLAY_DURATION_SECONDS } from "./timer.js";

const LABELS = {
  strong: "Strong",
  developing: "Developing",
  needs: "Needs more evidence",
  unassessed: "Not assessed",
};

const discoveryIntents = [
  "purpose",
  "audience",
  "prior-knowledge",
  "learning-outcomes",
  "core-behaviour",
  "activation",
  "waitlist",
  "notification",
  "client-experience",
  "multiple-responses",
  "after-acceptance",
  "errors",
  "support",
  "success",
  "materials",
  "test-access",
  "signoff",
  "timing",
  "summary",
  "next-steps",
];

function label(value, strongAt = 2, developingAt = 1) {
  if (value >= strongAt) return LABELS.strong;
  if (value >= developingAt) return LABELS.developing;
  return LABELS.needs;
}

function overallFromDimensions(dimensions) {
  const assessed = dimensions.filter((item) => item.label !== LABELS.unassessed);
  const strong = assessed.filter((item) => item.label === LABELS.strong).length;
  const developing = assessed.filter((item) => item.label === LABELS.developing).length;
  if (strong >= Math.ceil(assessed.length * 0.55)) return LABELS.strong;
  if (strong + developing >= Math.ceil(assessed.length * 0.6)) return LABELS.developing;
  return LABELS.needs;
}

function reportShape(mode, dimensions, extra) {
  const strongestAreas = dimensions
    .filter((item) => item.label === LABELS.strong)
    .map((item) => item.title);
  const missedAreas = dimensions
    .filter((item) => item.label === LABELS.needs)
    .map((item) => item.title);

  return {
    mode,
    overall: overallFromDimensions(dimensions),
    dimensions,
    strongestAreas: strongestAreas.length ? strongestAreas : ["You completed a practice attempt and created evidence to review."],
    missedAreas,
    heuristicNote: "These labels come from transparent keyword, coverage and structure checks. They are practice signals, not a judgement of interview performance.",
    ...extra,
  };
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

export function scoreMockInterview(answers) {
  const combined = answers.map((item) => item.answer.toLowerCase()).join(" ");
  const answeredCore = answers.filter((item) => item.kind === "core");
  const substantial = answeredCore.filter((item) => item.answer.trim().split(/\s+/).length >= 35);
  const cvMatches = candidateEvidence.filter((evidence) =>
    evidence.keywords.some((keyword) => combined.includes(keyword)),
  );
  const evidenceMarkers = ["for example", "when i", "my role", "i was responsible", "the result", "as a result"];

  const dimensions = [
    {
      id: "opening",
      title: "Opening and agenda setting",
      label: LABELS.unassessed,
      reason: "This is not directly observed in question-and-answer mode.",
    },
    {
      id: "relevance",
      title: "Relevance of answers",
      label: label(substantial.length, 7, 3),
      reason: `${substantial.length} answer${substantial.length === 1 ? "" : "s"} contained enough detail for the heuristic to assess.`,
    },
    {
      id: "open-questions",
      title: "Use of open questions",
      label: LABELS.unassessed,
      reason: "Question technique is assessed in the Smart Rebook role-play.",
    },
    {
      id: "follow-up",
      title: "Follow-up depth",
      label: label(answers.filter((item) => item.kind === "follow-up" && item.answer.split(/\s+/).length >= 20).length, 4, 1),
      reason: "Based on the number of follow-up answers developed beyond a short response.",
    },
    {
      id: "customer",
      title: "Customer and learner focus",
      label: label([
        includesAny(combined, ["customer", "client", "learner", "school"]),
        includesAny(combined, ["need", "feedback", "understand", "confus"]),
      ].filter(Boolean).length),
      reason: "Looks for explicit attention to audience needs, understanding and feedback.",
    },
    {
      id: "learning-design",
      title: "Instructional-design thinking",
      label: label([
        includesAny(combined, ["learning outcome", "objective", "able to"]),
        includesAny(combined, ["practice", "task", "scenario", "accessib", "measure"]),
      ].filter(Boolean).length),
      reason: "Looks for outcomes, purposeful practice, accessibility and evaluation.",
    },
    {
      id: "stakeholders",
      title: "Stakeholder communication",
      label: label([
        includesAny(combined, ["stakeholder", "client", "subject matter", "sme"]),
        includesAny(combined, ["update", "progress", "expectation", "confirm", "sign off"]),
      ].filter(Boolean).length),
      reason: "Looks for both stakeholder context and a concrete communication behaviour.",
    },
    {
      id: "evidence",
      title: "Use of evidence",
      label: label([
        evidenceMarkers.some((marker) => combined.includes(marker)),
        cvMatches.length >= 2,
      ].filter(Boolean).length),
      reason: `${cvMatches.length} relevant CV evidence area${cvMatches.length === 1 ? " was" : "s were"} detected.`,
    },
    {
      id: "summary",
      title: "Summarising and confirming",
      label: label(includesAny(combined, ["summaris", "confirm", "check my understanding"]) ? 1 : 0, 2, 1),
      reason: "Looks for an explicit habit of checking understanding or confirming decisions.",
    },
    {
      id: "closing",
      title: "Closing and next steps",
      label: label(includesAny(combined, ["next step", "follow up", "action", "owner"]) ? 1 : 0, 2, 1),
      reason: "Looks for clear actions, owners or follow-up.",
    },
    {
      id: "time",
      title: "Time management",
      label: label(answeredCore.length, mockQuestions.length, Math.ceil(mockQuestions.length / 2)),
      reason: `${answeredCore.length} of ${mockQuestions.length} focus areas were completed.`,
    },
  ];

  const answeredIds = new Set(answeredCore.map((answer) => answer.questionId));
  const notCovered = mockQuestions
    .filter((question) => !answeredIds.has(question.id))
    .map((question) => question.competency);
  const relevantEvidence = candidateEvidence
    .filter((item) => !cvMatches.includes(item))
    .slice(0, 4)
    .map((item) => `${item.title}: ${item.summary}`);

  return reportShape("Mock Interview", dimensions, {
    questionsCovered: answeredCore.map((answer) => answer.prompt),
    topicsNotCovered: notCovered,
    relevantEvidence,
    improvements: [
      "Make each answer explicit about your personal action and the resulting change.",
      "Connect customer or learner need to the decision you made, not only the task you completed.",
      "Close examples with a truthful measure, feedback signal or lesson you carried forward.",
    ],
    retryGoal: notCovered.length
      ? `Complete the remaining focus areas, beginning with ${notCovered[0]}.`
      : "Retry with tighter examples: situation, personal action, customer effect and evidence.",
  });
}

function questionIsOpen(text) {
  return /^(what|how|why|who|which|where|when|tell me|could you explain|can you describe)\b/i.test(text.trim());
}

export function scoreRoleplay({ messages, coveredIntents, timer }) {
  const candidateQuestions = messages.filter((message) => message.role === "candidate");
  const covered = new Set(coveredIntents);
  const unknownCount = coveredIntents.filter((intent) => intent === "unknown").length;
  const openCount = candidateQuestions.filter((message) => questionIsOpen(message.text)).length;
  const elapsed = ROLEPLAY_DURATION_SECONDS - timer.remainingSeconds;

  const dimensions = [
    {
      id: "opening",
      title: "Opening and agenda setting",
      label: label(covered.has("opening") ? 2 : 0),
      reason: covered.has("opening") ? "You set or confirmed an agenda before discovery." : "No explicit agenda-setting question was detected.",
    },
    {
      id: "relevance",
      title: "Relevance of questions",
      label: label(candidateQuestions.length - unknownCount, 8, 3),
      reason: `${candidateQuestions.length - unknownCount} question${candidateQuestions.length - unknownCount === 1 ? "" : "s"} matched the controlled discovery model.`,
    },
    {
      id: "open-questions",
      title: "Use of open questions",
      label: label(openCount, 6, 2),
      reason: `${openCount} question${openCount === 1 ? "" : "s"} began with an open-question form.`,
    },
    {
      id: "follow-up",
      title: "Follow-up depth",
      label: label(candidateQuestions.length, 12, 5),
      reason: "Uses the depth and continuity of the discovery conversation as a proxy.",
    },
    {
      id: "customer",
      title: "Customer and learner focus",
      label: label(["purpose", "audience", "prior-knowledge", "client-experience"].filter((intent) => covered.has(intent)).length, 3, 1),
      reason: "Checks whether the problem, audience, prior knowledge and client experience were explored.",
    },
    {
      id: "learning-design",
      title: "Instructional-design thinking",
      label: label(["prior-knowledge", "learning-outcomes", "materials", "test-access", "success"].filter((intent) => covered.has(intent)).length, 4, 2),
      reason: "Checks for learning outcomes, source material, safe exploration and measures.",
    },
    {
      id: "stakeholders",
      title: "Stakeholder communication",
      label: label(["signoff", "support", "timing"].filter((intent) => covered.has(intent)).length, 3, 1),
      reason: "Checks review, support, timing and dependency conversations.",
    },
    {
      id: "evidence",
      title: "Use of evidence",
      label: label(["core-behaviour", "summary"].filter((intent) => covered.has(intent)).length, 2, 1),
      reason: "Checks whether confirmed behaviour was discovered and then used in a summary.",
    },
    {
      id: "summary",
      title: "Summarising and confirming",
      label: label(covered.has("summary") ? 2 : 0),
      reason: covered.has("summary") ? "You checked or summarised your understanding." : "No explicit summary check was detected.",
    },
    {
      id: "closing",
      title: "Closing and next steps",
      label: label(covered.has("next-steps") ? 2 : 0),
      reason: covered.has("next-steps") ? "You agreed a follow-up or next action." : "No explicit next-step question was detected.",
    },
    {
      id: "time",
      title: "Time management",
      label: label([
        candidateQuestions.length >= 8,
        elapsed > 0 && elapsed <= ROLEPLAY_DURATION_SECONDS,
      ].filter(Boolean).length),
      reason: `${candidateQuestions.length} question${candidateQuestions.length === 1 ? "" : "s"} asked in ${Math.floor(elapsed / 60)}m ${elapsed % 60}s of timer time.`,
    },
  ];

  const uniqueCovered = discoveryIntents.filter((intent) => covered.has(intent));
  const missed = discoveryIntents.filter((intent) => !covered.has(intent));
  const relevantEvidence = [
    "Primary client contact: use this to show confident, structured discovery.",
    "iSAMS school training: connect product understanding to customer-facing explanation.",
    "Cross-functional collaboration: use this when agreeing reviewers, owners and next steps.",
  ];

  return reportShape("Smart Rebook Role-play", dimensions, {
    questionsCovered: uniqueCovered.map((intent) => roleplayTopicLabels[intent]),
    topicsNotCovered: missed.map((intent) => roleplayTopicLabels[intent]),
    relevantEvidence,
    improvements: [
      missed.length ? `Prioritise the missed area "${roleplayTopicLabels[missed[0]]}" in the next attempt.` : "Keep the same coverage while using fewer, sharper questions.",
      "Use a brief midpoint summary to test assumptions before moving into edge cases.",
      "Reserve the final minute for gaps, owners, source materials and a confirmed next step.",
    ],
    retryGoal: missed.length
      ? `Cover ${roleplayTopicLabels[missed[0]]}, ${roleplayTopicLabels[missed[1]] || "a midpoint summary"} and a clear close.`
      : "Repeat with a tighter ten-minute structure and the same breadth.",
  });
}
