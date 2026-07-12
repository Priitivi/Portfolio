import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { creatorOptions, defaultFighter, portfolioReveals, storyPanels } from "../data/fightData";
import ArenaScene, { CharacterPreview } from "./ArenaScene";
import "./game.css";

function OptionGroup({ label, value, options, onChange, swatches = false }) {
  return (
    <fieldset className="creator-fieldset">
      <legend>{label}</legend>
      <div className={swatches ? "swatch-options" : "creator-options"}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? "is-selected" : ""}
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            title={swatches ? option.label : undefined}
          >
            {swatches && <span style={{ background: option.value }} aria-hidden="true" />}
            <strong>{option.label}</strong>
            {option.detail && <small>{option.detail}</small>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function CharacterCreator({ appearance, setAppearance, onContinue, onStandardView, reducedMotion }) {
  const update = (field, value) => setAppearance((current) => ({ ...current, [field]: value }));
  return (
    <main className="creator-screen">
      <header className="fight-topbar">
        <div><span className="status-light" /> PORTFOLIO FIGHTER <small>CHARACTER LAB</small></div>
        <button type="button" onClick={onStandardView}>Standard portfolio</button>
      </header>
      <section className="creator-preview" aria-label="Character preview">
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 2.2, 7.5], fov: 38 }}>
          <CharacterPreview appearance={appearance} reducedMotion={reducedMotion} />
        </Canvas>
        <div className="preview-caption">
          <span>FIGHTER 01</span>
          <strong>Custom fighter build</strong>
          <p>Style your fighter before the opening bell.</p>
        </div>
      </section>
      <section className="creator-panel">
        <p className="game-kicker">STEP 01 / BUILD YOUR FIGHTER</p>
        <h1>Choose your form.</h1>
        <p className="creator-intro">Your style is cosmetic. Your weapon changes range, damage, and attack rhythm.</p>
        <OptionGroup label="Hair" value={appearance.hair} options={creatorOptions.hair} onChange={(value) => update("hair", value)} />
        <OptionGroup label="Skin" value={appearance.skin} options={creatorOptions.skin} onChange={(value) => update("skin", value)} swatches />
        <OptionGroup label="Top" value={appearance.top} options={creatorOptions.top} onChange={(value) => update("top", value)} swatches />
        <div className="creator-split">
          <OptionGroup label="Bottom" value={appearance.bottom} options={creatorOptions.bottom} onChange={(value) => update("bottom", value)} swatches />
          <OptionGroup label="Shoes" value={appearance.shoes} options={creatorOptions.shoes} onChange={(value) => update("shoes", value)} swatches />
        </div>
        <OptionGroup label="Weapon" value={appearance.weapon} options={creatorOptions.weapon} onChange={(value) => update("weapon", value)} />
        <button type="button" className="primary-button creator-continue" onClick={onContinue}>Lock in fighter <span aria-hidden="true">→</span></button>
      </section>
    </main>
  );
}

function NameScreen({ name, setName, onContinue, onBack }) {
  const submit = (event) => {
    event.preventDefault();
    if (name.trim()) onContinue();
  };
  return (
    <main className="name-screen">
      <form className="name-card" onSubmit={submit}>
        <p className="game-kicker">STEP 02 / CHALLENGER ID</p>
        <span className="versus-mark" aria-hidden="true">VS</span>
        <h1>What do they call you?</h1>
        <p>The Architect needs a name to carve into the match card.</p>
        <label htmlFor="fighter-name">Fighter name</label>
        <input id="fighter-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={18} placeholder="Enter your name" autoFocus />
        <div className="name-actions">
          <button type="button" className="text-button" onClick={onBack}>Back to creator</button>
          <button type="submit" className="primary-button" disabled={!name.trim()}>Enter the story</button>
        </div>
      </form>
    </main>
  );
}

