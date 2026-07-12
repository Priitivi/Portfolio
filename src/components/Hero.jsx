import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { heroModes } from "../data/portfolioData";

function Hero({ onExplore }) {
  const [activeMode, setActiveMode] = useState(heroModes[0]);

  return (
    <section id="hero" className="pf-hero">
      <div className="pf-grid" aria-hidden="true" />
      <div className="pf-hero-orbit pf-hero-orbit-one" aria-hidden="true" />
      <div className="pf-hero-orbit pf-hero-orbit-two" aria-hidden="true" />
      <div className="pf-hero-copy">
        <Motion.p className="pf-eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><span /> London-based creative developer</Motion.p>
        <Motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          Software should<br /><em>earn</em> a second look.
        </Motion.h1>
        <Motion.p className="pf-hero-lede" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          I&apos;m Priitivi—a Computer Science graduate building full-stack products, purposeful interfaces, and the occasional portfolio boss fight.
        </Motion.p>
        <Motion.div className="pf-hero-actions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <a className="pf-button pf-button-primary" href="#projects">Explore the work <span aria-hidden="true">↓</span></a>
          <button className="pf-button pf-button-ghost" type="button" onClick={onExplore}>Play the 3D fighter <span aria-hidden="true">↗</span></button>
          <a className="pf-text-link" href="/Priit_CV.pdf" download>Download CV</a>
        </Motion.div>
        <div className="pf-hero-stats" aria-label="Quick facts">
          <div><strong>03</strong><span>Featured builds</span></div>
          <div><strong>09</strong><span>Core technologies</span></div>
          <div><strong>∞</strong><span>Ideas in motion</span></div>
        </div>
      </div>
      <Motion.aside className="pf-console" initial={{ opacity: 0, scale: 0.96, rotate: 1 }} animate={{ opacity: 1, scale: 1, rotate: -1 }} transition={{ delay: 0.18, duration: 0.55 }} aria-label="Interactive developer profile">
        <div className="pf-console-top"><span>PRIITIVI_OS</span><div aria-hidden="true"><i /><i /><i /></div><small>ONLINE</small></div>
        <div className="pf-console-profile"><div className="pf-avatar-mark" aria-hidden="true">P</div><div><span>PROFILE LOADED</span><strong>Priitivi Ravi</strong><small>Creative developer · London</small></div></div>
        <div className="pf-console-tabs" role="tablist" aria-label="Development modes">
          {heroModes.map((mode) => <button key={mode.id} type="button" role="tab" aria-selected={activeMode.id === mode.id} onClick={() => setActiveMode(mode)}>{mode.label}</button>)}
        </div>
        <div className="pf-console-output" aria-live="polite"><span>$ {activeMode.command}</span><p>{activeMode.output}</p><div aria-hidden="true"><i /><i /><i /><i /><i /></div></div>
        <div className="pf-console-footer"><span>React</span><span>Node</span><span>Postgres</span><span>Three.js</span></div>
      </Motion.aside>
      <div className="pf-scroll-note" aria-hidden="true"><span>SCROLL TO EXPLORE</span><i /></div>
      <div className="pf-marquee" aria-hidden="true"><div>DESIGN WITH INTENT · BUILD WITH PURPOSE · SHIP WITH PERSONALITY · DESIGN WITH INTENT · BUILD WITH PURPOSE · SHIP WITH PERSONALITY ·</div></div>
    </section>
  );
}

export default Hero;
