import { useState } from "react";
import SimulationFrame, { Metric, Node } from "../components/SimulationFrame";
import { useSimulationScheduler } from "../hooks/useSimulationScheduler";
import { deliverySummary } from "../simulationModel";

const initialSubscribers = [
  { id: "email", label: "EMAIL", detail: "Send receipt", online: true },
  { id: "analytics", label: "ANALYTICS", detail: "Count order", online: true },
  { id: "inventory", label: "INVENTORY", detail: "Reserve stock", online: true },
  { id: "fraud", label: "FRAUD", detail: "Score risk", online: true },
];

export default function PubSubSimulation() {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [activeTargets, setActiveTargets] = useState([]);
  const [status, setStatus] = useState("One publisher, four independent subscribers. Publish an order event.");
  const [stats, setStats] = useState({ published: 0, delivered: 0, failed: 0 });
  const { schedule, clear } = useSimulationScheduler();

  const publish = () => {
    if (busy) return;
    clear();
    const summary = deliverySummary(subscribers);
    setBusy(true);
    setPhase("publishing");
    setActiveTargets([]);
    setStats((current) => ({ ...current, published: current.published + 1 }));
    setStatus("Order Service emits ONE order.created event.");
    schedule(() => { setPhase("broker"); setStatus("The broker accepts the event and discovers its subscriptions."); }, 560);
    subscribers.forEach((subscriber, index) => {
      schedule(() => {
        setPhase("fanout");
        setActiveTargets((current) => [...current, subscriber.id]);
        setStatus(subscriber.online ? `Broker delivers an independent copy to ${subscriber.label}.` : `${subscriber.label} is offline — delivery is recorded as missed.`);
      }, 1100 + index * 170);
    });
    schedule(() => {
      setStats((current) => ({ ...current, delivered: current.delivered + summary.delivered, failed: current.failed + summary.failed }));
      setPhase("complete");
      setStatus(`Fan-out complete: ${summary.delivered} delivered, ${summary.failed} missed. The publisher knew none of these consumers.`);
      setBusy(false);
    }, 2050);
  };

  const toggleSubscriber = (id) => {
    if (busy) return;
    setSubscribers((current) => current.map((subscriber) => subscriber.id === id ? { ...subscriber, online: !subscriber.online } : subscriber));
  };

  return (
    <SimulationFrame
      id="pub-sub" index="03" eyebrow="DECOUPLING / EVENTS" title="Pub / Sub"
      lede="Publish once. The broker fans out independent copies, while the producer remains unaware of every consumer."
      solves="Producers and consumers can evolve and scale independently, and one event can trigger many downstream workflows."
      tradeoffs={["+ Loose coupling and easy fan-out", "− Duplicate and out-of-order delivery", "− Observability spans several independent services"]}
      metrics={<><Metric label="PUBLISHED" value={stats.published} /><Metric label="DELIVERED" value={stats.delivered} tone="good" /><Metric label="SUBSCRIBERS" value={subscribers.length} /><Metric label="MISSED" value={stats.failed} tone={stats.failed ? "bad" : ""} /></>}
    >
      <div className="sd-controls"><button className="sd-primary" type="button" disabled={busy} onClick={publish}>{busy ? "EVENT IN FLIGHT…" : "PUBLISH EVENT"}</button><code>TOPIC / order.created</code><span className="sd-health"><i /> AT-LEAST-ONCE</span></div>
      <div className={`sd-diagram sd-pubsub-diagram phase-${phase}`}>
        <Node label="ORDER SERVICE" detail="Publisher" state={phase === "publishing" ? "active" : "idle"} className="sd-publisher" />
        <Node label="EVENT BROKER" detail="order.created" state={["broker", "fanout"].includes(phase) ? "active" : phase === "complete" ? "healthy" : "idle"} className="sd-broker" />
        <i className="sd-packet sd-event-packet" aria-hidden="true" />
        {subscribers.map((subscriber, index) => (
          <div className={`sd-subscriber-wrap sd-subscriber-${index + 1}`} key={subscriber.id}>
            <Node label={subscriber.label} detail={subscriber.detail} state={!subscriber.online ? "offline" : activeTargets.includes(subscriber.id) ? "active" : "healthy"} />
            <button type="button" disabled={busy} onClick={() => toggleSubscriber(subscriber.id)}>{subscriber.online ? "ONLINE" : "OFFLINE"}</button>
            {activeTargets.includes(subscriber.id) && <i className={`sd-packet sd-fanout-packet fan-${index + 1}`} aria-hidden="true" />}
          </div>
        ))}
      </div>
      <p className="sd-status" role="status"><span>EVENT LOG</span>{status}</p>
    </SimulationFrame>
  );
}
