import AudioEngine from "./AudioEngine.js";
import Renderer from "./Renderer.js";
import { findOverlaps, resolveHorizontal, resolveVertical } from "./collision.js";
import { PHYSICS, VIEW_HEIGHT, VIEW_WIDTH, clamp, rectsOverlap } from "./constants.js";
import { loadLevel } from "./levels.js";
import { activateCheckpoint, armHazard, canFireTrigger, isVictory, mergeShakeImpact, shouldBreakBridge } from "./rules.js";

const makePlayer = (start) => ({
  x: start.x, y: start.y, w: PHYSICS.playerWidth, h: PHYSICS.playerHeight,
  vx: 0, vy: 0, facing: 1, gravityDirection: 1, onGround: false,
  coyote: 0, jumpBuffer: 0, landSquash: 0, visible: true,
});

export default class GameEngine {
  constructor({ canvas, input, settings, levelIndex = 0, onHud, onEvent, onDialogue, onPause, onLevelComplete }) {
    this.canvas = canvas;
    this.input = input;
    this.settings = settings;
    this.renderer = new Renderer(canvas, settings);
    this.audio = new AudioEngine(settings);
    this.onHud = onHud;
    this.onEvent = onEvent;
    this.onDialogue = onDialogue;
    this.onPause = onPause;
    this.onLevelComplete = onLevelComplete;
    this.levelIndex = levelIndex;
    this.running = false;
    this.paused = false;
    this.raf = 0;
    this.lastFrame = 0;
    this.accumulator = 0;
    this.fixedStep = 1 / 120;
    this.time = 0;
    this.hudClock = 0;
    this.statsClock = 0;
    this.runClock = 0;
    this.load(levelIndex);
  }

