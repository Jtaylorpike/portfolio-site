// Lighting setup for the 3D gallery.
//
// This version avoids per-artwork spotlights because they were spilling onto
// the floor and creating inconsistent wall shadows.
//
// The room uses broad neutral lighting so the gallery reads cleanly while the
// artwork images remain clear through their own material.

import * as THREE from 'three';

export function addGalleryLighting(scene: THREE.Scene) {
  const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0xd4dce2,
    0.72
  );

  scene.add(ambientLight);

  const overheadLight = new THREE.DirectionalLight(0xfff8ee, 1.15);
  overheadLight.position.set(0, 7, 3);
  scene.add(overheadLight);

  const frontFillLight = new THREE.DirectionalLight(0xffffff, 0.52);
  frontFillLight.position.set(0, 4.5, 8);
  scene.add(frontFillLight);

  const rearFillLight = new THREE.DirectionalLight(0xe8f1ff, 0.28);
  rearFillLight.position.set(0, 4.5, -8);
  scene.add(rearFillLight);
}