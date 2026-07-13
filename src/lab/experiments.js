export const experiments = [
  {
    id: "audio-reactor",
    experimentNumber: "001",
    title: "Psychedelic Audio Reactor",
    status: "Prototype",
    description: "A local-first Web Audio and Three.js installation that turns frequency, waveform, and beat data into a reactive synthetic world.",
    route: "/lab/audio-reactor",
    signals: ["Web Audio API", "FFT Analysis", "React Three Fiber", "Local files only"],
  },
  {
    id: "paint-surfer",
    experimentNumber: "002",
    title: "The Chroma Drifter",
    status: "Playable",
    description: "A blank 3D canvas, a stick artist with an oversized pencil, and a liquid colour trail that becomes a surfable path.",
    route: "/lab/paint-surfer",
    signals: ["Procedural character", "Paint simulation", "Keyboard + touch", "Local soundtrack"],
  },
];
