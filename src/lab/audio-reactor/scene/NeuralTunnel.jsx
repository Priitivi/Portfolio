import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export default function NeuralTunnel({ analysisRef, palette, settings, quality }) {
  const rings = useRef([]);
  const particles = useRef();
  const particleCount = Math.round(900 * quality.particleScale);
  const positions = useMemo(() => {
    const data = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.8 + Math.random() * 5.5;
      data[index * 3] = Math.cos(angle) * radius;
      data[index * 3 + 1] = Math.sin(angle) * radius;
      data[index * 3 + 2] = -Math.random() * 42;
    }
    return data;
  }, [particleCount]);

  useFrame(({ clock }, delta) => {
    const audio = analysisRef.current;
    const sensitivity = settings.sensitivity;
    rings.current.forEach((ring, index) => {
      if (!ring) return;
      const depthWave = Math.sin(clock.elapsedTime * 1.3 + index * 0.48);
      const bassScale = 1 + audio.bass * settings.intensity * sensitivity * 1.8 + (audio.beat ? 0.16 : 0);
      const targetScale = bassScale + depthWave * audio.mid * 0.22;
      ring.scale.setScalar(THREE.MathUtils.damp(ring.scale.x, targetScale, 6.5, delta));
      ring.rotation.z += delta * (0.05 + settings.speed * 0.16) * (index % 2 ? 1 : -1);
      ring.position.x = THREE.MathUtils.damp(ring.position.x, Math.sin(index * 0.72 + clock.elapsedTime * 0.45) * audio.mid * 1.5, 4.2, delta);
      ring.position.y = THREE.MathUtils.damp(ring.position.y, Math.cos(index * 0.55 + clock.elapsedTime * 0.38) * audio.lowMid * 1.15, 4.2, delta);
      ring.position.z += delta * (2.2 + settings.speed * 7 + audio.amplitude * 9);
      if (ring.position.z > 5) ring.position.z -= quality.ringCount * 1.35;
    });
    if (particles.current) {
      particles.current.rotation.z += delta * (0.025 + audio.treble * 0.16);
      particles.current.material.size = 0.025 + audio.treble * settings.intensity * 0.12;
      particles.current.material.opacity = 0.35 + audio.treble * 0.65;
    }
  });

  return (
    <group>
      {Array.from({ length: quality.ringCount }, (_, index) => (
        <mesh key={index} ref={(element) => { rings.current[index] = element; }} position={[0, 0, -index * 1.35]}>
          <torusGeometry args={[3.2 + Math.sin(index * 0.7) * 0.28, 0.025 + (index % 5 === 0 ? 0.045 : 0), 5, quality.tier === "high" ? 60 : quality.tier === "medium" ? 48 : 36]} />
          <meshBasicMaterial
            color={index % 3 === 0 ? palette.accent : index % 2 ? palette.secondary : palette.primary}
            transparent
            opacity={0.3 + (index % 5 === 0 ? settings.glow * 0.45 : 0.12)}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      <points ref={particles}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
        <pointsMaterial color={palette.primary} size={0.045} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  );
}
