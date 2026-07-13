import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import AstralBloom from "./AstralBloom";
import Environment from "./Environment";
import LiquidSignal from "./LiquidSignal";
import NeuralTunnel from "./NeuralTunnel";
import SignalCollapse from "./SignalCollapse";

function VisualMode(props) {
  if (props.settings.mode === "liquid") return <LiquidSignal {...props} />;
  if (props.settings.mode === "astral") return <AstralBloom {...props} />;
  if (props.settings.mode === "collapse") return <SignalCollapse {...props} />;
  return <NeuralTunnel {...props} />;
}

function AdaptiveFramePacer({ quality }) {
  const { gl } = useThree();
  const pace = useRef({ average: 1 / 60, slowFor: 0, fastFor: 0, cooldown: 0 });

  useFrame((_, delta) => {
    const sample = Math.min(delta, 0.1);
    const state = pace.current;
    state.average += (sample - state.average) * 0.04;
    state.cooldown = Math.max(0, state.cooldown - sample);
    if (state.cooldown > 0) return;

    state.slowFor = state.average > 1 / 48 ? state.slowFor + sample : 0;
    state.fastFor = state.average < 1 / 57 ? state.fastFor + sample : 0;
    const [minimum, maximum] = quality.dpr;
    const current = gl.getPixelRatio();
    const deviceMaximum = Math.min(window.devicePixelRatio || 1, maximum);

    if (state.slowFor > 1.2 && current > minimum) {
      gl.setPixelRatio(Math.max(minimum, current - 0.15));
      state.slowFor = 0;
      state.fastFor = 0;
      state.cooldown = 2;
    } else if (state.fastFor > 4 && current < deviceMaximum) {
      gl.setPixelRatio(Math.min(deviceMaximum, current + 0.1));
      state.slowFor = 0;
      state.fastFor = 0;
      state.cooldown = 3;
    }
  });

  return null;
}

export default function ReactorCanvas({ analysisRef, palette, settings, quality, reducedMotion, paused }) {
  return (
    <Canvas
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      dpr={quality.dpr}
      camera={{ position: [0, 0, 8.5], fov: 55, near: 0.1, far: 80 }}
      gl={{ antialias: quality.tier === "high", alpha: false, powerPreference: "high-performance" }}
      frameloop={paused ? "never" : "always"}
    >
      <AdaptiveFramePacer quality={quality} />
      <Environment palette={palette} analysisRef={analysisRef} settings={settings} reducedMotion={reducedMotion} />
      <VisualMode analysisRef={analysisRef} palette={palette} settings={settings} quality={quality} />
    </Canvas>
  );
}
