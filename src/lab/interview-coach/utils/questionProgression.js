import { mockQuestions } from "../data/mockQuestions.js";
import { analyseMockAnswer } from "../conversation/analyseMockAnswer.js";

export const PRACTICE_DIFFICULTIES = {
  supportive: {
    id: "supportive",
    title: "Supportive",
    description: "Uses a follow-up only when an answer needs a clear foundation.",
  },
  realistic: {
    id: "realistic",
    title: "Realistic",
    description: "Uses one evidence-focused follow-up when an important dimension is missing.",
  },
  pressure: {
    id: "pressure",
    title: "Pressure practice",
    description: "Probes directly and consistently while staying professional and evidence-based.",
  },
};

const contextualFollowUps = {
  example: "Could you give me a specific example of when you did this?",
  action: "What was your own responsibility in that situation?",
  result: "What was the outcome, and how did you know it had been successful?",
  stakeholders: "Who were the stakeholders, and how did you adapt your communication for them?",
  audience: "How did you make sure the explanation worked for the audience receiving it?",
  challenge: "What was the main challenge or blocker, and how did you respond?",
  reflection: "What did you learn, and what would you carry into this role?",
};

const pressureFollowUps = {
  example: "I need a concrete example rather than a general approach. Which situation best demonstrates this?",
  action: "Be precise about your contribution. What did you personally decide or do?",
  result: "What changed because of your work, and what evidence supports that outcome?",
  stakeholders: "Which stakeholders mattered most, and exactly how did you adapt your communication?",
  audience: "How did you verify that the customer or learner could use what you produced?",
  challenge: "What was the hardest constraint, and what trade-off did you make?",
  reflection: "What would you do differently now, and why?",
};

function questionExpectsExample(question) {
  return /\b(tell me about|describe a time|give an example|feedback you received|piece of work you took ownership)\b/i
    .test(question.prompt);
}

function isLearningQuestion(question) {
  return /learning|instructional|training|quality|accessibility|content|software/i
    .test(`${question.competency} ${question.prompt}`);
}

function isStakeholderQuestion(question) {
  return /stakeholder|subject matter expert|sme|client|collabor/i
    .test(`${question.competency} ${question.prompt}`);
}

function normaliseOptions(options) {
  if (typeof options === "string") return { difficulty: options };
  return options || {};
}

export function createQuestionPlan({ sessionNumber = 1 } = {}) {
  const offset = Math.abs(Number(sessionNumber) - 1) % mockQuestions.length;
  const ordered = [
    ...mockQuestions.slice(offset),
    ...mockQuestions.slice(0, offset),
  ];
  const primaryQuestionIds = [...new Set(ordered.map((question) => question.id))];
  const questions = primaryQuestionIds
    .map((id) => mockQuestions.find((question) => question.id === id))
    .filter(Boolean);

  return {
    id: `mock-plan-${Math.max(1, Number(sessionNumber) || 1)}`,
    primaryQuestionIds,
    competencyIds: questions.map((question) => question.competency),
    followUpIds: [],
    questions,
  };
}

export function createMockState(options = {}) {
  const { difficulty = "realistic", sessionNumber = 1 } = normaliseOptions(options);
  const plan = createQuestionPlan({ sessionNumber });
  const queue = plan.questions.map((question) => ({ ...question, kind: "core" }));
  const firstQuestion = queue[0];

  return {
    plan,
    difficulty: PRACTICE_DIFFICULTIES[difficulty] ? difficulty : "realistic",
    queue,
    currentIndex: 0,
    answers: [],
    askedQuestionIds: firstQuestion ? [firstQuestion.id] : [],
    primaryAskedIds: firstQuestion ? [firstQuestion.id] : [],
    followUpAskedIds: [],
    retryAskedIds: [],
    draft: "",
    retryContext: null,
    completed: queue.length === 0,
  };
}

function missingFollowUpTarget(question, analysis) {
  if (questionExpectsExample(question) && !analysis.dimensions.concreteExample) return "example";
  if (questionExpectsExample(question) && !analysis.dimensions.personalAction) return "action";
  if (questionExpectsExample(question) && !analysis.dimensions.result) return "result";
  if (isStakeholderQuestion(question) && !analysis.dimensions.collaboration) return "stakeholders";
  if (isLearningQuestion(question) && !analysis.dimensions.audienceImpact) return "audience";
  if (!analysis.dimensions.challenge && /blocker|priorit|feedback/i.test(question.prompt)) return "challenge";
  if (!analysis.dimensions.reflection && /feedback|learning agility|unfamiliar|improve/i.test(`${question.competency} ${question.prompt}`)) return "reflection";
  return null;
}

