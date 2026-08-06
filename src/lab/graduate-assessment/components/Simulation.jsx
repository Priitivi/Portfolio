import { useEffect, useRef, useState } from "react";
import { assessmentCategories } from "../data/catalog.js";
import { learningSignal } from "../engine/learning.js";
import { answerLabels } from "../engine/questions.js";
import {
  assembleSimulation,
  createSimulationAnswer,
  createSimulationCheckpoint,
  remainingSimulationSeconds,
  simulationFormats,
  simulationResults,
} from "../engine/simulation.js";
import { adjustedSeconds, timingProfiles } from "../engine/timing.js";
import AnswerExplanation from "./AnswerExplanation.jsx";
import { PatternGlyph, QuestionBody } from "./QuestionContent.jsx";
import ReviewNavigator from "./ReviewNavigator.jsx";

function formatClock(seconds) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function checkpointQuestionStart(checkpoint) {
  const savedAt = Date.parse(checkpoint?.savedAt);
  return Number.isFinite(savedAt) ? savedAt : Date.now();
}

function sectionDeadline(section, now) {
  return section.seconds === null ? null : now + section.seconds * 1000;
}

function SimulationOption({ question, option, index, selected, onSelect }) {
  return (
    <button type="button" className={`ga-answer-option${selected ? " is-selected" : ""}`} onClick={() => onSelect(index)} aria-pressed={selected}>
      <span>{answerLabels[index]}</span>
      {question.category === "logical" ? <PatternGlyph pattern={option} label={`Answer ${answerLabels[index]}`} /> : <strong>{option}</strong>}
    </button>
  );
}

