import * as THREE from "three";

const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.28, 0.28],
    [0.72, 0.72],
  ],
  3: [
    [0.28, 0.28],
    [0.5, 0.5],
    [0.72, 0.72],
  ],
  4: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  5: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.5, 0.5],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  6: [
    [0.28, 0.24],
    [0.72, 0.24],
    [0.28, 0.5],
    [0.72, 0.5],
    [0.28, 0.76],
    [0.72, 0.76],
  ],
};

/**
 * Builds a frosty face texture: a faint icy sheen base with carved-looking
 * pips (dark-blue recessed dots ringed with a frost highlight).
 */
export function createIceFaceTexture(value: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Base: subtle icy gradient so the face reads even under transmission.
  const grad = ctx.createRadialGradient(
    size * 0.5,
    size * 0.4,
    size * 0.05,
    size * 0.5,
    size * 0.5,
    size * 0.7
  );
  grad.addColorStop(0, "rgba(210, 245, 255, 0.10)");
  grad.addColorStop(1, "rgba(150, 210, 235, 0.02)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Faint crack/frost lines for texture.
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const x1 = Math.random() * size;
    const y1 = Math.random() * size;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + (Math.random() - 0.5) * 160, y1 + (Math.random() - 0.5) * 160);
    ctx.stroke();
  }

  const pipRadius = size * 0.085;
  for (const [nx, ny] of PIP_LAYOUTS[value]) {
    const x = nx * size;
    const y = ny * size;

    // Recessed shadow ring.
    const shadow = ctx.createRadialGradient(x, y, pipRadius * 0.2, x, y, pipRadius * 1.15);
    shadow.addColorStop(0, "rgba(10, 40, 60, 0.55)");
    shadow.addColorStop(0.7, "rgba(10, 40, 60, 0.25)");
    shadow.addColorStop(1, "rgba(10, 40, 60, 0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(x, y, pipRadius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Pip core.
    const core = ctx.createRadialGradient(
      x - pipRadius * 0.3,
      y - pipRadius * 0.3,
      pipRadius * 0.05,
      x,
      y,
      pipRadius
    );
    core.addColorStop(0, "rgba(255,255,255,0.95)");
    core.addColorStop(0.4, "rgba(180, 230, 250, 0.85)");
    core.addColorStop(1, "rgba(70, 150, 190, 0.75)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, pipRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

let cache: THREE.CanvasTexture[] | null = null;

export function getIceFaceTextures(): THREE.CanvasTexture[] {
  if (!cache) {
    cache = [1, 2, 3, 4, 5, 6].map((v) => createIceFaceTexture(v));
  }
  return cache;
}

/**
 * Builds a neon face texture: near-black acrylic base with glowing
 * cyan/magenta pips and a soft bloom halo to fake emissive light.
 */
export function createNeonFaceTexture(value: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const base = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.05,
    size * 0.5,
    size * 0.5,
    size * 0.75
  );
  base.addColorStop(0, "rgba(30, 10, 45, 0.55)");
  base.addColorStop(1, "rgba(8, 4, 16, 0.75)");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const glowColor = value % 2 === 0 ? "#ff2ec4" : "#26f5ff"; // alternate magenta/cyan by value
  const pipRadius = size * 0.075;

  for (const [nx, ny] of PIP_LAYOUTS[value]) {
    const x = nx * size;
    const y = ny * size;

    // Bloom halo.
    const halo = ctx.createRadialGradient(x, y, 0, x, y, pipRadius * 3.2);
    halo.addColorStop(0, glowColor + "cc");
    halo.addColorStop(0.35, glowColor + "55");
    halo.addColorStop(1, glowColor + "00");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, pipRadius * 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Bright core.
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, pipRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(x, y, pipRadius * 0.75, 0, Math.PI * 2);
    ctx.globalCompositeOperation = "screen";
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

let neonCache: THREE.CanvasTexture[] | null = null;

export function getNeonFaceTextures(): THREE.CanvasTexture[] {
  if (!neonCache) {
    neonCache = [1, 2, 3, 4, 5, 6].map((v) => createNeonFaceTexture(v));
  }
  return neonCache;
}

/**
 * Builds a classic casino-die face texture: cream/white base, flat black
 * pips, subtle edge shading. No fantasy elements.
 */
export function createClassicFaceTexture(value: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f7f4ec";
  ctx.fillRect(0, 0, size, size);

  // Very subtle vignette so the flat white isn't blown out under lighting.
  const vignette = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.2, size * 0.5, size * 0.5, size * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.06)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  const pipRadius = size * 0.085;
  for (const [nx, ny] of PIP_LAYOUTS[value]) {
    const x = nx * size;
    const y = ny * size;

    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(x, y, pipRadius, 0, Math.PI * 2);
    ctx.fill();

    // Tiny highlight for a slight glossy-plastic feel.
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.arc(x - pipRadius * 0.3, y - pipRadius * 0.3, pipRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

let classicCache: THREE.CanvasTexture[] | null = null;

export function getClassicFaceTextures(): THREE.CanvasTexture[] {
  if (!classicCache) {
    classicCache = [1, 2, 3, 4, 5, 6].map((v) => createClassicFaceTexture(v));
  }
  return classicCache;
}

export function getFaceTexturesForVariant(variant: "ice" | "neon" | "classic"): THREE.CanvasTexture[] {
  switch (variant) {
    case "neon":
      return getNeonFaceTextures();
    case "classic":
      return getClassicFaceTextures();
    case "ice":
    default:
      return getIceFaceTextures();
  }
}
