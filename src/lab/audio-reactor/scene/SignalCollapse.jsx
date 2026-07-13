import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export default function SignalCollapse({ analysisRef, palette, settings, quality }) {
  const fragments = useRef();
  const ghost = useRef();
  const group = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = Math.round(210 * quality.particleScale);
  const smoothChaos = useRef(0);
  const beatLift = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!fragments.current || !ghost.current || !group.current) return;
    const audio = analysisRef.current;
    const targetChaos = (audio.mid * 0.65 + audio.treble * 0.75) * settings.intensity * settings.sensitivity;
    smoothChaos.current = THREE.MathUtils.damp(smoothChaos.current, targetChaos, 5, delta);
    beatLift.current = audio.beat ? 0.4 : THREE.MathUtils.damp(beatLift.current, 0, 5.5, delta);
    const chaos = smoothChaos.current;
    for (let index = 0; index < count; index += 1) {
      const column = index % 15;
      const row = Math.floor(index / 15);
      const phase = index * 0.91 + clock.elapsedTime * (0.4 + settings.speed);
      const slice = Math.sin(phase * 1.7) * chaos;
      dummy.position.set(
        (column - 7) * 0.56 + slice * (index % 3 - 1),
        (row - Math.ceil(count / 15) / 2) * 0.48,
        Math.cos(phase) * chaos * 1.8 - 2,
      );
      dummy.rotation.set(slice * 0.4, phase * 0.08, slice * 0.65);
      const scale = 0.75 + audio.bass * 1.3 + beatLift.current;
      dummy.scale.set(0.42 * scale, 0.28 + Math.abs(slice) * 0.5, 0.08 + audio.treble * 0.28);
      dummy.updateMatrix();
      fragments.current.setMatrixAt(index, dummy.matrix);
      dummy.position.x += 0.08 + chaos * 0.18;
      dummy.updateMatrix();
      ghost.current.setMatrixAt(index, dummy.matrix);
    }
    fragments.current.instanceMatrix.needsUpdate = true;
    ghost.current.instanceMatrix.needsUpdate = true;
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, audio.beat ? Math.sin(clock.elapsedTime * 80) * 0.1 : 0, 7, delta);
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.24) * 0.045;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={fragments} args={[null, null, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={palette.primary} transparent opacity={0.72} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={ghost} args={[null, null, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={palette.secondary} transparent opacity={0.22 + settings.glow * 0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>
      {[-2.6, -1.1, 0.5, 2.2].map((y, index) => (
        <mesh key={y} position={[0, y, -1 + index * 0.35]}>
          <planeGeometry args={[11, 0.012 + index * 0.008]} />
          <meshBasicMaterial color={index % 2 ? palette.accent : palette.secondary} transparent opacity={0.25} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}
