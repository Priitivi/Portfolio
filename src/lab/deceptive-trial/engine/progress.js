import { DEFAULT_BINDINGS, SAVE_KEY } from "./constants.js";

export const achievements = [
  ["first-fall", "First Lesson", "Die once. The Trial has begun."],
  ["ten-deaths", "Still Learning", "Reach 10 deaths."],
  ["fifty-deaths", "Persistent", "Reach 50 deaths."],
  ["hundred-deaths", "Trust Issues", "Reach 100 deaths."],
  ["first-step", "One Small Step", "Complete the first level."],
  ["level-3", "Bait Refused", "Complete The Generous Offer."],
  ["level-5", "Peripheral Vision", "Complete The Blind Corner."],
  ["level-6", "Terminal Velocity", "Complete A Matter of Weight."],
  ["level-8", "Head Over Heels", "Complete Gravity Is Optional."],
  ["level-10", "Mirror, Mirror", "Complete The Other You."],
  ["level-11", "Read the Fine Print", "Complete Exit Interview."],
  ["finish", "Trial Complete", "Reach the honest ending."],
  ["speedrunner", "No Time To Think", "Clear any level in under 25 seconds."],
  ["patient", "Suspiciously Patient", "Spend five minutes in one level."],
  ["wrong-way", "Wrong Way", "Find something by walking left."],
  ["secret-1", "Loose Brick", "Find your first secret."],
  ["secrets-3", "Curious", "Find three secrets."],
  ["all-secrets", "Completionist", "Find every campaign secret."],
  ["no-death", "Untouchable", "Clear a level without dying."],
  ["sign-reader", "Fine Print", "Read five different signs."],
  ["never-trust-signs", "Never Trust Signs", "Survive a dishonest sign."],
  ["fake-checkpoint", "Quality Assurance", "Activate a fake checkpoint."],
  ["fake-exit", "Premature Celebration", "Enter a fake exit."],
  ["collector", "Shiny Object Syndrome", "Collect ten motes."],
  ["anti-collector", "Restraint", "Leave every mote in a level untouched."],
  ["jumper", "Knees of Steel", "Jump 250 times."],
  ["runner", "Full Tilt", "Run for a total of 60 seconds."],
  ["airtime", "Long Way Down", "Stay airborne for two seconds."],
  ["checkpoint", "A Small Mercy", "Reach a real checkpoint."],
  ["developer-room", "Behind the Curtain", "Find the developer room."],
  ["lie-survivor", "I Knew That", "Survive a trap without dying."],
  ["all-levels", "Twelve Exceptions", "Complete all twelve levels."],
].map(([id, title, description]) => ({ id, title, description }));

export const DEFAULT_SAVE = {
  version: 1,
  currentLevel: 0,
  unlockedLevel: 0,
  completedLevels: [],
  deaths: 0,
  jumps: 0,
  playtime: 0,
  runTime: 0,
  secrets: [],
  collected: 0,
  signsRead: [],
  achievements: [],
  bestTimes: {},
  bestTotalTime: null,
  settings: {
    masterVolume: 0.7,
    musicVolume: 0.45,
    effectsVolume: 0.75,
    reducedShake: false,
    reducedFlashing: false,
    colourblind: false,
    bindings: DEFAULT_BINDINGS,
  },
};

const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULT_SAVE));

export function parseSave(serialized) {
  const defaults = cloneDefaults();
  try {
    const candidate = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
    if (!candidate || Array.isArray(candidate) || typeof candidate !== "object") return defaults;
    const settings = candidate.settings && typeof candidate.settings === "object" ? candidate.settings : {};
    return {
      ...defaults,
      ...candidate,
      completedLevels: Array.isArray(candidate.completedLevels) ? candidate.completedLevels : [],
      secrets: Array.isArray(candidate.secrets) ? candidate.secrets : [],
      signsRead: Array.isArray(candidate.signsRead) ? candidate.signsRead : [],
      achievements: Array.isArray(candidate.achievements) ? candidate.achievements : [],
      bestTimes: candidate.bestTimes && typeof candidate.bestTimes === "object" ? candidate.bestTimes : {},
      settings: {
        ...defaults.settings,
        ...settings,
        bindings: { ...defaults.settings.bindings, ...(settings.bindings || {}) },
      },
    };
  } catch {
    return defaults;
  }
}

export function loadSave(storage = globalThis.localStorage) {
  try { return parseSave(storage?.getItem(SAVE_KEY)); } catch { return cloneDefaults(); }
}

export function persistSave(save, storage = globalThis.localStorage) {
  try { storage?.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch { return false; }
}

export function evaluateAchievements(save, context = {}) {
  const unlocked = new Set(save.achievements);
  const unlock = (id, condition) => { if (condition) unlocked.add(id); };
  const completed = new Set(save.completedLevels);

  unlock("first-fall", save.deaths >= 1);
  unlock("ten-deaths", save.deaths >= 10);
  unlock("fifty-deaths", save.deaths >= 50);
  unlock("hundred-deaths", save.deaths >= 100);
  unlock("first-step", completed.has(0));
  unlock("level-3", completed.has(2));
  unlock("level-5", completed.has(4));
  unlock("level-6", completed.has(5));
  unlock("level-8", completed.has(7));
  unlock("level-10", completed.has(9));
  unlock("level-11", completed.has(10));
  unlock("finish", completed.has(11));
  unlock("all-levels", completed.size >= 12);
  unlock("speedrunner", Object.values(save.bestTimes).some((time) => time < 25));
  unlock("patient", context.levelTime >= 300);
  unlock("wrong-way", context.wrongWay);
  unlock("secret-1", save.secrets.length >= 1);
  unlock("secrets-3", save.secrets.length >= 3);
  unlock("all-secrets", save.secrets.length >= 12);
  unlock("no-death", context.clearedWithoutDeath);
  unlock("sign-reader", save.signsRead.length >= 5);
  unlock("never-trust-signs", context.survivedDishonestSign);
  unlock("fake-checkpoint", context.fakeCheckpoint);
  unlock("fake-exit", context.fakeExit);
  unlock("collector", save.collected >= 10);
  unlock("anti-collector", context.clearedWithoutCollecting);
  unlock("jumper", save.jumps >= 250);
  unlock("runner", save.runTime >= 60);
  unlock("airtime", context.airtime >= 2);
  unlock("checkpoint", context.realCheckpoint);
  unlock("developer-room", context.developerRoom);
  unlock("lie-survivor", context.survivedTrap);
  return [...unlocked];
}

export function mergeProgress(save, update, context = {}) {
  const next = parseSave({ ...save, ...update });
  next.achievements = evaluateAchievements(next, context);
  return next;
}
