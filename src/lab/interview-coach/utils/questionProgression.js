import { mockQuestions } from "../data/mockQuestions.js";
import { analyseMockAnswer } from "../conversation/analyseMockAnswer.js";

const contextualFollowUps = {
  example: "Could you give me a specific example of when you did this?",
  action: "What was your own responsibility in that situation?",
  result: "What was the outcome, and how did you know it had been successful?",
  stakeholders: "Who were the stakeholders, and how did you adapt your communication for them?",
  audience: "How did you make sure the explanation worked for the audience receiving it?",
  challenge: "What was the main challenge or blocker, and how did you respond?",
  reflection: "What did you learn, and what would you carry into this role?",
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

export function createMockState() {
  return {
    queue: mockQuestions.map((question) => ({ ...question, kind: "core" })),
    currentIndex: 0,
    answers: [],
    draft: "",
    completed: false,
  };
}

export function selectFollowUp(question, answer) {
  const analysis = analyseMockAnswer(answer);
  let target = null;
  if (questionExpectsExample(question) && !analysis.dimensions.concreteExample) target = "example";
  else if (questionExpectsExample(question) && !analysis.dimensions.personalAction) target = "action";
  else if (questionExpectsExample(question) && !analysis.dimensions.result) target = "result";
  else if (isStakeholderQuestion(question) && !analysis.dimensions.collaboration) target = "stakeholders";
  else if (isLearningQuestion(question) && !analysis.dimensions.audienceImpact) target = "audience";
  else if (!analysis.dimensions.challenge && /blocker|priorit|feedback/i.test(question.prompt)) target = "challenge";
  else if (!analysis.dimensions.reflection && /feedback|learning agility|unfamiliar|improve/i.test(`${question.competency} ${question.prompt}`)) target = "reflection";

  const authored = target
    ? {
      id: `${question.id}-${target}`,
      prompt: contextualFollowUps[target],
      heuristicTarget: target,
    }
    : question.followUps?.[0];
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

export function progressMockInterview(state, answer) {
  const current = state.queue[state.currentIndex];
  if (!current || !answer.trim()) return state;

  const answers = [
    ...state.answers,
    {
      questionId: current.id,
      parentId: current.parentId || null,
      kind: current.kind,
      competency: current.competency,
      prompt: current.prompt,
      answer: answer.trim(),
      analysis: analyseMockAnswer(answer),
    },
  ];

  let queue = state.queue;
  if (current.kind === "core") {
    const followUp = selectFollowUp(current, answer);
    if (followUp) {
      queue = [
        ...state.queue.slice(0, state.currentIndex + 1),
        followUp,
        ...state.queue.slice(state.currentIndex + 1),
      ];
    }
  }

  const nextIndex = state.currentIndex + 1;
  return {
    queue,
    answers,
    draft: "",
    currentIndex: nextIndex,
    completed: nextIndex >= queue.length,
  };
}

export function mockProgress(state) {
  const completedCoreIds = new Set(
    state.answers.filter((answer) => answer.kind === "core").map((answer) => answer.questionId),
  );
  return {
    completed: completedCoreIds.size,
    total: mockQuestions.length,
  };
}
