// Lighting setup for the 3D gallery.
//
// Phase 8AM builds from the Phase 8AL screenshot baseline. It preserves the
// accepted dramatic-lighting structure and avoids new scene geometry, post-processing,
// fog, transparent shadow planes, image assets, and package dependencies. The
// changes here are small readability calibrations because Phase 8AL made the
// ceiling read too close to a black void in review screenshots.

import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { ceilingLightPanels, galleryRoom } from './galleryBlueprint';
import { galleryArtworks } from '../artwork/galleryLayout';
import type { GalleryQualityTier } from '../performance/galleryQuality';

let rectAreaLightsInitialized = false;

function ensureRectAreaLightsInitialized() {
  if (rectAreaLightsInitialized) {
    return;
  }

  RectAreaLightUniformsLib.init();
  rectAreaLightsInitialized = true;
}

function getPanelSpotTarget(panel: { id: string; position: [number, number] }) {
  const [x, z] = panel.position;

  if (panel.id === 'light-entry-panel') {
    return new THREE.Vector3(x, 1.42, z - 1.08);
  }

  if (panel.id.includes('left-wing')) {
    return new THREE.Vector3(x - 1.06, 1.36, z);
  }

  if (panel.id.includes('right-wing')) {
    return new THREE.Vector3(x + 1.06, 1.36, z);
  }

  if (panel.id === 'light-rear-panel') {
    return new THREE.Vector3(x, 1.38, z + 1.08);
  }

  return new THREE.Vector3(x, 1.34, z);
}

function shouldPanelCastShadow(panel: { id: string }) {
  return panel.id === 'light-entry-panel';
}

function configureSoftPanelShadow(light: THREE.SpotLight, panel: { id: string; distance: number }) {
  if (!shouldPanelCastShadow(panel)) {
    return;
  }

  light.castShadow = true;
  light.shadow.mapSize.width = 384;
  light.shadow.mapSize.height = 384;
  light.shadow.bias = -0.00018;
  light.shadow.normalBias = 0.026;
  light.shadow.radius = 2.6;
  light.shadow.camera.near = 0.35;
  light.shadow.camera.far = panel.distance + 6.2;
  light.shadow.camera.fov = 62;
}

function addPanelSpotlight(
  scene: THREE.Scene,
  panel: { id: string; position: [number, number]; intensity: number; distance: number }
) {
  const light = new THREE.SpotLight(
    0xffe4cb,
    panel.intensity * 5.85,
    panel.distance + 5.2,
    Math.PI / 4.15,
    0.82,
    1.46
  );
  const target = new THREE.Object3D();

  light.position.set(
    panel.position[0],
    galleryRoom.height - 0.16,
    panel.position[1]
  );
  light.target = target;
  target.position.copy(getPanelSpotTarget(panel));
  configureSoftPanelShadow(light, panel);

  light.userData = {
    galleryLighting: 'ceiling-artwork-spot',
    lightPanelId: panel.id,
    phase8U: 'readable-ceiling-warmed-fixture-spot',
    minimumGalleryQuality: 'low',
    adaptiveGalleryShadow: shouldPanelCastShadow(panel)
  };
  target.userData = {
    galleryLighting: 'ceiling-artwork-spot-target',
    lightPanelId: panel.id,
    phase8U: 'readable-ceiling-warmed-fixture-spot-target',
    minimumGalleryQuality: 'low'
  };

  scene.add(target);
  scene.add(light);
}

function addPanelAreaWash(
  scene: THREE.Scene,
  panel: { id: string; position: [number, number]; width: number; depth: number; rotationY: number; intensity: number }
) {
  const light = new THREE.RectAreaLight(
    0xffd9b8,
    1.18 + panel.intensity * 2.9,
    panel.width * 1.34,
    panel.depth * 1.34
  );

  light.position.set(
    panel.position[0],
    galleryRoom.height - 0.13,
    panel.position[1]
  );
  light.rotation.y = panel.rotationY;
  light.lookAt(panel.position[0], 0.74, panel.position[1]);
  light.userData = {
    galleryLighting: 'ceiling-area-wash',
    lightPanelId: panel.id,
    phase8U: 'readable-ceiling-fixture-surface-wash',
    minimumGalleryQuality: 'balanced'
  };

  scene.add(light);
}

function getArtworkAccentIntensity(artwork: typeof galleryArtworks[number]) {
  if (artwork.wallType === 'feature-wall') {
    return 1.22;
  }

  if (artwork.width >= 3) {
    return 0.82;
  }

  return 0.54;
}

function getArtworkAreaIntensity(artwork: typeof galleryArtworks[number]) {
  if (artwork.wallType === 'feature-wall') {
    return 2.78;
  }

  if (artwork.width >= 3) {
    return 1.94;
  }

  return 1.26;
}

