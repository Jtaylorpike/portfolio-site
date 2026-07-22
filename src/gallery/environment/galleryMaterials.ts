// Material settings for the 3D gallery.
//
// Phase 8AN replaces the accumulated shared wall/floor/ceiling texture stack
// with a small, deterministic material hierarchy. The accepted Phase 8AM
// lighting remains unchanged. Surface character comes from low-contrast,
// multiscale procedural variation rather than visible grids, veins, repeated
// strokes, or added geometry.

import * as THREE from 'three';

export type GalleryWallMaterialVariant = 0 | 1;

type SurfaceTextureSet = {
  color: THREE.CanvasTexture;
  detail: THREE.CanvasTexture;
};

type SurfaceTextureKey =
  | 'gallery-wall-0'
  | 'gallery-wall-1'
  | 'room-shell'
  | 'floor'
  | 'ceiling';

const textureCache = new Map<SurfaceTextureKey, SurfaceTextureSet>();

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHexColor(hex: string) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function createCanvasTexture(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  colorSpace: THREE.ColorSpace,
  repeatX: number,
  repeatY: number
) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create canvas context for gallery material texture.');
  }

  draw(ctx, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.userData.galleryEnvironmentTexture = true;
  texture.needsUpdate = true;
  return texture;
}

function fillFineColorNoise(
  ctx: CanvasRenderingContext2D,
  size: number,
  baseHex: string,
  spread: number,
  seed: number
) {
  const base = parseHexColor(baseHex);
  const random = createSeededRandom(seed);
  const image = ctx.createImageData(size, size);
  const data = image.data;

  for (let index = 0; index < data.length; index += 4) {
    const variation = (random() - 0.5) * spread;
    const warmVariation = (random() - 0.5) * spread * 0.22;

    data[index] = clampChannel(base.r + variation + warmVariation);
    data[index + 1] = clampChannel(base.g + variation);
    data[index + 2] = clampChannel(base.b + variation - warmVariation * 0.72);
    data[index + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
}

function fillFineGrayNoise(
  ctx: CanvasRenderingContext2D,
  size: number,
  base: number,
  spread: number,
  seed: number
) {
  const random = createSeededRandom(seed);
  const image = ctx.createImageData(size, size);
  const data = image.data;

  for (let index = 0; index < data.length; index += 4) {
    const value = clampChannel(base + (random() - 0.5) * spread);
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
}

function addMineralVariation(
  ctx: CanvasRenderingContext2D,
  size: number,
  seed: number,
  options: {
    broadCount: number;
    mediumCount: number;
    grainCount: number;
    broadOpacity: number;
    mediumOpacity: number;
    grainOpacity: number;
    lightRgb: string;
    darkRgb: string;
  }
) {
  const random = createSeededRandom(seed);

  ctx.save();

  for (let index = 0; index < options.broadCount; index += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = (42 + random() * 100) * (size / 256);
    const isLight = random() > 0.5;
    const alpha = options.broadOpacity * (0.55 + random() * 0.8);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${isLight ? options.lightRgb : options.darkRgb}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${isLight ? options.lightRgb : options.darkRgb}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let index = 0; index < options.mediumCount; index += 1) {
    const x = random() * size;
    const y = random() * size;
    const radiusX = (4 + random() * 25) * (size / 256);
    const radiusY = (3 + random() * 18) * (size / 256);
    const isLight = random() > 0.5;
    const alpha = options.mediumOpacity * (0.45 + random());
    ctx.fillStyle = `rgba(${isLight ? options.lightRgb : options.darkRgb}, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let index = 0; index < options.grainCount; index += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = (0.18 + random() * 0.7) * (size / 256);
    const isLight = random() > 0.5;
    const alpha = options.grainOpacity * (0.5 + random());
    ctx.fillStyle = `rgba(${isLight ? options.lightRgb : options.darkRgb}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function createSurfaceTextureSet(options: {
  key: SurfaceTextureKey;
  baseColor: string;
  colorNoise: number;
  detailBase: number;
  detailNoise: number;
  seed: number;
  repeatX: number;
  repeatY: number;
  broadCount: number;
  mediumCount: number;
  grainCount: number;
  colorBroadOpacity: number;
  colorMediumOpacity: number;
  colorGrainOpacity: number;
  detailBroadOpacity: number;
  detailMediumOpacity: number;
  detailGrainOpacity: number;
  lightRgb: string;
  darkRgb: string;
}) {
  const cached = textureCache.get(options.key);
  if (cached) {
    return cached;
  }

  const color = createCanvasTexture((ctx, size) => {
    fillFineColorNoise(ctx, size, options.baseColor, options.colorNoise, options.seed);
    addMineralVariation(ctx, size, options.seed + 19, {
      broadCount: options.broadCount,
      mediumCount: options.mediumCount,
      grainCount: options.grainCount,
      broadOpacity: options.colorBroadOpacity,
      mediumOpacity: options.colorMediumOpacity,
      grainOpacity: options.colorGrainOpacity,
      lightRgb: options.lightRgb,
      darkRgb: options.darkRgb
    });
  }, THREE.SRGBColorSpace, options.repeatX, options.repeatY);

  const detail = createCanvasTexture((ctx, size) => {
    fillFineGrayNoise(ctx, size, options.detailBase, options.detailNoise, options.seed + 101);
    addMineralVariation(ctx, size, options.seed + 131, {
      broadCount: Math.max(8, Math.round(options.broadCount * 0.76)),
      mediumCount: Math.max(18, Math.round(options.mediumCount * 0.92)),
      grainCount: Math.round(options.grainCount * 1.08),
      broadOpacity: options.detailBroadOpacity,
      mediumOpacity: options.detailMediumOpacity,
      grainOpacity: options.detailGrainOpacity,
      lightRgb: '246, 246, 246',
      darkRgb: '38, 38, 38'
    });
  }, THREE.NoColorSpace, options.repeatX, options.repeatY);

  const set = { color, detail };
  textureCache.set(options.key, set);
  return set;
}

function getGalleryWallTextures(variant: GalleryWallMaterialVariant) {
  return createSurfaceTextureSet({
    key: variant === 0 ? 'gallery-wall-0' : 'gallery-wall-1',
    baseColor: variant === 0 ? '#c8bcad' : '#c6baab',
    colorNoise: 3.2,
    detailBase: 226,
    detailNoise: 8,
    seed: variant === 0 ? 1101 : 1171,
    repeatX: variant === 0 ? 0.72 : 0.68,
    repeatY: variant === 0 ? 0.66 : 0.74,
    broadCount: 15,
    mediumCount: 38,
    grainCount: 520,
    colorBroadOpacity: 0.016,
    colorMediumOpacity: 0.009,
    colorGrainOpacity: 0.014,
    detailBroadOpacity: 0.026,
    detailMediumOpacity: 0.018,
    detailGrainOpacity: 0.025,
    lightRgb: '248, 240, 228',
    darkRgb: '82, 73, 64'
  });
}

function getRoomShellTextures() {
  return createSurfaceTextureSet({
    key: 'room-shell',
    baseColor: '#b3a596',
    colorNoise: 4,
    detailBase: 220,
    detailNoise: 10,
    seed: 2101,
    repeatX: 0.57,
    repeatY: 0.63,
    broadCount: 22,
    mediumCount: 46,
    grainCount: 580,
    colorBroadOpacity: 0.023,
    colorMediumOpacity: 0.012,
    colorGrainOpacity: 0.014,
    detailBroadOpacity: 0.034,
    detailMediumOpacity: 0.022,
    detailGrainOpacity: 0.028,
    lightRgb: '235, 224, 208',
    darkRgb: '67, 59, 52'
  });
}

function getFloorTextures() {
  return createSurfaceTextureSet({
    key: 'floor',
    baseColor: '#918a80',
    colorNoise: 3,
    detailBase: 224,
    detailNoise: 7,
    seed: 3101,
    repeatX: 0.34,
    repeatY: 0.31,
    broadCount: 18,
    mediumCount: 24,
    grainCount: 300,
    colorBroadOpacity: 0.017,
    colorMediumOpacity: 0.006,
    colorGrainOpacity: 0.006,
    detailBroadOpacity: 0.022,
    detailMediumOpacity: 0.012,
    detailGrainOpacity: 0.012,
    lightRgb: '218, 211, 200',
    darkRgb: '63, 59, 55'
  });
}

function getCeilingTextures() {
  return createSurfaceTextureSet({
    key: 'ceiling',
    baseColor: '#70685d',
    colorNoise: 4,
    detailBase: 218,
    detailNoise: 11,
    seed: 4101,
    repeatX: 0.62,
    repeatY: 0.58,
    broadCount: 24,
    mediumCount: 72,
    grainCount: 760,
    colorBroadOpacity: 0.025,
    colorMediumOpacity: 0.013,
    colorGrainOpacity: 0.014,
    detailBroadOpacity: 0.038,
    detailMediumOpacity: 0.026,
    detailGrainOpacity: 0.034,
    lightRgb: '184, 171, 151',
    darkRgb: '48, 42, 36'
  });
}

export function prewarmGalleryEnvironmentMaterials() {
  getGalleryWallTextures(0);
  getGalleryWallTextures(1);
  getRoomShellTextures();
  getFloorTextures();
  getCeilingTextures();
}

export function createFloorMaterial() {
  const textures = getFloorTextures();

  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: textures.color,
    roughness: 0.9,
    roughnessMap: textures.detail,
    bumpMap: textures.detail,
    bumpScale: 0.0021,
    metalness: 0,
    clearcoat: 0.008,
    clearcoatRoughness: 0.94
  });
}

export function createWallMaterial(variant: GalleryWallMaterialVariant = 0) {
  const textures = getGalleryWallTextures(variant);

  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.color,
    roughness: 0.945,
    roughnessMap: textures.detail,
    bumpMap: textures.detail,
    bumpScale: 0.0036,
    metalness: 0
  });
}

export function createRoomShellWallMaterial() {
  const textures = getRoomShellTextures();

  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.color,
    roughness: 0.95,
    roughnessMap: textures.detail,
    bumpMap: textures.detail,
    bumpScale: 0.0042,
    metalness: 0
  });
}

