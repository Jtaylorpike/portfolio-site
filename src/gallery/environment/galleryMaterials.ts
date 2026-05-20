// Material settings for the 3D gallery.
//
// Phase 8AL builds from the Phase 8AK rollback baseline after the rejected
// Phase 8AJ geometry pass. This pass avoids new architectural geometry and
// instead calibrates the existing shell with warmer surface tone, subtler fixture
// presence, and more photographic material response.
//
// Target: quiet warm concrete/stone floor, sand-plaster walls, dark atmospheric
// ceiling texture, and restrained fixture/frame material values that move the
// room closer to the generated museum reference without adding clutter.

import * as THREE from 'three';

type TextureCacheEntry = {
  color?: THREE.CanvasTexture;
  roughness?: THREE.CanvasTexture;
  bump?: THREE.CanvasTexture;
};

const textureCache: Record<string, TextureCacheEntry> = {};

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

function createCanvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  colorSpace: THREE.ColorSpace,
  repeatX: number,
  repeatY: number
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
  texture.needsUpdate = true;
  return texture;
}

function fillNoise(ctx: CanvasRenderingContext2D, size: number, base: number, spread: number, seed: number) {
  const random = createSeededRandom(seed);
  const image = ctx.createImageData(size, size);
  const data = image.data;

  for (let index = 0; index < data.length; index += 4) {
    const value = Math.max(0, Math.min(255, Math.round(base + (random() - 0.5) * spread)));
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
}

function addSoftClouds(
  ctx: CanvasRenderingContext2D,
  size: number,
  seed: number,
  count: number,
  opacity: number,
  lightColor = '255, 250, 238',
  darkColor = '72, 64, 55'
) {
  const random = createSeededRandom(seed);

  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radiusX = (42 + random() * 130) * (size / 512);
    const radiusY = (28 + random() * 92) * (size / 512);
    const alpha = (0.018 + random() * 0.032) * opacity;
    const rgb = random() > 0.48 ? lightColor : darkColor;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radiusX, radiusY));
    gradient.addColorStop(0, `rgba(${rgb}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);

    ctx.translate(x, y);
    ctx.rotate(random() * Math.PI);
    ctx.scale(radiusX / Math.max(radiusX, radiusY), radiusY / Math.max(radiusX, radiusY));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(radiusX, radiusY), 0, Math.PI * 2);
    ctx.fill();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  ctx.restore();
}

function addSandPlasterMarks(ctx: CanvasRenderingContext2D, size: number, seed: number, opacity = 1) {
  const random = createSeededRandom(seed);

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  addSoftClouds(ctx, size, seed + 13, 34, 0.54 * opacity, '244, 237, 222', '78, 70, 60');

  for (let i = 0; i < 860; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = (0.24 + random() * 0.68) * (size / 512);
    const alpha = (0.012 + random() * 0.028) * opacity;
    const light = random() > 0.53;
    ctx.fillStyle = light
      ? `rgba(255, 250, 237, ${alpha})`
      : `rgba(73, 65, 56, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 68; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const length = (7 + random() * 34) * (size / 512);
    const angle = random() * Math.PI * 2;
    const alpha = (0.008 + random() * 0.018) * opacity;

    ctx.strokeStyle = random() > 0.5
      ? `rgba(248, 239, 221, ${alpha})`
      : `rgba(79, 70, 60, ${alpha})`;
    ctx.lineWidth = 0.32 + random() * 0.55;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(angle + 0.75) * length * 0.38,
      y + Math.sin(angle + 0.75) * length * 0.38,
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length
    );
    ctx.stroke();
  }

  ctx.restore();
}

