import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PaperWorldCanvas from "./PaperWorldCanvas";
import { createPaperStoryStatus } from "./paperWorld";
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
  const control = (code) => ({
    onPointerDown: press(code),
    onPointerUp: release(code),
    onPointerCancel: release(code),
    onPointerLeave: release(code),
  });

  return (
    <div className="paper-mobile-controls" aria-label="Mobile game controls">
      <div>
        <button type="button" disabled={disabled} aria-label="Move left" {...control("KeyA")}>←</button>
        <button type="button" disabled={disabled} aria-label="Move right" {...control("KeyD")}>→</button>
      </div>
      <div>
        <button type="button" disabled={disabled} className="paper-mobile-jump" {...control("Space")}>Jump</button>
        <button type="button" disabled={disabled} className="paper-mobile-dash" {...control("PaintDash")}>Dash</button>
      </div>
    </div>
  );
}

export default function PaintSurfer({ navigate, onLogout }) {
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [story, setStory] = useState(() => createPaperStoryStatus());
  const [dashCount, setDashCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [musicError, setMusicError] = useState("");
  const audioRef = useRef(null);
  const gameRef = useRef(null);
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const controlsRef = usePaintControls(started && !paused && !completed);
  const track = paintSoundtracks[trackIndex];
  const handleReady = useCallback(() => setReady(true), []);
  const handleDash = useCallback(() => setDashCount((current) => current + 1), []);
  const handleStoryUpdate = useCallback((status) => setStory(status), []);
  const handleComplete = useCallback(() => setCompleted(true), []);

  const playMusic = useCallback(async () => {
    if (!audioRef.current || !musicOn) return;
    try {
      audioRef.current.volume = 0.34;
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
      if (event.target?.matches?.("input, select, textarea, [contenteditable='true']")) return;
      if (event.code === "KeyP" && started) setPaused((current) => !current);
      if (event.code === "KeyM") setMusicOn((current) => !current);
      if (event.code === "Escape" && started) setShowHelp((current) => !current);
    };
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, [started]);

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
      audioRef.current.volume = 0.34;
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

  return (
    <main
      ref={gameRef}
      tabIndex={-1}
      className={`paint-surfer paper-mode ${paused ? "is-paused" : ""}`}
      onPointerDown={(event) => {
        if (event.target?.tagName === "CANVAS") gameRef.current?.focus();
      }}
    >
      <audio ref={audioRef} src={track.src} loop preload={started ? "metadata" : "none"} />
      <PaperWorldCanvas
        controlsRef={controlsRef}
        paused={!started || paused || completed}
        reducedMotion={reducedMotion}
        onReady={handleReady}
        onDash={handleDash}
        onStoryUpdate={handleStoryUpdate}
        onComplete={handleComplete}
      />
      <div className="paper-grain" aria-hidden="true" />

      <header className="paper-topbar">
        <button type="button" onClick={() => navigate("/lab")}>← Lab dashboard</button>
        <div><span>EXPERIMENT 002</span><strong>THE PAPER DRIFTER</strong></div>
        <nav aria-label="Paper Drifter controls">
          <button type="button" onClick={() => setShowHelp(true)}>How to draw</button>
          <button type="button" onClick={() => setPaused((current) => !current)} disabled={!started}>{paused ? "Resume" : "Pause"}</button>
          <button type="button" onClick={onLogout}>Revoke clearance</button>
        </nav>
      </header>

      {started && (
        <>
          <aside className="paper-restoration" aria-label="World restoration progress">
            <span>WORLD RESTORED</span>
            <strong>{story.progress.toString().padStart(2, "0")}%</strong>
            <div><i style={{ width: `${story.progress}%` }} /></div>
            <small>Draw on the scenery. Your paint becomes real terrain.</small>
          </aside>

          <aside className="paper-map" aria-label="Open world landmark progress">
            <span>OPEN CANVAS // LANDMARKS</span>
            <ol>
              {story.landmarks.map((landmark) => (
                <li key={landmark.id} className={landmark.complete ? "is-complete" : ""}>
                  <i style={{ "--landmark-colour": landmark.accent }} />
                  <div><strong>{landmark.shortTitle}</strong><small>{landmark.description}</small></div>
                  <b>{landmark.complete ? "DONE" : `${landmark.progress}%`}</b>
                </li>
              ))}
            </ol>
          </aside>

          <div className="paper-dash-meter" aria-live="polite"><span>PAINT DASHES</span><strong>×{dashCount.toString().padStart(2, "0")}</strong></div>
          <div className="paper-draw-prompt">CLICK + DRAG TO DRAW A PLATFORM <i /> J TO PAINT-DASH</div>
        </>
      )}

      <aside className={`paper-soundtrack ${started ? "" : "is-intro"}`} aria-label="Game soundtrack">
        <span>LOCAL SOUNDTRACK {String(trackIndex + 1).padStart(2, "0")} / {paintSoundtracks.length}</span>
        <label>
          <span className="sr-only">Select soundtrack</span>
          <select value={trackIndex} onChange={selectTrackFromMenu}>
            {paintSoundtracks.map((soundtrack, index) => <option key={soundtrack.id} value={index}>{soundtrack.title}</option>)}
          </select>
        </label>
        <div><button type="button" onClick={() => selectTrack(trackIndex - 1)}>Previous</button><button type="button" onClick={toggleMusic}>{musicOn ? "Mute" : "Play"}</button><button type="button" onClick={() => selectTrack(trackIndex + 1)}>Next</button></div>
        {musicError && <small role="status">{musicError}</small>}
      </aside>

      {!started && (
        <section className="paper-intro" aria-labelledby="paper-intro-title">
          <div className="paper-intro-copy">
            <p>PRIIT LAB // INTERACTIVE PAPER UNIVERSE</p>
            <h1 id="paper-intro-title">The world went blank.<br /><em>Draw it back.</em></h1>
            <p>Run through five thousand pixels of unfinished paper. Draw bridges where the level forgot them, sketch ramps into the sky, and colour four strange landmarks in whichever order feels right.</p>
            <button type="button" onClick={start} disabled={!ready}>{ready ? "Tear open the page" : "Sharpening the pencil…"}<span aria-hidden="true">→</span></button>
            <small>Your mouse or finger is the brush. Anything you draw becomes a surface the character can land on.</small>
          </div>
          <div className="paper-intro-manual" aria-label="Game controls">
            <span>FIELD NOTES / 002</span>
            <dl>
              <div><dt>Move</dt><dd>A / D or arrows</dd></div>
              <div><dt>Jump</dt><dd>W / Space</dd></div>
              <div><dt>Run</dt><dd>Hold Shift</dd></div>
              <div><dt>Draw</dt><dd>Click + drag</dd></div>
              <div><dt>Paint dash</dt><dd>Press J</dd></div>
            </dl>
            <p>There is no correct route. If the world blocks you, draw a better world.</p>
          </div>
        </section>
      )}

      {showHelp && (
        <div className="paper-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="paper-help-title">
          <section className="paper-help">
            <p>HOW TO BREAK A BLANK PAGE</p>
            <h2 id="paper-help-title">The level is also your sketchbook.</h2>
            <ul>
              <li><strong>A / D</strong><span>Move left and right. The camera follows across the open page.</span></li>
              <li><strong>W / Space</strong><span>Jump. Coyote time keeps the controls forgiving at platform edges.</span></li>
              <li><strong>Click + drag</strong><span>Draw solid paths anywhere on the visible page, then jump onto them.</span></li>
              <li><strong>J</strong><span>Launch forward on a burst of paint and colour whatever you pass.</span></li>
              <li><strong>Four landmarks</strong><span>Colour them in any order. Their labels show local progress.</span></li>
            </ul>
            <button type="button" onClick={() => { setShowHelp(false); gameRef.current?.focus(); }} autoFocus>Back to the page</button>
          </section>
        </div>
      )}

      {completed && !completionDismissed && (
        <div className="paper-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="paper-complete-title">
          <section className="paper-complete">
            <span>100%</span>
            <p>THE PAGE REFUSED TO STAY EMPTY</p>
            <h2 id="paper-complete-title">You didn&apos;t beat the level.<br />You drew a new one.</h2>
            <div><button type="button" onClick={() => { setCompleted(false); setCompletionDismissed(true); }}>Keep drawing</button><button type="button" onClick={() => navigate("/lab")}>Return to Lab</button></div>
          </section>
        </div>
      )}

      {paused && <div className="paper-paused" role="status">PAGE FOLDED // PRESS P TO RESUME</div>}
      <MobilePaintControls controlsRef={controlsRef} disabled={!started || paused || completed} />
    </main>
  );
}
