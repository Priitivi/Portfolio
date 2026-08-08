import { useEffect, useRef, useState } from "react";
import SimulationFrame, { Metric, Node } from "../components/SimulationFrame";
import { useSimulationScheduler } from "../hooks/useSimulationScheduler";
import { chooseServer } from "../simulationModel";

const initialServers = [1, 2, 3].map((id) => ({ id, online: true, active: 0, handled: 0 }));

export default function LoadBalancerSimulation() {
  const [strategy, setStrategy] = useState("round-robin");
  const [servers, setServers] = useState(initialServers);
  const [busy, setBusy] = useState(false);
  const [pulse, setPulse] = useState(null);
  const [status, setStatus] = useState("All instances pass their health checks. Generate a traffic burst.");
  const [totals, setTotals] = useState({ routed: 0, dropped: 0 });
  const serversRef = useRef(servers);
  const cursor = useRef(0);
  const { schedule, clear } = useSimulationScheduler();
  useEffect(() => { serversRef.current = servers; }, [servers]);

  const updateServers = (updater) => setServers((previous) => {
    const next = updater(previous);
    serversRef.current = next;
    return next;
  });

  const sendTraffic = () => {
    if (busy) return;
    clear();
    setBusy(true);
    setStatus(`Routing six requests using ${strategy === "round-robin" ? "round robin" : "least connections"}.`);
    for (let index = 0; index < 6; index += 1) {
      schedule(() => {
        const selected = chooseServer(serversRef.current, strategy, cursor.current);
        if (!selected) {
          setTotals((current) => ({ ...current, dropped: current.dropped + 1 }));
          setStatus("NO HEALTHY UPSTREAM — request rejected with 503.");
          setPulse("dropped");
          return;
        }
        if (strategy === "round-robin") cursor.current += 1;
        setPulse(selected.id);
        setStatus(`Request ${index + 1} → Server ${selected.id}. Unhealthy nodes are excluded.`);
        updateServers((current) => current.map((server) => server.id === selected.id ? { ...server, active: server.active + 1, handled: server.handled + 1 } : server));
        setTotals((current) => ({ ...current, routed: current.routed + 1 }));
        schedule(() => updateServers((current) => current.map((server) => server.id === selected.id ? { ...server, active: Math.max(0, server.active - 1) } : server)), 720);
      }, index * 350);
    }
    schedule(() => { setBusy(false); setPulse(null); setStatus("Burst complete. Toggle a server and run it again to compare distribution."); }, 2800);
  };

  const toggleServer = (id) => {
    if (busy) return;
    const target = servers.find((server) => server.id === id);
    updateServers((current) => current.map((server) => server.id === id ? { ...server, online: !server.online, active: 0 } : server));
    setStatus(`Server ${id} marked ${target.online ? "UNHEALTHY. The load balancer will stop routing to it" : "HEALTHY. It has rejoined the pool"}.`);
  };

  const onlineCount = servers.filter((server) => server.online).length;
  const totalActive = servers.reduce((sum, server) => sum + server.active, 0);

  return (
    <SimulationFrame
      id="load-balancing" index="02" eyebrow="AVAILABILITY / TRAFFIC" title="Load balancing"
      lede="Send a burst, change the routing strategy, then fail an instance. Healthy capacity absorbs the traffic."
      solves="Traffic is distributed across multiple application instances so one machine is not a capacity ceiling or single point of failure."
      tradeoffs={["+ Horizontal scale and resilience", "− Health checks can lag behind failures", "− Stateful sessions need affinity or shared storage"]}
      metrics={<><Metric label="ROUTED" value={totals.routed} /><Metric label="IN FLIGHT" value={totalActive} /><Metric label="HEALTHY" value={`${onlineCount}/3`} tone={onlineCount === 3 ? "good" : "warn"} /><Metric label="DROPPED" value={totals.dropped} tone={totals.dropped ? "bad" : ""} /></>}
    >
      <div className="sd-controls">
        <label>STRATEGY<select value={strategy} disabled={busy} onChange={(event) => { setStrategy(event.target.value); cursor.current = 0; }}><option value="round-robin">Round Robin</option><option value="least-connections">Least Connections</option></select></label>
        <button className="sd-primary" type="button" onClick={sendTraffic} disabled={busy}>{busy ? "ROUTING…" : "GENERATE TRAFFIC ×6"}</button>
        <span className="sd-health"><i /> HEALTH CHECK / 2s</span>
      </div>
      <div className={`sd-diagram sd-lb-diagram ${busy ? "is-routing" : ""}`}>
        <div className="sd-route-line sd-lb-in" aria-hidden="true" />
        <Node label="CLIENTS" detail="Traffic burst" state={busy ? "active" : "idle"} className="sd-lb-clients" />
        <Node label="LOAD BALANCER" detail={strategy.replace("-", " ")} state={busy ? "active" : "healthy"} className="sd-lb-balancer" />
        {servers.map((server) => (
          <div className={`sd-server-wrap sd-server-${server.id}`} key={server.id}>
            <Node label={`SERVER ${server.id}`} detail={`${server.active} active / ${server.handled} served`} state={!server.online ? "offline" : pulse === server.id ? "active" : "healthy"} />
            <button type="button" onClick={() => toggleServer(server.id)} disabled={busy}>{server.online ? "TAKE OFFLINE" : "RESTORE"}</button>
          </div>
        ))}
        {pulse && pulse !== "dropped" && <i key={`${pulse}-${totals.routed}`} className={`sd-packet sd-lb-packet to-${pulse}`} aria-hidden="true" />}
      </div>
      <p className="sd-status" role="status"><span>ROUTER</span>{status}</p>
    </SimulationFrame>
  );
}
