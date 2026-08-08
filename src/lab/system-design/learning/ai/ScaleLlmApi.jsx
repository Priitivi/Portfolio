import { useMemo, useRef, useState } from "react";
import { useSimulationScheduler } from "../../hooks/useSimulationScheduler";
import { DecisionCards, LearningCheckpoint, LearningStageRail, MetricBoard, TradeoffSummary } from "../LearningPrimitives";
import AiArchitecture from "./AiArchitecture";
import { AI_AUTOSCALE_PHASES, aiStages, recommendedAiDecision } from "./aiStages";
import { aiMetricDisplay, aiMetricTone, mergeAiArchitecture, mergeAiWorkload, simulateAiInference } from "./aiInferenceModel";
import { AutoscaleTimeline, BatchTimeline, InferenceLifecyclePrimer, KvWorkloadControls, ReferenceShelf, RoutingExamples, StageReference, StreamingComparison } from "./AiLessonVisuals";

const comparisonKeys = {
  traffic: ["queueDepth", "ttft", "cost"],
  queue: ["queueDepth", "capacity", "cost"],
  batching: ["throughput", "gpuUtil", "costEfficiency"],
  streaming: ["perceivedWait", "p95", "cost"],
  "prefix-cache": ["ttft", "cachedPrompt", "gpuMemory"],
  autoscaling: ["queueDepth", "workers", "cost"],
  routing: ["ttft", "cost", "quality"],
  failure: ["availability", "quality", "ttft"],
};

const constraintAddition = (stage) => ({
  name: `CURRENT CONSTRAINT / ${stage.eyebrow.split(" / ").at(-1)}`,
  why: stage.principle,
  improves: ["Clear diagnosis", "Evidence-led change"],
  costs: ["The constraint remains until capacity or policy changes"],
});

const autoscaleState = (phase) => {
  if (phase === 0) return { workload: {}, architecture: {} };
  if (phase === 1) return { workload: { requestRate: 120, concurrency: 180 }, architecture: {} };
  if (phase === 2) return { workload: { requestRate: 120, concurrency: 180, backlog: 120 }, architecture: { startingWorkers: 6 } };
  if (phase === 3) return { workload: { requestRate: 120, concurrency: 180, backlog: 360 }, architecture: { startingWorkers: 6 } };
  if (phase === 4) return { workload: { requestRate: 120, concurrency: 180, backlog: 220 }, architecture: { workers: 10, startingWorkers: 0 } };
  return { workload: { requestRate: 120, concurrency: 180, backlog: 0 }, architecture: { workers: 10, startingWorkers: 0 } };
};

