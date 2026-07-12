function Navbar({ onExplore }) {
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
      </div>
      <button type="button" className="pf-nav-game" onClick={onExplore}>
        <span aria-hidden="true">▶</span> Play fighter
      </button>
    </nav>
  );
}

export default Navbar;
