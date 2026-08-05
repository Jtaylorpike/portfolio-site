// Lighting setup for the 3D gallery.
//
// Phase 8AM builds from the Phase 8AL screenshot baseline. It preserves the
// accepted dramatic-lighting structure and avoids new scene geometry, post-processing,
// fog, transparent shadow planes, image assets, and package dependencies. The
// changes here are small readability calibrations because Phase 8AL made the
// ceiling read too close to a black void in review screenshots.

import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { galleryRoom } from './galleryBlueprint';
import { galleryArtworks } from '../artwork/galleryLayout';
import type { GalleryQualityTier } from '../performance/galleryQuality';

let rectAreaLightsInitialized = false;

type QualityIntensityScale = Record<GalleryQualityTier, number>;

const architecturalFillScale: QualityIntensityScale = {
  low: 1.35,
  balanced: 1.25,
  high: 1
};

const architecturalFillTone: Record<GalleryQualityTier, { color: number; blend: number }> = {
  low: { color: 0xffc58f, blend: 0.14 },
  balanced: { color: 0xffd7ae, blend: 0.09 },
  high: { color: 0xffffff, blend: 0 }
};

const architecturalGroundTone: Record<GalleryQualityTier, { color: number; blend: number }> = {
  low: { color: 0x8b684d, blend: 0.18 },
  balanced: { color: 0x80634f, blend: 0.12 },
  high: { color: 0xffffff, blend: 0 }
};

function markArchitecturalFill(light: THREE.Light) {
  light.userData.galleryLighting = 'architectural-fill';
  light.userData.baseIntensity = light.intensity;
  light.userData.baseColor = light.color.clone();

  if (light instanceof THREE.HemisphereLight) {
    light.userData.baseGroundColor = light.groundColor.clone();
  }
}

function ensureRectAreaLightsInitialized() {
  if (rectAreaLightsInitialized) {
    return;
  }

  RectAreaLightUniformsLib.init();
  rectAreaLightsInitialized = true;
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

  markArchitecturalFill(ambientLight);
  scene.add(ambientLight);

  const overheadWash = new THREE.DirectionalLight(0xffefde, 0.235);
  overheadWash.position.set(0, galleryRoom.height + 2.2, 2.8);
  markArchitecturalFill(overheadWash);
  scene.add(overheadWash);

  const entryFillLight = new THREE.DirectionalLight(0xffead2, 0.076);
  entryFillLight.position.set(0, 3.8, 10.5);
  markArchitecturalFill(entryFillLight);
  scene.add(entryFillLight);

  const rearFillLight = new THREE.DirectionalLight(0xd2bfa9, 0.058);
  rearFillLight.position.set(0, 3.8, -10.5);
  markArchitecturalFill(rearFillLight);
  scene.add(rearFillLight);

  const lowWarmRoomFill = new THREE.PointLight(0x9a8068, 0.128, 14.5, 2.05);
  lowWarmRoomFill.position.set(0, 1.05, 0.8);
  markArchitecturalFill(lowWarmRoomFill);
  scene.add(lowWarmRoomFill);

  // Phase 8AI keeps the Phase 8AG ceiling rake point lights removed.
  // They added runtime cost without enough visible ceiling improvement.

  // Medium keeps the original restrained eight-piece accent-light budget.
  galleryArtworks.slice(0, 8).forEach((artwork, index) => {
    addArtworkAccentSpotlight(scene, artwork, index);
  });

  // High quality adds one broad wall wash for every displayed artwork.
  galleryArtworks.forEach((artwork) => {
    addArtworkWallWash(scene, artwork);
  });
}


const galleryQualityRank: Record<GalleryQualityTier, number> = {
  low: 0,
  balanced: 1,
  high: 2
};

export function applyGalleryLightingQuality(scene: THREE.Scene, tier: GalleryQualityTier) {
  scene.traverse((object) => {
    if (object.userData.galleryLighting === 'architectural-fill' && object instanceof THREE.Light) {
      const baseIntensity = object.userData.baseIntensity as number | undefined;
      const baseColor = object.userData.baseColor as THREE.Color | undefined;

      if (baseIntensity !== undefined) {
        object.intensity = baseIntensity * architecturalFillScale[tier];
      }

      if (baseColor) {
        const tone = architecturalFillTone[tier];
        object.color.copy(baseColor).lerp(new THREE.Color(tone.color), tone.blend);
      }

      if (object instanceof THREE.HemisphereLight) {
        const baseGroundColor = object.userData.baseGroundColor as THREE.Color | undefined;

        if (baseGroundColor) {
          const groundTone = architecturalGroundTone[tier];
          object.groundColor.copy(baseGroundColor).lerp(
            new THREE.Color(groundTone.color),
            groundTone.blend
          );
        }
      }
    }

    const minimumQuality = object.userData.minimumGalleryQuality as GalleryQualityTier | undefined;

    if (minimumQuality) {
      object.visible = galleryQualityRank[tier] >= galleryQualityRank[minimumQuality];
    }

  });
}
