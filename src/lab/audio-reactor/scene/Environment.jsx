import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

function CameraRig({ analysisRef, settings, reducedMotion }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    const audio = analysisRef.current;
    const motion = reducedMotion ? 0 : settings.cameraMotion;
    target.set(
      audio.stereoBalance * motion * 1.3 + Math.sin(clock.elapsedTime * 0.23) * motion * 0.4,
      Math.sin(clock.elapsedTime * 0.19) * motion * 0.24,
      8.5 - audio.amplitude * motion * 1.2,
    );
    camera.position.lerp(target, 1 - Math.pow(0.002, delta));
    lookAt.set(0, 0, -4 - audio.bass * 2);
    camera.lookAt(lookAt);
  });
  return null;
}

export default function Environment({ palette, analysisRef, settings, reducedMotion }) {
  return (
    <>
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.background, 8, 42]} />
      <ambientLight intensity={0.5 + settings.glow * 0.5} color={palette.secondary} />
      <pointLight position={[4, 5, 6]} color={palette.primary} intensity={8 + settings.glow * 16} distance={25} />
      <pointLight position={[-5, -3, 1]} color={palette.accent} intensity={5 + settings.glow * 12} distance={24} />
      <CameraRig analysisRef={analysisRef} settings={settings} reducedMotion={reducedMotion} />
    </>
  );
}
