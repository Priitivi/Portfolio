import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function Limb({ position, length, radius = 0.12, limbRef }) {
  return (
    <mesh ref={limbRef} position={position} castShadow>
      <cylinderGeometry args={[radius, radius * 1.05, length, 10]} />
      <meshToonMaterial color="#24212c" />
    </mesh>
  );
}

export default function StickPainter({ playerState, reducedMotion }) {
  const root = useRef();
  const leftArm = useRef();
  const rightArm = useRef();
  const leftLeg = useRef();
  const rightLeg = useRef();
  const pencil = useRef();
  const board = useRef();

  useFrame(({ clock }, delta) => {
    const state = playerState.current;
    if (!root.current || !state) return;
    root.current.position.copy(state.position);
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, state.yaw, 12, delta);

    const motion = reducedMotion ? 0.22 : 1;
    const cadence = state.sprinting ? 12 : 8;
    const stride = state.moving ? Math.sin(clock.elapsedTime * cadence) * 0.72 * motion : 0;
    leftLeg.current.rotation.x = stride;
    rightLeg.current.rotation.x = -stride;
    leftArm.current.rotation.x = -stride * 0.72;
    rightArm.current.rotation.x = stride * 0.42 - (state.surfing ? 0.72 : 0);
    root.current.position.y += state.moving && state.grounded ? Math.abs(Math.sin(clock.elapsedTime * cadence)) * 0.045 * motion : 0;
    root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, state.surfing ? -0.12 : 0, 7, delta);

    const boardScale = THREE.MathUtils.damp(board.current.scale.x, state.surfing ? 1 : 0.001, 10, delta);
    board.current.scale.set(boardScale, boardScale, boardScale);
    board.current.rotation.z = Math.sin(clock.elapsedTime * 3.2) * 0.055 * motion;
    pencil.current.rotation.x = THREE.MathUtils.damp(pencil.current.rotation.x, state.surfing ? -0.72 : -0.12, 8, delta);
    pencil.current.rotation.z = -0.42 + Math.sin(clock.elapsedTime * 2.1) * 0.04 * motion;
  });

  return (
    <group ref={root}>
      <mesh ref={board} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.5, 2.15, 8, 18]} />
        <meshStandardMaterial color="#eefcff" emissive="#7d5cff" emissiveIntensity={0.75} metalness={0.96} roughness={0.12} />
      </mesh>

      <Limb position={[0, 1.72, 0]} length={1.45} radius={0.16} />
      <mesh position={[0, 2.8, 0]} castShadow>
        <sphereGeometry args={[0.42, 18, 14]} />
        <meshToonMaterial color="#fcfaf2" />
      </mesh>
      <mesh position={[0, 2.83, 0.38]}>
        <circleGeometry args={[0.12, 16]} />
        <meshBasicMaterial color="#15131b" />
      </mesh>
      <mesh position={[0, 2.83, 0.395]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.055, 0.34]} />
        <meshBasicMaterial color="#fcfaf2" />
      </mesh>

      <group position={[-0.5, 1.92, 0]} rotation={[0, 0, 0.24]}>
        <Limb limbRef={leftArm} position={[0, -0.48, 0]} length={1.18} radius={0.11} />
      </group>
      <group position={[0.5, 1.92, 0]} rotation={[0, 0, -0.24]}>
        <Limb limbRef={rightArm} position={[0, -0.48, 0]} length={1.18} radius={0.11} />
      </group>
      <group position={[-0.24, 0.98, 0]}>
        <Limb limbRef={leftLeg} position={[0, -0.48, 0]} length={1.25} radius={0.12} />
      </group>
      <group position={[0.24, 0.98, 0]}>
        <Limb limbRef={rightLeg} position={[0, -0.48, 0]} length={1.25} radius={0.12} />
      </group>

      <group ref={pencil} position={[0.78, 1.48, 0.32]} rotation={[-0.12, 0, -0.42]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.17, 0.17, 2.65, 6]} />
          <meshToonMaterial color="#ffd82e" />
        </mesh>
        <mesh position={[0, -1.48, 0]} rotation={[0, 0, Math.PI]} castShadow>
          <coneGeometry args={[0.18, 0.35, 8]} />
          <meshToonMaterial color="#20202a" />
        </mesh>
        <mesh position={[0, 1.41, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.2, 8]} />
          <meshToonMaterial color="#ff70aa" />
        </mesh>
      </group>
    </group>
  );
}
