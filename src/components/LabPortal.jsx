function LabPortal() {
  return (
    <a className="pf-lab-ufo" href="/lab" aria-label="Enter Priit's experimental Lab through the crashed UFO">
      <span className="pf-ufo-copy"><small>UNIDENTIFIED BUILD</small><strong>It crashed from Priit&apos;s Lab.</strong><em>Inspect wreckage →</em></span>
      <svg viewBox="0 0 300 210" aria-hidden="true">
        <defs>
          <linearGradient id="ufo-hull" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f4f7ec" />
            <stop offset=".45" stopColor="#777b91" />
            <stop offset="1" stopColor="#1b1c29" />
          </linearGradient>
          <radialGradient id="ufo-dome"><stop offset="0" stopColor="#d9ff62" /><stop offset=".55" stopColor="#7ccab5" /><stop offset="1" stopColor="#18293a" /></radialGradient>
          <filter id="ufo-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g className="pf-ufo-debris"><path d="M246 91 280 61 290 31M249 104 286 107M244 119 275 146 284 178" /><circle cx="267" cy="78" r="4" /><circle cx="276" cy="128" r="3" /><path d="m222 54 8-16 10 13M229 151l8 16 13-12" /></g>
        <g className="pf-ufo-ship">
          <ellipse className="pf-ufo-shadow" cx="143" cy="137" rx="112" ry="28" />
          <path className="pf-ufo-hull" d="M25 111c24-29 67-43 120-42 56 1 98 17 119 48-24 33-67 49-125 47-56-2-94-20-114-53Z" />
          <path className="pf-ufo-rim" d="M35 112c54 20 151 24 218 5-23 29-63 41-113 40-49-1-84-15-105-45Z" />
          <path className="pf-ufo-dome" d="M83 81c8-42 36-62 69-60 34 2 60 25 64 67-40 13-91 10-133-7Z" />
          <ellipse className="pf-ufo-glass-line" cx="151" cy="73" rx="61" ry="15" />
          <g className="pf-ufo-lights" filter="url(#ufo-glow)"><circle cx="67" cy="125" r="5" /><circle cx="111" cy="139" r="5" /><circle cx="159" cy="144" r="5" /><circle cx="207" cy="137" r="5" /><circle cx="240" cy="121" r="5" /></g>
          <path className="pf-ufo-scar" d="m171 101-17 12 14 8-20 13" />
        </g>
      </svg>
      <span className="pf-ufo-smoke" aria-hidden="true"><i /><i /><i /></span>
    </a>
  );
}

export default LabPortal;
