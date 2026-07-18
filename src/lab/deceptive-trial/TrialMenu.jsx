import { achievements } from "./engine/progress.js";
import { CONTROL_KEYS, formatTime } from "./engine/constants.js";
import { levels } from "./engine/levels.js";

const keyLabel = (code) => ({ ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", Space: "Space", ShiftLeft: "L Shift", ShiftRight: "R Shift", Escape: "Esc", KeyA: "A", KeyD: "D", KeyW: "W", KeyP: "P" }[code] || code.replace("Key", ""));

export function MainMenu({ save, onPlay, onContinue, onScreen, onExit }) {
  const hasProgress = save.deaths > 0 || save.completedLevels.length > 0;
  return (
    <div className="trial-menu-panel trial-main-menu">
      <div className="trial-title-lockup">
        <p>PRIIT LAB / EXPERIMENT 005</p>
        <h1><span>The</span> Deceptive<br /><em>Trial</em></h1>
        <blockquote>“Every rule is true until it becomes inconvenient.”</blockquote>
      </div>
      <nav aria-label="Game menu">
        <button type="button" className="trial-primary-action" onClick={onPlay}><span>01</span> Play from beginning</button>
        <button type="button" onClick={onContinue} disabled={!hasProgress}><span>02</span> Continue <small>{hasProgress ? `Level ${save.currentLevel + 1}` : "No save yet"}</small></button>
        <button type="button" onClick={() => onScreen("levels")}><span>03</span> Level select</button>
        <button type="button" onClick={() => onScreen("achievements")}><span>04</span> Achievements <small>{save.achievements.length} / {achievements.length}</small></button>
        <button type="button" onClick={() => onScreen("statistics")}><span>05</span> Statistics</button>
        <button type="button" onClick={() => onScreen("settings")}><span>06</span> Settings</button>
        <button type="button" onClick={() => onScreen("credits")}><span>07</span> Credits</button>
        <button type="button" onClick={onExit}><span>08</span> Exit to Lab</button>
      </nav>
      <footer><span>A/D or ARROWS</span><span>SPACE to jump</span><span>SHIFT to run</span><span>ESC to pause</span></footer>
    </div>
  );
}

export function LevelSelect({ save, onSelect, onBack }) {
  return (
    <Panel title="Choose your mistake" eyebrow="LEVEL SELECT" onBack={onBack}>
      <div className="trial-level-grid">
        {levels.map((level, index) => {
          const unlocked = index <= save.unlockedLevel;
          const complete = save.completedLevels.includes(index);
          return (
            <button type="button" key={level.id} disabled={!unlocked} onClick={() => onSelect(index)}>
              <span>{String(level.number).padStart(2, "0")}</span>
              <strong>{level.name}</strong>
              <small>{!unlocked ? "LOCKED" : complete ? `BEST ${formatTime(save.bestTimes[index])}` : "UNTRIED"}</small>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function Achievements({ save, onBack }) {
  return (
    <Panel title="Receipts of poor judgment" eyebrow={`${save.achievements.length} / ${achievements.length} UNLOCKED`} onBack={onBack}>
      <div className="trial-achievement-grid">
        {achievements.map((achievement) => {
          const unlocked = save.achievements.includes(achievement.id);
          return <article key={achievement.id} className={unlocked ? "is-unlocked" : "is-locked"}><span>{unlocked ? "✦" : "?"}</span><div><strong>{unlocked ? achievement.title : "Undisclosed"}</strong><p>{unlocked ? achievement.description : "The Trial would prefer you discover this accidentally."}</p></div></article>;
        })}
      </div>
    </Panel>
  );
}

export function Statistics({ save, onBack }) {
  const stats = [
    ["Deaths", save.deaths.toLocaleString()], ["Jumps", save.jumps.toLocaleString()], ["Playtime", formatTime(save.playtime)],
    ["Levels complete", `${save.completedLevels.length} / 12`], ["Secrets found", `${save.secrets.length} / 12`],
    ["Achievements", `${save.achievements.length} / ${achievements.length}`], ["Courage motes", save.collected],
    ["Best campaign", save.bestTotalTime ? formatTime(save.bestTotalTime) : "—"],
  ];
  return (
    <Panel title="The evidence" eyebrow="LOCAL STATISTICS" onBack={onBack}>
      <div className="trial-stat-grid">{stats.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
      <h2 className="trial-subheading">Fastest clears</h2>
      <ol className="trial-time-list">{levels.map((level, index) => <li key={level.id}><span>{String(index + 1).padStart(2, "0")} {level.name}</span><strong>{save.bestTimes[index] ? formatTime(save.bestTimes[index]) : "—"}</strong></li>)}</ol>
    </Panel>
  );
}

export function Settings({ settings, onChange, onResetBindings, listening, onListen, onBack }) {
  return (
    <Panel title="Adjust your alibi" eyebrow="ACCESSIBILITY & CONTROLS" onBack={onBack}>
      <div className="trial-settings-grid">
        <section>
          <h2>Audio</h2>
          {[["masterVolume", "Master"], ["musicVolume", "Ambient music"], ["effectsVolume", "Sound effects"]].map(([key, label]) => (
            <label key={key}>{label}<span>{Math.round(settings[key] * 100)}%</span><input type="range" min="0" max="1" step="0.05" value={settings[key]} onChange={(event) => onChange(key, Number(event.target.value))} /></label>
          ))}
        </section>
        <section>
          <h2>Comfort</h2>
          {[["reducedShake", "Reduced screen shake"], ["reducedFlashing", "Reduced flashing"], ["colourblind", "Colourblind-friendly hazards"]].map(([key, label]) => (
            <label className="trial-toggle" key={key}><input type="checkbox" checked={settings[key]} onChange={(event) => onChange(key, event.target.checked)} /><span>{label}</span></label>
          ))}
        </section>
        <section className="trial-bindings">
          <h2>Remappable controls</h2>
          {CONTROL_KEYS.map((action) => <div key={action}><span>{action}</span><button type="button" className={listening === action ? "is-listening" : ""} onClick={() => onListen(action)}>{listening === action ? "Press a key…" : settings.bindings[action].map(keyLabel).join(" / ")}</button></div>)}
          <button type="button" onClick={onResetBindings}>Restore defaults</button>
        </section>
      </div>
    </Panel>
  );
}

export function Credits({ onBack }) {
  return (
    <Panel title="Made with suspicious care" eyebrow="CREDITS" onBack={onBack}>
      <div className="trial-credits">
        <p>Designed and engineered as an original Priit Lab experiment.</p>
        <dl><div><dt>Direction</dt><dd>Storybook dread, responsive movement, expectation-driven traps</dd></div><div><dt>Technology</dt><dd>React, Canvas 2D, Web Audio, local browser storage</dd></div><div><dt>Art & animation</dt><dd>Original procedural vector forms drawn at runtime</dd></div><div><dt>Audio</dt><dd>Original synthesized cues and ambient drones</dd></div></dl>
        <blockquote>Special thanks to every player who read the sign and did it anyway.</blockquote>
      </div>
    </Panel>
  );
}

export function PauseMenu({ onResume, onRestart, onSettings, onMenu, onExit }) {
  return (
    <div className="trial-overlay trial-pause" role="dialog" aria-modal="true" aria-labelledby="trial-pause-title">
      <section><small>PROCEEDINGS SUSPENDED</small><h2 id="trial-pause-title">Pause</h2><button type="button" onClick={onResume}>Resume trial</button><button type="button" onClick={onRestart}>Restart level</button><button type="button" onClick={onSettings}>Settings</button><button type="button" onClick={onMenu}>Main menu</button><button type="button" onClick={onExit}>Return to Lab</button></section>
    </div>
  );
}

function Panel({ title, eyebrow, onBack, children }) {
  return <div className="trial-menu-panel trial-subpanel"><header><button type="button" onClick={onBack}>← Main menu</button><div><small>{eyebrow}</small><h1>{title}</h1></div></header>{children}</div>;
}
