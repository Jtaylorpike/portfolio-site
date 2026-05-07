// Material settings for the 3D gallery.
//
// Surface values live here so the room can be visually adjusted without
// changing the scene setup code.

import * as THREE from 'three';
import { galleryFloor } from './galleryBlueprint';

export function createFloorMaterial() {
  return new THREE.MeshStandardMaterial({
    color: galleryFloor.color,
    roughness: 0.74,
    metalness: 0
  });
}

export function createWallMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.98,
    metalness: 0
  });
}

export function createFrameMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0x111111
  });
}

export function createMatMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0xf7f3eb
  });
}

export function createFallbackArtworkMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0xd8d3c8
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