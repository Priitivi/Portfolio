import { useState } from "react";
import SimulationFrame, { Metric, Node } from "../components/SimulationFrame";
import SystemDiagram from "../components/SystemDiagram";
import { useSimulationScheduler } from "../hooks/useSimulationScheduler";
import { deliverySummary } from "../simulationModel";

const initialSubscribers = [
  { id: "email", label: "EMAIL", detail: "Send receipt", online: true },
  { id: "analytics", label: "ANALYTICS", detail: "Count order", online: true },
  { id: "inventory", label: "INVENTORY", detail: "Reserve stock", online: true },
  { id: "fraud", label: "FRAUD", detail: "Score risk", online: true },
];
const connections = [
  { id: "publisher-broker", from: "publisher", to: "broker", fromAnchor: "bottom", toAnchor: "top" },
  ...initialSubscribers.map((subscriber) => ({ id: `broker-${subscriber.id}`, from: "broker", to: subscriber.id, route: "responsive-fanout", fromAnchor: "bottom", toAnchor: "top" })),
];

export default function PubSubSimulation() {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [activeTargets, setActiveTargets] = useState([]);
  const [activeConnections, setActiveConnections] = useState([]);
  const [packets, setPackets] = useState([]);
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
    setActiveConnections(["publisher-broker"]);
    setPackets([{ connectionId: "publisher-broker", duration: 480, key: `publish-${stats.published + 1}` }]);
    setStats((current) => ({ ...current, published: current.published + 1 }));
    setStatus("Order Service emits ONE order.created event.");
    schedule(() => { setPhase("broker"); setActiveConnections([]); setPackets([]); setStatus("The broker accepts the event and discovers its subscriptions."); }, 520);
    schedule(() => {
      const deliveryConnections = subscribers.map((subscriber) => `broker-${subscriber.id}`);
      setPhase("fanout");
      setActiveConnections(deliveryConnections);
      setPackets(subscribers.map((subscriber, index) => ({
        connectionId: `broker-${subscriber.id}`,
        duration: 520,
        delay: index * 70,
        tone: subscriber.online ? "" : "failed",
        key: `delivery-${stats.published + 1}-${subscriber.id}`,
      })));
      setStatus("The broker creates one delivery for every subscription.");
    }, 700);
    subscribers.forEach((subscriber, index) => {
      schedule(() => {
        setActiveTargets((current) => [...current, subscriber.id]);
        setStatus(subscriber.online ? `Broker delivers an independent copy to ${subscriber.label}.` : `${subscriber.label} is offline — delivery is recorded as missed.`);
      }, 1240 + index * 70);
    });
    schedule(() => {
      setStats((current) => ({ ...current, delivered: current.delivered + summary.delivered, failed: current.failed + summary.failed }));
      setPhase("complete");
      setActiveConnections([]);
      setPackets([]);
      setStatus(`Fan-out complete: ${summary.delivered} delivered, ${summary.failed} missed. The publisher knew none of these consumers.`);
      setBusy(false);
    }, 1650);
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
      <SystemDiagram className={`sd-pubsub-diagram phase-${phase}`} connections={connections} activeConnections={activeConnections} packets={packets}>
        {(registerNode) => <>
          <Node ref={registerNode("publisher")} label="ORDER SERVICE" detail="Publisher" state={phase === "publishing" ? "active" : "idle"} className="sd-publisher" />
          <Node ref={registerNode("broker")} label="EVENT BROKER" detail="order.created" state={["broker", "fanout"].includes(phase) ? "active" : phase === "complete" ? "healthy" : "idle"} className="sd-broker" />
          {subscribers.map((subscriber, index) => (
            <div className={`sd-subscriber-wrap sd-subscriber-${index + 1}`} key={subscriber.id}>
              <Node ref={registerNode(subscriber.id)} label={subscriber.label} detail={subscriber.detail} state={!subscriber.online ? "offline" : activeTargets.includes(subscriber.id) ? "active" : "healthy"} />
              <button type="button" disabled={busy} onClick={() => toggleSubscriber(subscriber.id)}>{subscriber.online ? "ONLINE" : "OFFLINE"}</button>
            </div>
          ))}
        </>}
      </SystemDiagram>
      <p className="sd-status" role="status"><span>EVENT LOG</span>{status}</p>
    </SimulationFrame>
  );
}
