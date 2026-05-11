// Material settings for the 3D gallery.
//
// Surface values live here so the room can be visually adjusted without
// changing the scene setup code.

import * as THREE from 'three';
import { galleryFloor } from './galleryBlueprint';

export function createFloorMaterial() {
  return new THREE.MeshStandardMaterial({
    color: galleryFloor.color,
    roughness: 0.84,
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

export function createFrameMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0x0d0d0d
  });
}

export function createWallTrimMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xd2c8b9,
    roughness: 0.9,
    metalness: 0
  });
}

export function createMatMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0xf4efe5
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
