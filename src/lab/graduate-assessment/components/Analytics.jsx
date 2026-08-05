import { assessmentCategories } from "../data/packs.js";
import {
  accuracy,
  achievements,
  categoryPerformance,
  estimatedReadiness,
  responseTime,
  topicMastery,
} from "../engine/progress.js";

export default function Analytics({ progress, onStart }) {
  const mastery = topicMastery(progress);
  const weakest = mastery.slice(0, 5);
  const readiness = estimatedReadiness(progress);
  const categoryRows = assessmentCategories.map((category) => ({ ...category, stats: progress.byCategory[category.id] }));
  return (
    <main className="ga-main ga-analytics">
      <section className="ga-page-title"><p className="ga-kicker">PERFORMANCE INTELLIGENCE</p><h1>Read the signal, not the noise.</h1><p>Use accuracy, pace, breadth and topic-level evidence to decide where the next practice minute will matter most.</p></section>
      <section className="ga-analytics-summary">
        <article className="ga-readiness-card"><div><span>PRACTICE READINESS ESTIMATE</span><strong>{readiness}<small>/100</small></strong><p>{progress.totals.attempted < 20 ? "Early heuristic—complete more categories before drawing conclusions." : "A non-validated estimate from your locally stored practice history."}</p></div><div className="ga-readiness-scale"><i style={{ width: `${readiness}%` }} /><span style={{ left: `${readiness}%` }} /></div><footer><small>LIMITED</small><small>BUILDING</small><small>STRONG EVIDENCE</small></footer></article>
        <article><span>REASONING ACCURACY</span><strong>{accuracy(progress.totals)}%</strong><small>{progress.totals.correct} correct reasoning answers</small></article>
        <article><span>AVG. RESPONSE</span><strong>{responseTime(progress.totals)}s</strong><small>Across reasoning questions</small></article>
        <article><span>BEST STREAK</span><strong>{progress.bestAnswerStreak}</strong><small>Consecutive correct answers</small></article>
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
                  <span role="cell"><i>{row.icon}</i><strong>{row.label}</strong></span>
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
          {weakest.length ? <ol>{weakest.map((topic, index) => { const [category, name] = topic.id.split(":"); return <li key={topic.id}><span>{index + 1}</span><div><strong>{name.replace("-", " ")}</strong><small>{category} · {topic.attempted} attempts · {topic.trend}</small></div><b>{topic.mastery}<small>/100</small></b></li>; })}</ol> : <div className="ga-empty"><strong>No topic data yet.</strong><p>Complete a practice session to reveal precise weak spots.</p></div>}
        </section>
        <section className="ga-panel ga-achievements-full">
          <div className="ga-panel-heading"><div><span>ACHIEVEMENT SYSTEM</span><h2>Progress markers</h2></div><small>{progress.unlocked.length} UNLOCKED</small></div>
          <div>{achievements.map((item) => { const unlocked = progress.unlocked.includes(item.id); return <article key={item.id} className={unlocked ? "is-unlocked" : ""}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.description}</small></div><i>{unlocked ? "UNLOCKED" : "LOCKED"}</i></article>; })}</div>
        </section>
      </div>
    </main>
  );
}
