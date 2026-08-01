import { useEffect, useMemo, useState } from "react";
import ScrapbookNavigation from "./components/ScrapbookNavigation";
import HobbyShelf from "./components/HobbyShelf";
import ColouringStudio from "./components/ColouringStudio";
import PokopiaBuildBook from "./components/PokopiaBuildBook";
import { cosyTheme, simCosyContent } from "./simCosyContent";
import { useCosyStorage } from "./useCosyStorage";
import { validateObject } from "./cosyUtils";
import "./sim-cosy-corner.css";

const validSections = new Set(simCosyContent.navigation.map((item) => item.id));

function initialSection() {
  const fromHash = window.location.hash.replace("#", "").toLowerCase();
  return validSections.has(fromHash) ? fromHash : "home";
}

function CosyLandingScene({ onOpen, plantLevel, onGrow, markerOrder, onShuffle }) {
  return (
    <section className="cosy-landing" aria-labelledby="cosy-title">
      <div className="cosy-landing-copy">
        <p className="cosy-kicker">{simCosyContent.lab.eyebrow}</p>
        <h1 id="cosy-title"><span>Sim’s</span> Cosy Corner</h1>
        <p className="cosy-intro">{simCosyContent.lab.intro}</p>
        <div className="cosy-landing-actions">
          <button type="button" className="cosy-button cosy-button-primary" onClick={() => onOpen("colouring")}>Open the colouring studio <span aria-hidden="true">→</span></button>
          <button type="button" className="cosy-button cosy-button-paper" onClick={() => onOpen("pokopia")}>Plan a tiny build</button>
        </div>
        <span className="cosy-editable-label">✎ {simCosyContent.lab.editableNote}</span>
      </div>

      <div className="cosy-desk-scene" aria-label="An illustrated cosy creative desk with interactive scrapbook objects">
        <div className="cosy-lamp" aria-hidden="true"><i /><span /></div>
        <button type="button" className="cosy-scene-book" onClick={() => onOpen("colouring")} aria-label="Open the lavender colouring book">
          <span>COLOUR<br />NOTES</span><i aria-hidden="true">✿</i><small>open me</small>
        </button>
        <button type="button" className="cosy-scene-note" onClick={() => onOpen("hobbies")} aria-label="Open the pinned Hobby Shelf note">
          <span>things making<br />me happy</span><strong>♡</strong>
        </button>
        <button type="button" className="cosy-scene-plan" onClick={() => onOpen("pokopia")} aria-label="Open the Pokopia Build Book">
          <span aria-hidden="true"><i /><i /><i /><i /></span><strong>tiny build plans</strong><small>concept book</small>
        </button>
        <button type="button" className={`cosy-plant cosy-plant-${plantLevel}`} onClick={onGrow} aria-label="Give the lavender plant a little encouragement">
          <span aria-hidden="true"><i /><i /><i /><i /><i /></span><small>{plantLevel > 2 ? "happy plant!" : "tap to grow"}</small>
        </button>
        <button type="button" className="cosy-marker-cup" onClick={onShuffle} aria-label="Rearrange the marker cup colours">
          <span aria-hidden="true">{markerOrder.map((colour) => <i style={{ "--marker":colour }} key={colour} />)}</span><small>shuffle</small>
        </button>
        <div className="cosy-mug" aria-hidden="true"><i>♥</i></div>
        <div className="cosy-washi cosy-washi-one" aria-hidden="true" /><div className="cosy-washi cosy-washi-two" aria-hidden="true" />
      </div>

      <aside className="cosy-currently" aria-label="Currently enjoying">
        <div><span aria-hidden="true">✦</span><strong>currently enjoying</strong></div>
        {simCosyContent.currentInterests.map((item) => <article className={`is-${item.accent}`} key={item.label}><small>{item.label}</small><p>{item.value}</p></article>)}
      </aside>
    </section>
  );
}

export default function SimCosyCorner({ navigate }) {
  const [section, setSection] = useState(initialSection);
  const [plantLevel, setPlantLevel] = useState(1);
  const [markerOrder, setMarkerOrder] = useState(["#aa8fc8","#edc5d0","#f2d98c","#b8c9aa","#aebbe2"]);
  const [achievements, setAchievements] = useCosyStorage("sim-cosy-achievements", { visited:["home"], firstPalette:false }, validateObject);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${simCosyContent.lab.title} · Lab ${simCosyContent.lab.number}`;
    document.body.classList.add("sim-cosy-body");
    return () => { document.title = previousTitle; document.body.classList.remove("sim-cosy-body"); };
  }, []);

  useEffect(() => {
    setAchievements((current) => ({ ...current, visited:Array.from(new Set([...(Array.isArray(current.visited) ? current.visited : []), section])) }));
    document.querySelector("#cosy-main")?.focus({ preventScroll:true });
  }, [section, setAchievements]);

  const allVisited = useMemo(() => simCosyContent.navigation.every((item) => achievements.visited?.includes(item.id)), [achievements.visited]);

  const openSection = (next) => {
    if (!validSections.has(next)) return;
    window.history.replaceState({}, "", `${window.location.pathname}#${next}`);
    setSection(next);
    window.scrollTo({ top:0, behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  const shuffleMarkers = () => setMarkerOrder((current) => [...current.slice(1), current[0]]);

  return (
    <div className="sim-cosy-corner" data-theme={cosyTheme.id}>
      <a className="cosy-skip-link" href="#cosy-main">Skip to scrapbook page</a>
      <ScrapbookNavigation active={section} onNavigate={openSection} onExit={() => navigate("/lab")} />
      <main id="cosy-main" tabIndex="-1">
        {section === "home" && <CosyLandingScene onOpen={openSection} plantLevel={plantLevel} onGrow={() => setPlantLevel((value) => Math.min(4, value + 1))} markerOrder={markerOrder} onShuffle={shuffleMarkers} />}
        {section === "hobbies" && <HobbyShelf />}
        {section === "colouring" && <ColouringStudio achievements={achievements} setAchievements={setAchievements} />}
        {section === "pokopia" && <PokopiaBuildBook />}
      </main>
      {allVisited && <div className="cosy-achievement" role="status"><span aria-hidden="true">✿</span><div><strong>Scrapbook wanderer</strong><small>You found every cosy corner.</small></div></div>}
      <footer className="cosy-footer"><span>Sim’s Cosy Corner · Lab {simCosyContent.lab.number}</span><strong>Lavender Daydream</strong><button type="button" onClick={() => navigate("/lab")}>Back to Priit’s Lab →</button></footer>
    </div>
  );
}
