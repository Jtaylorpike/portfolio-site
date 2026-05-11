// Top-down layout data for the 3D gallery.
//
// This file defines the floor size, wall block presets, artwork sizes,
// starting camera position, movement boundaries, and placed wall blocks.
//
// The current layout is a perimeter-and-wing gallery: a central entry hero,
// a left climbing wing, a right landscape wing, and a rear wall. The intent is
// to show the full active portfolio set without creating a maze or blocking the
// user into narrow movement corridors.
//
// A future visual editor could generate this file or a JSON version of this data.

export type WallPresetName = 'short' | 'medium' | 'long' | 'hero';

export type ArtworkSizeName = 'small' | 'medium' | 'large' | 'hero';

export type WallPreset = {
  width: number;
  height: number;
  thickness: number;
  artworkSize: ArtworkSizeName;
};

export type ArtworkSize = {
  width: number;
  height: number;
};

export type WallBlock = {
  id: string;
  preset: WallPresetName;

  // 2D floor position used by the top-down layout.
  // x = left/right
  // z = forward/back
  position: [number, number];

  // Wall rotation in radians.
  // 0 = front side faces +Z
  // Math.PI / 2 = front side faces +X
  // -Math.PI / 2 = front side faces -X
  // Math.PI = front side faces -Z
  rotationY: number;

  // Matches an id from src/data/images.ts.
  // Leave empty for a blank architectural wall.
  artworkId?: string;

  // Overrides the default artwork size from the selected wall preset.
  artworkSize?: ArtworkSizeName;
};

export const galleryFloor = {
  width: 34,
  depth: 34,
  color: 0xd8d0c3
};

export const galleryStart = {
  position: [0, 1.65, 13.4] as [number, number, number],
  yaw: 0
};

export const movementBounds = {
  minX: -15.3,
  maxX: 15.3,
  minZ: -15.3,
  maxZ: 15.3
};

// Reusable wall dimensions.
// These presets keep wall placement consistent and easier to edit later.
export const wallPresets: Record<WallPresetName, WallPreset> = {
  short: {
    width: 2.7,
    height: 3.25,
    thickness: 0.22,
    artworkSize: 'small'
  },
  medium: {
    width: 3.55,
    height: 3.3,
    thickness: 0.22,
    artworkSize: 'medium'
  },
  long: {
    width: 4.9,
    height: 3.3,
    thickness: 0.22,
    artworkSize: 'large'
  },
  hero: {
    width: 6.25,
    height: 3.6,
    thickness: 0.26,
    artworkSize: 'hero'
  }
};

// Standard framed-image sizes used on wall blocks.
export const artworkSizes: Record<ArtworkSizeName, ArtworkSize> = {
  small: {
    width: 1.65,
    height: 1.1
  },
  medium: {
    width: 2.25,
    height: 1.52
  },
  large: {
    width: 3.18,
    height: 2.04
  },
  hero: {
    width: 4.35,
    height: 2.52
  }
};

// Placed wall blocks for the current gallery layout.
// Keep corridors wide enough for the movement collision radius defined in
// movementController.ts. Artworks are intentionally distributed by category so
// the gallery reads as three zones instead of a random grid of images.
export const wallBlocks: WallBlock[] = [
  {
    id: 'wall-entry-hero-personal',
    preset: 'hero',
    position: [0, 7.2],
    rotationY: 0,
    artworkId: 'personal-01',
    artworkSize: 'hero'
  },

  {
    id: 'wall-entry-left-guide',
    preset: 'long',
    position: [-7.4, 9.7],
    rotationY: Math.PI / 2
  },
  {
    id: 'wall-entry-right-guide',
    preset: 'long',
    position: [7.4, 9.7],
    rotationY: -Math.PI / 2
  },

  {
    id: 'wall-left-climbing-01',
    preset: 'long',
    position: [-12.2, 5.6],
    rotationY: Math.PI / 2,
    artworkId: 'climbing-01',
    artworkSize: 'large'
  },
  {
    id: 'wall-left-climbing-02',
    preset: 'medium',
    position: [-12.2, 0],
    rotationY: Math.PI / 2,
    artworkId: 'climbing-02',
    artworkSize: 'medium'
  },
  {
    id: 'wall-left-climbing-03',
    preset: 'medium',
    position: [-12.2, -5.6],
    rotationY: Math.PI / 2,
    artworkId: 'climbing-03',
    artworkSize: 'medium'
  },

  {
    id: 'wall-left-inner-workbook-05',
    preset: 'long',
    position: [-5.35, 5.2],
    rotationY: -Math.PI / 2,
    artworkId: 'climbing-climbing-workbook-05',
    artworkSize: 'large'
  },
  {
    id: 'wall-left-inner-portfolio-08',
    preset: 'medium',
    position: [-5.35, -0.35],
    rotationY: -Math.PI / 2,
    artworkId: 'climbing-climbing-portfolio-08',
    artworkSize: 'medium'
  },
  {
    id: 'wall-left-inner-portfolio-09',
    preset: 'medium',
    position: [-5.35, -5.85],
    rotationY: -Math.PI / 2,
    artworkId: 'climbing-climbing-portfolio-09',
    artworkSize: 'medium'
  },

  {
    id: 'wall-rear-climbing-workbook-01',
    preset: 'medium',
    position: [-9.3, -12.4],
    rotationY: 0,
    artworkId: 'climbing-climbing-workbook-01',
    artworkSize: 'medium'
  },
  {
    id: 'wall-rear-climbing-workbook-03',
    preset: 'long',
    position: [-3.25, -12.4],
    rotationY: 0,
    artworkId: 'climbing-climbing-workbook-03',
    artworkSize: 'large'
  },

  {
    id: 'wall-right-landscape-01',
    preset: 'medium',
    position: [12.2, 5.6],
    rotationY: -Math.PI / 2,
    artworkId: 'landscape-01',
    artworkSize: 'medium'
  },
  {
    id: 'wall-right-landscape-02',
    preset: 'long',
    position: [12.2, 0],
    rotationY: -Math.PI / 2,
    artworkId: 'landscape-02',
    artworkSize: 'large'
  },
  {
    id: 'wall-right-landscape-03',
    preset: 'long',
    position: [12.2, -5.6],
    rotationY: -Math.PI / 2,
    artworkId: 'landscape-03',
    artworkSize: 'large'
  },

  {
    id: 'wall-right-inner-landscape-portfolio-02',
    preset: 'long',
    position: [5.35, 5.2],
    rotationY: Math.PI / 2,
    artworkId: 'climbing-landscape-portfolio-02',
    artworkSize: 'large'
  },
  {
    id: 'wall-right-inner-landscape-portfolio-06',
    preset: 'long',
    position: [5.35, -0.35],
    rotationY: Math.PI / 2,
    artworkId: 'climbing-landscape-portfolio-06',
    artworkSize: 'large'
  },
  {
    id: 'wall-rear-landscape-workbook-03',
    preset: 'long',
    position: [6.7, -12.4],
    rotationY: 0,
    artworkId: 'landscape-landscape-workbook-03',
    artworkSize: 'large'
  }
];
