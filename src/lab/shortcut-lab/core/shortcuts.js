export const SHORTCUT_RISKS = {
  "Ctrl+w": "browser-reserved",
  "Ctrl+t": "browser-reserved",
  "Ctrl+Shift+t": "browser-reserved",
  "Ctrl+Tab": "browser-reserved",
  "Ctrl+Shift+Tab": "browser-reserved",
  "Ctrl+l": "browser-reserved",
  "Ctrl+r": "browser-reserved",
  F5: "browser-reserved",
  "Alt+F4": "os-reserved",
  "Alt+Tab": "os-reserved",
  "Meta+d": "os-reserved",
  "Meta+l": "os-reserved",
  "Ctrl+Shift+Escape": "os-reserved",
  "Meta+q": "os-reserved",
};

const KEY_ALIASES = {
  " ": "Space",
  Esc: "Escape",
  Up: "ArrowUp",
  Down: "ArrowDown",
  Left: "ArrowLeft",
  Right: "ArrowRight",
  Del: "Delete",
  OS: "Meta",
};

export function normalizeKey(key) {
  const aliased = KEY_ALIASES[key] || key;
  return aliased.length === 1 ? aliased.toLowerCase() : aliased;
}

export function normalizeShortcutEvent(event) {
  return {
    key: normalizeKey(event.key),
    ctrl: Boolean(event.ctrlKey),
    alt: Boolean(event.altKey),
    shift: Boolean(event.shiftKey),
    meta: Boolean(event.metaKey),
  };
}

function expectedForPlatform(shortcut, platform = "windows") {
  if (platform === "mac" && shortcut.ctrl && !shortcut.meta) {
    return { ...shortcut, ctrl: false, meta: true };
  }
  return shortcut;
}

export function shortcutMatches(input, expected, platform = "windows") {
  const target = expectedForPlatform(expected, platform);
  return normalizeKey(input.key) === normalizeKey(target.key)
    && Boolean(input.ctrl) === Boolean(target.ctrl)
    && Boolean(input.alt) === Boolean(target.alt)
    && Boolean(input.shift) === Boolean(target.shift)
    && Boolean(input.meta) === Boolean(target.meta);
}

export function matchChallengeShortcut(input, challenge, platform = "windows") {
  const primary = challenge.trainingShortcut || challenge.expectedShortcut;
  return shortcutMatches(input, primary, platform)
    || (challenge.acceptedShortcuts || []).some((shortcut) => shortcutMatches(input, shortcut, platform));
}

export function diagnoseShortcut(input, expected, platform = "windows") {
  const target = expectedForPlatform(expected, platform);
  if (normalizeKey(input.key) === normalizeKey(target.key)) return "Wrong modifier";
  const expectedMods = [target.ctrl, target.alt, target.shift, target.meta].filter(Boolean).length;
  const actualMods = [input.ctrl, input.alt, input.shift, input.meta].filter(Boolean).length;
  if (Math.abs(expectedMods - actualMods) <= 1) return "Nearly";
  return "Try again";
}

export function shortcutToId(shortcut, platform = "windows") {
  const value = expectedForPlatform(shortcut, platform);
  const parts = [];
  if (value.ctrl) parts.push("Ctrl");
  if (value.alt) parts.push("Alt");
  if (value.shift) parts.push("Shift");
  if (value.meta) parts.push("Meta");
  parts.push(normalizeKey(value.key));
  return parts.join("+");
}

export function getShortcutRisk(shortcut) {
  return SHORTCUT_RISKS[shortcutToId(shortcut)] || "safe";
}

const DISPLAY_KEYS = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Backspace: "Backspace",
  Delete: "Delete",
  Escape: "Esc",
  "`": "`",
  "/": "/",
};

export function shortcutParts(shortcut, platform = "windows") {
  const value = expectedForPlatform(shortcut, platform);
  const parts = [];
  if (value.ctrl) parts.push("Ctrl");
  if (value.alt) parts.push(platform === "mac" ? "⌥" : "Alt");
  if (value.shift) parts.push("Shift");
  if (value.meta) parts.push(platform === "mac" ? "⌘" : "Win");
  const key = normalizeKey(value.key);
  parts.push(DISPLAY_KEYS[key] || (key.length === 1 ? key.toUpperCase() : key));
  return parts;
}

export function formatShortcut(shortcut, platform = "windows") {
  return shortcutParts(shortcut, platform).join(" + ");
}

export function isEditableTarget(target) {
  if (!target || !target.tagName) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || Boolean(target.isContentEditable);
}

export function canSafelyCapture(challenge) {
  return challenge.risk === "safe" || Boolean(challenge.trainingShortcut);
}

export function detectPlatform(navigatorLike = globalThis.navigator) {
  const value = `${navigatorLike?.userAgentData?.platform || ""} ${navigatorLike?.platform || ""}`.toLowerCase();
  return value.includes("mac") ? "mac" : "windows";
}
