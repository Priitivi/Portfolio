function ListSection({ title, items, empty }) {
  return (
    <section className="ic-report-list">
      <h2>{title}</h2>
      {items.length ? (
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      ) : (
        <p>{empty}</p>
      )}
    </section>
  );
}

export default function FeedbackScreen({ report, onRetry, onPreparation, onReset }) {
  return (
    <main className="ic-main ic-report">
      <section className="ic-report-hero">
        <div>
          <p className="ic-eyebrow">PRACTICE REPORT / {report.mode.toUpperCase()}</p>
          <h1>{report.overall}<br /><em>practice signal.</em></h1>
        </div>
        <aside>
          <span>HOW TO READ THIS</span>
          <p>{report.heuristicNote}</p>
        </aside>
      </section>

      <section className="ic-dimension-grid" aria-label="Feedback dimensions">
        {report.dimensions.map((dimension) => (
          <article key={dimension.id}>
            <div><h2>{dimension.title}</h2><span className={`ic-rating is-${dimension.label.toLowerCase().replace(/\s+/g, "-")}`}>{dimension.label}</span></div>
            <p>{dimension.reason}</p>
          </article>
        ))}
      </section>

      <div className="ic-report-columns">
        <ListSection title="Strongest areas" items={report.strongestAreas} empty="No strong signal yet; complete another attempt with fuller evidence." />
        <ListSection title="Areas missed or under-evidenced" items={report.missedAreas} empty="No dimension was marked as needing more evidence." />
        <ListSection title="Questions or topics covered" items={report.questionsCovered} empty="No assessable questions were completed." />
        <ListSection title="Important topics not covered" items={report.topicsNotCovered} empty="All modelled focus areas were covered." />
        <ListSection title="CV evidence to bring forward" items={report.relevantEvidence} empty="The heuristic found relevant evidence across the answer set." />
        <ListSection title="Three focused improvements" items={report.improvements} empty="Review the dimension notes before retrying." />
      </div>

      <section className="ic-retry-goal">
        <span>SUGGESTED RETRY GOAL</span>
        <h2>{report.retryGoal}</h2>
      </section>

      <section className="ic-report-actions">
        <button className="ic-primary-button" type="button" onClick={onRetry}>Retry {report.mode.toLowerCase()} →</button>
        <button className="ic-secondary-button" type="button" onClick={onPreparation}>Return to preparation</button>
        <button className="ic-text-button" type="button" onClick={onReset}>Reset entire session</button>
      </section>
    </main>
  );
}
