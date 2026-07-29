import { useEffect, useRef, useState } from "react";
import { mockProgress } from "../utils/questionProgression.js";

export default function MockInterviewScreen({ mock, onSubmit, onEnd, onDraftChange, onPreparation }) {
  const [error, setError] = useState("");
  const textareaRef = useRef(null);
  const answer = mock.draft || "";
  const question = mock.queue[mock.currentIndex];
  const progress = mockProgress(mock);
  const progressPercent = Math.round((progress.completed / progress.total) * 100);

  useEffect(() => {
    setError("");
    textareaRef.current?.focus();
  }, [mock.currentIndex]);

  const submit = (event) => {
    event.preventDefault();
    if (!answer.trim()) {
      setError("Add an answer before continuing, or end the interview to review what you have.");
      textareaRef.current?.focus();
      return;
    }
    onSubmit(answer);
  };

  if (!question) return null;

  return (
    <main className="ic-main ic-session-layout">
      <section className="ic-session-stage" aria-labelledby="mock-title">
        <div className="ic-session-kicker">
          <span>MOCK INTERVIEW</span>
          <span>{progress.completed} of {progress.total} focus areas explored</span>
        </div>
        <div className="ic-progress-track" aria-label={`${progressPercent}% of focus areas complete`}>
          <i style={{ width: `${progressPercent}%` }} />
        </div>

        <article className="ic-question-card">
          <div className="ic-question-meta">
            <span>{question.kind === "follow-up" ? "FOLLOW-UP" : `QUESTION ${String(progress.completed + 1).padStart(2, "0")}`}</span>
            <strong>{question.competency}</strong>
          </div>
          <h1 id="mock-title">{question.prompt}</h1>
          <form onSubmit={submit}>
            <label htmlFor="mock-answer">Your answer</label>
            <textarea
              ref={textareaRef}
              id="mock-answer"
              value={answer}
              onChange={(event) => {
                onDraftChange(event.target.value);
                if (error) setError("");
              }}
              placeholder="Type your response as you would give it in the interview…"
              rows="9"
              aria-describedby={error ? "mock-answer-error" : "mock-answer-note"}
            />
            <p id="mock-answer-note">Saved only in this tab&apos;s session storage. Coaching is withheld until the report.</p>
            {error && <p className="ic-form-error" id="mock-answer-error" role="alert">{error}</p>}
            <div className="ic-form-actions">
              <button className="ic-primary-button" type="submit">Save answer and continue →</button>
              <button className="ic-text-button" type="button" onClick={onEnd}>End interview early</button>
            </div>
          </form>
        </article>
      </section>

      <aside className="ic-session-sidebar">
        <div>
          <span className="ic-sidebar-label">INTERVIEW STATE</span>
          <strong>{question.kind === "follow-up" ? "Follow-up in progress" : "Primary question"}</strong>
          <p>The interviewer will not provide coaching or model answers during the active session.</p>
        </div>
        <div>
          <span className="ic-sidebar-label">LOCAL PRIVACY</span>
          <strong>{mock.answers.length} responses saved</strong>
          <p>Answers stay in session storage and are removed by Clear session or when the tab session is cleared.</p>
        </div>
        <button className="ic-secondary-button" type="button" onClick={onPreparation}>Return to preparation</button>
      </aside>
    </main>
  );
}
