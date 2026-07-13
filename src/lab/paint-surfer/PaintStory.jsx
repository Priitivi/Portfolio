import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { paintStoryChapters } from "./storyConfig";

const blank = new THREE.Color("#e7e4dc");

function StoryBeacon({ chapter, index, storyRef, reducedMotion }) {
  const ring = useRef();
  const column = useRef();
  const marker = useRef();

  useFrame(({ clock }) => {
    const active = storyRef.current.activeIndex === index;
    const complete = storyRef.current.chapterProgress[index] >= 1;
    const pulse = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 3.4 + index) * 0.12;
    ring.current.visible = active;
    column.current.visible = active;
    marker.current.visible = !complete;
    ring.current.scale.setScalar(active ? pulse : 0.001);
    ring.current.material.opacity = active ? 0.72 : 0;
    column.current.material.opacity = active ? 0.1 + (pulse - 0.88) * 0.18 : 0;
    marker.current.position.y = 5.7 + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 2.1 + index) * 0.22);
    marker.current.rotation.y += active && !reducedMotion ? 0.012 : 0;
  });

  return (
    <group position={[chapter.position.x, 0, chapter.position.z]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
        <ringGeometry args={[chapter.radius - 0.3, chapter.radius, 64]} />
        <meshBasicMaterial color={chapter.accent} transparent opacity={0.72} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={column} position={[0, 3, 0]}>
        <cylinderGeometry args={[0.34, 1.4, 6, 20, 1, true]} />
        <meshBasicMaterial color={chapter.accent} transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={marker} position={[0, 5.7, 0]} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.52, 0]} />
        <meshStandardMaterial color={chapter.accent} emissive={chapter.accent} emissiveIntensity={2.2} roughness={0.18} />
      </mesh>
    </group>
  );
}

function Billboard({ storyRef }) {
  const paper = useRef();
  const sun = useRef();
  const hills = useRef();
  const target = useMemo(() => new THREE.Color(), []);
  const alive = useMemo(() => new THREE.Color("#6d49d8"), []);

  useFrame((_, delta) => {
    const progress = storyRef.current.chapterProgress[0];
    target.copy(blank).lerp(alive, progress * 0.72);
    paper.current.color.lerp(target, 1 - Math.pow(0.02, delta));
    paper.current.emissiveIntensity = progress * 0.34;
    sun.current.opacity = THREE.MathUtils.damp(sun.current.opacity, 0.08 + progress * 0.92, 8, delta);
    hills.current.opacity = THREE.MathUtils.damp(hills.current.opacity, 0.08 + progress * 0.92, 8, delta);
  });

  return (
    <group position={[0, 0, -20]}>
      <mesh position={[-5.8, 2.5, 0]} castShadow><boxGeometry args={[0.38, 5, 0.5]} /><meshStandardMaterial color="#24212c" /></mesh>
      <mesh position={[5.8, 2.5, 0]} castShadow><boxGeometry args={[0.38, 5, 0.5]} /><meshStandardMaterial color="#24212c" /></mesh>
      <mesh position={[0, 5.5, 0]} castShadow><boxGeometry args={[12.4, 6.1, 0.44]} /><meshStandardMaterial color="#24212c" /></mesh>
      <mesh position={[0, 5.5, 0.24]}>
        <planeGeometry args={[11.7, 5.4]} />
        <meshStandardMaterial ref={paper} color="#e7e4dc" emissive="#7f4cff" emissiveIntensity={0} roughness={0.82} />
      </mesh>
      <mesh position={[-3.4, 6.6, 0.27]}>
        <circleGeometry args={[1.05, 32]} />
        <meshBasicMaterial ref={sun} color="#ffdb35" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      <group position={[0, 4.7, 0.28]}>
        <mesh position={[-2.2, 0, 0]} rotation={[0, 0, 0.12]} scale={[1.9, 1.35, 1]}>
          <circleGeometry args={[1.4, 3]} />
          <meshBasicMaterial ref={hills} color="#ff5f9f" transparent opacity={0.08} depthWrite={false} />
        </mesh>
        <mesh position={[1.8, -0.1, 0.01]} rotation={[0, 0, -0.08]} scale={[2.2, 1.55, 1]}>
          <circleGeometry args={[1.4, 3]} />
          <meshBasicMaterial color="#55e8d5" transparent opacity={0.74} depthWrite={false} />
        </mesh>
      </group>
      <mesh position={[0, 8.95, 0.12]}><boxGeometry args={[7.6, 0.54, 0.16]} /><meshStandardMaterial color="#c8ff36" emissive="#c8ff36" emissiveIntensity={0.35} /></mesh>
      <mesh position={[0, 8.96, 0.22]}><planeGeometry args={[6.8, 0.36]} /><meshBasicMaterial color="#17141f" /></mesh>
    </group>
  );
}

