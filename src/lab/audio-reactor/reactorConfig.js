export const visualModes = [
  { id: "neural", label: "Neural Tunnel", short: "Rings / velocity / sparks" },
  { id: "liquid", label: "Liquid Signal", short: "Membrane / chrome / ripples" },
  { id: "astral", label: "Astral Bloom", short: "Particles / mandala / orbit" },
  { id: "collapse", label: "Signal Collapse", short: "Fragments / slices / glitch" },
];

export const palettes = {
  acid: { label: "Acid Sunset", background: "#09050f", primary: "#ffcf24", secondary: "#ff3d81", accent: "#8b5cf6" },
  ultraviolet: { label: "Ultraviolet", background: "#05030d", primary: "#a779ff", secondary: "#36d7ff", accent: "#ff4fd8" },
  toxic: { label: "Toxic Laboratory", background: "#040906", primary: "#b9ff2c", secondary: "#f6d32d", accent: "#16e0a0" },
  infrared: { label: "Infrared", background: "#0b0303", primary: "#ff3b30", secondary: "#ff8a22", accent: "#ffd5a1" },
  ocean: { label: "Deep Ocean", background: "#02070f", primary: "#23c9ff", secondary: "#3154ff", accent: "#56ffd2" },
  mono: { label: "Monochrome Signal", background: "#050505", primary: "#f4f1e8", secondary: "#8d929c", accent: "#ffffff" },
};

export function defaultReactorSettings(reducedMotion) {
  return {
    mode: reducedMotion ? "liquid" : "neural",
    intensity: reducedMotion ? 0.45 : 0.82,
    speed: reducedMotion ? 0.28 : 0.75,
    palette: reducedMotion ? "ocean" : "acid",
    cameraMotion: reducedMotion ? 0 : 0.55,
    sensitivity: 1,
    glow: reducedMotion ? 0.35 : 0.8,
    smoothing: reducedMotion ? 0.1 : 0.16,
  };
}
