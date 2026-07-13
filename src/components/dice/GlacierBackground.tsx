import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

function IcePeak({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <mesh position={position} scale={scale} rotation={[0, Math.random() * Math.PI, 0]}>
      <coneGeometry args={[1, 2.4, 5]} />
      <meshStandardMaterial color="#9fd6ec" roughness={0.35} metalness={0.05} transparent opacity={0.85} />
    </mesh>
  );
}

function Snowfall() {
  const count = 220;
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = Math.random() * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = posAttr.getY(i) - delta * 0.4;
      if (y < 0) y = 10;
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.045} transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}

export default function GlacierBackground() {
  const peaks = useMemo(
    () =>
      Array.from({ length: 9 }, () => ({
        position: [
          (Math.random() - 0.5) * 16,
          -0.4,
          -6 - Math.random() * 8,
        ] as [number, number, number],
        scale: 1.2 + Math.random() * 2.2,
      })),
    []
  );

  return (
    <group>
      <fog attach="fog" args={["#7fc4e6", 6, 26]} />
      <color attach="background" args={["#bfe6f5"]} />

      <ambientLight intensity={0.55} color="#cdeeff" />
      <directionalLight
        position={[4, 8, 3]}
        intensity={1.4}
        color="#eaf7ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-4, 2, 2]} intensity={0.6} color="#66c7ff" />

      {/* Icy arena floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[9, 64]} />
        <meshPhysicalMaterial
          color="#dff4fb"
          roughness={0.15}
          metalness={0.1}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          reflectivity={0.6}
        />
      </mesh>

      {/* Frost ring etched into the floor to frame the play area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[2.6, 2.75, 64]} />
        <meshBasicMaterial color="#8fe0ff" transparent opacity={0.5} />
      </mesh>

      {peaks.map((p, i) => (
        <IcePeak key={i} position={p.position} scale={p.scale} />
      ))}

      <Snowfall />
    </group>
  );
}
