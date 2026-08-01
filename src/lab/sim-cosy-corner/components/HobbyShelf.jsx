import { useMemo, useState } from "react";
import { hobbies } from "../simCosyContent";

const hobbyFilters = ["All", "Current obsession", "Favourite", "Trying", "On my list"];

function HobbyCard({ hobby, expanded, onToggle }) {
  return (
    <article className={`cosy-hobby-card is-${hobby.accent} ${expanded ? "is-open" : ""}`}>
      <div className="cosy-hobby-icon" aria-hidden="true"><span>{hobby.icon}</span></div>
      <div className="cosy-hobby-copy">
        <span className="cosy-status-stamp">{hobby.status}</span>
        <h3>{hobby.name}</h3>
        <p>{hobby.description}</p>
      </div>
      <button type="button" className="cosy-card-toggle" aria-expanded={expanded} onClick={onToggle}>
        {expanded ? "Tuck notes away" : "Open the notes"} <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <div className="cosy-hobby-notes">
          <p>{hobby.notes}</p>
          <ul aria-label={`${hobby.name} tools and supplies`}>{hobby.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul>
          <small>Added {new Date(`${hobby.dateAdded}T12:00:00`).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}</small>
        </div>
      )}
    </article>
  );
}
export default function HobbyShelf() {
  const [filter, setFilter] = useState("All");
  const [openId, setOpenId] = useState("colouring");
  const visible = useMemo(() => hobbies.filter((hobby) => filter === "All" || hobby.status === filter), [filter]);

  return (
    <section className="cosy-page cosy-hobbies" aria-labelledby="cosy-hobbies-title">
      <header className="cosy-page-heading">
        <div><p className="cosy-kicker">Collection 01 · made to grow</p><h1 id="cosy-hobbies-title">The hobby shelf</h1></div>
        <p>Little things Sim enjoys, is learning, or might fancy trying next. The starter labels are invitations, not assumptions.</p>
      </header>

      <div className="cosy-filter-row" aria-label="Filter hobbies">
        {hobbyFilters.map((item) => <button type="button" key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
      </div>

      <div className="cosy-hobby-shelf">
        {visible.length ? visible.map((hobby) => <HobbyCard key={hobby.id} hobby={hobby} expanded={openId === hobby.id} onToggle={() => setOpenId((current) => current === hobby.id ? null : hobby.id)} />) : (
          <div className="cosy-empty-note"><span aria-hidden="true">✎</span><strong>Nothing pinned here yet.</strong><p>Try another filter, or add Sim’s next favourite to the content file.</p></div>
        )}
      </div>
    </section>
  );
}
