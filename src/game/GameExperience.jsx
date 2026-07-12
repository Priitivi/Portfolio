import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { featuredProject } from "../data/featuredProject";
import TownScene from "./TownScene";
import "./game.css";

function LoadingScreen({ onStandardView }) {
  return (
    <div className="game-overlay game-loading" role="status" aria-live="polite">
      <p className="game-kicker">PRIITIVI / TOWN ENGINE</p>
      <h1>Building the night shift.</h1>
      <div className="loading-track" aria-hidden="true">
        <span />
      </div>
      <p>Preparing a lightweight procedural world…</p>
      <button type="button" className="text-button" onClick={onStandardView}>
        Skip to standard portfolio
      </button>
    </div>
  );
}

function Tutorial({ onStart, onStandardView }) {
  return (
    <div className="game-overlay tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="tutorial-card">
        <p className="game-kicker">QUICK START</p>
        <h1 id="tutorial-title">Welcome to the night shift.</h1>
        <p>
          Walk north from the plaza to the yellow Project Studio. The town is deliberately compact;
          every route leads back here.
        </p>
        <dl className="control-grid">
          <div><dt>Move</dt><dd>WASD / arrows</dd></div>
          <div><dt>Camera</dt><dd>Drag the world</dd></div>
          <div><dt>Sprint</dt><dd>Hold Shift</dd></div>
          <div><dt>Interact</dt><dd>E / Enter</dd></div>
          <div><dt>Reset</dt><dd>R</dd></div>
        </dl>
        <div className="tutorial-actions">
          <button type="button" className="primary-button" onClick={onStart} autoFocus>
            Begin exploring
          </button>
          <button type="button" className="text-button" onClick={onStandardView}>
            Use standard portfolio
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectPanel({ onClose }) {
  const closeButton = useRef(null);

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  return (
    <div className="panel-backdrop" role="dialog" aria-modal="true" aria-labelledby="project-title">
      <article className="project-panel">
        <button ref={closeButton} type="button" className="panel-close" onClick={onClose} aria-label="Close project panel">
          ×
        </button>
        <div className="project-image-wrap">
          <img src={featuredProject.image} alt={featuredProject.imageAlt} />
          <span>LIVE DOSSIER 01</span>
        </div>
        <div className="project-copy">
          <p className="game-kicker">{featuredProject.eyebrow}</p>
          <h1 id="project-title">{featuredProject.title}</h1>
          <p className="project-lede">{featuredProject.description}</p>
          <ul className="tech-list" aria-label="Technologies used">
            {featuredProject.technologies.map((technology) => <li key={technology}>{technology}</li>)}
          </ul>
          <div className="project-facts">
            <section><h2>Technical challenge</h2><p>{featuredProject.challenge}</p></section>
            <section><h2>My contribution</h2><p>{featuredProject.contribution}</p></section>
          </div>
          <a className="primary-button project-link" href={featuredProject.github} target="_blank" rel="noreferrer">
            View source on GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </article>
    </div>
  );
}

function MobileControls({ mobileKeys }) {
  const setPressed = (code, pressed) => {
    if (pressed) mobileKeys.current.add(code);
    else mobileKeys.current.delete(code);
  };

  const buttonProps = (code, label) => ({
    type: "button",
    "aria-label": label,
    onPointerDown: (event) => {
      event.preventDefault();
      setPressed(code, true);
    },
    onPointerUp: () => setPressed(code, false),
    onPointerCancel: () => setPressed(code, false),
    onPointerLeave: () => setPressed(code, false),
  });

  return (
    <div className="mobile-controls" aria-label="Touch movement controls">
      <div className="move-pad">
        <button {...buttonProps("KeyW", "Move forward")}>▲</button>
        <button {...buttonProps("KeyA", "Move left")}>◀</button>
        <button {...buttonProps("KeyS", "Move backward")}>▼</button>
        <button {...buttonProps("KeyD", "Move right")}>▶</button>
      </div>
      <button className="sprint-button" {...buttonProps("ShiftLeft", "Sprint")}>Sprint</button>
    </div>
  );
}

export default function GameExperience({ onStandardView }) {
  const [loaded, setLoaded] = useState(false);
  const [tutorial, setTutorial] = useState(true);
  const [nearby, setNearby] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const mobileKeys = useRef(new Set());
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const controlsEnabled = loaded && !tutorial && !projectOpen;
  const markReady = useCallback(() => setLoaded(true), []);
  const updateNearby = useCallback((value) => setNearby(value), []);

  const resetPlayer = () => {
    setResetToken((value) => value + 1);
    setNearby(false);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      if (isTyping) return;

      if (event.code === "Escape" && projectOpen) setProjectOpen(false);
      if (!controlsEnabled) return;
      if ((event.code === "KeyE" || event.code === "Enter") && nearby) setProjectOpen(true);
      if (event.code === "KeyR") resetPlayer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [controlsEnabled, nearby, projectOpen]);

  useEffect(() => () => mobileKeys.current.clear(), []);

  return (
    <main className="game-shell">
      <a className="game-skip-link" href="#game-navigation">Skip to game navigation</a>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 7, 15.5], fov: 46, near: 0.1, far: 80 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <TownScene
          disabled={!controlsEnabled}
          mobileKeys={mobileKeys}
          nearby={nearby}
          onNearbyChange={updateNearby}
          onReady={markReady}
          reducedMotion={reducedMotion}
          resetToken={resetToken}
        />
      </Canvas>

      {!loaded && <LoadingScreen onStandardView={onStandardView} />}
      {loaded && tutorial && <Tutorial onStart={() => setTutorial(false)} onStandardView={onStandardView} />}

      {loaded && !tutorial && (
        <>
          <header className="game-header" id="game-navigation">
            <div>
              <span className="status-light" />
              <span className="game-brand-long">PRIITIVI / NIGHT TOWN</span>
              <span className="game-brand-short" aria-hidden="true">TOWN</span>
              <small>PHASE 1</small>
            </div>
            <nav aria-label="Game navigation">
              <button type="button" onClick={() => setProjectOpen(true)}>Projects</button>
              <button type="button" onClick={resetPlayer}>Reset position</button>
              <button type="button" onClick={onStandardView}>Standard view</button>
            </nav>
          </header>

          <aside className="location-card" aria-live="polite">
            <span>NOW EXPLORING</span>
            <strong>{nearby ? "Project Studio" : "Central Plaza"}</strong>
            <p>{nearby ? "Featured work is available at the illuminated entrance." : "Follow the yellow road north."}</p>
          </aside>

          {nearby && (
            <div className="interact-prompt is-visible" aria-live="polite">
              <kbd>E</kbd><span>Inspect Project Studio</span>
              <button type="button" onClick={() => setProjectOpen(true)}>Open</button>
            </div>
          )}

          <div className="desktop-controls" aria-hidden="true">
            <span>WASD move</span><span>Drag camera</span><span>Shift sprint</span><span>R reset</span>
          </div>
          <MobileControls mobileKeys={mobileKeys} />
        </>
      )}

      {projectOpen && <ProjectPanel onClose={() => setProjectOpen(false)} />}
    </main>
  );
}
