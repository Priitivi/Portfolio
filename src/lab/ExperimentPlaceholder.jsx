import { experiments } from "./experiments";

export default function ExperimentPlaceholder({ navigate, onLogout }) {
  const experiment = experiments[0];
  return (
    <main className="lab-chamber-placeholder">
      <div className="lab-scanlines" aria-hidden="true" />
      <header className="lab-header">
        <button type="button" className="lab-back-button" onClick={() => navigate("/lab")}>← Lab dashboard</button>
        <nav aria-label="Chamber navigation"><a href="/">Main portfolio</a><button type="button" onClick={onLogout}>Revoke clearance</button></nav>
      </header>
      <section>
        <p className="lab-overline">EXPERIMENT {experiment.experimentNumber} / CHAMBER SEALED</p>
        <div className="lab-reactor-mark" aria-hidden="true"><i /><i /><i /></div>
        <h1>{experiment.title}</h1>
        <p>The chamber shell is online. Local audio analysis and the first reactive visual system arrive in Phase 2.</p>
        <div className="lab-placeholder-status"><span>WEB AUDIO ENGINE</span><strong>AWAITING INSTALLATION</strong></div>
      </section>
    </main>
  );
}