function SimulationReview({ completed, onExit, onRestart, onPractice }) {
  const [reviewIndex, setReviewIndex] = useState(0);
  const reviewPanelRef = useRef(null);
  const questions = completed.simulation.sections.flatMap((section) => section.questions);
  const byQuestion = new Map(completed.answers.map((answer) => [answer.questionId, answer]));
  const orderedAnswers = questions.map((item) => byQuestion.get(item.id));
  const question = questions[reviewIndex];
  const answer = byQuestion.get(question.id);
  const result = completed.results;
  const learning = learningSignal(question, answer, completed.simulation.timingProfile);
  const weakestSection = [...result.sections].sort((left, right) => left.accuracy - right.accuracy || right.averageTime - left.averageTime)[0];
  const misses = new Map();
  questions.forEach((item) => {
    if (byQuestion.get(item.id)?.correct) return;
    const key = `${item.category}:${item.topic || "general"}`;
    misses.set(key, (misses.get(key) || 0) + 1);
  });
  const focusKey = [...misses.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
  const [focusCategory, ...focusParts] = focusKey?.split(":") || [];
  const focusTopic = focusParts.join(":");

  useEffect(() => { reviewPanelRef.current?.focus(); }, [reviewIndex]);

  return (
    <main className="ga-main ga-simulation-results">
      <section className="ga-result-hero">
        <p className="ga-kicker">SIMULATION COMPLETE</p>
        <h1>Evidence captured. Review the decisions.</h1>
        <p>{result.correct} of {result.attempted} strongest or correct responses across {result.sections.length} section{result.sections.length === 1 ? "" : "s"} using the {timingProfiles.find((profile) => profile.id === completed.simulation.timingProfile)?.label.toLowerCase()} profile.</p>
        <div className="ga-result-stats">
          <div><span>OVERALL ACCURACY</span><strong>{result.accuracy}%</strong></div>
          <div><span>AVG. RESPONSE</span><strong>{result.averageTime}s</strong></div>
          <div><span>TIMEOUTS</span><strong>{result.timedOut}</strong></div>
        </div>
        <p className="ga-result-note">Next focus: {weakestSection.label}. Review its method, then run a short focused set before repeating the simulation.</p>
        <p className="ga-simulation-disclaimer">These are educational practice results, not an employer pass prediction or validated percentile.</p>
        <div className="ga-result-actions"><button type="button" className="ga-button ga-button-primary" onClick={onExit}>Return to dashboard</button>{focusCategory && <button type="button" className="ga-button ga-button-ghost" onClick={() => onPractice({ category: focusCategory, difficulty: "foundation", timingProfile: "untimed", questionCount: 4, focusTopic })}>Practise {focusTopic.replaceAll("-", " ")}</button>}<button type="button" className="ga-button ga-button-ghost" onClick={onRestart}>New simulation</button></div>
      </section>

      <section className="ga-panel ga-simulation-section-results" aria-label="Section results">
        <div className="ga-panel-heading"><div><span>SECTION SIGNALS</span><h2>Accuracy and pace</h2></div></div>
        <div>{result.sections.map((section) => <article key={section.id}><span><strong>{section.label}</strong><small>{section.correct} of {section.attempted} · {section.averageTime}s average{section.timedOut ? ` · ${section.timedOut} timed out` : ""}</small></span><b>{section.accuracy}%</b></article>)}</div>
      </section>

      <section className="ga-review-panel" ref={reviewPanelRef} tabIndex={-1} aria-labelledby="ga-simulation-review-title">
        <div className="ga-panel-heading">
          <div><span>END-OF-ASSESSMENT REVIEW</span><h2 id="ga-simulation-review-title">Question {reviewIndex + 1} of {questions.length}</h2></div>
          <div className="ga-review-nav"><button type="button" aria-label="Previous review question" onClick={() => setReviewIndex((current) => Math.max(0, current - 1))} disabled={reviewIndex === 0}>←</button><button type="button" aria-label="Next review question" onClick={() => setReviewIndex((current) => Math.min(questions.length - 1, current + 1))} disabled={reviewIndex === questions.length - 1}>→</button></div>
        </div>
        <ReviewNavigator answers={orderedAnswers} current={reviewIndex} onSelect={setReviewIndex} label="Simulation question review status" />
        <QuestionBody question={question} />
        <div className="ga-review-answer">
          <span className={answer?.correct ? "is-correct" : "is-wrong"}>{answer?.correct ? (question.category === "situational" ? "STRONGEST MODELLED RESPONSE" : "CORRECT") : "REVIEW"}</span>
          <AnswerExplanation question={question} selected={answer?.selected ?? -1} />
          {question.category === "situational" && <ul>{question.optionDetails.map((option, index) => <li key={option.text}><strong>{answerLabels[index]}</strong><span>{option.rationale}</span></li>)}</ul>}
          <div className="ga-learning-signal"><strong>{learning.headline}</strong><p>{learning.strategy}</p><small>{learning.pace} {learning.nextStep}</small></div>
          <small>{question.category === "situational" ? "Strongest modelled response" : "Correct answer"}: {answerLabels[question.answer]} · Your answer: {answer?.selected >= 0 ? answerLabels[answer.selected] : "Timed out"}</small>
        </div>
      </section>
    </main>
  );
}

export default function Simulation({ checkpoint, selectionContext, onCheckpoint, onComplete, onExit, onPractice }) {
  const [formatId, setFormatId] = useState("quick");
  const [includeSituational, setIncludeSituational] = useState(true);
  const [timingProfileId, setTimingProfileId] = useState("standard");
  const [run, setRun] = useState(checkpoint);
  const [selected, setSelected] = useState(null);
  const [remaining, setRemaining] = useState(() => checkpoint ? remainingSimulationSeconds(checkpoint.sectionDeadline) : 0);
  const [questionStartedAt, setQuestionStartedAt] = useState(() => checkpointQuestionStart(checkpoint));
  const [completed, setCompleted] = useState(null);
  const timeoutRef = useRef(null);
  const questionCardRef = useRef(null);

  const saveCheckpoint = (next) => {
    setRun(next);
    onCheckpoint(next);
  };

  const finishSimulation = (simulation, answers) => {
    const results = simulationResults(simulation, answers);
    setCompleted({ simulation, answers, results });
    setRun(null);
    onCheckpoint(null);
    onComplete({
      id: simulation.id,
      formatId: simulation.formatId,
      timingProfile: simulation.timingProfile,
      completedAt: new Date().toISOString(),
      answers,
      results,
    });
  };

  const advanceAfterAnswers = (current, answers) => {
    const section = current.simulation.sections[current.sectionIndex];
    if (current.questionIndex < section.questions.length - 1) {
      const next = { ...current, questionIndex: current.questionIndex + 1, answers, savedAt: new Date().toISOString() };
      setSelected(null);
      setQuestionStartedAt(Date.now());
      saveCheckpoint(next);
      return;
    }
    if (current.sectionIndex < current.simulation.sections.length - 1) {
      const nextSectionIndex = current.sectionIndex + 1;
      const nextSection = current.simulation.sections[nextSectionIndex];
      const now = Date.now();
      const next = { ...current, sectionIndex: nextSectionIndex, questionIndex: 0, answers, sectionStartedAt: now, sectionDeadline: sectionDeadline(nextSection, now), savedAt: new Date(now).toISOString() };
      setSelected(null);
      setRemaining(nextSection.seconds || 0);
      setQuestionStartedAt(now);
      saveCheckpoint(next);
      return;
    }
    finishSimulation(current.simulation, answers);
  };

  const submitAnswer = () => {
    if (!run || selected === null) return;
    const section = run.simulation.sections[run.sectionIndex];
    const question = section.questions[run.questionIndex];
    const seconds = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));
    advanceAfterAnswers(run, [...run.answers, createSimulationAnswer(question, selected, seconds)]);
  };

  const expireSection = () => {
    if (!run) return;
    const section = run.simulation.sections[run.sectionIndex];
    const unanswered = section.questions.slice(run.questionIndex).map((question) => createSimulationAnswer(question, -1, Math.max(1, Math.round(section.seconds / section.questions.length))));
    const answers = [...run.answers, ...unanswered];
    if (run.sectionIndex < run.simulation.sections.length - 1) {
      const nextSectionIndex = run.sectionIndex + 1;
      const nextSection = run.simulation.sections[nextSectionIndex];
      const now = Date.now();
      setSelected(null);
      setRemaining(nextSection.seconds || 0);
      setQuestionStartedAt(now);
      saveCheckpoint({ ...run, sectionIndex: nextSectionIndex, questionIndex: 0, answers, sectionStartedAt: now, sectionDeadline: sectionDeadline(nextSection, now), savedAt: new Date(now).toISOString() });
    } else {
      finishSimulation(run.simulation, answers);
    }
  };
  timeoutRef.current = expireSection;
  const activeSectionDeadline = run?.sectionDeadline;
  const activeSectionIndex = run?.sectionIndex;
  const activeQuestionIndex = run?.questionIndex;

  useEffect(() => {
    if (run) questionCardRef.current?.focus();
  }, [activeQuestionIndex, activeSectionIndex, run]);

  useEffect(() => {
    if (!activeSectionDeadline) return undefined;
    let expired = false;
    const tick = () => {
      const next = remainingSimulationSeconds(activeSectionDeadline);
      setRemaining(next);
      if (next === 0 && !expired) {
        expired = true;
        window.setTimeout(() => timeoutRef.current?.(), 0);
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [activeSectionDeadline]);

  const startSimulation = () => {
    const simulation = assembleSimulation({ formatId, includeSituational, timingProfileId, seed: Date.now(), selectionContext });
    const next = createSimulationCheckpoint(simulation);
    setCompleted(null);
    setSelected(null);
    setQuestionStartedAt(Date.now());
    setRemaining(next.simulation.sections[0].seconds || 0);
    saveCheckpoint(next);
  };

  if (completed) return <SimulationReview completed={completed} onExit={onExit} onRestart={() => setCompleted(null)} onPractice={onPractice} />;

  if (run) {
    const section = run.simulation.sections[run.sectionIndex];
    const question = section.questions[run.questionIndex];
    const completedBeforeSection = run.simulation.sections.slice(0, run.sectionIndex).reduce((sum, item) => sum + item.questions.length, 0);
    const totalQuestions = run.simulation.sections.reduce((sum, item) => sum + item.questions.length, 0);
    const progress = (completedBeforeSection + run.questionIndex) / totalQuestions * 100;
    const category = assessmentCategories.find((item) => item.id === question.category);
    return (
      <main className="ga-main ga-practice-runner ga-simulation-runner">
        <section className="ga-session-topbar">
          <button type="button" onClick={onExit}>← Save & exit</button>
          <div><span>{section.label}</span><small>Section {run.sectionIndex + 1} of {run.simulation.sections.length} · {category?.label}</small></div>
          {section.seconds === null ? <div className="ga-timer is-untimed" aria-label="Untimed rehearsal"><span>SECTION</span><strong>UNTIMED</strong></div> : <div className={`ga-timer ${remaining <= 60 ? "is-urgent" : ""}`} role="timer" aria-label={`${remaining} seconds remaining in ${section.label}`}><span>SECTION</span><strong>{formatClock(remaining)}</strong><span className="ga-sr-only" aria-live="polite">{remaining === 60 ? "One minute remaining in this section" : remaining === 15 ? "Fifteen seconds remaining in this section" : remaining === 0 ? "Section time expired" : ""}</span></div>}
        </section>
        <div className="ga-progress-track" role="progressbar" aria-label="Simulation progress" aria-valuemin="0" aria-valuemax={totalQuestions} aria-valuenow={completedBeforeSection + run.questionIndex} aria-valuetext={`Question ${completedBeforeSection + run.questionIndex + 1} of ${totalQuestions}`}><i style={{ width: `${progress}%` }} /></div>
        <section className="ga-question-card" ref={questionCardRef} tabIndex={-1} aria-labelledby="ga-simulation-question">
          <div className="ga-question-meta"><span>QUESTION {String(completedBeforeSection + run.questionIndex + 1).padStart(2, "0")}</span><small>{question.difficulty} · {question.topic?.replace("-", " ")}</small></div>
          <div id="ga-simulation-question"><QuestionBody question={question} /></div>
          <div className={`ga-answer-grid ${question.category === "logical" ? "is-pattern" : ""}`} role="group" aria-label={`Answer choices for simulation question ${completedBeforeSection + run.questionIndex + 1}`}>
            {question.options.map((option, index) => <SimulationOption key={answerLabels[index]} question={question} option={option} index={index} selected={selected === index} onSelect={setSelected} />)}
          </div>
          <aside className="ga-simulation-silence"><strong>REVIEW LOCKED</strong><p>Answers and rationales remain hidden until the assessment is submitted.</p></aside>
          <footer><span>{run.questionIndex + 1} / {section.questions.length}</span><small>{section.label}</small><button type="button" className="ga-button ga-button-primary" onClick={submitAnswer} disabled={selected === null}>{run.questionIndex === section.questions.length - 1 ? (run.sectionIndex === run.simulation.sections.length - 1 ? "Submit assessment" : "Finish section") : "Next question"} →</button></footer>
        </section>
      </main>
    );
  }

  const selectedFormat = simulationFormats.find((format) => format.id === formatId);
  const selectedSections = selectedFormat.sections.filter((section) => !section.optional || includeSituational);
  const selectedCount = selectedSections.reduce((sum, section) => sum + section.allocations.reduce((count, allocation) => count + allocation.count, 0), 0);
  const selectedSeconds = timingProfileId === "untimed" ? null : selectedSections.reduce((sum, section) => sum + adjustedSeconds(section.seconds, timingProfileId), 0);
  const selectedMinutes = selectedSeconds === null ? null : Math.ceil(selectedSeconds / 60);
  return (
    <main className="ga-main ga-simulation-setup">
      <section className="ga-page-title"><p className="ga-kicker">ASSESSMENT SIMULATOR</p><h1>Practise the whole assessment rhythm.</h1><p>Move through timed sections without live feedback, then review every decision at the end. Results are educational practice signals only.</p></section>
      <section className="ga-simulation-format-grid" aria-label="Simulation formats">
        {simulationFormats.map((format) => <button type="button" key={format.id} className={formatId === format.id ? "is-selected" : ""} aria-pressed={formatId === format.id} onClick={() => setFormatId(format.id)}><span>{format.id === "quick" ? "12" : format.id === "standard" ? "27" : "32"}</span><strong>{format.label}</strong><small>{format.description}</small><i>{format.approximateMinutes} MIN</i></button>)}
      </section>
      {formatId === "full" && <label className="ga-simulation-toggle"><input type="checkbox" checked={includeSituational} onChange={(event) => setIncludeSituational(event.target.checked)} /><span><strong>Include situational judgement</strong><small>Add an educational ranking section with trade-off rationales available after submission.</small></span></label>}
      <section className="ga-panel ga-simulation-timing">
        <div className="ga-panel-heading"><div><span>PACE PROFILE</span><h2>Choose a fair practice condition</h2></div><small>ADJUSTABLE</small></div>
        <div className="ga-choice-row ga-timing-choice">{timingProfiles.map((profile) => <button type="button" key={profile.id} className={timingProfileId === profile.id ? "is-selected" : ""} aria-pressed={timingProfileId === profile.id} onClick={() => setTimingProfileId(profile.id)}><strong>{profile.label}</strong><small>{profile.description}</small></button>)}</div>
      </section>
      <section className="ga-panel ga-simulation-outline">
        <div className="ga-panel-heading"><div><span>ASSESSMENT PLAN</span><h2>{selectedCount} questions · {selectedMinutes === null ? "untimed rehearsal" : `${selectedMinutes} minutes`}</h2></div><small>{selectedMinutes === null ? "SELF-PACED" : "SECTION TIMERS"}</small></div>
        <ol>{selectedSections.map((section, index) => { const seconds = adjustedSeconds(section.seconds, timingProfileId); return <li key={section.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{section.label}</strong><small>{section.allocations.reduce((sum, allocation) => sum + allocation.count, 0)} questions · {seconds === null ? "no automatic timeout" : `${Math.round(seconds / 60)} minutes`}</small></div></li>; })}</ol>
      </section>
      <section className="ga-simulation-preflight" aria-labelledby="ga-preflight-title"><div><span>BEFORE YOU START</span><h2 id="ga-preflight-title">Know the rules before the clock begins.</h2></div><ul><li>Each submitted answer is final until end-of-assessment review.</li><li>Feedback stays hidden so the next question is not influenced.</li><li>Progress is checkpointed locally after every submitted answer.</li><li>Leaving and returning resumes the active section from its original deadline.</li></ul></section>
      <section className="ga-launch-bar"><div><span>NO LIVE FEEDBACK</span><strong>Your progress is checkpointed locally after each submitted answer.</strong></div><button type="button" className="ga-button ga-button-primary" onClick={startSimulation}>Begin simulation →</button></section>
    </main>
  );
}
