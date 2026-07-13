import { useEffect, useRef } from "react";

const idleAnalysis = {
  amplitude: 0.08,
  subBass: 0.05,
  bass: 0.06,
  lowMid: 0.08,
  mid: 0.1,
  highMid: 0.08,
  treble: 0.06,
  spectralCentroid: 0.35,
  stereoBalance: 0,
  beat: false,
  waveform: null,
};

export default function useAudioAnalysis(engine, enabled = true) {
  const analysisRef = useRef({ ...idleAnalysis });
  const idleRef = useRef({ ...idleAnalysis });

  useEffect(() => {
    if (!enabled) return undefined;
    let animationFrame;
    const update = (time) => {
      const live = engine?.getAnalysis(time);
      if (live && engine?.trackName) {
        analysisRef.current = live;
      } else {
        const pulse = (Math.sin(time * 0.0007) + 1) * 0.5;
        const idle = idleRef.current;
        idle.amplitude = 0.06 + pulse * 0.035;
        idle.bass = 0.05 + pulse * 0.03;
        idle.mid = 0.08 + (1 - pulse) * 0.025;
        idle.treble = 0.05 + Math.sin(time * 0.0013) * 0.015;
        analysisRef.current = idle;
      }
      animationFrame = window.requestAnimationFrame(update);
    };
    animationFrame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [enabled, engine]);

  return analysisRef;
}
