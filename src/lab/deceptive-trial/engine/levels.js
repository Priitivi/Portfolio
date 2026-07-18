import { parsePlatform } from "./collision.js";

const GROUND_Y = 640;
const p = (x, y, w, h = 28, extra = {}) => ({ x, y, w, h, ...extra });
const ground = (x, w, extra = {}) => p(x, GROUND_Y, w, 100, { type: "ground", ...extra });
const spike = (x, y = 612, w = 42, extra = {}) => ({ x, y, w, h: 28, type: "spikes", active: true, ...extra });
const sign = (id, x, text, honest = true) => ({ id, x, y: 560, w: 42, h: 80, text, honest });
const mote = (id, x, y) => ({ id, x, y, w: 22, h: 22, type: "mote", active: true });
const checkpoint = (id, x, y = 560, fake = false) => ({ id, x, y, w: 34, h: 80, fake, active: true });
const goal = (x, y = 548, extra = {}) => ({ x, y, w: 60, h: 92, active: true, ...extra });
const secret = (id, x, y, label = "A page the Trial forgot to hide.") => ({ id, x, y, w: 34, h: 34, label, active: true });
const trigger = (id, x, y, w, h, action, extra = {}) => ({ id, x, y, w, h, action, once: true, active: true, ...extra });

export const levels = [
  {
    id: "kindly-beginning", number: 1, name: "A Kindly Beginning", subtitle: "The rules are exactly what they seem.",
    width: 2100, start: { x: 110, y: 570 }, mood: "dawn", weather: "pollen",
    platforms: [ground(0, 470), ground(560, 350), ground(1010, 460), ground(1580, 520), p(680, 535, 130), p(1210, 510, 145), p(1720, 500, 130)],
    hazards: [spike(470, 612, 90), spike(910, 612, 100), spike(1470, 612, 110)],
    signs: [sign("welcome", 180, "ARROWS or A/D to move. SPACE to jump.\nNothing dangerous is pretending to be safe. Yet.")],
    collectibles: [mote("kind-1", 735, 490), mote("kind-2", 1270, 465)],
    checkpoints: [checkpoint("kind-cp", 1080)], goal: goal(1980),
    secrets: [secret("kind-secret", 28, 592, "You checked behind the beginning. Sensible.")],
    triggers: [trigger("wrong-way", 0, 500, 75, 150, "wrongWay")], decorations: [{ type: "tree", x: 350 }, { type: "ruin", x: 1510 }],
  },
  {
    id: "borrowed-time", number: 2, name: "Borrowed Time", subtitle: "Some floors are only lending you their confidence.",
    width: 2350, start: { x: 90, y: 570 }, mood: "dawn", weather: "leaves",
    platforms: [ground(0, 390), ground(980, 320), ground(1900, 450),
      p(430, 570, 125, 24, { type: "collapse", collapseDelay: .75 }), p(590, 525, 125, 24, { type: "collapse", collapseDelay: .65 }),
      p(750, 565, 125, 24, { type: "collapse", collapseDelay: .55 }), p(1340, 560, 130, 24, { type: "collapse", collapseDelay: .55 }),
      p(1510, 505, 130, 24, { type: "collapse", collapseDelay: .45 }), p(1680, 555, 130, 24, { type: "collapse", collapseDelay: .4 })],
    hazards: [spike(390, 612, 590), spike(1300, 612, 600)], signs: [sign("borrowed-sign", 170, "Cracked stone collapses.\nIt is polite enough to wait until you land.")],
    collectibles: [mote("borrow-1", 645, 480), mote("borrow-2", 1570, 460)], checkpoints: [checkpoint("borrow-cp", 1060)], goal: goal(2240),
    secrets: [secret("borrow-secret", 1145, 595, "A note reads: COLLAPSE DELAY: ALMOST ENOUGH.")], triggers: [], decorations: [{ type: "arch", x: 1060 }],
  },
  {
    id: "generous-offer", number: 3, name: "A Generous Offer", subtitle: "Free things are rarely free. Shiny things are worse.",
    width: 2400, start: { x: 100, y: 570 }, mood: "gold", weather: "pollen",
    platforms: [ground(0, 720), ground(800, 500), ground(1420, 410), ground(1940, 460), p(1050, 515, 150), p(1620, 520, 160)],
    hazards: [spike(720, 612, 80), spike(1300, 612, 120), spike(1830, 612, 110), { id: "gift-spike", type: "fallingSpike", x: 594, y: 90, w: 56, h: 78, active: true, dormant: true }],
    signs: [sign("gift-sign", 260, "Complimentary courage mote ahead.\nThe ceiling has signed a non-interference agreement.", false)],
    collectibles: [mote("gift-bait", 610, 555), mote("gift-2", 1105, 470), mote("gift-3", 1690, 475)], checkpoints: [checkpoint("gift-cp", 1480)], goal: goal(2290),
    secrets: [secret("gift-secret", 860, 595, "An invoice for one complimentary courage mote.")],
    triggers: [trigger("gift-drop", 555, 420, 130, 220, "activateHazard", { target: "gift-spike", dishonestSign: true })], decorations: [{ type: "bell", x: 615 }],
  },
  {
    id: "fine-print", number: 4, name: "Read Carefully", subtitle: "The sign is telling the truth. Unfortunately.",
    width: 2450, start: { x: 100, y: 570 }, mood: "gold", weather: "wind",
    platforms: [ground(0, 520), p(520, 600, 510, 40, { id: "run-bridge", type: "bridge" }), ground(1030, 510), p(1580, 560, 150), p(1780, 510, 140), ground(1980, 470)],
    hazards: [spike(520, 612, 510, { id: "bridge-pit", active: false }), spike(1540, 612, 440)],
    signs: [sign("run-sign", 230, "RUN ACROSS THE BRIDGE.\nWalking is prohibited for structural reasons.", false), sign("truth-sign", 1130, "Technically, it only breaks when you run.")],
    collectibles: [mote("careful-1", 750, 555), mote("careful-2", 1840, 465)], checkpoints: [checkpoint("careful-cp", 1110)], goal: goal(2340),
    secrets: [secret("careful-secret", 930, 555, "A tiny plaque: Maximum speed 350. The large sign covered it.")],
    triggers: [trigger("run-break", 520, 500, 510, 140, "breakBridgeIfRunning", { target: "run-bridge", repeat: true, once: false, dishonestSign: true })], decorations: [{ type: "bridge", x: 520 }],
  },
  {
    id: "blind-corner", number: 5, name: "The Blind Corner", subtitle: "The camera would never keep a secret from you.",
    width: 2600, start: { x: 100, y: 570 }, mood: "blue", weather: "rain",
    platforms: [ground(0, 650), ground(790, 360), ground(1270, 520), ground(1900, 700), p(610, 510, 110), p(1180, 535, 90), p(1640, 490, 150)],
    hazards: [spike(650, 612, 140), spike(1150, 612, 120), spike(1790, 612, 110), { id: "rolling-ruin", type: "boulder", x: 1530, y: 300, w: 92, h: 92, active: true, dormant: true, vx: -430 }],
    signs: [sign("corner-sign", 220, "The path ahead is fully visible.\nPlease ignore the decorative moon."), sign("look-sign", 1340, "Sometimes the background is just waiting its turn.", false)],
    collectibles: [mote("blind-1", 665, 465), mote("blind-2", 1695, 445)], checkpoints: [checkpoint("blind-cp", 1320)], goal: goal(2490),
    secrets: [secret("blind-secret", 2010, 595, "A moon-shaped production note: foreground after cue 17.")],
    triggers: [trigger("camera-cue", 1410, 390, 170, 250, "activateHazard", { target: "rolling-ruin" })], decorations: [{ type: "moon", x: 1580 }, { type: "ruin", x: 2130 }],
  },
  {
    id: "matter-of-weight", number: 6, name: "A Matter of Weight", subtitle: "The wind has revised the laws of motion.",
    width: 2700, start: { x: 100, y: 570 }, mood: "blue", weather: "wind",
    platforms: [ground(0, 470), ground(920, 360), ground(1760, 420), ground(2360, 340), p(530, 570, 130, 24, { type: "jumpPad", power: 1 }), p(760, 480, 130), p(1320, 530, 150), p(1540, 445, 130), p(2200, 520, 120)],
    hazards: [spike(470, 612, 450), spike(1280, 612, 480), spike(2180, 612, 180)],
    signs: [sign("weight-sign", 190, "Blue grass means a helpful tailwind.\nIt has never changed its mind mid-jump.", false)],
    collectibles: [mote("weight-1", 815, 430), mote("weight-2", 1600, 400), mote("weight-3", 2250, 470)], checkpoints: [checkpoint("weight-cp", 1000)], goal: goal(2590),
    secrets: [secret("weight-secret", 1815, 595, "Wind complaint form. Reason: changed without notice.")],
    triggers: [trigger("wind-on", 500, 300, 360, 340, "wind", { value: 520 }), trigger("wind-flip", 705, 300, 180, 340, "wind", { value: -620 }), trigger("wind-off", 905, 300, 80, 340, "wind", { value: 0 }), trigger("late-wind", 1440, 300, 280, 340, "wind", { value: 440 }), trigger("late-flip", 1600, 300, 150, 340, "wind", { value: -500 })], decorations: [{ type: "windmill", x: 720 }],
  },
  {
    id: "polite-architecture", number: 7, name: "Polite Architecture", subtitle: "The room moves only when you are not looking.",
    width: 2550, start: { x: 110, y: 570 }, mood: "violet", weather: "ash",
    platforms: [ground(0, 450), ground(1050, 410), ground(2050, 500), p(500, 560, 150, 24, { type: "shy", shyOffset: -130 }), p(760, 485, 150, 24, { type: "shy", shyOffset: 160 }), p(1510, 540, 150, 24, { type: "shy", shyOffset: -160 }), p(1800, 465, 150, 24, { type: "shy", shyOffset: 130 })],
    hazards: [spike(450, 612, 600), spike(1460, 612, 590)], enemies: [{ id: "sleeper", type: "sleeper", x: 1240, y: 592, w: 44, h: 48, active: true }],
    signs: [sign("polite-sign", 180, "Please face the furniture while it is moving.\nIt gets self-conscious.")],
    collectibles: [mote("polite-1", 820, 440), mote("polite-2", 1860, 420)], checkpoints: [checkpoint("polite-cp", 1110)], goal: goal(2440),
    secrets: [secret("polite-secret", 2090, 595, "You found the room while it was looking away.")], triggers: [], decorations: [{ type: "eyes", x: 860 }, { type: "eyes", x: 1750 }],
  },
  {
    id: "gravity-optional", number: 8, name: "Gravity Is Optional", subtitle: "Please remain seated while reality rotates.",
    width: 2700, start: { x: 100, y: 570 }, mood: "violet", weather: "stars",
    platforms: [ground(0, 620), p(620, 80, 520, 34, { type: "ceiling" }), ground(1140, 370), p(1510, 80, 500, 34, { type: "ceiling" }), ground(2010, 690), p(760, 235, 110), p(1710, 265, 120)],
    hazards: [spike(720, 612, 420), { x: 620, y: 80, w: 70, h: 30, type: "ceilingSpikes", active: true }, spike(1610, 612, 400), { x: 1940, y: 114, w: 70, h: 30, type: "ceilingSpikes", active: true }],
    signs: [sign("gravity-sign", 190, "Gravity reversal ahead.\nThe second reversal is almost certainly labelled.")],
    collectibles: [mote("gravity-1", 850, 145), mote("gravity-2", 1770, 145)], checkpoints: [checkpoint("gravity-cp", 1200)], goal: goal(2590),
    secrets: [secret("gravity-secret", 1040, 125, "A ceiling note: DOWN is a local convention.")],
    triggers: [trigger("gravity-up", 610, 0, 90, 640, "gravity", { value: -1 }), trigger("gravity-down", 1070, 0, 100, 640, "gravity", { value: 1 }), trigger("gravity-up-2", 1500, 0, 90, 640, "gravity", { value: -1 }), trigger("gravity-down-2", 1960, 0, 100, 640, "gravity", { value: 1 })], decorations: [{ type: "orrery", x: 1330 }],
  },
  {
    id: "helpful-guide", number: 9, name: "The Helpful Guide", subtitle: "He has definitely tested this.",
    width: 2600, start: { x: 100, y: 570 }, mood: "green", weather: "mist",
    platforms: [ground(0, 720), ground(860, 480), ground(1460, 460), ground(2060, 540), p(730, 525, 100), p(1350, 490, 95), p(1940, 520, 95)],
    hazards: [spike(720, 612, 140), spike(1340, 612, 120), spike(1920, 612, 140)], npcs: [{ id: "guide", x: 335, y: 574, w: 38, h: 66, text: "I have definitely tested this.\nThe emerald lantern is a checkpoint.\nProbably." }],
    signs: [sign("guide-sign", 170, "TRUSTED GUIDE →", false)], collectibles: [mote("guide-1", 775, 480), mote("guide-2", 1990, 475)],
    checkpoints: [checkpoint("fake-cp", 1030, 560, true), checkpoint("guide-real", 1540)], goal: goal(2490),
    secrets: [secret("developer-room", 2220, 595, "DEVELOPER ROOM: We tested the first three metres extensively.")],
    triggers: [trigger("fake-floor", 990, 500, 120, 140, "fakeCheckpoint", { target: "fake-cp" })], decorations: [{ type: "lanterns", x: 1030 }],
  },
  {
    id: "other-you", number: 10, name: "The Other You", subtitle: "The mirror is accurate. Your controls are not.",
    width: 2700, start: { x: 100, y: 570 }, mood: "silver", weather: "rain",
    platforms: [ground(0, 620), ground(780, 460), ground(1380, 440), ground(1980, 720), p(640, 525, 100), p(1260, 480, 100), p(1840, 520, 100)],
    hazards: [spike(620, 612, 160), spike(1240, 612, 140), spike(1820, 612, 160)],
    signs: [sign("mirror-sign", 190, "Mirrors reverse images, not intentions.\nContinue right as normal.", false)], collectibles: [mote("mirror-1", 685, 480), mote("mirror-2", 1890, 475)],
    checkpoints: [checkpoint("mirror-cp", 1440)], goal: goal(2590), secrets: [secret("mirror-secret", 1440, 595, "Your reflection writes with the correct hand.")],
    triggers: [trigger("mirror-enter", 810, 300, 420, 340, "reverseControls", { value: true }), trigger("mirror-exit", 1220, 300, 100, 340, "reverseControls", { value: false }), trigger("mirror-enter-2", 1530, 300, 390, 340, "reverseControls", { value: true }), trigger("mirror-exit-2", 1910, 300, 100, 340, "reverseControls", { value: false })], decorations: [{ type: "mirror", x: 820 }, { type: "mirror", x: 1580 }],
  },
  {
    id: "exit-interview", number: 11, name: "Exit Interview", subtitle: "Congratulations. Please disregard the next congratulations.",
    width: 2800, start: { x: 100, y: 570 }, mood: "red", weather: "ash",
    platforms: [ground(0, 760), ground(910, 450), ground(1500, 500), ground(2160, 640), p(790, 520, 90), p(1390, 470, 95), p(2040, 520, 95), p(2510, 470, 120)],
    hazards: [spike(760, 612, 150), spike(1360, 612, 140), spike(2000, 612, 160)], signs: [sign("exit-sign", 190, "FINAL EXIT: 35 metres.\nCeremonial confetti has been armed.", false)],
    collectibles: [mote("exit-1", 835, 475), mote("exit-2", 2090, 475)], checkpoints: [checkpoint("exit-cp", 1550)],
    goal: goal(2680, 548, { id: "real-goal", active: false }), fakeGoals: [goal(650, 548, { id: "fake-goal", fake: true })],
    secrets: [secret("exit-secret", 2580, 425, "The exit clause: real door appears after false acceptance.")],
    triggers: [trigger("fake-exit", 640, 500, 90, 140, "fakeExit", { target: "real-goal" })], decorations: [{ type: "banners", x: 650 }],
  },
  {
    id: "deceptive-trial", number: 12, name: "The Deceptive Trial", subtitle: "You know every rule. That is the problem.",
    width: 3600, start: { x: 110, y: 570 }, mood: "night", weather: "storm",
    platforms: [ground(0, 520), p(520, 590, 400, 50, { id: "final-bridge", type: "bridge" }), ground(920, 390), p(1350, 540, 135, 24, { type: "collapse", collapseDelay: .5 }), p(1540, 480, 130, 24, { type: "shy", shyOffset: 130 }), ground(1740, 390), p(2130, 80, 520, 34, { type: "ceiling" }), ground(2650, 360), p(3060, 550, 140, 24, { type: "collapse", collapseDelay: .35 }), ground(3290, 310)],
    hazards: [spike(520, 612, 400, { id: "final-pit", active: false }), spike(1310, 612, 430), spike(2250, 612, 400), { id: "final-drop", type: "fallingSpike", x: 1020, y: 70, w: 60, h: 82, active: true, dormant: true }, { x: 2550, y: 114, w: 100, h: 30, type: "ceilingSpikes", active: true }, spike(3010, 612, 280)],
    signs: [sign("final-sign", 180, "Everything you learned applies.\nEvery exception has been removed for fairness.", false), sign("final-small", 2770, "No more tricks.\nWe ran out of budget.", false)],
    collectibles: [mote("final-1", 720, 545), mote("final-2", 1600, 430), mote("final-3", 2390, 150), mote("final-4", 3120, 500)], checkpoints: [checkpoint("final-cp-1", 980), checkpoint("final-cp-2", 2700)],
    goal: goal(3490), secrets: [secret("final-secret", 3340, 595, "The hidden ending: trust is not the absence of doubt. It is proceeding anyway.")],
    triggers: [trigger("final-bridge-break", 520, 480, 400, 160, "breakBridgeIfRunning", { target: "final-bridge", once: false }), trigger("final-drop-cue", 960, 390, 180, 250, "activateHazard", { target: "final-drop" }), trigger("final-wind", 1320, 300, 390, 340, "wind", { value: -430 }), trigger("final-gravity", 2120, 0, 90, 640, "gravity", { value: -1 }), trigger("final-gravity-end", 2580, 0, 90, 640, "gravity", { value: 1 }), trigger("final-reverse", 2860, 300, 300, 340, "reverseControls", { value: true }), trigger("final-normal", 3180, 300, 80, 340, "reverseControls", { value: false })], decorations: [{ type: "all", x: 1750 }, { type: "banners", x: 3370 }],
  },
];

