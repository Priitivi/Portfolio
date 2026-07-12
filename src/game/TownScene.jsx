import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const WORLD_LIMIT = 16.5;
const PLAYER_RADIUS = 0.48;
const PROJECT_ENTRY = new THREE.Vector2(0, -4.4);

const COLLIDERS = [
  { minX: -4.4, maxX: 4.4, minZ: -12.2, maxZ: -6 },
  { minX: -15, maxX: -9, minZ: -14.5, maxZ: -9 },
  { minX: 9, maxX: 15, minZ: -14.5, maxZ: -9 },
  { minX: -15, maxX: -9, minZ: 8.5, maxZ: 14 },
  { minX: 9, maxX: 15, minZ: 8.5, maxZ: 14 },
];

function collides(x, z) {
  return COLLIDERS.some(
    (box) =>
      x > box.minX - PLAYER_RADIUS &&
      x < box.maxX + PLAYER_RADIUS &&
      z > box.minZ - PLAYER_RADIUS &&
      z < box.maxZ + PLAYER_RADIUS,
  );
}

function StreetLight({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 2.8, 8]} />
        <meshStandardMaterial color="#191b20" metalness={0.7} />
      </mesh>
      <mesh position={[0, 2.85, 0]}>
        <boxGeometry args={[0.45, 0.2, 0.45]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 2.65, 0]} color="#ffd84d" intensity={8} distance={6} />
    </group>
  );
}

