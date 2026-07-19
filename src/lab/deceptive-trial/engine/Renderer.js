import { VIEW_HEIGHT, VIEW_WIDTH, clamp } from "./constants.js";

const palettes = {
  dawn: ["#d9bea2", "#f2d7b8", "#758c82", "#233c40", "#d68b63"],
  gold: ["#d9b66f", "#f2cf83", "#807552", "#283c38", "#d96a4b"],
  blue: ["#738b9b", "#b8c4c5", "#506773", "#1e303a", "#cc795f"],
  violet: ["#7c718c", "#b8a9b9", "#4c5268", "#202739", "#d66b6b"],
  green: ["#809985", "#c3c9a5", "#516b5d", "#1d3432", "#d07c55"],
  silver: ["#8e9ba1", "#ccd0cd", "#59646d", "#253039", "#d67668"],
  red: ["#9c625c", "#d8aaa0", "#624b51", "#292c34", "#f0a35e"],
  night: ["#343b59", "#69708c", "#303a53", "#131827", "#ee8d72"],
};

const roundedRect = (ctx, x, y, w, h, radius) => {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

const seeded = (value) => {
  const x = Math.sin(value * 999.31) * 43758.5453;
  return x - Math.floor(x);
};

export default class Renderer {
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.settings = settings;
    this.dpr = 1;
    this.prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }

  resize(dpr = 1) {
    this.dpr = clamp(dpr, 1, 2);
    this.canvas.width = Math.floor(VIEW_WIDTH * this.dpr);
    this.canvas.height = Math.floor(VIEW_HEIGHT * this.dpr);
  }

  setSettings(settings) { this.settings = settings; }

  render(world) {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const palette = palettes[world.level.mood] || palettes.dawn;
    this.drawSky(world, palette);
    ctx.save();
    const shake = this.settings.reducedShake || this.prefersReducedMotion ? 0 : world.shake;
    const shakeX = (Math.sin(world.time * 53) * .72 + Math.sin(world.time * 31) * .28) * shake;
    const shakeY = (Math.cos(world.time * 47) * .68 + Math.cos(world.time * 29) * .22) * shake * .58;
    ctx.translate(shakeX, shakeY);
    ctx.translate(-world.camera.x, -world.camera.y);
    this.drawBackDecor(world, palette);
    this.drawPlatforms(world, palette);
    this.drawEntities(world, palette);
    this.drawParticles(world);
    this.drawPlayer(world.player, palette, world.time);
    ctx.restore();
    this.drawVignette(world, palette);
  }

  drawSky(world, palette) {
    const { ctx } = this;
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(.58, palette[1]);
    gradient.addColorStop(1, palette[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.globalAlpha = .62;
    ctx.fillStyle = palette[4];
    ctx.beginPath();
    ctx.arc(VIEW_WIDTH * .76 - world.camera.x * .025, 135, world.level.mood === "night" ? 58 : 76, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    for (let layer = 0; layer < 3; layer += 1) {
      const base = 405 + layer * 64;
      const offset = -(world.camera.x * (.045 + layer * .055)) % 430;
      ctx.fillStyle = `${palette[2]}${["55", "88", "cc"][layer]}`;
      ctx.beginPath();
      ctx.moveTo(0, VIEW_HEIGHT);
      for (let x = offset - 430; x <= VIEW_WIDTH + 430; x += 215) {
        const height = 75 + seeded(x + layer * 91) * 115;
        ctx.quadraticCurveTo(x + 105, base - height, x + 215, base);
      }
      ctx.lineTo(VIEW_WIDTH, VIEW_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }
    this.drawWeather(world, palette);
  }

  drawWeather(world, palette) {
    const { ctx } = this;
    const type = world.level.weather;
    ctx.save();
    ctx.globalAlpha = type === "storm" ? .55 : .3;
    ctx.strokeStyle = type === "rain" || type === "storm" ? palette[1] : palette[3];
    ctx.fillStyle = palette[1];
    for (let i = 0; i < 42; i += 1) {
      const phase = (world.time * (type === "rain" || type === "storm" ? 420 : 26) + i * 89) % (VIEW_HEIGHT + 100);
      const x = (i * 173 - world.camera.x * .09 + Math.sin(i) * 43) % (VIEW_WIDTH + 60);
      if (type === "rain" || type === "storm") {
        ctx.beginPath(); ctx.moveTo(x, phase - 12); ctx.lineTo(x - 7, phase + 12); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(x, phase, 1.2 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  drawBackDecor(world, palette) {
    const { ctx } = this;
    const cameraX = world.camera.x;
    for (let x = Math.floor(cameraX / 190) * 190 - 220; x < cameraX + VIEW_WIDTH + 220; x += 190) {
      const sway = Math.sin(world.time * 1.2 + x) * 4;
      ctx.strokeStyle = `${palette[3]}70`;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x, 640); ctx.quadraticCurveTo(x + sway, 575, x + 12 + sway, 535 - seeded(x) * 40); ctx.stroke();
      ctx.fillStyle = `${palette[2]}aa`;
      ctx.beginPath(); ctx.ellipse(x + 3 + sway, 550, 18, 8, -.5, 0, Math.PI * 2); ctx.fill();
    }
    world.level.decorations.forEach((decoration, index) => {
      const x = decoration.x;
      ctx.save();
      ctx.globalAlpha = .52;
      ctx.strokeStyle = palette[3];
      ctx.fillStyle = `${palette[2]}aa`;
      ctx.lineWidth = 8;
      if (["arch", "ruin", "all"].includes(decoration.type)) {
        ctx.beginPath(); ctx.moveTo(x - 90, 640); ctx.lineTo(x - 90, 390); ctx.quadraticCurveTo(x, 300, x + 90, 390); ctx.lineTo(x + 90, 640); ctx.stroke();
      } else if (decoration.type === "windmill") {
        ctx.fillRect(x - 18, 380, 36, 260);
        ctx.translate(x, 410); ctx.rotate(world.time * .35);
        for (let blade = 0; blade < 4; blade += 1) { ctx.rotate(Math.PI / 2); ctx.fillRect(0, -8, 115, 16); }
      } else if (decoration.type === "mirror") {
        roundedRect(ctx, x - 48, 335, 96, 250, 48); ctx.fill(); ctx.stroke();
        ctx.fillStyle = `${palette[1]}55`; roundedRect(ctx, x - 34, 350, 68, 220, 34); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(x, 485 - index * 9, 44, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    });
  }

  drawPlatforms(world, palette) {
    const { ctx } = this;
    world.platforms.forEach((platform) => {
      if (!platform.active) return;
      ctx.save();
      const tremor = platform.collapseTimer != null ? Math.sin(world.time * 90) * 3 : 0;
      ctx.translate(tremor, platform.fallY || 0);
      ctx.fillStyle = platform.type === "collapse" ? "#735d54" : platform.type === "jumpPad" ? palette[4] : palette[3];
      roundedRect(ctx, platform.x, platform.y, platform.w, platform.h, platform.type === "ground" ? 5 : 8);
      ctx.fill();
      ctx.fillStyle = this.settings.colourblind ? "#e6be58" : palette[2];
      ctx.fillRect(platform.x + 4, platform.y - 5, platform.w - 8, 8);
      ctx.strokeStyle = `${palette[1]}34`;
      ctx.lineWidth = 2;
      for (let x = platform.x + 18; x < platform.x + platform.w; x += 44) {
        ctx.beginPath(); ctx.moveTo(x, platform.y + 8); ctx.lineTo(x - 7, platform.y + platform.h - 4); ctx.stroke();
      }
      if (platform.type === "collapse") {
        ctx.strokeStyle = "#d7b49c"; ctx.beginPath(); ctx.moveTo(platform.x + platform.w * .42, platform.y); ctx.lineTo(platform.x + platform.w * .52, platform.y + platform.h); ctx.stroke();
      }
      if (platform.type === "oneWay") { ctx.setLineDash([8, 6]); ctx.strokeStyle = palette[1]; ctx.strokeRect(platform.x, platform.y, platform.w, platform.h); }
      ctx.restore();
    });
  }

  drawEntities(world, palette) {
    const { ctx } = this;
    world.hazards.forEach((hazard) => {
      if (!hazard.active || hazard.dormant) return;
      ctx.save();
      ctx.fillStyle = this.settings.colourblind ? "#f08a24" : palette[4];
      ctx.strokeStyle = palette[3]; ctx.lineWidth = 3;
      if (hazard.type === "boulder") {
        const warningJitter = hazard.warningTimer > 0 ? Math.sin(world.time * 72) * 3 : 0;
        const warningProgress = hazard.warningTimer > 0 && hazard.warningDuration > 0 ? 1 - hazard.warningTimer / hazard.warningDuration : 1;
        const warningEase = warningProgress * warningProgress;
        const renderY = hazard.warningTimer > 0 ? hazard.baseY + ((hazard.rollY ?? hazard.y) - hazard.baseY) * warningEase : hazard.y;
        ctx.translate(hazard.x + hazard.w / 2 + warningJitter, renderY + hazard.h / 2); ctx.rotate(hazard.warningTimer > 0 ? warningProgress * .35 : world.time * 3);
        ctx.beginPath(); ctx.arc(0, 0, hazard.w / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        for (let i = 0; i < 6; i += 1) { ctx.rotate(Math.PI / 3); ctx.fillRect(25, -4, 18, 8); }
      } else {
        const count = Math.max(1, Math.round(hazard.w / 28));
        const unit = hazard.w / count;
        for (let i = 0; i < count; i += 1) {
          ctx.beginPath();
          if (hazard.type === "ceilingSpikes") { ctx.moveTo(hazard.x + i * unit, hazard.y); ctx.lineTo(hazard.x + (i + .5) * unit, hazard.y + hazard.h); ctx.lineTo(hazard.x + (i + 1) * unit, hazard.y); }
          else { ctx.moveTo(hazard.x + i * unit, hazard.y + hazard.h); ctx.lineTo(hazard.x + (i + .5) * unit, hazard.y); ctx.lineTo(hazard.x + (i + 1) * unit, hazard.y + hazard.h); }
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
      ctx.restore();
    });

    world.level.signs.forEach((item) => {
      ctx.fillStyle = "#533f35"; ctx.fillRect(item.x + 17, item.y + 28, 8, 52);
      ctx.save(); ctx.translate(item.x + 21, item.y + 20); ctx.rotate(Math.sin(item.x) * .035);
      ctx.fillStyle = "#d8c39f"; ctx.strokeStyle = "#5b4638"; ctx.lineWidth = 3; roundedRect(ctx, -38, -20, 76, 42, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#493b34"; ctx.font = "bold 20px Georgia"; ctx.textAlign = "center"; ctx.fillText("?", 0, 8); ctx.restore();
    });

    world.level.npcs.forEach((npc) => {
      ctx.fillStyle = "#433c4b"; roundedRect(ctx, npc.x, npc.y + 16, npc.w, npc.h - 16, 14); ctx.fill();
      ctx.fillStyle = palette[4]; ctx.beginPath(); ctx.arc(npc.x + npc.w / 2, npc.y + 15, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f4e8ce"; ctx.fillRect(npc.x + 10, npc.y + 12, 4, 3); ctx.fillRect(npc.x + 24, npc.y + 12, 4, 3);
    });

    world.enemies.forEach((enemy) => {
      if (!enemy.active) return;
      ctx.fillStyle = enemy.awake ? palette[4] : palette[3]; roundedRect(ctx, enemy.x, enemy.y, enemy.w, enemy.h, 12); ctx.fill();
      ctx.fillStyle = "#f6e8c6"; ctx.fillRect(enemy.x + 9, enemy.y + 12, 7, 4); ctx.fillRect(enemy.x + 28, enemy.y + 12, 7, 4);
    });

    world.level.collectibles.forEach((item) => {
      if (!item.active) return;
      const pulse = 1 + Math.sin(world.time * 4 + item.x) * .14;
      ctx.save(); ctx.translate(item.x + 11, item.y + 11); ctx.scale(pulse, pulse); ctx.rotate(world.time * .7);
      ctx.fillStyle = this.settings.colourblind ? "#57d6ff" : "#f4dc83"; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 11); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill(); ctx.restore();
    });

    world.level.checkpoints.forEach((item) => {
      if (item.activatedAt != null) {
        const age = world.time - item.activatedAt;
        if (age >= 0 && age < .8) {
          ctx.save();
          ctx.globalAlpha = (1 - age / .8) * .45;
          ctx.strokeStyle = "#f3d98b";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(item.x + 9, item.y + 23, 18 + age * 52, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.strokeStyle = item.fake ? "#6ee7b7" : palette[4]; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(item.x + 8, item.y + item.h); ctx.lineTo(item.x + 8, item.y + 8); ctx.stroke();
      ctx.fillStyle = item.activated ? "#f3d98b" : (item.fake ? "#5cd3a7" : palette[4]);
      ctx.beginPath(); ctx.moveTo(item.x + 10, item.y + 10); ctx.quadraticCurveTo(item.x + 42, item.y + 20, item.x + 11, item.y + 42); ctx.closePath(); ctx.fill();
    });

    world.level.secrets.forEach((item) => {
      if (!item.active) return;
      ctx.save(); ctx.translate(item.x + 17, item.y + 17); ctx.rotate(-.12 + Math.sin(world.time * 2) * .04);
      ctx.fillStyle = "#eadbbf"; ctx.fillRect(-15, -17, 30, 34); ctx.fillStyle = "#8a715f"; for (let y = -10; y < 12; y += 7) ctx.fillRect(-9, y, 18, 2); ctx.restore();
    });

    [...world.level.fakeGoals, world.level.goal].filter(Boolean).forEach((item) => {
      if (!item.active) return;
      ctx.fillStyle = item.fake ? "#e8d7a1" : palette[4]; ctx.strokeStyle = palette[3]; ctx.lineWidth = 5; roundedRect(ctx, item.x, item.y, item.w, item.h, 30); ctx.fill(); ctx.stroke();
      ctx.fillStyle = palette[3]; roundedRect(ctx, item.x + 13, item.y + 18, item.w - 26, item.h - 18, 18); ctx.fill();
      ctx.fillStyle = "#f1d886"; ctx.beginPath(); ctx.arc(item.x + 42, item.y + 52, 4, 0, Math.PI * 2); ctx.fill();
    });
  }

  drawPlayer(player, palette, time) {
    if (!player.visible) return;
    const { ctx } = this;
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    if (player.gravityDirection < 0) ctx.rotate(Math.PI);
    const squash = player.landSquash > 0 ? player.landSquash : 0;
    ctx.scale(player.facing, 1);
    ctx.scale(1 + squash * .25, 1 - squash * .22);
    const stride = player.onGround ? Math.sin(time * 17 * Math.min(1, Math.abs(player.vx) / 200)) * 4 : 0;
    ctx.strokeStyle = palette[3]; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-7, 15); ctx.lineTo(-8 + stride, 24); ctx.moveTo(7, 15); ctx.lineTo(8 - stride, 24); ctx.stroke();
    ctx.fillStyle = "#2a2b38"; ctx.beginPath(); ctx.moveTo(-15, 18); ctx.quadraticCurveTo(-13, -16, 0, -21); ctx.quadraticCurveTo(16, -13, 17, 20); ctx.quadraticCurveTo(0, 13, -15, 18); ctx.fill();
    ctx.fillStyle = palette[4]; ctx.beginPath(); ctx.moveTo(-11, -9); ctx.quadraticCurveTo(1, -27, 13, -8); ctx.lineTo(9, 2); ctx.lineTo(-9, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f4e8cc"; ctx.fillRect(0, -8, 4, 3); ctx.fillRect(7, -8, 4, 3);
    ctx.fillStyle = `${palette[4]}88`; ctx.beginPath(); ctx.moveTo(-12, 2); ctx.quadraticCurveTo(-28 - Math.abs(player.vx) * .02, 8, -18, 16); ctx.lineTo(-6, 10); ctx.fill();
    ctx.restore();
  }

  drawParticles(world) {
    const { ctx } = this;
    world.particles.forEach((particle) => {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  drawVignette(world, palette) {
    const { ctx } = this;
    const gradient = ctx.createRadialGradient(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 180, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 760);
    gradient.addColorStop(.55, "#00000000"); gradient.addColorStop(1, "#10131bc9");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = `${palette[1]}18`; ctx.fillRect(0, 0, VIEW_WIDTH, 3);
  }
}
