import { AI_AUTOSCALE_PHASES, aiReferences } from "./aiStages";

export function StageReference({ referenceId }) {
  const reference = aiReferences[referenceId];
  if (!reference) return null;
  return <a className="sd-ai-stage-reference" href={reference.url} target="_blank" rel="noreferrer"><span>SOURCE / GO DEEPER</span><strong>{reference.label} ↗</strong><small>{reference.note}</small></a>;
}

export function ReferenceShelf() {
  return (
    <div className="sd-ai-references" aria-labelledby="ai-references-title">
      <div><span>PUBLIC TECHNICAL REFERENCES</span><strong id="ai-references-title">Grounded in serving literature—not vendor benchmark claims.</strong></div>
      <div>
        {Object.entries(aiReferences).map(([id, reference]) => <a href={reference.url} target="_blank" rel="noreferrer" key={id}><span>{reference.label}</span><small>{reference.note}</small><i>↗</i></a>)}
      </div>
    </div>
  );
}

export function InferenceLifecyclePrimer() {
  return (
    <div className="sd-ai-lifecycle-primer" aria-label="Prompt prefill and decode lifecycle">
      <div><strong>PREFILL</strong><span>Processes the prompt and context before the first generated token.</span></div>
      <i>→</i>
      <div><strong>DECODE</strong><span>Generates output tokens autoregressively, reusing prior token state.</span></div>
      <p><b>TTFT</b> is the wait for the first token. <b>Inter-token latency</b> describes the cadence after it.</p>
    </div>
  );
}

const sequenceRows = [
  { id: "R1", width: 92 },
  { id: "R2", width: 48 },
  { id: "R3", width: 72 },
  { id: "R4", width: 34 },
];

export function BatchTimeline({ mode = "none" }) {
  return (
    <div className={`sd-ai-batch-visual is-${mode}`} aria-label={`Representative ${mode} batching timeline`}>
      <div><span>TIME →</span><strong>{mode === "continuous" ? "CONTINUOUS BATCH" : mode === "static" ? "STATIC BATCH" : "SEQUENTIAL"}</strong></div>
      {sequenceRows.map((row, index) => <div className="sd-ai-batch-row" key={row.id}><b>{row.id}</b><i style={{ "--sequence-width": `${row.width}%`, "--sequence-delay": mode === "none" ? `${index * 18}%` : "0%" }} />{mode === "continuous" && index > 1 && <em>joins freed slot</em>}</div>)}
      <p>{mode === "continuous" ? "Finished sequences leave; waiting work can join later iterations." : mode === "static" ? "The group shares execution, but short sequences can leave idle slots." : "Requests take turns, leaving little opportunity to share GPU work."}</p>
    </div>
  );
}

export function KvWorkloadControls({ promptTokens, concurrency, onChange }) {
  return (
    <div className="sd-ai-workload-controls">
      <fieldset>
        <legend>PROMPT LENGTH</legend>
        <div>{[128, 512, 2048, 4096, 8192].map((value) => <button type="button" aria-pressed={promptTokens === value} className={promptTokens === value ? "is-selected" : ""} onClick={() => onChange("promptTokens", value)} key={value}>{value.toLocaleString()}</button>)}</div>
      </fieldset>
      <fieldset>
        <legend>CONCURRENT REQUESTS</legend>
        <div>{[4, 16, 32, 52, 64].map((value) => <button type="button" aria-pressed={concurrency === value} className={concurrency === value ? "is-selected" : ""} onClick={() => onChange("concurrency", value)} key={value}>{value}</button>)}</div>
      </fieldset>
      <small>Educational controls: sequence shape and model architecture determine real KV bytes.</small>
    </div>
  );
}

export function StreamingComparison({ metrics, streaming }) {
  const ttftPosition = Math.max(8, Math.min(72, (metrics.ttft / metrics.endToEndLatency) * 100));
  return (
    <div className="sd-ai-stream-compare" aria-label="Streaming and non-streaming response comparison">
      <div><span>NON-STREAMING</span><i><b style={{ width: "100%" }} /></i><strong>VISIBLE AT {metrics.endToEndLatency.toLocaleString()} MS</strong></div>
      <div className={streaming ? "is-active" : ""}><span>STREAMING</span><i><b style={{ width: `${ttftPosition}%` }} />{[0, 1, 2, 3].map((token) => <em style={{ left: `${ttftPosition + token * ((96 - ttftPosition) / 3)}%` }} key={token}>T</em>)}</i><strong>FIRST TOKEN AT {metrics.ttft.toLocaleString()} MS</strong></div>
      <p>Both paths perform the same modeled prefill and decode work. Delivery timing changes.</p>
    </div>
  );
}

export function AutoscaleTimeline({ phase }) {
  return (
    <div className="sd-ai-autoscale-timeline" aria-label={`Autoscaling phase: ${AI_AUTOSCALE_PHASES[phase]}`}>
      {AI_AUTOSCALE_PHASES.map((label, index) => <div className={index < phase ? "is-complete" : index === phase ? "is-current" : ""} key={label}><i>{index < phase ? "✓" : index + 1}</i><span>{label}</span>{index < AI_AUTOSCALE_PHASES.length - 1 && <b>→</b>}</div>)}
    </div>
  );
}

export function RoutingExamples({ strategy, metrics }) {
  return (
    <div className="sd-ai-routing-examples" aria-label="Example model-routing decisions">
      <div><span>“WHAT IS 2 + 2?”</span><strong>{strategy === "always-large" ? "CAPABLE MODEL" : "FAST MODEL"}</strong></div>
      <div><span>“ANALYSE THIS TECHNICAL DESIGN”</span><strong>{strategy === "always-fast" ? "FAST MODEL / RISK" : "CAPABLE MODEL"}</strong></div>
      <p>Quality proxy {metrics.qualityProxy}/100 · capable-tier share {metrics.largeModelShare}% · cost index {metrics.costIndex.toFixed(2)}</p>
    </div>
  );
}
