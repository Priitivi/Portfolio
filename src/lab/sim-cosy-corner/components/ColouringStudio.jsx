import { useEffect, useMemo, useRef, useState } from "react";
import { colouringGallery, colouringTechniques, palettePresets } from "../simCosyContent";
import { generatePalette, paletteRoles, removeById, validatePalettes } from "../cosyUtils";
import { useCosyStorage } from "../useCosyStorage";

function TechniqueCard({ technique }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`cosy-technique-card difficulty-${technique.difficulty.toLowerCase()}`}>
      <header>
        <div><span className="cosy-difficulty"><i aria-hidden="true">{"●".repeat({ Starter:1, Growing:2, Confident:3 }[technique.difficulty])}</i> {technique.difficulty}</span>{technique.favourite && <span className="cosy-favourite">♥ starter favourite</span>}</div>
        <h3>{technique.name}</h3>
        <p>{technique.notes}</p>
        <div className="cosy-mini-swatches" aria-label="Example colour palette">{technique.palette.map((colour) => <i key={colour} style={{ background:colour }} title={colour} />)}</div>
      </header>
      <button type="button" className="cosy-card-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? "Close technique" : "See method"}<span aria-hidden="true">{open ? "−" : "+"}</span></button>
      {open && <div className="cosy-technique-details">
        <div><h4>Tools</h4><ul>{technique.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul></div>
        <div><h4>Try it gently</h4><ol>{technique.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
        <aside><strong>Little tip</strong><p>{technique.tips[0]}</p><strong>Watch for</strong><p>{technique.mistakes[0]}</p></aside>
        <label>Sim’s notes <textarea rows="3" defaultValue={technique.notes} aria-label={`Sim’s notes for ${technique.name}`} /></label>
      </div>}
    </article>
  );
}