function addArtworkAccentSpotlight(scene: THREE.Scene, artwork: typeof galleryArtworks[number], index: number) {
  const normal = new THREE.Vector3(Math.sin(artwork.rotationY), 0, Math.cos(artwork.rotationY));
  const tangent = new THREE.Vector3(Math.cos(artwork.rotationY), 0, -Math.sin(artwork.rotationY));
  const target = new THREE.Object3D();
  const sideBias = index % 2 === 0 ? 0.32 : -0.32;
  const light = new THREE.SpotLight(
    0xffd6b2,
    getArtworkAccentIntensity(artwork) * 0.95,
    5.35,
    Math.PI / 6.55,
    0.84,
    1.7
  );

  light.position.set(
    artwork.position[0] + normal.x * 0.9 + tangent.x * sideBias,
    galleryRoom.height - 0.36,
    artwork.position[2] + normal.z * 0.9 + tangent.z * sideBias
  );
  light.target = target;
  target.position.set(
    artwork.position[0],
    Math.min(galleryRoom.height - 0.85, artwork.position[1] - 0.02),
    artwork.position[2]
  );

  light.userData = {
    galleryLighting: 'artwork-accent-spot',
    artworkId: artwork.id,
    phase8U: 'readable-ceiling-artwork-presence',
    minimumGalleryQuality: 'balanced'
  };
  target.userData = {
    galleryLighting: 'artwork-accent-spot-target',
    artworkId: artwork.id,
    phase8U: 'readable-ceiling-artwork-presence-target',
    minimumGalleryQuality: 'balanced'
  };

  scene.add(target);
  scene.add(light);
}

function addArtworkWallWash(scene: THREE.Scene, artwork: typeof galleryArtworks[number]) {
  const normal = new THREE.Vector3(Math.sin(artwork.rotationY), 0, Math.cos(artwork.rotationY));
  const light = new THREE.RectAreaLight(
    0xffd2ad,
    getArtworkAreaIntensity(artwork) * 0.9,
    Math.max(1.35, artwork.width * 1.1),
    Math.max(0.8, artwork.height * 0.52)
  );

  light.position.set(
    artwork.position[0] + normal.x * 0.78,
    Math.min(galleryRoom.height - 0.34, artwork.position[1] + artwork.height * 0.36),
    artwork.position[2] + normal.z * 0.78
  );
  light.lookAt(
    artwork.position[0],
    artwork.position[1] - artwork.height * 0.12,
    artwork.position[2]
  );
  light.userData = {
    galleryLighting: 'artwork-wall-wash',
    artworkId: artwork.id,
    phase8U: 'readable-ceiling-wall-and-frame-wash',
    minimumGalleryQuality: 'high'
  };

  scene.add(light);
}

export function addGalleryLighting(scene: THREE.Scene) {
  ensureRectAreaLightsInitialized();

  const ambientLight = new THREE.HemisphereLight(
    0xf3eadc,
    0x65594d,
    0.425
  );

  scene.add(ambientLight);

  const overheadWash = new THREE.DirectionalLight(0xffefde, 0.235);
  overheadWash.position.set(0, galleryRoom.height + 2.2, 2.8);
  scene.add(overheadWash);

  const entryFillLight = new THREE.DirectionalLight(0xffead2, 0.076);
  entryFillLight.position.set(0, 3.8, 10.5);
  scene.add(entryFillLight);

  const rearFillLight = new THREE.DirectionalLight(0xd2bfa9, 0.058);
  rearFillLight.position.set(0, 3.8, -10.5);
  scene.add(rearFillLight);

  const lowWarmRoomFill = new THREE.PointLight(0x9a8068, 0.128, 14.5, 2.05);
  lowWarmRoomFill.position.set(0, 1.05, 0.8);
  scene.add(lowWarmRoomFill);

  const ceilingAtmosphereLift = new THREE.PointLight(0xcaa984, 0.62, 17.5, 2.28);
  ceilingAtmosphereLift.position.set(0, galleryRoom.height - 0.36, 0);
  scene.add(ceilingAtmosphereLift);

  // Phase 8AI keeps the Phase 8AG ceiling rake point lights removed.
  // They added runtime cost without enough visible ceiling improvement.

  ceilingLightPanels.forEach((panel) => {
    const light = new THREE.PointLight(
      0xffdfbf,
      panel.intensity * 3.34,
      panel.distance + 0.6,
      1.82
    );

    light.position.set(
      panel.position[0],
      galleryRoom.height - 0.22,
      panel.position[1]
    );

    light.userData = {
      galleryLighting: 'ceiling-panel-warm-pool',
      lightPanelId: panel.id,
      phase8AI: 'lighter-localized-ceiling-finish-pool'
    };

    scene.add(light);
    addPanelAreaWash(scene, panel);
    addPanelSpotlight(scene, panel);
  });

  galleryArtworks.slice(0, 8).forEach((artwork, index) => {
    addArtworkWallWash(scene, artwork);
    addArtworkAccentSpotlight(scene, artwork, index);
  });
}


const galleryQualityRank: Record<GalleryQualityTier, number> = {
  low: 0,
  balanced: 1,
  high: 2
};

export function applyGalleryLightingQuality(scene: THREE.Scene, tier: GalleryQualityTier) {
  scene.traverse((object) => {
    const minimumQuality = object.userData.minimumGalleryQuality as GalleryQualityTier | undefined;

    if (minimumQuality) {
      object.visible = galleryQualityRank[tier] >= galleryQualityRank[minimumQuality];
    }

    if (object.userData.adaptiveGalleryShadow && object instanceof THREE.SpotLight) {
      object.castShadow = tier === 'high';
    }
  });
}