function ArtistStatue({ storyRef }) {
  const body = useRef();
  const heart = useRef();
  const target = useMemo(() => new THREE.Color(), []);
  const alive = useMemo(() => new THREE.Color("#63e9ff"), []);

  useFrame(({ clock }, delta) => {
    const progress = storyRef.current.chapterProgress[1];
    target.copy(blank).lerp(alive, progress * 0.88);
    body.current.color.lerp(target, 1 - Math.pow(0.02, delta));
    body.current.emissiveIntensity = progress * 0.42;
    heart.current.emissiveIntensity = progress * (1.4 + Math.sin(clock.elapsedTime * 4) * 0.25);
    heart.current.opacity = 0.12 + progress * 0.88;
  });

  return (
    <group position={[15, 0, 2]} rotation={[0, -0.45, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow><cylinderGeometry args={[2.2, 2.55, 1.1, 8]} /><meshStandardMaterial color="#292531" roughness={0.7} /></mesh>
      <mesh position={[0, 1.35, 0]} castShadow><cylinderGeometry args={[1.8, 2.15, 0.55, 8]} /><meshStandardMaterial color="#d8d4cb" roughness={0.8} /></mesh>
      <group position={[0, 1.6, 0]}>
        <mesh position={[0, 2.35, 0]} castShadow><capsuleGeometry args={[0.9, 2.4, 6, 14]} /><meshStandardMaterial ref={body} color="#e7e4dc" emissive="#4de8ff" emissiveIntensity={0} roughness={0.62} /></mesh>
        <mesh position={[0, 4.75, 0]} castShadow><sphereGeometry args={[1.15, 18, 14]} /><meshStandardMaterial color="#e7e4dc" roughness={0.68} /></mesh>
        <mesh position={[-1.18, 2.5, 0]} rotation={[0, 0, -0.5]} castShadow><capsuleGeometry args={[0.23, 2.3, 5, 10]} /><meshStandardMaterial color="#dcd8cf" /></mesh>
        <mesh position={[1.18, 2.5, 0]} rotation={[0, 0, 0.5]} castShadow><capsuleGeometry args={[0.23, 2.3, 5, 10]} /><meshStandardMaterial color="#dcd8cf" /></mesh>
        <group position={[0, 2.7, 0.92]}>
          <mesh position={[-0.28, 0.18, 0]}><sphereGeometry args={[0.36, 16, 12]} /><meshStandardMaterial ref={heart} color="#ff4f9b" emissive="#ff4f9b" emissiveIntensity={0} transparent opacity={0.12} /></mesh>
          <mesh position={[0.28, 0.18, 0]}><sphereGeometry args={[0.36, 16, 12]} /><meshStandardMaterial color="#ff4f9b" emissive="#ff4f9b" emissiveIntensity={0.5} transparent opacity={0.9} /></mesh>
          <mesh position={[0, -0.15, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.54, 0.54, 0.3]} /><meshStandardMaterial color="#ff4f9b" emissive="#ff4f9b" emissiveIntensity={0.5} transparent opacity={0.9} /></mesh>
        </group>
        <group position={[1.75, 3.1, 0]} rotation={[0, 0, -0.48]}>
          <mesh><cylinderGeometry args={[0.2, 0.2, 4.8, 6]} /><meshStandardMaterial color="#f4d92f" roughness={0.48} /></mesh>
          <mesh position={[0, -2.65, 0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.22, 0.5, 8]} /><meshStandardMaterial color="#24212c" /></mesh>
        </group>
      </group>
    </group>
  );
}

function ColourDoor({ storyRef, reducedMotion }) {
  const ring = useRef();
  const core = useRef();
  const star = useRef();
  const target = useMemo(() => new THREE.Color(), []);
  const alive = useMemo(() => new THREE.Color("#a779ff"), []);

  useFrame(({ clock }, delta) => {
    const progress = storyRef.current.chapterProgress[2];
    target.copy(blank).lerp(alive, progress);
    ring.current.color.lerp(target, 1 - Math.pow(0.02, delta));
    ring.current.emissiveIntensity = progress * 1.25;
    core.current.opacity = progress * 0.52;
    star.current.scale.setScalar(0.3 + progress * (reducedMotion ? 0.8 : 0.8 + Math.sin(clock.elapsedTime * 3) * 0.08));
    star.current.rotation.z += progress && !reducedMotion ? delta * 0.65 : 0;
  });

  return (
    <group position={[-13, 0, 14]} rotation={[0, 0.35, 0]}>
      <mesh position={[0, 3.7, 0]} castShadow>
        <torusGeometry args={[3.2, 0.42, 12, 48]} />
        <meshStandardMaterial ref={ring} color="#e7e4dc" emissive="#a779ff" emissiveIntensity={0} metalness={0.72} roughness={0.24} />
      </mesh>
      <mesh position={[0, 3.7, -0.08]}>
        <circleGeometry args={[2.77, 48]} />
        <meshBasicMaterial ref={core} color="#6d39ff" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={star} position={[0, 3.7, 0.08]} rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#c8ff36" emissive="#c8ff36" emissiveIntensity={1.8} roughness={0.15} />
      </mesh>
      <mesh position={[-3.2, 1.55, 0]}><boxGeometry args={[0.84, 3.1, 0.84]} /><meshStandardMaterial color="#27232e" /></mesh>
      <mesh position={[3.2, 1.55, 0]}><boxGeometry args={[0.84, 3.1, 0.84]} /><meshStandardMaterial color="#27232e" /></mesh>
    </group>
  );
}

export default function PaintStory({ storyRef, reducedMotion }) {
  return (
    <>
      {paintStoryChapters.map((chapter, index) => (
        <StoryBeacon key={chapter.id} chapter={chapter} index={index} storyRef={storyRef} reducedMotion={reducedMotion} />
      ))}
      <Billboard storyRef={storyRef} />
      <ArtistStatue storyRef={storyRef} />
      <ColourDoor storyRef={storyRef} reducedMotion={reducedMotion} />
    </>
  );
}
