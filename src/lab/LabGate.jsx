import { useEffect, useRef, useState } from "react";

const terminalMessages = [
  "SCANNING DEVELOPMENT PERIMETER…",
  "UNSTABLE PROTOTYPES DETECTED",
  "CLEARANCE TOKEN REQUIRED",
  "AUDIO CHAMBER STATUS: DORMANT",
];

function messageForCode(code) {
  if (code === "INVALID_CLEARANCE") return "ACCESS DENIED // CLEARANCE STRING REJECTED";
  if (code === "LAB_NOT_CONFIGURED") return "AUTH NODE OFFLINE // NETLIFY VARIABLES REQUIRED";
  return "AUTH NODE UNREACHABLE // RUN THROUGH NETLIFY DEV";
}

export default function LabGate({ onUnlock, serviceCode }) {
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState("idle");
  const [feedback, setFeedback] = useState(serviceCode ? messageForCode(serviceCode) : "AWAITING CLEARANCE INPUT");
  const [messageIndex, setMessageIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const interval = window.setInterval(
      () => setMessageIndex((index) => (index + 1) % terminalMessages.length),
      2200,
    );
    return () => window.clearInterval(interval);
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!password || phase === "checking") return;
    setPhase("checking");
    setFeedback("VERIFYING BIOMETRIC SUBSTITUTE…");

    const result = await onUnlock(password);
    if (result.authenticated) {
      setPhase("unlocked");
      setFeedback("CLEARANCE ACCEPTED // UNSEALING LAB");
      return;
    }

    setPhase("denied");
    setFeedback(messageForCode(result.code));
    setPassword("");
    inputRef.current?.focus();
  };

  return (
    <main className={`lab-gate lab-gate-${phase}`}>
      <div className="lab-scanlines" aria-hidden="true" />
      <div className="lab-gate-grid" aria-hidden="true" />
      <a className="lab-return-link" href="/">← Return to portfolio</a>

      <section className="lab-clearance" aria-labelledby="lab-gate-title">
        <div className="lab-clearance-top">
          <span>RESTRICTED DEVELOPMENT ZONE</span>
          <strong>SECURITY NODE / 07</strong>
        </div>

        <div className="lab-warning-mark" aria-hidden="true">!</div>
        <p className="lab-overline">PRIIT LAB // CLEARANCE REQUIRED</p>
        <h1 id="lab-gate-title">The work behind<br />the <em>warning tape.</em></h1>
        <p className="lab-gate-copy">Unfinished systems, unstable ideas, and creative technical experiments live beyond this checkpoint.</p>

        <div className="lab-terminal-feed" aria-live="polite">
          <span>&gt; {terminalMessages[messageIndex]}</span>
          <i aria-hidden="true" />
        </div>

        <form onSubmit={submit} className="lab-access-form">
          <label htmlFor="lab-password">Clearance password</label>
          <div>
            <input
              ref={inputRef}
              id="lab-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={phase === "checking" || phase === "unlocked"}
              aria-describedby="lab-access-feedback"
              autoFocus
            />
            <button type="submit" disabled={!password || phase === "checking" || phase === "unlocked"}>
              {phase === "checking" ? "Checking…" : phase === "unlocked" ? "Unlocked" : "Enter lab"}
            </button>
          </div>
          <p id="lab-access-feedback" className={`lab-feedback lab-feedback-${phase}`} role="status">{feedback}</p>
        </form>

        <div className="lab-gate-meta" aria-hidden="true">
          <span>ENCRYPTION // ACTIVE</span><span>BUILD // UNSTABLE</span><span>VISITORS // 001</span>
        </div>
      </section>
    </main>
  );
}
