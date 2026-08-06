const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "practice", label: "Practice" },
  { id: "simulation", label: "Simulation" },
  { id: "interview", label: "Interview" },
  { id: "analytics", label: "Analytics" },
];

export default function AssessmentHeader({ view, onNavigate, navigate }) {
  return (
    <header className="ga-header">
      <button type="button" className="ga-brand" onClick={() => onNavigate("dashboard")} aria-label="Graduate Assessment Lab dashboard">
        <span className="ga-brand-mark">GA</span>
        <span><strong>ASSESSMENT LAB</strong><small>GRADUATE READINESS SYSTEM</small></span>
      </button>
      <nav aria-label="Assessment Lab navigation">
        {navItems.map((item) => (
          <button key={item.id} type="button" className={view === item.id ? "is-active" : ""} aria-current={view === item.id ? "page" : undefined} onClick={() => onNavigate(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
      <button type="button" className="ga-exit" onClick={() => navigate("/lab")}>Exit lab <span aria-hidden="true">↗</span></button>
    </header>
  );
}
