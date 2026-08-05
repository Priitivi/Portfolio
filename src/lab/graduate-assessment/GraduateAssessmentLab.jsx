import { useCallback, useEffect, useRef, useState } from "react";
import Analytics from "./components/Analytics.jsx";
import AssessmentHeader from "./components/AssessmentHeader.jsx";
import Dashboard from "./components/Dashboard.jsx";
import InterviewPractice from "./components/InterviewPractice.jsx";
import Practice from "./components/Practice.jsx";
import { achievements, loadProgress, recordInterviewAnswer, recordPracticeSession, STORAGE_KEY } from "./engine/progress.js";
import "./graduate-assessment.css";

const VALID_VIEWS = ["dashboard", "practice", "interview", "analytics"];

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
  const [practiceCategory, setPracticeCategory] = useState("numerical");
  const [progress, setProgress] = useState(() => {
    try { return loadProgress(window.localStorage.getItem(STORAGE_KEY)); } catch { return loadProgress(null); }
  });
  const progressRef = useRef(progress);
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

  useEffect(() => {
    const restoreView = () => {
      const hashView = window.location.hash.replace("#", "");
      setView(VALID_VIEWS.includes(hashView) ? hashView : "dashboard");
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    const restoreProgress = (event) => {
      if (event.key !== STORAGE_KEY) return;
      const next = loadProgress(event.newValue);
      progressRef.current = next;
      setProgress(next);
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

  const startPractice = (category) => {
    if (category === "interview") {
      navigateView("interview");
      return;
    }
    setPracticeCategory(category || "numerical");
    navigateView("practice");
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

  return (
    <div className="ga-app">
      <a className="ga-skip-link" href="#ga-content">Skip to content</a>
      <div className="ga-grid" aria-hidden="true" />
      <AssessmentHeader view={view} onNavigate={navigateView} navigate={navigate} />
      <div id="ga-content">
        {view === "dashboard" && <Dashboard progress={progress} onStart={startPractice} />}
        {view === "practice" && <Practice initialCategory={practiceCategory} onComplete={completePractice} onExit={() => navigateView("dashboard")} />}
        {view === "interview" && <InterviewPractice onComplete={completeInterview} onExit={() => navigateView("dashboard")} />}
        {view === "analytics" && <Analytics progress={progress} onStart={startPractice} />}
      </div>
      <footer className="ga-footer"><span>GRADUATE ASSESSMENT LAB</span><p>Original educational content · Local progress · No provider affiliation</p><button type="button" onClick={() => navigate("/lab")}>Return to Priit Lab ↑</button></footer>
      <AchievementToast achievement={achievementQueue[0]} onClose={() => setAchievementQueue((current) => current.slice(1))} />
    </div>
  );
}
