import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import StickPainter from "./StickPainter";
import { calculatePaintProgress, clampToCanvas, PAINT_GOAL, paintCellKey } from "./paintMath";

const MAX_TRAIL_POINTS = 86;

const trailVertexShader = `
  uniform float uTime;
  varying vec3 vColor;
  varying vec3 vWorld;
  void main() {
    vec3 p = position;
    p.y += sin((p.x + p.z) * 1.8 - uTime * 4.0) * .035;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    vColor = color;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const trailFragmentShader = `
  uniform float uTime;
  varying vec3 vColor;
  varying vec3 vWorld;
  void main() {
    float silk = sin((vWorld.x - vWorld.z) * 3.4 + uTime * 3.2) * .5 + .5;
    float gleam = smoothstep(.58, 1.0, silk);
    vec3 silver = vec3(.82, .94, 1.0);
    vec3 colour = mix(vColor, silver, gleam * .62);
    gl_FragColor = vec4(colour * (1.0 + gleam * .28), .84);
  }
`;

function CanvasStructures({ progressRef, count }) {
  const mesh = useRef();
  const material = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const blank = useMemo(() => new THREE.Color("#e9e7df"), []);
  const alive = useMemo(() => new THREE.Color("#a77bff"), []);
  const target = useMemo(() => new THREE.Color(), []);

  const structures = useMemo(() => Array.from({ length: count }, (_, index) => {
    const angle = index * 2.399963;
    const radius = 10 + (index % 7) * 2.1;
    return {
      x: Math.sin(angle) * radius,
      z: Math.cos(angle) * radius,
      height: 1.3 + (index % 6) * 0.65,
      width: 0.65 + (index % 4) * 0.25,
      rotation: angle * 0.38,
    };
  }), [count]);

  useLayoutEffect(() => {
    structures.forEach((item, index) => {
      dummy.position.set(item.x, item.height * 0.5, item.z);
      dummy.rotation.set(0, item.rotation, index % 3 === 0 ? 0.08 : 0);
      dummy.scale.set(item.width, item.height, item.width * 0.82);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [dummy, structures]);

  useFrame((_, delta) => {
    target.copy(blank).lerp(alive, progressRef.current / 125);
    material.current.color.lerp(target, 1 - Math.pow(0.015, delta));
    material.current.emissiveIntensity = progressRef.current / 250;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial ref={material} color={blank} emissive="#6944ff" emissiveIntensity={0} roughness={0.72} metalness={0.08} />
    </instancedMesh>
  );
}

export default function PaintWorld({ controlsRef, paused, reducedMotion, quality, onProgress, onSurf, onComplete, onReady }) {
  const { camera, scene } = useThree();
  const paintMesh = useRef();
  const particleMesh = useRef();
  const trailMaterial = useRef();
  const paintCursor = useRef(0);
  const paintClock = useRef(0);
  const lastPaintPosition = useRef(new THREE.Vector3(0, 0, 0));
  const paintedCells = useRef(new Set());
  const trailPoints = useRef([]);
  const progressRef = useRef(0);
  const completed = useRef(false);
  const jumpLatch = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colour = useMemo(() => new THREE.Color(), []);
  const moveDirection = useMemo(() => new THREE.Vector3(), []);
  const desiredCamera = useMemo(() => new THREE.Vector3(), []);
  const cameraTarget = useMemo(() => new THREE.Vector3(), []);
  const blankSky = useMemo(() => new THREE.Color("#eeece5"), []);
  const aliveSky = useMemo(() => new THREE.Color("#160d33"), []);
  const skyTarget = useMemo(() => new THREE.Color(), []);

  const maxPaint = quality === "low" ? 260 : 430;
  const particleCount = quality === "low" ? 12 : 22;

  const playerState = useRef({
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(),
    facing: new THREE.Vector3(0, 0, -1),
    yaw: Math.PI,
    velocityY: 0,
    grounded: true,
    moving: false,
    sprinting: false,
    surfing: false,
    surfTimer: 0,
    surfCooldown: 0,
  });

  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_TRAIL_POINTS * 2 * 3);
    const colors = new Float32Array(MAX_TRAIL_POINTS * 2 * 3);
    const indices = new Uint16Array((MAX_TRAIL_POINTS - 1) * 6);
    for (let index = 0; index < MAX_TRAIL_POINTS - 1; index += 1) {
      const vertex = index * 2;
      const offset = index * 6;
      indices.set([vertex, vertex + 1, vertex + 2, vertex + 1, vertex + 3, vertex + 2], offset);
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.setDrawRange(0, 0);
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 80);
    return geometry;
  }, []);

  const trailUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useLayoutEffect(() => {
    for (let index = 0; index < maxPaint; index += 1) {
      dummy.scale.setScalar(0.001);
      dummy.updateMatrix();
      paintMesh.current.setMatrixAt(index, dummy.matrix);
    }
    paintMesh.current.instanceMatrix.needsUpdate = true;
    for (let index = 0; index < particleCount; index += 1) {
      dummy.scale.setScalar(0.001);
      dummy.updateMatrix();
      particleMesh.current.setMatrixAt(index, dummy.matrix);
    }
    particleMesh.current.instanceMatrix.needsUpdate = true;
    onReady();
  }, [dummy, maxPaint, onReady, particleCount]);

  const rebuildTrail = () => {
    const points = trailPoints.current;
    const positions = trailGeometry.attributes.position.array;
    const colors = trailGeometry.attributes.color.array;
    points.forEach((point, index) => {
      const previous = points[Math.max(0, index - 1)];
      const next = points[Math.min(points.length - 1, index + 1)];
      let tangentX = next.x - previous.x;
      let tangentZ = next.z - previous.z;
      const length = Math.hypot(tangentX, tangentZ) || 1;
      tangentX /= length;
      tangentZ /= length;
      const sideX = -tangentZ * point.width;
      const sideZ = tangentX * point.width;
      colour.setHSL((point.hue + index * 0.006) % 1, 0.88, 0.58);
      for (let side = 0; side < 2; side += 1) {
        const vertex = (index * 2 + side) * 3;
        const direction = side === 0 ? -1 : 1;
        positions[vertex] = point.x + sideX * direction;
        positions[vertex + 1] = 0.055;
        positions[vertex + 2] = point.z + sideZ * direction;
        colors[vertex] = colour.r;
        colors[vertex + 1] = colour.g;
        colors[vertex + 2] = colour.b;
      }
    });
    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.color.needsUpdate = true;
    trailGeometry.setDrawRange(0, Math.max(0, points.length - 1) * 6);
  };

  const addPaint = (position, surfing, time) => {
    const width = surfing ? 1.08 : 0.48;
    const hue = (time * 0.055 + paintedCells.current.size * 0.017) % 1;
    const index = paintCursor.current % maxPaint;
    dummy.position.set(position.x, 0.028 + (index % 3) * 0.003, position.z);
    dummy.rotation.set(-Math.PI / 2, 0, hue * Math.PI);
    dummy.scale.setScalar(width * (0.75 + (index % 5) * 0.08));
    dummy.updateMatrix();
    paintMesh.current.setMatrixAt(index, dummy.matrix);
    colour.setHSL(hue, 0.9, 0.56);
    paintMesh.current.setColorAt(index, colour);
    paintMesh.current.instanceMatrix.needsUpdate = true;
    if (paintMesh.current.instanceColor) paintMesh.current.instanceColor.needsUpdate = true;
    paintCursor.current += 1;

    trailPoints.current.push({ x: position.x, z: position.z, width, hue });
    if (trailPoints.current.length > MAX_TRAIL_POINTS) trailPoints.current.shift();
    rebuildTrail();

    const key = paintCellKey(position.x, position.z);
    if (!paintedCells.current.has(key)) {
      paintedCells.current.add(key);
      const progress = calculatePaintProgress(paintedCells.current.size, PAINT_GOAL);
      if (progress !== progressRef.current) {
        progressRef.current = progress;
        onProgress(progress);
      }
      if (progress >= 100 && !completed.current) {
        completed.current = true;
        onComplete();
      }
    }
  };

  useFrame(({ clock }, delta) => {
    const state = playerState.current;
    const time = clock.elapsedTime;
    trailMaterial.current.uniforms.uTime.value = time;
    skyTarget.copy(blankSky).lerp(aliveSky, progressRef.current / 135);
    if (scene.background?.isColor) scene.background.lerp(skyTarget, 1 - Math.pow(0.04, delta));
    if (paused) return;

    const controls = controlsRef.current;
    const horizontal = Number(controls.has("KeyD") || controls.has("ArrowRight")) - Number(controls.has("KeyA") || controls.has("ArrowLeft"));
    const vertical = Number(controls.has("KeyS") || controls.has("ArrowDown")) - Number(controls.has("KeyW") || controls.has("ArrowUp"));
    const hasInput = horizontal !== 0 || vertical !== 0;
    state.sprinting = controls.has("ShiftLeft") || controls.has("ShiftRight");
    state.surfCooldown = Math.max(0, state.surfCooldown - delta);

    const attacking = controls.has("KeyJ") || controls.has("Paint");
    if (attacking && state.surfTimer <= 0.08 && state.surfCooldown <= 0) {
      state.surfTimer = 1.25;
      state.surfCooldown = 0.28;
      onSurf();
    }
    state.surfTimer = Math.max(0, state.surfTimer - delta);
    state.surfing = state.surfTimer > 0;

    moveDirection.set(horizontal, 0, vertical);
    if (hasInput) {
      moveDirection.normalize();
      state.facing.lerp(moveDirection, 1 - Math.pow(0.001, delta)).normalize();
      state.yaw = Math.atan2(state.facing.x, state.facing.z);
    } else if (state.surfing) {
      moveDirection.copy(state.facing);
    }

    const targetSpeed = state.surfing ? 11.5 : state.sprinting ? 8.2 : 5.1;
    const velocityX = moveDirection.x * (hasInput || state.surfing ? targetSpeed : 0);
    const velocityZ = moveDirection.z * (hasInput || state.surfing ? targetSpeed : 0);
    state.velocity.x = THREE.MathUtils.damp(state.velocity.x, velocityX, 9, delta);
    state.velocity.z = THREE.MathUtils.damp(state.velocity.z, velocityZ, 9, delta);
    state.moving = state.velocity.lengthSq() > 0.08;
    state.position.x = clampToCanvas(state.position.x + state.velocity.x * delta);
    state.position.z = clampToCanvas(state.position.z + state.velocity.z * delta);

    const jumpPressed = controls.has("Space");
    if (jumpPressed && !jumpLatch.current && state.grounded) {
      state.velocityY = 8.1;
      state.grounded = false;
    }
    jumpLatch.current = jumpPressed;
    if (!state.grounded) {
      state.velocityY -= (state.surfing ? 7.5 : 19) * delta;
      state.position.y += state.velocityY * delta;
      if (state.position.y <= (state.surfing ? 0.32 : 0)) {
        state.position.y = state.surfing ? 0.32 : 0;
        state.velocityY = 0;
        state.grounded = true;
      }
    } else {
      state.position.y = THREE.MathUtils.damp(state.position.y, state.surfing ? 0.34 : 0, 12, delta);
    }

    paintClock.current += delta;
    if ((state.moving || state.surfing) && (paintClock.current > 0.038 || lastPaintPosition.current.distanceTo(state.position) > 0.42)) {
      addPaint(state.position, state.surfing, time);
      lastPaintPosition.current.copy(state.position);
      paintClock.current = 0;
    }

    for (let index = 0; index < particleCount; index += 1) {
      const active = state.surfing || (state.moving && index < particleCount / 2);
      const phase = time * (3 + index % 4) + index * 2.21;
      dummy.position.set(
        state.position.x - state.facing.x * (0.8 + (index % 5) * 0.15) + Math.sin(phase) * 0.72,
        state.position.y + 0.15 + Math.abs(Math.cos(phase * 1.3)) * 0.5,
        state.position.z - state.facing.z * (0.8 + (index % 5) * 0.15) + Math.cos(phase) * 0.72,
      );
      dummy.rotation.set(phase, phase * 0.7, 0);
      dummy.scale.setScalar(active ? 0.045 + (index % 4) * 0.025 : 0.001);
      dummy.updateMatrix();
      particleMesh.current.setMatrixAt(index, dummy.matrix);
      colour.setHSL((time * 0.08 + index / particleCount) % 1, 0.95, 0.62);
      particleMesh.current.setColorAt(index, colour);
    }
    particleMesh.current.instanceMatrix.needsUpdate = true;
    if (particleMesh.current.instanceColor) particleMesh.current.instanceColor.needsUpdate = true;

    desiredCamera.copy(state.position).addScaledVector(state.facing, -8.8);
    desiredCamera.y += 5.6;
    camera.position.lerp(desiredCamera, 1 - Math.pow(0.003, delta));
    cameraTarget.copy(state.position).addScaledVector(state.facing, 2.5);
    cameraTarget.y += 1.35;
    camera.lookAt(cameraTarget);
  });

  return (
    <>
      <color attach="background" args={[blankSky]} />
      <fog attach="fog" args={[blankSky, 22, 58]} />
      <hemisphereLight args={["#ffffff", "#8a8196", 2.6]} />
      <directionalLight castShadow position={[8, 16, 9]} intensity={3.2} shadow-mapSize={[quality === "low" ? 512 : 1024, quality === "low" ? 512 : 1024]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#f0eee8" roughness={0.94} metalness={0.02} />
      </mesh>
      <gridHelper args={[60, 60, "#b9b5bd", "#d9d5d4"]} position={[0, 0.012, 0]} />
      <CanvasStructures progressRef={progressRef} count={quality === "low" ? 22 : 36} />

      <instancedMesh ref={paintMesh} args={[null, null, maxPaint]} frustumCulled={false} receiveShadow>
        <circleGeometry args={[1, quality === "low" ? 14 : 22]} />
        <meshStandardMaterial vertexColors transparent opacity={0.9} roughness={0.38} metalness={0.26} polygonOffset polygonOffsetFactor={-1} />
      </instancedMesh>

      <mesh geometry={trailGeometry} frustumCulled={false}>
        <shaderMaterial ref={trailMaterial} uniforms={trailUniforms} vertexShader={trailVertexShader} fragmentShader={trailFragmentShader} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} vertexColors />
      </mesh>

      <instancedMesh ref={particleMesh} args={[null, null, particleCount]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial vertexColors transparent opacity={0.88} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>

      <group position={[0, 0, -20]}>
        <mesh position={[0, 5.8, 0]}><boxGeometry args={[13, 0.32, 0.5]} /><meshStandardMaterial color="#e7e4dc" /></mesh>
        <mesh position={[-6.35, 2.8, 0]}><boxGeometry args={[0.32, 6, 0.5]} /><meshStandardMaterial color="#e7e4dc" /></mesh>
        <mesh position={[6.35, 2.8, 0]}><boxGeometry args={[0.32, 6, 0.5]} /><meshStandardMaterial color="#e7e4dc" /></mesh>
        <mesh position={[0, 2.8, -0.15]}><planeGeometry args={[12.4, 5.5]} /><meshStandardMaterial color="#fcfbf6" roughness={1} /></mesh>
      </group>

      <StickPainter playerState={playerState} reducedMotion={reducedMotion} />
    </>
  );
}
