import * as THREE from "three";
import type { ReactNode } from "react";
import type { VariantId } from "./config";
import { getFaceTexturesForVariant } from "./pipTextures";

export interface ParticleTheme {
  colorA: string;
  colorB: string;
  gravity: number;
  trailEnabled: boolean;
  burstStrengthScale: number;
}

export interface DieVariantTheme {
  buildMaterials: () => THREE.Material[];
  particles: ParticleTheme;
  /** Optional extra mesh layered on top of the base cube (glow shell, inner core, etc). */
  extra?: (dieSize: number) => ReactNode;
}

// Face assignment on BoxGeometry material order [+x,-x,+y,-y,+z,-z]:
// +y=1, -y=6, +x=2, -x=5, +z=3, -z=4 (opposite faces sum to 7).
const FACE_VALUE_ORDER = [2, 5, 1, 6, 3, 4];

function buildFaceMaterials(variant: VariantId, factory: (tex: THREE.CanvasTexture) => THREE.Material) {
  const textures = getFaceTexturesForVariant(variant);
  return FACE_VALUE_ORDER.map((v) => factory(textures[v - 1]));
}

export function getVariantTheme(variant: VariantId): DieVariantTheme {
  switch (variant) {
    case "neon":
      return {
        buildMaterials: () =>
          buildFaceMaterials(
            "neon",
            (tex) =>
              new THREE.MeshPhysicalMaterial({
                map: tex,
                emissiveMap: tex,
                emissive: new THREE.Color("#ffffff"),
                emissiveIntensity: 1.4,
                color: new THREE.Color("#120a1e"),
                roughness: 0.25,
                metalness: 0.1,
                clearcoat: 0.9,
                clearcoatRoughness: 0.15,
              })
          ),
        particles: {
          colorA: "#26f5ff",
          colorB: "#ff2ec4",
          gravity: 0.15,
          trailEnabled: true,
          burstStrengthScale: 1.15,
        },
        extra: (dieSize) => (
          <mesh scale={1.04}>
            <boxGeometry args={[dieSize, dieSize, dieSize]} />
            <meshBasicMaterial color="#8a2eff" transparent opacity={0.12} />
          </mesh>
        ),
      };

    case "classic":
      return {
        buildMaterials: () =>
          buildFaceMaterials(
            "classic",
            (tex) =>
              new THREE.MeshStandardMaterial({
                map: tex,
                color: new THREE.Color("#ffffff"),
                roughness: 0.45,
                metalness: 0.05,
              })
          ),
        particles: {
          colorA: "#d8d2c2",
          colorB: "#fffdf6",
          gravity: 1.4,
          trailEnabled: false,
          burstStrengthScale: 0.5,
        },
      };

    case "ice":
    default:
      return {
        buildMaterials: () =>
          buildFaceMaterials(
            "ice",
            (tex) =>
              new THREE.MeshPhysicalMaterial({
                map: tex,
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
          ),
        particles: {
          colorA: "#1c6fa8",
          colorB: "#eaf9ff",
          gravity: 0.6,
          trailEnabled: true,
          burstStrengthScale: 1,
        },
        extra: (dieSize) => (
          <mesh scale={0.55}>
            <boxGeometry args={[dieSize, dieSize, dieSize]} />
            <meshBasicMaterial color="#eaf7ff" transparent opacity={0.05} />
          </mesh>
        ),
      };
  }
}
