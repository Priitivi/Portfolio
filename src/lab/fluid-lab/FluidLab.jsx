import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FluidControls from "./FluidControls";
import FluidSimulation from "./FluidSimulation";
import {
  createFluidSettings,
  detectFluidQuality,
  fluidColourForSplat,
  normaliseFluidPointer,
} from "./fluidConfig";
import "./fluid-lab.css";

function detectInitialQuality(reducedMotion) {
  return detectFluidQuality({
    memory: navigator.deviceMemory || 4,
    cores: navigator.hardwareConcurrency || 4,
    mobile: window.matchMedia("(max-width: 760px), (pointer: coarse)").matches,
    reducedMotion,
  });
}

function fallbackMessage(code) {
  if (code === "WEBGL2_UNAVAILABLE") return "This browser cannot open a WebGL2 context. Fluid Lab needs GPU shader support, but the rest of Priit’s Lab remains available.";
  if (code === "FLOAT_FRAMEBUFFER_UNAVAILABLE" || code === "FLOAT_FRAMEBUFFER_INCOMPLETE") return "This GPU cannot render to floating-point framebuffers, which the pressure and velocity fields require.";
  if (code === "CONTEXT_LOST") return "The graphics device reset the simulation. Fluid Lab will try to rebuild when the context returns.";
  return "The simulation pipeline could not be initialised on this device.";
}