  load(index) {
    this.levelIndex = index;
    this.level = loadLevel(index);
    this.platforms = this.level.platforms.map((platform) => ({ ...platform, baseX: platform.x, baseY: platform.y }));
    this.hazards = this.level.hazards.map((hazard) => ({ ...hazard, baseX: hazard.x, baseY: hazard.y, vy: hazard.vy || 0 }));
    this.enemies = this.level.enemies.map((enemy) => ({ ...enemy, baseX: enemy.x, awake: false }));
    this.player = makePlayer(this.level.start);
    this.respawnPoint = { ...this.level.start };
    this.checkpointId = null;
    this.camera = { x: 0, y: 0 };
    this.particles = [];
    this.triggered = new Set();
    this.dialogued = new Set();
    this.collectedThisLevel = 0;
    this.deathsThisLevel = 0;
    this.levelTime = 0;
    this.airtime = 0;
    this.maxAirtime = 0;
    this.wind = 0;
    this.controlsReversed = false;
    this.dying = 0;
    this.completed = false;
    this.completeTimer = 0;
    this.shake = 0;
    this.shakeDecay = 0;
    this.message = "";
    this.audio.setMood(this.level.mood, this.levelIndex);
    this.emitHud(true);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    this.audio.resume();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  destroy() { this.stop(); this.audio.destroy(); }

  setPaused(paused) {
    this.paused = paused;
    this.input.enabled = !paused;
    if (paused) this.input.clear();
    if (!paused) { this.lastFrame = performance.now(); this.audio.resume(); }
  }

  setSettings(settings) {
    this.settings = settings;
    this.renderer.setSettings(settings);
    this.audio.applySettings(settings);
  }

  resize(dpr) { this.renderer.resize(dpr); }

  frame(timestamp) {
    if (!this.running) return;
    const rawDelta = Math.min((timestamp - this.lastFrame) / 1000, .05);
    this.lastFrame = timestamp;
    if (!this.paused) {
      this.accumulator += rawDelta;
      while (this.accumulator >= this.fixedStep) {
        this.update(this.fixedStep);
        this.accumulator -= this.fixedStep;
      }
    }
    this.renderer.render(this);
    this.input.endFrame();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  update(dt) {
    this.time += dt;
    this.levelTime += dt;
    this.hudClock += dt;
    this.statsClock += dt;
    this.shake = Math.max(0, this.shake - dt * this.shakeDecay);
    this.player.landSquash = Math.max(0, this.player.landSquash - dt * 5.5);
    this.updateParticles(dt);
    this.updatePlatforms(dt);
    this.updateHazards(dt);
    this.updateEnemies(dt);

    if (this.input.consumePressed("pause")) { this.onPause?.(); return; }
    if (this.completed) {
      this.completeTimer += dt;
      if (this.completeTimer > 1 && !this.completionSent) {
        this.completionSent = true;
        this.onLevelComplete?.({ index: this.levelIndex, time: this.levelTime, deaths: this.deathsThisLevel, collected: this.collectedThisLevel });
      }
      this.emitHud();
      return;
    }
    if (this.dying > 0) {
      this.dying -= dt;
      if (this.dying <= 0) this.respawn();
      this.emitHud();
      return;
    }

    this.updatePlayer(dt);
    this.handleWorldInteractions();
    this.updateCamera(dt);
    if (this.statsClock >= 1) {
      this.onEvent?.("statTick", { playtime: this.statsClock, runTime: this.runClock });
      this.statsClock = 0;
      this.runClock = 0;
    }
    this.emitHud();
  }

  updatePlayer(dt) {
    const player = this.player;
    const wasGrounded = player.onGround;
    player.coyote = player.onGround ? PHYSICS.coyoteTime : Math.max(0, player.coyote - dt);
    if (this.input.consumePressed("jump")) player.jumpBuffer = PHYSICS.jumpBuffer;
    else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);

    let direction = (this.input.isDown("right") ? 1 : 0) - (this.input.isDown("left") ? 1 : 0);
    if (this.controlsReversed) direction *= -1;
    if (direction) player.facing = direction;
    const running = this.input.isDown("run");
    const targetSpeed = direction * (running ? PHYSICS.runSpeed : PHYSICS.walkSpeed);
    const acceleration = player.onGround ? PHYSICS.groundAcceleration : PHYSICS.airAcceleration;
    const friction = player.onGround ? PHYSICS.groundFriction : PHYSICS.airFriction;
    if (direction) player.vx += clamp(targetSpeed - player.vx, -acceleration * dt, acceleration * dt);
    else player.vx += clamp(-player.vx, -friction * dt, friction * dt);
    if (running && direction) this.runClock += dt;

    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -PHYSICS.jumpSpeed * player.gravityDirection;
      player.onGround = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      this.audio.play("jump");
      this.onEvent?.("jump", {});
      this.spawnDust(player.x + player.w / 2, player.gravityDirection > 0 ? player.y + player.h : player.y, 7, "#e6d4b4");
    }

    const holdingJump = this.input.isDown("jump");
    const againstGravity = player.vy * player.gravityDirection < 0;
    const gravityMultiplier = !holdingJump && againstGravity ? PHYSICS.jumpCutGravity : 1;
    player.vy += PHYSICS.gravity * player.gravityDirection * gravityMultiplier * dt;
    player.vy = clamp(player.vy, -PHYSICS.maxFallSpeed, PHYSICS.maxFallSpeed);

    const activePlatforms = this.platforms.filter((platform) => platform.active && platform.solid);
    player.x += (player.vx + this.wind) * dt;
    player.x = clamp(player.x, 0, this.level.width - player.w);
    resolveHorizontal(player, activePlatforms);

    const previousY = player.y;
    const impactSpeed = Math.abs(player.vy);
    player.y += player.vy * dt;
    const landed = resolveVertical(player, activePlatforms, previousY, player.gravityDirection);
    player.onGround = Boolean(landed);
    if (landed) {
      if (!wasGrounded) {
        player.landSquash = 1;
        this.audio.play("land");
        this.spawnDust(player.x + player.w / 2, player.gravityDirection > 0 ? player.y + player.h : player.y, 10, "#d7c6a7");
        if (impactSpeed > 650) this.addShake("landing");
      }
      if (landed.type === "collapse" && landed.collapseTimer == null) landed.collapseTimer = landed.collapseDelay ?? .55;
      if (landed.type === "jumpPad") {
        player.vy = -PHYSICS.jumpSpeed * 1.35 * player.gravityDirection;
        player.onGround = false;
        this.addShake("jumpPad");
      }
    }
    if (!player.onGround) { this.airtime += dt; this.maxAirtime = Math.max(this.maxAirtime, this.airtime); }
    else this.airtime = 0;

    if (player.y > VIEW_HEIGHT + 180 || player.y + player.h < -180) this.kill("The void was exactly where it appeared to be.");
  }

