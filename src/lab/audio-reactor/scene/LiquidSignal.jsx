import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  uniform float uTime;
  uniform float uLow;
  uniform float uMid;
  uniform float uHigh;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  float signalNoise(vec3 p) {
    return sin(p.x * 2.1 + uTime) * cos(p.y * 2.7 - uTime * .7) * sin(p.z * 1.9 + uTime * .4);
  }

  void main() {
    float largeNoise = signalNoise(position * .72 + normal * uTime * .08);
    float mediumNoise = sin(position.x * 5.0 + uTime * 1.4) * sin(position.y * 4.0 - uTime);
    float fineNoise = sin((position.x + position.y + position.z) * 12.0 + uTime * 3.0);
    float displacement = (uLow * largeNoise * 1.2 + uMid * mediumNoise * .42 + uHigh * fineNoise * .12) * uIntensity;
    vec3 transformed = position + normal * displacement;
    vNormal = normalize(normalMatrix * normal);
    vPosition = transformed;
    vDisplacement = displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;
  uniform float uGlow;
  uniform float uBeat;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, normalize(vNormal))), 2.2);
    float signal = sin(vPosition.y * 2.7 + vDisplacement * 8.0) * .5 + .5;
    vec3 colour = mix(uPrimary, uSecondary, signal);
    colour = mix(colour, uAccent, fresnel * (.55 + uBeat * .3));
    colour += fresnel * uGlow * .5;
    gl_FragColor = vec4(colour, 1.0);
  }
`;

export default function LiquidSignal({ analysisRef, palette, settings, quality }) {
  const material = useRef();
  const group = useRef();
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uLow: { value: 0 }, uMid: { value: 0 }, uHigh: { value: 0 },
    uIntensity: { value: settings.intensity }, uPrimary: { value: new THREE.Color(palette.primary) },
    uSecondary: { value: new THREE.Color(palette.secondary) }, uAccent: { value: new THREE.Color(palette.accent) },
    uGlow: { value: settings.glow }, uBeat: { value: 0 },
  }), [palette, settings.glow, settings.intensity]);

  useFrame(({ clock }, delta) => {
    const audio = analysisRef.current;
    if (!material.current || !group.current) return;
    const values = material.current.uniforms;
    values.uTime.value = clock.elapsedTime * (0.35 + settings.speed);
    values.uLow.value = THREE.MathUtils.damp(values.uLow.value, audio.subBass + audio.bass, 6.5, delta);
    values.uMid.value = THREE.MathUtils.damp(values.uMid.value, audio.lowMid + audio.mid, 5.2, delta);
    values.uHigh.value = THREE.MathUtils.damp(values.uHigh.value, audio.highMid + audio.treble, 4.5, delta);
    values.uIntensity.value = settings.intensity * settings.sensitivity;
    values.uGlow.value = settings.glow;
    values.uBeat.value = audio.beat ? 1 : THREE.MathUtils.damp(values.uBeat.value, 0, 5.5, delta);
    group.current.rotation.y += delta * (0.08 + settings.speed * 0.16);
    group.current.rotation.x = Math.sin(clock.elapsedTime * 0.23) * 0.16;
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, audio.stereoBalance * 0.65, 3.4, delta);
    const scale = THREE.MathUtils.damp(group.current.scale.x, 1 + audio.bass * settings.intensity * 0.16, 5, delta);
    group.current.scale.setScalar(scale);
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[2.65, quality.tier === "low" ? 3 : 4]} />
        <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
      </mesh>
      <mesh scale={1.14}>
        <icosahedronGeometry args={[2.65, 2]} />
        <meshBasicMaterial color={palette.accent} wireframe transparent opacity={0.08 + settings.glow * 0.08} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
