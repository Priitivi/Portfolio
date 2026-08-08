import { useState } from "react";
import SimulationFrame, { Metric, Node } from "../components/SimulationFrame";
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
  const { schedule, clear } = useSimulationScheduler();
  const delta = replicaDelta(desired, pods);

  const killPod = (id) => {
    if (busy) return;
    clear();
    const pod = pods.find((item) => item.id === id);
    setBusy(true);
    setRecovery("timing…");
    setPods((current) => current.map((item) => item.id === id ? { ...item, status: "failed" } : item));
    setControlState("drift");
    setStatus(`${pod.label} terminated. Actual replicas dropped below desired state.`);
    schedule(() => { setControlState("reconciling"); setStatus("Control plane detects desired 3 ≠ actual 2. Reconciliation begins."); }, 650);
    schedule(() => {
      const replacementNumber = 4 + healed;
      setPods((current) => [...current, { id: `pod-${replacementNumber}`, label: `POD ${replacementNumber}`, status: "starting" }]);
      setControlState("creating");
      setStatus(`Scheduler places replacement POD ${replacementNumber}. Image starts on a healthy node.`);
    }, 1320);
    schedule(() => {
      setPods((current) => current.filter((item) => item.id !== id).map((item) => item.status === "starting" ? { ...item, status: "running" } : item));
      setControlState("healthy");
      setStatus("Replacement passed its readiness probe. Desired and actual state match again.");
      setHealed((value) => value + 1);
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
      <div className={`sd-diagram sd-kube-diagram is-${controlState}`}>
        <div className="sd-pod-pool" aria-label={`${delta.running} of ${desired} replicas running`}>
          {pods.map((pod) => (
            <div className="sd-pod-wrap" key={pod.id}>
              <Node label={pod.label} detail={pod.status === "running" ? "Ready / 1/1" : pod.status === "failed" ? "Terminated" : "ContainerCreating"} state={pod.status === "running" ? "healthy" : pod.status} />
              <button type="button" disabled={busy || pod.status !== "running"} onClick={() => killPod(pod.id)}>KILL POD</button>
            </div>
          ))}
        </div>
        <div className="sd-control-link" aria-hidden="true"><i /><span>WATCH / RECONCILE</span></div>
        <Node label="CONTROL PLANE" detail="Desired state controller" state={controlState === "watching" || controlState === "healthy" ? "healthy" : "active"} className="sd-control-plane"><span className="sd-equation">DESIRED {desired} / ACTUAL {delta.running}</span></Node>
      </div>
      <p className="sd-status" role="status"><span>CONTROLLER</span>{status}</p>
    </SimulationFrame>
  );
}
