import { experiments } from "./experiments";

export default function LabHome({ navigate, onLogout, isAuthenticated = false }) {
  const reactToPointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--lab-pointer-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--lab-pointer-y", `${event.clientY - bounds.top}px`);
  };

  return (
    <main className="lab-home" onPointerMove={reactToPointer}>
      <div className="lab-scanlines" aria-hidden="true" />
      <div className="lab-home-grid" aria-hidden="true" />

      <header className="lab-header">
        <a href="/" className="lab-wordmark"><span>PL</span><strong>PRIIT LAB</strong><small>UNSTABLE BRANCH</small></a>
        <nav aria-label="Laboratory navigation">
          <a href="/">Main portfolio</a>
          {isAuthenticated ? (
            <button type="button" onClick={onLogout}>Revoke clearance</button>
          ) : (
            <span className="lab-clearance-status"><i aria-hidden="true" /> Chambers locked</span>
          )}
        </nav>
      </header>

      <section className="lab-home-hero">
        <div>
          <p className="lab-overline">FACILITY 07 / CREATIVE SYSTEMS DIVISION</p>
          <h1>Experiments that<br />aren&apos;t ready to <em>behave.</em></h1>
          <p>This is the workshop floor: unfinished side projects, audiovisual systems, broken prototypes, and ideas being tested in public.</p>
        </div>
        <aside className="lab-diagnostics" aria-label="Laboratory diagnostics">
          <div><span>FACILITY</span><strong>ONLINE</strong></div>
          <div><span>BUILD INTEGRITY</span><strong className="lab-status-warning">71%</strong></div>
          <div><span>ACTIVE CHAMBERS</span><strong>{String(experiments.length).padStart(2, "0")}</strong></div>
          <div><span>CHAMBER ACCESS</span><strong className={isAuthenticated ? "" : "lab-status-locked"}>{isAuthenticated ? "CLEARED" : "LOCKED"}</strong></div>
          <div className="lab-scope" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        </aside>
      </section>

      <div className="lab-construction-strip" aria-hidden="true">
        <span>CAUTION // SYSTEMS UNDER CONSTRUCTION // EXPECT UNSTABLE OUTPUT // CAUTION // SYSTEMS UNDER CONSTRUCTION //</span>
      </div>

      <section className="lab-experiments" aria-labelledby="lab-experiments-title">
        <div className="lab-section-heading">
          <div><span>TEST CHAMBERS</span><h2 id="lab-experiments-title">Active experiments</h2></div>
          <p>You can browse the experiment roster freely. Opening a chamber requires the shared clearance password.</p>
        </div>

        <div className="lab-experiment-grid">
          {experiments.map((experiment) => (
            <article className={`lab-experiment-card ${experiment.preview ? "has-preview" : ""}`} key={experiment.id}>
              {experiment.preview === "fluid" ? (
                <div className="lab-card-preview lab-card-preview-fluid" aria-hidden="true"><i /><i /><i /><i /><span>LIVE FIELD / POINTER READY</span></div>
              ) : experiment.preview === "shortcut" ? (
                <div className="lab-card-preview lab-card-preview-shortcut" aria-hidden="true"><div className="lab-preview-osbar"><b>SL</b><i /><i /><span>09:42</span></div><div className="lab-preview-window"><header><i /> VECTOR EDITOR <b>— ×</b></header><main><aside>01<br />02<br />03<br />04</aside><code><em>const</em> shortcut = <strong>&quot;instinct&quot;</strong>;<br /><em>await</em> train(shortcut);<br /><span>// fast, safe, repeatable</span></code></main></div><div className="lab-preview-keys"><kbd>Ctrl</kbd><b>+</b><kbd>P</kbd></div><small>COMBO ×12&nbsp;&nbsp; SCORE 2,840</small></div>
              ) : experiment.preview === "deceptive" ? (
                <div className="lab-card-preview lab-card-preview-trial" aria-hidden="true"><div className="lab-trial-moon" /><div className="lab-trial-hills"><i /><i /><i /></div><div className="lab-trial-ground"><i /><i /><i /><i /><i /></div><div className="lab-trial-player"><i /><b /></div><div className="lab-trial-door" /><span>RULE 05 / DO NOT TRUST THIS PREVIEW</span></div>
              ) : experiment.preview === "cosy" ? (
                <div className="lab-card-preview lab-card-preview-cosy" aria-hidden="true"><div className="lab-cosy-book"><i>✿</i><strong>SIM’S<br />COSY<br />CORNER</strong></div><div className="lab-cosy-note">tiny joys<br />live here ♡</div><div className="lab-cosy-swatches"><i /><i /><i /><i /></div><span>LAVENDER DAYDREAM / LOCAL FIRST</span></div>
              ) : experiment.preview === "system" ? (
                <div className="lab-card-preview lab-card-preview-system" aria-hidden="true"><div className="lab-system-node n1">CLIENT</div><div className="lab-system-node n2">API</div><div className="lab-system-node n3">REDIS</div><div className="lab-system-node n4">DB</div><i className="lab-system-path p1" /><i className="lab-system-path p2" /><i className="lab-system-path p3" /><b className="lab-system-packet" /><span>REQUEST TRACE / 18 MS</span></div>
              ) : (
                <div className="lab-card-signal" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
              )}
              <div className="lab-card-top"><span>EXPERIMENT {experiment.experimentNumber}</span><strong>{experiment.status}</strong></div>
              <div className="lab-card-number" aria-hidden="true">{experiment.experimentNumber}</div>
              <h3>{experiment.title}</h3>
              <p>{experiment.description}</p>
              <ul>{experiment.signals.map((signal) => <li key={signal}>{signal}</li>)}</ul>
              <button type="button" onClick={() => navigate(experiment.route)}>
                {isAuthenticated ? "Enter test chamber" : "Unlock test chamber"} <span aria-hidden="true">{isAuthenticated ? "↗" : "◇"}</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      <footer className="lab-footer"><span>PRIIT LAB © {new Date().getFullYear()}</span><strong>{isAuthenticated ? "YOUR CLEARANCE EXPIRES AUTOMATICALLY" : "TEST CHAMBERS REQUIRE CLEARANCE"}</strong><a href="/">Exit facility →</a></footer>
    </main>
  );
}
