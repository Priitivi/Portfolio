export const FLUID_PALETTES = {
  aurora: {
    label: "Aurora",
    background: "#02060a",
    colours: ["#42ffd2", "#4ba7ff", "#b267ff", "#efffa8"],
  },
  neon: {
    label: "Neon",
    background: "#050309",
    colours: ["#f8ff2c", "#ff2fb3", "#37e7ff", "#8b5cff"],
  },
  sunset: {
    label: "Sunset",
    background: "#090305",
    colours: ["#ffbf3f", "#ff5c62", "#ff4ccf", "#7a4cff"],
  },
  ocean: {
    label: "Ocean",
    background: "#01070d",
    colours: ["#24e5ff", "#1577ff", "#49ffd0", "#c5f5ff"],
  },
  monochrome: {
    label: "Mono",
    background: "#020202",
    colours: ["#f6f3ea", "#a9afb8", "#ffffff", "#5d626b"],
  },
  rainbow: {
    label: "Rainbow",
    background: "#040308",
    colours: ["#ff405d", "#ffcf39", "#4cff87", "#36b9ff", "#b85cff", "#ff4fc8"],
  },
};

export const FLUID_QUALITY_PRESETS = {
  low: { label: "Low", simulationResolution: 88, dyeResolution: 360, pressureIterations: 10, dpr: 1 },
  balanced: { label: "Balanced", simulationResolution: 128, dyeResolution: 560, pressureIterations: 15, dpr: 1.2 },
  high: { label: "High", simulationResolution: 180, dyeResolution: 820, pressureIterations: 20, dpr: 1.45 },
  ultra: { label: "Ultra", simulationResolution: 256, dyeResolution: 1120, pressureIterations: 24, dpr: 1.7 },
};

export function clampFluidValue(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, Number(value) || 0));
}

export function detectFluidQuality({ memory = 4, cores = 4, mobile = false, reducedMotion = false } = {}) {
  if (mobile || reducedMotion || memory <= 2 || cores <= 2) return "low";
  if (memory >= 8 && cores >= 8) return "high";
  return "balanced";
}

export function resolveFluidDimensions(baseResolution, aspectRatio) {
  const aspect = clampFluidValue(aspectRatio, 0.2, 5) || 1;
  if (aspect >= 1) {
    return { width: Math.max(32, Math.round(baseResolution)), height: Math.max(32, Math.round(baseResolution / aspect)) };
  }
  return { width: Math.max(32, Math.round(baseResolution * aspect)), height: Math.max(32, Math.round(baseResolution)) };
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

export function fluidColourForSplat(paletteId, sequence = 0) {
  const palette = FLUID_PALETTES[paletteId] || FLUID_PALETTES.aurora;
  const index = Math.abs(Math.floor(sequence)) % palette.colours.length;
  return hexToRgb(palette.colours[index]);
}

export function createFluidSettings(reducedMotion = false) {
  return {
    palette: reducedMotion ? "ocean" : "aurora",
    brush: reducedMotion ? 0.045 : 0.058,
    force: reducedMotion ? 4.2 : 7.2,
    dye: reducedMotion ? 0.7 : 1.05,
    vorticity: reducedMotion ? 9 : 24,
    dissipation: reducedMotion ? 0.12 : 0.065,
  };
}

export function normaliseFluidPointer(clientX, clientY, bounds) {
  if (!bounds?.width || !bounds?.height) return { x: 0.5, y: 0.5 };
  return {
    x: clampFluidValue((clientX - bounds.left) / bounds.width, 0, 1),
    y: 1 - clampFluidValue((clientY - bounds.top) / bounds.height, 0, 1),
  };
}
