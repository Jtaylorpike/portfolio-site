// Top-down layout data for the 3D gallery.
//
// This file defines the floor size, wall block presets, artwork sizes,
// starting camera position, movement boundaries, and placed wall blocks.
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
  width: 30,
  depth: 30,
  color: 0x6f7b82
};

export const galleryStart = {
  position: [0, 1.65, 12] as [number, number, number],
  yaw: 0
};

export const movementBounds = {
  minX: -13.2,
  maxX: 13.2,
  minZ: -13.2,
  maxZ: 13.2
};

// Reusable wall dimensions.
// These presets keep wall placement consistent and easier to edit later.
export const wallPresets: Record<WallPresetName, WallPreset> = {
  short: {
    width: 2.6,
    height: 3.25,
    thickness: 0.22,
    artworkSize: 'small'
  },
  medium: {
    width: 3.4,
    height: 3.25,
    thickness: 0.22,
    artworkSize: 'medium'
  },
  long: {
    width: 4.8,
    height: 3.25,
    thickness: 0.22,
    artworkSize: 'large'
  },
  hero: {
    width: 6,
    height: 3.55,
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
    height: 1.45
  },
  large: {
    width: 3.2,
    height: 1.95
  },
  hero: {
    width: 4.25,
    height: 2.45
  }
};

// Placed wall blocks for the current gallery layout.
// This pass creates a clearer loop around a center hero wall with left,
// right, and rear zones.
export const wallBlocks: WallBlock[] = [
  {
    id: 'wall-entry-hero',
    preset: 'hero',
    position: [0, 6.3],
    rotationY: 0,
    artworkId: 'personal-01',
    artworkSize: 'hero'
  },

  {
    id: 'wall-entry-left-guide',
    preset: 'long',
    position: [-6.4, 8.4],
    rotationY: Math.PI / 2
  },
  {
    id: 'wall-entry-right-guide',
    preset: 'long',
    position: [6.4, 8.4],
    rotationY: -Math.PI / 2
  },

  {
    id: 'wall-left-climbing-front',
    preset: 'long',
    position: [-10.4, 4.8],
    rotationY: Math.PI / 2,
    artworkId: 'climbing-01',
    artworkSize: 'large'
  },
  {
    id: 'wall-left-climbing-middle',
    preset: 'medium',
    position: [-10.4, -0.7],
    rotationY: Math.PI / 2,
    artworkId: 'climbing-02',
    artworkSize: 'medium'
  },
  {
    id: 'wall-left-climbing-back',
    preset: 'medium',
    position: [-10.4, -5.6],
    rotationY: Math.PI / 2,
    artworkId: 'climbing-03',
    artworkSize: 'medium'
  },

  {
    id: 'wall-right-landscape-front',
    preset: 'long',
    position: [10.4, 4.8],
    rotationY: -Math.PI / 2,
    artworkId: 'landscape-01',
    artworkSize: 'large'
  },
  {
    id: 'wall-right-landscape-middle',
    preset: 'medium',
    position: [10.4, -0.7],
    rotationY: -Math.PI / 2,
    artworkId: 'landscape-02',
    artworkSize: 'medium'
  },
  {
    id: 'wall-right-landscape-back',
    preset: 'medium',
    position: [10.4, -5.6],
    rotationY: -Math.PI / 2,
    artworkId: 'landscape-03',
    artworkSize: 'medium'
  },

  {
    id: 'wall-center-left-branch',
    preset: 'long',
    position: [-3.9, -1.4],
    rotationY: Math.PI / 2
  },
  {
    id: 'wall-center-right-branch',
    preset: 'long',
    position: [3.9, -1.4],
    rotationY: -Math.PI / 2
  },

  {
    id: 'wall-rear-left-return',
    preset: 'long',
    position: [-4.2, -10.1],
    rotationY: 0
  },
  {
    id: 'wall-rear-right-return',
    preset: 'long',
    position: [4.2, -10.1],
    rotationY: 0
  },

  {
    id: 'wall-rear-center-divider',
    preset: 'short',
    position: [0, -6.6],
    rotationY: Math.PI
  }
];