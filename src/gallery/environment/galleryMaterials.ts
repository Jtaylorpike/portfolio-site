// Material settings for the 3D gallery.
//
// Surface values live here so the room can be visually adjusted without
// changing the scene setup code.

import * as THREE from 'three';
import { galleryFloor } from './galleryBlueprint';

function createSubtleFloorTexture() {
  const canvas = document.createElement('canvas');
  const size = 256;

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  context.fillStyle = '#d8d0c3';
  context.fillRect(0, 0, size, size);

  // Soft concrete/plaster grain. Deterministic enough for a quiet material,
  // not a high-frequency texture that competes with the photography.
  for (let i = 0; i < 1300; i += 1) {
    const value = 190 + Math.floor(Math.random() * 36);
    const alpha = 0.035 + Math.random() * 0.035;

    context.fillStyle = `rgba(${value}, ${value - 4}, ${value - 12}, ${alpha})`;
    context.fillRect(
      Math.random() * size,
      Math.random() * size,
      1 + Math.random() * 1.8,
      1 + Math.random() * 1.8
    );
  }

  context.strokeStyle = 'rgba(110, 101, 88, 0.13)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, 0.5);
  context.lineTo(size, 0.5);
  context.moveTo(0.5, 0);
  context.lineTo(0.5, size);
  context.stroke();

  context.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, size - 0.5);
  context.lineTo(size, size - 0.5);
  context.moveTo(size - 0.5, 0);
  context.lineTo(size - 0.5, size);
  context.stroke();

  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(galleryFloor.width / 5.6, galleryFloor.depth / 5.6);
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  return texture;
}


export function createFloorMaterial() {
  const floorTexture = createSubtleFloorTexture();

  return new THREE.MeshStandardMaterial({
    color: galleryFloor.color,
    map: floorTexture ?? undefined,
    roughness: 0.9,
    metalness: 0
  });
}

export function createWallMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xfaf7ef,
    roughness: 0.98,
    metalness: 0
  });
}

export function createRoomShellWallMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xf4efe7,
    roughness: 0.96,
    metalness: 0
  });
}

export function createCeilingMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xeee8df,
    roughness: 0.94,
    metalness: 0
  });
}

export function createCeilingLightPanelMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0xfff4dc,
    transparent: true,
    opacity: 0.38
  });
}


export function createFrameMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x090908,
    roughness: 0.82,
    metalness: 0
  });
}

export function createWallTrimMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xd2c8b9,
    roughness: 0.9,
    metalness: 0
  });
}

export function createFloorEdgeShadowMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0x1c1813,
    transparent: true,
    opacity: 0.075,
    depthWrite: false
  });
}

export function createMatMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0xf0eadf
  });
}

export function createFallbackArtworkMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0xded7cc
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
    color: 0xd8cfbf,
    roughness: 0.95,
    metalness: 0
  });
}
