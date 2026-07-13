export const PAINT_GOAL = 140;

export function paintCellKey(x, z, cellSize = 1.15) {
  return `${Math.round(x / cellSize)}:${Math.round(z / cellSize)}`;
}

export function calculatePaintProgress(paintedCells, goal = PAINT_GOAL) {
  if (!Number.isFinite(paintedCells) || !Number.isFinite(goal) || goal <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((paintedCells / goal) * 100)));
}

export function clampToCanvas(value, limit = 23) {
  return Math.max(-limit, Math.min(limit, value));
}

export function getMovementAxes(activeCodes) {
  const has = (code) => activeCodes?.has?.(code) ?? false;
  return {
    right: Number(has("KeyD") || has("ArrowRight")) - Number(has("KeyA") || has("ArrowLeft")),
    forward: Number(has("KeyW") || has("ArrowUp")) - Number(has("KeyS") || has("ArrowDown")),
  };
}
