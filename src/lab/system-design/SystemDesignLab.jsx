import { useEffect } from "react";
import CacheSimulation from "./simulations/CacheSimulation";
import LoadBalancerSimulation from "./simulations/LoadBalancerSimulation";
import PubSubSimulation from "./simulations/PubSubSimulation";
import KubernetesSimulation from "./simulations/KubernetesSimulation";
import DesignChallenge from "./components/DesignChallenge";
import HeroTopology from "./components/HeroTopology";
import ScaleToMillionUsers from "./learning/ScaleToMillionUsers";
import "./system-design.css";
import "./scale-learning.css";

const catalogue = [
  { id: "caching", number: "01", title: "Redis caching", lesson: "Make the fast path visible", signal: "18 ms" },
  { id: "load-balancing", number: "02", title: "Load balancing", lesson: "Route around unhealthy capacity", signal: "3 nodes" },
  { id: "pub-sub", number: "03", title: "Pub / Sub", lesson: "Fan one event out to many", signal: "1 → 4" },
  { id: "kubernetes", number: "04", title: "Kubernetes", lesson: "Watch desired state win", signal: "3 / 3" },
];

export default function SystemDesignLab({ navigate }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "System Design Lab // Priit";
    document.body.classList.add("sd-system-design-active");
    return () => {
      document.title = previousTitle;
      document.body.classList.remove("sd-system-design-active");
    };
  }, []);

  const returnToLab = (event) => {
    event.preventDefault();
    navigate("/lab");
  };

  return (
    <main className="system-design-lab">
      <a className="sd-skip-link" href="#learn">Skip to guided learning</a>
      <div className="sd-grid-bg" aria-hidden="true" />
      <header className="sd-header">
        <a href="/lab" onClick={returnToLab} className="sd-wordmark" aria-label="Return to Priit Lab"><span>PL</span><strong>PRIIT LAB</strong><small>/ SYSTEM DESIGN</small></a>
        <nav aria-label="System Design Lab navigation">
          <a href="#learn">Learn</a>
          <a href="#simulations">Simulate</a>
          <a href="#challenge">Design</a>
          <a href="/lab" onClick={returnToLab}>Exit chamber ↗</a>
        </nav>
      </header>

      <section className="sd-hero">
        <div className="sd-hero-copy">
          <p className="sd-overline"><i /> EXPERIMENT 009 / INTERACTIVE ARCHITECTURE</p>
          <h1>System<br /><em>Design</em> Lab</h1>
          <p className="sd-hero-lede">Don&apos;t just read the architecture. <strong>Run it.</strong> Send requests, break infrastructure, and watch distributed systems respond in real time.</p>
          <div className="sd-hero-actions">
            <a href="#learn">START THE FLAGSHIP LAB <span>↓</span></a>
            <span>7 constraint stages / 4 concept simulations</span>
          </div>
        </div>

        <div className="sd-hero-visual" aria-label="Animated distributed system overview">
          <div className="sd-hero-topline"><span>LIVE TOPOLOGY</span><b>ALL SYSTEMS NOMINAL</b></div>
          <HeroTopology />
          <div className="sd-hero-readout"><span>REQUEST RATE <b>2.4K/s</b></span><span>P99 LATENCY <b>84ms</b></span><span>UPTIME <b>99.99%</b></span></div>
        </div>
      </section>

      <ScaleToMillionUsers />

      <section className="sd-catalogue" aria-labelledby="catalogue-title">
        <div><p className="sd-overline">SIMULATE / CONCEPT WORKBENCH</p><h2 id="catalogue-title">Focus on one system.<br />Change its state.</h2></div>
        <div className="sd-catalogue-grid">
          {catalogue.map((item) => (
            <a href={`#${item.id}`} key={item.id}>
              <span>{item.number}</span><strong>{item.title}</strong><p>{item.lesson}</p><small>{item.signal}</small><i>↘</i>
            </a>
          ))}
        </div>
      </section>

      <div id="simulations" className="sd-simulations">
        <CacheSimulation />
        <LoadBalancerSimulation />
        <PubSubSimulation />
        <KubernetesSimulation />
      </div>

      <DesignChallenge />

      <footer className="sd-footer">
        <div><span>EXPERIMENT 009</span><strong>SYSTEM DESIGN LAB</strong></div>
        <p>Client-side simulations. No production databases were harmed.</p>
        <a href="/lab" onClick={returnToLab}>RETURN TO PRIIT LAB →</a>
      </footer>
    </main>
  );
}
