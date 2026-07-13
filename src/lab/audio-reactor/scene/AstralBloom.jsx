import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uIntensity;
  attribute float aRing;
  attribute float aSeed;
  varying float vEnergy;
  varying float vSeed;
  void main() {
    vec3 p = position;
    float angle = uTime * (.08 + aRing * .015) + uMid * aRing * .22;
    float cs = cos(angle);
    float sn = sin(angle);
    p.xy = mat2(cs, -sn, sn, cs) * p.xy;
    p *= 1.0 + uBass * uIntensity * (.28 + aRing * .025);
    p.z += sin(aSeed * 18.0 + uTime * 1.7) * uTreble * .7;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (2.2 + uTreble * 8.0 + aSeed * 2.0) * (9.0 / -mvPosition.z);
    vEnergy = uBass * .45 + uMid * .35 + uTreble * .55;
    vSeed = aSeed;
  }
`;

const fragmentShader = `
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;
  uniform float uGlow;
  varying float vEnergy;
  varying float vSeed;
  void main() {
    float distanceToCentre = distance(gl_PointCoord, vec2(.5));
    if (distanceToCentre > .5) discard;
    float alpha = smoothstep(.5, .05, distanceToCentre);
    vec3 colour = mix(uPrimary, uSecondary, vSeed);
    colour = mix(colour, uAccent, clamp(vEnergy, 0.0, 1.0));
    gl_FragColor = vec4(colour * (1.0 + uGlow * .35), alpha * .82);
  }
`;

export default function AstralBloom({ analysisRef, palette, settings, quality }) {
  const material = useRef();
  const group = useRef();
  const count = Math.round(3200 * quality.particleScale);
  const attributes = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const rings = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let index = 0; index < count; index += 1) {
      const progress = index / count;
      const ring = index % 11;
      const theta = progress * Math.PI * 2 * 34 + ring * 0.17;
      const rose = (1.25 + ring * 0.2) * Math.cos((3 + ring % 4) * theta);
      const spiral = 0.45 + progress * 3.8;
      const radius = rose * 0.55 + spiral;
      positions[index * 3] = Math.cos(theta) * radius;
      positions[index * 3 + 1] = Math.sin(theta) * radius;
      positions[index * 3 + 2] = Math.sin(theta * 2 + ring) * 0.45;
      rings[index] = ring;
      seeds[index] = (index * 0.61803398875) % 1;
    }
    return { positions, rings, seeds };
  }, [count]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uBass: { value: 0 }, uMid: { value: 0 }, uTreble: { value: 0 },
    uIntensity: { value: settings.intensity }, uGlow: { value: settings.glow },
    uPrimary: { value: new THREE.Color(palette.primary) }, uSecondary: { value: new THREE.Color(palette.secondary) },
    uAccent: { value: new THREE.Color(palette.accent) },
  }), [palette, settings.glow, settings.intensity]);

  useFrame(({ clock }, delta) => {
    if (!material.current || !group.current) return;
    const audio = analysisRef.current;
    const values = material.current.uniforms;
    values.uTime.value = clock.elapsedTime * (0.3 + settings.speed);
    values.uBass.value = THREE.MathUtils.damp(values.uBass.value, audio.bass * settings.sensitivity + (audio.beat ? 0.18 : 0), 6, delta);
    values.uMid.value = THREE.MathUtils.damp(values.uMid.value, audio.mid * settings.sensitivity, 5, delta);
    values.uTreble.value = THREE.MathUtils.damp(values.uTreble.value, audio.treble * settings.sensitivity, 4, delta);
    values.uIntensity.value = settings.intensity;
    values.uGlow.value = settings.glow;
    group.current.rotation.z += delta * (0.025 + audio.mid * 0.1);
    group.current.rotation.x = Math.sin(clock.elapsedTime * 0.18) * 0.22;
  });

  return (
    <points ref={group}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attributes.positions, 3]} />
        <bufferAttribute attach="attributes-aRing" args={[attributes.rings, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[attributes.seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
