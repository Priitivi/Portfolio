import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import AssessmentHeader from "./components/AssessmentHeader.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { achievements, getSelectionContext, loadProgress, recordInterviewAnswer, recordPracticeSession, recordSimulationSession, STORAGE_KEY } from "./engine/progress.js";
import { loadSimulationCheckpoint, SIMULATION_STORAGE_KEY } from "./engine/checkpoint.js";
import "./graduate-assessment.css";

const VALID_VIEWS = ["dashboard", "practice", "simulation", "interview", "analytics"];
const VIEW_LABELS = { dashboard: "Dashboard", practice: "Practice setup", simulation: "Assessment simulation", interview: "Interview practice", analytics: "Analytics" };
const Analytics = lazy(() => import("./components/Analytics.jsx"));
const InterviewPractice = lazy(() => import("./components/InterviewPractice.jsx"));
const Practice = lazy(() => import("./components/Practice.jsx"));
const Simulation = lazy(() => import("./components/Simulation.jsx"));

function ViewLoading() {
  return <main className="ga-main ga-view-loading" aria-busy="true" aria-live="polite"><span>PREPARING WORKSPACE</span><strong>Loading your local practice view…</strong><i /></main>;
}

function AchievementToast({ achievement, onClose }) {
  if (!achievement) return null;
  return (
    <aside className="ga-achievement-toast" role="status">
      <span>{achievement.icon}</span>
      <div><small>ACHIEVEMENT UNLOCKED</small><strong>{achievement.title}</strong><p>{achievement.description}</p></div>
      <button type="button" onClick={onClose} aria-label="Dismiss achievement">×</button>
    </aside>
  );
}

export default function GraduateAssessmentLab({ navigate }) {
  const initialHash = window.location.hash.replace("#", "");
  const [view, setView] = useState(VALID_VIEWS.includes(initialHash) ? initialHash : "dashboard");
  const [practiceConfig, setPracticeConfig] = useState({ category: "numerical", nonce: 0 });
  const [progress, setProgress] = useState(() => {
    try { return loadProgress(window.localStorage.getItem(STORAGE_KEY)); } catch { return loadProgress(null); }
  });
  const progressRef = useRef(progress);
  const [simulationCheckpoint, setSimulationCheckpoint] = useState(() => {
    try { return loadSimulationCheckpoint(window.localStorage.getItem(SIMULATION_STORAGE_KEY)); } catch { return null; }
  });
  const [achievementQueue, setAchievementQueue] = useState([]);
  progressRef.current = progress;

  const saveProgress = useCallback((next) => {
    progressRef.current = next;
    setProgress(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* The Lab remains usable when browser storage is unavailable. */ }
  }, []);

  const showUnlock = useCallback((ids) => {
    if (!ids.length) return;
    const unlocked = ids.map((id) => achievements.find((item) => item.id === id)).filter(Boolean);
    setAchievementQueue((current) => [...current, ...unlocked.filter((item) => !current.some((queued) => queued.id === item.id))]);
  }, []);

  const saveSimulationCheckpoint = useCallback((next) => {
    setSimulationCheckpoint(next);
    try {
      if (next) window.localStorage.setItem(SIMULATION_STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(SIMULATION_STORAGE_KEY);
    } catch { /* Simulation remains usable for the current tab when storage is unavailable. */ }
  }, []);

  useEffect(() => {
    const restoreView = () => {
      const hashView = window.location.hash.replace("#", "");
      setView(VALID_VIEWS.includes(hashView) ? hashView : "dashboard");
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    const restoreProgress = (event) => {
      if (event.key === STORAGE_KEY) {
        const next = loadProgress(event.newValue);
        progressRef.current = next;
        setProgress(next);
      }
      if (event.key === SIMULATION_STORAGE_KEY) setSimulationCheckpoint(loadSimulationCheckpoint(event.newValue));
    };
    window.addEventListener("popstate", restoreView);
    window.addEventListener("hashchange", restoreView);
    window.addEventListener("storage", restoreProgress);
    return () => {
      window.removeEventListener("popstate", restoreView);
      window.removeEventListener("hashchange", restoreView);
      window.removeEventListener("storage", restoreProgress);
    };
  }, []);

  const navigateView = (nextView) => {
    if (!VALID_VIEWS.includes(nextView)) return;
    if (window.location.hash !== `#${nextView}`) window.history.pushState({ graduateAssessmentView: nextView }, "", `${window.location.pathname}#${nextView}`);
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const startPractice = (intent = "numerical") => {
    const next = typeof intent === "string" ? { category: intent } : intent;
    if (next.category === "interview") {
      navigateView("interview");
      return;
    }
    setPracticeConfig({ ...next, category: next.category || "numerical", nonce: Date.now() });
    navigateView("practice");
  };

  const navigateFromHeader = (nextView) => {
    if (nextView === "practice") startPractice("numerical");
    else navigateView(nextView);
  };

  const completePractice = (session) => {
    const result = recordPracticeSession(progressRef.current, session);
    saveProgress(result.progress);
    showUnlock(result.newlyUnlocked);
  };

  const completeInterview = (entry) => {
    const result = recordInterviewAnswer(progressRef.current, entry);
    saveProgress(result.progress);
    showUnlock(result.newlyUnlocked);
  };

  const completeSimulation = (session) => {
    const result = recordSimulationSession(progressRef.current, session);
    saveProgress(result.progress);
    showUnlock(result.newlyUnlocked);
  };

  const selectionContext = getSelectionContext(progress);

  return (
    <div className="ga-app">
      <a className="ga-skip-link" href="#ga-content" onClick={(event) => { event.preventDefault(); document.getElementById("ga-content")?.focus(); }}>Skip to content</a>
      <div className="ga-grid" aria-hidden="true" />
      <AssessmentHeader view={view} onNavigate={navigateFromHeader} navigate={navigate} />
      <p className="ga-sr-only" aria-live="polite">{VIEW_LABELS[view]} loaded</p>
      <div id="ga-content" tabIndex={-1}>
        {view === "dashboard" && <Dashboard progress={progress} hasSimulationCheckpoint={Boolean(simulationCheckpoint)} onStart={startPractice} onSimulation={() => navigateView("simulation")} />}
        {view !== "dashboard" && <Suspense fallback={<ViewLoading />}>
          {view === "practice" && <Practice key={practiceConfig.nonce} initialConfig={practiceConfig} selectionContext={selectionContext} onComplete={completePractice} onExit={() => navigateView("dashboard")} />}
          {view === "simulation" && <Simulation checkpoint={simulationCheckpoint} selectionContext={selectionContext} onCheckpoint={saveSimulationCheckpoint} onComplete={completeSimulation} onExit={() => navigateView("dashboard")} onPractice={startPractice} />}
          {view === "interview" && <InterviewPractice recentQuestionIds={selectionContext.recentQuestionIds} onComplete={completeInterview} onExit={() => navigateView("dashboard")} />}
          {view === "analytics" && <Analytics progress={progress} onStart={startPractice} />}
        </Suspense>}
      </div>
      <footer className="ga-footer"><span>GRADUATE ASSESSMENT LAB</span><p>Original educational content · Local progress · No provider affiliation</p><button type="button" onClick={() => navigate("/lab")}>Return to Priit Lab ↑</button></footer>
      <AchievementToast achievement={achievementQueue[0]} onClose={() => setAchievementQueue((current) => current.slice(1))} />
    </div>
  );
}
