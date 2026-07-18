import { useEffect, useRef, useState } from "react";
import GameEngine from "./engine/GameEngine.js";
import InputManager from "./engine/InputManager.js";
import { formatTime } from "./engine/constants.js";

const defaultHud = { level: 1, levelName: "", time: 0, deaths: 0, gravity: 1, reversed: false, wind: 0 };

export default function GameCanvas({ levelIndex, settings, paused, onPause, onEvent, onDialogue, onLevelComplete }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const inputRef = useRef(null);
  const initialSettingsRef = useRef(settings);
  const [hud, setHud] = useState({ ...defaultHud, level: levelIndex + 1 });
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const initialSettings = initialSettingsRef.current;
    const input = new InputManager(initialSettings.bindings);
    const engine = new GameEngine({
      canvas: canvasRef.current,
      input,
      settings: initialSettings,
      levelIndex,
      onHud: setHud,
      onEvent,
      onDialogue,
      onPause,
      onLevelComplete,
    });
    inputRef.current = input;
    engineRef.current = engine;
    engine.resize(window.devicePixelRatio || 1);
    engine.start();
    const introTimer = window.setTimeout(() => setIntro(false), initialSettings.reducedFlashing ? 650 : 1900);
    return () => {
      window.clearTimeout(introTimer);
      engine.destroy();
      input.destroy();
      engineRef.current = null;
      inputRef.current = null;
    };
  }, [levelIndex, onDialogue, onEvent, onLevelComplete, onPause]);

  useEffect(() => { engineRef.current?.setPaused(paused); }, [paused]);
  useEffect(() => {
    inputRef.current?.setBindings(settings.bindings);
    engineRef.current?.setSettings(settings);
  }, [settings]);

  const touch = (action, active) => (event) => {
    event.preventDefault();
    engineRef.current?.audio.resume();
    inputRef.current?.setTouch(action, active);
  };

  const releaseTouch = (event) => {
    event.preventDefault();
    inputRef.current?.setTouch(event.currentTarget.dataset.action, false);
  };

  return (
    <section className="trial-game-stage" aria-label={`Level ${hud.level}: ${hud.levelName}`}>
      <canvas
        ref={canvasRef}
        className="trial-canvas"
        role="img"
        aria-label="The Deceptive Trial game world. Use the displayed movement controls to reach the glowing door."
        onPointerDown={() => engineRef.current?.audio.resume()}
      />

      <header className="trial-hud" aria-live="off">
        <div><span>LEVEL</span><strong>{String(hud.level).padStart(2, "0")} / 12</strong></div>
        <div className="trial-hud-title"><span>THE DECEPTIVE TRIAL</span><strong>{hud.levelName}</strong></div>
        <div><span>TIME</span><strong>{formatTime(hud.time)}</strong></div>
        <div><span>DEATHS</span><strong>{String(hud.deaths).padStart(2, "0")}</strong></div>
        <button type="button" onClick={onPause} aria-label="Pause game">II</button>
      </header>

      {(hud.gravity < 0 || hud.reversed || Math.abs(hud.wind) > 100) && (
        <div className="trial-condition-strip" aria-live="polite">
          {hud.gravity < 0 && <span>GRAVITY: REVISED</span>}
          {hud.reversed && <span>INPUT: REFLECTED</span>}
          {Math.abs(hud.wind) > 100 && <span>WIND: {hud.wind > 0 ? "→" : "←"}</span>}
        </div>
      )}

      {intro && (
        <div className="trial-level-intro" aria-live="polite">
          <small>CHAPTER {String(hud.level).padStart(2, "0")}</small>
          <strong>{hud.levelName}</strong>
          <i />
        </div>
      )}

      <div className="trial-touch-controls" aria-label="Touch controls">
        <div>
          <button type="button" data-action="left" aria-label="Move left" onPointerDown={touch("left", true)} onPointerUp={releaseTouch} onPointerCancel={releaseTouch}>←</button>
          <button type="button" data-action="right" aria-label="Move right" onPointerDown={touch("right", true)} onPointerUp={releaseTouch} onPointerCancel={releaseTouch}>→</button>
        </div>
        <div>
          <button type="button" data-action="run" aria-label="Run" onPointerDown={touch("run", true)} onPointerUp={releaseTouch} onPointerCancel={releaseTouch}>RUN</button>
          <button type="button" data-action="jump" className="trial-touch-jump" aria-label="Jump" onPointerDown={touch("jump", true)} onPointerUp={releaseTouch} onPointerCancel={releaseTouch}>↑</button>
        </div>
      </div>
    </section>
  );
}
