import { scoreMetrics } from "../core/progress";
import ShortcutKeys from "./ShortcutKeys";

export default function ChallengeHUD({ challenge, session, platform, score, feedback, hintVisible, onHint, onPause, onSkip }) {
  const metrics = scoreMetrics(score);
  const training = challenge.trainingShortcut;
  return (
    <aside className={`sl-challenge-hud ${feedback?.type ? `feedback-${feedback.type}` : ""}`} aria-live="polite">
      <div className="sl-hud-top"><span>{session.label}</span><strong>{String(session.index + 1).padStart(2,"0")} / {session.kind === "sprint" && session.timerSeconds ? "∞" : String(session.queue.length).padStart(2,"0")}</strong><button type="button" onClick={onPause} aria-label="Pause session">Ⅱ</button></div>
      <div className="sl-hud-progress"><i style={{ width:`${Math.min(100, (session.index / session.queue.length) * 100)}%` }} /></div>
      <div className="sl-challenge-context"><span>{challenge.application.toUpperCase()}</span><em>{challenge.difficulty}</em>{challenge.risk !== "safe" && <b>SAFE SIMULATION</b>}</div>
      <h1>{challenge.title}</h1>
      <p>{challenge.instruction}</p>
      {(session.showAnswer || hintVisible) && <div className="sl-hud-answer"><small>{training ? "SAFE TRAINING INPUT" : "PERFORM"}</small><ShortcutKeys shortcut={training || challenge.expectedShortcut} platform={platform} /></div>}
      {training && <div className="sl-reserved-note"><span>REAL SHORTCUT</span><ShortcutKeys shortcut={challenge.expectedShortcut} platform={platform} small /><p>{challenge.explanation}</p></div>}
      {feedback && <div className="sl-feedback-burst"><strong>{feedback.label}</strong><span>{feedback.detail}</span></div>}
      <div className="sl-hud-actions"><button type="button" onClick={onHint}>{hintVisible ? "Hint visible" : "Show hint"}</button><button type="button" onClick={onSkip}>Skip</button></div>
      <div className="sl-live-score"><div><span>SCORE</span><strong>{score.score.toLocaleString()}</strong></div><div><span>COMBO</span><strong>×{score.combo}</strong></div><div><span>ACCURACY</span><strong>{metrics.accuracy}%</strong></div>{session.timerSeconds && <div><span>TIME</span><strong>{Math.max(0, session.timeLeft).toFixed(1)}s</strong></div>}</div>
    </aside>
  );
}
