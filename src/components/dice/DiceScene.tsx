import * as THREE from "three";
import { useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import GlacierBackground from "./GlacierBackground";
import ClubBackground from "./ClubBackground";
import AlleyBackground from "./AlleyBackground";
import Die from "./Die";
import DiceParticles, { type DiceParticlesHandle } from "./DiceParticles";
import type { BackgroundId, DiceSceneConfig } from "./config";

function diceSlots(count: number): THREE.Vector3[] {
  const spacing = 1.4;
  const cols = count <= 3 ? count : Math.ceil(count / 2);
  const rows = Math.ceil(count / cols);
  const slots: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = (col - (cols - 1) / 2) * spacing;
    const z = (row - (rows - 1) / 2) * spacing;
    slots.push(new THREE.Vector3(x, 0.45, z));
  }
  return slots;
}

function Background({ id }: { id: BackgroundId }) {
  switch (id) {
    case "club":
      return <ClubBackground />;
    case "alley":
      return <AlleyBackground />;
    case "glacier":
    default:
      return <GlacierBackground />;
  }
}

interface DiceSceneProps {
  config: DiceSceneConfig;
  rollId: number;
  onAllSettled?: (values: number[]) => void;
}

export default function DiceScene({ config, rollId, onAllSettled }: DiceSceneProps) {
  const particlesRef = useRef<DiceParticlesHandle>(null);
  const slots = useMemo(() => diceSlots(config.diceCount), [config.diceCount]);
  const results = useRef<number[]>(new Array(config.diceCount).fill(0));
  const [, forceTick] = useState(0);

  useMemo(() => {
    results.current = new Array(config.diceCount).fill(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.diceCount]);

  const handleSettled = (index: number, value: number) => {
    results.current[index] = value;
    forceTick((n) => n + 1);
    if (results.current.every((v) => v > 0)) {
      onAllSettled?.([...results.current]);
    }
  };

  return (
    <Canvas
      shadows
      camera={{ position: [0, 5.2, 6.4], fov: 42 }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    >
      <Background id={config.background} />
      {slots.map((slot, i) => (
        <Die
          key={i}
          slot={slot}
          rollId={rollId}
          variant={config.variant}
          particlesRef={particlesRef}
          onSettled={(v) => handleSettled(i, v)}
        />
      ))}
      <DiceParticles ref={particlesRef} />
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={11}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
