import { useMemo } from "react";

export default function useAdaptiveQuality() {
  return useMemo(() => {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const mobile = window.matchMedia("(max-width: 720px)").matches;
    const low = mobile || memory <= 2 || cores <= 2;
    const high = !low && memory >= 8 && cores >= 8;
    return {
      tier: low ? "low" : high ? "high" : "medium",
      dpr: low ? [0.85, 1] : high ? [1, 1.35] : [0.9, 1.15],
      particleScale: low ? 0.35 : high ? 0.78 : 0.55,
      ringCount: low ? 16 : high ? 28 : 22,
    };
  }, []);
}
