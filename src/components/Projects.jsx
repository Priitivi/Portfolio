import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { projects } from "../data/portfolioData";

function ProjectModal({ project, onClose }) {
  const closeButton = useRef(null);

  useEffect(() => {
    closeButton.current?.focus();
    const closeOnEscape = (event) => event.code === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <Motion.div className="pf-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="pf-project-title">
      <Motion.article className="pf-project-modal" initial={{ y: 35, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 25, opacity: 0 }}>
        <button ref={closeButton} type="button" className="pf-modal-close" onClick={onClose} aria-label="Close project details">×</button>
        <div className="pf-modal-visual"><img src={project.image} alt={project.imageAlt} /><span>CASE FILE / {project.number}</span></div>
        <div className="pf-modal-copy">
          <p className="pf-eyebrow"><span /> Project dossier</p>
          <h2 id="pf-project-title">{project.title}</h2>
          <p className="pf-modal-lede">{project.description}</p>
          <div className="pf-modal-facts">
            <section><h3>The challenge</h3><p>{project.challenge}</p></section>
            <section><h3>My contribution</h3><p>{project.contribution}</p></section>
          </div>
          <ul className="pf-tag-list" aria-label="Technologies used">{project.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
          <div className="pf-modal-links">
            <a className="pf-button pf-button-primary" href={project.github} target="_blank" rel="noreferrer">View source <span aria-hidden="true">↗</span></a>
            {project.live && <a className="pf-text-link" href={project.live} target="_blank" rel="noreferrer">Visit live site</a>}
          </div>
        </div>
      </Motion.article>
    </Motion.div>
  );
}

function Projects() {
  const [selected, setSelected] = useState(null);

  return (
    <section id="projects" className="pf-section pf-projects">
      <div className="pf-section-heading pf-section-heading-light">
        <span>02 / SELECTED WORK</span>
        <h2>Three builds.<br />Three different <em>problems.</em></h2>
        <p>Each project began with something concrete to solve—from finding the right teammates to creating stronger personal boundaries.</p>
      </div>

      <div className="pf-project-list">
        {projects.map((project, index) => (
          <Motion.article key={project.title} className="pf-project-card" initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}>
            <div className="pf-project-number">{project.number}</div>
            <div className="pf-project-image"><img src={project.image} alt={project.imageAlt} /><span>{project.strapline}</span></div>
            <div className="pf-project-info">
              <span className="pf-card-label">{index === 2 ? "EXPERIMENTAL BUILD" : "FEATURED BUILD"}</span>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <ul className="pf-tag-list">{project.tags.slice(0, 4).map((tag) => <li key={tag}>{tag}</li>)}</ul>
              <button type="button" className="pf-project-open" onClick={() => setSelected(project)}>Open case file <span aria-hidden="true">↗</span></button>
            </div>
          </Motion.article>
        ))}
      </div>

      <div className="pf-github-banner">
        <div><span>MORE IN THE ARCHIVE</span><strong>Want the code, not the pitch?</strong></div>
        <a href="https://github.com/priitivi" target="_blank" rel="noreferrer">Explore GitHub <span aria-hidden="true">↗</span></a>
      </div>

      <AnimatePresence>{selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
    </section>
  );
}

export default Projects;
