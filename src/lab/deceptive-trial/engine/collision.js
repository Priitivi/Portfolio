import { rectsOverlap } from "./constants.js";

export function resolveHorizontal(player, platforms) {
  let collided = null;
  for (const platform of platforms) {
    if (!platform.solid || platform.oneWay || !rectsOverlap(player, platform)) continue;
    if (player.vx > 0) player.x = platform.x - player.w;
    else if (player.vx < 0) player.x = platform.x + platform.w;
    player.vx = 0;
    collided = platform;
  }
  return collided;
}

export function resolveVertical(player, platforms, previousY, gravityDirection = 1) {
  let landed = null;
  for (const platform of platforms) {
    if (!platform.solid || !rectsOverlap(player, platform)) continue;

    if (gravityDirection > 0 && player.vy >= 0) {
      const previousBottom = previousY + player.h;
      if (platform.oneWay && previousBottom > platform.y + 7) continue;
      player.y = platform.y - player.h;
      player.vy = 0;
      landed = platform;
    } else if (gravityDirection < 0 && player.vy <= 0) {
      const previousTop = previousY;
      const platformBottom = platform.y + platform.h;
      if (platform.oneWay && previousTop < platformBottom - 7) continue;
      player.y = platformBottom;
      player.vy = 0;
      landed = platform;
    } else if (gravityDirection > 0 && player.vy < 0 && !platform.oneWay) {
      player.y = platform.y + platform.h;
      player.vy = 0;
    } else if (gravityDirection < 0 && player.vy > 0 && !platform.oneWay) {
      player.y = platform.y - player.h;
      player.vy = 0;
    }
  }
  return landed;
}

export function findOverlaps(subject, entities) {
  return entities.filter((entity) => entity.active !== false && rectsOverlap(subject, entity));
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function parsePlatform(raw, index = 0) {
  if (!raw || !Number.isFinite(raw.x) || !Number.isFinite(raw.y) || raw.w <= 0 || raw.h <= 0) {
    throw new Error(`Invalid platform at index ${index}`);
  }
  return {
    id: raw.id || `platform-${index}`,
    type: "stone",
    solid: true,
    active: true,
    ...raw,
  };
}
