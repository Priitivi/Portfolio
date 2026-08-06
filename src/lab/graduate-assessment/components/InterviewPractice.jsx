import { useEffect, useRef, useState } from "react";
import { interviewQuestions } from "../data/packs.js";
import { analyseInterviewAnswer, remainingFromDeadline, selectInterviewQuestion } from "../engine/interview.js";
import { difficultySettings } from "../engine/questions.js";
import useSpeechInput from "../hooks/useSpeechInput.js";

function formatClock(seconds) {
  return `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0")}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;
}

function ScoreRing({ score }) {
  return <div className="ga-score-ring" role="img" aria-label={`Heuristic transcript score ${score} out of 100`} style={{ "--score": `${score * 3.6}deg` }}><span aria-hidden="true"><strong>{score}</strong><small>/100</small></span></div>;
}

function InterviewReview({ question, transcript, analysis, seconds, onAgain, onExit }) {
  return (
    <main className="ga-main ga-interview-review">
      <section className="ga-interview-score">
        <div><p className="ga-kicker">TRANSCRIPT ANALYSIS</p><h1>{analysis.total >= 75 ? "A clear evidence trail." : analysis.total >= 50 ? "Good material. Sharpen the shape." : "Build the evidence trail."}</h1><p>This text heuristic looks for visible structure and specificity. It is not a validated assessment and cannot evaluate delivery.</p></div>
        <ScoreRing score={analysis.total} />
      </section>
      <section className="ga-metric-grid">
        {Object.entries(analysis.metrics).map(([key, value]) => <article key={key}><span>{key === "star" ? "STAR text signals" : key === "clarity" ? "Text clarity" : key}</span><strong>{value}</strong><div><i style={{ width: `${value}%` }} /></div></article>)}
      </section>
      <div className="ga-interview-review-grid">
        <section className="ga-panel ga-transcript-panel">
          <div className="ga-panel-heading"><div><span>TRANSCRIPT REVIEW</span><h2>Your answer</h2></div><small>{analysis.wordCount} WORDS · {seconds}S</small></div>
          <blockquote>{question.question}</blockquote>
          <p>{transcript || "No answer was captured. Use the next attempt to speak or type a complete response."}</p>
        </section>
        <section className="ga-panel ga-feedback-panel">
          <div className="ga-panel-heading"><div><span>STRUCTURED FEEDBACK</span><h2>Evidence and suggestions</h2></div></div>
          <h3>Measured from this transcript</h3>
          <ul className="ga-observation-list">{analysis.observations.map((item) => <li key={item}>{item}</li>)}</ul>
          <h3>Heuristic suggestions</h3>
          <ol>{analysis.feedback.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ol>
          <div className="ga-star-check">
            {Object.entries(analysis.star).map(([key, present]) => <span key={key} className={present ? "is-present" : ""}><i>{present ? "✓" : "·"}</i>{key}</span>)}
          </div>
          <div className="ga-limitations"><strong>Not available from text</strong><p>{analysis.limitations.join(" ")}</p></div>
          <div className="ga-limitations"><strong>Optional follow-up prompts</strong><p>{question.followUps.join(" · ")}</p></div>
        </section>
      </div>
      <section className="ga-launch-bar"><div><span>KEEP THE LOOP TIGHT</span><strong>Repeat the answer or practise a new question while the feedback is fresh.</strong></div><div><button type="button" className="ga-button ga-button-ghost" onClick={onExit}>Dashboard</button><button type="button" className="ga-button ga-button-primary" onClick={onAgain}>New question →</button></div></section>
    </main>
  );
}

function InterviewRoom({ question, difficulty, prepSeconds, answerSeconds, untimed, onComplete, onExit, onAgain }) {
  const [phase, setPhase] = useState("prepare");
  const [remaining, setRemaining] = useState(prepSeconds);
  const [prepNotes, setPrepNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const phaseRef = useRef("prepare");
  const completedRef = useRef(false);
  const deadlineRef = useRef(Date.now() + prepSeconds * 1000);
  const answerStartedAtRef = useRef(0);
  const beginRef = useRef(null);
  const finishRef = useRef(null);
  const speech = useSpeechInput({ value: transcript, onChange: setTranscript });

  const beginAnswer = () => {
    if (phaseRef.current !== "prepare") return;
    speech.stop();
    phaseRef.current = "answer";
    answerStartedAtRef.current = Date.now();
    if (!untimed) deadlineRef.current = Date.now() + answerSeconds * 1000;
    setRemaining(untimed ? 0 : answerSeconds);
    setPhase("answer");
  };
  beginRef.current = beginAnswer;

  const finishAnswer = () => {
    if (phaseRef.current !== "answer" || completedRef.current) return;
    completedRef.current = true;
    phaseRef.current = "review";
    speech.stop();
    const result = analyseInterviewAnswer(transcript);
    const elapsed = Math.max(1, Math.round((Date.now() - answerStartedAtRef.current) / 1000));
    const seconds = untimed ? elapsed : Math.min(answerSeconds, elapsed);
    setElapsedSeconds(seconds);
    setAnalysis(result);
    setPhase("review");
    onComplete({
      id: globalThis.crypto?.randomUUID?.() || `interview-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      questionId: question.id,
      difficulty,
      question: question.question,
      score: result.total,
      seconds,
      completedAt: new Date().toISOString(),
    });
  };
  finishRef.current = finishAnswer;

  useEffect(() => {
    if (phase === "review" || untimed) return undefined;
    const timer = window.setInterval(() => {
      const next = remainingFromDeadline(deadlineRef.current);
      setRemaining(next);
      if (next === 0) {
        window.clearInterval(timer);
        if (phase === "prepare") beginRef.current?.();
        else finishRef.current?.();
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase, untimed]);

  if (phase === "review") return <InterviewReview question={question} transcript={transcript} analysis={analysis} seconds={elapsedSeconds} onAgain={onAgain} onExit={onExit} />;

  return (
    <main className="ga-main ga-interview-room">
      <section className="ga-interview-room-top">
        <button type="button" onClick={onExit}>← Exit interview</button>
        <span className={phase === "answer" ? "is-recording" : ""}><i />{phase === "prepare" ? "PREPARATION" : "ANSWER IN PROGRESS"}</span>
        {untimed ? <div aria-label="Untimed interview rehearsal"><small>PACE</small><strong>UNTIMED</strong></div> : <div role="timer" aria-label={`${remaining} seconds remaining`}><small>{phase === "prepare" ? "PREP" : "ANSWER"}</small><strong>{formatClock(remaining)}</strong><span className="ga-sr-only" aria-live="polite">{remaining === 15 ? "Fifteen seconds remaining" : remaining === 0 ? `${phase === "prepare" ? "Preparation" : "Answer"} time expired` : ""}</span></div>}
      </section>
      <section className="ga-interview-stage">
        <div className="ga-interviewer-tile" aria-hidden="true"><span>GA</span><i /><small>INTERVIEW SIMULATOR</small></div>
        <div className="ga-interview-question">
          <p className="ga-kicker">{question.competency.toUpperCase()} · {difficultySettings[difficulty].label.toUpperCase()}</p>
          <h1>{question.question}</h1>
          <div className="ga-probes"><span>{question.recommendedStructure}</span><small>{question.preparationCue}</small>{question.probes.map((probe) => <small key={probe}>{probe}</small>)}</div>
        </div>
      </section>
      {phase === "prepare" ? (
        <section className="ga-prep-note"><span>PREPARATION SPACE</span><textarea value={prepNotes} onChange={(event) => setPrepNotes(event.target.value)} placeholder="Jot down Situation · Task · Action · Result prompts. Preparation notes are not included in the scored transcript." aria-label="Interview preparation notes" /><button type="button" className="ga-button ga-button-primary" onClick={beginAnswer}>Start answer now →</button></section>
      ) : (
        <section className="ga-answer-capture">
          <div className="ga-capture-toolbar"><span><i className={speech.listening ? "is-live" : ""} />{speech.listening ? "Listening…" : "Transcript"}</span>{speech.supported ? <button type="button" onClick={speech.listening ? speech.stop : speech.start}>{speech.listening ? "Stop microphone" : "Use microphone"}</button> : <small>Speech input is unavailable—typing works fully.</small>}</div>
          <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Speak or type your answer here…" aria-label="Interview answer transcript" />
          {speech.interim && <p className="ga-interim" aria-live="polite">{speech.interim}</p>}
          {speech.error && <p className="ga-speech-error" role="status">{speech.error}</p>}
          <footer><small>Your transcript stays on this device.</small><button type="button" className="ga-button ga-button-primary" onClick={finishAnswer}>Finish & analyse →</button></footer>
        </section>
      )}
    </main>
  );
}

export default function InterviewPractice({ recentQuestionIds = [], onComplete, onExit }) {
  const [difficulty, setDifficulty] = useState("standard");
  const [prepSeconds, setPrepSeconds] = useState(30);
  const [answerSeconds, setAnswerSeconds] = useState(120);
  const [untimed, setUntimed] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [running, setRunning] = useState(false);
  const [question, setQuestion] = useState(null);
  const [usedQuestionIds, setUsedQuestionIds] = useState(() => recentQuestionIds.slice(-30));

  const chooseQuestion = () => {
    const next = selectInterviewQuestion(interviewQuestions, difficulty, usedQuestionIds);
    setQuestion(next);
    if (next) setUsedQuestionIds((current) => [...current, next.id].slice(-12));
    return next;
  };

  const startInterview = () => {
    if (!chooseQuestion()) return;
    setRunning(true);
  };

  const anotherQuestion = () => {
    if (!chooseQuestion()) return;
    setRunKey((current) => current + 1);
  };

  if (running && question) return <InterviewRoom key={runKey} question={question} difficulty={difficulty} prepSeconds={prepSeconds} answerSeconds={answerSeconds} untimed={untimed} onComplete={onComplete} onExit={onExit} onAgain={anotherQuestion} />;

  return (
    <main className="ga-main ga-interview-setup">
      <section className="ga-page-title"><p className="ga-kicker">MOCK INTERVIEW</p><h1>Turn experience into evidence.</h1><p>Practise one original question at a time, capture a transcript, then review structure, clarity, STAR coverage and completeness.</p></section>
      <div className="ga-interview-setup-grid">
        <section className="ga-panel">
          <div className="ga-setup-label"><span>01</span><div><h2>Question depth</h2><p>Choose how much ambiguity the prompt contains.</p></div></div>
          <div className="ga-choice-stack">{Object.entries(difficultySettings).map(([id, setting]) => <button type="button" key={id} className={difficulty === id ? "is-selected" : ""} aria-pressed={difficulty === id} onClick={() => setDifficulty(id)}><span><strong>{setting.label}</strong><small>{id === "foundation" ? "Direct competency prompt" : id === "standard" ? "Behaviour plus reflection" : "Ambiguity and trade-offs"}</small></span><i>{difficulty === id ? "✓" : ""}</i></button>)}</div>
        </section>
        <section className="ga-panel">
          <div className="ga-setup-label"><span>02</span><div><h2>Timing</h2><p>Replicate the preparation and recording window you expect.</p></div></div>
          <label className="ga-range-control"><span><strong>Preparation</strong><b>{untimed ? "Manual" : `${prepSeconds}s`}</b></span><input type="range" min="15" max="60" step="15" value={prepSeconds} disabled={untimed} onChange={(event) => setPrepSeconds(Number(event.target.value))} /></label>
          <label className="ga-range-control"><span><strong>Answer window</strong><b>{untimed ? "Manual" : `${answerSeconds / 60} min`}</b></span><input type="range" min="60" max="180" step="30" value={answerSeconds} disabled={untimed} onChange={(event) => setAnswerSeconds(Number(event.target.value))} /></label>
          <label className="ga-simulation-toggle ga-interview-untimed"><input type="checkbox" checked={untimed} onChange={(event) => setUntimed(event.target.checked)} /><span><strong>Untimed rehearsal</strong><small>Advance preparation and finish the answer manually. Use this while building structure before adding pressure.</small></span></label>
          <div className="ga-privacy-note"><span>LOCAL ONLY</span><p>Speech recognition is optional and browser-provided. No recording or transcript is uploaded by this Lab.</p></div>
        </section>
      </div>
      <section className="ga-launch-bar"><div><span>QUESTION BANK</span><strong>{interviewQuestions.length} original prompts · {difficultySettings[difficulty].label} selected</strong></div><button type="button" className="ga-button ga-button-primary" onClick={startInterview}>Enter interview room →</button></section>
    </main>
  );
}
