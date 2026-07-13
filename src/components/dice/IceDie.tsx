import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { getIceFaceTextures } from "./pipTextures";
import type { FrostParticlesHandle } from "./FrostParticles";

const DIE_SIZE = 0.9;
const FLOOR_Y = DIE_SIZE / 2;

// Base quaternions that put a given face value pointing world-up (+Y).
// Face assignment on BoxGeometry material order [+x,-x,+y,-y,+z,-z]:
// +y=1, -y=6, +x=2, -x=5, +z=3, -z=4 (opposite faces sum to 7).
const FACE_UP_QUATS: Record<number, THREE.Quaternion> = {
  1: new THREE.Quaternion(),
  2: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
  3: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2),
  4: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
  5: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2),
  6: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI),
};

type Phase = "idle" | "airborne" | "settling" | "resting";

interface RollState {
  phase: Phase;
  t: number;
  tumbleDuration: number;
  settleDuration: number;
  targetValue: number;
  targetQuat: THREE.Quaternion;
  spinAxis: THREE.Vector3;
  spinSpeed: number;
  startQuat: THREE.Quaternion;
  originSlot: THREE.Vector3;
  bounce1Done: boolean;
  bounce2Done: boolean;
  settleDone: boolean;
  lastTrailEmit: number;
}

export interface IceDieProps {
  slot: THREE.Vector3;
  rollId: number;
  onSettled?: (value: number) => void;
  particlesRef: React.RefObject<FrostParticlesHandle | null>;
}

export default function IceDie({ slot, rollId, onSettled, particlesRef }: IceDieProps) {
  const groupRef = useRef<THREE.Group>(null);
  const faceTextures = getIceFaceTextures();

  const materials = useMemo(() => {
    // Order matches BoxGeometry material slots: +x,-x,+y,-y,+z,-z
    const valueOrder = [2, 5, 1, 6, 3, 4];
    return valueOrder.map(
      (v) =>
        new THREE.MeshPhysicalMaterial({
          map: faceTextures[v - 1],
          transmission: 0.9,
          thickness: 1.1,
          roughness: 0.12,
          ior: 1.31, // real ice
          clearcoat: 0.6,
          clearcoatRoughness: 0.2,
          color: new THREE.Color("#bfe9fb"),
          attenuationColor: new THREE.Color("#8fd3f0"),
          attenuationDistance: 1.4,
          specularIntensity: 1,
        })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roll = useRef<RollState>({
    phase: "resting",
    t: 0,
    tumbleDuration: 0.9,
    settleDuration: 0.3,
    targetValue: 1,
    targetQuat: new THREE.Quaternion(),
    spinAxis: new THREE.Vector3(1, 1, 0).normalize(),
    spinSpeed: 10,
    startQuat: new THREE.Quaternion(),
    originSlot: slot.clone(),
    bounce1Done: false,
    bounce2Done: false,
    settleDone: false,
    lastTrailEmit: 0,
  });

  const prevRollId = useRef(rollId);
  if (prevRollId.current !== rollId) {
    prevRollId.current = rollId;
    const r = roll.current;
    r.phase = "airborne";
    r.t = 0;
    r.targetValue = 1 + Math.floor(Math.random() * 6);
    const yaw = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.random() * Math.PI * 2
    );
    r.targetQuat = yaw.multiply(FACE_UP_QUATS[r.targetValue]);
    r.spinAxis = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();
    r.spinSpeed = 8 + Math.random() * 6;
    r.originSlot = slot.clone();
    r.bounce1Done = false;
    r.bounce2Done = false;
    r.settleDone = false;
    if (groupRef.current) r.startQuat.copy(groupRef.current.quaternion);
  }

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const r = roll.current;

    if (r.phase === "resting" || r.phase === "idle") {
      // gentle idle bob so the scene never feels static
      group.position.y = FLOOR_Y + Math.sin(state.clock.elapsedTime * 1.2 + slot.x * 3) * 0.015;
      return;
    }

    r.t += delta;
    const worldPos = group.getWorldPosition(new THREE.Vector3());

    if (r.phase === "airborne") {
      const total = r.tumbleDuration;
      const tt = Math.min(r.t / total, 1);

      // Two decaying bounce arcs for height.
      const bounce1 = Math.max(0, Math.sin(Math.PI * Math.min(r.t / (total * 0.5), 1))) * 1.1;
      const bounce2 =
        r.t > total * 0.5
          ? Math.max(0, Math.sin(Math.PI * Math.min((r.t - total * 0.5) / (total * 0.3), 1))) * 0.45
          : 0;
      const height = r.t <= total * 0.5 ? bounce1 : bounce2;
      group.position.y = FLOOR_Y + height;

      // Drift toward a random nearby point then curve back to the slot.
      const driftT = Math.sin(tt * Math.PI); // out and back
      group.position.x = r.originSlot.x + Math.sin(rollId * 12.9 + slot.x) * 0.6 * driftT;
      group.position.z = r.originSlot.z + Math.cos(rollId * 7.3 + slot.z) * 0.6 * driftT;

      // Free tumbling spin, decaying speed near the end of the phase.
      const spinDecay = 1 - tt * 0.6;
      const angle = r.spinSpeed * spinDecay * delta;
      const spinQuat = new THREE.Quaternion().setFromAxisAngle(r.spinAxis, angle);
      group.quaternion.premultiply(spinQuat);

      // Emit mist trail while airborne.
      r.lastTrailEmit += delta;
      if (r.lastTrailEmit > 0.02) {
        r.lastTrailEmit = 0;
        particlesRef.current?.trail(worldPos);
      }

      // Impact bursts at each bounce's floor contact.
      if (!r.bounce1Done && r.t >= total * 0.5) {
        r.bounce1Done = true;
        particlesRef.current?.burst(
          new THREE.Vector3(group.position.x, FLOOR_Y, group.position.z),
          1
        );
      }
      if (!r.bounce2Done && r.t >= total * 0.8) {
        r.bounce2Done = true;
        particlesRef.current?.burst(
          new THREE.Vector3(group.position.x, FLOOR_Y, group.position.z),
          0.55
        );
      }

      if (tt >= 1) {
        r.phase = "settling";
        r.t = 0;
        r.startQuat.copy(group.quaternion);
      }
      return;
    }

    if (r.phase === "settling") {
      const tt = Math.min(r.t / r.settleDuration, 1);
      const eased = 1 - Math.pow(1 - tt, 3);
      group.quaternion.slerpQuaternions(r.startQuat, r.targetQuat, eased);
      group.position.x = THREE.MathUtils.lerp(group.position.x, r.originSlot.x, eased);
      group.position.z = THREE.MathUtils.lerp(group.position.z, r.originSlot.z, eased);
      group.position.y = FLOOR_Y + Math.max(0, (1 - eased)) * 0.08;

      if (tt >= 1 && !r.settleDone) {
        r.settleDone = true;
        particlesRef.current?.burst(
          new THREE.Vector3(r.originSlot.x, FLOOR_Y, r.originSlot.z),
          0.35
        );
        r.phase = "resting";
        onSettled?.(r.targetValue);
      }
    }
  });

  return (
    <group ref={groupRef} position={slot}>
      <mesh castShadow receiveShadow material={materials}>
        <boxGeometry args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} />
      </mesh>
      {/* Faint inner core to sell the "carved ice block" look under transmission */}
      <mesh scale={0.55}>
        <boxGeometry args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} />
        <meshBasicMaterial color="#eaf7ff" transparent opacity={0.05} />
      </mesh>
    </group>
  );
}
