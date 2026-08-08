import { useMemo } from "react";
import { Node } from "../components/SimulationFrame";
import SystemDiagram from "../components/SystemDiagram";
import { buildScaleConnections, buildScaleTraffic } from "./scaleTopology";
import { useRepresentativeTraffic } from "./useRepresentativeTraffic";

const utilizationState = (value) => value >= 90 ? "saturated" : value >= 72 ? "busy" : "healthy";

function Utilization({ label, value }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <span className="sd-scale-util" aria-label={`${label} ${value.toFixed(1)} percent`}>
      <i style={{ "--utilisation": `${bounded}%` }} />
      <b>{value.toFixed(0)}%</b>
    </span>
  );
}

function InstancePool({ count, failedApiCount }) {
  const representativeCount = Math.min(3, count);
  return (
    <span className="sd-scale-instances" aria-label={`${count - failedApiCount} of ${count} API instances healthy`}>
      {Array.from({ length: representativeCount }, (_, index) => (
        <i className={failedApiCount && index === 1 ? "is-failed" : ""} key={index}>API {index + 1}</i>
      ))}
      {count > representativeCount && <i>+{count - representativeCount}</i>}
    </span>
  );
}

export default function ScaleArchitecture({ architecture, metrics, replicaLag = false }) {
  const connections = useMemo(() => buildScaleConnections(architecture), [architecture]);
  const traces = useMemo(() => buildScaleTraffic(architecture), [architecture]);
  const traffic = useRepresentativeTraffic(traces, connections);
  const topologyClasses = [
    "sd-scale-topology",
    architecture.loadBalancer ? "has-balancer" : "is-simple",
    architecture.cdn ? "has-cdn" : "",
    architecture.cache ? "has-cache" : "",
    architecture.replicas ? "has-replicas" : "",
    architecture.queue ? "has-queue" : "",
  ].filter(Boolean).join(" ");

  const nodeState = (id, fallback) => traffic.activeNode === id ? "active" : fallback;
  const apiState = architecture.failedApiCount ? "degraded" : utilizationState(metrics.apiUtilization);
  const dbState = utilizationState(architecture.replicas ? metrics.primaryUtilization : metrics.databaseUtilization);

  return (
    <div className="sd-scale-architecture">
      <div className="sd-scale-trace" role="status"><span>REPRESENTATIVE TRAFFIC</span><strong>{traffic.status}</strong></div>
      <SystemDiagram className={topologyClasses} connections={connections} activeConnections={traffic.activeConnection ? [traffic.activeConnection] : []} packets={traffic.packet ? [traffic.packet] : []}>
        {(registerNode) => <>
          <Node ref={registerNode("scale-client")} label="CLIENTS" detail="Requests enter here" state={nodeState("scale-client", "healthy")} className="sd-scale-client" />
          {architecture.cdn && <Node ref={registerNode("scale-cdn")} label="CDN EDGE" detail={`${metrics.cdnHitRate}% static hit rate`} state={nodeState("scale-cdn", "healthy")} className="sd-scale-cdn" />}
          {architecture.cdn && <Node ref={registerNode("scale-origin")} label="STATIC ORIGIN" detail={`${metrics.originTraffic.toLocaleString()} req/s reaches origin`} state={nodeState("scale-origin", "healthy")} className="sd-scale-origin" />}
          {architecture.loadBalancer && <Node ref={registerNode("scale-lb")} label="LOAD BALANCER" detail={architecture.failedApiCount ? "Routing around API 2" : "Health-aware routing"} state={nodeState("scale-lb", architecture.failedApiCount ? "active" : "healthy")} className="sd-scale-lb" />}
          <Node ref={registerNode("scale-api")} label={architecture.apiInstances === 1 ? "API SERVER" : "API TIER"} detail={`${metrics.onlineApiInstances} online / ${architecture.apiInstances} provisioned`} state={nodeState("scale-api", apiState)} className="sd-scale-api">
            <InstancePool count={architecture.apiInstances} failedApiCount={architecture.failedApiCount} />
            <Utilization label="API utilisation" value={metrics.apiUtilization} />
          </Node>
          {architecture.cache && <Node ref={registerNode("scale-cache")} label="REDIS" detail={`${metrics.cacheHitRate}% read hit rate`} state={nodeState("scale-cache", "healthy")} className="sd-scale-cache" />}
          <Node ref={registerNode("scale-db")} label="PRIMARY DB" detail={architecture.replicas ? "Writes + consistent reads" : `${metrics.dbConnections} active connections`} state={nodeState("scale-db", dbState)} className="sd-scale-db">
            <Utilization label="Primary utilisation" value={architecture.replicas ? metrics.primaryUtilization : metrics.databaseUtilization} />
          </Node>
          {architecture.replicas && <>
            <Node ref={registerNode("scale-replica-1")} label="READ REPLICA 1" detail={replicaLag ? "OLD VALUE / catching up" : `${metrics.replicationLag} ms modelled lag`} state={nodeState("scale-replica-1", replicaLag ? "lagging" : utilizationState(metrics.replicaUtilization))} className="sd-scale-replica sd-scale-replica-1" />
            <Node ref={registerNode("scale-replica-2")} label="READ REPLICA 2" detail={`${metrics.replicationLag} ms modelled lag`} state={nodeState("scale-replica-2", utilizationState(metrics.replicaUtilization))} className="sd-scale-replica sd-scale-replica-2" />
          </>}
          {architecture.queue && <Node ref={registerNode("scale-queue")} label="MESSAGE QUEUE" detail={metrics.queueDepth ? `${metrics.queueDepth} jobs waiting` : "Consumers keeping pace"} state={nodeState("scale-queue", metrics.queueDepth ? "busy" : "healthy")} className="sd-scale-queue" />}
          {architecture.queue && <Node ref={registerNode("scale-workers")} label="WORKER POOL" detail={`${architecture.workers} independent consumers`} state={nodeState("scale-workers", "healthy")} className="sd-scale-workers" />}
        </>}
      </SystemDiagram>
    </div>
  );
}
