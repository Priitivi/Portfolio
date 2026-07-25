import { useEffect, useRef, useState } from "react";

function Navbar({ onExplore }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButton.current?.focus();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const launchGame = () => {
    closeMenu();
    onExplore();
  };

  return (
    <nav className="pf-nav" aria-label="Primary navigation">
      <a className="pf-logo" href="#hero" aria-label="Priitivi, back to top">
        <span>PR</span>
        <strong>PRIITIVI</strong>
      </a>
      <div className="pf-nav-links">
        <a href="#about"><span>01</span> About</a>
        <a href="#projects"><span>02</span> Work</a>
        <a href="#contact"><span>03</span> Contact</a>
        <a className="pf-nav-lab" href="/lab"><span>04</span> Lab</a>
        <a className="pf-nav-basecamp" href="/basecamp-login"><span>05</span> Basecamp</a>
      </div>
      <button type="button" className="pf-nav-game" onClick={onExplore}>
        <span aria-hidden="true">▶</span> Play fighter
      </button>
      <a className="pf-nav-basecamp-mobile" href="/basecamp-login">
        <span aria-hidden="true" />
        Basecamp
      </a>
      <button
        ref={menuButton}
        type="button"
        className={`pf-nav-menu-toggle ${menuOpen ? "is-open" : ""}`}
        aria-expanded={menuOpen}
        aria-controls="pf-mobile-menu"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      {menuOpen && (
        <div className="pf-mobile-menu-shell">
          <button
            type="button"
            className="pf-mobile-menu-backdrop"
            aria-label="Dismiss navigation overlay"
            onClick={closeMenu}
          />
          <div id="pf-mobile-menu" className="pf-mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation">
            <div className="pf-mobile-menu-heading">
              <span>NAVIGATION / MOBILE</span>
              <strong>Where next?</strong>
            </div>
            <div className="pf-mobile-menu-links">
              <a href="#about" onClick={closeMenu}><span>01</span><strong>About</strong><small>Who I am</small></a>
              <a href="#projects" onClick={closeMenu}><span>02</span><strong>Work</strong><small>Selected projects</small></a>
              <a href="#contact" onClick={closeMenu}><span>03</span><strong>Contact</strong><small>Start a conversation</small></a>
              <a className="is-lab" href="/lab" onClick={closeMenu}><span>04</span><strong>Lab</strong><small>Public experiment index</small></a>
              <a className="is-basecamp" href="/basecamp-login" onClick={closeMenu}><span>05</span><strong>Basecamp</strong><small>Friends&apos; private workspace</small></a>
            </div>
            <button type="button" className="pf-mobile-menu-game" onClick={launchGame}>
              <span aria-hidden="true">▶</span>
              Launch Portfolio Fighter
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
