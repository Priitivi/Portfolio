export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

export const PHYSICS = Object.freeze({
  gravity: 2250,
  maxFallSpeed: 1180,
  walkSpeed: 285,
  runSpeed: 410,
  groundAcceleration: 3100,
  airAcceleration: 1850,
  groundFriction: 3600,
  airFriction: 620,
  jumpSpeed: 760,
  jumpCutGravity: 2.25,
  coyoteTime: 0.105,
  jumpBuffer: 0.13,
  playerWidth: 30,
  playerHeight: 46,
});

export const SHAKE_MAX = 4.5;
export const SHAKE_PRESETS = Object.freeze({
  landing: { amplitude: 0.22, decay: 18 },
  checkpoint: { amplitude: 0.5, decay: 12 },
  jumpPad: { amplitude: 0.9, decay: 14 },
  hazard: { amplitude: 1.25, decay: 15 },
  gravity: { amplitude: 1.5, decay: 16 },
  collapse: { amplitude: 2.2, decay: 18 },
  death: { amplitude: 3.8, decay: 19 },
  major: { amplitude: 4.5, decay: 23 },
});

export const SAVE_KEY = "priit-deceptive-trial-v1";
export const CONTROL_KEYS = ["left", "right", "jump", "run", "pause"];

export const DEFAULT_BINDINGS = Object.freeze({
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  jump: ["Space", "ArrowUp", "KeyW"],
  run: ["ShiftLeft", "ShiftRight"],
  pause: ["Escape", "KeyP"],
});

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const rectsOverlap = (a, b) => (
  a.x < b.x + b.w
  && a.x + a.w > b.x
  && a.y < b.y + b.h
  && a.y + a.h > b.y
);

export const formatTime = (seconds = 0) => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remainder = safe - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${remainder.toFixed(2).padStart(5, "0")}`;
};
