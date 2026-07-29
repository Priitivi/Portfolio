import { analyseMockAnswer } from "../conversation/analyseMockAnswer.js";
import { roleplayIntentById } from "../conversation/intentDefinitions.js";
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

const roleplayCoverageGroups = [
  { id: "opening", title: "Opening and agenda", intents: ["opening", "meeting-questions"] },
  { id: "purpose", title: "Business-purpose discovery", intents: ["purpose"] },
  { id: "customer", title: "Customer focus", intents: ["customer-profile", "purpose", "client-experience"] },
  { id: "audience", title: "Audience discovery", intents: ["audience", "prior-knowledge"] },
  { id: "learning-outcomes", title: "Learning outcomes", intents: ["learning-brief", "learning-outcomes"] },
  { id: "workflow", title: "Workflow discovery", intents: ["core-behaviour", "waitlist", "notification", "client-experience", "after-acceptance"] },
  { id: "setup", title: "Setup and activation", intents: ["activation"] },
  { id: "edge-cases", title: "Edge cases and likely confusion", intents: ["multiple-responses", "errors"] },
  { id: "support", title: "Support routes", intents: ["support"] },
  { id: "success", title: "Success measures", intents: ["success"] },
  { id: "materials", title: "Available materials and access", intents: ["materials", "test-access"] },
  { id: "review", title: "Review, stakeholders and dependencies", intents: ["signoff", "timing", "role-stakeholders"] },
  { id: "summary", title: "Summarising and confirming", intents: ["summary"] },
  { id: "closing", title: "Closing and next steps", intents: ["next-steps", "thanks"] },
];

function label(value, strongAt = 2, developingAt = 1) {
  if (value >= strongAt) return LABELS.strong;
  if (value >= developingAt) return LABELS.developing;
  return LABELS.needs;
}

function ratioLabel(present, total, strongRatio = 0.55, developingRatio = 0.25) {
  if (!total) return LABELS.needs;
  const ratio = present / total;
  if (ratio >= strongRatio) return LABELS.strong;
  if (ratio >= developingRatio) return LABELS.developing;
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
    strongestAreas: strongestAreas.length
      ? strongestAreas
      : ["You completed a practice attempt and created evidence to review."],
    missedAreas,
    heuristicNote: "These labels come from transparent local practice heuristics. They identify evidence and coverage patterns, not meaning with human certainty, and they are not a hiring prediction.",
    ...extra,
  };
}

function analysisForAnswer(answer) {
  return answer.analysis || analyseMockAnswer(answer.answer);
}

function countDimension(answers, dimension) {
  return answers.filter((answer) => analysisForAnswer(answer).dimensions[dimension]).length;
}

function effectiveMockAnswers(answers) {
  const coreAnswers = answers.filter((answer) => answer.kind === "core");
  const latestRetries = new Map();
  answers
    .filter((answer) => answer.kind === "retry")
    .forEach((answer) => latestRetries.set(answer.coreQuestionId, answer));
  return coreAnswers.map((answer) => latestRetries.get(answer.questionId) || answer);
}

function retryReason(answer) {
  const { dimensions } = analysisForAnswer(answer);
  if (!dimensions.personalAction) return "Make your own decision or action explicit.";
  if (!dimensions.result) return "Add the outcome and the evidence you used to judge it.";
  if (!dimensions.clarity) return "Give the answer a clearer situation, action and outcome structure.";
  if (!dimensions.audienceImpact) return "Connect the example to the customer or learner receiving the work.";
  if (!dimensions.reflection) return "Close with what you learned or would change next time.";
  return null;
}

