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

export function useRepresentativeTraffic(traces, connections, timing = {}) {
  const reducedMotion = useReducedMotion();
  const [motion, setMotion] = useState({ traceIndex: 0, stepIndex: 0, arrived: false, cycle: 0 });
  const traceIndex = traces.length ? motion.traceIndex % traces.length : 0;
  const trace = traces[traceIndex];
  const step = trace?.steps[motion.stepIndex] ?? trace?.steps[0];

  useEffect(() => {
    if (!traces.length || !trace?.steps.length) return;
    if (motion.traceIndex !== traceIndex || motion.stepIndex >= trace.steps.length) {
      setMotion((current) => ({ ...current, traceIndex, stepIndex: 0, arrived: false }));
    }
  }, [motion.stepIndex, motion.traceIndex, trace, traceIndex, traces.length]);

  useEffect(() => {
    if (reducedMotion || !trace || !step) return undefined;

    const atTraceEnd = motion.stepIndex === trace.steps.length - 1;
    const travelMs = step.duration ?? timing.travelMs ?? TRAVEL_MS;
    const nodeHoldMs = step.holdMs ?? timing.nodeHoldMs ?? NODE_HOLD_MS;
    const traceHoldMs = trace.holdMs ?? timing.traceHoldMs ?? TRACE_HOLD_MS;
    const burstTailMs = Math.max(0, (step.burst || 1) - 1) * (step.burstGap ?? 70);
    const delay = motion.arrived ? (atTraceEnd ? traceHoldMs : nodeHoldMs) : travelMs + burstTailMs;
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
  }, [motion, reducedMotion, step, timing.nodeHoldMs, timing.traceHoldMs, timing.travelMs, trace, traces.length]);

  const connection = connections.find((item) => item.id === step?.connectionId);
  const from = step?.reverse ? connection?.to : connection?.from;
  const to = step?.reverse ? connection?.from : connection?.to;

  return {
    activeConnection: reducedMotion ? null : step?.connectionId ?? null,
    activeNode: reducedMotion ? null : motion.arrived ? to : from,
    packet: reducedMotion || motion.arrived || !step ? null : {
      connectionId: step.connectionId,
      reverse: step.reverse,
      tone: step.tone,
      duration: step.duration ?? timing.travelMs ?? TRAVEL_MS,
      burst: step.burst,
      burstGap: step.burstGap,
      key: `representative-${motion.cycle}-${motion.traceIndex}-${motion.stepIndex}`,
    },
    status: reducedMotion ? "Representative traffic paused — reduced motion is enabled." : trace?.label ?? "Representative traffic idle.",
    reducedMotion,
  };
}
