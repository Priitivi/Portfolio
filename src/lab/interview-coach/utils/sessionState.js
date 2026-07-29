import { createMockState } from "./questionProgression.js";
import { createTimerState } from "./timer.js";

export const COACH_SESSION_KEY = "priit:lab:interview-coach:v1";

export function createInitialCoachSession() {
  return {
    version: 2,
    screen: "welcome",
    selectedMode: "prepare",
    mock: createMockState(),
    roleplay: {
      messages: [],
      coveredIntents: [],
      turns: [],
      draft: "",
      turnCounter: 0,
      notes: "",
      timer: createTimerState(),
    },
    report: null,
  };
}

export function loadCoachSession(storage = globalThis.sessionStorage) {
  if (!storage) return createInitialCoachSession();
  try {
    const stored = JSON.parse(storage.getItem(COACH_SESSION_KEY));
    if (![1, 2].includes(stored?.version)) return createInitialCoachSession();
    const initial = createInitialCoachSession();
    return {
      ...initial,
      ...stored,
      version: 2,
      mock: { ...initial.mock, ...stored.mock },
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
