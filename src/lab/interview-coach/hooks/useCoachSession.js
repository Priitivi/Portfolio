import { useCallback, useEffect, useState } from "react";
import {
  clearCoachSession,
  loadCoachSession,
  saveCoachSession,
} from "../utils/sessionState.js";

export default function useCoachSession() {
  const [session, setSession] = useState(() => loadCoachSession());

  useEffect(() => {
    saveCoachSession(session);
  }, [session]);

  const updateSession = useCallback((updater) => {
    setSession((current) => (typeof updater === "function" ? updater(current) : updater));
  }, []);

  const resetSession = useCallback(() => {
    setSession(clearCoachSession());
  }, []);

  return { session, updateSession, resetSession };
}
