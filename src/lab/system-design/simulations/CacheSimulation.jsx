import { useMemo, useRef, useState } from "react";
import SimulationFrame, { Metric, Node } from "../components/SimulationFrame";
import SystemDiagram from "../components/SystemDiagram";
import { useSimulationScheduler } from "../hooks/useSimulationScheduler";
import { cacheResources, resolveCacheRequest } from "../simulationModel";

export default function CacheSimulation() {
  const [resourceId, setResourceId] = useState(cacheResources[0].id);
  const [cache, setCache] = useState(() => new Set());
  const [enabled, setEnabled] = useState(true);
  const [activeNode, setActiveNode] = useState(null);
  const [activeConnections, setActiveConnections] = useState([]);
  const [packets, setPackets] = useState([]);
  const [status, setStatus] = useState("Choose a resource, then send the first request.");
  const [busy, setBusy] = useState(false);
  const packetKey = useRef(0);
  const [stats, setStats] = useState({ requests: 0, hits: 0, dbQueries: 0, latency: "—" });
  const { schedule, clear } = useSimulationScheduler();
  const selectedResource = useMemo(() => cacheResources.find((item) => item.id === resourceId), [resourceId]);
  const connections = useMemo(() => [
    { id: "client-api", from: "client", to: "api", fromAnchor: "bottom", toAnchor: "top" },
    { id: "api-redis", from: "api", to: "redis", fromAnchor: "bottom", toAnchor: "top" },
    { id: "redis-db", from: "redis", to: "database", fromAnchor: "bottom", toAnchor: "top" },
    { id: "api-db", from: "api", to: "database", route: "side-right", muted: true, hidden: enabled },
  ], [enabled]);

  const travel = (connectionId, destination, reverse = false, tone = "") => {
    const connection = connections.find((item) => item.id === connectionId);
    setActiveConnections([connectionId]);
    setActiveNode(reverse ? connection?.to : connection?.from);
    packetKey.current += 1;
    setPackets([{ connectionId, reverse, tone, duration: 380, key: `${connectionId}-${packetKey.current}` }]);
    schedule(() => setActiveNode(destination), 380);
  };

  const sendRequest = () => {
    if (busy) return;
    clear();
    const result = resolveCacheRequest({ cache, resourceId, enabled });
    setBusy(true);
    travel("client-api", "api");
    setStatus(`Requesting ${selectedResource.label.toLowerCase()} from the API…`);

    schedule(() => {
      if (enabled) {
        travel("api-redis", "redis");
        setStatus(`Redis checks key “${resourceId}”.`);
      } else {
        travel("api-db", "database");
        setStatus("Cache bypassed. The API must query the database.");
      }
    }, 450);

    if (result.outcome === "hit") {
      schedule(() => { setActiveNode("redis"); setStatus("CACHE HIT — data returns without touching the database."); }, 840);
      schedule(() => { travel("api-redis", "api", true); setStatus("Redis returns the cached value to the API."); }, 1020);
      schedule(() => { travel("client-api", "client", true); setStatus("The API sends the response back to the client."); }, 1470);
      schedule(() => { setStatus(`Returned “${selectedResource.payload}” in ${result.latency} ms.`); }, 1890);
    } else {
      schedule(() => {
        if (result.outcome === "miss") {
          setActiveNode("redis");
          setStatus("CACHE MISS — the request continues to the database.");
        } else {
          setActiveNode("database");
          setStatus("Database is processing the uncached request.");
        }
      }, 840);
      schedule(() => {
        if (enabled) {
          travel("redis-db", "database");
          setStatus("Redis requests the value from the database.");
        } else {
          travel("api-db", "api", true);
          setStatus("Database response returns directly to the API.");
        }
      }, 1020);
      schedule(() => {
        if (enabled) {
          travel("redis-db", "redis", true);
          setStatus("Database responds. The value travels back to Redis.");
        } else {
          travel("client-api", "client", true);
          setStatus("The API sends the database response to the client.");
        }
      }, 1470);
      if (enabled) {
        schedule(() => {
          setCache((previous) => new Set(previous).add(resourceId));
          travel("api-redis", "api", true);
          setStatus("CACHE POPULATED — Redis stores the value and returns it to the API.");
        }, 1920);
        schedule(() => { travel("client-api", "client", true); setStatus("The API sends the response back to the client."); }, 2370);
        schedule(() => { setStatus(`Returned “${selectedResource.payload}” in ${result.latency} ms.`); }, 2790);
      } else {
        schedule(() => { setStatus(`Returned “${selectedResource.payload}” in ${result.latency} ms.`); }, 1890);
      }
    }

    schedule(() => {
      setStats((previous) => ({
        requests: previous.requests + 1,
        hits: previous.hits + (result.outcome === "hit" ? 1 : 0),
        dbQueries: previous.dbQueries + result.databaseQueries,
        latency: `${result.latency} ms`,
      }));
      setActiveConnections([]);
      setPackets([]);
      setBusy(false);
    }, result.outcome === "hit" ? 1920 : result.outcome === "miss" ? 2820 : 1920);
  };

  const clearCache = () => {
    if (busy) return;
    setCache(new Set());
    setActiveNode(null);
    setActiveConnections([]);
    setPackets([]);
    setStatus("Cache cleared. The next cached request will miss.");
  };

  const hitRate = stats.requests ? `${Math.round((stats.hits / stats.requests) * 100)}%` : "0%";
  const nodeState = (node) => activeNode === node ? "active" : "idle";

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
      <SystemDiagram className="sd-cache-diagram" connections={connections} activeConnections={activeConnections} packets={packets}>
        {(registerNode) => <>
          <Node ref={registerNode("client")} label="CLIENT" detail="Browser" state={nodeState("client")} className="sd-cache-client" />
          <Node ref={registerNode("api")} label="API" detail="Request handler" state={nodeState("api")} className="sd-cache-api" />
          <Node ref={registerNode("redis")} label="REDIS" detail={enabled ? `${cache.size} cached keys` : "Bypassed"} state={nodeState("redis")} className="sd-cache-redis" />
          <Node ref={registerNode("database")} label="DATABASE" detail="Source of truth" state={nodeState("database")} className="sd-cache-db" />
        </>}
      </SystemDiagram>
      <p className="sd-status" role="status"><span>TRACE</span>{status}</p>
    </SimulationFrame>
  );
}
