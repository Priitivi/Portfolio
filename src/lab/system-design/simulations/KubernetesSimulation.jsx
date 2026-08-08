import { useMemo, useRef, useState } from "react";
import SimulationFrame, { Metric, Node } from "../components/SimulationFrame";
import SystemDiagram from "../components/SystemDiagram";
import { useSimulationScheduler } from "../hooks/useSimulationScheduler";
import { replicaDelta } from "../simulationModel";

const desired = 3;
const initialPods = [1, 2, 3].map((id) => ({ id: `pod-${id}`, label: `POD ${id}`, status: "running" }));

export default function KubernetesSimulation() {
  const [pods, setPods] = useState(initialPods);
  const [controlState, setControlState] = useState("watching");
  const [status, setStatus] = useState("Desired state matches actual state. Kill any pod to create drift.");
  const [busy, setBusy] = useState(false);
  const [healed, setHealed] = useState(0);
  const [recovery, setRecovery] = useState("—");
  const [activeConnections, setActiveConnections] = useState([]);
  const [packets, setPackets] = useState([]);
  const packetKey = useRef(0);
  const { schedule, clear } = useSimulationScheduler();
  const delta = replicaDelta(desired, pods);
  const connections = useMemo(() => pods.map((pod) => ({
    id: `control-${pod.id}`,
    from: "control-plane",
    to: pod.id,
    fromAnchor: "right",
    toAnchor: "left",
    route: "fanout-right",
  })), [pods]);

  const killPod = (id) => {
    if (busy) return;
    clear();
    const pod = pods.find((item) => item.id === id);
    const replacementNumber = 4 + healed;
    const replacementId = `pod-${replacementNumber}`;
    setBusy(true);
    setRecovery("timing…");
    setPods((current) => current.map((item) => item.id === id ? { ...item, status: "failed" } : item));
    setControlState("drift");
    setStatus(`${pod.label} terminated. Actual replicas dropped below desired state.`);
    schedule(() => {
      packetKey.current += 1;
      setControlState("reconciling");
      setActiveConnections([`control-${id}`]);
      setPackets([{ connectionId: `control-${id}`, reverse: true, tone: "failed", duration: 420, key: `failure-${packetKey.current}` }]);
      setStatus("Control plane detects desired 3 ≠ actual 2. Reconciliation begins.");
    }, 650);
    schedule(() => {
      setPods((current) => [...current, { id: replacementId, label: `POD ${replacementNumber}`, status: "starting" }]);
      setControlState("creating");
      setActiveConnections([]);
      setPackets([]);
      setStatus(`Scheduler places replacement POD ${replacementNumber}. Image starts on a healthy node.`);
    }, 1320);
    schedule(() => {
      packetKey.current += 1;
      setActiveConnections([`control-${replacementId}`]);
      setPackets([{ connectionId: `control-${replacementId}`, duration: 520, key: `replacement-${packetKey.current}` }]);
    }, 1430);
    schedule(() => {
      setPods((current) => current.filter((item) => item.id !== id).map((item) => item.status === "starting" ? { ...item, status: "running" } : item));
      setControlState("healthy");
      setStatus("Replacement passed its readiness probe. Desired and actual state match again.");
      setHealed((value) => value + 1);
      setActiveConnections([]);
      setPackets([]);
      setRecovery("2.1 s");
      setBusy(false);
    }, 2100);
  };

  return (
    <SimulationFrame
      id="kubernetes" index="04" eyebrow="ORCHESTRATION / RECOVERY" title="Kubernetes healing"
      lede="Kill a live pod. The control loop observes the drift, schedules a replacement, and restores capacity."
      solves="A declarative control loop continuously pushes actual workload state back toward the desired state after failures."
      tradeoffs={["+ Automated recovery and declarative rollouts", "− Control-plane and operational complexity", "− Recovery still depends on probes and startup time"]}
      metrics={<><Metric label="DESIRED" value={desired} /><Metric label="RUNNING" value={delta.running} tone={delta.healthy ? "good" : "bad"} /><Metric label="PODS HEALED" value={healed} /><Metric label="RECOVERY" value={recovery} /></>}
    >
      <div className="sd-controls"><strong className="sd-desired">DESIRED REPLICAS <b>{desired}</b></strong><span className={`sd-reconcile-state is-${controlState}`}><i /> {controlState.toUpperCase()}</span><code>DEPLOYMENT / web-api</code></div>
      <SystemDiagram className={`sd-kube-diagram is-${controlState}`} connections={connections} activeConnections={activeConnections} packets={packets}>
        {(registerNode) => <>
          <Node ref={registerNode("control-plane")} label="CONTROL PLANE" detail="Desired state controller" state={controlState === "watching" || controlState === "healthy" ? "healthy" : "active"} className="sd-control-plane"><span className="sd-equation">DESIRED {desired} / ACTUAL {delta.running}</span></Node>
          <div className="sd-control-link" aria-hidden="true"><span>WATCH / RECONCILE</span></div>
          <div className="sd-pod-pool" aria-label={`${delta.running} of ${desired} replicas running`}>
            {pods.map((pod) => (
              <div className="sd-pod-wrap" key={pod.id}>
                <Node ref={registerNode(pod.id)} label={pod.label} detail={pod.status === "running" ? "Ready / 1/1" : pod.status === "failed" ? "Terminated" : "ContainerCreating"} state={pod.status === "running" ? "healthy" : pod.status} />
                <button type="button" disabled={busy || pod.status !== "running"} onClick={() => killPod(pod.id)}>KILL POD</button>
              </div>
            ))}
          </div>
        </>}
      </SystemDiagram>
      <p className="sd-status" role="status"><span>CONTROLLER</span>{status}</p>
    </SimulationFrame>
  );
}
