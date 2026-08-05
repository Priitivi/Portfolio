import { assessmentCategories } from "../data/packs.js";
import {
  accuracy,
  achievements,
  categoryPerformance,
  dailyStreak,
  estimatedReadiness,
  getRecommendations,
  heatmapDays,
} from "../engine/progress.js";

function formatRelativeDate(value) {
  const date = new Date(value);
  const delta = Math.max(0, Math.round((Date.now() - date.getTime()) / 86400000));
  if (delta === 0) return "Today";
  if (delta === 1) return "Yesterday";
  return `${delta} days ago`;
}

export default function Dashboard({ progress, onStart }) {
  const readiness = estimatedReadiness(progress);
  const isReadinessAssessed = readiness !== null;
  const recommendations = getRecommendations(progress);
  const heatmap = heatmapDays(progress.practiceDates);
  const streak = dailyStreak(progress.practiceDates);
  const totalAccuracy = accuracy(progress.totals);

  return (
    <main className="ga-main ga-dashboard">
      <section className="ga-hero-panel">
        <div className="ga-hero-copy">
          <p className="ga-kicker">TODAY&apos;S TRAINING SIGNAL</p>
          <h1>Build evidence.<br /><em>Beat instinct.</em></h1>
          <p>Original, focused practice for the reasoning and interview skills graduate employers measure.</p>
          <div className="ga-hero-actions">
            <button type="button" className="ga-button ga-button-primary" onClick={() => onStart(recommendations[0].category)}>Start recommended practice <span aria-hidden="true">→</span></button>
            <button type="button" className="ga-button ga-button-ghost" onClick={() => onStart("numerical")}>Quick numerical set</button>
          </div>
        </div>
        <div className={`ga-readiness${isReadinessAssessed ? "" : " is-empty"}`} aria-label={isReadinessAssessed ? `Practice readiness estimate ${readiness} percent` : "Practice readiness not assessed yet"}>
          {isReadinessAssessed && <div className="ga-readiness-ring" style={{ "--readiness": `${readiness * 3.6}deg` }}><span><strong>{readiness}</strong><small>/ 100</small></span></div>}
          <div><small>PRACTICE READINESS ESTIMATE</small><strong>{isReadinessAssessed ? (readiness < 35 ? "Building foundations" : readiness < 70 ? "Gaining momentum" : "Strong practice evidence") : "Not assessed yet"}</strong><p>{isReadinessAssessed ? "A local heuristic based on breadth, accuracy and practice volume—not a validated or hiring prediction." : "Complete a practice session to generate your readiness estimate."}</p></div>
        </div>
      </section>

      <section className="ga-stat-row" aria-label="Practice summary">
        <article><span>REASONING ACCURACY</span><strong>{totalAccuracy}%</strong><small>{progress.totals.correct} correct reasoning answers</small></article>
        <article><span>DAILY STREAK</span><strong>{streak}<i> days</i></strong><small>{streak ? "Signal maintained" : "Start a new run today"}</small></article>
        <article><span>BEST ANSWER STREAK</span><strong>{progress.bestAnswerStreak}</strong><small>Correct answers in a row</small></article>
        <article><span>PRACTICE SESSIONS</span><strong>{progress.totals.sessions}</strong><small>Across reasoning and interview</small></article>
      </section>

      <div className="ga-dashboard-grid">
        <section className="ga-panel ga-category-panel">
          <div className="ga-panel-heading"><div><span>PERFORMANCE MAP</span><h2>Accuracy by category</h2></div><small>ALL TIME</small></div>
          <div className="ga-category-list">
            {assessmentCategories.map((category) => {
              const stats = progress.byCategory[category.id];
              const value = categoryPerformance(stats, category.id);
              return (
                <button type="button" key={category.id} onClick={() => onStart(category.id)}>
                  <span className="ga-category-icon">{category.icon}</span>
                  <span className="ga-category-copy"><strong>{category.label}</strong><small>{stats.attempted ? `${stats.attempted} attempts` : "No baseline yet"}</small></span>
                  <span className="ga-meter"><i style={{ width: `${value}%` }} /></span>
                  <b>{stats.attempted ? `${value}%` : "—"}</b>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ga-panel ga-recommendations">
          <div className="ga-panel-heading"><div><span>ADAPTIVE COACH</span><h2>Practice next</h2></div><i className="ga-live-dot" /></div>
          {recommendations.map((item, index) => (
            <button type="button" key={item.title} onClick={() => onStart(item.category)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span><strong>{item.title}</strong><small>{item.reason}</small></span>
              <b aria-hidden="true">↗</b>
            </button>
          ))}
        </section>

        <section className="ga-panel ga-heatmap-panel">
          <div className="ga-panel-heading"><div><span>CONSISTENCY</span><h2>Practice activity</h2></div><small>14 WEEKS</small></div>
          <div className="ga-heatmap-wrap">
            <div className="ga-heatmap" aria-label="Practice activity over the last fourteen weeks">
              {heatmap.map((day) => <i key={day.key} data-level={day.level} title={`${day.key}: ${day.value} practice item${day.value === 1 ? "" : "s"}`} />)}
            </div>
            <div className="ga-heatmap-legend"><span>Less</span>{[0, 1, 2, 3, 4].map((level) => <i key={level} data-level={level} />)}<span>More</span></div>
          </div>
        </section>

        <section className="ga-panel ga-activity-panel">
          <div className="ga-panel-heading"><div><span>SESSION LOG</span><h2>Recent activity</h2></div></div>
          {progress.recentSessions.length ? (
            <ul>
              {progress.recentSessions.slice(0, 5).map((session) => {
                const category = assessmentCategories.find((item) => item.id === session.category);
                return <li key={session.id}><span className="ga-category-icon">{category?.icon}</span><span><strong>{category?.label || session.category}</strong><small>{formatRelativeDate(session.completedAt)} · {session.difficulty}</small></span><b>{session.accuracy}%</b></li>;
              })}
            </ul>
          ) : <div className="ga-empty"><strong>No sessions yet.</strong><p>Your practice history will appear here after the first set.</p></div>}
        </section>

        <section className="ga-panel ga-achievement-panel">
          <div className="ga-panel-heading"><div><span>PROGRESSION</span><h2>Achievements</h2></div><small>{progress.unlocked.length} / {achievements.length}</small></div>
          <div className="ga-achievement-strip">
            {achievements.slice(0, 6).map((item) => {
              const unlocked = progress.unlocked.includes(item.id);
              return <div key={item.id} className={unlocked ? "is-unlocked" : ""} title={item.description}><span>{item.icon}</span><strong>{item.title}</strong></div>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