export function createCeilingMaterial() {
  const textures = getCeilingTextures();

  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.color,
    roughness: 0.91,
    roughnessMap: textures.detail,
    bumpMap: textures.detail,
    bumpScale: 0.0072,
    metalness: 0,
    emissive: 0x71665a,
    emissiveIntensity: 0.34
  });
}

export function createCeilingDetailMaterial() {
  const textures = getCeilingTextures();

  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.color,
    roughness: 0.9,
    roughnessMap: textures.detail,
    bumpMap: textures.detail,
    bumpScale: 0.008,
    metalness: 0,
    emissive: 0x71665a,
    emissiveIntensity: 0.34
  });
}

export function createCeilingLightPanelMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffead4,
    roughness: 0.7,
    metalness: 0,
    emissive: 0xffd6ac,
    emissiveIntensity: 0.38
  });
}

export function createCeilingLightPanelFrameMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x191512,
    roughness: 0.9,
    metalness: 0
  });
}

export function createFrameMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x2b2018,
    roughness: 0.31,
    metalness: 0,
    clearcoat: 0.72,
    clearcoatRoughness: 0.17
  });
}

export function createFrameRailMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x38281d,
    roughness: 0.26,
    metalness: 0,
    clearcoat: 0.82,
    clearcoatRoughness: 0.14
  });
}

