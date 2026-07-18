import { PHYSICS, SHAKE_MAX, SHAKE_PRESETS, clamp, rectsOverlap } from "./constants.js";

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

export function armHazard(hazard, trigger = {}) {
  if (!hazard) return null;
  const warning = trigger.activationDelay ?? hazard.activationDelay ?? 0;
  hazard.dormant = false;
  hazard.warningTimer = warning;
  hazard.warningDuration = warning;
  return warning;
}

export function isVictory(player, goal) {
  return Boolean(goal?.active && rectsOverlap(player, goal));
}

export function nextUnlockedLevel(currentUnlocked, completedIndex, levelCount = 12) {
  return Math.max(currentUnlocked, Math.min(levelCount - 1, completedIndex + 1));
}

export function getJumpApexHeight(physics = PHYSICS) {
  return (physics.jumpSpeed ** 2) / (2 * physics.gravity);
}

export function getJumpRange(speed, landingHeight = 0, physics = PHYSICS) {
  const discriminant = physics.jumpSpeed ** 2 - 2 * physics.gravity * landingHeight;
  if (discriminant < 0) return 0;
  const descendingTime = (physics.jumpSpeed + Math.sqrt(discriminant)) / physics.gravity;
  return Math.abs(speed) * descendingTime;
}

export function getJumpAscentTime(height, physics = PHYSICS) {
  const discriminant = physics.jumpSpeed ** 2 - 2 * physics.gravity * height;
  if (discriminant < 0) return Infinity;
  return (physics.jumpSpeed - Math.sqrt(discriminant)) / physics.gravity;
}

export function mergeShakeImpact(currentShake, currentDecay, kind) {
  const preset = SHAKE_PRESETS[kind];
  if (!preset) return { shake: currentShake, decay: currentDecay };
  return {
    shake: clamp(Math.max(currentShake, preset.amplitude), 0, SHAKE_MAX),
    decay: preset.amplitude >= currentShake ? preset.decay : currentDecay,
  };
}
