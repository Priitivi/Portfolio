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
    title: "The Paper Drifter",
    status: "Playable",
    description: "An open 2D paper world where every line you draw becomes a platform, a shortcut, or part of the scenery you restore.",
    route: "/lab/paint-surfer",
    signals: ["Canvas 2D", "Drawn terrain", "Keyboard + touch", "14-track soundtrack"],
  },
];
