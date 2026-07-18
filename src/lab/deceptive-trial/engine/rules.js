import { PHYSICS, rectsOverlap } from "./constants.js";

export function activateCheckpoint(checkpoint) {
  if (!checkpoint || checkpoint.fake || checkpoint.activated) return null;
  checkpoint.activated = true;
  return {
    checkpointId: checkpoint.id,
    respawnPoint: {
      x: checkpoint.x + 46,
      y: checkpoint.y + checkpoint.h - PHYSICS.playerHeight,
    },
  };
}

export function shouldBreakBridge(playerVelocity, threshold = 340) {
  return Math.abs(playerVelocity) >= threshold;
}

export function canFireTrigger(trigger, firedIds, player) {
  if (!trigger?.active || !rectsOverlap(player, trigger)) return false;
  return trigger.once === false || !firedIds.has(trigger.id);
}

export function isVictory(player, goal) {
  return Boolean(goal?.active && rectsOverlap(player, goal));
}

export function nextUnlockedLevel(currentUnlocked, completedIndex, levelCount = 12) {
  return Math.max(currentUnlocked, Math.min(levelCount - 1, completedIndex + 1));
}
