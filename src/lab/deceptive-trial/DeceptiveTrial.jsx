import { useCallback, useEffect, useRef, useState } from "react";
import GameCanvas from "./GameCanvas";
import { Achievements, Credits, LevelSelect, MainMenu, PauseMenu, Settings, Statistics } from "./TrialMenu";
import { DEFAULT_BINDINGS, formatTime } from "./engine/constants.js";
import { achievements, evaluateAchievements, loadSave, parseSave, persistSave } from "./engine/progress.js";
import "./deceptive-trial.css";

export default function DeceptiveTrial({ navigate }) {
  const [save, setSave] = useState(() => loadSave());
  const [screen, setScreen] = useState("menu");
  const [game, setGame] = useState(null);
  const [paused, setPaused] = useState(false);
  const [gameSettings, setGameSettings] = useState(false);
  const [dialogue, setDialogue] = useState(null);
  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(null);
  const dialogueTimer = useRef(0);
  const toastTimer = useRef(0);

  const updateSave = useCallback((transform, context = {}) => {
    setSave((current) => {
      const draft = parseSave(transform(current));
      const before = new Set(current.achievements);
      draft.achievements = evaluateAchievements(draft, context);
      const fresh = draft.achievements.find((id) => !before.has(id));
      if (fresh) {
        const unlocked = achievements.find((achievement) => achievement.id === fresh);
        window.clearTimeout(toastTimer.current);
        setToast(unlocked);
        toastTimer.current = window.setTimeout(() => setToast(null), 4200);
      }
      persistSave(draft);
      return draft;
    });
  }, []);

  useEffect(() => () => { window.clearTimeout(dialogueTimer.current); window.clearTimeout(toastTimer.current); }, []);

  const showDialogue = useCallback((message) => {
    window.clearTimeout(dialogueTimer.current);
    setDialogue(message);
    dialogueTimer.current = window.setTimeout(() => setDialogue(null), message.brief ? 1800 : 4300);
  }, []);

  const handleEvent = useCallback((type, data) => {
    const contexts = {
      wrongWay: { wrongWay: true }, fakeCheckpoint: { fakeCheckpoint: true }, fakeExit: { fakeExit: true },
      survivedDishonestSign: { survivedDishonestSign: true, survivedTrap: true }, checkpoint: { realCheckpoint: true },
      secret: { developerRoom: data.developerRoom }, levelVictory: data,
    };
    updateSave((current) => {
      const next = { ...current };
      if (type === "death") next.deaths += 1;
      if (type === "jump") next.jumps += 1;
      if (type === "collect") next.collected += 1;
      if (type === "statTick") { next.playtime += data.playtime; next.runTime += data.runTime; }
      if (type === "secret" && !next.secrets.includes(data.id)) next.secrets = [...next.secrets, data.id];
      if (type === "sign" && !next.signsRead.includes(data.id)) next.signsRead = [...next.signsRead, data.id];
      return next;
    }, contexts[type] || {});
  }, [updateSave]);

  const handleLevelComplete = useCallback(({ index, time, deaths, collected }) => {
    updateSave((current) => {
      const completedLevels = current.completedLevels.includes(index) ? current.completedLevels : [...current.completedLevels, index];
      const bestTimes = { ...current.bestTimes, [index]: Math.min(current.bestTimes[index] ?? Infinity, time) };
      const currentLevel = Math.min(11, index + 1);
      const allComplete = completedLevels.length >= 12;
      const total = allComplete ? Object.values(bestTimes).reduce((sum, value) => sum + value, 0) : null;
      return {
        ...current, completedLevels, bestTimes, currentLevel,
        unlockedLevel: Math.max(current.unlockedLevel, currentLevel),
        bestTotalTime: total ? Math.min(current.bestTotalTime ?? Infinity, total) : current.bestTotalTime,
      };
    }, { clearedWithoutDeath: deaths === 0, clearedWithoutCollecting: collected === 0, levelTime: time });
    setResult({ index, time, deaths, final: index === 11 });
    setPaused(true);
  }, [updateSave]);

  const startLevel = (index) => {
    updateSave((current) => ({ ...current, currentLevel: index }));
    setResult(null);
    setDialogue(null);
    setPaused(false);
    setGame({ levelIndex: index, key: Date.now() });
    setScreen("game");
  };

  const restartLevel = () => {
    if (!game) return;
    setResult(null);
    setDialogue(null);
    setPaused(false);
    setGame({ ...game, key: Date.now() });
  };

  const goMenu = () => { setPaused(false); setGameSettings(false); setResult(null); setDialogue(null); setGame(null); setScreen("menu"); };

  const changeSetting = (key, value) => updateSave((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  const togglePause = useCallback(() => setPaused((value) => !value), []);

  useEffect(() => {
    if (!listening) return undefined;
    const listen = (event) => {
      event.preventDefault();
      updateSave((current) => ({ ...current, settings: { ...current.settings, bindings: { ...current.settings.bindings, [listening]: [event.code] } } }));
      setListening(null);
    };
    window.addEventListener("keydown", listen, { once: true, capture: true });
    return () => window.removeEventListener("keydown", listen, { capture: true });
  }, [listening, updateSave]);

  let screenContent = null;
  if (screen === "levels") screenContent = <LevelSelect save={save} onSelect={startLevel} onBack={() => setScreen("menu")} />;
  if (screen === "achievements") screenContent = <Achievements save={save} onBack={() => setScreen("menu")} />;
  if (screen === "statistics") screenContent = <Statistics save={save} onBack={() => setScreen("menu")} />;
  if (screen === "settings") screenContent = <Settings settings={save.settings} onChange={changeSetting} onResetBindings={() => updateSave((current) => ({ ...current, settings: { ...current.settings, bindings: DEFAULT_BINDINGS } }))} listening={listening} onListen={setListening} onBack={() => setScreen("menu")} />;
  if (screen === "credits") screenContent = <Credits onBack={() => setScreen("menu")} />;
  if (screen === "menu") screenContent = <MainMenu save={save} onPlay={() => startLevel(0)} onContinue={() => startLevel(save.currentLevel)} onScreen={setScreen} onExit={() => navigate("/lab")} />;

  return (
    <main className={`deceptive-trial ${save.settings.reducedFlashing ? "trial-reduced-flashing" : ""}`}>
      <div className="trial-paper-noise" aria-hidden="true" />
      {screen !== "game" && <button className="trial-exit-corner" type="button" onClick={() => navigate("/lab")}>PRIIT LAB ↗</button>}
      {screenContent}
      {screen === "game" && game && (
        <GameCanvas key={game.key} levelIndex={game.levelIndex} settings={save.settings} paused={paused} onPause={togglePause} onEvent={handleEvent} onDialogue={showDialogue} onLevelComplete={handleLevelComplete} />
      )}
      {screen === "game" && paused && !result && !gameSettings && <PauseMenu onResume={() => setPaused(false)} onRestart={restartLevel} onSettings={() => setGameSettings(true)} onMenu={goMenu} onExit={() => navigate("/lab")} />}
      {screen === "game" && gameSettings && (
        <div className="trial-game-settings">
          <Settings settings={save.settings} onChange={changeSetting} onResetBindings={() => updateSave((current) => ({ ...current, settings: { ...current.settings, bindings: DEFAULT_BINDINGS } }))} listening={listening} onListen={setListening} onBack={() => setGameSettings(false)} />
        </div>
      )}
      {result && (
        <div className="trial-overlay trial-result" role="dialog" aria-modal="true" aria-labelledby="trial-result-title">
          <section><small>{result.final ? "THE TRIAL CONCEDES" : `CHAPTER ${String(result.index + 1).padStart(2, "0")} COMPLETE`}</small><h2 id="trial-result-title">{result.final ? "You proceeded anyway." : "Rule understood."}</h2><p>{result.final ? "You learned the only reliable rule: notice everything, trust carefully, and keep moving." : "The Trial has prepared an exception."}</p><dl><div><dt>Time</dt><dd>{formatTime(result.time)}</dd></div><div><dt>Deaths</dt><dd>{result.deaths}</dd></div></dl>{!result.final && <button type="button" onClick={() => startLevel(result.index + 1)}>Next chapter →</button>}<button type="button" onClick={goMenu}>{result.final ? "Return to title" : "Main menu"}</button></section>
        </div>
      )}
      {dialogue && screen === "game" && !result && <aside className={`trial-dialogue trial-dialogue-${dialogue.tone || "normal"}`} aria-live="polite"><small>{dialogue.speaker}</small><p>{dialogue.text}</p><button type="button" aria-label="Dismiss message" onClick={() => setDialogue(null)}>×</button></aside>}
      {toast && <aside className="trial-achievement-toast" role="status"><span>✦</span><div><small>ACHIEVEMENT UNLOCKED</small><strong>{toast.title}</strong></div></aside>}
    </main>
  );
}
