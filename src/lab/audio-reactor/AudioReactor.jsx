import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AudioControls, { ModeSelector, TransportControls } from "./AudioControls";
import AudioDropzone from "./AudioDropzone";
import AudioEngine from "./audio/AudioEngine";
import useAdaptiveQuality from "./hooks/useAdaptiveQuality";
import useAudioAnalysis from "./hooks/useAudioAnalysis";
import { defaultReactorSettings, palettes, visualModes } from "./reactorConfig";
import ReactorCanvas from "./scene/ReactorCanvas";
import { supportsWebGL } from "../../utils/webgl";
import "./audio-reactor.css";

const emptyTrack = { name: "", currentTime: 0, duration: 0, volume: 1, playing: false, error: null };

export default function AudioReactor({ navigate, onLogout }) {
  const [engine] = useState(() => new AudioEngine());
  const [track, setTrack] = useState(emptyTrack);
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const [settings, setSettings] = useState(() => defaultReactorSettings(reducedMotion));
  const [panelCollapsed, setPanelCollapsed] = useState(() => window.matchMedia("(max-width: 1100px)").matches);
  const [interfaceHidden, setInterfaceHidden] = useState(false);
  const [visualsPaused, setVisualsPaused] = useState(false);
  const [pageHidden, setPageHidden] = useState(document.hidden);
  const [error, setError] = useState("");
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const rootRef = useRef(null);
  const quality = useAdaptiveQuality();
  const analysisRef = useAudioAnalysis(engine, !visualsPaused && !pageHidden);
  const palette = palettes[settings.palette];
  const webglAvailable = useMemo(() => supportsWebGL(), []);

  useEffect(() => engine.subscribe(setTrack), [engine]);
  useEffect(() => { engine.setSmoothing(settings.smoothing); }, [engine, settings.smoothing]);
  useEffect(() => () => { engine.dispose(); }, [engine]);

  useEffect(() => {
    const visibility = () => {
      setPageHidden(document.hidden);
      if (document.hidden) void engine.suspend();
      else void engine.resume();
    };
    const fullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("fullscreenchange", fullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("fullscreenchange", fullscreenChange);
    };
  }, [engine]);

  const togglePlayback = useCallback(async () => {
    setError("");
    try {
      if (track.playing) engine.pause();
      else await engine.play();
    } catch (caught) {
      setError(caught.message || "Playback could not start. Interact with the page and try again.");
    }
  }, [engine, track.playing]);

  const loadFile = async (file) => {
    setError("");
    try {
      await engine.load(file);
    } catch (caught) {
      setError(caught.message);
    }
  };

  const updateSetting = useCallback((name, value) => {
    setSettings((current) => ({ ...current, [name]: value }));
  }, []);

  useEffect(() => {
    const keyboard = (event) => {
      const tag = event.target?.tagName;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag)) return;
      if (event.code === "Space" && track.name) { event.preventDefault(); togglePlayback(); }
      if (event.code === "KeyH") setInterfaceHidden((hidden) => !hidden);
      if (event.code === "KeyV") setVisualsPaused((paused) => !paused);
      if (/Digit[1-4]/.test(event.code)) {
        const mode = visualModes[Number(event.code.slice(-1)) - 1];
        if (mode) updateSetting("mode", mode.id);
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [togglePlayback, track.name, updateSetting]);

  const enterFullscreen = async () => {
    setShowSafetyWarning(false);
    try {
      await rootRef.current?.requestFullscreen();
    } catch {
      setError("Fullscreen was blocked by the browser. Use its site controls or try again.");
    }
  };

  return (
    <main ref={rootRef} className={`audio-reactor quality-${quality.tier} ${interfaceHidden ? "is-interface-hidden" : ""} ${fullscreen ? "is-fullscreen" : ""}`}>
      <div className="reactor-scanlines" aria-hidden="true" />
      {webglAvailable ? (
        <ReactorCanvas analysisRef={analysisRef} palette={palette} settings={settings} quality={quality} reducedMotion={reducedMotion} paused={visualsPaused || pageHidden} />
      ) : (
        <div className="reactor-webgl-fallback" role="status"><strong>VISUAL CORE OFFLINE</strong><p>WebGL is unavailable. Audio playback and controls remain accessible.</p></div>
      )}

      {!interfaceHidden && (
        <div className="reactor-interface">
          <header className="reactor-header">
            <button type="button" onClick={() => navigate("/lab")}>← Lab dashboard</button>
            <div><span className="reactor-live-dot" /> EXPERIMENT 001 <strong>PSYCHEDELIC AUDIO REACTOR</strong></div>
            <nav aria-label="Reactor navigation"><button type="button" onClick={onLogout}>Revoke clearance</button><a href="/">Portfolio</a></nav>
          </header>

          <ModeSelector mode={settings.mode} onChange={(mode) => updateSetting("mode", mode)} />
          <AudioControls
            collapsed={panelCollapsed} setCollapsed={setPanelCollapsed} settings={settings} updateSetting={updateSetting}
            track={track} onFile={loadFile}
            onFullscreen={() => setShowSafetyWarning(true)} onHideInterface={() => setInterfaceHidden(true)}
            visualsPaused={visualsPaused} onToggleVisuals={() => setVisualsPaused((paused) => !paused)} quality={quality}
          />

          {!track.name && <div className="reactor-empty-state"><p>LOCAL AUDIO INPUT / DORMANT</p><h1>Give the system<br />something to <em>feel.</em></h1><AudioDropzone onFile={loadFile} /><span>Your audio remains on this device and is not uploaded.</span></div>}
          {track.name && <div className="reactor-track-label"><span>NOW REACTING TO</span><strong>{track.name}</strong><small>{visualModes.find((mode) => mode.id === settings.mode)?.label}</small></div>}
          {error && <div className="reactor-error" role="alert">{error}</div>}
          {track.name && <TransportControls track={track} onTogglePlayback={togglePlayback} onSeek={(time) => engine.seek(time)} onVolume={(volume) => engine.setVolume(volume)} onRestart={() => engine.restart()} onRemove={() => engine.remove()} />}
          <div className="reactor-keyboard-hints" aria-hidden="true"><span>SPACE PLAY/PAUSE</span><span>1—4 MODES</span><span>V PAUSE VISUALS</span><span>H HIDE UI</span></div>
        </div>
      )}

      {interfaceHidden && <button type="button" className="reactor-show-interface" onClick={() => setInterfaceHidden(false)}>Show interface [H]</button>}
      {visualsPaused && <div className="reactor-paused" role="status">VISUAL OUTPUT PAUSED</div>}

      {showSafetyWarning && (
        <div className="reactor-safety-backdrop" role="dialog" aria-modal="true" aria-labelledby="reactor-safety-title">
          <section>
            <p>VISUAL SAFETY CHECK</p>
            <h2 id="reactor-safety-title">Before you enter fullscreen.</h2>
            <p>This experience contains animated, reactive, and flashing visual elements. Reduced-motion and lower-intensity options are available.</p>
            <div><button type="button" onClick={enterFullscreen} autoFocus>Continue to fullscreen</button><button type="button" onClick={() => setShowSafetyWarning(false)}>Cancel</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
