import { candidateEvidence, evidenceById } from "../data/candidateEvidence.js";
import {
  competencies,
  preparationAreas,
  smartRebookDiscoveryChecklist,
} from "../data/competencies.js";
import { confirmedSourceFacts } from "../data/smartRebookScenario.js";

export default function PreparationScreen({ onBack, onStartMode }) {
  const confirmedBehaviour = confirmedSourceFacts.find((item) => item.id === "core-behaviour");

  return (
    <main className="ic-main ic-preparation">
      <section className="ic-page-heading">
        <div>
          <p className="ic-eyebrow">PREPARE / SOURCE-GROUNDED REVIEW</p>
          <h1>Build evidence.<br /><em>Find the gaps.</em></h1>
        </div>
        <div className="ic-page-intro">
          <p>Use this workspace before a practice session. Source-backed statements and suggested preparation prompts are labelled separately.</p>
          <button className="ic-link-button" type="button" onClick={onBack}>← Change mode</button>
        </div>
      </section>

      <section className="ic-section" aria-labelledby="competencies-title">
        <div className="ic-section-heading">
          <div><span>01</span><h2 id="competencies-title">Likely assessment areas</h2></div>
          <p>Grounded in the responsibilities and behaviours described in the supplied interview brief.</p>
        </div>
        <div className="ic-competency-grid">
          {competencies.map((competency) => (
            <article className="ic-competency-card" key={competency.id}>
              <span className="ic-source-label is-fact">SOURCE-BACKED ROLE AREA</span>
              <h3>{competency.title}</h3>
              <p>{competency.assessmentFocus}</p>
              <div>
                <strong>What strong evidence looks like</strong>
                <p>{competency.strongEvidence}</p>
              </div>
              <ul aria-label="Relevant CV evidence">
                {competency.evidenceIds.map((id) => {
                  const evidence = evidenceById(id);
                  return <li key={id}>{evidence.title}</li>;
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="ic-section ic-evidence-section" aria-labelledby="evidence-title">
        <div className="ic-section-heading">
          <div><span>02</span><h2 id="evidence-title">Candidate evidence bank</h2></div>
          <p>Only role-relevant experience listed in the supplied CV summary is included. Contact details and personal identifiers are excluded.</p>
        </div>
        <div className="ic-evidence-list">
          {candidateEvidence.map((evidence, index) => (
            <article key={evidence.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{evidence.title}</h3><p>{evidence.summary}</p></div>
              <ul>{evidence.supports.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="ic-section" aria-labelledby="gaps-title">
        <div className="ic-section-heading">
          <div><span>03</span><h2 id="gaps-title">Areas to prepare</h2></div>
          <p>These are preparation prompts, not claims that the candidate lacks the experience.</p>
        </div>
        <div className="ic-prompt-grid">
          {preparationAreas.map((area) => (
            <article key={area.id}>
              <span className="ic-source-label is-prompt">PRACTICE PROMPT</span>
              <h3>{area.title}</h3>
              <p>{area.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ic-section ic-checklist-section" aria-labelledby="checklist-title">
        <div className="ic-section-heading">
          <div><span>04</span><h2 id="checklist-title">Smart Rebook discovery map</h2></div>
          <p>The confirmed behaviour is separated from questions that would uncover the rest of a usable learning brief.</p>
        </div>
        <aside className="ic-fact-callout">
          <span className="ic-source-label is-fact">CONFIRMED SOURCE FACT</span>
          <p>{confirmedBehaviour.statement}</p>
        </aside>
        <ol className="ic-checklist">
          {smartRebookDiscoveryChecklist.map((item, index) => (
            <li key={item.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{item.title}</h3><p>{item.prompt}</p></div>
              <small>PRACTICE PROMPT</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="ic-action-band">
        <div><span>NEXT / PRACTISE UNDER PRESSURE</span><h2>Turn preparation into performance.</h2></div>
        <div>
          <button className="ic-primary-button" type="button" onClick={() => onStartMode("mock")}>Start mock interview →</button>
          <button className="ic-secondary-button" type="button" onClick={() => onStartMode("roleplay")}>Start Smart Rebook role-play</button>
        </div>
      </section>
    </main>
  );
}