export default function ScaleLlmApi() {
  const [stageIndex, setStageIndex] = useState(0);
  const [furthestStage, setFurthestStage] = useState(0);
  const [selectedDecisionId, setSelectedDecisionId] = useState(null);
  const [checkpointAnswer, setCheckpointAnswer] = useState(null);
  const [workloadOverrides, setWorkloadOverrides] = useState({});
  const [autoscalePhase, setAutoscalePhase] = useState(0);
  const [failedWorkers, setFailedWorkers] = useState(0);
  const [eventStatus, setEventStatus] = useState("");
  const [complete, setComplete] = useState(false);
  const headingRef = useRef(null);
  const { schedule, clear } = useSimulationScheduler();
  const stage = aiStages[stageIndex];
  const selectedDecision = stage.decisions?.find((decision) => decision.id === selectedDecisionId);
  const bestFit = recommendedAiDecision(stage);
  const phaseState = stage.id === "autoscaling" ? autoscaleState(autoscalePhase) : { workload: {}, architecture: {} };

  const workload = useMemo(() => mergeAiWorkload(stage.workload, { ...workloadOverrides, ...phaseState.workload }), [phaseState.workload, stage.workload, workloadOverrides]);
  const architecture = useMemo(() => mergeAiArchitecture(stage.architecture, {
    ...(selectedDecision?.patch || {}),
    ...phaseState.architecture,
    failedWorkers,
  }), [failedWorkers, phaseState.architecture, selectedDecision, stage.architecture]);
  const baselineArchitecture = useMemo(() => mergeAiArchitecture(stage.architecture, { failedWorkers }), [failedWorkers, stage.architecture]);
  const baselineMetrics = useMemo(() => simulateAiInference({ workload: mergeAiWorkload(stage.workload, workloadOverrides), architecture: baselineArchitecture }), [baselineArchitecture, stage.workload, workloadOverrides]);
  const metrics = useMemo(() => simulateAiInference({ workload, architecture }), [architecture, workload]);
  const addition = selectedDecision?.addition || stage.addition || constraintAddition(stage);
  const topologyKey = `${stage.id}-${selectedDecisionId || "baseline"}-${failedWorkers}-${autoscalePhase}-${workload.promptTokens}-${workload.concurrency}`;

  const focusHeading = () => window.requestAnimationFrame(() => headingRef.current?.focus());
  const resetTransientState = () => {
    clear();
    setSelectedDecisionId(null);
    setCheckpointAnswer(null);
    setWorkloadOverrides({});
    setAutoscalePhase(0);
    setFailedWorkers(0);
    setEventStatus("");
    setComplete(false);
  };
  const goToStage = (index) => {
    if (index > furthestStage) return;
    resetTransientState();
    setStageIndex(index);
    focusHeading();
  };
  const advance = () => {
    if (stageIndex >= aiStages.length - 1) return;
    const next = stageIndex + 1;
    resetTransientState();
    setFurthestStage((current) => Math.max(current, next));
    setStageIndex(next);
    focusHeading();
  };
  const restart = () => {
    resetTransientState();
    setStageIndex(0);
    setFurthestStage(0);
    focusHeading();
  };
  const chooseDecision = (id) => {
    clear();
    setSelectedDecisionId(id);
    setCheckpointAnswer(null);
    setAutoscalePhase(0);
    setEventStatus("");
  };
  const updateWorkload = (key, value) => setWorkloadOverrides((current) => ({ ...current, [key]: value }));
  const failWorker = () => {
    clear();
    setFailedWorkers(1);
    setEventStatus("CAPABLE WORKER 2 FAILED. The scheduler removes it from the ready set.");
    schedule(() => setEventStatus("ELIGIBLE REQUESTS REROUTED. Queue pressure rises while the pool runs degraded."), 700);
  };
  const runAutoscale = () => {
    if (!selectedDecision?.recommended || autoscalePhase) return;
    clear();
    setAutoscalePhase(1);
    setEventStatus("TRAFFIC SPIKE / 120 REQUESTS PER SECOND. The warm pool saturates.");
    schedule(() => { setAutoscalePhase(2); setEventStatus("AUTOSCALER TRIGGERED. Six additional workers requested."); }, 700);
    schedule(() => { setAutoscalePhase(3); setEventStatus("MODEL LOADING + RUNTIME WARM-UP. Requested workers are not ready capacity yet."); }, 1500);
    schedule(() => { setAutoscalePhase(4); setEventStatus("NEW WORKERS READY. The scheduler admits work across ten workers."); }, 2500);
    schedule(() => { setAutoscalePhase(5); setEventStatus("QUEUE RECOVERED. Spare capacity now carries a higher cost index."); }, 3400);
  };

  const renderOutcomeAction = () => {
    if (!selectedDecision?.recommended) return <button type="button" onClick={() => chooseDecision(bestFit.id)}>Compare the fit-for-purpose change</button>;
    if (stage.id === "autoscaling") {
      if (autoscalePhase === 0) return <button type="button" onClick={runAutoscale}>Run traffic spike / 20 → 120 req/s</button>;
      if (autoscalePhase < AI_AUTOSCALE_PHASES.length - 1) return <button type="button" disabled>Scaling sequence in progress…</button>;
      return <button type="button" onClick={advance}>Apply autoscaling + next constraint</button>;
    }
    if (stage.id === "failure") return <button type="button" onClick={() => setComplete(true)}>Finish the guided run</button>;
    return <button type="button" onClick={advance}>Apply change + next constraint</button>;
  };

  const outcomeMetrics = comparisonKeys[stage.id] || ["ttft", "gpuUtil", "cost"];
  const batchMode = selectedDecision?.patch?.batching || architecture.batching;
  const showDecisions = stage.decisions && (stage.id !== "failure" || failedWorkers > 0);

  return (
    <section className="sd-scale-lab sd-ai-lab" id="ai-systems" aria-labelledby="ai-scale-title">
      <header className="sd-scale-intro sd-ai-intro">
        <div>
          <p className="sd-overline">AI SYSTEMS / GUIDED LEARNING</p>
          <h2 id="ai-scale-title" tabIndex="-1">Scale an<br /><em>LLM API.</em></h2>
        </div>
        <div>
          <strong>INFERENCE ARCHITECTURE EMERGES FROM CONSTRAINTS.</strong>
          <p>Trace prompt processing, token generation, queueing, batching, memory pressure, elasticity, routing, and fallback as one service evolves.</p>
          <small>Normalized educational model—not a hardware benchmark and not a description of any company&apos;s private architecture.</small>
        </div>
      </header>

      <LearningStageRail stages={aiStages} currentIndex={stageIndex} furthestIndex={furthestStage} onSelect={goToStage} ariaLabel="Scale an LLM API stages" />

      <div className="sd-scale-console sd-ai-console">
        <div className="sd-scale-console-bar">
          <span><i /> AI INFERENCE MODEL</span>
          <strong>STAGE {stage.number} / {aiStages.length.toString().padStart(2, "0")}</strong>
          <small>NORMALIZED / DETERMINISTIC / EDUCATIONAL</small>
        </div>

        <div className="sd-scale-workbench">
          <AiArchitecture key={topologyKey} architecture={architecture} metrics={metrics} stageId={stage.id} eventStatus={eventStatus} />

          <aside className="sd-scale-inspector" aria-labelledby={`ai-stage-${stage.id}`}>
            {complete ? (
              <div className="sd-scale-finish">
                <span>AI SYSTEMS JOURNEY COMPLETE</span>
                <h3>Capacity, memory, latency, cost—and product behavior.</h3>
                <p>You evolved a simple model endpoint into a queued, scheduled, continuously batched, memory-aware, elastic, routed, and failure-aware inference service.</p>
                <button type="button" onClick={restart}>Restart from one model server</button>
              </div>
            ) : <>
              <div className="sd-scale-stage-heading">
                <span>{stage.eyebrow}</span>
                <h3 id={`ai-stage-${stage.id}`} ref={headingRef} tabIndex="-1">{stage.title}</h3>
                <p>{stage.scenario}</p>
              </div>

              <div className={`sd-scale-diagnosis is-${metrics.bottleneck === "HEALTHY" ? "healthy" : "constrained"}`}>
                <span>BOTTLENECK INSPECTOR</span>
                <strong>{metrics.bottleneck}</strong>
                <p role="status">{eventStatus || stage.principle}</p>
              </div>

              {stage.id === "one-worker" && <div className="sd-scale-question"><span>{stage.question}</span><strong>{stage.answer}</strong><button type="button" onClick={advance}>Increase concurrency <i>1 → 18 active requests</i></button></div>}

              {stage.id === "one-worker" && <InferenceLifecyclePrimer />}

              {stage.id === "workers" && <div className="sd-scale-question"><span>{stage.question}</span><strong>{stage.answer}</strong><button type="button" onClick={advance}>Stress scheduling efficiency <i>Variable output lengths →</i></button></div>}

              {stage.id === "kv-cache" && <div className="sd-scale-question sd-ai-control-question"><span>WORKLOAD LAB</span><strong>{stage.question}</strong><KvWorkloadControls promptTokens={workload.promptTokens} concurrency={workload.concurrency} onChange={updateWorkload} /><button type="button" onClick={advance}>Continue to response delivery <i>TTFT vs total time →</i></button></div>}

              {stage.id === "failure" && failedWorkers === 0 && <div className="sd-scale-question"><span>FAILURE INJECTION</span><strong>Remove one capable-model worker from the ready pool.</strong><button className="sd-scale-failure-button" type="button" onClick={failWorker}>Kill capable worker 2</button></div>}

              {showDecisions && <div className="sd-scale-question">
                <span>ARCHITECTURE DECISION</span>
                <strong>{stage.question}</strong>
                <DecisionCards decisions={stage.decisions} selectedId={selectedDecisionId} onSelect={chooseDecision} ariaLabel={`${stage.title} decisions`} />
                {selectedDecision && <div className={`sd-scale-outcome ${selectedDecision.recommended ? "is-fit" : ""}`} role="status">
                  <span>{selectedDecision.recommended ? "FIT FOR THIS CONSTRAINT" : "VALID EXPERIMENT / NOTICE THE LIMIT"}</span>
                  <p>{selectedDecision.outcome}</p>
                  <div>{outcomeMetrics.map((key) => { const [label, before] = aiMetricDisplay(key, baselineMetrics); const [, after] = aiMetricDisplay(key, metrics); return <small key={key}>{label}<b>{before} → {after}</b></small>; })}</div>
                  {renderOutcomeAction()}
                </div>}
              </div>}

              {stage.id === "batching" && <BatchTimeline mode={batchMode} />}
              {stage.id === "streaming" && <StreamingComparison metrics={metrics} streaming={architecture.streaming} />}
              {stage.id === "autoscaling" && <AutoscaleTimeline phase={autoscalePhase} />}
              {stage.id === "routing" && <RoutingExamples strategy={architecture.routingStrategy} metrics={metrics} />}

              {stage.checkpoint && (selectedDecision?.recommended || stage.id === "kv-cache" || (stage.id === "failure" && failedWorkers > 0)) && <LearningCheckpoint checkpoint={stage.checkpoint} selectedId={checkpointAnswer} onSelect={setCheckpointAnswer} />}
              <StageReference referenceId={stage.reference} />
            </>}
          </aside>
        </div>

        <MetricBoard keys={stage.metricKeys} metrics={metrics} display={aiMetricDisplay} tone={aiMetricTone} ariaLabel="Current AI inference metrics" />
      </div>

      <TradeoffSummary addition={addition} />
      <ReferenceShelf />
    </section>
  );
}
