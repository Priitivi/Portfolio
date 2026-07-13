import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PaintWorld from "./PaintWorld";
import { paintSoundtracks } from "./soundtracks";
import usePaintControls from "./usePaintControls";
import "./paint-surfer.css";

function MobilePaintControls({ controlsRef, disabled }) {
  const press = (code) => (event) => {
    event.preventDefault();
    if (!disabled) controlsRef.current.add(code);
  };
  const release = (code) => (event) => {
    event.preventDefault();
    controlsRef.current.delete(code);
  };
  const control = (code) => ({ onPointerDown: press(code), onPointerUp: release(code), onPointerCancel: release(code), onPointerLeave: release(code) });

  return (
    <div className="paint-mobile-controls" aria-label="Mobile game controls">
      <div className="paint-mobile-move">
        <button type="button" disabled={disabled} aria-label="Move forward" {...control("KeyW")}>↑</button>
        <button type="button" disabled={disabled} aria-label="Move left" {...control("KeyA")}>←</button>
        <button type="button" disabled={disabled} aria-label="Move backward" {...control("KeyS")}>↓</button>
        <button type="button" disabled={disabled} aria-label="Move right" {...control("KeyD")}>→</button>
      </div>
      <div className="paint-mobile-actions">
        <button type="button" disabled={disabled} className="paint-mobile-jump" {...control("Space")}>Jump</button>
        <button type="button" disabled={disabled} className="paint-mobile-surf" {...control("Paint")}>Paint surf</button>
      </div>
    </div>
  );
}