  updatePlatforms(dt) {
    for (const platform of this.platforms) {
      if (platform.type === "moving") {
        platform.x = platform.baseX + Math.sin(this.time * (platform.speed || 1)) * (platform.range || 120);
      }
      if (platform.type === "shy") {
        const isPlayerLooking = (this.player.facing > 0 && platform.x > this.player.x) || (this.player.facing < 0 && platform.x < this.player.x);
        const target = platform.baseX + (isPlayerLooking ? 0 : platform.shyOffset || 120);
        platform.x += (target - platform.x) * Math.min(1, dt * 2.6);
      }
      if (platform.collapseTimer != null) {
        platform.collapseTimer -= dt;
        if (platform.collapseTimer <= 0) { platform.active = false; platform.solid = false; this.addShake("collapse"); this.spawnDust(platform.x + platform.w / 2, platform.y, 15, "#9b7b66"); }
      }
    }
  }

  updateHazards(dt) {
    for (const hazard of this.hazards) {
      if (!hazard.active || hazard.dormant) continue;
      if (hazard.warningTimer > 0) {
        hazard.warningTimer = Math.max(0, hazard.warningTimer - dt);
        continue;
      }
      if (hazard.type === "fallingSpike") {
        hazard.vy += 1900 * dt;
        hazard.y += hazard.vy * dt;
      }
      if (hazard.type === "boulder") {
        hazard.x += (hazard.vx || -360) * dt;
        hazard.y = (hazard.rollY ?? 548) + Math.sin(this.time * 7) * 5;
      }
    }
  }