export function scoreMockInterview(answers) {
  const answeredCore = answers.filter((item) => item.kind === "core");
  const effectiveAnswers = effectiveMockAnswers(answers);
  const assessable = effectiveAnswers.length ? effectiveAnswers : answers;
  const total = assessable.length;
  const combined = answers.map((item) => item.answer.toLowerCase()).join(" ");
  const cvMatches = candidateEvidence.filter((evidence) =>
    evidence.keywords.some((keyword) => combined.includes(keyword)));

  const dimensionDefinitions = [
    {
      id: "specific-evidence",
      title: "Specific evidence",
      signal: "specificEvidence",
      reason: "combined a concrete example, personal action and an outcome",
    },
    {
      id: "clarity",
      title: "Clarity and structure",
      signal: "clarity",
      reason: "contained enough structured detail for the heuristic to follow",
    },
    {
      id: "contribution",
      title: "Personal contribution",
      signal: "personalAction",
      reason: "made the candidate's own action explicit",
    },
    {
      id: "outcome",
      title: "Outcome and evidence",
      signal: "result",
      reason: "stated an outcome rather than ending with the activity",
    },
    {
      id: "reflection",
      title: "Reflection and learning",
      signal: "reflection",
      reason: "described a lesson or how the approach would change next time",
    },
    {
      id: "relevance",
      title: "Relevance to the role",
      signal: "roleRelevance",
      reason: "connected with learning, software, customers, stakeholders or delivery",
    },
    {
      id: "audience-impact",
      title: "Customer or learner impact",
      signal: "audienceImpact",
      reason: "considered the customer, client, learner or audience receiving the work",
    },
  ];

  const dimensions = dimensionDefinitions.map((definition) => {
    const present = countDimension(assessable, definition.signal);
    return {
      id: definition.id,
      title: definition.title,
      label: ratioLabel(present, total),
      reason: `${present} of ${total} assessable answer${total === 1 ? "" : "s"} ${definition.reason}.`,
    };
  });

  const answeredIds = new Set(answeredCore.map((answer) => answer.questionId));
  const notCovered = mockQuestions
    .filter((question) => !answeredIds.has(question.id))
    .map((question) => question.competency);
  const relevantEvidence = candidateEvidence
    .filter((item) => !cvMatches.includes(item))
    .slice(0, 4)
    .map((item) => `${item.title}: ${item.summary}`);
  const retryQuestions = effectiveAnswers
    .map((answer) => {
      const reason = retryReason(answer);
      const coreQuestionId = answer.coreQuestionId || answer.questionId;
      const original = answeredCore.find((item) => item.questionId === coreQuestionId);
      return reason && original
        ? {
          questionId: coreQuestionId,
          prompt: original.prompt,
          originalAnswer: original.answer,
          latestAnswer: answer.kind === "retry" ? answer.answer : null,
          reason,
        }
        : null;
    })
    .filter(Boolean);

  const weakest = dimensions.find((dimension) => dimension.label === LABELS.needs);
  return reportShape("Mock Interview", dimensions, {
    questionsCovered: answeredCore.map((answer) => answer.prompt),
    topicsNotCovered: notCovered,
    relevantEvidence,
    improvements: [
      "Use one truthful, specific example and make your own decision or action unmistakable.",
      "Close the example with the outcome, evidence available and what you learned.",
      "Connect the action to the customer or learner receiving the work and to this role.",
    ],
    retryGoal: weakest
      ? `Strengthen ${weakest.title.toLowerCase()} while keeping each answer concise and relevant.`
      : "Retry with equally specific evidence in fewer words.",
    retryQuestions,
  });
}

function coveredCount(covered, intents) {
  return intents.filter((intent) => covered.has(intent)).length;
}

function openQuestion(text) {
  return /^(what|how|why|who|which|where|when|tell me|could you explain|can you describe)\b/i
    .test(text.trim());
}