function PaletteBuilder({ onFirstSave }) {
  const [colours, setColours] = useState(palettePresets[0].colours);
  const [locks, setLocks] = useState(Array(5).fill(false));
  const [softness, setSoftness] = useState(76);
  const [size, setSize] = useState(5);
  const [name, setName] = useState("Lavender Daydream");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useCosyStorage("sim-cosy-palettes", [], validatePalettes);
  const roles = paletteRoles(colours.length);

  const regenerate = () => {
    setColours(generatePalette({ size, softness, base:colours[0], previous:colours, locks, seed:Math.random() }));
    setLocks((current) => Array.from({ length:size }, (_, index) => Boolean(current[index])));
    setNotice("A new soft combination is on the desk.");
  };

  const choosePreset = (event) => {
    const preset = palettePresets.find((item) => item.id === event.target.value) || palettePresets[0];
    setColours(preset.colours);
    setSize(preset.colours.length);
    setLocks(Array(preset.colours.length).fill(false));
    setName(preset.name);
    setNotice(`${preset.name} is ready to tweak.`);
  };

  const savePalette = () => {
    const trimmedName = name.trim() || "Untitled pastel palette";
    const palette = { id:`palette-${Date.now()}`, name:trimmedName, colours };
    setSaved((current) => [palette, ...current].slice(0, 20));
    setNotice(`${trimmedName} was tucked into favourites.`);
    onFirstSave();
  };

  const copyColour = async (colour) => {
    try { await navigator.clipboard.writeText(colour.toUpperCase()); setNotice(`${colour.toUpperCase()} copied.`); }
    catch { setNotice(`Colour value: ${colour.toUpperCase()}`); }
  };

  return (
    <section className="cosy-palette-builder" aria-labelledby="palette-builder-title">
      <div className="cosy-tool-heading"><div><p className="cosy-kicker">Lavender-led palette maker</p><h2 id="palette-builder-title">Mix a quiet little colour story</h2></div><span className="cosy-sticker">no made-up marker codes</span></div>
      <div className="cosy-palette-controls">
        <label>Mood preset<select onChange={choosePreset} defaultValue="daydream">{palettePresets.map((preset) => <option value={preset.id} key={preset.id}>{preset.name}</option>)}</select></label>
        <label>Palette name<input value={name} maxLength="48" onChange={(event) => setName(event.target.value)} /></label>
        <label>Palette size<select value={size} onChange={(event) => { const next = Number(event.target.value); setSize(next); setColours(generatePalette({ size:next, softness, base:colours[0], previous:colours, locks, seed:.42 })); setLocks((current) => Array.from({ length:next }, (_, index) => Boolean(current[index]))); }}>{[3,4,5,6,7].map((count) => <option value={count} key={count}>{count} colours</option>)}</select></label>
        <label className="cosy-range">Pastel softness <span>{softness}%</span><input type="range" min="45" max="92" value={softness} onChange={(event) => setSoftness(Number(event.target.value))} /></label>
      </div>

      <div className="cosy-palette-strip" aria-label="Current palette">
        {colours.map((colour, index) => <article key={`${index}-${colour}`} style={{ "--swatch":colour }} className={locks[index] ? "is-locked" : ""}>
          <div><span>{roles[index]}</span><strong>{colour.toUpperCase()}</strong></div>
          <button type="button" onClick={() => setLocks((current) => current.map((locked, lockIndex) => lockIndex === index ? !locked : locked))} aria-pressed={locks[index]} aria-label={`${locks[index] ? "Unlock" : "Lock"} ${colour}`}><span aria-hidden="true">{locks[index] ? "◆" : "◇"}</span>{locks[index] ? "Locked" : "Lock"}</button>
          <button type="button" onClick={() => copyColour(colour)} aria-label={`Copy ${colour}`}><span aria-hidden="true">▣</span>Copy</button>
        </article>)}
      </div>
      <div className="cosy-palette-actions"><button type="button" className="cosy-button cosy-button-primary" onClick={regenerate}>Regenerate unlocked colours</button><button type="button" className="cosy-button cosy-button-paper" onClick={savePalette}>♡ Save this palette</button></div>
      <p className="cosy-live-notice" aria-live="polite">{notice}</p>

      <div className="cosy-saved-palettes">
        <h3>Saved in the scrapbook <span>{saved.length}</span></h3>
        {saved.length ? <div>{saved.map((palette) => <article key={palette.id}><div><strong>{palette.name}</strong><span>{palette.colours.map((colour) => <i key={colour} style={{ background:colour }} title={colour} />)}</span></div><button type="button" onClick={() => setSaved((current) => removeById(current, palette.id))} aria-label={`Delete saved palette ${palette.name}`}>Remove</button></article>)}</div> : <p className="cosy-empty-inline">No palettes saved yet. Your first one will unlock a tiny sticker.</p>}
      </div>
    </section>
  );
}

function ColouringDemo() {
  const [mode, setMode] = useState("flat");
  const modes = [
    { id:"flat", label:"1 · Flat", note:"A smooth lavender base gives the object its local colour." },
    { id:"shadow", label:"2 · Shadow", note:"A deeper tone sits away from the light and beneath the rim." },
    { id:"blend", label:"3 · Blend", note:"The middle tone softens the join while the ink is still workable." },
    { id:"highlight", label:"4 · Highlight", note:"One crisp reflection and a few tiny dots make the mug feel glossy." },
  ];
  const active = modes.find((item) => item.id === mode);
  return (
    <section className="cosy-demo" aria-labelledby="cosy-demo-title">
      <div><p className="cosy-kicker">Interactive technique study</p><h2 id="cosy-demo-title">Build a cosy mug, layer by layer</h2><p>{active.note}</p><div className="cosy-demo-tabs">{modes.map((item) => <button type="button" key={item.id} aria-pressed={mode === item.id} onClick={() => setMode(item.id)}>{item.label}</button>)}</div></div>
      <div className={`cosy-demo-art show-${mode}`} role="img" aria-label={`Illustrated lavender mug showing the ${mode} colouring treatment`}><div className="cosy-demo-page"><span className="demo-light" aria-hidden="true">light ↘</span><div className="demo-mug"><i className="demo-shadow" /><i className="demo-blend" /><i className="demo-shine" /><strong>♡</strong></div><div className="demo-saucer" /><div className="demo-swatch-notes" aria-hidden="true"><i /><i /><i /></div></div></div>
    </section>
  );
}