function addMarbleVeins(ctx: CanvasRenderingContext2D, size: number, seed: number) {
  const random = createSeededRandom(seed);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  addSoftClouds(ctx, size, seed + 5, 64, 0.58, '228, 225, 216', '94, 90, 84');

  for (let i = 0; i < 7; i += 1) {
    const startX = -size * 0.1 + random() * size * 1.2;
    const startY = random() * size;
    const direction = random() > 0.5 ? 1 : -1;
    const alpha = 0.009 + random() * 0.018;
    const width = 0.38 + random() * 0.95;

    ctx.strokeStyle = `rgba(83, 79, 74, ${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    let x = startX;
    let y = startY;
    for (let segment = 0; segment < 4; segment += 1) {
      const controlX = x + size * (0.14 + random() * 0.2);
      const controlY = y + direction * size * (0.025 + random() * 0.085) + (random() - 0.5) * size * 0.11;
      x += size * (0.16 + random() * 0.23);
      y += direction * size * (0.012 + random() * 0.052) + (random() - 0.5) * size * 0.1;
      ctx.quadraticCurveTo(controlX, controlY, x, y);
    }

    ctx.stroke();
  }

  for (let i = 0; i < 54; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = (18 + random() * 86) * (size / 512);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 250, 239, ${0.012 + random() * 0.018})`);
    gradient.addColorStop(1, 'rgba(255, 250, 239, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function addKnockdownTexture(ctx: CanvasRenderingContext2D, size: number, seed: number) {
  const random = createSeededRandom(seed);

  ctx.save();
  addSoftClouds(ctx, size, seed + 9, 96, 0.72, '160, 151, 137', '40, 34, 29');

  for (let i = 0; i < 760; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radiusX = (0.9 + random() * 6.6) * (size / 512);
    const radiusY = (0.68 + random() * 4.8) * (size / 512);
    const alpha = 0.021 + random() * 0.052;
    const isLift = random() > 0.43;

    ctx.fillStyle = isLift
      ? `rgba(176, 166, 151, ${alpha * 0.88})`
      : `rgba(38, 33, 29, ${alpha * 0.72})`;
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 34; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = (20 + random() * 78) * (size / 512);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const light = random() > 0.46;
    gradient.addColorStop(0, light ? 'rgba(176, 166, 151, 0.044)' : 'rgba(38, 33, 29, 0.032)');
    gradient.addColorStop(1, light ? 'rgba(160, 151, 137, 0)' : 'rgba(38, 33, 29, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 420; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = (0.32 + random() * 1.12) * (size / 512);
    ctx.fillStyle = random() > 0.5 ? 'rgba(172, 162, 147, 0.035)' : 'rgba(42, 36, 31, 0.026)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function getWallColorTexture() {
  if (!textureCache.wall?.color) {
    const texture = createCanvasTexture(256, (ctx, size) => {
      ctx.fillStyle = '#bdb2a2';
      ctx.fillRect(0, 0, size, size);
      addSandPlasterMarks(ctx, size, 1101, 0.94);
      addSandPlasterMarks(ctx, size, 1109, 0.46);
    }, THREE.SRGBColorSpace, 0.58, 0.55);

    textureCache.wall = { ...(textureCache.wall ?? {}), color: texture };
  }

  return textureCache.wall.color!;
}

function getWallRoughnessTexture() {
  if (!textureCache.wall?.roughness) {
    const texture = createCanvasTexture(256, (ctx, size) => {
      fillNoise(ctx, size, 216, 10, 1201);
      addSandPlasterMarks(ctx, size, 1209, 0.4);
    }, THREE.NoColorSpace, 0.58, 0.55);

    textureCache.wall = { ...(textureCache.wall ?? {}), roughness: texture };
  }

  return textureCache.wall.roughness!;
}

function getWallBumpTexture() {
  if (!textureCache.wall?.bump) {
    const texture = createCanvasTexture(256, (ctx, size) => {
      fillNoise(ctx, size, 128, 8, 1301);
      addSandPlasterMarks(ctx, size, 1309, 0.5);
    }, THREE.NoColorSpace, 0.58, 0.55);

    textureCache.wall = { ...(textureCache.wall ?? {}), bump: texture };
  }

  return textureCache.wall.bump!;
}

function getFloorColorTexture() {
  if (!textureCache.floor?.color) {
    const texture = createCanvasTexture(256, (ctx, size) => {
      ctx.fillStyle = '#91887a';
      ctx.fillRect(0, 0, size, size);
      fillNoise(ctx, size, 147, 9, 2101);
      ctx.globalAlpha = 0.3;
      addMarbleVeins(ctx, size, 2111);
      ctx.globalAlpha = 1;

      // Broad, very low-contrast slab/reveal lines add floor scale without
      // adding geometry or returning to an obvious grid.
      ctx.strokeStyle = 'rgba(61, 55, 48, 0.07)';
      ctx.lineWidth = Math.max(1, size * 0.004);
      [0.28, 0.64].forEach((xRatio) => {
        ctx.beginPath();
        ctx.moveTo(size * xRatio, 0);
        ctx.lineTo(size * (xRatio + 0.02), size);
        ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(226, 216, 198, 0.035)';
      ctx.lineWidth = Math.max(0.75, size * 0.002);
      [0.31, 0.67].forEach((xRatio) => {
        ctx.beginPath();
        ctx.moveTo(size * xRatio, 0);
        ctx.lineTo(size * (xRatio + 0.02), size);
        ctx.stroke();
      });
    }, THREE.SRGBColorSpace, 0.24, 0.24);

    textureCache.floor = { ...(textureCache.floor ?? {}), color: texture };
  }

  return textureCache.floor.color!;
}

function getFloorRoughnessTexture() {
  if (!textureCache.floor?.roughness) {
    const texture = createCanvasTexture(256, (ctx, size) => {
      fillNoise(ctx, size, 206, 9, 2201);
      ctx.globalAlpha = 0.25;
      addMarbleVeins(ctx, size, 2211);
      ctx.globalAlpha = 1;
    }, THREE.NoColorSpace, 0.24, 0.24);

    textureCache.floor = { ...(textureCache.floor ?? {}), roughness: texture };
  }

  return textureCache.floor.roughness!;
}

function getFloorBumpTexture() {
  if (!textureCache.floor?.bump) {
    const texture = createCanvasTexture(256, (ctx, size) => {
      fillNoise(ctx, size, 126, 6, 2301);
      ctx.globalAlpha = 0.18;
      addMarbleVeins(ctx, size, 2311);
      ctx.globalAlpha = 1;
    }, THREE.NoColorSpace, 0.24, 0.24);

    textureCache.floor = { ...(textureCache.floor ?? {}), bump: texture };
  }

  return textureCache.floor.bump!;
}

function getCeilingColorTexture() {
  if (!textureCache.ceiling?.color) {
    const texture = createCanvasTexture(256, (ctx, size) => {
      ctx.fillStyle = '#5e5549';
      ctx.fillRect(0, 0, size, size);
      addKnockdownTexture(ctx, size, 3101);
      ctx.globalAlpha = 0.26;
      addSoftClouds(ctx, size, 3141, 28, 0.46, '146, 133, 113', '34, 29, 25');
      ctx.globalAlpha = 1;
    }, THREE.SRGBColorSpace, 0.64, 0.61);

    textureCache.ceiling = { ...(textureCache.ceiling ?? {}), color: texture };
  }

  return textureCache.ceiling.color!;
}

function getCeilingRoughnessTexture() {
  if (!textureCache.ceiling?.roughness) {
    const texture = createCanvasTexture(256, (ctx, size) => {
      fillNoise(ctx, size, 204, 18, 3201);
      addKnockdownTexture(ctx, size, 3211);
    }, THREE.NoColorSpace, 0.64, 0.61);

    textureCache.ceiling = { ...(textureCache.ceiling ?? {}), roughness: texture };
  }

  return textureCache.ceiling.roughness!;
}

function getCeilingBumpTexture() {
  if (!textureCache.ceiling?.bump) {
    const texture = createCanvasTexture(256, (ctx, size) => {
      fillNoise(ctx, size, 126, 20, 3301);
      addKnockdownTexture(ctx, size, 3311);
    }, THREE.NoColorSpace, 0.64, 0.61);

    textureCache.ceiling = { ...(textureCache.ceiling ?? {}), bump: texture };
  }

  return textureCache.ceiling.bump!;
}

export function prewarmGalleryEnvironmentMaterials() {
  getWallColorTexture();
  getWallRoughnessTexture();
  getWallBumpTexture();
  getFloorColorTexture();
  getFloorRoughnessTexture();
  getFloorBumpTexture();
  getCeilingColorTexture();
  getCeilingRoughnessTexture();
  getCeilingBumpTexture();
}

export function createFloorMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: getFloorColorTexture(),
    roughness: 0.91,
    roughnessMap: getFloorRoughnessTexture(),
    bumpMap: getFloorBumpTexture(),
    bumpScale: 0.0044,
    metalness: 0,
    clearcoat: 0.012,
    clearcoatRoughness: 0.9
  });
}

export function createWallMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: getWallColorTexture(),
    roughness: 0.94,
    roughnessMap: getWallRoughnessTexture(),
    bumpMap: getWallBumpTexture(),
    bumpScale: 0.0052,
    metalness: 0
  });
}

