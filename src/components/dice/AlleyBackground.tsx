import * as THREE from "three";
import { useMemo } from "react";

function HangingLamp({ x }: { x: number }) {
  return (
    <group position={[x, 3.6, -1]}>
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, 1.4, 6]} />
        <meshStandardMaterial color="#2b2016" />
      </mesh>
      <mesh position={[0, -0.85, 0]}>
        <coneGeometry args={[0.4, 0.35, 16, 1, true]} />
        <meshStandardMaterial color="#3a2c1c" side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, -1, 0]} intensity={3.2} color="#ffcf8a" distance={6} />
    </group>
  );
}

export default function AlleyBackground() {
  const lampPositions = useMemo(() => [-4, -1.3, 1.3, 4], []);

  return (
    <group>
      <fog attach="fog" args={["#2a1c10", 8, 26]} />
      <color attach="background" args={["#241608"]} />

      <ambientLight intensity={0.35} color="#ffdca8" />
      <directionalLight position={[2, 6, 4]} intensity={0.5} color="#ffe4b8" />
      {lampPositions.map((x) => (
        <HangingLamp key={x} x={x} />
      ))}

      {/* Wooden lane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 20]} />
        <meshStandardMaterial color="#b9803f" roughness={0.35} metalness={0.15} />
      </mesh>

      {/* Lane plank seams for texture */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-2.5 + i * 0.625, 0.006, 0]}>
          <planeGeometry args={[0.02, 20]} />
          <meshBasicMaterial color="#5c3d1c" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Gutters */}
      <mesh position={[-3.1, 0.1, 0]}>
        <boxGeometry args={[0.5, 0.2, 20]} />
        <meshStandardMaterial color="#1c130a" />
      </mesh>
      <mesh position={[3.1, 0.1, 0]}>
        <boxGeometry args={[0.5, 0.2, 20]} />
        <meshStandardMaterial color="#1c130a" />
      </mesh>

      {/* Foul line framing the play area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 2.4]}>
        <planeGeometry args={[6, 0.06]} />
        <meshBasicMaterial color="#f4e3c1" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