export default function FluidLab({ navigate, onLogout }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const simulationRef = useRef(null);
  const pointersRef = useRef(new Map());
  const pointerColourSequenceRef = useRef(0);
  const slowSamplesRef = useRef(0);
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const [settings, setSettings] = useState(() => createFluidSettings(reducedMotion));
  const [qualityMode, setQualityMode] = useState("auto");
  const [automaticQuality, setAutomaticQuality] = useState(() => detectInitialQuality(reducedMotion));
  const [paused, setPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(document.hidden);
  const [collapsed, setCollapsed] = useState(window.matchMedia("(max-width: 760px)").matches);
  const [interfaceHidden, setInterfaceHidden] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [engineState, setEngineState] = useState("booting");
  const [engineRevision, setEngineRevision] = useState(0);
  const [errorCode, setErrorCode] = useState("");
  const [performance, setPerformance] = useState({ fps: 0, resolution: "" });
  const [liveMessage, setLiveMessage] = useState("Fluid field loading");
  const actualQuality = qualityMode === "auto" ? automaticQuality : qualityMode;
  const effectivelyPaused = paused || tabHidden;

  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Fluid Lab // Priit Lab";
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    const onVisibilityChange = () => setTabHidden(document.hidden);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.title = originalTitle;
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let active = true;
    setEngineState("booting");
    setErrorCode("");

    let simulation;
    try {
      simulation = new FluidSimulation(canvas, {
        settings,
        quality: actualQuality,
        reducedMotion,
        onPerformance: (sample) => {
          if (active) setPerformance({ fps: sample.fps, resolution: sample.resolution });
        },
        onContextState: (state) => {
          if (!active) return;
          if (state === "lost") {
            setErrorCode("CONTEXT_LOST");
            setEngineState("error");
          } else {
            setEngineRevision((revision) => revision + 1);
          }
        },
      }).initialise();
      simulationRef.current = simulation;
      setEngineState("ready");
      setLiveMessage("Fluid field ready. Drag across the canvas to inject colour and momentum.");
    } catch (error) {
      simulation?.destroy();
      const code = error?.message || "INITIALISATION_FAILED";
      setErrorCode(code);
      setEngineState("error");
      setLiveMessage("Fluid simulation unavailable on this device.");
    }

    return () => {
      active = false;
      simulationRef.current?.destroy();
      simulationRef.current = null;
    };
    // The controller receives live setting and quality updates through dedicated effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineRevision, reducedMotion]);

  useEffect(() => simulationRef.current?.updateSettings(settings), [settings]);
  useEffect(() => simulationRef.current?.setQuality(actualQuality), [actualQuality]);
  useEffect(() => simulationRef.current?.setPaused(effectivelyPaused), [effectivelyPaused]);

  useEffect(() => {
    if (qualityMode !== "auto" || !performance.fps) {
      slowSamplesRef.current = 0;
      return;
    }
    slowSamplesRef.current = performance.fps < 43 ? slowSamplesRef.current + 1 : Math.max(0, slowSamplesRef.current - 1);
    if (slowSamplesRef.current < 3) return;
    setAutomaticQuality((current) => current === "high" || current === "ultra" ? "balanced" : "low");
    slowSamplesRef.current = 0;
  }, [performance, qualityMode]);

  const updateSetting = useCallback((key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

  const randomBurst = useCallback(() => {
    simulationRef.current?.randomBurst(reducedMotion ? 5 : 11);
    setIntroVisible(false);
    setLiveMessage("Random colour burst injected into the field.");
  }, [reducedMotion]);

  const clearField = useCallback(() => {
    simulationRef.current?.clear();
    setIntroVisible(false);
    setLiveMessage("Fluid field cleared.");
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch {
      setLiveMessage("Fullscreen was blocked by the browser.");
    }
  }, []);

  useEffect(() => {
    const shortcuts = (event) => {
      if (event.target?.matches?.("input, select, textarea, button, [contenteditable='true']")) return;
      if (event.code === "KeyP") setPaused((value) => !value);
      else if (event.code === "KeyC") clearField();
      else if (event.code === "KeyB") randomBurst();
      else if (event.code === "KeyH") setInterfaceHidden((value) => !value);
      else if (event.code === "KeyF") void toggleFullscreen();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, [clearField, randomBurst, toggleFullscreen]);

  const updateCursor = (event) => {
    if (!cursorRef.current || !rootRef.current) return;
    const bounds = rootRef.current.getBoundingClientRect();
    cursorRef.current.style.transform = `translate3d(${event.clientX - bounds.left}px, ${event.clientY - bounds.top}px, 0)`;
    cursorRef.current.style.opacity = event.pointerType === "touch" ? "0" : "1";
  };

  const addPointerSamples = (event) => {
    const pointer = pointersRef.current.get(event.pointerId);
    if (!pointer || !simulationRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const samples = event.nativeEvent.getCoalescedEvents?.() || [event.nativeEvent];
    samples.forEach((sample) => {
      const point = normaliseFluidPointer(sample.clientX, sample.clientY, bounds);
      const deltaX = point.x - pointer.x;
      const deltaY = point.y - pointer.y;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 0.0001) {
        simulationRef.current.queueSplat(point.x, point.y, deltaX, deltaY, pointer.colour);
        pointer.moved = true;
      }
      pointer.x = point.x;
      pointer.y = point.y;
    });
  };

  const pointerDown = (event) => {
    if (engineState !== "ready") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = normaliseFluidPointer(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
    const colour = fluidColourForSplat(settings.palette, pointerColourSequenceRef.current++);
    pointersRef.current.set(event.pointerId, { ...point, moved: false, colour });
    simulationRef.current?.queueSplat(point.x, point.y, 0.004, 0.002, colour);
    setIntroVisible(false);
    updateCursor(event);
  };

  const pointerMove = (event) => {
    updateCursor(event);
    addPointerSamples(event);
  };

  const pointerUp = (event) => {
    const pointer = pointersRef.current.get(event.pointerId);
    if (pointer && !pointer.moved) {
      simulationRef.current?.queueSplat(pointer.x, pointer.y, (Math.random() - 0.5) * 0.025, (Math.random() - 0.5) * 0.025, pointer.colour);
    }
    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const canvasKeyDown = (event) => {
    if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault();
      randomBurst();
    }
  };

  return (
    <main
      ref={rootRef}
      className={`fluid-lab ${interfaceHidden ? "interface-hidden" : ""} ${effectivelyPaused ? "is-paused" : ""}`}
      style={{ "--fluid-brush-size": `${Math.max(28, settings.brush * 820)}px` }}
    >
      <canvas
        ref={canvasRef}
        className="fluid-canvas"
        tabIndex={0}
        role="img"
        aria-label="Interactive GPU fluid field. Drag a mouse or finger to inject coloured dye and momentum. Press Enter for a random burst."
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onPointerLeave={(event) => { if (cursorRef.current && event.pointerType !== "touch") cursorRef.current.style.opacity = "0"; }}
        onKeyDown={canvasKeyDown}
      />
      <div ref={cursorRef} className="fluid-brush-cursor" aria-hidden="true"><i /></div>
      <div className="fluid-grain" aria-hidden="true" />

      {!interfaceHidden && (
        <>
          <header className="fluid-topbar">
            <button type="button" onClick={() => navigate("/lab")}>← Lab dashboard</button>
            <div><span>EXPERIMENT 003</span><strong>FLUID LAB</strong></div>
            <nav aria-label="Fluid Lab navigation">
              <span className={`fluid-engine-state is-${engineState}`}>{engineState === "ready" ? `${actualQuality} / GPU` : engineState}</span>
              <button type="button" onClick={() => setInterfaceHidden(true)}>Hide interface</button>
              <button type="button" onClick={onLogout}>Revoke clearance</button>
            </nav>
          </header>

          <FluidControls
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            settings={settings}
            updateSetting={updateSetting}
            qualityMode={qualityMode}
            actualQuality={actualQuality}
            setQualityMode={setQualityMode}
            paused={paused}
            onTogglePause={() => setPaused((value) => !value)}
            onClear={clearField}
            onBurst={randomBurst}
            onFullscreen={toggleFullscreen}
            fullscreen={fullscreen}
            performance={performance}
          />

          <div className="fluid-caption" aria-hidden="true"><span>DRAG TO DISTURB</span><i /> <small>POINTER VELOCITY → MOMENTUM</small></div>
        </>
      )}

      {interfaceHidden && <button type="button" className="fluid-interface-return" onClick={() => setInterfaceHidden(false)}>Show controls <span>H</span></button>}

      {introVisible && engineState === "ready" && (
        <section className="fluid-intro" aria-labelledby="fluid-intro-title">
          <p>PRIIT LAB // LIVE GPU FIELD</p>
          <h1 id="fluid-intro-title">Touch the current.<br /><em>Make colour move.</em></h1>
          <p>Drag anywhere to inject dye and momentum. Faster gestures cut through the field; slow circles pull colour into vortices.</p>
          <button type="button" onClick={randomBurst}>Disturb the surface <span aria-hidden="true">→</span></button>
          <small>Mouse, pen, touch, and keyboard supported.</small>
        </section>
      )}

      {errorCode && (
        <section className="fluid-fallback" role="alert">
          <span>GPU PIPELINE INTERRUPTED</span>
          <h1>The current is offline.</h1>
          <p>{fallbackMessage(errorCode)}</p>
          <div><button type="button" onClick={() => navigate("/lab")}>Return to dashboard</button><button type="button" onClick={() => setEngineRevision((revision) => revision + 1)}>Retry pipeline</button></div>
        </section>
      )}

      {effectivelyPaused && engineState === "ready" && <div className="fluid-paused" role="status">FIELD SUSPENDED {tabHidden ? "// TAB INACTIVE" : "// PRESS P TO RESUME"}</div>}
      <p className="sr-only" aria-live="polite">{liveMessage}</p>
    </main>
  );
}