export function createFrameRailHighlightMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x483325,
    roughness: 0.19,
    metalness: 0,
    clearcoat: 0.92,
    clearcoatRoughness: 0.1
  });
}

export function createFrameRailCatchlightMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x5a4030,
    roughness: 0.17,
    metalness: 0,
    clearcoat: 0.97,
    clearcoatRoughness: 0.08
  });
}

export function createFrameRailShadowEdgeMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x241912,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.34,
    clearcoatRoughness: 0.28
  });
}

export function createWallTrimMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x62574c,
    roughness: 0.94,
    metalness: 0
  });
}

export function createFloorEdgeShadowMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0x221d18,
    transparent: true,
    opacity: 0.045,
    depthWrite: false
  });
}

export function createMatMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xe9dfd2,
    roughness: 0.94,
    metalness: 0
  });
}

export function createFallbackArtworkMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0xd8d2c9
  });
}

export function createArtworkImageMaterial(texture: THREE.Texture | null) {
  if (!texture) {
    return createFallbackArtworkMaterial();
  }

  return new THREE.MeshBasicMaterial({
    map: texture
  });
}

export function createPlaqueMaterial(texture: THREE.Texture) {
  return new THREE.MeshBasicMaterial({
    map: texture
  });
}

export function createPlaqueBodyMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xd4cabd,
    roughness: 0.92,
    metalness: 0
  });
}
