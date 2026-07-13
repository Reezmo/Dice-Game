import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

function DiscoBall() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.6;
  });
  return (
    <mesh ref={ref} position={[0, 4.2, -2]}>
      <sphereGeometry args={[0.55, 24, 24]} />
      <meshStandardMaterial color="#dfe6ee" metalness={1} roughness={0.25} />
    </mesh>
  );
}

function SpotLights() {
  const lights = [
    { color: "#ff2ec4", angle: 0 },
    { color: "#26f5ff", angle: (2 * Math.PI) / 3 },
    { color: "#ffd23f", angle: (4 * Math.PI) / 3 },
  ];
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * 0.25;
  });
  return (
    <group ref={group}>
      {lights.map((l, i) => (
        <spotLight
          key={i}
          position={[Math.cos(l.angle) * 4, 4, Math.sin(l.angle) * 4 - 2]}
          target-position={[0, 0, 0]}
          color={l.color}
          intensity={6}
          angle={0.35}
          penumbra={0.6}
          distance={10}
        />
      ))}
    </group>
  );
}

export default function ClubBackground() {
  return (
    <group>
      <fog attach="fog" args={["#0a0512", 6, 22]} />
      <color attach="background" args={["#0a0512"]} />

      <ambientLight intensity={0.25} color="#3a1d5c" />
      <SpotLights />
      <DiscoBall />

      {/* Table surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[9, 64]} />
        <meshStandardMaterial color="#160b22" roughness={0.35} metalness={0.4} />
      </mesh>

      {/* Neon ring framing the play area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[2.6, 2.72, 64]} />
        <meshBasicMaterial color="#ff2ec4" transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[2.85, 2.92, 64]} />
        <meshBasicMaterial color="#26f5ff" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
