const screenLabels = {
  welcome: "Session setup",
  prepare: "Preparation workspace",
  mock: "Mock interview",
  roleplay: "Smart Rebook role-play",
  feedback: "Practice report",
};

export default function CoachHeader({ screen, navigate, onClear }) {
  return (
    <header className="ic-header">
      <button className="ic-wordmark" type="button" onClick={() => navigate("/lab")}>
        <span>PL</span>
        <span><strong>Interview Coach</strong><small>Private Lab 006</small></span>
      </button>
      <div className="ic-header-status">
        <span className="ic-status-dot" aria-hidden="true" />
        {screenLabels[screen] || "Practice session"}
      </div>
      <button className="ic-text-button" type="button" onClick={onClear}>Clear session</button>
    </header>
  );
}
