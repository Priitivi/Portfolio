const icons = {
  browser: ["M4 5.5h16v13H4z", "M4 9h16", "M7 7.2h.1M10 7.2h.1"],
  editor: ["M8 8 4 12l4 4M16 8l4 4-4 4M14 5l-4 14"],
  terminal: ["M5 7h14v10H5z", "m8 10 2 2-2 2M12 14h4"],
  files: ["M3.5 7h7l1.5 2h8.5v9H3.5z", "M3.5 7V5h6l1.5 2"],
  mail: ["M3.5 6h17v12h-17z", "m4 8 8.5 6L20 8"],
  notes: ["M6 3.5h12v17H6z", "M9 8h6M9 12h6M9 16h4"],
  sheet: ["M5 3.5h14v17H5z", "M5 9h14M5 14h14M10 3.5v17"],
  settings: ["M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z", "M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"],
};

export default function AppIcon({ app, size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {(icons[app] || icons.settings).map((path) => <path d={path} key={path} />)}
    </svg>
  );
}
