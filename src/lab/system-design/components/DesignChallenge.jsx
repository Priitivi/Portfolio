import { useState } from "react";
import { designChallenge } from "../data/designChallenges";

export default function DesignChallenge() {
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState([]);
  const current = designChallenge.stages[stage];
  const selected = answers[stage];
  const selectedOption = current?.options.find((option) => option.id === selected);
  const complete = stage >= designChallenge.stages.length;

  const choose = (id) => setAnswers((previous) => [...previous.slice(0, stage), id]);
  const next = () => setStage((value) => value + 1);
  const reset = () => { setStage(0); setAnswers([]); };

  return (
    <section className="sd-challenge" id="challenge" aria-labelledby="challenge-title">
      <div className="sd-challenge-intro">
        <p className="sd-overline">DESIGN CHALLENGE / GUIDED MODE</p>
        <h2 id="challenge-title">{designChallenge.title}</h2>
        <p>{designChallenge.intro}</p>
        <div className="sd-system-stack" aria-label="Your selected architecture">
          <span>CLIENTS</span><i>→</i><span>API</span>
          {answers.map((answer) => <span className="is-added" key={answer}>+ {answer.replaceAll("-", " ")}</span>)}
          <span>DATABASE</span>
        </div>
      </div>

      <div className="sd-decision-panel">
        {complete ? (
          <div className="sd-complete">
            <span>ARCHITECTURE REVIEW</span>
            <h3>Ready for the next traffic spike.</h3>
            <p>You moved hot reads into a cache, scaled stateless APIs horizontally, and decoupled analytics with events.</p>
            <button type="button" onClick={reset}>Run challenge again</button>
          </div>
        ) : (
          <>
            <div className="sd-progress"><span>DECISION {stage + 1} / {designChallenge.stages.length}</span><i style={{ "--progress": `${((stage + 1) / designChallenge.stages.length) * 100}%` }} /></div>
            <h3>{current.prompt}</h3>
            <div className="sd-options">
              {current.options.map((option) => (
                <button type="button" className={selected === option.id ? "is-selected" : ""} aria-pressed={selected === option.id} onClick={() => choose(option.id)} key={option.id}>
                  <strong>{option.label}</strong><span>{option.effect}</span>
                </button>
              ))}
            </div>
            {selectedOption && (
              <div className="sd-feedback" role="status">
                <strong>{selectedOption.recommended ? "STRONG CHOICE" : "VALID, WITH A CATCH"}</strong>
                <p>{selectedOption.tradeoff}</p>
                <button type="button" onClick={next}>{stage === designChallenge.stages.length - 1 ? "Review design" : "Next pressure test"} →</button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
