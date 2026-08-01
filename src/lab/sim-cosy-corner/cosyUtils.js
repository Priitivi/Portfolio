export const COSY_STORAGE_VERSION = 1;

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function normaliseHex(value) {
  const match = typeof value === "string" && value.trim().match(/^#?([\da-f]{6})$/i);
  return match ? `#${match[1].toLowerCase()}` : null;
}

export function hslToHex(hue, saturation, lightness) {
  const h = ((Number(hue) % 360) + 360) % 360;
  const s = clamp(Number(saturation), 0, 100) / 100;
  const l = clamp(Number(lightness), 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - chroma / 2;
  let rgb = [0, 0, 0];
  if (h < 60) rgb = [chroma, x, 0];
  else if (h < 120) rgb = [x, chroma, 0];
  else if (h < 180) rgb = [0, chroma, x];
  else if (h < 240) rgb = [0, x, chroma];
  else if (h < 300) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];
  return `#${rgb.map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0")).join("")}`;
}

export function hexToHsl(hex) {
  const safe = normaliseHex(hex) || "#8f75ad";
  const [red, green, blue] = safe.slice(1).match(/.{2}/g).map((part) => parseInt(part, 16) / 255);
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;
  if (delta) {
    if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  const lightness = (maximum + minimum) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { hue:(hue + 360) % 360, saturation:saturation * 100, lightness:lightness * 100 };
}

const paletteOffsets = [0, 24, -28, 72, -70, 142, 190, -146];

export function generatePalette({ size = 5, softness = 72, base = "#8f75ad", seed = Math.random(), previous = [], locks = [] } = {}) {
  const safeSize = clamp(Math.round(Number(size) || 5), 3, 7);
  const soft = clamp(Number(softness) || 72, 45, 92);
  const origin = hexToHsl(base);
  return Array.from({ length:safeSize }, (_, index) => {
    const locked = locks[index] && normaliseHex(previous[index]);
    if (locked) return locked;
    const wobble = (((seed * 997 + index * 47) % 1) - 0.5) * 12;
    const hue = origin.hue + paletteOffsets[index] + wobble;
    const saturation = clamp(30 + (92 - soft) * 0.8 + (index % 2) * 6, 26, 62);
    const lightness = clamp(49 + soft * 0.34 + (index % 3) * 4 - (index === 0 ? 16 : 0), 42, 90);
    return hslToHex(hue, saturation, lightness);
  });
}

export function paletteRoles(length) {
  return Array.from({ length }, (_, index) => index === 0 ? "Dominant" : index < Math.ceil(length * 0.6) ? "Supporting" : "Accent");
}

export function safeOwnedQuantity(value, required) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return clamp(Math.floor(numeric), 0, Math.max(0, Number(required) || 0));
}

export function materialSummary(materials, owned = {}) {
  const rows = materials.map((material) => {
    const have = safeOwnedQuantity(owned[material.id], material.required);
    return { ...material, owned:have, remaining:Math.max(0, material.required - have), complete:have >= material.required };
  });
  const required = rows.reduce((sum, row) => sum + row.required, 0);
  const collected = rows.reduce((sum, row) => sum + row.owned, 0);
  return { rows, required, collected, percent:required ? Math.round((collected / required) * 100) : 100, complete:rows.every((row) => row.complete) };
}

export function createStoredEnvelope(value) {
  return JSON.stringify({ version:COSY_STORAGE_VERSION, value });
}

export function parseStoredEnvelope(raw, fallback, validate = () => true) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== COSY_STORAGE_VERSION || !validate(parsed.value)) return fallback;
    return parsed.value;
  } catch {
    return fallback;
  }
}

export function validatePalettes(value) {
  return Array.isArray(value) && value.every((palette) => palette && typeof palette.id === "string" && typeof palette.name === "string" && Array.isArray(palette.colours) && palette.colours.every(normaliseHex));
}

export function validateJournal(value) {
  return Array.isArray(value) && value.every((entry) => entry && typeof entry.id === "string" && typeof entry.name === "string" && ["idea","gathering","building","completed"].includes(entry.status));
}

export function validateObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function removeById(collection, id) {
  return Array.isArray(collection) ? collection.filter((item) => item?.id !== id) : [];
}

export function buildChecklistText(build, summary) {
  return [
    `${build.name} — ${build.status.toUpperCase()} PLAN`,
    `${summary.percent}% gathered`,
    "",
    ...summary.rows.map((item) => `[${item.complete ? "x" : " "}] ${item.name}: ${item.owned}/${item.required} (${item.remaining} remaining)`),
    "",
    "Quantities are conceptual estimates. Confirm them in-game.",
  ].join("\n");
}

export function completedTutorialSteps(currentStep, total) {
  const safeTotal = Math.max(0, Number(total) || 0);
  return clamp(Math.floor(Number(currentStep) || 0), 0, Math.max(0, safeTotal - 1));
}
