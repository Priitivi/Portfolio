import { simCosyContent } from "../simCosyContent";

export default function ScrapbookNavigation({ active, onNavigate, onExit }) {
  return (
    <>
      <header className="cosy-topbar">
        <button type="button" className="cosy-brand" onClick={() => onNavigate("home")} aria-label="Return to Sim’s Cosy Corner home">
          <span aria-hidden="true">SC</span>
          <strong>Sim’s Cosy Corner</strong>
        </button>
        <span className="cosy-preview-chip"><i aria-hidden="true" /> {simCosyContent.lab.previewLabel}</span>
        <button type="button" className="cosy-lab-exit" onClick={onExit}>Priit’s Lab <span aria-hidden="true">↗</span></button>
      </header>

      <nav className="cosy-tabs" aria-label="Cosy Corner sections">
        {simCosyContent.navigation.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`cosy-tab cosy-tab-${item.id}`}
            aria-current={active === item.id ? "page" : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </nav>

      <nav className="cosy-mobile-nav" aria-label="Cosy Corner mobile sections">
        {simCosyContent.navigation.map((item) => (
          <button type="button" key={item.id} aria-current={active === item.id ? "page" : undefined} onClick={() => onNavigate(item.id)}>
            <span aria-hidden="true">{item.icon}</span><small>{item.shortLabel}</small>
          </button>
        ))}
      </nav>
    </>
  );
}
