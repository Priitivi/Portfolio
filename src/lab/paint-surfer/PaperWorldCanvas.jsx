import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  clamp,
  createPaperStoryStatus,
  getPaperMovement,
  isPointNearLandmark,
  MAX_PAINT_STROKES,
  MAX_POINTS_PER_STROKE,
  paintCellKey,
  PAPER_GROUND_Y,
  PAPER_WORLD_WIDTH,
  paperLandmarks,
  screenToWorld,
  segmentYAtX,
} from "./paperWorld";

const PLAYER_HEIGHT = 58;
const PLAYER_WIDTH = 30;
const PIGMENTS = ["#ff4f91", "#ffb52f", "#c8ff36", "#35d9e8", "#7658ff", "#ff6a3d"];

function roundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, safeRadius);
}

function drawPaperBackground(ctx, width, height, cameraX, time, storyProgress) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, storyProgress > 60 ? "#dcd2ff" : "#f4f0e7");
  gradient.addColorStop(1, storyProgress > 60 ? "#24143f" : "#e8e2d8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.strokeStyle = "#17131d";
  ctx.lineWidth = 1;
  const gridOffset = -((cameraX * 0.16) % 42);
  for (let x = gridOffset; x < width + 42; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 22; y < height; y += 42) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.07;
  ctx.lineWidth = 18;
  for (let index = 0; index < 7; index += 1) {
    const x = ((index * 271 - cameraX * (0.04 + index * 0.004)) % (width + 420)) - 180;
    ctx.beginPath();
    ctx.arc(x, height * 0.24 + Math.sin(time * 0.0002 + index) * 38, 120 + index * 9, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.18, width / 2, height / 2, Math.max(width, height) * 0.72);
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(1, "rgba(18,12,28,.2)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawSunGarden(ctx, x, ground, progress, time) {
  const colour = paperLandmarks[0].accent;
  ctx.save();
  ctx.translate(x, ground);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "#27222d";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, -285, 94, 0, Math.PI * 2);
  ctx.stroke();
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2 + time * 0.00008 * progress;
    const inner = 116;
    const outer = 150 + Math.sin(time * 0.002 + index) * 8 * progress;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, -285 + Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, -285 + Math.sin(angle) * outer);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.08 + progress * 0.92;
  const sunGradient = ctx.createRadialGradient(-22, -310, 8, 0, -285, 94);
  sunGradient.addColorStop(0, "#fff4a0");
  sunGradient.addColorStop(0.6, colour);
  sunGradient.addColorStop(1, "#ff7448");
  ctx.fillStyle = sunGradient;
  ctx.beginPath();
  ctx.arc(0, -285, 89, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  for (let index = -3; index <= 3; index += 1) {
    const flowerX = index * 53;
    const flowerHeight = 56 + (index % 2 === 0 ? 34 : 0);
    ctx.strokeStyle = progress > 0.45 ? "#3eae68" : "#716d75";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(flowerX, 0);
    ctx.quadraticCurveTo(flowerX - 8, -flowerHeight / 2, flowerX, -flowerHeight);
    ctx.stroke();
    ctx.fillStyle = progress > Math.abs(index) * 0.08 ? PIGMENTS[(index + 6) % PIGMENTS.length] : "#ece7df";
    ctx.strokeStyle = "#27222d";
    for (let petal = 0; petal < 5; petal += 1) {
      const angle = (petal / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(flowerX + Math.cos(angle) * 10, -flowerHeight + Math.sin(angle) * 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPaperGiant(ctx, x, ground, progress, time) {
  const bob = Math.sin(time * 0.0014) * 3 * progress;
  ctx.save();
  ctx.translate(x, ground + bob);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#26212d";
  ctx.lineWidth = 7;
  ctx.fillStyle = progress > 0 ? `rgba(53,217,232,${0.08 + progress * 0.5})` : "#eeeae3";
  ctx.beginPath();
  ctx.ellipse(0, -210, 125, 155, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f4f0e9";
  ctx.beginPath();
  ctx.arc(0, -390, 68, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-103, -280);
  ctx.quadraticCurveTo(-205, -205, -236, -58);
  ctx.moveTo(103, -280);
  ctx.quadraticCurveTo(205, -205, 236, -58);
  ctx.moveTo(-82, -95);
  ctx.quadraticCurveTo(-145, -35, -174, 0);
  ctx.moveTo(82, -95);
  ctx.quadraticCurveTo(145, -35, 174, 0);
  ctx.stroke();

  ctx.fillStyle = "#25202b";
  ctx.beginPath();
  ctx.arc(-24, -400, 7, 0, Math.PI * 2);
  ctx.arc(24, -400, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ff4f91";
  ctx.lineWidth = 12;
  ctx.globalAlpha = 0.1 + progress * 0.9;
  ctx.beginPath();
  ctx.moveTo(0, -245);
  ctx.bezierCurveTo(-48, -292, -82, -220, 0, -165);
  ctx.bezierCurveTo(82, -220, 48, -292, 0, -245);
  ctx.fillStyle = "#ff4f91";
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawMemoryCity(ctx, x, ground, progress, time) {
  const buildings = [
    { x: -280, width: 92, height: 230 }, { x: -172, width: 115, height: 350 },
    { x: -38, width: 92, height: 285 }, { x: 68, width: 128, height: 430 },
    { x: 214, width: 88, height: 260 },
  ];
  ctx.save();
  ctx.translate(x, ground);
  buildings.forEach((building, buildingIndex) => {
    ctx.fillStyle = progress > buildingIndex * 0.12 ? `hsla(${255 + buildingIndex * 25},80%,60%,${0.16 + progress * 0.38})` : "#ece8e1";
    ctx.strokeStyle = "#28232f";
    ctx.lineWidth = 4;
    ctx.fillRect(building.x, -building.height, building.width, building.height);
    ctx.strokeRect(building.x, -building.height, building.width, building.height);
    const columns = Math.max(2, Math.floor(building.width / 28));
    for (let row = 0; row < Math.floor(building.height / 42) - 1; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const lit = progress > (row + column + buildingIndex) / 17;
        ctx.fillStyle = lit ? PIGMENTS[(row + column + buildingIndex) % PIGMENTS.length] : "rgba(38,33,45,.12)";
        const flicker = lit ? Math.sin(time * 0.003 + row * 2 + column) * 0.8 : 0;
        ctx.fillRect(building.x + 13 + column * 25, -building.height + 18 + row * 40, 11, 18 + flicker);
      }
    }
  });
  ctx.strokeStyle = progress > 0.75 ? "#c8ff36" : "#28232f";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-325, -12);
  ctx.quadraticCurveTo(0, -95 - progress * 45, 330, -12);
  ctx.stroke();
  ctx.restore();
}

function drawLastDoor(ctx, x, ground, progress, time) {
  ctx.save();
  ctx.translate(x, ground);
  ctx.strokeStyle = "#25202c";
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(-116, 0);
  ctx.lineTo(-116, -310);
  ctx.quadraticCurveTo(0, -455, 116, -310);
  ctx.lineTo(116, 0);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-105, -4);
  ctx.lineTo(-105, -304);
  ctx.quadraticCurveTo(0, -430, 105, -304);
  ctx.lineTo(105, -4);
  ctx.closePath();
  ctx.clip();
  ctx.globalAlpha = 0.05 + progress * 0.9;
  const portal = ctx.createRadialGradient(0, -205, 10, 0, -205, 190);
  portal.addColorStop(0, "#ffffff");
  portal.addColorStop(0.35, "#c8ff36");
  portal.addColorStop(0.7, "#8b59ff");
  portal.addColorStop(1, "#15101e");
  ctx.fillStyle = portal;
  ctx.fillRect(-120, -450, 240, 450);
  ctx.translate(0, -210);
  ctx.rotate(time * 0.00025 * progress);
  ctx.strokeStyle = "rgba(255,255,255,.7)";
  ctx.lineWidth = 5;
  for (let index = 0; index < 5; index += 1) {
    ctx.beginPath();
    ctx.arc(0, 0, 20 + index * 27, index * 0.7, Math.PI * 1.35 + index * 0.7);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = "#25202c";
  ctx.beginPath();
  ctx.arc(78, -175, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLandmarkLabel(ctx, x, ground, landmark, progress) {
  ctx.save();
  ctx.translate(x, ground - 505);
  ctx.fillStyle = "rgba(244,240,232,.92)";
  ctx.strokeStyle = "#27222e";
  ctx.lineWidth = 2;
  roundedRect(ctx, -122, -27, 244, 54, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = landmark.accent;
  ctx.fillRect(-122, 22, 244 * progress, 5);
  ctx.fillStyle = "#27222e";
  ctx.font = "900 10px Space Mono, monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${landmark.number} // ${landmark.shortTitle.toUpperCase()} // ${Math.round(progress * 100)}%`, 0, 4);
  ctx.restore();
}

function drawLandmarks(ctx, cameraX, scale, groundScreenY, story, time) {
  ctx.save();
  ctx.translate(-cameraX * scale, groundScreenY - PAPER_GROUND_Y * scale);
  ctx.scale(scale, scale);
  story.landmarks.forEach((landmark, index) => {
    const progress = landmark.progress / 100;
    if (index === 0) drawSunGarden(ctx, landmark.x, PAPER_GROUND_Y, progress, time);
    if (index === 1) drawPaperGiant(ctx, landmark.x, PAPER_GROUND_Y, progress, time);
    if (index === 2) drawMemoryCity(ctx, landmark.x, PAPER_GROUND_Y, progress, time);
    if (index === 3) drawLastDoor(ctx, landmark.x, PAPER_GROUND_Y, progress, time);
    drawLandmarkLabel(ctx, landmark.x, PAPER_GROUND_Y, landmark, progress);
  });
  ctx.restore();
}

function drawPaintStrokes(ctx, strokes, cameraX, scale, groundScreenY, time) {
  ctx.save();
  ctx.translate(-cameraX * scale, groundScreenY - PAPER_GROUND_Y * scale);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  strokes.forEach((stroke, strokeIndex) => {
    if (stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let index = 1; index < stroke.points.length; index += 1) {
      const point = stroke.points[index];
      ctx.lineTo(point.x, point.y + Math.sin(time * 0.004 + index + strokeIndex) * 0.8);
    }
    ctx.strokeStyle = "rgba(23,17,31,.22)";
    ctx.lineWidth = stroke.width + 7;
    ctx.stroke();
    ctx.strokeStyle = stroke.colour;
    ctx.globalAlpha = 0.88;
    ctx.lineWidth = stroke.width;
    ctx.stroke();
    ctx.strokeStyle = "rgba(238,250,255,.72)";
    ctx.globalAlpha = 0.68;
    ctx.lineWidth = Math.max(2, stroke.width * 0.2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
  ctx.restore();
}

function drawGround(ctx, width, height, groundScreenY, cameraX, time, storyProgress) {
  ctx.save();
  ctx.fillStyle = storyProgress > 75 ? "#17101f" : "rgba(239,235,226,.9)";
  ctx.fillRect(0, groundScreenY, width, Math.max(0, height - groundScreenY));
  ctx.strokeStyle = storyProgress > 75 ? "#c8ff36" : "#24202b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let x = -20; x < width + 30; x += 22) {
    const y = groundScreenY + Math.sin((x + cameraX * 0.4) * 0.07 + time * 0.0004) * 2;
    if (x === -20) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPlayer(ctx, player, cameraX, scale, groundScreenY, time, reducedMotion) {
  const x = (player.x - cameraX) * scale;
  const y = groundScreenY + (player.y - PAPER_GROUND_Y) * scale;
  const facing = player.facing;
  const cadence = time * (player.sprinting ? 0.018 : 0.012);
  const stride = player.moving && player.grounded ? Math.sin(cadence) * 12 : 0;
  const bob = reducedMotion ? 0 : player.moving && player.grounded ? Math.abs(Math.sin(cadence)) * 3 : 0;
  ctx.save();
  ctx.translate(x, y - bob * scale);
  ctx.scale(scale * facing, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (player.dashTimer > 0) {
    const board = ctx.createLinearGradient(-50, 0, 48, 0);
    board.addColorStop(0, "#eefcff");
    board.addColorStop(0.5, "#a779ff");
    board.addColorStop(1, "#c8ff36");
    ctx.strokeStyle = "#24202b";
    ctx.fillStyle = board;
    ctx.lineWidth = 4;
    roundedRect(ctx, -46, -7, 92, 14, 7);
    ctx.fill();
    ctx.stroke();
  }

  ctx.strokeStyle = "#24202b";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-5, -14);
  ctx.lineTo(-9 + stride, 0);
  ctx.moveTo(5, -14);
  ctx.lineTo(11 - stride, 0);
  ctx.stroke();
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -48);
  ctx.stroke();
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, -41);
  ctx.lineTo(-18 - stride * 0.5, -24);
  ctx.moveTo(0, -41);
  ctx.lineTo(20 + stride * 0.45, -32);
  ctx.stroke();

  ctx.fillStyle = "#f7f2e9";
  ctx.strokeStyle = "#24202b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -63, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#24202b";
  ctx.beginPath();
  ctx.moveTo(-15, -67);
  ctx.quadraticCurveTo(-3, -87, 14, -72);
  ctx.lineTo(8, -61);
  ctx.quadraticCurveTo(-1, -73, -15, -67);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6, -63, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ff4f91";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-4, -50);
  ctx.bezierCurveTo(-22, -47, -34 - player.speed * 0.035, -57, -48 - player.speed * 0.04, -46 + Math.sin(time * 0.007) * 3);
  ctx.stroke();

  ctx.save();
  ctx.translate(20, -38);
  ctx.rotate(-0.46 + (player.dashTimer > 0 ? -0.4 : 0));
  ctx.fillStyle = "#ffd52f";
  ctx.strokeStyle = "#24202b";
  ctx.lineWidth = 3;
  roundedRect(ctx, -5, -31, 10, 62, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#24202b";
  ctx.beginPath();
  ctx.moveTo(-5, 31);
  ctx.lineTo(0, 43);
  ctx.lineTo(5, 31);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawParticles(ctx, particles, cameraX, scale, groundScreenY) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  particles.forEach((particle) => {
    const x = (particle.x - cameraX) * scale;
    const y = groundScreenY + (particle.y - PAPER_GROUND_Y) * scale;
    ctx.globalAlpha = clamp(particle.life, 0, 1);
    ctx.fillStyle = particle.colour;
    ctx.beginPath();
    ctx.arc(x, y, particle.size * scale * particle.life, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

export default function PaperWorldCanvas({ controlsRef, paused, reducedMotion, onDash, onReady, onStoryUpdate, onComplete }) {
  const canvasRef = useRef(null);
  const sizeRef = useRef({ width: 1, height: 1, dpr: 1, scale: 1, groundScreenY: 1 });
  const cameraRef = useRef({ x: 0 });
  const strokesRef = useRef([]);
  const dashStrokeRef = useRef(null);
  const activeStrokeRef = useRef(null);
  const particlesRef = useRef([]);
  const landmarkCellsRef = useRef(paperLandmarks.map(() => new Set()));
  const storyRef = useRef(createPaperStoryStatus());
  const jumpLatchRef = useRef(false);
  const dashLatchRef = useRef(false);
  const readyRef = useRef(false);
  const completedRef = useRef(false);
  const hueRef = useRef(0);
  const playerRef = useRef({
    x: 220,
    y: PAPER_GROUND_Y,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    coyote: 0,
    moving: false,
    sprinting: false,
    speed: 0,
    dashTimer: 0,
    dashCooldown: 0,
  });

  const publishStory = useCallback(() => {
    const status = createPaperStoryStatus(landmarkCellsRef.current.map((cells) => cells.size));
    storyRef.current = status;
    onStoryUpdate(status);
    if (status.complete && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [onComplete, onStoryUpdate]);

  const addPigmentAt = useCallback((point, forceParticle = false) => {
    paperLandmarks.forEach((landmark, index) => {
      if (storyRef.current.landmarks[index].complete) return;
      if (!isPointNearLandmark(point, landmark)) return;
      const key = paintCellKey(point.x, point.y);
      if (!landmarkCellsRef.current[index].has(key)) {
        landmarkCellsRef.current[index].add(key);
        publishStory();
      }
    });
    if (forceParticle || Math.random() > 0.42) {
      particlesRef.current.push({
        x: point.x + (Math.random() - 0.5) * 16,
        y: point.y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 90,
        vy: -30 - Math.random() * 90,
        life: 0.7 + Math.random() * 0.3,
        size: 3 + Math.random() * 5,
        colour: PIGMENTS[(hueRef.current + Math.floor(Math.random() * 3)) % PIGMENTS.length],
      });
      if (particlesRef.current.length > 120) particlesRef.current.splice(0, particlesRef.current.length - 120);
    }
  }, [publishStory]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(1.6, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      sizeRef.current = {
        width: rect.width,
        height: rect.height,
        dpr,
        scale: clamp(rect.height / 790, 0.72, 1.08),
        groundScreenY: rect.height - (rect.width < 700 ? 126 : 86),
      };
      if (!readyRef.current) {
        readyRef.current = true;
        onReady();
        onStoryUpdate(storyRef.current);
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [onReady, onStoryUpdate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frameId;
    let previousTime = performance.now();

    const frame = (time) => {
      const size = sizeRef.current;
      const player = playerRef.current;
      const delta = Math.min(0.033, Math.max(0.001, (time - previousTime) / 1000));
      previousTime = time;

      if (!paused) {
        const controls = getPaperMovement(controlsRef.current);
        player.sprinting = controls.sprint;
        player.dashCooldown = Math.max(0, player.dashCooldown - delta);
        player.dashTimer = Math.max(0, player.dashTimer - delta);
        player.coyote = player.grounded ? 0.11 : Math.max(0, player.coyote - delta);

        if (controls.jump && !jumpLatchRef.current && player.coyote > 0) {
          player.vy = -655;
          player.grounded = false;
          player.coyote = 0;
        }
        jumpLatchRef.current = controls.jump;

        if (controls.dash && !dashLatchRef.current && player.dashCooldown <= 0) {
          player.dashTimer = 0.58;
          player.dashCooldown = 0.36;
          player.vx = player.facing * 690;
          player.vy = Math.min(player.vy, -75);
          hueRef.current = (hueRef.current + 1) % PIGMENTS.length;
          dashStrokeRef.current = { kind: "dash", points: [], colour: PIGMENTS[hueRef.current], width: 14 };
          strokesRef.current.push(dashStrokeRef.current);
          if (strokesRef.current.length > MAX_PAINT_STROKES) strokesRef.current.shift();
          onDash();
        }
        dashLatchRef.current = controls.dash;

        const targetSpeed = controls.horizontal * (controls.sprint ? 430 : 275);
        if (controls.horizontal !== 0) player.facing = Math.sign(controls.horizontal);
        if (player.dashTimer <= 0) {
          player.vx += (targetSpeed - player.vx) * (1 - Math.exp(-11 * delta));
        }
        if (controls.horizontal === 0 && player.grounded && player.dashTimer <= 0) {
          player.vx *= Math.exp(-7 * delta);
        }
        player.vy += (player.dashTimer > 0 ? 760 : 1480) * delta;

        const nextX = clamp(player.x + player.vx * delta, 36, PAPER_WORLD_WIDTH - 36);
        const nextY = player.y + player.vy * delta;
        let landingY = PAPER_GROUND_Y;
        if (player.vy >= 0) {
          for (let strokeIndex = Math.max(0, strokesRef.current.length - 28); strokeIndex < strokesRef.current.length; strokeIndex += 1) {
            const points = strokesRef.current[strokeIndex].points;
            for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
              const platformY = segmentYAtX(points[pointIndex - 1], points[pointIndex], nextX);
              if (platformY !== null && player.y <= platformY + 4 && nextY >= platformY - 3 && platformY < landingY) landingY = platformY;
            }
          }
        }
        player.x = nextX;
        if (nextY >= landingY) {
          player.y = landingY;
          player.vy = 0;
          player.grounded = true;
        } else {
          player.y = nextY;
          player.grounded = false;
        }
        player.speed = Math.abs(player.vx);
        player.moving = player.speed > 18;

        if (player.dashTimer > 0) {
          const dashPoint = { x: player.x - player.facing * 18, y: player.y + 4 };
          const dashStroke = dashStrokeRef.current;
          const previous = dashStroke.points.at(-1);
          if (!previous || Math.hypot(previous.x - dashPoint.x, previous.y - dashPoint.y) > 9) {
            dashStroke.points.push(dashPoint);
            addPigmentAt(dashPoint, true);
          }
        }

        particlesRef.current.forEach((particle) => {
          particle.x += particle.vx * delta;
          particle.y += particle.vy * delta;
          particle.vy += 180 * delta;
          particle.life -= delta * 1.15;
        });
        particlesRef.current = particlesRef.current.filter((particle) => particle.life > 0);
      }

      const targetCamera = clamp(player.x - size.width / (2 * size.scale), 0, PAPER_WORLD_WIDTH - size.width / size.scale);
      cameraRef.current.x += (targetCamera - cameraRef.current.x) * (1 - Math.exp(-(reducedMotion ? 20 : 7) * delta));

      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      ctx.clearRect(0, 0, size.width, size.height);
      drawPaperBackground(ctx, size.width, size.height, cameraRef.current.x, time, storyRef.current.progress);
      drawLandmarks(ctx, cameraRef.current.x, size.scale, size.groundScreenY, storyRef.current, time);
      drawPaintStrokes(ctx, strokesRef.current, cameraRef.current.x, size.scale, size.groundScreenY, time);
      drawGround(ctx, size.width, size.height, size.groundScreenY, cameraRef.current.x, time, storyRef.current.progress);
      drawParticles(ctx, particlesRef.current, cameraRef.current.x, size.scale, size.groundScreenY);
      drawPlayer(ctx, player, cameraRef.current.x, size.scale, size.groundScreenY, time, reducedMotion);

      frameId = window.requestAnimationFrame(frame);
    };
    frameId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(frameId);
  }, [addPigmentAt, controlsRef, onDash, paused, reducedMotion]);

  const pointerToWorld = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const size = sizeRef.current;
    return screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, cameraRef.current.x, size.scale, size.groundScreenY);
  };

  const startStroke = (event) => {
    if (paused || event.button > 0) return;
    event.preventDefault();
    canvasRef.current.setPointerCapture?.(event.pointerId);
    hueRef.current = (hueRef.current + 1) % PIGMENTS.length;
    const point = pointerToWorld(event);
    const stroke = { kind: "drawn", points: [point], colour: PIGMENTS[hueRef.current], width: 12 + (hueRef.current % 3) * 3 };
    strokesRef.current.push(stroke);
    if (strokesRef.current.length > MAX_PAINT_STROKES) strokesRef.current.shift();
    activeStrokeRef.current = stroke;
    addPigmentAt(point, true);
  };

  const extendStroke = (event) => {
    const stroke = activeStrokeRef.current;
    if (!stroke || paused) return;
    event.preventDefault();
    const point = pointerToWorld(event);
    const previous = stroke.points.at(-1);
    if (Math.hypot(point.x - previous.x, point.y - previous.y) < 7) return;
    stroke.points.push(point);
    if (stroke.points.length > MAX_POINTS_PER_STROKE) stroke.points.shift();
    addPigmentAt(point);
  };

  const finishStroke = (event) => {
    if (activeStrokeRef.current) event.preventDefault();
    activeStrokeRef.current = null;
    if (canvasRef.current.hasPointerCapture?.(event.pointerId)) canvasRef.current.releasePointerCapture(event.pointerId);
  };

  return (
    <canvas
      ref={canvasRef}
      className="paper-world-canvas"
      aria-label="Interactive paper world. Move with A and D, jump with W or Space, and drag on the canvas to draw solid paint paths."
      onPointerDown={startStroke}
      onPointerMove={extendStroke}
      onPointerUp={finishStroke}
      onPointerCancel={finishStroke}
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}
