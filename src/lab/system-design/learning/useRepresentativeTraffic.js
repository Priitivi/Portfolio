import { useEffect, useState } from "react";

const TRAVEL_MS = 500;
const NODE_HOLD_MS = 140;
const TRACE_HOLD_MS = 340;

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event) => setReducedMotion(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}

export function useRepresentativeTraffic(traces, connections) {
  const reducedMotion = useReducedMotion();
  const [motion, setMotion] = useState({ traceIndex: 0, stepIndex: 0, arrived: false, cycle: 0 });
  const trace = traces[motion.traceIndex % traces.length];
  const step = trace.steps[motion.stepIndex];

  useEffect(() => {
    if (reducedMotion) return undefined;

    const atTraceEnd = motion.stepIndex === trace.steps.length - 1;
    const delay = motion.arrived ? (atTraceEnd ? TRACE_HOLD_MS : NODE_HOLD_MS) : TRAVEL_MS;
    const timeout = window.setTimeout(() => {
      if (!motion.arrived) {
        setMotion((current) => ({ ...current, arrived: true }));
        return;
      }

      setMotion((current) => {
        if (current.stepIndex < trace.steps.length - 1) {
          return { ...current, stepIndex: current.stepIndex + 1, arrived: false };
        }
        const nextTraceIndex = (current.traceIndex + 1) % traces.length;
        return {
          traceIndex: nextTraceIndex,
          stepIndex: 0,
          arrived: false,
          cycle: nextTraceIndex === 0 ? current.cycle + 1 : current.cycle,
        };
      });
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [motion, reducedMotion, trace, traces.length]);

  const connection = connections.find((item) => item.id === step.connectionId);
  const from = step.reverse ? connection?.to : connection?.from;
  const to = step.reverse ? connection?.from : connection?.to;

  return {
    activeConnection: reducedMotion ? null : step.connectionId,
    activeNode: reducedMotion ? null : motion.arrived ? to : from,
    packet: reducedMotion || motion.arrived ? null : {
      connectionId: step.connectionId,
      reverse: step.reverse,
      tone: step.tone,
      duration: TRAVEL_MS,
      key: `representative-${motion.cycle}-${motion.traceIndex}-${motion.stepIndex}`,
    },
    status: reducedMotion ? "Representative traffic paused — reduced motion is enabled." : trace.label,
    reducedMotion,
  };
}
