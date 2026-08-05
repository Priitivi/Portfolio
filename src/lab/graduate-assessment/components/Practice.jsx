import { useEffect, useRef, useState } from "react";
import { assessmentCategories } from "../data/packs.js";
import {
  answerLabels,
  availableQuestionCounts,
  createPracticeSession,
  describePattern,
  difficultySettings,
  isCorrectAnswer,
  questionRationale,
} from "../engine/questions.js";

function formatClock(seconds) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function QuestionContext({ context }) {
  if (!context) return null;
  if (context.type === "table") {
    return (
      <figure className="ga-data-card">
        <figcaption>{context.title}</figcaption>
        <table>
          <thead><tr>{context.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{context.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index ? <td key={`${row[0]}-${index}`}>{cell}</td> : <th key={cell}>{cell}</th>)}</tr>)}</tbody>
        </table>
      </figure>
    );
  }
  if (context.type === "bars") {
    const max = Math.max(...context.values.map((item) => item.value));
    return (
      <figure className="ga-data-card ga-bar-card">
        <figcaption>{context.title}</figcaption>
        <div className="ga-bars">{context.values.map((item) => <div key={item.label}><span><i style={{ height: `${(item.value / max) * 100}%` }} /></span><strong>{item.value}</strong><small>{item.label}</small></div>)}</div>
      </figure>
    );
  }
  return null;
}

function PatternGlyph({ pattern, label = "Pattern tile" }) {
  const count = Math.max(1, Math.min(pattern.count || 1, 4));
  const positions = count === 1 ? [[50, 50]] : count === 2 ? [[34, 50], [66, 50]] : count === 3 ? [[50, 28], [33, 67], [67, 67]] : [[33, 33], [67, 33], [33, 67], [67, 67]];
  const shape = (x, y, index) => {
    const common = { fill: pattern.filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: 4, vectorEffect: "non-scaling-stroke" };
    if (pattern.shape === "circle") return <circle key={index} cx={x} cy={y} r="10" {...common} />;
    if (pattern.shape === "triangle") return <path key={index} d={`M ${x} ${y - 12} L ${x + 12} ${y + 10} L ${x - 12} ${y + 10} Z`} {...common} />;
    if (pattern.shape === "diamond") return <rect key={index} x={x - 9} y={y - 9} width="18" height="18" transform={`rotate(45 ${x} ${y})`} {...common} />;
    return <rect key={index} x={x - 10} y={y - 10} width="20" height="20" {...common} />;
  };
  const markerPositions = [[18, 18], [82, 18], [82, 82], [18, 82]];
  const marker = markerPositions[pattern.accent || 0];
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={`${label}: ${describePattern(pattern)}`}>
      <g transform={`rotate(${pattern.rotation || 0} 50 50)`}>{positions.map(([x, y], index) => shape(x, y, index))}</g>
      {pattern.accent !== undefined && <circle cx={marker[0]} cy={marker[1]} r="5" className="ga-pattern-accent" />}
    </svg>
  );
}

function LogicalSequence({ question }) {
  return (
    <div className="ga-pattern-sequence" aria-label="Visual pattern sequence">
      {question.sequence.map((pattern, index) => <span key={`${question.id}-${index}`}><PatternGlyph pattern={pattern} label={`Sequence tile ${index + 1}`} /></span>)}
      <span className="ga-pattern-missing" aria-label="Missing tile">?</span>
    </div>
  );
}

function QuestionBody({ question }) {
  return (
    <>
      {question.passage && <blockquote className="ga-passage"><span>PASSAGE</span>{question.passage}</blockquote>}
      {question.scenario && <blockquote className="ga-passage ga-scenario"><span>{question.competency}</span>{question.scenario}</blockquote>}
      <QuestionContext context={question.context} />
      {question.category === "logical" && <LogicalSequence question={question} />}
      <p className="ga-question-prompt">{question.statement || question.prompt}</p>
    </>
  );
}

function AnswerOption({ question, option, index, selected, answered, onSelect }) {
  const correct = index === question.answer;
  const stateClass = answered ? correct ? "is-correct" : selected ? "is-wrong" : "" : selected ? "is-selected" : "";
  return (
    <button type="button" className={`ga-answer-option ${stateClass}`} onClick={() => onSelect(index)} disabled={answered} aria-pressed={selected}>
      <span>{answerLabels[index]}</span>
      {question.category === "logical" ? <PatternGlyph pattern={question.options[index]} label={`Answer ${answerLabels[index]}`} /> : <strong>{option}</strong>}
      {answered && correct && <b aria-label={question.category === "situational" ? "Strongest modelled response" : "Correct answer"}>✓</b>}
      {answered && selected && !correct && <b aria-label={question.category === "situational" ? "Alternative response selected" : "Incorrect answer"}>×</b>}
    </button>
  );
}

