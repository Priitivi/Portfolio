import { useCallback, useState } from "react";
import { createStoredEnvelope, parseStoredEnvelope } from "./cosyUtils";

export function useCosyStorage(key, fallback, validate) {
  const [value, setValueState] = useState(() => {
    if (typeof window === "undefined") return fallback;
    return parseStoredEnvelope(window.localStorage.getItem(key), fallback, validate);
  });

  const setValue = useCallback((next) => {
    setValueState((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      try { window.localStorage.setItem(key, createStoredEnvelope(resolved)); } catch { /* Private browsing and quotas can disable storage. */ }
      return resolved;
    });
  }, [key]);

  const reset = useCallback(() => {
    try { window.localStorage.removeItem(key); } catch { /* Local UI still resets. */ }
    setValueState(fallback);
  }, [fallback, key]);

  return [value, setValue, reset];
}
