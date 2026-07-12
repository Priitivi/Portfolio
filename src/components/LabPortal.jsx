function LabPortal() {
  return (
    <a className="pf-lab-rift" href="/lab" aria-label="Enter Priit's experimental Lab">
      <svg viewBox="0 0 150 360" aria-hidden="true">
        <defs>
          <linearGradient id="rift-core" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c8ff36" />
            <stop offset=".4" stopColor="#9b5cff" />
            <stop offset="1" stopColor="#ff357f" />
          </linearGradient>
          <filter id="rift-glow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path className="pf-rift-void" d="M87 4 65 57 91 91 52 137 77 171 42 226 68 254 45 308 70 356 112 304 87 263 121 217 91 176 125 124 98 85 121 38Z" />
        <path className="pf-rift-core" d="M88 9 75 61 98 91 63 138 85 173 54 225 77 255 58 307 72 347 99 303 80 261 109 216 81 176 113 126 88 87 108 41Z" />
        <g className="pf-rift-cracks" filter="url(#rift-glow)"><path d="M76 61 39 42 16 48M89 91 124 67 143 73M63 138 23 121 6 96M84 173 130 153 146 134M54 225 21 244 5 279M77 255 116 278 140 272M58 307 25 328 18 350" /></g>
      </svg>
      <span className="pf-rift-copy"><small>REALITY BREACH</small><strong>Enter Priit&apos;s Lab</strong><em>Click here →</em></span>
    </a>
  );
}

export default LabPortal;
