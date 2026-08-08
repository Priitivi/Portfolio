import { useMemo, useState } from "react";
import SimulationFrame, { Metric, Node } from "../components/SimulationFrame";
import { useSimulationScheduler } from "../hooks/useSimulationScheduler";
import { cacheResources, resolveCacheRequest } from "../simulationModel";

export default function CacheSimulation() {
  const [resourceId, setResourceId] = useState(cacheResources[0].id);
  const [cache, setCache] = useState(() => new Set());
  const [enabled, setEnabled] = useState(true);
  const [phase, setPhase] = useState("idle");
  const [status, setStatus] = useState("Choose a resource, then send the first request.");
  const [busy, setBusy] = useState(false);
  const [packet, setPacket] = useState(0);
  const [stats, setStats] = useState({ requests: 0, hits: 0, dbQueries: 0, latency: "—" });
  const { schedule, clear } = useSimulationScheduler();
  const selectedResource = useMemo(() => cacheResources.find((item) => item.id === resourceId), [resourceId]);

  const sendRequest = () => {
    if (busy) return;
    clear();
    const result = resolveCacheRequest({ cache, resourceId, enabled });
    setBusy(true);
    setPacket((value) => value + 1);
    setPhase("client-api");
    setStatus(`Requesting ${selectedResource.label.toLowerCase()} from the API…`);

    schedule(() => {
      if (enabled) {
        setPhase("api-cache");
        setStatus(`Redis checks key “${resourceId}”.`);
      } else {
        setPhase("api-db");
        setStatus("Cache bypassed. The API must query the database.");
      }
    }, 520);

    if (result.outcome === "hit") {
      schedule(() => { setPhase("cache-hit"); setStatus("CACHE HIT — data returns without touching the database."); }, 1100);
      schedule(() => { setPhase("complete-hit"); setStatus(`Returned “${selectedResource.payload}” in ${result.latency} ms.`); }, 1660);
    } else {
      schedule(() => { setPhase("db-query"); setStatus(result.outcome === "miss" ? "CACHE MISS — the request continues to the database." : "Querying the source of truth."); }, 1100);
      schedule(() => {
        setPhase(enabled ? "cache-fill" : "db-return");
        setStatus(enabled ? "Database response received. Redis is populated for next time." : "Database response returns directly to the API.");
        if (enabled) setCache((previous) => new Set(previous).add(resourceId));
      }, 1780);
      schedule(() => { setPhase("complete-miss"); setStatus(`Returned “${selectedResource.payload}” in ${result.latency} ms.`); }, 2450);
    }

    schedule(() => {
      setStats((previous) => ({
        requests: previous.requests + 1,
        hits: previous.hits + (result.outcome === "hit" ? 1 : 0),
        dbQueries: previous.dbQueries + result.databaseQueries,
        latency: `${result.latency} ms`,
      }));
      setBusy(false);
    }, result.outcome === "hit" ? 1700 : 2500);
  };

  const clearCache = () => {
    if (busy) return;
    setCache(new Set());
    setPhase("idle");
    setStatus("Cache cleared. The next cached request will miss.");
  };

  const hitRate = stats.requests ? `${Math.round((stats.hits / stats.requests) * 100)}%` : "0%";
  const nodeState = (node) => {
    if (phase.includes(node)) return "active";
    if (node === "cache" && phase === "cache-hit") return "hit";
    if (node === "cache" && phase === "cache-fill") return "writing";
    if (node === "db" && phase === "complete-hit") return "skipped";
    return "idle";
  };

  return (
    <SimulationFrame
      id="caching" index="01" eyebrow="LATENCY / READ PATH" title="Redis caching"
      lede="Run the same request twice. The first fetch warms the cache; the second takes the short path."
      solves="Hot data can be served from memory, reducing response time and protecting the primary database from repeated reads."
      tradeoffs={["+ Lower latency and database load", "− Stale data and invalidation complexity", "− Another stateful service to operate"]}
      metrics={<><Metric label="REQUESTS" value={stats.requests} /><Metric label="HIT RATE" value={hitRate} tone="good" /><Metric label="DB QUERIES" value={stats.dbQueries} /><Metric label="LAST LATENCY" value={stats.latency} tone={stats.latency === "18 ms" ? "good" : ""} /></>}
    >
      <div className="sd-controls sd-cache-controls">
        <label>RESOURCE<select value={resourceId} disabled={busy} onChange={(event) => setResourceId(event.target.value)}>{cacheResources.map((resource) => <option value={resource.id} key={resource.id}>{resource.label}</option>)}</select></label>
        <button type="button" className="sd-primary" onClick={sendRequest} disabled={busy}>{busy ? "REQUEST IN FLIGHT…" : "SEND REQUEST"}</button>
        <button type="button" onClick={clearCache} disabled={busy || !cache.size}>CLEAR CACHE</button>
        <label className="sd-switch"><input type="checkbox" checked={enabled} disabled={busy} onChange={(event) => setEnabled(event.target.checked)} /><span /> CACHE {enabled ? "ON" : "OFF"}</label>
      </div>
      <div className={`sd-diagram sd-cache-diagram phase-${phase}`}>
        <div className="sd-route-line sd-line-1" aria-hidden="true" /><div className="sd-route-line sd-line-2" aria-hidden="true" /><div className="sd-route-line sd-line-3" aria-hidden="true" />
        {busy && <i key={packet} className="sd-packet sd-cache-packet" aria-hidden="true" />}
        <Node label="CLIENT" detail="Browser" state={nodeState("client")} className="sd-cache-client" />
        <Node label="API" detail="Request handler" state={nodeState("api")} className="sd-cache-api" />
        <Node label="REDIS" detail={enabled ? `${cache.size} cached keys` : "Bypassed"} state={nodeState("cache")} className="sd-cache-redis" />
        <Node label="DATABASE" detail="Source of truth" state={nodeState("db")} className="sd-cache-db" />
      </div>
      <p className="sd-status" role="status"><span>TRACE</span>{status}</p>
    </SimulationFrame>
  );
}
