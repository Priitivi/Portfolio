import { useEffect, useRef, useState } from "react";
import { assessmentCategories } from "../data/catalog.js";
import {
  answerLabels,
  availableQuestionCounts,
  createPracticeSession,
  difficultySettings,
  isCorrectAnswer,
} from "../engine/questions.js";
import { learningSignal, sessionLearningSummary } from "../engine/learning.js";
import { adjustedSeconds, timingDescription, timingProfiles } from "../engine/timing.js";
import AnswerExplanation from "./AnswerExplanation.jsx";
import { PatternGlyph, QuestionBody } from "./QuestionContent.jsx";
import ReviewNavigator from "./ReviewNavigator.jsx";

function formatClock(seconds) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
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

function PracticeRunner({ category, difficulty, questionCount, timingProfileId, focusTopic, selectionContext, onComplete, onExit, onRestart }) {
  const allocatedSeconds = adjustedSeconds(difficultySettings[difficulty].seconds, timingProfileId);
  const [questions] = useState(() => createPracticeSession({ category, difficulty, count: questionCount, selectionContext: { ...selectionContext, focusTopics: focusTopic ? [focusTopic] : [] } }));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(allocatedSeconds);
  const [answers, setAnswers] = useState([]);
  const [phase, setPhase] = useState("questions");
  const [reviewIndex, setReviewIndex] = useState(0);
  const completedRef = useRef(false);
  const timeoutRef = useRef(null);
  const questionCardRef = useRef(null);
  const reviewPanelRef = useRef(null);
  const questionStartedAtRef = useRef(Date.now());
  const question = questions[index];
  const currentAnswer = answers[index];
  const currentLearning = answered && currentAnswer ? learningSignal(question, currentAnswer, timingProfileId) : null;

  useEffect(() => {
    if (phase === "questions") questionCardRef.current?.focus();
    if (phase === "results") reviewPanelRef.current?.focus();
  }, [index, phase, reviewIndex]);

  const answerQuestion = (optionIndex, timedOut = false) => {
    if (answered) return;
    const responseSeconds = timedOut && allocatedSeconds !== null
      ? allocatedSeconds
      : Math.max(1, Math.round((Date.now() - questionStartedAtRef.current) / 1000));
    setSelected(optionIndex);
    setAnswered(true);
    setAnswers((current) => [...current, {
      questionId: question.id,
      topic: question.topic,
      selected: optionIndex,
      correct: isCorrectAnswer(question, optionIndex),
      seconds: responseSeconds,
      ...(question.passageId ? { passageId: question.passageId } : {}),
      ...(question.templateId ? { templateId: question.templateId } : {}),
    }]);
  };
  timeoutRef.current = () => answerQuestion(-1, true);

  useEffect(() => {
    if (answered || phase !== "questions" || allocatedSeconds === null) return undefined;
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
  }, [allocatedSeconds, answered, index, phase]);

  const nextQuestion = () => {
    if (!answered) return;
    if (index < questions.length - 1) {
      setIndex((current) => current + 1);
      setSelected(null);
      setAnswered(false);
      setSecondsLeft(allocatedSeconds);
      questionStartedAtRef.current = Date.now();
      return;
    }
    if (completedRef.current) return;
    completedRef.current = true;
    const session = {
      id: globalThis.crypto?.randomUUID?.() || `practice-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      category,
      difficulty,
      timingProfile: timingProfileId,
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
    const reviewLearning = learningSignal(reviewQuestion, reviewAnswer, timingProfileId);
    const learningSummary = sessionLearningSummary(questions, answers, timingProfileId);
    return (
      <main className="ga-main ga-results">
        <section className="ga-result-hero">
          <p className="ga-kicker">SESSION COMPLETE</p>
          <h1>{accuracy >= 80 ? "Strong signal." : accuracy >= 55 ? "Useful baseline." : "Foundations first."}</h1>
          <p>{correct} of {answers.length} correct in {difficultySettings[difficulty].label} {category} practice.</p>
          <div className="ga-result-stats"><div><span>{category === "situational" ? "MODEL ALIGNMENT" : "ACCURACY"}</span><strong>{accuracy}%</strong></div><div><span>AVG. RESPONSE</span><strong>{average}s</strong></div><div><span>{timingProfileId === "untimed" ? "FOCUS TOPIC" : "CORRECT ON PACE"}</span><strong>{timingProfileId === "untimed" ? (learningSummary.focusTopic?.replaceAll("-", " ") || "—") : `${learningSummary.correctOnPace}/${answers.length}`}</strong></div></div>
          {learningSummary.timedOut > 0 && <p className="ga-result-note">{learningSummary.timedOut} question{learningSummary.timedOut === 1 ? "" : "s"} reached the time limit. Rehearse the method untimed before restoring pace.</p>}
          <div className="ga-result-actions"><button type="button" className="ga-button ga-button-primary" onClick={onExit}>Return to dashboard</button><button type="button" className="ga-button ga-button-ghost" onClick={onRestart}>Run another set</button></div>
        </section>
        <section className="ga-review-panel" ref={reviewPanelRef} tabIndex={-1} aria-labelledby="ga-practice-review-title">
          <div className="ga-panel-heading"><div><span>REVIEW MODE</span><h2 id="ga-practice-review-title">Question {reviewIndex + 1} of {questions.length}</h2></div><div className="ga-review-nav"><button type="button" aria-label="Previous review question" onClick={() => setReviewIndex((current) => Math.max(0, current - 1))} disabled={reviewIndex === 0}>←</button><button type="button" aria-label="Next review question" onClick={() => setReviewIndex((current) => Math.min(questions.length - 1, current + 1))} disabled={reviewIndex === questions.length - 1}>→</button></div></div>
          <ReviewNavigator answers={answers} current={reviewIndex} onSelect={setReviewIndex} />
          <QuestionBody question={reviewQuestion} />
          <div className="ga-review-answer"><span className={reviewAnswer.correct ? "is-correct" : "is-wrong"}>{reviewAnswer.correct ? (category === "situational" ? "STRONGEST MODELLED RESPONSE" : "CORRECT") : "REVIEW"}</span><AnswerExplanation question={reviewQuestion} selected={reviewAnswer.selected} />{category === "situational" && <ul>{reviewQuestion.optionDetails.map((option, optionIndex) => <li key={option.text}><strong>{answerLabels[optionIndex]}</strong><span>{option.rationale}</span></li>)}</ul>}<div className="ga-learning-signal"><strong>{reviewLearning.headline}</strong><p>{reviewLearning.strategy}</p><small>{reviewLearning.pace} {reviewLearning.nextStep}</small></div><small>{category === "situational" ? "Strongest modelled response" : "Correct answer"}: {answerLabels[reviewQuestion.answer]} · Your answer: {reviewAnswer.selected >= 0 ? answerLabels[reviewAnswer.selected] : "Timed out"}</small></div>
        </section>
      </main>
    );
  }

  return (
    <main className="ga-main ga-practice-runner">
      <section className="ga-session-topbar">
        <button type="button" onClick={onExit}>← Exit session</button>
        <div><span>{assessmentCategories.find((item) => item.id === category)?.label}</span><small>{difficultySettings[difficulty].label}</small></div>
        {secondsLeft === null ? <div className="ga-timer is-untimed" aria-label="Untimed learning mode"><span>PACE</span><strong>UNTIMED</strong></div> : <div className={`ga-timer ${secondsLeft <= 15 ? "is-urgent" : ""}`} role="timer" aria-label={`${secondsLeft} seconds remaining`}><span>TIME</span><strong>{formatClock(secondsLeft)}</strong><span className="ga-sr-only" aria-live="polite">{secondsLeft === 15 ? "Fifteen seconds remaining" : secondsLeft === 0 ? "Time expired" : ""}</span></div>}
      </section>
      <div className="ga-progress-track" role="progressbar" aria-label="Practice session progress" aria-valuemin="0" aria-valuemax={questions.length} aria-valuenow={index + (answered ? 1 : 0)} aria-valuetext={`Question ${index + 1} of ${questions.length}`}><i style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div>
      <section className="ga-question-card" ref={questionCardRef} tabIndex={-1} aria-labelledby="ga-practice-question">
        <div className="ga-question-meta"><span>QUESTION {String(index + 1).padStart(2, "0")}</span><small>{question.topic?.replace("-", " ")}</small></div>
        <div id="ga-practice-question"><QuestionBody question={question} /></div>
        <div className={`ga-answer-grid ${question.category === "logical" ? "is-pattern" : ""}`} role="group" aria-label={`Answer choices for question ${index + 1}`}>
          {question.options.map((option, optionIndex) => <AnswerOption key={answerLabels[optionIndex]} question={question} option={option} index={optionIndex} selected={selected === optionIndex} answered={answered} onSelect={answerQuestion} />)}
        </div>
        {answered && (
          <div className={`ga-inline-feedback ${isCorrectAnswer(question, selected) ? "is-correct" : "is-review"}`} role="status">
            <span>{isCorrectAnswer(question, selected) ? (question.category === "situational" ? "STRONGEST MODELLED RESPONSE" : "CORRECT") : selected === -1 ? "TIME" : (question.category === "situational" ? "COMPARE THE TRADE-OFFS" : "REVIEW THE RULE")}</span>
            <div>
              <AnswerExplanation question={question} selected={selected} />
              {question.category === "situational" && <ul>{question.optionDetails.map((option, optionIndex) => <li key={option.text}><strong>{answerLabels[optionIndex]}</strong>{option.rationale}</li>)}</ul>}
              {currentLearning && <div className="ga-learning-signal"><strong>{currentLearning.headline}</strong><p>{currentLearning.strategy}</p><small>{currentLearning.pace} {currentLearning.nextStep}</small></div>}
            </div>
          </div>
        )}
        <footer><span>{index + 1} / {questions.length}</span><small>{answered ? "Explanation unlocked" : "Choose the best-supported answer"}</small><button type="button" className="ga-button ga-button-primary" onClick={nextQuestion} disabled={!answered}>{index === questions.length - 1 ? "Finish session" : "Next question"} →</button></footer>
      </section>
    </main>
  );
}

export default function Practice({ initialConfig = { category: "numerical" }, selectionContext, onComplete, onExit }) {
  const available = assessmentCategories.filter((item) => item.id !== "interview");
  const safeInitial = available.some((item) => item.id === initialConfig.category) ? initialConfig.category : "numerical";
  const safeDifficulty = difficultySettings[initialConfig.difficulty] ? initialConfig.difficulty : "standard";
  const safeTiming = timingProfiles.some((profile) => profile.id === initialConfig.timingProfile) ? initialConfig.timingProfile : "standard";
  const initialCounts = availableQuestionCounts(safeInitial, safeDifficulty);
  const safeCount = initialCounts.includes(initialConfig.questionCount) ? initialConfig.questionCount : initialCounts.at(-1) || 2;
  const [category, setCategory] = useState(safeInitial);
  const [difficulty, setDifficulty] = useState(safeDifficulty);
  const [timingProfileId, setTimingProfileId] = useState(safeTiming);
  const [questionCount, setQuestionCount] = useState(safeCount);
  const [focusTopic, setFocusTopic] = useState(initialConfig.focusTopic || null);
  const [running, setRunning] = useState(false);
  const countOptions = availableQuestionCounts(category, difficulty);

  const chooseCategory = (nextCategory) => {
    setCategory(nextCategory);
    if (nextCategory !== category) setFocusTopic(null);
    setQuestionCount(availableQuestionCounts(nextCategory, difficulty).at(-1) || 2);
  };

  const chooseDifficulty = (nextDifficulty) => {
    setDifficulty(nextDifficulty);
    setQuestionCount(availableQuestionCounts(category, nextDifficulty).at(-1) || 2);
  };

  if (running) return <PracticeRunner category={category} difficulty={difficulty} questionCount={questionCount} timingProfileId={timingProfileId} focusTopic={focusTopic} selectionContext={selectionContext} onComplete={onComplete} onExit={onExit} onRestart={() => setRunning(false)} />;

  return (
    <main className="ga-main ga-practice-setup">
      <section className="ga-page-title"><p className="ga-kicker">PRACTICE ENGINE</p><h1>Choose your training signal.</h1><p>Each session uses original questions and a clear evidence trail. Accuracy matters; understanding the rule matters more.</p></section>
      {focusTopic && <section className="ga-adaptive-brief" aria-label="Adaptive practice focus"><span>ADAPTIVE FOCUS</span><div><strong>{focusTopic.replaceAll("-", " ")}</strong><p>This short set prioritises the topic identified by your local practice evidence. You can change any setting before launch.</p></div><button type="button" onClick={() => setFocusTopic(null)}>Clear focus</button></section>}
      <section className="ga-setup-block">
        <div className="ga-setup-label"><span>01</span><div><h2>Assessment category</h2><p>Select one skill for focused practice.</p></div></div>
        <div className="ga-mode-grid">
          {available.map((item) => <button type="button" key={item.id} className={category === item.id ? "is-selected" : ""} aria-pressed={category === item.id} onClick={() => chooseCategory(item.id)}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.description}</small><i>{item.short}</i></button>)}
        </div>
      </section>
      <section className="ga-setup-block">
        <div className="ga-setup-label"><span>02</span><div><h2>Difficulty</h2><p>Choose the complexity of the reasoning, independently of pace.</p></div></div>
        <div className="ga-choice-row">
          {Object.entries(difficultySettings).map(([id, setting]) => <button type="button" key={id} className={difficulty === id ? "is-selected" : ""} aria-pressed={difficulty === id} onClick={() => chooseDifficulty(id)}><strong>{setting.label}</strong><small>{id === "foundation" ? "Single-step rules" : id === "standard" ? "Combined evidence" : "Multi-step trade-offs"}</small></button>)}
        </div>
      </section>
      <section className="ga-setup-block ga-session-size">
        <div className="ga-setup-label"><span>03</span><div><h2>Session length</h2><p>Short enough to repeat. Long enough to learn.</p></div></div>
        <div className="ga-choice-row">
          {countOptions.map((count) => <button type="button" key={count} className={questionCount === count ? "is-selected" : ""} aria-pressed={questionCount === count} onClick={() => setQuestionCount(count)}><strong>{count} questions</strong><small>{timingProfileId === "untimed" ? "Self-paced" : `~${Math.ceil(count * adjustedSeconds(difficultySettings[difficulty].seconds, timingProfileId) / 60)} minutes`}</small></button>)}
        </div>
      </section>
      <section className="ga-setup-block">
        <div className="ga-setup-label"><span>04</span><div><h2>Practice pace</h2><p>Use time pressure only when it supports the skill you are practising.</p></div></div>
        <div className="ga-choice-row ga-timing-choice">
          {timingProfiles.map((profile) => <button type="button" key={profile.id} className={timingProfileId === profile.id ? "is-selected" : ""} aria-pressed={timingProfileId === profile.id} onClick={() => setTimingProfileId(profile.id)}><strong>{profile.label}</strong><small>{profile.id === "untimed" ? profile.description : timingDescription(profile.id, difficultySettings[difficulty].seconds)}</small></button>)}
        </div>
      </section>
      <section className="ga-launch-bar"><div><span>READY</span><strong>{assessmentCategories.find((item) => item.id === category)?.label} · {difficultySettings[difficulty].label} · {questionCount} questions · {timingProfiles.find((profile) => profile.id === timingProfileId)?.label}</strong></div><button type="button" className="ga-button ga-button-primary" onClick={() => setRunning(true)}>Launch practice <span aria-hidden="true">→</span></button></section>
    </main>
  );
}