export function parseLevel(raw) {
  if (!raw || !Number.isInteger(raw.number) || !raw.id || !raw.name || raw.width < 1280) throw new Error("Invalid level metadata");
  if (!raw.start || !Number.isFinite(raw.start.x) || !Number.isFinite(raw.start.y)) throw new Error(`Invalid start in ${raw.id}`);
  const ids = new Set();
  const trackId = (entity) => {
    if (!entity.id) return;
    if (ids.has(entity.id)) throw new Error(`Duplicate entity id ${entity.id} in ${raw.id}`);
    ids.add(entity.id);
  };
  const normalized = {
    hazards: [], triggers: [], signs: [], collectibles: [], checkpoints: [], secrets: [], enemies: [], npcs: [], decorations: [], fakeGoals: [],
    ...raw,
    platforms: raw.platforms.map(parsePlatform),
  };
  [normalized.platforms, normalized.hazards, normalized.triggers, normalized.signs, normalized.collectibles, normalized.checkpoints, normalized.secrets, normalized.enemies, normalized.npcs, normalized.fakeGoals].flat().forEach(trackId);
  return normalized;
}

export function loadLevel(index) {
  const raw = levels[index];
  if (!raw) throw new Error(`Unknown level ${index}`);
  return structuredClone(parseLevel(raw));
}
