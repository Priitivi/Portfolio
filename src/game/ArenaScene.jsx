import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { weaponStats } from "../data/fightData";

const ARENA_RADIUS = 8.5;

function Hair({ style, color = "#2a1812" }) {
  if (style === "twists") {
    return (
      <group>
        {[
          [-0.34, 3.08, 0.12], [0, 3.18, 0.08], [0.34, 3.08, 0.12],
          [-0.43, 2.95, -0.08], [0.43, 2.95, -0.08], [-0.2, 3.03, -0.32], [0.2, 3.03, -0.32],
        ].map((position, index) => (
          <group key={index} position={position}>
            <mesh castShadow><cylinderGeometry args={[0.095, 0.12, 0.36, 7]} /><meshStandardMaterial color={color} roughness={0.92} /></mesh>
            <mesh position={[0, 0.2, 0]} castShadow><sphereGeometry args={[0.115, 8, 6]} /><meshStandardMaterial color="#facc15" /></mesh>
          </group>
        ))}
      </group>
    );
  }

  if (style === "fade") {
    return (
      <mesh position={[0, 3.08, -0.05]} scale={[1.04, 0.3, 1.02]} castShadow>
        <sphereGeometry args={[0.58, 14, 10]} />
        <meshStandardMaterial color={color} roughness={0.94} />
      </mesh>
    );
  }

  const spikes = [
    [-0.4, 3.08, 0, -0.25], [-0.2, 3.23, 0, -0.12], [0, 3.3, 0, 0],
    [0.22, 3.23, 0, 0.12], [0.42, 3.08, 0, 0.25],
    [-0.31, 3.07, -0.34, -0.2], [0, 3.19, -0.38, 0], [0.31, 3.07, -0.34, 0.2],
  ];
  return (
    <group>
      <mesh position={[0, 2.94, -0.08]} scale={[1.03, 0.55, 1]} castShadow>
        <sphereGeometry args={[0.58, 14, 10]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
      {spikes.map(([x, y, z, tilt], index) => (
        <mesh key={index} position={[x, y, z]} rotation={[0, 0, tilt]} castShadow>
          <coneGeometry args={[0.17, 0.72, 6]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Weapon({ type, accent, enemy }) {
  if (type === "sword") {
    return (
      <group position={[0, -0.75, 0.02]} rotation={[0, 0, -0.08]}>
        <mesh position={[0, -0.22, 0]}><cylinderGeometry args={[0.07, 0.07, 0.45, 8]} /><meshStandardMaterial color="#2b2c31" metalness={0.8} /></mesh>
        <mesh position={[0, -0.46, 0]}><boxGeometry args={[0.48, 0.08, 0.12]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} /></mesh>
        <mesh position={[0, -1.25, 0]}><boxGeometry args={[0.13, 1.5, 0.07]} /><meshStandardMaterial color={enemy ? "#f4f4f5" : "#e8edf5"} metalness={0.75} roughness={0.2} emissive={accent} emissiveIntensity={0.45} /></mesh>
      </group>
    );
  }

  if (type === "bow") {
    return (
      <group position={[0, -0.62, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh><torusGeometry args={[0.62, 0.055, 7, 20, Math.PI]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} /></mesh>
        <mesh position={[0, 0, 0]} scale={[0.02, 0.66, 0.02]}><boxGeometry /><meshStandardMaterial color="#e5e7eb" /></mesh>
      </group>
    );
  }

  return (
    <group position={[0, -0.72, 0.08]}>
      <mesh><sphereGeometry args={[0.19, 9, 7]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.35} metalness={0.35} /></mesh>
    </group>
  );
}

export function FighterModel({ appearance, enemy = false, attackRef, dodgeRef, movingRef, hitRef }) {
  const body = useRef();
  const leftArm = useRef();
  const rightArm = useRef();
  const leftLeg = useRef();
  const rightLeg = useRef();
  const accent = enemy ? "#facc15" : appearance.shoes;
  const skin = enemy ? "#7a4b32" : appearance.skin;
  const top = enemy ? "#07080a" : appearance.top;
  const bottom = enemy ? "#17191f" : appearance.bottom;
  const hair = enemy ? "spikes" : appearance.hair;
  const weapon = enemy ? "sword" : appearance.weapon;

  useFrame(({ clock }) => {
    const moving = movingRef?.current ?? false;
    const attack = attackRef?.current ?? 0;
    const dodge = dodgeRef?.current ?? 0;
    const hit = hitRef?.current ?? 0;
    const walk = moving ? Math.sin(clock.elapsedTime * 11) : 0;
    const strike = attack > 0 ? Math.sin((1 - attack) * Math.PI) : 0;

    if (body.current) {
      body.current.position.y = moving ? Math.abs(Math.sin(clock.elapsedTime * 11)) * 0.055 : 0;
      body.current.rotation.z = dodge > 0 ? -0.48 * Math.sin((1 - dodge) * Math.PI) : 0;
      const hitScale = hit > 0 ? 1 + Math.sin(hit * Math.PI * 4) * 0.035 : 1;
      body.current.scale.setScalar(hitScale);
    }
    if (leftArm.current && rightArm.current) {
      leftArm.current.rotation.x = walk * 0.45;
      rightArm.current.rotation.x = -walk * 0.45 - strike * (weapon === "bow" ? 0.7 : 1.7);
      rightArm.current.rotation.z = strike * (weapon === "fists" ? -0.55 : -0.22);
      leftArm.current.rotation.z = weapon === "bow" && strike > 0 ? 0.9 : strike * 0.35;
    }
    if (leftLeg.current && rightLeg.current) {
      leftLeg.current.rotation.x = -walk * 0.5;
      rightLeg.current.rotation.x = walk * 0.5;
    }
  });

  return (
    <group ref={body} scale={enemy ? 1.08 : 1}>
      <mesh position={[0, 2.58, 0]} scale={[0.93, 1.04, 0.92]} castShadow><sphereGeometry args={[0.56, 16, 12]} /><meshStandardMaterial color={skin} roughness={0.82} /></mesh>
      <Hair style={hair} color={enemy ? "#e8e8ea" : "#2b1812"} />
      {[-0.2, 0.2].map((x) => (
        <group key={x} position={[x, 2.63, 0.49]}>
          <mesh scale={[1.3, 0.62, 0.38]}><sphereGeometry args={[0.09, 9, 7]} /><meshStandardMaterial color="#f8fafc" /></mesh>
          <mesh position={[x > 0 ? -0.012 : 0.012, -0.004, 0.045]} scale={[1, 0.78, 0.45]}><sphereGeometry args={[0.038, 8, 6]} /><meshBasicMaterial color={enemy ? "#facc15" : "#171717"} /></mesh>
          <mesh position={[0, 0.135, 0.025]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}><boxGeometry args={[0.2, 0.035, 0.035]} /><meshStandardMaterial color={enemy ? "#d7d7da" : "#27140f"} /></mesh>
        </group>
      ))}
      <mesh position={[0, 2.39, 0.49]} scale={[0.15, 0.025, 0.025]}><boxGeometry /><meshStandardMaterial color="#321812" /></mesh>

      <mesh position={[0, 1.55, 0]} castShadow><cylinderGeometry args={[0.55, 0.46, 1.15, 8]} /><meshStandardMaterial color={top} roughness={0.72} /></mesh>
      <mesh position={[0, 1.62, 0.48]}><boxGeometry args={[0.55, 0.72, 0.08]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={enemy ? 0.8 : 0.18} /></mesh>

      <group ref={leftArm} position={[-0.65, 1.93, 0]}>
        <mesh position={[0, -0.42, 0]} castShadow><cylinderGeometry args={[0.16, 0.19, 0.88, 8]} /><meshStandardMaterial color={top} /></mesh>
        <mesh position={[0, -0.88, 0]}><sphereGeometry args={[0.18, 9, 7]} /><meshStandardMaterial color={skin} /></mesh>
        {weapon === "fists" && <Weapon type="fists" accent={accent} />}
      </group>
      <group ref={rightArm} position={[0.65, 1.93, 0]}>
        <mesh position={[0, -0.42, 0]} castShadow><cylinderGeometry args={[0.16, 0.19, 0.88, 8]} /><meshStandardMaterial color={top} /></mesh>
        <mesh position={[0, -0.88, 0]}><sphereGeometry args={[0.18, 9, 7]} /><meshStandardMaterial color={skin} /></mesh>
        <Weapon type={weapon} accent={accent} enemy={enemy} />
      </group>

      <group ref={leftLeg} position={[-0.28, 1.05, 0]}>
        <mesh position={[0, -0.52, 0]} castShadow><cylinderGeometry args={[0.19, 0.22, 1.04, 8]} /><meshStandardMaterial color={bottom} /></mesh>
        <mesh position={[0, -1.05, 0.12]}><boxGeometry args={[0.42, 0.24, 0.7]} /><meshStandardMaterial color={appearance.shoes} /></mesh>
      </group>
      <group ref={rightLeg} position={[0.28, 1.05, 0]}>
        <mesh position={[0, -0.52, 0]} castShadow><cylinderGeometry args={[0.19, 0.22, 1.04, 8]} /><meshStandardMaterial color={bottom} /></mesh>
        <mesh position={[0, -1.05, 0.12]}><boxGeometry args={[0.42, 0.24, 0.7]} /><meshStandardMaterial color={appearance.shoes} /></mesh>
      </group>
    </group>
  );
}

function ArenaWorld() {
  return (
    <>
      <color attach="background" args={["#050609"]} />
      <fog attach="fog" args={["#050609", 18, 36]} />
      <ambientLight intensity={0.9} color="#93a4bf" />
      <hemisphereLight args={["#75849c", "#090909", 1.2]} />
      <directionalLight castShadow position={[7, 13, 8]} intensity={2.7} color="#fff2b3" shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, 5, 0]} color="#facc15" intensity={30} distance={18} />

      <mesh position={[0, -0.55, 0]} receiveShadow><cylinderGeometry args={[11.5, 12, 1.1, 48]} /><meshStandardMaterial color="#151820" roughness={0.92} /></mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[8.7, 9.05, 48]} /><meshBasicMaterial color="#facc15" /></mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[3.8, 3.9, 48]} /><meshBasicMaterial color="#3f424b" /></mesh>
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
        <group key={angle} position={[Math.sin(angle) * 11.2, 0, Math.cos(angle) * 11.2]}>
          <mesh position={[0, 2.4, 0]} castShadow><cylinderGeometry args={[0.45, 0.7, 4.8, 8]} /><meshStandardMaterial color="#12141a" /></mesh>
          <mesh position={[0, 4.65, 0]}><octahedronGeometry args={[0.55]} /><meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={2} /></mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 8.2, 2.4, -5.8]} rotation={[0, side * -0.25, 0]}>
          <mesh><boxGeometry args={[4.8, 3.2, 0.2]} /><meshStandardMaterial color="#0d0f14" /></mesh>
          <mesh position={[0, 0, 0.12]}><boxGeometry args={[3.8, 0.16, 0.05]} /><meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={1.5} /></mesh>
        </group>
      ))}
    </>
  );
}

function clampToArena(position) {
  const distance = Math.hypot(position.x, position.z);
  if (distance > ARENA_RADIUS) {
    position.x = (position.x / distance) * ARENA_RADIUS;
    position.z = (position.z / distance) * ARENA_RADIUS;
  }
}

function BattleController({ appearance, mobileKeys, paused, reducedMotion, resetToken, onBossDamage, onPlayerDamage, onReady }) {
  const player = useRef();
  const boss = useRef();
  const projectile = useRef();
  const keys = useRef(new Set());
  const playerAttack = useRef(0);
  const bossAttack = useRef(0);
  const playerDodge = useRef(0);
  const playerMoving = useRef(false);
  const bossMoving = useRef(false);
  const playerHit = useRef(0);
  const bossHit = useRef(0);
  const attackCooldown = useRef(0);
  const dodgeCooldown = useRef(0);
  const bossCooldown = useRef(1.2);
  const bossWindup = useRef(-1);
  const projectileTime = useRef(0);
  const ready = useRef(false);
  const { camera } = useThree();
  const direction = useMemo(() => new THREE.Vector3(), []);
  const dodgeDirection = useMemo(() => new THREE.Vector3(), []);
  const projectileStart = useMemo(() => new THREE.Vector3(), []);
  const projectileEnd = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const keyDown = (event) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      keys.current.add(event.code);
    };
    const keyUp = (event) => keys.current.delete(event.code);
    const clear = () => keys.current.clear();
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clear);
    };
  }, []);

  useEffect(() => {
    if (!player.current || !boss.current) return;
    player.current.position.set(0, 0, 5.4);
    boss.current.position.set(0, 0, -5.2);
    attackCooldown.current = 0;
    dodgeCooldown.current = 0;
    bossCooldown.current = 1.1;
    bossWindup.current = -1;
  }, [resetToken]);

  useFrame((_, delta) => {
    if (!player.current || !boss.current) return;
    if (!ready.current) {
      ready.current = true;
      onReady();
    }

    camera.position.lerp(new THREE.Vector3(0, 10.8, 14.6), reducedMotion ? 1 : 0.08);
    camera.lookAt(0, 1.1, 0);

    playerAttack.current = Math.max(0, playerAttack.current - delta * 2.7);
    bossAttack.current = Math.max(0, bossAttack.current - delta * 2.5);
    playerDodge.current = Math.max(0, playerDodge.current - delta * 2.5);
    playerHit.current = Math.max(0, playerHit.current - delta * 3.5);
    bossHit.current = Math.max(0, bossHit.current - delta * 3.5);
    attackCooldown.current = Math.max(0, attackCooldown.current - delta);
    dodgeCooldown.current = Math.max(0, dodgeCooldown.current - delta);
    bossCooldown.current = Math.max(0, bossCooldown.current - delta);

    if (projectile.current) {
      projectileTime.current = Math.max(0, projectileTime.current - delta * 2.6);
      projectile.current.visible = projectileTime.current > 0;
      if (projectileTime.current > 0) {
        projectile.current.position.lerpVectors(projectileEnd, projectileStart, projectileTime.current);
      }
    }

    if (paused) {
      playerMoving.current = false;
      bossMoving.current = false;
      return;
    }

    if (bossWindup.current > 0) {
      bossWindup.current -= delta;
      if (bossWindup.current <= 0) {
        const strikeDistance = player.current.position.distanceTo(boss.current.position);
        if (strikeDistance < 2.35 && playerDodge.current < 0.45) {
          playerHit.current = 1;
          onPlayerDamage(9);
        }
        bossWindup.current = -1;
      }
    }

    const pressed = (code) => keys.current.has(code) || mobileKeys.current.has(code);
    direction.set(0, 0, 0);
    if (pressed("KeyW") || pressed("ArrowUp")) direction.z -= 1;
    if (pressed("KeyS") || pressed("ArrowDown")) direction.z += 1;
    if (pressed("KeyA") || pressed("ArrowLeft")) direction.x -= 1;
    if (pressed("KeyD") || pressed("ArrowRight")) direction.x += 1;
    if (direction.lengthSq() > 0) direction.normalize();

    const wantsDodge = pressed("Space") || pressed("KeyK");
    if (wantsDodge && dodgeCooldown.current <= 0) {
      playerDodge.current = 1;
      dodgeCooldown.current = 1;
      if (direction.lengthSq() === 0) {
        dodgeDirection.subVectors(player.current.position, boss.current.position).setY(0).normalize();
      } else {
        dodgeDirection.copy(direction);
      }
    }

    const dodgeSpeed = playerDodge.current > 0 ? 11.5 : 0;
    const moveSpeed = playerDodge.current > 0 ? dodgeSpeed : 5.1;
    const activeDirection = playerDodge.current > 0 ? dodgeDirection : direction;
    player.current.position.addScaledVector(activeDirection, moveSpeed * delta);
    clampToArena(player.current.position);
    playerMoving.current = activeDirection.lengthSq() > 0;

    const toBossX = boss.current.position.x - player.current.position.x;
    const toBossZ = boss.current.position.z - player.current.position.z;
    player.current.rotation.y = Math.atan2(toBossX, toBossZ);

    const distance = player.current.position.distanceTo(boss.current.position);
    const stats = weaponStats[appearance.weapon];
    const wantsAttack = pressed("KeyJ") || pressed("KeyF") || pressed("Enter");
    if (wantsAttack && attackCooldown.current <= 0) {
      attackCooldown.current = stats.cooldown;
      playerAttack.current = 1;
      if (distance <= stats.range) {
        bossHit.current = 1;
        onBossDamage(stats.damage);
        if (appearance.weapon === "bow" && projectile.current) {
          projectileStart.copy(player.current.position).setY(1.8);
          projectileEnd.copy(boss.current.position).setY(1.7);
          projectileTime.current = 1;
          projectile.current.visible = true;
        }
      }
    }

    const bossDirection = direction.subVectors(player.current.position, boss.current.position).setY(0);
    const bossDistance = bossDirection.length();
    bossDirection.normalize();
    boss.current.rotation.y = Math.atan2(bossDirection.x, bossDirection.z);
    if (bossDistance > 2.05) {
      boss.current.position.addScaledVector(bossDirection, delta * 3.15);
      clampToArena(boss.current.position);
      bossMoving.current = true;
    } else {
      bossMoving.current = false;
      if (bossCooldown.current <= 0) {
        bossCooldown.current = 1.35;
        bossAttack.current = 1;
        bossWindup.current = 0.38;
      }
    }
  });

  return (
    <>
      <group ref={player} position={[0, 0, 5.4]}>
        <FighterModel appearance={appearance} attackRef={playerAttack} dodgeRef={playerDodge} movingRef={playerMoving} hitRef={playerHit} />
      </group>
      <group ref={boss} position={[0, 0, -5.2]}>
        <FighterModel appearance={{ ...appearance, shoes: "#facc15" }} enemy attackRef={bossAttack} dodgeRef={{ current: 0 }} movingRef={bossMoving} hitRef={bossHit} />
      </group>
      <mesh ref={projectile} visible={false}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={3} />
      </mesh>
    </>
  );
}

export function CharacterPreview({ appearance, reducedMotion }) {
  const fighter = useRef();
  const idle = useRef(false);
  const zero = useRef(0);
  useFrame(({ clock }) => {
    if (!fighter.current) return;
    fighter.current.rotation.y = reducedMotion ? 0.25 : 0.25 + Math.sin(clock.elapsedTime * 0.55) * 0.32;
  });
  return (
    <>
      <color attach="background" args={["#090a0d"]} />
      <ambientLight intensity={1.8} />
      <directionalLight position={[4, 8, 6]} intensity={3} color="#fff2c2" />
      <pointLight position={[-3, 3, 3]} intensity={16} color="#facc15" />
      <group ref={fighter} position={[0, -1.25, 0]}>
        <FighterModel appearance={appearance} attackRef={zero} dodgeRef={zero} movingRef={idle} hitRef={zero} />
      </group>
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[2.2, 32]} /><meshStandardMaterial color="#17191f" /></mesh>
    </>
  );
}

export default function ArenaScene(props) {
  return (
    <>
      <ArenaWorld />
      <BattleController {...props} />
    </>
  );
}