function ComicIntro({ fighterName, page, setPage, onComplete, onStandardView }) {
  return (
    <main className="comic-screen">
      <button type="button" className="comic-skip" onClick={onStandardView}>Exit to standard portfolio</button>
      <div className="comic-heading"><span>ISSUE #001</span><strong>THE LAST COMMIT</strong></div>
      <div className="comic-panels">
        {storyPanels.map((panel, index) => (
          <article key={panel.number} className={index <= page ? "is-revealed" : ""} aria-hidden={index > page}>
            <span>{panel.number}</span>
            <h2>{panel.title}</h2>
            <p>{panel.copy}</p>
            {index === 2 && <strong className="challenger-line">CHALLENGER: {fighterName.toUpperCase()}</strong>}
          </article>
        ))}
      </div>
      <button type="button" className="primary-button comic-next" onClick={() => page < 2 ? setPage(page + 1) : onComplete()}>
        {page < 2 ? "Turn the page" : "Enter Compile Arena"} <span aria-hidden="true">→</span>
      </button>
    </main>
  );
}

function Tutorial({ weapon, onStart, onStandardView }) {
  return (
    <div className="fight-overlay" role="dialog" aria-modal="true" aria-labelledby="fight-tutorial-title">
      <div className="tutorial-card fight-tutorial">
        <p className="game-kicker">ROUND ZERO / TRAINING</p>
        <h1 id="fight-tutorial-title">Three shields. One boss.</h1>
        <p>Reduce each yellow health bar to zero. Every broken shield unlocks a chapter of Priitivi&apos;s portfolio.</p>
        <dl className="control-grid">
          <div><dt>Move</dt><dd>WASD / arrows</dd></div>
          <div><dt>Attack</dt><dd>J / F / Enter</dd></div>
          <div><dt>Dodge</dt><dd>Space / K</dd></div>
          <div><dt>Weapon</dt><dd>{weapon}</dd></div>
        </dl>
        <p className="tutorial-tip"><strong>Tip:</strong> dodge through the boss&apos;s sword rhythm, then counter. Bow users can attack from range.</p>
        <div className="tutorial-actions">
          <button type="button" className="primary-button" onClick={onStart} autoFocus>Start round one</button>
          <button type="button" className="text-button" onClick={onStandardView}>Use standard portfolio</button>
        </div>
      </div>
    </div>
  );
}

function SegmentedBossHealth({ health }) {
  const fills = [
    Math.max(0, Math.min(100, health - 200)),
    Math.max(0, Math.min(100, health - 100)),
    Math.max(0, Math.min(100, health)),
  ];
  return (
    <div className="boss-health" aria-label={`Boss health ${health} out of 300`}>
      <div className="boss-label"><span>THE ARCHITECT</span><strong>PRIITIVI</strong><small>{Math.ceil(health / 100) || "FINAL"} SHIELD</small></div>
      <div className="health-segments">
        {fills.map((fill, index) => <div key={index}><span style={{ width: `${fill}%` }} /></div>)}
      </div>
    </div>
  );
}

function MobileFightControls({ mobileKeys }) {
  const setPressed = (code, pressed) => pressed ? mobileKeys.current.add(code) : mobileKeys.current.delete(code);
  const bind = (code, label) => ({
    type: "button",
    "aria-label": label,
    onPointerDown: (event) => { event.preventDefault(); setPressed(code, true); },
    onPointerUp: () => setPressed(code, false),
    onPointerCancel: () => setPressed(code, false),
    onPointerLeave: () => setPressed(code, false),
  });
  return (
    <div className="mobile-fight-controls" aria-label="Touch combat controls">
      <div className="fight-move-pad">
        <button {...bind("KeyW", "Move forward")}>▲</button>
        <button {...bind("KeyA", "Move left")}>◀</button>
        <button {...bind("KeyS", "Move backward")}>▼</button>
        <button {...bind("KeyD", "Move right")}>▶</button>
      </div>
      <div className="fight-action-pad">
        <button className="dodge-control" {...bind("Space", "Dodge")}>Dodge</button>
        <button className="attack-control" {...bind("KeyJ", "Attack")}>Attack</button>
      </div>
    </div>
  );
}