function PracticeRunner({ category, difficulty, questionCount, onComplete, onExit, onRestart }) {
  const [questions] = useState(() => createPracticeSession({ category, difficulty, count: questionCount }));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(difficultySettings[difficulty].seconds);
  const [answers, setAnswers] = useState([]);
  const [phase, setPhase] = useState("questions");
  const [reviewIndex, setReviewIndex] = useState(0);
  const completedRef = useRef(false);
  const timeoutRef = useRef(null);
  const question = questions[index];
  const elapsed = difficultySettings[difficulty].seconds - secondsLeft;

  const answerQuestion = (optionIndex, timedOut = false) => {
    if (answered) return;
    setSelected(optionIndex);
    setAnswered(true);
    setAnswers((current) => [...current, {
      questionId: question.id,
      topic: question.topic,
      selected: optionIndex,
      correct: isCorrectAnswer(question, optionIndex),
      seconds: Math.max(1, timedOut ? difficultySettings[difficulty].seconds : elapsed),
    }]);
  };
  timeoutRef.current = () => answerQuestion(-1, true);

  useEffect(() => {
    if (answered || phase !== "questions") return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          window.setTimeout(() => timeoutRef.current?.(), 0);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [answered, index, phase]);

  const nextQuestion = () => {
    if (!answered) return;
    if (index < questions.length - 1) {
      setIndex((current) => current + 1);
      setSelected(null);
      setAnswered(false);
      setSecondsLeft(difficultySettings[difficulty].seconds);
      return;
    }
    if (completedRef.current) return;
    completedRef.current = true;
    const session = {
      id: globalThis.crypto?.randomUUID?.() || `practice-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      category,
      difficulty,
      completedAt: new Date().toISOString(),
      answers,
    };
    onComplete(session);
    setPhase("results");
  };

  if (phase === "results") {
    const correct = answers.filter((item) => item.correct).length;
    const accuracy = Math.round((correct / answers.length) * 100);
    const average = Math.round(answers.reduce((sum, item) => sum + item.seconds, 0) / answers.length);
    const reviewQuestion = questions[reviewIndex];
    const reviewAnswer = answers[reviewIndex];
    return (
      <main className="ga-main ga-results">
        <section className="ga-result-hero">
          <p className="ga-kicker">SESSION COMPLETE</p>
          <h1>{accuracy >= 80 ? "Strong signal." : accuracy >= 55 ? "Useful baseline." : "Foundations first."}</h1>
          <p>{correct} of {answers.length} correct in {difficultySettings[difficulty].label} {category} practice.</p>
          <div className="ga-result-stats"><div><span>{category === "situational" ? "MODEL ALIGNMENT" : "ACCURACY"}</span><strong>{accuracy}%</strong></div><div><span>AVG. RESPONSE</span><strong>{average}s</strong></div><div><span>{category === "situational" ? "STRONGEST" : "CORRECT"}</span><strong>{correct}/{answers.length}</strong></div></div>
          <div className="ga-result-actions"><button type="button" className="ga-button ga-button-primary" onClick={onExit}>Return to dashboard</button><button type="button" className="ga-button ga-button-ghost" onClick={onRestart}>Run another set</button></div>
        </section>
        <section className="ga-review-panel">
          <div className="ga-panel-heading"><div><span>REVIEW MODE</span><h2>Question {reviewIndex + 1} of {questions.length}</h2></div><div className="ga-review-nav"><button type="button" onClick={() => setReviewIndex((current) => Math.max(0, current - 1))} disabled={reviewIndex === 0}>←</button><button type="button" onClick={() => setReviewIndex((current) => Math.min(questions.length - 1, current + 1))} disabled={reviewIndex === questions.length - 1}>→</button></div></div>
          <QuestionBody question={reviewQuestion} />
          <div className="ga-review-answer"><span className={reviewAnswer.correct ? "is-correct" : "is-wrong"}>{reviewAnswer.correct ? (category === "situational" ? "STRONGEST MODELLED RESPONSE" : "CORRECT") : "REVIEW"}</span><p>{questionRationale(reviewQuestion, reviewAnswer.selected)}</p><small>{category === "situational" ? "Strongest modelled response" : "Correct answer"}: {answerLabels[reviewQuestion.answer]} · Your answer: {reviewAnswer.selected >= 0 ? answerLabels[reviewAnswer.selected] : "Timed out"}</small></div>
        </section>
      </main>
    );
  }

  return (
    <main className="ga-main ga-practice-runner">
      <section className="ga-session-topbar">
        <button type="button" onClick={onExit}>← Exit session</button>
        <div><span>{assessmentCategories.find((item) => item.id === category)?.label}</span><small>{difficultySettings[difficulty].label}</small></div>
        <div className={`ga-timer ${secondsLeft <= 15 ? "is-urgent" : ""}`} role="timer" aria-label={`${secondsLeft} seconds remaining`}><span>TIME</span><strong>{formatClock(secondsLeft)}</strong><span className="ga-sr-only" aria-live="polite">{secondsLeft === 15 ? "Fifteen seconds remaining" : secondsLeft === 0 ? "Time expired" : ""}</span></div>
      </section>
      <div className="ga-progress-track" aria-label={`Question ${index + 1} of ${questions.length}`}><i style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div>
      <section className="ga-question-card">
        <div className="ga-question-meta"><span>QUESTION {String(index + 1).padStart(2, "0")}</span><small>{question.topic?.replace("-", " ")}</small></div>
        <QuestionBody question={question} />
        <div className={`ga-answer-grid ${question.category === "logical" ? "is-pattern" : ""}`}>
          {question.options.map((option, optionIndex) => <AnswerOption key={answerLabels[optionIndex]} question={question} option={option} index={optionIndex} selected={selected === optionIndex} answered={answered} onSelect={answerQuestion} />)}
        </div>
        {answered && (
          <div className={`ga-inline-feedback ${isCorrectAnswer(question, selected) ? "is-correct" : "is-review"}`} role="status">
            <span>{isCorrectAnswer(question, selected) ? (question.category === "situational" ? "STRONGEST MODELLED RESPONSE" : "CORRECT") : selected === -1 ? "TIME" : (question.category === "situational" ? "COMPARE THE TRADE-OFFS" : "REVIEW THE RULE")}</span>
            <div>
              <p>{questionRationale(question, selected)}</p>
              {question.category === "situational" && <ul>{question.optionDetails.map((option, optionIndex) => <li key={option.text}><strong>{answerLabels[optionIndex]}</strong>{option.rationale}</li>)}</ul>}
            </div>
          </div>
        )}
        <footer><span>{index + 1} / {questions.length}</span><small>{answered ? "Explanation unlocked" : "Choose the best-supported answer"}</small><button type="button" className="ga-button ga-button-primary" onClick={nextQuestion} disabled={!answered}>{index === questions.length - 1 ? "Finish session" : "Next question"} →</button></footer>
      </section>
    </main>
  );
}

export default function Practice({ initialCategory = "numerical", onComplete, onExit }) {
  const available = assessmentCategories.filter((item) => item.id !== "interview");
  const safeInitial = available.some((item) => item.id === initialCategory) ? initialCategory : "numerical";
  const [category, setCategory] = useState(safeInitial);
  const [difficulty, setDifficulty] = useState("standard");
  const [questionCount, setQuestionCount] = useState(() => availableQuestionCounts(safeInitial, "standard").at(-1) || 2);
  const [running, setRunning] = useState(false);
  const countOptions = availableQuestionCounts(category, difficulty);

  const chooseCategory = (nextCategory) => {
    setCategory(nextCategory);
    setQuestionCount(availableQuestionCounts(nextCategory, difficulty).at(-1) || 2);
  };

  const chooseDifficulty = (nextDifficulty) => {
    setDifficulty(nextDifficulty);
    setQuestionCount(availableQuestionCounts(category, nextDifficulty).at(-1) || 2);
  };

  if (running) return <PracticeRunner category={category} difficulty={difficulty} questionCount={questionCount} onComplete={onComplete} onExit={onExit} onRestart={() => setRunning(false)} />;

  return (
    <main className="ga-main ga-practice-setup">
      <section className="ga-page-title"><p className="ga-kicker">PRACTICE ENGINE</p><h1>Choose your training signal.</h1><p>Each session uses original questions and a clear evidence trail. Accuracy matters; understanding the rule matters more.</p></section>
      <section className="ga-setup-block">
        <div className="ga-setup-label"><span>01</span><div><h2>Assessment category</h2><p>Select one skill for focused practice.</p></div></div>
        <div className="ga-mode-grid">
          {available.map((item) => <button type="button" key={item.id} className={category === item.id ? "is-selected" : ""} onClick={() => chooseCategory(item.id)}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.description}</small><i>{item.short}</i></button>)}
        </div>
      </section>
      <section className="ga-setup-block">
        <div className="ga-setup-label"><span>02</span><div><h2>Difficulty</h2><p>Difficulty adjusts complexity and time pressure.</p></div></div>
        <div className="ga-choice-row">
          {Object.entries(difficultySettings).map(([id, setting]) => <button type="button" key={id} className={difficulty === id ? "is-selected" : ""} onClick={() => chooseDifficulty(id)}><strong>{setting.label}</strong><small>{setting.seconds}s per question</small></button>)}
        </div>
      </section>
      <section className="ga-setup-block ga-session-size">
        <div className="ga-setup-label"><span>03</span><div><h2>Session length</h2><p>Short enough to repeat. Long enough to learn.</p></div></div>
        <div className="ga-choice-row">
          {countOptions.map((count) => <button type="button" key={count} className={questionCount === count ? "is-selected" : ""} onClick={() => setQuestionCount(count)}><strong>{count} questions</strong><small>~{Math.ceil(count * difficultySettings[difficulty].seconds / 60)} minutes</small></button>)}
        </div>
      </section>
      <section className="ga-launch-bar"><div><span>READY</span><strong>{assessmentCategories.find((item) => item.id === category)?.label} · {difficultySettings[difficulty].label} · {questionCount} questions</strong></div><button type="button" className="ga-button ga-button-primary" onClick={() => setRunning(true)}>Launch practice <span aria-hidden="true">→</span></button></section>
    </main>
  );
}
