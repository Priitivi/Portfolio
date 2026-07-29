import { useEffect, useRef, useState } from "react";
import SpeechInput from "./SpeechInput.jsx";
import SpeechPlayback from "./SpeechPlayback.jsx";
import useSpeechSynthesis from "../hooks/useSpeechSynthesis.js";
import { mockProgress, PRACTICE_DIFFICULTIES } from "../utils/questionProgression.js";

export default function MockInterviewScreen({
  mock,
  settings,
  notes,
  onSubmit,
  onEnd,
  onDraftChange,
  onPreparation,
  onNotesChange,
  onReadAloudChange,
}) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);
  const previousQuestionIdRef = useRef(null);
  const speech = useSpeechSynthesis();
  const speak = speech.speak;
  const answer = mock.draft || "";
  const question = mock.queue[mock.currentIndex];
  const progress = mockProgress(mock);
  const progressPercent = Math.round((progress.completed / progress.total) * 100);
  const isRetry = question?.kind === "retry";

  useEffect(() => {
    setError("");
    setIsSubmitting(false);
    textareaRef.current?.focus();

    if (
      previousQuestionIdRef.current
      && previousQuestionIdRef.current !== question?.id
      && settings.readAloud
    ) {
      speak(question?.prompt);
    }
    previousQuestionIdRef.current = question?.id;
  }, [question?.id, question?.prompt, settings.readAloud, speak]);

  const submit = (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!answer.trim()) {
      setError("Add an answer before continuing, or end the interview to review what you have.");
      textareaRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    speech.unlock();
    onSubmit(answer);
  };

  const toggleReadAloud = (enabled) => {
    onReadAloudChange(enabled);
    if (enabled) speech.speak(question.prompt, { userInitiated: true });
    else speech.stop();
  };

  if (!question) return null;

  return (
    <main className="ic-main ic-session-layout">
      <section className="ic-session-stage" aria-labelledby="mock-title">
        <div className="ic-session-kicker">
          <span>{isRetry ? "FOCUSED RETRY" : "MOCK INTERVIEW"}</span>
          <span>{isRetry ? `Attempt ${mock.retryContext?.attempt || 1}` : `${progress.completed} of ${progress.total} focus areas explored`}</span>
        </div>
        {!isRetry && (
          <div className="ic-progress-track" aria-label={`${progressPercent}% of focus areas complete`}>
            <i style={{ width: `${progressPercent}%` }} />
          </div>
        )}

        <article className="ic-question-card">
          <div className="ic-question-meta">
            <span>
              {isRetry
                ? "RETRY"
                : question.kind === "follow-up"
                  ? "FOLLOW-UP"
                  : `QUESTION ${String(progress.completed + 1).padStart(2, "0")}`}
            </span>
            <strong>{question.competency}</strong>
          </div>
          <h1 id="mock-title">{question.prompt}</h1>
          <SpeechPlayback
            supported={speech.supported}
            speaking={speech.speaking}
            paused={speech.paused}
            error={speech.error}
            onReplay={() => speech.speak(question.prompt, { userInitiated: true })}
            onPause={speech.pause}
            onResume={speech.resume}
            onStop={speech.stop}
            label="Replay question"
          />
          {isRetry && (
            <details className="ic-original-answer" open>
              <summary>Original answer</summary>
              <p>{question.originalAnswer}</p>
            </details>
          )}
          <form onSubmit={submit} aria-busy={isSubmitting}>
            <label htmlFor="mock-answer">{isRetry ? "Your improved answer" : "Your answer"}</label>
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
            <SpeechInput
              value={answer}
              onChange={onDraftChange}
              idPrefix="mock-answer"
              handsFree={settings.handsFree}
            />
            <p id="mock-answer-note">Saved only in this tab&apos;s session storage. Voice transcripts remain editable and are never auto-submitted.</p>
            {error && <p className="ic-form-error" id="mock-answer-error" role="alert">{error}</p>}
            <div className="ic-form-actions">
              <button className="ic-primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : isRetry ? "Save improved answer →" : "Save answer and continue →"}
              </button>
              <button className="ic-text-button" type="button" onClick={onEnd}>End interview early</button>
            </div>
          </form>
        </article>
      </section>

      <aside className="ic-session-sidebar">
        <div>
          <span className="ic-sidebar-label">INTERVIEW STATE</span>
          <strong>{isRetry ? "Individual answer retry" : question.kind === "follow-up" ? "Follow-up in progress" : "Primary question"}</strong>
          <p>
            {PRACTICE_DIFFICULTIES[mock.difficulty]?.title || "Realistic"} mode changes probing only.
            The interviewer does not provide coaching or model answers during the active session.
          </p>
        </div>
        <div>
          <span className="ic-sidebar-label">QUESTION PLAN</span>
          <strong>{mock.primaryAskedIds.length} unique primary questions asked</strong>
          <p>
            {mock.followUpAskedIds.length} follow-ups and {mock.retryAskedIds.length} focused retries are tracked separately.
            Primary question IDs are never reused.
          </p>
        </div>
        <label className="ic-setting-row">
          <input
            type="checkbox"
            checked={settings.readAloud}
            onChange={(event) => toggleReadAloud(event.target.checked)}
          />
          <span><strong>Read interviewer aloud</strong>Playback begins only after you interact.</span>
        </label>
        <label className="ic-notes">
          <span className="ic-sidebar-label">PRIVATE NOTES</span>
          <textarea
            rows="8"
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Private reminders only — notes are never submitted…"
          />
        </label>
        <div>
          <span className="ic-sidebar-label">LOCAL PRIVACY</span>
          <strong>{mock.answers.length} responses saved</strong>
          <p>Answers and notes stay in session storage and are removed by Clear session.</p>
        </div>
        <button className="ic-secondary-button" type="button" onClick={onPreparation}>Return to preparation</button>
      </aside>
    </main>
  );
}