function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1.3, 6]} />
        <meshStandardMaterial color="#3d2c22" />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <coneGeometry args={[0.9, 2.1, 7]} />
        <meshStandardMaterial color="#34463a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function BuildingShell({ position, accent = "#6b7280", scale = [1, 1, 1] }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.5, 4.2, 4.5]} />
        <meshStandardMaterial color="#15181d" roughness={0.75} />
      </mesh>
      <mesh position={[0, 3.15, 2.27]}>
        <boxGeometry args={[2.7, 0.18, 0.08]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} />
      </mesh>
      {[-1.55, 0, 1.55].map((x) => (
        <mesh key={x} position={[x, 1.9, 2.28]}>
          <boxGeometry args={[0.72, 0.9, 0.07]} />
          <meshStandardMaterial color="#d9dde6" emissive={accent} emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function ProjectStudio({ nearby }) {
  return (
    <group position={[0, 0, -9]}>
      <mesh position={[0, 2.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.8, 5.4, 6.2]} />
        <meshStandardMaterial color="#111318" roughness={0.68} />
      </mesh>
      <mesh position={[0, 4.55, 3.13]}>
        <boxGeometry args={[5.5, 0.65, 0.12]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={1.3} />
      </mesh>
      {[-2.7, 2.7].map((x) => (
        <mesh key={x} position={[x, 2.8, 3.14]}>
          <boxGeometry args={[1.55, 1.55, 0.08]} />
          <meshStandardMaterial color="#b7c5d8" emissive="#facc15" emissiveIntensity={0.18} />
        </mesh>
      ))}
      <mesh position={[0, 1.35, 3.16]}>
        <boxGeometry args={[1.8, 2.7, 0.12]} />
        <meshStandardMaterial
          color={nearby ? "#fff4a3" : "#252a32"}
          emissive="#facc15"
          emissiveIntensity={nearby ? 1.8 : 0.3}
        />
      </mesh>
      <mesh position={[0, 0.035, 4.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.25, 32]} />
        <meshBasicMaterial color="#facc15" transparent opacity={nearby ? 0.95 : 0.35} />
      </mesh>
    </group>
  );
}

function Town({ nearby }) {
  return (
    <>
      <color attach="background" args={["#08090c"]} />
      <fog attach="fog" args={["#08090c", 22, 48]} />
      <ambientLight intensity={0.7} color="#99a8c4" />
      <hemisphereLight args={["#53627c", "#090909", 1.25]} />
      <directionalLight
        castShadow
        color="#fff1b8"
        intensity={2.3}
        position={[10, 16, 8]}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />

      <mesh position={[0, -0.35, 0]} receiveShadow>
        <boxGeometry args={[36, 0.7, 36]} />
        <meshStandardMaterial color="#171a1f" roughness={0.96} />
      </mesh>

      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5.3, 48]} />
        <meshStandardMaterial color="#242830" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.75, 5.05, 48]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>

      <mesh position={[0, -0.02, -8.5]} receiveShadow>
        <boxGeometry args={[4.2, 0.08, 17]} />
        <meshStandardMaterial color="#0d0f12" />
      </mesh>
      <mesh position={[0, -0.01, 9.2]} receiveShadow>
        <boxGeometry args={[4.2, 0.08, 9]} />
        <meshStandardMaterial color="#0d0f12" />
      </mesh>
      <mesh position={[-9.2, -0.01, 0]} receiveShadow>
        <boxGeometry args={[9, 0.08, 4.2]} />
        <meshStandardMaterial color="#0d0f12" />
      </mesh>
      <mesh position={[9.2, -0.01, 0]} receiveShadow>
        <boxGeometry args={[9, 0.08, 4.2]} />
        <meshStandardMaterial color="#0d0f12" />
      </mesh>

      <ProjectStudio nearby={nearby} />
      <BuildingShell position={[-12, 0, -11.7]} accent="#4b5563" />
      <BuildingShell position={[12, 0, -11.7]} accent="#4b5563" />
      <BuildingShell position={[-12, 0, 11.2]} accent="#4b5563" />
      <BuildingShell position={[12, 0, 11.2]} accent="#4b5563" />

      {[
        [-5.8, 0, -4.5],
        [5.8, 0, -4.5],
        [-5.8, 0, 4.5],
        [5.8, 0, 4.5],
      ].map((position) => (
        <StreetLight key={position.join("-")} position={position} />
      ))}

      <Tree position={[-7.3, 0, 7.2]} />
      <Tree position={[7.5, 0, 7.6]} scale={0.9} />
      <Tree position={[-7.5, 0, -7]} scale={0.8} />
      <Tree position={[7.6, 0, -7]} />
    </>
  );
}

function Player({ disabled, mobileKeys, nearby, onNearbyChange, reducedMotion, resetToken }) {
  const player = useRef();
  const keys = useRef(new Set());
  const yaw = useRef(0);
  const wasNearby = useRef(false);
  const { camera, gl } = useThree();
  const desiredCamera = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const move = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }
      keys.current.add(event.code);
    };
    const onKeyUp = (event) => keys.current.delete(event.code);
    const clearKeys = () => keys.current.clear();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
    };
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    let dragging = false;
    let lastX = 0;

    const pointerDown = (event) => {
      if (event.button !== 0 || disabled) return;
      dragging = true;
      lastX = event.clientX;
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const pointerMove = (event) => {
      if (!dragging) return;
      yaw.current -= (event.clientX - lastX) * 0.006;
      lastX = event.clientX;
    };
    const pointerUp = (event) => {
      dragging = false;
      canvas.releasePointerCapture?.(event.pointerId);
      canvas.style.cursor = "grab";
    };

    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    return () => {
      canvas.style.cursor = "";
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
    };
  }, [disabled, gl]);

  useEffect(() => {
    if (!player.current) return;
    player.current.position.set(0, 0, 6);
    yaw.current = 0;
  }, [resetToken]);

  useFrame(({ clock }, delta) => {
    if (!player.current) return;

    const pressed = (code) => keys.current.has(code) || mobileKeys.current.has(code);
    let inputX = 0;
    let inputZ = 0;

    if (!disabled) {
      if (pressed("KeyW") || pressed("ArrowUp")) inputZ -= 1;
      if (pressed("KeyS") || pressed("ArrowDown")) inputZ += 1;
      if (pressed("KeyA") || pressed("ArrowLeft")) inputX -= 1;
      if (pressed("KeyD") || pressed("ArrowRight")) inputX += 1;
    }

    move.set(0, 0, 0);
    if (inputX || inputZ) {
      const length = Math.hypot(inputX, inputZ);
      inputX /= length;
      inputZ /= length;
      const sin = Math.sin(yaw.current);
      const cos = Math.cos(yaw.current);
      move.x = inputX * cos + inputZ * sin;
      move.z = -inputX * sin + inputZ * cos;

      const sprinting = pressed("ShiftLeft") || pressed("ShiftRight");
      const speed = sprinting ? 7.2 : 4.3;
      const nextX = THREE.MathUtils.clamp(
        player.current.position.x + move.x * speed * delta,
        -WORLD_LIMIT,
        WORLD_LIMIT,
      );
      const nextZ = THREE.MathUtils.clamp(
        player.current.position.z + move.z * speed * delta,
        -WORLD_LIMIT,
        WORLD_LIMIT,
      );

      if (!collides(nextX, player.current.position.z)) player.current.position.x = nextX;
      if (!collides(player.current.position.x, nextZ)) player.current.position.z = nextZ;

      const targetRotation = Math.atan2(move.x, move.z);
      player.current.rotation.y = reducedMotion
        ? targetRotation
        : THREE.MathUtils.lerp(player.current.rotation.y, targetRotation, 0.18);
      player.current.children[0].position.y = reducedMotion
        ? 0
        : Math.sin(clock.elapsedTime * (sprinting ? 15 : 10)) * 0.055;
    } else {
      player.current.children[0].position.y = 0;
    }

    const distanceToEntry = Math.hypot(
      player.current.position.x - PROJECT_ENTRY.x,
      player.current.position.z - PROJECT_ENTRY.y,
    );
    const isNearby = distanceToEntry < 2.15;
    if (isNearby !== wasNearby.current) {
      wasNearby.current = isNearby;
      onNearbyChange(isNearby);
    }

    const cameraDistance = 9.5;
    desiredCamera.set(
      player.current.position.x + Math.sin(yaw.current) * cameraDistance,
      7,
      player.current.position.z + Math.cos(yaw.current) * cameraDistance,
    );
    const cameraBlend = reducedMotion ? 1 : 1 - Math.pow(0.002, delta);
    camera.position.lerp(desiredCamera, cameraBlend);
    lookTarget.set(player.current.position.x, 1.05, player.current.position.z);
    camera.lookAt(lookTarget);
  });

  return (
    <group ref={player} position={[0, 0, 6]}>
      <group>
        <mesh position={[0, 0.92, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.42, 1.05, 8]} />
          <meshStandardMaterial color="#f4f4f5" roughness={0.72} />
        </mesh>
        <mesh position={[0, 1.68, 0]} castShadow>
          <sphereGeometry args={[0.38, 12, 10]} />
          <meshStandardMaterial color="#20242b" roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.7, 0.34]}>
          <boxGeometry args={[0.43, 0.12, 0.06]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={1.7} />
        </mesh>
      </group>
      {nearby && (
        <pointLight position={[0, 1.4, 0]} color="#facc15" intensity={2} distance={2.5} />
      )}
    </group>
  );
}

function ReadySignal({ onReady }) {
  const fired = useRef(false);
  useFrame(() => {
    if (!fired.current) {
      fired.current = true;
      onReady();
    }
  });
  return null;
}

export default function TownScene(props) {
  return (
    <>
      <Town nearby={props.nearby} />
      <Player {...props} />
      <ReadySignal onReady={props.onReady} />
    </>
  );
}
