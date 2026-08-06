import { assessmentCategories } from "../data/catalog.js";
import {
  accuracy,
  achievements,
  categoryPerformance,
  evidenceStrength,
  estimatedReadiness,
  performanceByMode,
  recentPerformanceTrend,
  responseTime,
  spacedReviewQueue,
  topicMastery,
} from "../engine/progress.js";
import { formatRelativeDate, formatSessionCondition, sessionPresentation } from "../engine/presentation.js";

function categoryEvidence(attempted) {
  if (!attempted) return "No evidence";
  if (attempted < 4) return "Early evidence";
  if (attempted < 10) return "Developing";
  return "Established";
}

export default function Analytics({ progress, onStart }) {
  const mastery = topicMastery(progress);
  const weakest = mastery.slice(0, 5);
  const strongest = [...mastery].filter((topic) => topic.attempted >= 3).sort((left, right) => right.mastery - left.mastery || right.attempted - left.attempted).slice(0, 4);
  const readiness = estimatedReadiness(progress);
  const isReadinessAssessed = readiness !== null;
  const categoryRows = assessmentCategories.map((category) => ({ ...category, stats: progress.byCategory[category.id] }));
  const modeRows = performanceByMode(progress);
  const trend = recentPerformanceTrend(progress);
  const evidence = evidenceStrength(progress);
  const difficultyRows = Object.entries(progress.byDifficulty || {});
  const reviewQueue = spacedReviewQueue(progress);
  const dueReviews = reviewQueue.filter((topic) => topic.due).slice(0, 3);
  const nextReview = reviewQueue.find((topic) => !topic.due);
  return (
    <main className="ga-main ga-analytics">
      <section className="ga-page-title"><p className="ga-kicker">PERFORMANCE INTELLIGENCE</p><h1>Read the signal, not the noise.</h1><p>Use accuracy, pace, breadth and topic-level evidence to decide where the next practice minute will matter most.</p></section>
      <section className="ga-analytics-summary">
        <article className={`ga-readiness-card${isReadinessAssessed ? "" : " is-empty"}`} aria-label={isReadinessAssessed ? `Practice readiness estimate ${readiness} percent` : "Practice readiness not assessed yet"}>
          <div><span>PRACTICE READINESS ESTIMATE</span><strong>{isReadinessAssessed ? <>{readiness}<small>/100</small></> : "Not assessed yet"}</strong><i className={`ga-evidence-badge is-${evidence.level}`}>{evidence.label}</i><p>{isReadinessAssessed ? (progress.totals.attempted < 20 ? "Early heuristic—complete more categories before drawing conclusions." : "A non-validated estimate from your locally stored practice history.") : "Complete a practice session to generate your readiness estimate."}</p></div>
          {isReadinessAssessed && <><div className="ga-readiness-scale"><i style={{ width: `${readiness}%` }} /><span style={{ left: `${readiness}%` }} /></div><footer><small>LIMITED</small><small>BUILDING</small><small>STRONG EVIDENCE</small></footer></>}
        </article>
        <article><span>REASONING ACCURACY</span><strong>{accuracy(progress.totals)}%</strong><small>{progress.totals.correct} correct reasoning answers</small></article>
        <article><span>AVG. RESPONSE</span><strong>{responseTime(progress.totals)}s</strong><small>Across reasoning questions</small></article>
        <article><span>BEST STREAK</span><strong>{progress.bestAnswerStreak}</strong><small>Consecutive correct answers</small></article>
        <article><span>RECENT TREND</span><strong>{trend.label}</strong><small>{trend.delta === null ? `${trend.sample} completed reasoning session${trend.sample === 1 ? "" : "s"}` : `${trend.delta > 0 ? "+" : ""}${trend.delta} points across ${trend.sample} recent sessions`}</small></article>
      </section>
      <div className="ga-analytics-grid">
        <section className="ga-panel ga-category-analytics">
          <div className="ga-panel-heading"><div><span>CATEGORY MASTERY</span><h2>Accuracy and pace</h2></div></div>
          <div className="ga-analytics-table" role="table" aria-label="Category analytics">
            <div role="row" className="ga-table-head"><span role="columnheader">Category</span><span role="columnheader">Attempts</span><span role="columnheader">Accuracy / score</span><span role="columnheader">Avg. time</span><span /></div>
            {categoryRows.map((row) => {
              const performance = categoryPerformance(row.stats, row.id);
              return (
                <div role="row" key={row.id}>
                  <span role="cell"><i>{row.icon}</i><span><strong>{row.label}</strong><small>{categoryEvidence(row.stats.attempted)}</small></span></span>
                  <span role="cell" data-label="Attempts">{row.stats.attempted}</span>
                  <span role="cell" data-label={row.id === "interview" ? "Transcript score" : "Accuracy"}><b>{row.stats.attempted ? `${performance}%` : "—"}</b><em><i style={{ width: `${performance}%` }} /></em></span>
                  <span role="cell" data-label="Average time">{row.stats.attempted ? `${responseTime(row.stats)}s` : "—"}</span>
                  <button type="button" onClick={() => onStart(row.id)}>Practise</button>
                </div>
              );
            })}
          </div>
        </section>
        <section className="ga-panel ga-weakness-panel">
          <div className="ga-panel-heading"><div><span>FOCUS QUEUE</span><h2>Weakest topics</h2></div></div>
          {weakest.length ? <ol>{weakest.map((topic, index) => { const [category, name] = topic.id.split(":"); return <li key={topic.id}><span>{index + 1}</span><div><strong>{name.replace("-", " ")}</strong><small>{category} · {topic.attempted} attempts · {topic.opportunity}</small></div><b>{topic.mastery}<small>/100</small></b></li>; })}</ol> : <div className="ga-empty"><strong>No topic data yet.</strong><p>Complete a practice session to reveal precise weak spots.</p></div>}
        </section>
        <section className="ga-panel ga-review-queue">
          <div className="ga-panel-heading"><div><span>RETRIEVAL RHYTHM</span><h2>Spacing-aware review</h2></div><small>2 / 4 / 7 DAYS</small></div>
          {dueReviews.length ? <ol>{dueReviews.map((topic) => { const [category, ...topicParts] = topic.id.split(":"); const focusTopic = topicParts.join(":"); return <li key={topic.id}><span><strong>{focusTopic.replaceAll("-", " ")}</strong><small>{category} · due after {topic.intervalDays} days · mastery {topic.mastery}/100</small></span><button type="button" onClick={() => onStart({ category, difficulty: topic.mastery >= 60 ? "standard" : "foundation", timingProfile: topic.mastery >= 70 ? "standard" : "untimed", questionCount: 4, focusTopic })}>Review now</button></li>; })}</ol> : reviewQueue.length ? <div className="ga-empty"><strong>Your active topics are up to date.</strong><p>{nextReview ? `Next retrieval check: ${new Date(nextReview.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.` : "Complete another topic to extend the queue."}</p></div> : <div className="ga-empty"><strong>No review queue yet.</strong><p>Complete a reasoning set and the Lab will schedule a lightweight retrieval check.</p></div>}
          <p className="ga-panel-note">Intervals are educational prompts based on recent mastery—not a calibrated memory prediction.</p>
        </section>
        <section className="ga-panel ga-mode-analytics">
          <div className="ga-panel-heading"><div><span>ASSESSMENT MODE</span><h2>Practice and simulation evidence</h2></div></div>
          <div className="ga-mode-list">{modeRows.map((mode) => <article key={mode.id}><span><strong>{mode.id === "practice" ? "Focused practice" : mode.id === "simulation" ? "Assessment simulations" : "Interview transcripts"}</strong><small>{mode.sessions} completed · {mode.attempted} item{mode.attempted === 1 ? "" : "s"}</small></span><b>{mode.attempted ? `${mode.performance}%` : "—"}<small>{mode.id === "interview" ? " heuristic" : " accuracy"}</small></b></article>)}</div>
        </section>
        <section className="ga-panel ga-difficulty-analytics">
          <div className="ga-panel-heading"><div><span>DIFFICULTY MIX</span><h2>Reasoning exposure</h2></div><small>ALL TIME</small></div>
          <div className="ga-mode-list">{difficultyRows.map(([difficulty, stats]) => <article key={difficulty}><span><strong>{difficulty}</strong><small>{stats.attempted} reasoning answer{stats.attempted === 1 ? "" : "s"}</small></span><b>{stats.attempted ? `${accuracy(stats)}%` : "—"}<small> accuracy</small></b></article>)}</div>
        </section>
        <section className="ga-panel ga-strength-panel">
          <div className="ga-panel-heading"><div><span>STRENGTHS TO PROTECT</span><h2>Strongest supported topics</h2></div><small>3+ ATTEMPTS</small></div>
          {strongest.length ? <div className="ga-strength-list">{strongest.map((topic) => { const [category, ...parts] = topic.id.split(":"); return <article key={topic.id}><span><strong>{parts.join(":").replaceAll("-", " ")}</strong><small>{category} · {topic.opportunity}</small></span><b>{topic.mastery}<small>/100</small></b></article>; })}</div> : <div className="ga-empty"><strong>Strengths need more evidence.</strong><p>Reach three attempts in a topic before the Lab labels it as a supported strength.</p></div>}
        </section>
        <section className="ga-panel ga-history-panel">
          <div className="ga-panel-heading"><div><span>RECENT EVIDENCE</span><h2>Session history</h2></div><small>LOCAL ONLY</small></div>
          {progress.recentSessions.length ? <ol>{progress.recentSessions.slice(0, 8).map((session) => { const presentation = sessionPresentation(session); return <li key={session.id}><span className="ga-category-icon">{presentation.icon}</span><span><strong>{presentation.title}</strong><small>{formatRelativeDate(session.completedAt)} · {formatSessionCondition(session)} · {session.attempted} item{session.attempted === 1 ? "" : "s"}</small></span><b>{session.accuracy}%<small>{presentation.measure}</small></b></li>; })}</ol> : <div className="ga-empty"><strong>No completed sessions yet.</strong><p>Your practice, simulation and interview history will appear here.</p></div>}
        </section>
        <section className="ga-panel ga-achievements-full">
          <div className="ga-panel-heading"><div><span>ACHIEVEMENT SYSTEM</span><h2>Progress markers</h2></div><small>{progress.unlocked.length} UNLOCKED</small></div>
          <div>{achievements.map((item) => { const unlocked = progress.unlocked.includes(item.id); return <article key={item.id} className={unlocked ? "is-unlocked" : ""}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.description}</small></div><i>{unlocked ? "UNLOCKED" : "LOCKED"}</i></article>; })}</div>
        </section>
      </div>
    </main>
  );
}