export function selectFollowUp(question, answer, difficulty = "realistic") {
  const analysis = analyseMockAnswer(answer);
  const target = missingFollowUpTarget(question, analysis);

  if (difficulty === "supportive" && (!target || analysis.wordCount >= 18)) return null;

  let authored = null;
  if (target) {
    authored = {
      id: `${question.id}-${target}`,
      prompt: difficulty === "pressure" ? pressureFollowUps[target] : contextualFollowUps[target],
      heuristicTarget: target,
    };
  } else if (difficulty === "pressure") {
    authored = question.followUps?.[0] || {
      id: `${question.id}-reflection`,
      prompt: pressureFollowUps.reflection,
      heuristicTarget: "reflection",
    };
  } else {
    authored = question.followUps?.[0];
  }

  if (!authored) return null;

  return {
    ...authored,
    competency: question.competency,
    sourceType: question.sourceType,
    parentId: question.id,
    kind: "follow-up",
    answerAnalysis: analysis,
  };
}

function addAskedQuestion(state, question) {
  if (!question || state.askedQuestionIds.includes(question.id)) return state;
  return {
    ...state,
    askedQuestionIds: [...state.askedQuestionIds, question.id],
    primaryAskedIds: question.kind === "core"
      ? [...state.primaryAskedIds, question.id]
      : state.primaryAskedIds,
    followUpAskedIds: question.kind === "follow-up"
      ? [...state.followUpAskedIds, question.id]
      : state.followUpAskedIds,
    retryAskedIds: question.kind === "retry"
      ? [...state.retryAskedIds, question.id]
      : state.retryAskedIds,
  };
}

export function progressMockInterview(state, answer) {
  const current = state.queue[state.currentIndex];
  if (!current || !answer.trim()) return state;
  if (state.answers.some((saved) => saved.questionId === current.id)) return state;

  const answers = [
    ...state.answers,
    {
      questionId: current.id,
      coreQuestionId: current.coreQuestionId || current.parentId || current.id,
      parentId: current.parentId || null,
      kind: current.kind,
      competency: current.competency,
      prompt: current.prompt,
      answer: answer.trim(),
      originalAnswer: current.originalAnswer || null,
      analysis: analyseMockAnswer(answer),
    },
  ];

  let queue = state.queue;
  let plan = state.plan;
  if (current.kind === "core") {
    const followUp = selectFollowUp(current, answer, state.difficulty);
    const alreadyPlanned = followUp && (
      state.askedQuestionIds.includes(followUp.id)
      || queue.some((question) => question.id === followUp.id)
    );
    if (followUp && !alreadyPlanned) {
      queue = [
        ...state.queue.slice(0, state.currentIndex + 1),
        followUp,
        ...state.queue.slice(state.currentIndex + 1),
      ];
      plan = {
        ...state.plan,
        followUpIds: [...state.plan.followUpIds, followUp.id],
      };
    }
  }

  const nextIndex = state.currentIndex + 1;
  const nextQuestion = queue[nextIndex];
  const progressed = addAskedQuestion({
    ...state,
    queue,
    plan,
    answers,
    draft: "",
    currentIndex: nextIndex,
    completed: nextIndex >= queue.length,
  }, nextQuestion);

  return progressed;
}

export function createQuestionRetry(state, coreQuestionId) {
  const question = mockQuestions.find((item) => item.id === coreQuestionId);
  const original = state.answers.find(
    (answer) => answer.kind === "core" && answer.questionId === coreQuestionId,
  );
  if (!question || !original) return state;

  const retryNumber = state.answers.filter(
    (answer) => answer.kind === "retry" && answer.coreQuestionId === coreQuestionId,
  ).length + 1;
  const retryQuestion = {
    ...question,
    id: `${question.id}-retry-${retryNumber}`,
    coreQuestionId: question.id,
    originalAnswer: original.answer,
    kind: "retry",
  };

  return addAskedQuestion({
    ...state,
    queue: [retryQuestion],
    currentIndex: 0,
    draft: "",
    retryContext: {
      coreQuestionId,
      originalAnswer: original.answer,
      attempt: retryNumber,
    },
    completed: false,
  }, retryQuestion);
}

export function mockProgress(state) {
  const completedCoreIds = new Set(
    state.answers.filter((answer) => answer.kind === "core").map((answer) => answer.questionId),
  );
  return {
    completed: completedCoreIds.size,
    total: state.plan?.primaryQuestionIds?.length || mockQuestions.length,
  };
}
