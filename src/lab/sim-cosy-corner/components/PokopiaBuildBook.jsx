import { useMemo, useState } from "react";
import { buildChecklistText, materialSummary, safeOwnedQuantity, validateJournal, validateObject } from "../cosyUtils";
import { emptyJournalEntry, externalSources, pokopiaBuilds, pokopiaFacts } from "../simCosyContent";
import { useCosyStorage } from "../useCosyStorage";

const fallbackStages = [
  { title:"Choose & clear", copy:"Pick a comfortable area and preserve one natural feature to anchor the idea.", materials:[], diagram:"clear" },
  { title:"Mark the footprint", copy:"Use temporary pieces to test the scale and keep a generous walking route.", materials:["Temporary path markers"], diagram:"footprint" },
  { title:"Build the main structure", copy:"Place the largest forms first and check them from the main approach.", materials:["Structure materials for this concept"], diagram:"structure" },
  { title:"Paths & landscaping", copy:"Connect the entrances, then cluster planting with deliberate quiet gaps.", materials:["Path and planting materials"], diagram:"landscape" },
  { title:"Functional objects", copy:"Add the objects that make the space usable before decorating it.", materials:["Core furniture"], diagram:"function" },
  { title:"Decorative details", copy:"Repeat two or three small motifs so the build feels like one story.", materials:["Lights and small details"], diagram:"details" },
  { title:"Final adjustments", copy:"Walk the build slowly, remove clutter and save a favourite viewing angle.", materials:[], diagram:"finish" },
];

function BuildSketch({ type = "structure", palette }) {
  return <div className={`cosy-build-sketch sketch-${type}`} style={{ "--sketch-a":palette[0], "--sketch-b":palette[1], "--sketch-c":palette[2] }} role="img" aria-label="Original abstract top-down layout sketch"><span className="sketch-path" /><i /><i /><i /><i /><b /><em /></div>;
}
function BuildGallery({ activeId, onSelect }) {
  return <section className="cosy-build-gallery" aria-labelledby="build-gallery-title"><div className="cosy-tool-heading"><div><p className="cosy-kicker">Original inspiration plans</p><h2 id="build-gallery-title">Pick a page to plan</h2></div><span className="cosy-concept-key"><i aria-hidden="true">C</i> Concept · confirm in-game</span></div><div className="cosy-build-card-row">{pokopiaBuilds.map((build) => <article key={build.id} className={activeId === build.id ? "is-active" : ""}><button type="button" onClick={() => onSelect(build.id)} aria-pressed={activeId === build.id}><BuildSketch type="mini" palette={build.palette} /><span className="cosy-status-stamp">{build.status}</span><h3>{build.name}</h3><p>{build.description}</p><dl><div><dt>Feel</dt><dd>{build.theme}</dd></div><div><dt>Scale</dt><dd>{build.footprint}</dd></div><div><dt>Pace</dt><dd>{build.time}</dd></div></dl><div className="cosy-mini-swatches" aria-label={`${build.name} colour palette`}>{build.palette.map((colour) => <i style={{ background:colour }} title={colour} key={colour} />)}</div><strong className="cosy-open-plan">{activeId === build.id ? "Plan open ✓" : "Open this plan →"}</strong></button></article>)}</div></section>;
}

