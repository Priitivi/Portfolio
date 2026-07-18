import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { workflows } from "./data/workflows";
import { canSafelyCapture, detectPlatform, diagnoseShortcut, isEditableTarget, matchChallengeShortcut, normalizeShortcutEvent, shortcutMatches } from "./core/shortcuts";
import { applyAttempt, buildAdaptiveQueue, createScoreState, dateKey, getDailyChallengeIds, readProgress, resolveChallengeIds, updateMastery, writeProgress } from "./core/progress";
import DesktopShell from "./components/DesktopShell";
import { createInitialWindows } from "./components/windowConfig";
import { DailyIntro, MainMenu, Onboarding, PauseScreen, PracticeSetup, ProgressScreen, ResultsScreen, SettingsScreen, ShortcutLibrary, SprintSetup, WorkflowSetup } from "./components/Screens";
import "./shortcut-lab.css";

const tutorialIds = ["browser-find","browser-address","editor-quick-open","editor-save","terminal-history-up","files-rename","notes-undo","desktop-switch-app"];

export default function ShortcutLab({ navigate }) {
  const [progress, setProgress] = useState(() => readProgress());
  const [platform, setPlatform] = useState(() => readProgress().platform || detectPlatform());
  const [view, setView] = useState(() => readProgress().onboardingComplete ? "menu" : "onboarding");
  const [session, setSession] = useState(null);
  const [score, setScore] = useState(createScoreState);
  const [feedback, setFeedback] = useState(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pressed, setPressed] = useState([]);
  const [windows, setWindows] = useState(createInitialWindows);
  const [activeApp, setActiveApp] = useState("editor");
  const [effect, setEffect] = useState(null);
  const scoreRef = useRef(score);
  const challengeStarted = useRef(performance.now());
  const locked = useRef(false);
  const timeoutRef = useRef(null);
  const lastConfig = useRef(null);
  const effectNonce = useRef(0);
  const settingsFromSession = useRef(false);
  const pauseStarted = useRef(null);

  const challenge = session?.queue[session.index] || null;

  useEffect(() => {
    const original = document.title;
    document.title = "Shortcut Lab — Productivity Training";
    return () => { document.title = original; };
  }, []);

  useEffect(() => { writeProgress(progress); }, [progress]);
  useEffect(() => () => globalThis.clearTimeout(timeoutRef.current), []);

  const updateScore = useCallback((next) => {
    scoreRef.current = next;
    setScore(next);
  }, []);

  const focusApplication = useCallback((app) => {
    setWindows((items) => {
      const top = Math.max(...items.map((item) => item.z), 0) + 1;
      return items.map((item) => item.id === app ? { ...item, open:true, minimized:false, z:top } : item);
    });
    setActiveApp(app);
  }, []);

  const pauseSession = useCallback(() => {
    pauseStarted.current = performance.now();
    setPaused(true);
  }, []);

  const resumeSession = useCallback(() => {
    const pausedFor = pauseStarted.current === null ? 0 : performance.now() - pauseStarted.current;
    setSession((current) => current?.timerSeconds ? { ...current, endsAt:current.endsAt + pausedFor } : current);
    pauseStarted.current = null;
    challengeStarted.current = performance.now();
    setPaused(false);
  }, []);

  useEffect(() => {
    if (!challenge || view !== "desktop") return;
    focusApplication(challenge.application);
    challengeStarted.current = performance.now();
    locked.current = false;
    setFeedback(null);
    setHintVisible(false);
  }, [challenge, focusApplication, view]);

  const finishSession = useCallback(() => {
    const completedSession = session;
    if (!completedSession) return;
    const finalScore = scoreRef.current;
    setProgress((current) => {
      const best = Math.max(current.bestScores[completedSession.kind] || 0, finalScore.score);
      const daily = completedSession.kind === "daily" ? { ...current.daily, [dateKey()]: { score:Math.max(current.daily[dateKey()]?.score || 0, finalScore.score), completedAt:Date.now() } } : current.daily;
      return { ...current, bestScores:{ ...current.bestScores, [completedSession.kind]:best }, daily, lastMode:completedSession.label };
    });
    setPaused(false);
    setView("results");
  }, [session]);

  useEffect(() => {
    if (!session?.timerSeconds || paused || view !== "desktop") return undefined;
    const tick = () => {
      const left = Math.max(0, (session.endsAt - performance.now()) / 1000);
      setSession((current) => current ? { ...current, timeLeft:left } : current);
      if (left <= 0) finishSession();
    };
    tick();
    const timer = globalThis.setInterval(tick, 100);
    return () => globalThis.clearInterval(timer);
  }, [session?.timerSeconds, session?.endsAt, paused, view, finishSession]);

  useEffect(() => {
    if (!challenge || paused || view !== "desktop" || session.kind === "sprint") return undefined;
    const timer = globalThis.setTimeout(() => setHintVisible(true), 7000);
    return () => globalThis.clearTimeout(timer);
  }, [challenge, paused, session?.kind, view]);

  const startSession = useCallback((kind, options = {}) => {
    let queue;
    let label;
    if (kind === "tutorial") { const base = resolveChallengeIds(tutorialIds); queue = [...base, ...base]; label = "Tutorial · Core controls"; }
    else if (kind === "practice") { queue = buildAdaptiveQueue({ category:options.category, mastery:progress.mastery, count:20 }); label = `Practice · ${options.category}`; }
    else if (kind === "sprint") { queue = buildAdaptiveQueue({ category:"mixed", mastery:progress.mastery, count:options.count || 100 }); label = `Sprint · ${options.label}`; }
    else if (kind === "workflow") { queue = resolveChallengeIds(options.workflow.challengeIds); label = options.workflow.title; }
    else { queue = resolveChallengeIds(getDailyChallengeIds()); label = "Daily challenge"; }
    const timerSeconds = options.timerSeconds || null;
    lastConfig.current = { kind, options };
    updateScore(createScoreState());
    setSession({ kind, label, queue, index:0, timerSeconds, timeLeft:timerSeconds || 0, endsAt:timerSeconds ? performance.now() + timerSeconds * 1000 : null, previousBest:progress.bestScores[kind] || 0 });
    setProgress((current) => ({ ...current, lastMode:label }));
    setWindows(createInitialWindows());
    setFeedback(null);
    setHintVisible(false);
    setPaused(false);
    setView("desktop");
  }, [progress.bestScores, progress.mastery, updateScore]);

  const advance = useCallback(() => {
    globalThis.clearTimeout(timeoutRef.current);
    timeoutRef.current = globalThis.setTimeout(() => {
      setSession((current) => {
        if (!current) return current;
        if (current.index + 1 >= current.queue.length) {
          globalThis.queueMicrotask(finishSession);
          return current;
        }
        return { ...current, index:current.index + 1 };
      });
    }, 620);
  }, [finishSession]);

  const playTone = useCallback((correct) => {
    if (!progress.sound) return;
    try {
      const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
      const audio = new AudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = correct ? 620 : 170;
      gain.gain.setValueAtTime(.035, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .09);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(); oscillator.stop(audio.currentTime + .1);
      oscillator.addEventListener("ended", () => audio.close(), { once:true });
    } catch { /* optional feedback only */ }
  }, [progress.sound]);

  const performAction = useCallback((item) => {
    effectNonce.current += 1;
    setEffect({ app:item.application, action:item.action, nonce:effectNonce.current });
    if (item.action === "switch-app") focusApplication(activeApp === "browser" ? "editor" : "browser");
    if (item.action === "show-desktop") setWindows((items) => items.map((entry) => ({ ...entry, minimized:entry.open })));
  }, [activeApp, focusApplication]);

  const submitShortcut = useCallback((input, source = "physical") => {
    if (!challenge || locked.current || paused || view !== "desktop") return false;
    const target = challenge.trainingShortcut || challenge.expectedShortcut;
    const correct = source === "virtual"
      ? shortcutMatches(input, challenge.expectedShortcut, platform) || matchChallengeShortcut(input, challenge, platform)
      : matchChallengeShortcut(input, challenge, platform);
    const responseMs = Math.max(120, Math.round(performance.now() - challengeStarted.current));
    if (correct) {
      locked.current = true;
      const previousScore = scoreRef.current;
      const nextScore = applyAttempt(previousScore, { correct:true, responseMs, points:challenge.points, hinted:hintVisible });
      updateScore(nextScore);
      setProgress((current) => ({ ...current, mastery:updateMastery(current.mastery, challenge.id, { correct:true, responseMs, hinted:hintVisible }) }));
      const label = responseMs < 850 ? "Perfect" : responseMs < 1600 ? "Great" : responseMs < 4000 ? "Correct" : "Too slow";
      setFeedback({ type:"correct", label, detail:`+${nextScore.score - previousScore.score} · ${(responseMs / 1000).toFixed(2)}s` });
      playTone(true);
      performAction(challenge);
      advance();
      return true;
    }
    const nextScore = applyAttempt(scoreRef.current, { correct:false, responseMs });
    updateScore(nextScore);
    setProgress((current) => ({ ...current, mastery:updateMastery(current.mastery, challenge.id, { correct:false, responseMs }) }));
    setFeedback({ type:"wrong", label:diagnoseShortcut(input, target, platform), detail:"Check the highlighted combination" });
    setHintVisible(true);
    playTone(false);
    return false;
  }, [advance, challenge, hintVisible, paused, performAction, platform, playTone, updateScore, view]);

  useEffect(() => {
    if (!challenge || paused || view !== "desktop") return undefined;
    const down = (event) => {
      if (event.repeat || isEditableTarget(event.target)) return;
      setPressed((items) => [...new Set([...items, event.key])]);
      if (event.key === "Escape") { event.preventDefault(); pauseSession(); return; }
      if (["Control","Alt","Shift","Meta"].includes(event.key)) return;
      const normalized = normalizeShortcutEvent(event);
      const accepted = submitShortcut(normalized, "physical");
      if (accepted && canSafelyCapture(challenge)) event.preventDefault();
    };
    const up = (event) => setPressed((items) => items.filter((key) => key !== event.key));
    globalThis.addEventListener("keydown", down, true);
    globalThis.addEventListener("keyup", up, true);
    return () => {
      globalThis.removeEventListener("keydown", down, true);
      globalThis.removeEventListener("keyup", up, true);
    };
  }, [challenge, pauseSession, paused, submitShortcut, view]);

  const windowAction = useCallback((action, id, payload) => {
    setWindows((items) => {
      const top = Math.max(...items.map((item) => item.z), 0) + 1;
      return items.map((item) => {
        if (item.id !== id) return item;
        if (action === "focus" || action === "open") return { ...item, open:true, minimized:false, z:top };
        if (action === "close") return { ...item, open:false };
        if (action === "minimize") return { ...item, minimized:true };
        if (action === "move") return { ...item, ...payload };
        return item;
      });
    });
    if (action === "focus" || action === "open") setActiveApp(id);
  }, []);

  const updateSetting = (key, value) => {
    if (key === "platform") setPlatform(value);
    setProgress((current) => ({ ...current, [key]:value }));
  };

  const selectMenu = (choice) => {
    if (choice === "tutorial") startSession("tutorial");
    else setView(choice);
  };

  const continueLast = () => {
    const last = progress.lastMode?.toLowerCase() || "";
    if (last.includes("tutorial")) startSession("tutorial");
    else if (last.includes("sprint")) startSession("sprint", { label:"30 seconds", timerSeconds:30 });
    else if (last.includes("daily")) startSession("daily");
    else if (workflows.some((workflow) => workflow.title === progress.lastMode)) startSession("workflow", { workflow:workflows.find((workflow) => workflow.title === progress.lastMode) });
    else startSession("practice", { category:"mixed" });
  };

  const openSettings = (fromSession = false) => { settingsFromSession.current = fromSession; if (fromSession) pauseSession(); setView("settings"); };
  const closeSettings = () => { if (settingsFromSession.current && session) { setView("desktop"); resumeSession(); } else setView("menu"); settingsFromSession.current = false; };
  const goMenu = () => { globalThis.clearTimeout(timeoutRef.current); setPaused(false); setSession(null); setView("menu"); };
  const exitLab = () => navigate("/lab");
  const toggleFullscreen = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { /* browser policy may decline */ } };
  const skip = () => { if (!challenge || locked.current) return; const responseMs = Math.round(performance.now() - challengeStarted.current); updateScore(applyAttempt(scoreRef.current, { correct:false, responseMs })); setProgress((current) => ({ ...current, mastery:updateMastery(current.mastery, challenge.id, { correct:false, responseMs, hinted:true }) })); locked.current = true; setFeedback({ type:"wrong", label:"Skipped", detail:challenge.explanation }); advance(); };
  const sessionForHud = useMemo(() => session ? { ...session, showAnswer:session.kind === "tutorial" && session.index < session.queue.length / 2 } : null, [session]);

  return <div className={`shortcut-lab ${progress.motion === "reduced" ? "sl-reduced-motion" : ""} ${progress.textScale === "large" ? "sl-large-text" : ""}`}>
    <div className="sl-mobile-notice"><strong>Physical keyboard recommended</strong><span>Tutorials and the on-screen keyboard remain available on touch devices.</span></div>
    {view === "onboarding" && <Onboarding platform={platform} onPlatform={setPlatform} onComplete={() => { setProgress((current) => ({ ...current, onboardingComplete:true, platform })); setView("menu"); }} onExit={exitLab} />}
    {view === "menu" && <MainMenu progress={progress} onSelect={selectMenu} onContinue={continueLast} onExit={exitLab} />}
    {view === "practice" && <PracticeSetup onStart={(category) => startSession("practice", { category })} onBack={() => setView("menu")} />}
    {view === "sprint" && <SprintSetup onStart={(preset) => startSession("sprint", preset)} onBack={() => setView("menu")} />}
    {view === "workflows" && <WorkflowSetup onStart={(workflow) => startSession("workflow", { workflow })} onBack={() => setView("menu")} />}
    {view === "daily" && <DailyIntro completed={progress.daily[dateKey()]} onStart={() => startSession("daily")} onBack={() => setView("menu")} />}
    {view === "library" && <ShortcutLibrary progress={progress} platform={platform} onBack={() => setView("menu")} />}
    {view === "progress" && <ProgressScreen progress={progress} onBack={() => setView("menu")} />}
    {view === "settings" && <SettingsScreen progress={progress} platform={platform} onUpdate={updateSetting} onReplayOnboarding={() => setView("onboarding")} onBack={closeSettings} />}
    {view === "desktop" && challenge && <DesktopShell windows={windows} activeApp={activeApp} effect={effect} session={sessionForHud} challenge={challenge} platform={platform} score={score} feedback={feedback} hintVisible={hintVisible} pressed={pressed} onHint={() => setHintVisible(true)} onPause={pauseSession} onSkip={skip} onWindowAction={windowAction} onVirtualShortcut={(input) => submitShortcut(input,"virtual")} onMenu={goMenu} onSettings={() => openSettings(true)} onFullscreen={toggleFullscreen} />}
    {view === "results" && session && <ResultsScreen score={score} mode={session.kind} previousBest={session.previousBest} onReplay={() => startSession(lastConfig.current.kind,lastConfig.current.options)} onMenu={goMenu} />}
    {paused && view === "desktop" && <PauseScreen onResume={resumeSession} onReset={() => setWindows(createInitialWindows())} onMenu={goMenu} />}
  </div>;
}
