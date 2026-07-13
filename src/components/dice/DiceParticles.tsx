import * as THREE from "three";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const POOL_SIZE = 700;

interface Particle {
  active: boolean;
  life: number;
  maxLife: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  size: number;
  gravity: number;
  colorA: THREE.Color;
  colorB: THREE.Color;
  colorMix: number;
}

export interface EmitOptions {
  /** Particle count / spread multiplier for burst(). */
  strength?: number;
  /** Two colors particles are randomly lerped between. */
  colorA?: string;
  colorB?: string;
  /** Downward acceleration applied to spawned particles. Ice shards fall, neon sparks barely do. */
  gravity?: number;
}

export interface DiceParticlesHandle {
  /** Sharp radial burst, used on dice impact (frost shards, neon sparks, felt dust). */
  burst: (position: THREE.Vector3, opts?: EmitOptions) => void;
  /** Light continuous emission, used while a die tumbles through the air. */
  trail: (position: THREE.Vector3, opts?: EmitOptions) => void;
}

const DEFAULT_A = "#1c6fa8";
const DEFAULT_B = "#eaf9ff";

const DiceParticles = forwardRef<DiceParticlesHandle>((_props, ref) => {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: POOL_SIZE }, () => ({
        active: false,
        life: 0,
        maxLife: 1,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        size: 0.05,
        gravity: 0.6,
        colorA: new THREE.Color(DEFAULT_A),
        colorB: new THREE.Color(DEFAULT_B),
        colorMix: 0,
      })),
    []
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(POOL_SIZE * 3), 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(POOL_SIZE * 3), 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(POOL_SIZE), 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(POOL_SIZE), 1));
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {},
      vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        attribute vec3 aColor;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vAlpha = aAlpha;
          vColor = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          if (d > 0.5) discard;
          float edge = smoothstep(0.5, 0.15, d);
          gl_FragColor = vec4(vColor, vAlpha * edge);
        }
      `,
    });
  }, []);

  const nextFree = useRef(0);

  const spawn = (p: Partial<Particle>) => {
    const idx = nextFree.current;
    nextFree.current = (nextFree.current + 1) % POOL_SIZE;
    const particle = particles[idx];
    particle.active = true;
    particle.life = 0;
    particle.maxLife = p.maxLife ?? 0.6;
    particle.pos.copy(p.pos ?? new THREE.Vector3());
    particle.vel.copy(p.vel ?? new THREE.Vector3());
    particle.size = p.size ?? 0.05;
    particle.gravity = p.gravity ?? 0.6;
    if (p.colorA) particle.colorA.set(p.colorA as unknown as THREE.ColorRepresentation);
    if (p.colorB) particle.colorB.set(p.colorB as unknown as THREE.ColorRepresentation);
    particle.colorMix = p.colorMix ?? 0.5;
  };

  useImperativeHandle(ref, () => ({
    burst: (position, opts = {}) => {
      const strength = opts.strength ?? 1;
      const colorA = opts.colorA ?? DEFAULT_A;
      const colorB = opts.colorB ?? DEFAULT_B;
      const gravity = opts.gravity ?? 0.6;
      const count = Math.floor(18 * strength);
      for (let i = 0; i < count; i++) {
        const dir = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() * 0.6 + 0.1,
          Math.random() - 0.5
        ).normalize();
        const speed = (1.2 + Math.random() * 1.8) * strength;
        spawn({
          pos: position.clone(),
          vel: dir.multiplyScalar(speed),
          maxLife: 0.45 + Math.random() * 0.35,
          size: 0.06 + Math.random() * 0.09,
          colorMix: Math.random() * 0.5 + 0.4,
          colorA: colorA as any,
          colorB: colorB as any,
          gravity,
        });
      }
    },
    trail: (position, opts = {}) => {
      const colorA = opts.colorA ?? DEFAULT_A;
      const colorB = opts.colorB ?? DEFAULT_B;
      const gravity = opts.gravity ?? 0.6;
      spawn({
        pos: position
          .clone()
          .add(new THREE.Vector3((Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15)),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.2, -0.15 - Math.random() * 0.2, (Math.random() - 0.5) * 0.2),
        maxLife: 0.35 + Math.random() * 0.2,
        size: 0.035 + Math.random() * 0.03,
        colorMix: Math.random() * 0.3,
        colorA: colorA as any,
        colorB: colorB as any,
        gravity,
      });
    },
  }));

  useFrame((_, delta) => {
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const colorAttr = geometry.getAttribute("aColor") as THREE.BufferAttribute;
    const sizeAttr = geometry.getAttribute("aSize") as THREE.BufferAttribute;
    const alphaAttr = geometry.getAttribute("aAlpha") as THREE.BufferAttribute;

    const tmpColor = new THREE.Color();

    for (let i = 0; i < POOL_SIZE; i++) {
      const p = particles[i];
      if (!p.active) {
        alphaAttr.setX(i, 0);
        continue;
      }
      p.life += delta;
      if (p.life >= p.maxLife) {
        p.active = false;
        alphaAttr.setX(i, 0);
        continue;
      }
      p.vel.y -= delta * p.gravity;
      p.pos.addScaledVector(p.vel, delta);

      const lifeT = p.life / p.maxLife;
      const alpha = 1 - lifeT;
      tmpColor.copy(p.colorA).lerp(p.colorB, p.colorMix);

      posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
      colorAttr.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
      sizeAttr.setX(i, p.size * (1 - lifeT * 0.3));
      alphaAttr.setX(i, alpha);
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
});

DiceParticles.displayName = "DiceParticles";
export default DiceParticles;