function MaterialPlanner({ build }) {
  const [allProgress, setAllProgress, resetAllProgress] = useCosyStorage("sim-cosy-materials", {}, validateObject);
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const owned = allProgress[build.id] && typeof allProgress[build.id] === "object" ? allProgress[build.id] : {};
  const summary = materialSummary(build.materials, owned);
  const visibleRows = summary.rows.filter((row) => filter === "all" || (filter === "missing" ? !row.complete : row.complete));
  const categories = [...new Set(visibleRows.map((row) => row.category))];

  const updateOwned = (material, value) => {
    const safe = safeOwnedQuantity(value, material.required);
    setAllProgress((current) => ({ ...current, [build.id]:{ ...(current[build.id] || {}), [material.id]:safe } }));
  };

  const resetBuild = () => {
    setAllProgress((current) => { const next = { ...current }; delete next[build.id]; return next; });
    setNotice("This build’s material progress was reset.");
  };

  const downloadChecklist = () => {
    const blob = new Blob([buildChecklistText(build, summary)], { type:"text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${build.id}-checklist.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice("A clean text checklist was exported.");
  };

  return <section className="cosy-material-planner" aria-labelledby="material-title"><header><div><p className="cosy-kicker">Locally saved checklist</p><h2 id="material-title">Gathering basket</h2><p>{build.name} · Estimated concept materials</p></div><div className="cosy-progress-dial" style={{ "--progress":`${summary.percent * 3.6}deg` }} role="progressbar" aria-label="Materials gathered" aria-valuemin="0" aria-valuemax="100" aria-valuenow={summary.percent}><span>{summary.percent}%</span><small>gathered</small></div></header>{summary.complete && <div className="cosy-ready-stamp" role="status">Ready to build <span>✦</span></div>}<div className="cosy-filter-row" aria-label="Filter materials">{["all","missing","completed"].map((item) => <button type="button" key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="cosy-material-groups">{categories.length ? categories.map((category) => <section key={category}><h3>{category}</h3>{visibleRows.filter((row) => row.category === category).map((row) => <div className="cosy-material-row" key={row.id}><label className="cosy-material-check"><input type="checkbox" checked={row.complete} onChange={(event) => updateOwned(row, event.target.checked ? row.required : 0)} /><span><strong>{row.name}</strong><small>Required: {row.required}</small></span></label><label className="cosy-owned">Owned <input type="number" inputMode="numeric" min="0" max={row.required} value={row.owned} onChange={(event) => updateOwned(row, event.target.value)} /></label><span className="cosy-remaining"><strong>{row.remaining}</strong><small>remaining</small></span></div>)}</section>) : <div className="cosy-empty-note"><strong>No materials in this view.</strong><p>Choose another filter to see the rest of the basket.</p></div>}</div><footer><p aria-live="polite">{notice}</p><button type="button" onClick={downloadChecklist}>Export text list</button><button type="button" onClick={resetBuild}>Reset this plan</button><button type="button" onClick={resetAllProgress} className="cosy-subtle-action">Reset every build</button></footer></section>;
}

function BuildTutorial({ build }) {
  const stages = build.stages.length ? build.stages : fallbackStages;
  const [progress, setProgress] = useCosyStorage("sim-cosy-tutorials", {}, validateObject);
  const savedStep = Math.max(0, Math.min(stages.length, Number(progress[build.id]) || 0));
  const index = Math.min(savedStep, stages.length - 1);
  const stage = stages[index];
  const finished = savedStep >= stages.length;
  const update = (next) => setProgress((current) => ({ ...current, [build.id]:Math.max(0, Math.min(stages.length, next)) }));
  return <section className="cosy-tutorial" aria-labelledby="tutorial-title"><div className="cosy-tool-heading"><div><p className="cosy-kicker">Concept tutorial · step {index + 1} of {stages.length}</p><h2 id="tutorial-title">Build it like a scrapbook story</h2></div><span className="cosy-concept-key"><i aria-hidden="true">C</i> Concept, not an official recipe</span></div><div className="cosy-tutorial-progress" role="progressbar" aria-label="Tutorial progress" aria-valuemin="0" aria-valuemax={stages.length} aria-valuenow={savedStep}>{stages.map((item, stageIndex) => <button type="button" onClick={() => update(stageIndex)} className={stageIndex === index ? "is-current" : stageIndex < savedStep ? "is-done" : ""} key={item.title} aria-label={`Go to step ${stageIndex + 1}: ${item.title}`}><span>{stageIndex < savedStep ? "✓" : stageIndex + 1}</span><small>{item.title}</small></button>)}</div><article className={finished ? "is-finished" : ""}><BuildSketch type={stage.diagram} palette={build.palette} /><div><span className="cosy-status-stamp">Stage {index + 1}</span><h3>{finished ? "A finished little plan" : stage.title}</h3><p>{finished ? "The concept tutorial is complete. Take a photo, note what changed in-game and make the plan truly yours." : stage.copy}</p><h4>{stage.materials.length ? "Bring into this step" : "A no-material planning step"}</h4>{stage.materials.length ? <ul>{stage.materials.map((material) => <li key={material}>{material}</li>)}</ul> : <p className="cosy-muted">Just a slow look around is enough.</p>}<label>Notes for this stage<textarea rows="3" placeholder="What worked? What should move?" /></label><div className="cosy-tutorial-actions"><button type="button" disabled={savedStep === 0} onClick={() => update(savedStep - 1)}>← Previous</button><button type="button" className="cosy-button-primary" onClick={() => update(finished ? 0 : savedStep + 1)}>{finished ? "Start again" : savedStep === stages.length - 1 ? "Finish the build ✦" : "Mark done & continue →"}</button></div></div></article></section>;
}

function BuildJournal({ build }) {
  const [entries, setEntries] = useCosyStorage("sim-cosy-journal", [], validateJournal);
  const [draft, setDraft] = useState({ ...emptyJournalEntry, inspiration:build.name });
  const [notice, setNotice] = useState("");
  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]:value }));
  const save = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) { setNotice("Give this build idea a name first."); return; }
    const entry = { ...draft, id:`journal-${Date.now()}`, name:draft.name.trim(), materialsProgress:Math.max(0, Math.min(100, Number(draft.materialsProgress) || 0)) };
    setEntries((current) => [entry, ...current]);
    setDraft({ ...emptyJournalEntry, inspiration:build.name });
    setNotice(`${entry.name} was pinned into the journal.`);
  };
  return <section className="cosy-journal" aria-labelledby="journal-title"><div className="cosy-tool-heading"><div><p className="cosy-kicker">Private to this browser</p><h2 id="journal-title">Sim’s build journal</h2></div><span className="cosy-sticker">saved locally</span></div><form onSubmit={save}><label>Build name<input required value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="My tiny garden…" /></label><label>Status<select value={draft.status} onChange={(event) => updateDraft("status", event.target.value)}><option value="idea">Idea</option><option value="gathering">Gathering</option><option value="building">Building</option><option value="completed">Completed</option></select></label><label>Favourite inspiration<input value={draft.inspiration} onChange={(event) => updateDraft("inspiration", event.target.value)} /></label><label>Materials progress <span>{draft.materialsProgress}%</span><input type="range" min="0" max="100" value={draft.materialsProgress} onChange={(event) => updateDraft("materialsProgress", Number(event.target.value))} /></label><label className="cosy-form-wide">Notes<textarea rows="3" value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="The feeling, layout or tiny detail to remember…" /></label><label>Pastel palette<select value={draft.palette} onChange={(event) => updateDraft("palette", event.target.value)}><option>Lavender Daydream</option><option>Peach Sunrise</option><option>Sage Cottage</option><option>Powder Blue Evening</option></select></label><label>Next action<input value={draft.nextAction} onChange={(event) => updateDraft("nextAction", event.target.value)} placeholder="Gather path pieces" /></label><label>Completion date<input type="date" value={draft.completionDate} onChange={(event) => updateDraft("completionDate", event.target.value)} /></label><button className="cosy-button cosy-button-primary" type="submit">Pin this build</button></form><p className="cosy-live-notice" aria-live="polite">{notice}</p><div className="cosy-journal-entries">{entries.length ? entries.map((entry) => <article key={entry.id}><div className="cosy-journal-pin" aria-hidden="true" /><span className="cosy-status-stamp">{entry.status}</span><h3>{entry.name}</h3><p>{entry.notes || "No notes yet — just a lovely beginning."}</p><dl><div><dt>Inspiration</dt><dd>{entry.inspiration || "Open"}</dd></div><div><dt>Materials</dt><dd>{entry.materialsProgress}%</dd></div><div><dt>Next</dt><dd>{entry.nextAction || "Choose a next step"}</dd></div></dl><button type="button" onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}>Remove note</button></article>) : <div className="cosy-empty-note"><span aria-hidden="true">⌂</span><strong>No personal builds pinned yet.</strong><p>The inspiration gallery is ready when the first idea arrives.</p></div>}</div></section>;
}