export function scoreRoleplay({ messages, coveredIntents = [], turns = [], timer }) {
  const candidateQuestions = messages.filter((message) => message.role === "candidate");
  const covered = new Set(coveredIntents);
  const elapsed = ROLEPLAY_DURATION_SECONDS - timer.remainingSeconds;
  const clarificationCount = turns.filter((turn) => turn.clarificationNeeded).length;
  const contextTopics = new Set(
    turns
      .filter((turn) => turn.contextUsed && turn.topicId)
      .map((turn) => turn.topicId),
  );
  const openCount = candidateQuestions.filter((message) => openQuestion(message.text)).length;

  const dimensions = roleplayCoverageGroups.map((group) => {
    const present = coveredCount(covered, group.intents);
    const strongAt = group.intents.length >= 4 ? 3 : group.intents.length >= 2 ? 2 : 1;
    return {
      id: group.id,
      title: group.title,
      label: label(present, strongAt, 1),
      reason: present
        ? `${present} distinct relevant topic${present === 1 ? " was" : "s were"} explored without counting paraphrased repeats twice.`
        : "No distinct question covering this area was detected.",
    };
  });

  const repeatedIntentCount = turns.reduce((count, turn, index) => {
    if (!turn.primaryIntent || turn.clarificationNeeded) return count;
    return count + (turns.slice(0, index).some((prior) => prior.primaryIntent === turn.primaryIntent) ? 1 : 0);
  }, 0);
  dimensions.push(
    {
      id: "follow-up-depth",
      title: "Follow-up depth",
      label: label(contextTopics.size, 3, 1),
      reason: `${contextTopics.size} distinct topic${contextTopics.size === 1 ? " used" : "s used"} a resolved contextual follow-up; ${repeatedIntentCount} repeated question${repeatedIntentCount === 1 ? " was" : "s were"} not counted as new coverage.`,
    },
    {
      id: "question-technique",
      title: "Focused question technique",
      label: label([
        openCount >= 4,
        clarificationCount <= Math.max(1, Math.floor(candidateQuestions.length / 5)),
      ].filter(Boolean).length),
      reason: `${openCount} open question${openCount === 1 ? " was" : "s were"} detected and Duncan requested clarification ${clarificationCount} time${clarificationCount === 1 ? "" : "s"}.`,
    },
    {
      id: "time",
      title: "Use of the ten-minute period",
      label: label([
        candidateQuestions.length >= 8,
        elapsed > 0 && elapsed <= ROLEPLAY_DURATION_SECONDS,
      ].filter(Boolean).length),
      reason: `${candidateQuestions.length} question${candidateQuestions.length === 1 ? "" : "s"} were asked in ${Math.floor(Math.max(0, elapsed) / 60)}m ${Math.max(0, elapsed) % 60}s of timer time.`,
    },
  );

  const coveredTopics = new Set(
    [...covered]
      .map((intent) => roleplayIntentById[intent]?.topicId)
      .filter(Boolean),
  );
  const questionsCovered = [...coveredTopics]
    .map((topic) => roleplayTopicLabels[topic])
    .filter(Boolean);
  const missedGroups = roleplayCoverageGroups.filter((group) =>
    coveredCount(covered, group.intents) === 0);

  return reportShape("Smart Rebook Role-play", dimensions, {
    questionsCovered,
    topicsNotCovered: missedGroups.map((group) => group.title),
    relevantEvidence: [
      "Primary client contact: use this to show confident, structured discovery.",
      "iSAMS school training: connect product understanding to customer-facing explanation.",
      "Cross-functional collaboration: use this when agreeing reviewers, owners and next steps.",
    ],
    improvements: [
      missedGroups.length
        ? `Prioritise the missed area "${missedGroups[0].title}" in the next attempt.`
        : "Keep the same breadth while using fewer, sharper questions.",
      "Use contextual follow-ups to deepen a useful answer instead of paraphrasing the same broad question.",
      "Reserve the final minute for a concise summary, unresolved gaps, owners and next steps.",
    ],
    retryGoal: missedGroups.length
      ? `Cover ${missedGroups.slice(0, 2).map((group) => group.title).join(" and ")}, then close with a summary.`
      : "Repeat with the same coverage and a tighter ten-minute structure.",
  });
}
