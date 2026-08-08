import { useMemo, useRef, useState } from "react";
import { useSimulationScheduler } from "../hooks/useSimulationScheduler";
import { scaleStages, recommendedDecision } from "./scaleStages";
import { mergeArchitecture, simulateScale } from "./scalingModel";
import ScaleArchitecture from "./ScaleArchitecture";
import { DecisionCards, LearningCheckpoint, LearningStageRail, MetricBoard, TradeoffSummary } from "./LearningPrimitives";

const constraintAddition = (stage) => ({
  name: stage.id === "simple" ? "NO NEW INFRASTRUCTURE" : `CURRENT CONSTRAINT / ${stage.eyebrow.split(" / ").at(-1)}`,
  why: stage.principle,
  improves: ["Clear diagnosis", "Evidence-led changes"],
  costs: ["The bottleneck remains until a decision is applied"],
});

export default function ScaleToMillionUsers() {
  const [stageIndex, setStageIndex] = useState(0);
  const [furthestStage, setFurthestStage] = useState(0);
  const [selectedDecisionId, setSelectedDecisionId] = useState(null);
  const [checkpointAnswer, setCheckpointAnswer] = useState(null);
  const [replicaLag, setReplicaLag] = useState(false);
  const [failedApiCount, setFailedApiCount] = useState(0);
  const [eventStatus, setEventStatus] = useState("");
  const [complete, setComplete] = useState(false);
  const headingRef = useRef(null);
  const { schedule, clear } = useSimulationScheduler();
  const stage = scaleStages[stageIndex];
  const selectedDecision = stage.decisions?.find((decision) => decision.id === selectedDecisionId);
  const bestFit = recommendedDecision(stage);

  const architecture = useMemo(() => mergeArchitecture(stage.architecture, {
    ...(selectedDecision?.patch || {}),
    failedApiCount,
  }), [failedApiCount, selectedDecision, stage.architecture]);
  const baselineArchitecture = useMemo(() => mergeArchitecture(stage.architecture), [stage.architecture]);
  const baselineMetrics = useMemo(() => simulateScale({ workload: stage.workload, architecture: baselineArchitecture }), [baselineArchitecture, stage.workload]);
  const metrics = useMemo(() => simulateScale({ workload: stage.workload, architecture }), [architecture, stage.workload]);
  const topologyKey = `${stage.id}-${selectedDecisionId || "baseline"}-${failedApiCount}`;
  const addition = selectedDecision?.addition || stage.addition || constraintAddition(stage);

  const focusHeading = () => window.requestAnimationFrame(() => headingRef.current?.focus());
  const resetTransientState = () => {
    clear();
    setSelectedDecisionId(null);
    setCheckpointAnswer(null);
    setReplicaLag(false);
    setFailedApiCount(0);
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
    if (stageIndex >= scaleStages.length - 1) return;
    const next = stageIndex + 1;
    resetTransientState();
    setFurthestStage((current) => Math.max(current, next));
    setStageIndex(next);
    focusHeading();
  };

  const chooseDecision = (id) => {
    clear();
    setSelectedDecisionId(id);
    setCheckpointAnswer(null);
    setReplicaLag(false);
    setEventStatus("");
  };

  const demonstrateReplicaLag = () => {
    clear();
    setReplicaLag(true);
    setEventStatus("WRITE COMMITTED on PRIMARY. Immediate replica read returns the previous plan: FREE.");
    schedule(() => {
      setReplicaLag(false);
      setEventStatus("REPLICA CAUGHT UP. The next read returns the new plan: PRO.");
    }, 1800);
  };

  const failApi = () => {
    if (failedApiCount) return;
    clear();
    setFailedApiCount(1);
    setEventStatus("API 2 FAILED. Health checks remove it from rotation.");
    schedule(() => setEventStatus("REQUESTS REROUTED. The remaining healthy instances absorb the traffic."), 700);
  };

  const restart = () => {
    resetTransientState();
    setStageIndex(0);
    setFurthestStage(0);
    focusHeading();
  };

  return (
    <section className="sd-scale-lab" id="scaling-systems" aria-labelledby="scale-title">
      <header className="sd-scale-intro">
        <div>
          <p className="sd-overline">FLAGSHIP EXPERIENCE / GUIDED LEARNING</p>
          <h2 id="scale-title" tabIndex="-1">Scale to a<br /><em>million users.</em></h2>
        </div>
        <div>
          <strong>ARCHITECTURE IS A RESPONSE TO CONSTRAINTS.</strong>
          <p>Start with one server. Increase the workload, find the bottleneck, choose a change, and watch the same system evolve.</p>
          <small>Educational capacity model. User counts are scenario markers—not universal infrastructure prescriptions.</small>
        </div>
      </header>

      <LearningStageRail stages={scaleStages} currentIndex={stageIndex} furthestIndex={furthestStage} onSelect={goToStage} ariaLabel="Scaling journey stages" />

      <div className="sd-scale-console">
        <div className="sd-scale-console-bar">
          <span><i /> LIVE CAPACITY MODEL</span>
          <strong>STAGE {stage.number} / {scaleStages.length.toString().padStart(2, "0")}</strong>
          <small>DETERMINISTIC / RELATIVE BEHAVIOUR</small>
        </div>

        <div className="sd-scale-workbench">
          <ScaleArchitecture key={topologyKey} architecture={architecture} metrics={metrics} replicaLag={replicaLag} />

          <aside className="sd-scale-inspector" aria-labelledby={`scale-stage-${stage.id}`}>
            {complete ? (
              <div className="sd-scale-finish">
                <span>JOURNEY COMPLETE / 1,000,000 USERS</span>
                <h3>Complexity earned, one constraint at a time.</h3>
                <p>You introduced compute, caching, read capacity, edge delivery, asynchronous work, and redundancy only when the workload justified them.</p>
                <button type="button" onClick={restart}>Restart from 10 users</button>
              </div>
            ) : (
              <>
                <div className="sd-scale-stage-heading">
                  <span>{stage.eyebrow}</span>
                  <h3 id={`scale-stage-${stage.id}`} ref={headingRef} tabIndex="-1">{stage.title}</h3>
                  <p>{stage.scenario}</p>
                </div>

                <div className={`sd-scale-diagnosis is-${metrics.bottleneck === "HEALTHY" ? "healthy" : "constrained"}`}>
                  <span>CURRENT DIAGNOSIS</span>
                  <strong>{metrics.bottleneck}</strong>
                  <p role="status">{eventStatus || stage.principle}</p>
                </div>

                {stage.id === "simple" && (
                  <div className="sd-scale-question">
                    <span>{stage.question}</span>
                    <strong>{stage.answer}</strong>
                    <button type="button" onClick={advance}>Increase traffic <i>10 → 100 → 1K → 10K users</i></button>
                  </div>
                )}

                {stage.decisions && (
                  <div className="sd-scale-question">
                    <span>ARCHITECTURE DECISION</span>
                    <strong>{stage.question}</strong>
                    <DecisionCards decisions={stage.decisions} selectedId={selectedDecisionId} onSelect={chooseDecision} />
                    {selectedDecision && (
                      <div className={`sd-scale-outcome ${selectedDecision.recommended ? "is-fit" : ""}`} role="status">
                        <span>{selectedDecision.recommended ? "FIT FOR THIS CONSTRAINT" : "VALID EXPERIMENT / NOTICE THE LIMIT"}</span>
                        <p>{selectedDecision.outcome}</p>
                        <div>
                          <small>P95 <b>{baselineMetrics.p95} → {metrics.p95} ms</b></small>
                          <small>API <b>{baselineMetrics.apiUtilization.toFixed(0)} → {metrics.apiUtilization.toFixed(0)}%</b></small>
                          <small>DB <b>{baselineMetrics.databaseUtilization.toFixed(0)} → {metrics.databaseUtilization.toFixed(0)}%</b></small>
                        </div>
                        {selectedDecision.recommended ? (
                          <button type="button" onClick={advance}>Apply change + next constraint</button>
                        ) : (
                          <button type="button" onClick={() => chooseDecision(bestFit.id)}>Compare the fit-for-purpose change</button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {stage.id === "read-scaling" && selectedDecision?.id === "replicas" && (
                  <button className="sd-scale-demo" type="button" onClick={demonstrateReplicaLag} disabled={replicaLag}>WRITE, THEN READ IMMEDIATELY <span>{replicaLag ? "REPLICA CATCHING UP…" : "DEMO EVENTUAL CONSISTENCY"}</span></button>
                )}

                {stage.id === "failure" && (
                  <div className="sd-scale-question">
                    <span>FAILURE INJECTION</span>
                    <strong>Remove one live application instance.</strong>
                    <button className="sd-scale-failure-button" type="button" disabled={Boolean(failedApiCount)} onClick={failApi}>{failedApiCount ? "API 2 IS OFFLINE" : "KILL API 2"}</button>
                    {failedApiCount > 0 && <button type="button" onClick={() => setComplete(true)}>Finish the guided run</button>}
                  </div>
                )}

                {stage.checkpoint && (selectedDecision?.recommended || failedApiCount > 0) && (
                  <LearningCheckpoint checkpoint={stage.checkpoint} selectedId={checkpointAnswer} onSelect={setCheckpointAnswer} />
                )}
              </>
            )}
          </aside>
        </div>

        <MetricBoard keys={stage.metricKeys} metrics={metrics} />
      </div>

      <TradeoffSummary addition={addition} />
    </section>
  );
}
