import { useCallback, useEffect, useRef } from "react";

export function useSimulationScheduler() {
  const timers = useRef(new Set());
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const clear = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
  }, []);

  const schedule = useCallback((callback, delay) => {
    const adjustedDelay = reducedMotion.current ? Math.min(delay, 80) : delay;
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, adjustedDelay);
    timers.current.add(timer);
    return timer;
  }, []);

  return { schedule, clear };
}