function GalleryModal({ item, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previous?.focus?.(); };
  }, [onClose]);
  return <div className="cosy-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="cosy-gallery-modal" role="dialog" aria-modal="true" aria-labelledby="gallery-modal-title"><button ref={closeRef} type="button" className="cosy-modal-close" onClick={onClose} aria-label="Close gallery detail">×</button><div className={`cosy-gallery-art art-${item.art}`} role="img" aria-label={`Original abstract placeholder composition called ${item.title}`}><i /><i /><i /><span /></div><div><span className="cosy-status-stamp">{item.favourite ? "Sim’s favourite placeholder" : "Original placeholder"}</span><h2 id="gallery-modal-title">{item.title}</h2><p>{item.notes}</p><dl><div><dt>Book</dt><dd>{item.book}</dd></div><div><dt>Markers</dt><dd>{item.markerSet}</dd></div><div><dt>Techniques</dt><dd>{item.techniques.join(", ")}</dd></div><div><dt>Completed</dt><dd>{item.completed || "Add a date"}</dd></div></dl><div className="cosy-mini-swatches" aria-label="Gallery palette">{item.palette.map((colour) => <i style={{ background:colour }} title={colour} key={colour} />)}</div></div></section></div>;
}

function ColouringGallery() {
  const [selected, setSelected] = useState(null);
  const close = () => setSelected(null);
  return <section className="cosy-gallery" aria-labelledby="gallery-title"><div className="cosy-tool-heading"><div><p className="cosy-kicker">Finished pages · placeholders for now</p><h2 id="gallery-title">A little gallery wall</h2></div><p>Original abstract compositions keep the frames warm until Sim’s photographs are ready.</p></div><div className="cosy-gallery-grid">{colouringGallery.map((item, index) => <article key={item.id} className={index === 1 ? "is-tilted" : ""}><button type="button" onClick={() => setSelected(item)} aria-label={`Open details for ${item.title}`}><div className={`cosy-gallery-art art-${item.art}`} role="img" aria-label={`Original abstract placeholder composition called ${item.title}`}><i /><i /><i /><span /></div><strong>{item.title}</strong><small>{item.book}</small></button></article>)}</div>{selected && <GalleryModal item={selected} onClose={close} />}</section>;
}

export default function ColouringStudio({ achievements, setAchievements }) {
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const techniques = useMemo(() => favouritesOnly ? colouringTechniques.filter((item) => item.favourite) : colouringTechniques, [favouritesOnly]);
  return (
    <section className="cosy-page cosy-colouring" aria-labelledby="cosy-colouring-title">
      <header className="cosy-page-heading"><div><p className="cosy-kicker">Collection 02 · marker journal</p><h1 id="cosy-colouring-title">The colouring studio</h1></div><p>A lavender artist’s desk for keeping techniques, building gentle palettes and celebrating finished pages.</p></header>
      {achievements.firstPalette && <div className="cosy-unlocked-sticker" role="status"><span aria-hidden="true">✦</span><strong>First palette saved!</strong><small>A pastel sticker has joined the page.</small></div>}
      <ColouringDemo />
      <PaletteBuilder onFirstSave={() => !achievements.firstPalette && setAchievements((current) => ({ ...current, firstPalette:true }))} />
      <section className="cosy-techniques" aria-labelledby="technique-title"><div className="cosy-tool-heading"><div><p className="cosy-kicker">Editable example content</p><h2 id="technique-title">Technique library</h2></div><button type="button" className="cosy-filter-favourite" aria-pressed={favouritesOnly} onClick={() => setFavouritesOnly((value) => !value)}>♥ {favouritesOnly ? "Showing starter favourites" : "Show starter favourites"}</button></div><div className="cosy-technique-grid">{techniques.map((technique) => <TechniqueCard technique={technique} key={technique.id} />)}</div></section>
      <ColouringGallery />
    </section>
  );
}
