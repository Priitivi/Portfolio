import { createMockState } from "./questionProgression.js";
import { createTimerState } from "./timer.js";

export const COACH_SESSION_KEY = "priit:lab:interview-coach:v1";

export function createInitialCoachSession() {
  return {
    version: 3,
    screen: "welcome",
    selectedMode: "prepare",
    settings: {
      difficulty: "realistic",
      readAloud: false,
      handsFree: false,
    },
    notes: "",
    mockSessionCounter: 0,
    mock: createMockState({ difficulty: "realistic", sessionNumber: 1 }),
    roleplay: {
      messages: [],
      coveredIntents: [],
      turns: [],
      draft: "",
      turnCounter: 0,
      timer: createTimerState(),
    },
    report: null,
  };
}

export function loadCoachSession(storage = globalThis.sessionStorage) {
  if (!storage) return createInitialCoachSession();
  try {
    const stored = JSON.parse(storage.getItem(COACH_SESSION_KEY));
    if (![1, 2, 3].includes(stored?.version)) return createInitialCoachSession();
    const initial = createInitialCoachSession();
    const mock = { ...initial.mock, ...stored.mock };
    const answeredIds = (mock.answers || []).map((answer) => answer.questionId);
    const currentQuestionId = mock.queue?.[mock.currentIndex]?.id;
    const askedQuestionIds = [
      ...new Set([
        ...(stored.mock?.askedQuestionIds || answeredIds),
        ...(currentQuestionId ? [currentQuestionId] : []),
      ]),
    ];
    const storedFollowUpIds = stored.mock?.followUpAskedIds
      || (mock.answers || []).filter((answer) => answer.kind === "follow-up").map((answer) => answer.questionId);
    const retryAskedIds = stored.mock?.retryAskedIds
      || askedQuestionIds.filter((id) => /-retry-\d+$/.test(id));
    return {
      ...initial,
      ...stored,
      version: 3,
      settings: { ...initial.settings, ...stored.settings },
      notes: stored.notes || stored.roleplay?.notes || "",
      mockSessionCounter: stored.mockSessionCounter || 0,
      mock: {
        ...mock,
        difficulty: stored.mock?.difficulty || stored.settings?.difficulty || "realistic",
        askedQuestionIds,
        primaryAskedIds: stored.mock?.primaryAskedIds
          || (mock.answers || []).filter((answer) => answer.kind === "core").map((answer) => answer.questionId),
        followUpAskedIds: storedFollowUpIds.filter((id) => !/-retry-\d+$/.test(id)),
        retryAskedIds,
      },
      roleplay: {
        ...initial.roleplay,
        ...stored.roleplay,
        turns: stored.roleplay?.turns || [],
        draft: stored.roleplay?.draft || "",
        turnCounter: stored.roleplay?.turnCounter || stored.roleplay?.turns?.length || 0,
      },
    };
  } catch {
    return createInitialCoachSession();
  }
}

export function saveCoachSession(session, storage = globalThis.sessionStorage) {
  storage?.setItem(COACH_SESSION_KEY, JSON.stringify(session));
}

export function clearCoachSession(storage = globalThis.sessionStorage) {
  storage?.removeItem(COACH_SESSION_KEY);
  return createInitialCoachSession();
}