export function createRoomShellWallMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xf1e8db,
    map: getWallColorTexture(),
    roughness: 0.942,
    roughnessMap: getWallRoughnessTexture(),
    bumpMap: getWallBumpTexture(),
    bumpScale: 0.0048,
    metalness: 0
  });
}

export function createCeilingMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: getCeilingColorTexture(),
    roughness: 0.9,
    roughnessMap: getCeilingRoughnessTexture(),
    bumpMap: getCeilingBumpTexture(),
    bumpScale: 0.012,
    metalness: 0,
    emissive: 0x5f564b,
    emissiveMap: getCeilingColorTexture(),
    emissiveIntensity: 0.35
  });
}

export function createCeilingDetailMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: getCeilingColorTexture(),
    roughness: 0.87,
    roughnessMap: getCeilingRoughnessTexture(),
    bumpMap: getCeilingBumpTexture(),
    bumpScale: 0.015,
    metalness: 0,
    emissive: 0x716a60,
    emissiveMap: getCeilingColorTexture(),
    emissiveIntensity: 0.42
  });
}

export function createCeilingLightPanelMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffedda,
    roughness: 0.66,
    metalness: 0,
    emissive: 0xffd8ad,
    emissiveIntensity: 0.46
  });
}

export function createCeilingLightPanelFrameMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x16120f,
    roughness: 0.86,
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
    color: 0x43372d,
    roughness: 0.9,
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
