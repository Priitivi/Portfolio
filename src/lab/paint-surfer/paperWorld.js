export const PAPER_WORLD_WIDTH = 5400;
export const PAPER_GROUND_Y = 620;
export const MAX_PAINT_STROKES = 42;
export const MAX_POINTS_PER_STROKE = 90;

export const paperLandmarks = [
  {
    id: "sun-garden",
    number: "01",
    title: "Wake the sun garden",
    shortTitle: "Sun garden",
    x: 930,
    radius: 360,
    goal: 16,
    accent: "#ff5f91",
    description: "Paint the sleeping sun and let the paper flowers remember which way to grow.",
  },
  {
    id: "paper-giant",
    number: "02",
    title: "Give the giant a dream",
    shortTitle: "Paper giant",
    x: 2380,
    radius: 390,
    goal: 18,
    accent: "#35d9e8",
    description: "The giant has been waiting in outline. Draw enough colour nearby to restart its heart.",
  },
  {
    id: "memory-city",
    number: "03",
    title: "Switch the city back on",
    shortTitle: "Memory city",
    x: 3740,
    radius: 410,
    goal: 20,
    accent: "#9f72ff",
    description: "Build a route through the unfinished skyline and return light to its windows.",
  },
  {
    id: "last-door",
    number: "04",
    title: "Draw the last door",
    shortTitle: "Last door",
    x: 4920,
    radius: 350,
    goal: 22,
    accent: "#c8ff36",
    description: "There was never an exit here. Paint one anyway.",
  },
];

export const PAPER_STORY_GOAL = paperLandmarks.reduce((total, landmark) => total + landmark.goal, 0);

export function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function getPaperMovement(activeCodes) {
  const has = (code) => activeCodes?.has?.(code) ?? false;
  return {
    horizontal: Number(has("KeyD") || has("ArrowRight")) - Number(has("KeyA") || has("ArrowLeft")),
    jump: has("KeyW") || has("ArrowUp") || has("Space"),
    duck: has("KeyS") || has("ArrowDown"),
    sprint: has("ShiftLeft") || has("ShiftRight"),
    dash: has("KeyJ") || has("PaintDash"),
  };
}

export function paintCellKey(x, y, cellSize = 38) {
  return `${Math.round(x / cellSize)}:${Math.round(y / cellSize)}`;
}

export function isPointNearLandmark(point, landmark) {
  if (!point || !landmark) return false;
  const horizontalDistance = Math.abs(point.x - landmark.x);
  return horizontalDistance <= landmark.radius && point.y >= PAPER_GROUND_Y - 540 && point.y <= PAPER_GROUND_Y + 24;
}

export function createPaperStoryStatus(paintedCounts = []) {
  const landmarks = paperLandmarks.map((landmark, index) => {
    const painted = clamp(Number(paintedCounts[index]) || 0, 0, landmark.goal);
    return {
      ...landmark,
      painted,
      progress: Math.round((painted / landmark.goal) * 100),
      complete: painted >= landmark.goal,
    };
  });
  const painted = landmarks.reduce((total, landmark) => total + landmark.painted, 0);
  return {
    landmarks,
    progress: Math.round((painted / PAPER_STORY_GOAL) * 100),
    complete: landmarks.every((landmark) => landmark.complete),
  };
}

export function screenToWorld(point, cameraX, scale, groundScreenY) {
  return {
    x: point.x / scale + cameraX,
    y: (point.y - groundScreenY) / scale + PAPER_GROUND_Y,
  };
}

export function segmentYAtX(start, end, x) {
  const minimum = Math.min(start.x, end.x);
  const maximum = Math.max(start.x, end.x);
  const width = end.x - start.x;
  if (x < minimum || x > maximum || Math.abs(width) < 0.001) return null;
  const slope = (end.y - start.y) / width;
  if (Math.abs(slope) > 1.35) return null;
  return start.y + (x - start.x) * slope;
}
