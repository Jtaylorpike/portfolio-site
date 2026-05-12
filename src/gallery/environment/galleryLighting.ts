// Lighting setup for the 3D gallery.
//
// The room uses a broad ambient base plus small, distributed ceiling-zone lights.
// Visible ceiling fixtures are intentionally modest panels; the actual light is
// kept soft so the gallery reads as an enclosed room without creating a single
// harsh hotspot or a distracting light strip.

import * as THREE from 'three';
import { ceilingLightPanels, galleryRoom } from './galleryBlueprint';

export function addGalleryLighting(scene: THREE.Scene) {
  const ambientLight = new THREE.HemisphereLight(
    0xfffbf2,
    0xcfc5b7,
    0.62
  );

  scene.add(ambientLight);

  const overheadWash = new THREE.DirectionalLight(0xfff5e5, 0.44);
  overheadWash.position.set(0, galleryRoom.height + 2.2, 2.8);
  scene.add(overheadWash);

  const entryFillLight = new THREE.DirectionalLight(0xffffff, 0.16);
  entryFillLight.position.set(0, 3.8, 10.5);
  scene.add(entryFillLight);

  const rearFillLight = new THREE.DirectionalLight(0xe9f1ff, 0.11);
  rearFillLight.position.set(0, 3.8, -10.5);
  scene.add(rearFillLight);

  ceilingLightPanels.forEach((panel) => {
    const light = new THREE.PointLight(
      0xfff0d6,
      panel.intensity,
      panel.distance,
      2.25
    );

    light.position.set(
      panel.position[0],
      galleryRoom.height - 0.22,
      panel.position[1]
    );

    scene.add(light);
  });
}
