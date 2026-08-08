import { useMemo } from "react";
import { Node } from "../../components/SimulationFrame";
import SystemDiagram from "../../components/SystemDiagram";
import { useRepresentativeTraffic } from "../useRepresentativeTraffic";
import { buildAiConnections, buildAiTraffic } from "./aiTopology";

const loadState = (value) => value >= 94 ? "saturated" : value >= 78 ? "busy" : "healthy";

function AiGauge({ label, value }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <span className="sd-ai-gauge" aria-label={`${label} ${value.toFixed(1)} percent`}>
      <i style={{ "--ai-gauge": `${bounded}%` }} />
      <b>{value.toFixed(0)}%</b>
    </span>
  );
}

function WorkerChips({ count, failedWorkers }) {
  const visible = Math.min(3, Math.max(1, count));
  return (
    <span className="sd-ai-worker-chips" aria-label={`${Math.max(0, count - failedWorkers)} of ${count} model workers ready`}>
      {Array.from({ length: visible }, (_, index) => <i className={failedWorkers && index === 1 ? "is-failed" : ""} key={index}>GPU {index + 1}</i>)}
      {count > visible && <i>+{count - visible}</i>}
    </span>
  );
}

export default function AiArchitecture({ architecture, metrics, stageId, eventStatus = "" }) {
  const connections = useMemo(() => buildAiConnections(architecture), [architecture]);
  const traces = useMemo(() => buildAiTraffic(architecture), [architecture]);
  const traffic = useRepresentativeTraffic(traces, connections, { travelMs: 400, nodeHoldMs: 115, traceHoldMs: 260 });
  const packets = traffic.packet
    ? Array.from({ length: traffic.packet.burst || 1 }, (_, index) => ({
        ...traffic.packet,
        delay: index * (traffic.packet.burstGap || 70),
        key: `${traffic.packet.key}-${index}`,
      }))
    : [];
  const routing = architecture.routingStrategy !== "standard";
  const topologyClasses = [
    "sd-ai-topology",
    architecture.queue ? "has-queue" : "is-direct",
    architecture.scheduler ? "has-scheduler" : "",
    architecture.kvCacheVisible ? "has-kv" : "",
    architecture.autoscaling ? "has-autoscaler" : "",
    routing ? "has-routing" : "",
  ].filter(Boolean).join(" ");
  const nodeState = (id, fallback) => traffic.activeNode === id ? "active" : fallback;
  const workerState = architecture.failedWorkers ? "degraded" : loadState(metrics.gpuUtilization);
  const queueState = metrics.queueDepth >= 100 ? "saturated" : metrics.queueDepth > 0 ? "busy" : "healthy";
  const kvState = metrics.gpuMemoryUtilization >= 94 ? "saturated" : metrics.gpuMemoryUtilization >= 78 ? "busy" : "healthy";
  const displayedWorkers = Math.min(3, Math.max(1, architecture.workers));

  return (
    <div className="sd-scale-architecture sd-ai-architecture">
      <div className="sd-ai-lifecycle" aria-label={`Inference lifecycle: prefill ${metrics.prefillMs} milliseconds, time to first token ${metrics.ttft} milliseconds, inter-token latency ${metrics.interTokenMs} milliseconds`}>
        <span>PROMPT <b>{metrics.promptTokens.toLocaleString()} TOKENS</b></span>
        <i>→</i><span>PREFILL <b>{metrics.prefillMs} MS</b></span>
        <i>→</i><span>FIRST TOKEN <b>{metrics.ttft} MS</b></span>
        <i>→</i><span>DECODE <b>{metrics.interTokenMs.toFixed(1)} MS / TOKEN</b></span>
      </div>
      <SystemDiagram className={topologyClasses} connections={connections} activeConnections={traffic.activeConnection ? [traffic.activeConnection] : []} packets={packets}>
        {(registerNode) => <>
          <Node ref={registerNode("ai-user")} label="USER" detail={architecture.streaming ? "Receiving token stream" : "Waiting for response"} state={nodeState("ai-user", "healthy")} className="sd-ai-user" />
          <Node ref={registerNode("ai-api")} label="INFERENCE API" detail={`${metrics.requestRate.toFixed(1)} requests / second`} state={nodeState("ai-api", "healthy")} className="sd-ai-api" />
          {architecture.queue && <Node ref={registerNode("ai-queue")} label="INFERENCE QUEUE" detail={`${metrics.queueDepth} waiting / ${architecture.queueCapacity} limit`} state={nodeState("ai-queue", queueState)} className="sd-ai-queue"><AiGauge label="Queue capacity" value={(metrics.queueDepth / architecture.queueCapacity) * 100} /></Node>}
          {architecture.scheduler && <Node ref={registerNode("ai-scheduler")} label={routing ? "SCHEDULER / ROUTER" : "INFERENCE SCHEDULER"} detail={routing ? `${metrics.largeModelShare}% to capable tier` : `${architecture.batching.replace("none", "sequential")} batching`} state={nodeState("ai-scheduler", "healthy")} className="sd-ai-scheduler" />}
          {architecture.autoscaling && <Node ref={registerNode("ai-autoscaler")} label="AUTOSCALER" detail={architecture.startingWorkers ? `${architecture.startingWorkers} workers starting` : "Watching queue + GPU signals"} state={nodeState("ai-autoscaler", architecture.startingWorkers ? "starting" : "healthy")} className="sd-ai-autoscaler" />}

          {routing ? <>
            <Node ref={registerNode("ai-fast-pool")} label="FAST MODEL POOL" detail="Lower cost / lower capability proxy" state={nodeState("ai-fast-pool", "healthy")} className="sd-ai-fast-pool"><AiGauge label="GPU utilisation" value={metrics.gpuUtilization * 0.82} /></Node>
            <Node ref={registerNode("ai-capable-pool")} label="CAPABLE MODEL POOL" detail={architecture.failedWorkers ? `${architecture.failedWorkers} worker unavailable` : "Higher cost / capability proxy"} state={nodeState("ai-capable-pool", architecture.failedWorkers ? "degraded" : workerState)} className="sd-ai-capable-pool"><WorkerChips count={Math.max(2, Math.round(architecture.workers * metrics.largeModelShare / 100))} failedWorkers={architecture.failedWorkers} /></Node>
          </> : Array.from({ length: displayedWorkers }, (_, index) => {
            const workerNumber = index + 1;
            const failed = architecture.failedWorkers && workerNumber === 2;
            return <Node key={workerNumber} ref={registerNode(`ai-worker-${workerNumber}`)} label={displayedWorkers === 1 ? "MODEL WORKER" : `GPU WORKER ${workerNumber}`} detail={failed ? "UNAVAILABLE / removed from schedule" : `${metrics.activeSequences} active across pool`} state={nodeState(`ai-worker-${workerNumber}`, failed ? "failed" : workerState)} className={`sd-ai-worker sd-ai-worker-${workerNumber}`}><AiGauge label="GPU utilisation" value={metrics.gpuUtilization} />{workerNumber === displayedWorkers && architecture.workers > displayedWorkers && <WorkerChips count={architecture.workers} failedWorkers={architecture.failedWorkers} />}</Node>;
          })}

          {architecture.kvCacheVisible && <Node ref={registerNode("ai-kv")} label={architecture.prefixCache ? "KV + PREFIX BLOCKS" : "KV CACHE"} detail={architecture.prefixCache ? `${metrics.prefixHitRate}% prefix hit rate` : `${metrics.activeSequences} active sequence states`} state={nodeState("ai-kv", kvState)} className="sd-ai-kv"><AiGauge label="GPU memory utilisation" value={metrics.gpuMemoryUtilization} /></Node>}
        </>}
      </SystemDiagram>
      <div className="sd-scale-trace" role="status"><span>REPRESENTATIVE INFERENCE</span><strong>{eventStatus || traffic.status}</strong></div>
      <div className="sd-ai-stage-tag" aria-hidden="true">AI / {stageId.toUpperCase().replaceAll("-", " ")}</div>
    </div>
  );
}
