import { createMockState } from "./questionProgression.js";
import { createTimerState } from "./timer.js";

export const COACH_SESSION_KEY = "priit:lab:interview-coach:v1";

export function createInitialCoachSession() {
  return {
    version: 1,
    screen: "welcome",
    selectedMode: "prepare",
    mock: createMockState(),
    roleplay: {
      messages: [],
      coveredIntents: [],
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
    if (stored?.version !== 1) return createInitialCoachSession();
    return stored;
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
