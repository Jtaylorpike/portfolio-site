// Lighting setup for the 3D gallery.
//
// This version avoids per-artwork spotlights because they can spill onto the
// floor and create inconsistent shadows. The room uses broad neutral lighting
// so the gallery reads cleanly while artwork images remain clear through their
// own material.

import * as THREE from 'three';

export function addGalleryLighting(scene: THREE.Scene) {
  const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0xd8d0c3,
    0.74
  );

  scene.add(ambientLight);

  const overheadLight = new THREE.DirectionalLight(0xfff8ee, 1.0);
  overheadLight.position.set(0, 7.5, 3.2);
  scene.add(overheadLight);

  const frontFillLight = new THREE.DirectionalLight(0xffffff, 0.42);
  frontFillLight.position.set(0, 4.5, 8);
  scene.add(frontFillLight);

  const rearFillLight = new THREE.DirectionalLight(0xe8f1ff, 0.22);
  rearFillLight.position.set(0, 4.5, -8);
  scene.add(rearFillLight);

  const sideFillLight = new THREE.DirectionalLight(0xfffbf5, 0.18);
  sideFillLight.position.set(-8, 4.5, 0);
  scene.add(sideFillLight);
}

