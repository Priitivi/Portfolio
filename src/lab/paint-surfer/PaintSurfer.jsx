import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PaintWorld from "./PaintWorld";
import { paintSoundtracks } from "./soundtracks";
import { createStoryStatus } from "./storyConfig";
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
  const [story, setStory] = useState(() => createStoryStatus());
  const audioRef = useRef(null);
  const gameRef = useRef(null);
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
    window.requestAnimationFrame(() => gameRef.current?.focus());
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

  const selectTrack = (nextIndex) => {
    setTrackIndex((nextIndex + paintSoundtracks.length) % paintSoundtracks.length);
    setMusicError("");
  };

  const selectTrackFromMenu = (event) => {
    selectTrack(Number(event.target.value));
    event.currentTarget.blur();
    gameRef.current?.focus();
  };

  const handleCanvasPointer = (active) => (event) => {
    if (event.target?.tagName !== "CANVAS") return;
    if (active && started && !paused && !completed) {
      gameRef.current?.focus();
      controlsRef.current.add("Paint");
      window.clearTimeout(paintReleaseTimer.current);
      paintReleaseTimer.current = window.setTimeout(() => controlsRef.current.delete("Paint"), 180);
    } else if (event.type !== "pointerup") {
      controlsRef.current.delete("Paint");
    }
  };

  return (
    <main
      ref={gameRef}
      tabIndex={-1}
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
          onStoryUpdate={setStory}
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
            <span>STORY RESTORATION</span>
            <strong>{progress.toString().padStart(2, "0")}%</strong>
            <div><i style={{ width: `${progress}%` }} /></div>
            <small>{progress < 35 ? "The first page is waking up." : progress < 75 ? "The maker remembers your colours." : "The way home is taking shape."}</small>
          </aside>
          <div className="paint-surf-meter" aria-live="polite"><span>SURF CHAIN</span><strong>×{surfCount.toString().padStart(2, "0")}</strong></div>
          {!story.complete && story.current && (
            <aside className="paint-mission" aria-live="polite">
              <span>STORY CHAPTER {story.current.number} / {story.chapters.length.toString().padStart(2, "0")}</span>
              <h2>{story.current.title}</h2>
              <p>{story.current.prompt}</p>
              <div><i style={{ width: `${story.current.progress}%` }} /></div>
              <small>{story.current.hint} Paint-surf inside its glowing ring.</small>
            </aside>
          )}
        </>
      )}

      <aside className="paint-soundtrack" aria-label="Game soundtrack">
        <span>LOCAL SOUNDTRACK {String(trackIndex + 1).padStart(2, "0")} / {paintSoundtracks.length}</span>
        <label>
          <span className="sr-only">Select soundtrack</span>
          <select value={trackIndex} onChange={selectTrackFromMenu}>
            {paintSoundtracks.map((soundtrack, index) => <option key={soundtrack.id} value={index}>{soundtrack.title}</option>)}
          </select>
        </label>
        <strong>{track.title}</strong>
        <div><button type="button" onClick={() => selectTrack(trackIndex - 1)}>Previous</button><button type="button" onClick={toggleMusic}>{musicOn ? "Mute" : "Play"}</button><button type="button" onClick={() => selectTrack(trackIndex + 1)}>Next</button></div>
        {musicError && <small role="status">{musicError}</small>}
      </aside>

      {!started && (
        <section className="paint-intro" aria-labelledby="paint-intro-title">
          <div className="paint-intro-number" aria-hidden="true">002</div>
          <p>PRIIT LAB // BLANK-WORLD RECOVERY PROGRAM</p>
          <h1 id="paint-intro-title">The world went blank.<br /><em>Draw it back.</em></h1>
          <p>A nameless stick artist woke inside an unfinished story with one oversized pencil. Follow three colour beacons, awaken a mural, restore the maker statue, and draw open the way home.</p>
          <dl><div><dt>Move</dt><dd>WASD / arrows</dd></div><div><dt>Jump</dt><dd>Space</dd></div><div><dt>Sprint</dt><dd>Shift</dd></div><div><dt>Paint surf</dt><dd>Click / J</dd></div></dl>
          <button type="button" onClick={start} disabled={!ready}>{ready ? "Pick up the pencil" : "Stretching the canvas…"}<span aria-hidden="true">→</span></button>
          <small>W always moves toward the top of the screen. Starting the chamber also starts your selected local soundtrack.</small>
        </section>
      )}

      {showHelp && (
        <div className="paint-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="paint-help-title">
          <section className="paint-help">
            <p>FIELD MANUAL / CHAMBER 002</p><h2 id="paint-help-title">Make movement your brush.</h2>
            <ul><li><strong>WASD / arrows</strong><span>Move consistently relative to the screen.</span></li><li><strong>Shift</strong><span>Sprint and leave longer strokes.</span></li><li><strong>Space</strong><span>Jump over structures.</span></li><li><strong>Click / J</strong><span>Paint-surf inside the active beacon to advance the story.</span></li><li><strong>Pink scarf</strong><span>Trails behind the artist; the bright ground arrow points forward.</span></li><li><strong>P / M</strong><span>Pause the world or mute music.</span></li></ul>
            <button type="button" onClick={() => setShowHelp(false)} autoFocus>Back to the canvas</button>
          </section>
        </div>
      )}

      {completed && !completionDismissed && (
        <div className="paint-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="paint-complete-title">
          <section className="paint-complete">
            <span>100%</span><p>THE LAST PAGE IS ALIVE</p><h2 id="paint-complete-title">You didn&apos;t colour a world.<br />You finished its story.</h2>
            <div><button type="button" onClick={() => { setCompleted(false); setCompletionDismissed(true); }}>Keep painting</button><button type="button" onClick={() => navigate("/lab")}>Return to Lab</button></div>
          </section>
        </div>
      )}

      {paused && <div className="paint-paused" role="status">CANVAS FROZEN // PRESS P TO RESUME</div>}
      <MobilePaintControls controlsRef={controlsRef} disabled={!started || paused || completed} />
    </main>
  );
}
