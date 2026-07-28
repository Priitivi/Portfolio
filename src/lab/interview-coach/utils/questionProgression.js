import { mockQuestions } from "../data/mockQuestions.js";

const EVIDENCE_MARKERS = [
  "for example",
  "a time",
  "when i",
  "my role",
  "the result",
  "as a result",
  "feedback",
];

export function createMockState() {
  return {
    queue: mockQuestions.map((question) => ({ ...question, kind: "core" })),
    currentIndex: 0,
    answers: [],
    completed: false,
  };
}

export function selectFollowUp(question, answer) {
  if (!question.followUps?.length) return null;
  const normalized = answer.toLowerCase();
  const hasEvidence = EVIDENCE_MARKERS.some((marker) => normalized.includes(marker));
  const index = hasEvidence && question.followUps.length > 1 ? 1 : 0;
  const followUp = question.followUps[index];

  return {
    ...followUp,
    competency: question.competency,
    sourceType: question.sourceType,
    parentId: question.id,
    kind: "follow-up",
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