export default function PaintSurfer({ navigate, onLogout }) {
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [progress, setProgress] = useState(0);
  const [surfCount, setSurfCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [musicError, setMusicError] = useState("");
  const audioRef = useRef(null);
  const paintReleaseTimer = useRef(null);
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const quality = useMemo(() => {
    const mobile = window.matchMedia("(max-width: 800px)").matches;
    const modestCpu = (navigator.hardwareConcurrency || 4) <= 4;
    return mobile || modestCpu ? "low" : "high";
  }, []);
  const controlsRef = usePaintControls(started && !paused && !completed);
  const track = paintSoundtracks[trackIndex];
  const handleReady = useCallback(() => setReady(true), []);

  const playMusic = useCallback(async () => {
    if (!audioRef.current || !musicOn) return;
    try {
      audioRef.current.volume = 0.36;
      await audioRef.current.play();
      setMusicError("");
    } catch (caught) {
      setMusicError(caught?.name === "NotAllowedError" ? "Select Play once to enable music." : "This soundtrack could not start in the browser.");
    }
  }, [musicOn]);

  useEffect(() => {
    if (!started || paused || !musicOn) audioRef.current?.pause();
    else void playMusic();
  }, [musicOn, paused, playMusic, started, trackIndex]);

  useEffect(() => {
    const shortcuts = (event) => {
      const tag = event.target?.tagName;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag)) return;
      if (event.code === "KeyP" && started) setPaused((current) => !current);
      if (event.code === "KeyM") setMusicOn((current) => !current);
      if (event.code === "Escape" && started) setShowHelp((current) => !current);
    };
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, [started]);

  useEffect(() => () => window.clearTimeout(paintReleaseTimer.current), []);

  const start = () => {
    setStarted(true);
    setPaused(false);
    void playMusic();
  };

  const toggleMusic = async () => {
    if (musicOn) {
      audioRef.current?.pause();
      setMusicOn(false);
      return;
    }
    setMusicOn(true);
    try {
      audioRef.current.volume = 0.36;
      await audioRef.current.play();
      setMusicError("");
    } catch {
      setMusicError("Select Play once more if the browser blocked audio.");
    }
  };

  const selectNextTrack = async () => {
    const nextIndex = (trackIndex + 1) % paintSoundtracks.length;
    const nextTrack = paintSoundtracks[nextIndex];
    setTrackIndex(nextIndex);
    if (!audioRef.current) return;
    audioRef.current.src = nextTrack.src;
    audioRef.current.load();
    if (musicOn) {
      try {
        audioRef.current.volume = 0.36;
        await audioRef.current.play();
        setMusicError("");
      } catch {
        setMusicError("The next track is loaded. Select Play to hear it.");
      }
    }
  };

  const handleCanvasPointer = (active) => (event) => {
    if (event.target?.tagName !== "CANVAS") return;
    if (active && started && !paused && !completed) {
      controlsRef.current.add("Paint");
      window.clearTimeout(paintReleaseTimer.current);
      paintReleaseTimer.current = window.setTimeout(() => controlsRef.current.delete("Paint"), 180);
    } else if (event.type !== "pointerup") {
      controlsRef.current.delete("Paint");
    }
  };

  return (
    <main
      className={`paint-surfer quality-${quality} ${paused ? "is-paused" : ""}`}
      onPointerDown={handleCanvasPointer(true)}
      onPointerUp={handleCanvasPointer(false)}
      onPointerCancel={handleCanvasPointer(false)}
      onPointerLeave={handleCanvasPointer(false)}
    >
      <audio ref={audioRef} src={track.src} loop preload="metadata" />
      <Canvas
        shadows={quality !== "low"}
        dpr={quality === "low" ? [0.8, 1] : [0.9, 1.25]}
        camera={{ position: [0, 6.5, 14], fov: 48, near: 0.1, far: 90 }}
        gl={{ antialias: quality !== "low", alpha: false, powerPreference: "high-performance" }}
      >
        <PaintWorld
          controlsRef={controlsRef}
          paused={!started || paused || completed}
          reducedMotion={reducedMotion}
          quality={quality}
          onProgress={setProgress}
          onSurf={() => setSurfCount((current) => current + 1)}
          onComplete={() => setCompleted(true)}
          onReady={handleReady}
        />
      </Canvas>
      <div className="paint-paper-grain" aria-hidden="true" />

      <header className="paint-topbar">
        <button type="button" onClick={() => navigate("/lab")}>← Lab dashboard</button>
        <div><span>EXPERIMENT 002</span><strong>THE CHROMA DRIFTER</strong></div>
        <nav aria-label="Paint surfer controls">
          <button type="button" onClick={() => setShowHelp(true)}>Controls</button>
          <button type="button" onClick={() => setPaused((current) => !current)} disabled={!started}>{paused ? "Resume" : "Pause"}</button>
          <button type="button" onClick={onLogout}>Revoke clearance</button>
        </nav>
      </header>

      {started && (
        <>
          <aside className="paint-progress" aria-label="World colour progress">
            <span>WORLD SATURATION</span>
            <strong>{progress.toString().padStart(2, "0")}%</strong>
            <div><i style={{ width: `${progress}%` }} /></div>
            <small>{progress < 35 ? "The canvas is still asleep." : progress < 75 ? "Colour is learning to spread." : "Reality is almost awake."}</small>
          </aside>
          <div className="paint-surf-meter" aria-live="polite"><span>SURF CHAIN</span><strong>×{surfCount.toString().padStart(2, "0")}</strong></div>
        </>
      )}

      <aside className="paint-soundtrack" aria-label="Game soundtrack">
        <span>NOW PLAYING</span><strong>{track.title}</strong>
        <div><button type="button" onClick={toggleMusic}>{musicOn ? "Mute" : "Play"}</button><button type="button" onClick={selectNextTrack}>Next track</button></div>
        {musicError && <small role="status">{musicError}</small>}
      </aside>

      {!started && (
        <section className="paint-intro" aria-labelledby="paint-intro-title">
          <div className="paint-intro-number" aria-hidden="true">002</div>
          <p>PRIIT LAB // BLANK-WORLD RECOVERY PROGRAM</p>
          <h1 id="paint-intro-title">The world went blank.<br /><em>Draw it back.</em></h1>
          <p>A nameless stick artist woke inside an unfinished idea with one oversized pencil. Run through the canvas, jump its empty structures, and attack to pour out a silky path you can surf.</p>
          <dl><div><dt>Move</dt><dd>WASD / arrows</dd></div><div><dt>Jump</dt><dd>Space</dd></div><div><dt>Sprint</dt><dd>Shift</dd></div><div><dt>Paint surf</dt><dd>Click / J</dd></div></dl>
          <button type="button" onClick={start} disabled={!ready}>{ready ? "Pick up the pencil" : "Stretching the canvas…"}<span aria-hidden="true">→</span></button>
          <small>Starting the chamber also starts the selected local soundtrack. You can mute it at any time.</small>
        </section>
      )}

      {showHelp && (
        <div className="paint-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="paint-help-title">
          <section className="paint-help">
            <p>FIELD MANUAL / CHAMBER 002</p><h2 id="paint-help-title">Make movement your brush.</h2>
            <ul><li><strong>WASD / arrows</strong><span>Run across the blank canvas.</span></li><li><strong>Shift</strong><span>Sprint and leave longer strokes.</span></li><li><strong>Space</strong><span>Jump over structures.</span></li><li><strong>Click / J</strong><span>Kick the pencil down and surf the colour spill.</span></li><li><strong>P / M</strong><span>Pause the world or mute music.</span></li></ul>
            <button type="button" onClick={() => setShowHelp(false)} autoFocus>Back to the canvas</button>
          </section>
        </div>
      )}

      {completed && !completionDismissed && (
        <div className="paint-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="paint-complete-title">
          <section className="paint-complete">
            <span>100%</span><p>CANVAS RECOVERY COMPLETE</p><h2 id="paint-complete-title">You didn&apos;t fill the world.<br />You taught it how to feel.</h2>
            <div><button type="button" onClick={() => { setCompleted(false); setCompletionDismissed(true); }}>Keep painting</button><button type="button" onClick={() => navigate("/lab")}>Return to Lab</button></div>
          </section>
        </div>
      )}

      {paused && <div className="paint-paused" role="status">CANVAS FROZEN // PRESS P TO RESUME</div>}
      <MobilePaintControls controlsRef={controlsRef} disabled={!started || paused || completed} />
    </main>
  );
}