function RevealPanel({ reveal, index, onContinue, onStandardView }) {
  return (
    <div className="fight-overlay reveal-overlay" role="dialog" aria-modal="true" aria-labelledby="reveal-title">
      <article className="reveal-card">
        <div className="reveal-number">0{index + 1}</div>
        <p className="game-kicker">{reveal.label}</p>
        <h1 id="reveal-title">{reveal.title}</h1>
        <p className="reveal-copy">{reveal.copy}</p>
        {reveal.facts && <ul className="reveal-facts">{reveal.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>}
        {reveal.projects && (
          <div className="reveal-projects">
            {reveal.projects.map((project) => (
              <a key={project.name} href={project.href} target="_blank" rel="noreferrer"><strong>{project.name}</strong><span>{project.detail}</span><em>View source ↗</em></a>
            ))}
          </div>
        )}
        {reveal.links && <div className="reveal-links">{reveal.links.map((link) => <a key={link.label} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{link.label}</a>)}</div>}
        <div className="reveal-actions">
          <button type="button" className="primary-button" onClick={onContinue}>{index === 2 ? "Finish the fight" : `Start round ${index + 2}`} <span aria-hidden="true">→</span></button>
          <button type="button" className="text-button" onClick={onStandardView}>Open standard portfolio</button>
        </div>
      </article>
    </div>
  );
}

function DefeatPanel({ onRetry, onStandardView }) {
  return (
    <div className="fight-overlay" role="dialog" aria-modal="true" aria-labelledby="defeat-title">
      <div className="result-card defeat-card"><p className="game-kicker">BUILD FAILED</p><h1 id="defeat-title">The Architect wins this round.</h1><p>Reset the match and use your dodge window to break the rhythm.</p><div><button type="button" className="primary-button" onClick={onRetry}>Retry fight</button><button type="button" className="text-button" onClick={onStandardView}>Standard portfolio</button></div></div>
    </div>
  );
}

function VictoryPanel({ fighterName, onReplay, onStandardView }) {
  return (
    <div className="fight-overlay victory-overlay" role="dialog" aria-modal="true" aria-labelledby="victory-title">
      <div className="result-card"><p className="game-kicker">ALL CHAPTERS UNLOCKED</p><span className="victory-mark">K.O.</span><h1 id="victory-title">{fighterName} broke the build.</h1><p>Priitivi&apos;s portfolio is unlocked. The Architect nods—good code recognises a worthy challenger.</p><div><button type="button" className="primary-button" onClick={onStandardView}>Explore full portfolio</button><button type="button" className="text-button" onClick={onReplay}>Create another fighter</button></div></div>
    </div>
  );
}

export default function GameExperience({ onStandardView }) {
  const [screen, setScreen] = useState("creator");
  const [appearance, setAppearance] = useState(defaultFighter);
  const [fighterName, setFighterName] = useState("");
  const [storyPage, setStoryPage] = useState(0);
  const [bossHealth, setBossHealth] = useState(300);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [revealIndex, setRevealIndex] = useState(null);
  const [battleKey, setBattleKey] = useState(0);
  const [arenaReady, setArenaReady] = useState(false);
  const bossHealthRef = useRef(300);
  const playerHealthRef = useRef(100);
  const mobileKeys = useRef(new Set());
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const inArena = ["tutorial", "battle", "defeat", "victory"].includes(screen);
  const paused = screen !== "battle" || revealIndex !== null;

  const enterArena = () => {
    setArenaReady(false);
    setScreen("tutorial");
  };

  const damageBoss = useCallback((damage) => {
    const current = bossHealthRef.current;
    const next = Math.max(0, current - damage);
    bossHealthRef.current = next;
    setBossHealth(next);
    if (current > 200 && next <= 200) setRevealIndex(0);
    else if (current > 100 && next <= 100) setRevealIndex(1);
    else if (current > 0 && next <= 0) setRevealIndex(2);
  }, []);

  const damagePlayer = useCallback((damage) => {
    const next = Math.max(0, playerHealthRef.current - damage);
    playerHealthRef.current = next;
    setPlayerHealth(next);
    if (next <= 0) setScreen("defeat");
  }, []);

  const resetBattle = (nextScreen = "tutorial") => {
    bossHealthRef.current = 300;
    playerHealthRef.current = 100;
    setBossHealth(300);
    setPlayerHealth(100);
    setRevealIndex(null);
    setBattleKey((value) => value + 1);
    setScreen(nextScreen);
  };

  const continueReveal = () => {
    if (revealIndex === 2) {
      setRevealIndex(null);
      setScreen("victory");
    } else {
      setRevealIndex(null);
      setPlayerHealth(Math.min(100, playerHealthRef.current + 24));
      playerHealthRef.current = Math.min(100, playerHealthRef.current + 24);
    }
  };

  const replay = () => {
    resetBattle("creator");
    setStoryPage(0);
    setFighterName("");
  };

  useEffect(() => () => mobileKeys.current.clear(), []);

  if (screen === "creator") return <CharacterCreator appearance={appearance} setAppearance={setAppearance} onContinue={() => setScreen("name")} onStandardView={onStandardView} reducedMotion={reducedMotion} />;
  if (screen === "name") return <NameScreen name={fighterName} setName={setFighterName} onContinue={() => setScreen("story")} onBack={() => setScreen("creator")} />;
  if (screen === "story") return <ComicIntro fighterName={fighterName} page={storyPage} setPage={setStoryPage} onComplete={enterArena} onStandardView={onStandardView} />;

  return (
    <main className="fight-shell">
      <a className="game-skip-link" href="#fight-navigation">Skip to fight navigation</a>
      {inArena && (
        <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 10.8, 14.6], fov: 42, near: 0.1, far: 60 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
          <ArenaScene
            key={battleKey}
            appearance={appearance}
            mobileKeys={mobileKeys}
            paused={paused}
            reducedMotion={reducedMotion}
            resetToken={battleKey}
            onBossDamage={damageBoss}
            onPlayerDamage={damagePlayer}
            onReady={() => setArenaReady(true)}
          />
        </Canvas>
      )}

      {arenaReady && (
        <>
          <header className="arena-nav" id="fight-navigation"><span>COMPILE ARENA / MATCH 001</span><button type="button" onClick={onStandardView}>Standard portfolio</button></header>
          <SegmentedBossHealth health={bossHealth} />
          <div className="player-health"><span>{fighterName}</span><div><i style={{ width: `${playerHealth}%` }} /></div><strong>{playerHealth}</strong></div>
        </>
      )}

      {screen === "battle" && revealIndex === null && (
        <>
          <div className="desktop-fight-controls" aria-hidden="true"><span>WASD MOVE</span><span>J ATTACK</span><span>SPACE DODGE</span></div>
          <MobileFightControls mobileKeys={mobileKeys} />
        </>
      )}
      {screen === "tutorial" && arenaReady && <Tutorial weapon={appearance.weapon} onStart={() => setScreen("battle")} onStandardView={onStandardView} />}
      {!arenaReady && <div className="fight-overlay arena-loading" role="status"><p className="game-kicker">COMPILE ARENA</p><h1>Loading match…</h1></div>}
      {revealIndex !== null && <RevealPanel reveal={portfolioReveals[revealIndex]} index={revealIndex} onContinue={continueReveal} onStandardView={onStandardView} />}
      {screen === "defeat" && <DefeatPanel onRetry={() => resetBattle("tutorial")} onStandardView={onStandardView} />}
      {screen === "victory" && <VictoryPanel fighterName={fighterName} onReplay={replay} onStandardView={onStandardView} />}
    </main>
  );
}
