export function Metric({ label, value, tone = "" }) {
  return <div className={`sd-metric ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

export function Node({ label, detail, state = "idle", className = "", children }) {
  return (
    <div className={`sd-node ${className} is-${state}`} data-state={state}>
      <span className="sd-node-state">{state}</span>
      <strong>{label}</strong>
      <small>{detail}</small>
      {children}
    </div>
  );
}

export default function SimulationFrame({
  id,
  index,
  eyebrow,
  title,
  lede,
  solves,
  tradeoffs,
  metrics,
  children,
}) {
  return (
    <section className="sd-simulation" id={id} aria-labelledby={`${id}-title`}>
      <div className="sd-sim-heading">
        <div className="sd-index" aria-hidden="true">{index}</div>
        <div>
          <p className="sd-overline">{eyebrow}</p>
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
        <p>{lede}</p>
      </div>

      <div className="sd-sim-console">
        <div className="sd-console-bar"><span><i /> LIVE SIMULATION</span><small>LOCAL / DETERMINISTIC</small></div>
        {children}
        <div className="sd-metrics" aria-live="polite">{metrics}</div>
      </div>

      <div className="sd-learn-grid">
        <article><span>WHAT IT SOLVES</span><p>{solves}</p></article>
        <article><span>HOW IT WORKS</span><p>Watch the highlighted nodes and travelling packet. The status line narrates each decision as the system changes.</p></article>
        <article className="sd-tradeoffs"><span>TRADE-OFFS</span><ul>{tradeoffs.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </div>
    </section>
  );
}
