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
  | 'ceiling'
  | 'prototype-museum-wall'
  | 'prototype-dark-wood';

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
  repeatY: number,
  size = 256
) {
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
    baseColor: '#999a96',
    colorNoise: 6.4,
    detailBase: 218,
    detailNoise: 10,
    seed: 3101,
    repeatX: 0.52,
    repeatY: 0.48,
    broadCount: 38,
    mediumCount: 82,
    grainCount: 860,
    colorBroadOpacity: 0.06,
    colorMediumOpacity: 0.033,
    colorGrainOpacity: 0.019,
    detailBroadOpacity: 0.065,
    detailMediumOpacity: 0.042,
    detailGrainOpacity: 0.034,
    lightRgb: '219, 221, 216',
    darkRgb: '55, 59, 57'
  });
}

function getCeilingTextures() {
  return createSurfaceTextureSet({
    key: 'ceiling',
    baseColor: '#77736c',
    colorNoise: 5.2,
    detailBase: 211,
    detailNoise: 15,
    seed: 4101,
    repeatX: 0.8,
    repeatY: 0.76,
    broadCount: 36,
    mediumCount: 110,
    grainCount: 980,
    colorBroadOpacity: 0.034,
    colorMediumOpacity: 0.021,
    colorGrainOpacity: 0.019,
    detailBroadOpacity: 0.052,
    detailMediumOpacity: 0.038,
    detailGrainOpacity: 0.046,
    lightRgb: '196, 192, 184',
    darkRgb: '52, 49, 45'
  });
}

function drawPrototypeWoodGrain(
  ctx: CanvasRenderingContext2D,
  size: number,
  seed: number,
  color: string,
  alpha: number,
  count: number
) {
  const random = createSeededRandom(seed);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 0.45;

  for (let index = 0; index < count; index += 1) {
    const y = random() * size;
    const amplitude = 1.5 + random() * 5;
    const frequency = 0.01 + random() * 0.028;
    const phase = random() * Math.PI * 2;

    ctx.beginPath();
    for (let x = -12; x <= size + 12; x += 6) {
      const offset = Math.sin(x * frequency + phase) * amplitude;
      if (x === -12) {
        ctx.moveTo(x, y + offset);
      } else {
        ctx.lineTo(x, y + offset);
      }
    }
    ctx.stroke();
  }

  ctx.restore();
}

function getPrototypeDarkWoodTextures() {
  const cached = textureCache.get('prototype-dark-wood');
  if (cached) {
    return cached;
  }

  const color = createCanvasTexture((ctx, size) => {
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1f120d');
    gradient.addColorStop(0.42, '#4d2e1e');
    gradient.addColorStop(0.72, '#2b1810');
    gradient.addColorStop(1, '#5a3826');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    drawPrototypeWoodGrain(ctx, size, 8101, '#b17a50', 0.18, 30);
    drawPrototypeWoodGrain(ctx, size, 8137, '#0d0806', 0.28, 44);

    const random = createSeededRandom(8171);
    for (let index = 0; index < 14; index += 1) {
      const x = random() * size;
      const y = random() * size;
      const radius = 8 + random() * 22;
      const knot = ctx.createRadialGradient(x, y, 1, x, y, radius);
      knot.addColorStop(0, 'rgba(12, 7, 5, 0.34)');
      knot.addColorStop(0.45, 'rgba(101, 58, 34, 0.16)');
      knot.addColorStop(1, 'rgba(22, 12, 8, 0)');
      ctx.fillStyle = knot;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.35, radius * 0.42, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }, THREE.SRGBColorSpace, 2.1, 2.1, 512);

  const detail = createCanvasTexture((ctx, size) => {
    fillFineGrayNoise(ctx, size, 154, 26, 8201);
    drawPrototypeWoodGrain(ctx, size, 8231, '#242424', 0.28, 44);
    drawPrototypeWoodGrain(ctx, size, 8261, '#efefef', 0.1, 18);
  }, THREE.NoColorSpace, 2.1, 2.1, 512);

  const set = { color, detail };
  textureCache.set('prototype-dark-wood', set);
  return set;
}

function getPrototypeMuseumWallTextures() {
  return createSurfaceTextureSet({
    key: 'prototype-museum-wall',
    baseColor: '#d6cdc0',
    colorNoise: 2.1,
    detailBase: 232,
    detailNoise: 4.5,
    seed: 7101,
    repeatX: 0.55,
    repeatY: 0.62,
    broadCount: 10,
    mediumCount: 22,
    grainCount: 260,
    colorBroadOpacity: 0.011,
    colorMediumOpacity: 0.006,
    colorGrainOpacity: 0.006,
    detailBroadOpacity: 0.016,
    detailMediumOpacity: 0.01,
    detailGrainOpacity: 0.014,
    lightRgb: '255, 249, 239',
    darkRgb: '102, 89, 76'
  });
}

export function prewarmGalleryEnvironmentMaterials() {
  getGalleryWallTextures(0);
  getGalleryWallTextures(1);
  getRoomShellTextures();
  getFloorTextures();
  getCeilingTextures();
  getPrototypeMuseumWallTextures();
  getPrototypeDarkWoodTextures();
}

export function createPrototypeMuseumWallMaterial() {
  const textures = getPrototypeMuseumWallTextures();

  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.color,
    roughness: 0.92,
    roughnessMap: textures.detail,
    bumpMap: textures.detail,
    bumpScale: 0.0024,
    metalness: 0
  });
}

export function createPrototypeDarkWoodMaterial() {
  const textures = getPrototypeDarkWoodTextures();

  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: textures.color,
    roughness: 0.3,
    roughnessMap: textures.detail,
    bumpMap: textures.detail,
    bumpScale: 0.0044,
    metalness: 0,
    clearcoat: 0.78,
    clearcoatRoughness: 0.2
  });
}

export function createPrototypeDarkWoodRailMaterial(roughness: number, clearcoatRoughness: number) {
  const textures = getPrototypeDarkWoodTextures();

  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: textures.color,
    roughness,
    roughnessMap: textures.detail,
    bumpMap: textures.detail,
    bumpScale: 0.0032,
    metalness: 0,
    clearcoat: 0.88,
    clearcoatRoughness
  });
}

export function createTrackLightHousingMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x171513,
    roughness: 0.68,
    metalness: 0.34
  });
}

export function createTrackLightLensMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffe5c8,
    roughness: 0.5,
    metalness: 0,
    emissive: 0xffd1a3,
    emissiveIntensity: 0.16
  });
}

export function createFloorMaterial() {
  const textures = getFloorTextures();

  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: textures.color,
    roughness: 0.94,
    roughnessMap: textures.detail,
    bumpMap: textures.detail,
    bumpScale: 0.0038,
    metalness: 0,
    clearcoat: 0.004,
    clearcoatRoughness: 1
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
