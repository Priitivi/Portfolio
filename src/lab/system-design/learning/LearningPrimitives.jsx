import { metricDisplay as defaultMetricDisplay, metricTone as defaultMetricTone } from "./scalingModel";

export function MetricBoard({ keys, metrics, display = defaultMetricDisplay, tone = defaultMetricTone, ariaLabel = "Current system metrics" }) {
  return (
    <div className="sd-scale-metrics" aria-label={ariaLabel} aria-live="polite">
      {keys.map((key) => {
        const [label, value] = display(key, metrics);
        return (
          <div className={`sd-scale-metric is-${tone(key, metrics)}`} key={key} data-metric={key}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        );
      })}
    </div>
  );
}

export function DecisionCards({ decisions, selectedId, onSelect, ariaLabel = "Architecture decisions" }) {
  return (
    <div className="sd-scale-decisions" aria-label={ariaLabel}>
      {decisions.map((decision) => (
        <button
          type="button"
          className={selectedId === decision.id ? "is-selected" : ""}
          aria-pressed={selectedId === decision.id}
          onClick={() => onSelect(decision.id)}
          key={decision.id}
        >
          <span>{decision.recommended ? "FIT FOR THIS CONSTRAINT" : "EXPLORE THE TRADE-OFF"}</span>
          <strong>{decision.label}</strong>
          <small>{decision.effect}</small>
        </button>
      ))}
    </div>
  );
}

export function LearningStageRail({ stages, currentIndex, furthestIndex, onSelect, ariaLabel }) {
  return (
    <nav className="sd-scale-stage-rail" aria-label={ariaLabel} style={{ "--stage-count": stages.length }}>
      {stages.map((stage, index) => (
        <button
          type="button"
          key={stage.id}
          disabled={index > furthestIndex}
          className={index === currentIndex ? "is-current" : index < furthestIndex ? "is-complete" : ""}
          aria-current={index === currentIndex ? "step" : undefined}
          onClick={() => onSelect(index)}
        >
          <span>{stage.number}</span>
          <strong>{stage.trafficLabel}</strong>
          <small>{stage.title}</small>
        </button>
      ))}
    </nav>
  );
}

export function TradeoffSummary({ addition }) {
  return (
    <div className="sd-scale-tradeoffs">
      <article>
        <span>WHY WE ADDED IT</span>
        <strong>{addition.name}</strong>
        <p>{addition.why}</p>
      </article>
      <article>
        <span>WHAT IT IMPROVES</span>
        <ul>{addition.improves.map((item) => <li key={item}>+ {item}</li>)}</ul>
      </article>
      <article>
        <span>WHAT IT COSTS US</span>
        <ul>{addition.costs.map((item) => <li key={item}>− {item}</li>)}</ul>
      </article>
    </div>
  );
}

export function LearningCheckpoint({ checkpoint, selectedId, onSelect }) {
  const selected = checkpoint.options.find((option) => option.id === selectedId);
  return (
    <div className="sd-scale-checkpoint">
      <span>LEARNING CHECKPOINT / NOT AN EXAM</span>
      <strong>{checkpoint.question}</strong>
      <div>
        {checkpoint.options.map((option) => (
          <button type="button" aria-pressed={selectedId === option.id} className={selectedId === option.id ? "is-selected" : ""} onClick={() => onSelect(option.id)} key={option.id}>{option.label}</button>
        ))}
      </div>
      {selected && <p role="status"><b>{selected.correct ? "THAT'S THE MECHANISM" : "LOOK AT THE CONSTRAINT AGAIN"}</b>{selected.explanation}</p>}
    </div>
  );
}