  updateEnemies(dt) {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const ignored = (this.player.facing > 0 && enemy.x < this.player.x) || (this.player.facing < 0 && enemy.x > this.player.x);
      if (Math.abs(enemy.x - this.player.x) < 330 && ignored) enemy.awake = true;
      if (enemy.awake) {
        enemy.x += Math.sign(this.player.x - enemy.x) * 125 * dt;
        if (rectsOverlap(this.player, enemy)) this.kill("It only wakes when ignored. Rude, but consistent.");
      }
    }
  }

  handleWorldInteractions() {
    const player = this.player;
    for (const trigger of this.level.triggers) {
      if (!canFireTrigger(trigger, this.triggered, player)) continue;
      this.handleTrigger(trigger);
      if (trigger.once !== false) this.triggered.add(trigger.id);
    }

    if (findOverlaps(player, this.hazards.filter((hazard) => !hazard.dormant)).length) {
      this.kill("The sharp part was a useful clue.");
      return;
    }

    for (const item of this.level.collectibles) {
      if (!item.active || !rectsOverlap(player, item)) continue;
      item.active = false;
      this.collectedThisLevel += 1;
      this.audio.play("collect");
      this.onEvent?.("collect", { id: item.id });
      this.spawnDust(item.x + 11, item.y + 11, 12, "#f4dc83");
    }

    for (const item of this.level.secrets) {
      if (!item.active || !rectsOverlap(player, item)) continue;
      item.active = false;
      this.audio.play("secret");
      this.onEvent?.("secret", { id: item.id, developerRoom: item.id === "developer-room" });
      this.onDialogue?.({ speaker: "Hidden note", text: item.label, tone: "secret" });
    }

    for (const item of this.level.checkpoints) {
      if (!rectsOverlap(player, item)) continue;
      const activation = activateCheckpoint(item);
      if (!activation) continue;
      this.checkpointId = activation.checkpointId;
      this.respawnPoint = activation.respawnPoint;
      this.audio.play("checkpoint");
      item.activatedAt = this.time;
      this.addShake("checkpoint");
      this.onEvent?.("checkpoint", { id: item.id, realCheckpoint: true });
      this.spawnDust(item.x + 10, item.y + 20, 24, "#f2bc6d");
    }

    for (const item of this.level.signs) {
      if (this.dialogued.has(item.id) || Math.abs(player.x - item.x) > 95) continue;
      this.dialogued.add(item.id);
      this.onEvent?.("sign", { id: item.id, honest: item.honest });
      this.onDialogue?.({ speaker: item.honest ? "Weathered sign" : "Official sign", text: item.text, tone: item.honest ? "normal" : "warning" });
    }
    for (const npc of this.level.npcs) {
      if (this.dialogued.has(npc.id) || Math.abs(player.x - npc.x) > 110) continue;
      this.dialogued.add(npc.id);
      this.onDialogue?.({ speaker: "Helpful guide", text: npc.text, tone: "npc" });
    }

    for (const item of this.level.fakeGoals) {
      if (item.active && rectsOverlap(player, item)) {
        const fakeTrigger = this.level.triggers.find((triggerItem) => triggerItem.action === "fakeExit");
        if (fakeTrigger) this.handleTrigger(fakeTrigger);
      }
    }
    if (isVictory(player, this.level.goal)) this.completeLevel();
  }

  handleTrigger(trigger) {
    switch (trigger.action) {
      case "activateHazard": {
        const hazard = this.hazards.find((item) => item.id === trigger.target);
        if (hazard) {
          armHazard(hazard, trigger);
          this.addShake("hazard");
          if (hazard.warningTimer > 0) this.audio.play("warning");
        }
        if (trigger.dishonestSign) this.onEvent?.("survivedDishonestSign", {});
        break;
      }
      case "breakBridgeIfRunning": {
        if (!shouldBreakBridge(this.player.vx)) break;
        const platform = this.platforms.find((item) => item.id === trigger.target);
        if (platform?.active) { platform.active = false; platform.solid = false; this.addShake("major"); this.onEvent?.("survivedDishonestSign", {}); }
        break;
      }
      case "wind": this.wind = trigger.value || 0; break;
      case "gravity": {
        this.player.gravityDirection = trigger.value;
        this.player.vy = 80 * trigger.value;
        this.player.onGround = false;
        this.addShake("gravity");
        break;
      }
      case "reverseControls": this.controlsReversed = Boolean(trigger.value); break;
      case "fakeCheckpoint": {
        const item = this.level.checkpoints.find((checkpoint) => checkpoint.id === trigger.target);
        if (item && !item.activated) {
          item.activated = true;
          item.activatedAt = this.time;
          this.audio.play("checkpoint");
          this.addShake("checkpoint");
          this.onEvent?.("fakeCheckpoint", { id: item.id });
          this.onDialogue?.({ speaker: "Checkpoint", text: "Progress saved!*\n\n*Progress not saved.", tone: "warning" });
        }
        break;
      }
      case "fakeExit": {
        if (this.triggered.has(trigger.id)) break;
        this.triggered.add(trigger.id);
        const realGoal = this.level.goal;
        if (realGoal) realGoal.active = true;
        const fakeGoal = this.level.fakeGoals.find((item) => item.id === "fake-goal");
        if (fakeGoal) fakeGoal.active = false;
        this.player.x = this.respawnPoint.x;
        this.player.y = this.respawnPoint.y;
        this.player.vx = 0;
        this.onEvent?.("fakeExit", {});
        this.onDialogue?.({ speaker: "The Trial", text: "EXIT INTERVIEW FAILED.\nA more convincing exit has been installed at the far end.", tone: "warning" });
        break;
      }
      case "wrongWay": this.onEvent?.("wrongWay", {}); break;
      default: break;
    }
  }

  kill(message) {
    if (this.dying > 0 || this.completed) return;
    this.dying = .58;
    this.deathsThisLevel += 1;
    this.player.visible = false;
    this.player.vx = 0;
    this.player.vy = 0;
    this.addShake("death");
    this.audio.play("death");
    this.spawnDust(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 30, "#e6776e");
    this.onEvent?.("death", { message });
    this.onDialogue?.({ speaker: "Lesson noted", text: message, tone: "death", brief: true });
  }

  respawn() {
    const currentCheckpoint = this.checkpointId;
    const respawnPoint = { ...this.respawnPoint };
    const time = this.levelTime;
    const deaths = this.deathsThisLevel;
    const collected = this.collectedThisLevel;
    const dialogue = new Set(this.dialogued);
    this.level = loadLevel(this.levelIndex);
    this.platforms = this.level.platforms.map((platform) => ({ ...platform, baseX: platform.x, baseY: platform.y }));
    this.hazards = this.level.hazards.map((hazard) => ({ ...hazard, baseX: hazard.x, baseY: hazard.y, vy: 0 }));
    this.enemies = this.level.enemies.map((enemy) => ({ ...enemy, baseX: enemy.x, awake: false }));
    this.player = makePlayer(respawnPoint);
    this.levelTime = time;
    this.deathsThisLevel = deaths;
    this.collectedThisLevel = collected;
    this.dialogued = dialogue;
    this.triggered = new Set();
    this.checkpointId = currentCheckpoint;
    this.respawnPoint = respawnPoint;
    this.level.checkpoints.forEach((item) => { item.activated = item.id === currentCheckpoint; });
    this.wind = 0;
    this.controlsReversed = false;
    this.dying = 0;
  }

  completeLevel() {
    if (this.completed) return;
    this.completed = true;
    this.player.vx = 0;
    this.audio.play("victory");
    this.addShake("major");
    this.spawnDust(this.level.goal.x + 30, this.level.goal.y + 45, 36, "#f4d78b");
    this.onEvent?.("levelVictory", { levelIndex: this.levelIndex, time: this.levelTime, clearedWithoutDeath: this.deathsThisLevel === 0, clearedWithoutCollecting: this.collectedThisLevel === 0, airtime: this.maxAirtime });
  }

  updateCamera(dt) {
    const lookAhead = clamp(this.player.vx * .32, -130, 130);
    const deadZoneLeft = this.camera.x + 410;
    const deadZoneRight = this.camera.x + 740;
    let target = this.camera.x;
    if (this.player.x < deadZoneLeft) target = this.player.x - 410;
    if (this.player.x > deadZoneRight) target = this.player.x - 740;
    target += lookAhead;
    target = clamp(target, 0, Math.max(0, this.level.width - VIEW_WIDTH));
    this.camera.x += (target - this.camera.x) * Math.min(1, dt * 4.8);
    const verticalTarget = this.player.gravityDirection < 0 ? -40 : 0;
    this.camera.y += (verticalTarget - this.camera.y) * Math.min(1, dt * 3.5);
  }

  addShake(kind) {
    const impact = mergeShakeImpact(this.shake, this.shakeDecay, kind);
    this.shake = impact.shake;
    this.shakeDecay = impact.decay;
  }

  spawnDust(x, y, count, color) {
    const limit = count > 20 && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 ? Math.ceil(count * .6) : count;
    for (let i = 0; i < limit; i += 1) {
      const life = .28 + Math.random() * .42;
      this.particles.push({ x, y, vx: (Math.random() - .5) * 240, vy: (Math.random() - .75) * 190, life, maxLife: life, size: 2 + Math.random() * 4, color });
    }
    if (this.particles.length > 220) this.particles.splice(0, this.particles.length - 220);
  }

  updateParticles(dt) {
    for (const particle of this.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 420 * dt;
      particle.vx *= .985;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  emitHud(force = false) {
    if (!force && this.hudClock < .1) return;
    this.hudClock = 0;
    this.onHud?.({
      level: this.levelIndex + 1,
      levelName: this.level.name,
      time: this.levelTime,
      deaths: this.deathsThisLevel,
      checkpoint: this.checkpointId,
      wind: this.wind,
      reversed: this.controlsReversed,
      gravity: this.player.gravityDirection,
      completed: this.completed,
    });
  }
}