function ResearchNote() {
  return <aside className="cosy-research-note" aria-labelledby="research-note-title"><div><p className="cosy-kicker">What is verified?</p><h2 id="research-note-title">A careful line between game fact and our ideas</h2><p>Only the short facts below come from official sources. Every plan in this Build Book is an original concept; exact objects, recipes, grid sizes, quantities and placement should be checked in-game.</p></div><ul>{pokopiaFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul><div className="cosy-source-list"><strong>Official sources consulted</strong>{externalSources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><span>{source.label}</span><small>{source.verified}</small></a>)}</div></aside>;
}

export default function PokopiaBuildBook() {
  const [activeId, setActiveId] = useState(pokopiaBuilds[0].id);
  const build = useMemo(() => pokopiaBuilds.find((item) => item.id === activeId) || pokopiaBuilds[0], [activeId]);
  return <section className="cosy-page cosy-pokopia" aria-labelledby="cosy-pokopia-title"><header className="cosy-page-heading"><div><p className="cosy-kicker">Collection 03 · original concept notebook</p><h1 id="cosy-pokopia-title">The Pokopia Build Book</h1></div><p>A lavender builder’s notebook for turning soft little ideas into organised, in-game experiments — without pretending concepts are official recipes.</p></header><ResearchNote /><BuildGallery activeId={activeId} onSelect={setActiveId} /><section className="cosy-open-build" aria-label={`Open concept plan: ${build.name}`}><div><span className="cosy-status-stamp">{build.status} · estimated materials</span><h2>{build.name}</h2><p>{build.notes}</p><ul>{build.decorations.map((item) => <li key={item}>✦ {item}</li>)}</ul></div><BuildSketch type="structure" palette={build.palette} /></section><MaterialPlanner build={build} /><BuildTutorial build={build} /><BuildJournal build={build} /></section>;
}
