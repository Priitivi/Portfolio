import { useEffect, useRef, useState } from "react";
import { formatTimer } from "../utils/timer.js";

export default function RoleplayScreen({
  roleplay,
  onSend,
  onPause,
  onResume,
  onRestartTimer,
  onEnd,
  onNotesChange,
}) {
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const feedRef = useRef(null);
  const inputRef = useRef(null);
  const { timer } = roleplay;

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [roleplay.messages.length]);

  const submit = (event) => {
    event.preventDefault();
    if (!question.trim()) {
      setError("Ask Duncan a specific question before sending.");
      inputRef.current?.focus();
      return;
    }
    onSend(question);
    setQuestion("");
    setError("");
    inputRef.current?.focus();
  };

  return (
    <main className="ic-main ic-session-layout ic-roleplay-layout">
      <section className="ic-session-stage" aria-labelledby="roleplay-title">
        <div className="ic-roleplay-toolbar">
          <div>
            <span>SMART REBOOK / DISCOVERY MEETING</span>
            <h1 id="roleplay-title">Duncan <small>Product Owner</small></h1>
          </div>
          <div className={`ic-timer ${timer.expired ? "is-expired" : ""}`} role="timer" aria-live="off">
            <span>{timer.expired ? "TIME ELAPSED" : timer.running ? "TIME REMAINING" : "TIMER PAUSED"}</span>
            <strong>{formatTimer(timer.remainingSeconds)}</strong>
          </div>
        </div>
        <div className="ic-timer-controls" aria-label="Role-play timer controls">
          {timer.running ? (
            <button type="button" onClick={onPause}>Pause</button>
          ) : (
            <button type="button" onClick={onResume} disabled={timer.expired}>Resume</button>
          )}
          <button type="button" onClick={onRestartTimer}>Restart timer</button>
          <button type="button" onClick={onEnd}>End role-play</button>
        </div>
        {timer.expired && (
          <p className="ic-time-message" role="status">Ten minutes have elapsed. Continue and finish your conversation when ready; nothing has been lost.</p>
        )}

        <div className="ic-conversation" ref={feedRef} aria-live="polite" aria-label="Role-play conversation">
          {roleplay.messages.map((message) => (
            <article className={`ic-message is-${message.role}`} key={message.id}>
              <span>{message.role === "candidate" ? "You" : "Duncan"}</span>
              <p>{message.text}</p>
            </article>
          ))}
        </div>

        <form className="ic-chat-form" onSubmit={submit}>
          <label htmlFor="roleplay-question">Ask Duncan</label>
          <div>
            <textarea
              ref={inputRef}
              id="roleplay-question"
              rows="3"
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                if (error) setError("");
              }}
              placeholder="Ask one focused discovery question…"
              aria-describedby={error ? "roleplay-error" : "roleplay-note"}
              autoFocus
            />
            <button className="ic-primary-button" type="submit">Send →</button>
          </div>
          <p id="roleplay-note">Duncan answers only the detected question. He will not suggest what to ask next.</p>
          {error && <p className="ic-form-error" id="roleplay-error" role="alert">{error}</p>}
        </form>
      </section>

      <aside className="ic-session-sidebar">
        <div>
          <span className="ic-sidebar-label">YOUR BRIEF</span>
          <strong>Discover enough to begin short customer-facing learning.</strong>
          <p>You are being assessed on discovery, not on creating the course in this meeting.</p>
        </div>
        <label className="ic-notes">
          <span className="ic-sidebar-label">PRIVATE SCRATCHPAD</span>
          <textarea
            rows="9"
            value={roleplay.notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Capture facts, assumptions and open questions…"
          />
        </label>
        <div className="ic-assumption-note">
          <span>SCENARIO TRANSPARENCY</span>
          <p>The source pack confirms only the core behaviour. Additional details are internally consistent fictional assumptions for practice.</p>
        </div>
      </aside>
    </main>
  );
}
