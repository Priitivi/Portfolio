import { forwardRef, useEffect, useState } from "react";
import SystemDiagram from "./SystemDiagram";
import { heroConnections, heroRequestSequence } from "../data/heroTopology";

const PACKET_DURATION = 520;
const ARRIVAL_HOLD = 180;

const topologyNodes = [
  { id: "hero-client", number: "01", label: "CLIENT" },
  { id: "hero-api", number: "02", label: "API SERVER" },
  { id: "hero-redis", number: "03", label: "REDIS" },
  { id: "hero-database", number: "04", label: "DATABASE" },
];

const HeroNode = forwardRef(function HeroNode({ number, label, active }, ref) {
  return (
    <div ref={ref} className={`sd-topology-node ${active ? "is-active" : ""}`}>
      <span>{number}</span>
      {label}
    </div>
  );
});

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event) => setReducedMotion(event.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}

export default function HeroTopology() {
  const reducedMotion = useReducedMotion();
  const [motion, setMotion] = useState({ index: 0, cycle: 0, arrived: false });
  const current = heroRequestSequence[motion.index];

  useEffect(() => {
    if (reducedMotion) return undefined;

    const timeout = window.setTimeout(() => {
      if (!motion.arrived) {
        setMotion((value) => ({ ...value, arrived: true }));
        return;
      }

      setMotion((value) => {
        const nextIndex = (value.index + 1) % heroRequestSequence.length;
        return {
          index: nextIndex,
          cycle: nextIndex === 0 ? value.cycle + 1 : value.cycle,
          arrived: false,
        };
      });
    }, motion.arrived ? ARRIVAL_HOLD : PACKET_DURATION);

    return () => window.clearTimeout(timeout);
  }, [motion, reducedMotion]);

  const activeNode = motion.arrived ? current.to : current.from;
  const packets = reducedMotion || motion.arrived
    ? []
    : [{
        connectionId: current.connectionId,
        reverse: current.reverse,
        duration: PACKET_DURATION,
        key: `hero-packet-${motion.cycle}-${motion.index}`,
      }];

  return (
    <SystemDiagram
      className="sd-topology"
      connections={heroConnections}
      activeConnections={reducedMotion ? [] : [current.connectionId]}
      packets={packets}
      ariaHidden
    >
      {(registerNode) => topologyNodes.map((node) => (
        <HeroNode
          ref={registerNode(node.id)}
          key={node.id}
          number={node.number}
          label={node.label}
          active={!reducedMotion && node.id === activeNode}
        />
      ))}
    </SystemDiagram>
  );
}
