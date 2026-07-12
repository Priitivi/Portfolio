import { motion as Motion } from "framer-motion";
import LifeTimeline from "./LifeTimeline";
import { skills } from "../data/portfolioData";

function About() {
  return (
    <section id="about" className="pf-section pf-about">
      <div className="pf-section-heading">
        <span>01 / THE PERSON</span>
        <h2>Logic in the code.<br /><em>Personality</em> in the product.</h2>
        <p>I like the point where robust engineering meets a strong creative idea—the work should function cleanly and still feel unmistakably made by someone.</p>
      </div>

      <div className="pf-about-grid">
        <Motion.article className="pf-bento pf-bio-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="pf-card-label">PLAYER PROFILE</span>
          <div className="pf-bio-monogram" aria-hidden="true">PR</div>
          <h3>Priitivi Ravi</h3>
          <p>Computer Science graduate from the University of Warwick, based in London and focused on building useful, expressive software.</p>
          <div className="pf-bio-status"><i /> Open to the next challenge</div>
        </Motion.article>

        <Motion.article className="pf-bento pf-manifesto-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}>
          <span className="pf-card-label">OPERATING PRINCIPLES</span>
          <blockquote>“Make it clear.<br />Make it useful.<br /><mark>Then make it memorable.</mark>”</blockquote>
          <p>Good software earns trust through the small details: sensible structure, deliberate interaction, and respect for the person using it.</p>
        </Motion.article>

        <article className="pf-bento pf-journey-card">
          <div className="pf-bento-heading"><span className="pf-card-label">STORY SO FAR</span><strong>04 checkpoints</strong></div>
          <LifeTimeline />
        </article>

        <article className="pf-bento pf-skills-card">
          <div className="pf-bento-heading"><span className="pf-card-label">TECH LOADOUT</span><strong>{skills.length} equipped</strong></div>
          <div className="pf-skills-grid">
            {skills.map((skill, index) => (
              <Motion.div key={skill.name} className="pf-skill" initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04 }} viewport={{ once: true }}>
                <img src={skill.logo} alt="" aria-hidden="true" />
                <div><strong>{skill.name}</strong><span>{skill.category}</span></div>
              </Motion.div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export default About;
