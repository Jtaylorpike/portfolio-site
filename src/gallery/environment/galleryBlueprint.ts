// Top-down layout data for the 3D gallery.
//
// This file defines the floor size, room shell, wall block presets, artwork sizes,
// starting camera position, movement boundaries, placed wall blocks, and light panels.
//
// The current layout is a perimeter-and-wing gallery: a central entry hero,
// a left climbing wing, a right landscape wing, and a rear wall. The intent is
// to show the full active portfolio set without creating a maze or blocking the
// user into narrow movement corridors.
//
// Static architecture remains in this file. Artwork assignment and label behavior
// are read from src/data/galleryCuration.json so the local editor can curate the
// room without rewriting TypeScript.

import galleryCurationJson from '../../data/galleryCuration.json';
import { galleryRoomSettings } from '../../data/galleryRoom';

export type WallPresetName = 'narrow' | 'short' | 'medium' | 'long' | 'hero';

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

export type GalleryRoom = {
  width: number;
  depth: number;
  height: number;
  wallThickness: number;
  ceilingThickness: number;
};

export type GalleryLayoutModule = typeof galleryRoomSettings.layout[number];

export type CeilingLightPanel = {
  id: string;
  position: [number, number];
  width: number;
  depth: number;
  rotationY: number;
  intensity: number;
  distance: number;
};

export type PlaqueSide = 'auto' | 'left' | 'right' | 'none';

export type WallTypeName =
  | 'feature-wall'
  | 'wide-display-wall'
  | 'standard-display-wall'
  | 'compact-display-wall'
  | 'narrow-transition-wall';

export type WallBlock = {
  id: string;
  roomId?: string;
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

  // Future editor-facing display controls.
  // These optional fields let the local editor and eventual server-side editor
  // control gallery visibility, ordering, wall grouping, and artwork label behavior
  // without rewriting the Three.js scene code.
  showInGallery?: boolean;
  placedInGallery?: boolean;
  displayOrder?: number;
  wallType?: WallTypeName;
  plaqueEnabled?: boolean;
  plaqueSide?: PlaqueSide;

  // Optional editor-authored physical placement override. The base wall blocks
  // remain the architectural fallback, while galleryCuration.json can now tune
  // where an existing wall slot sits in the room.
  positionX?: number;
  positionZ?: number;
  rotationYDegrees?: number;
};

export type GalleryCurationRecord = {
  wallId: string;
  roomId?: string;
  artworkId?: string;
  showInGallery?: boolean;
  placedInGallery?: boolean;
  displayOrder?: number;
  wallType?: WallTypeName;
  plaqueEnabled?: boolean;
  plaqueSide?: PlaqueSide;

  // Optional editor-authored physical placement override. The base wall blocks
  // remain the architectural fallback, while galleryCuration.json can now tune
  // where an existing wall slot sits in the room.
  positionX?: number;
  positionZ?: number;
  rotationYDegrees?: number;
};

const validWallTypes: WallTypeName[] = [
  'feature-wall',
  'wide-display-wall',
  'standard-display-wall',
  'compact-display-wall',
  'narrow-transition-wall'
];

const legacyWallTypes: Record<string, WallTypeName> = {
  'entry-feature-wall': 'feature-wall',
  'transition-guide-wall': 'wide-display-wall',
  'outer-gallery-wall': 'wide-display-wall',
  'inner-partition-wall': 'standard-display-wall',
  'rear-gallery-wall': 'wide-display-wall',
  'unassigned-wall': 'narrow-transition-wall'
};

const wallTypeLayout: Record<WallTypeName, { preset: WallPresetName; artworkSize: ArtworkSizeName }> = {
  'feature-wall': { preset: 'hero', artworkSize: 'hero' },
  'wide-display-wall': { preset: 'long', artworkSize: 'large' },
  'standard-display-wall': { preset: 'medium', artworkSize: 'medium' },
  'compact-display-wall': { preset: 'short', artworkSize: 'small' },
  'narrow-transition-wall': { preset: 'narrow', artworkSize: 'small' }
};

function getWallTypeLayout(wallType: WallTypeName | undefined) {
  return wallTypeLayout[wallType ?? 'standard-display-wall'] ?? wallTypeLayout['standard-display-wall'];
}

const validPlaqueSides: PlaqueSide[] = ['auto', 'left', 'right', 'none'];
const galleryGridCellMeters = galleryRoomSettings.grid.cellMeters;

function legacyWallSectionToType(value: unknown): WallTypeName | undefined {
  switch (String(value ?? '').trim()) {
    case 'Entry':
    case 'Personal':
      return 'feature-wall';
    case 'Climbing':
    case 'Landscape':
    case 'Rear Wall':
      return 'wide-display-wall';
    default:
      return undefined;
  }
}

function normalizeWallType(value: unknown, legacyWallSection?: unknown): WallTypeName | undefined {
  const cleanValue = String(value ?? '').trim();

  if (validWallTypes.includes(cleanValue as WallTypeName)) {
    return cleanValue as WallTypeName;
  }

  if (legacyWallTypes[cleanValue]) {
    return legacyWallTypes[cleanValue];
  }

  return legacyWallSectionToType(legacyWallSection);
}

function normalizePlaqueSide(value: unknown): PlaqueSide | undefined {
  return validPlaqueSides.includes(value as PlaqueSide) ? value as PlaqueSide : undefined;
}

function normalizeDisplayOrder(value: unknown): number | undefined {
  const order = Number(value);

  if (!Number.isFinite(order) || order <= 0) {
    return undefined;
  }

  return Math.round(order);
}

function normalizePlacementNumber(value: unknown, min: number, max: number): number | undefined {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return undefined;
  }

  const clamped = Math.min(max, Math.max(min, numberValue));
  const snapped = Math.round(clamped / galleryGridCellMeters) * galleryGridCellMeters;

  return Math.min(max, Math.max(min, Number(snapped.toFixed(2))));
}

function normalizeRotationDegrees(value: unknown): number | undefined {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return undefined;
  }

  const normalized = ((numberValue % 360) + 360) % 360;
  const signed = normalized > 180 ? normalized - 360 : normalized;

  return Number(signed.toFixed(2));
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function normalizeGalleryCurationRecord(value: unknown): GalleryCurationRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const wallId = String(record.wallId ?? '').trim();

  if (!wallId) {
    return null;
  }

  const artworkId = String(record.artworkId ?? '').trim();

  return {
    wallId,
    roomId: String(record.roomId ?? 'room-main').trim() || 'room-main',
    artworkId: artworkId || undefined,
    showInGallery: record.showInGallery === false ? false : true,
    placedInGallery: record.placedInGallery === false ? false : true,
    displayOrder: normalizeDisplayOrder(record.displayOrder),
    wallType: normalizeWallType(record.wallType, record.wallSection),
    plaqueEnabled: record.plaqueEnabled === false ? false : true,
    plaqueSide: normalizePlaqueSide(record.plaqueSide),
    positionX: normalizePlacementNumber(record.positionX, galleryRoomSettings.grid.minX, galleryRoomSettings.grid.maxX),
    positionZ: normalizePlacementNumber(record.positionZ, galleryRoomSettings.grid.minZ, galleryRoomSettings.grid.maxZ),
    rotationYDegrees: normalizeRotationDegrees(record.rotationYDegrees)
  };
}

const normalizedGalleryCuration = (galleryCurationJson as unknown[])
  .map(normalizeGalleryCurationRecord)
  .filter((record): record is GalleryCurationRecord => Boolean(record));

const galleryCurationByWallId = new Map(
  normalizedGalleryCuration.map((record) => [record.wallId, record])
);

function applyGalleryCuration(wall: WallBlock, index: number): WallBlock {
  const curation = galleryCurationByWallId.get(wall.id);

  if (!curation) {
    return wall;
  }

  const wallType = curation.wallType ?? wall.wallType;
  const layout = getWallTypeLayout(wallType);

  const hasPositionOverride = Number.isFinite(curation.positionX) && Number.isFinite(curation.positionZ);
  const hasRotationOverride = Number.isFinite(curation.rotationYDegrees);
  const roomId = curation.roomId ?? 'room-main';
  const roomModule = galleryRoomSettings.layout.find((module) => module.id === roomId && module.kind === 'room');
  const roomCenter = roomModule?.center ?? [0, 0];
  const localPosition = hasPositionOverride
    ? [curation.positionX as number, curation.positionZ as number] as [number, number]
    : wall.position;

  return {
    ...wall,
    roomId,
    preset: layout.preset,
    artworkSize: layout.artworkSize,
    position: [localPosition[0] + roomCenter[0], localPosition[1] + roomCenter[1]],
    rotationY: hasRotationOverride ? degreesToRadians(curation.rotationYDegrees as number) : wall.rotationY,
    artworkId: curation.artworkId || undefined,
    showInGallery: curation.showInGallery,
    placedInGallery: curation.placedInGallery,
    displayOrder: curation.displayOrder ?? wall.displayOrder ?? index + 1,
    wallType,
    plaqueEnabled: curation.plaqueEnabled,
    plaqueSide: curation.plaqueSide ?? wall.plaqueSide
  };
}

function createWallFromGalleryCuration(curation: GalleryCurationRecord, index: number): WallBlock {
  const wallType = curation.wallType ?? 'standard-display-wall';
  const layout = getWallTypeLayout(wallType);
  const roomId = curation.roomId ?? 'room-main';
  const roomModule = galleryRoomSettings.layout.find((module) => module.id === roomId && module.kind === 'room');
  const roomCenter = roomModule?.center ?? [0, 0];

  return {
    id: curation.wallId,
    roomId,
    preset: layout.preset,
    artworkSize: layout.artworkSize,
    position: [
      (curation.positionX ?? 0) + roomCenter[0],
      (curation.positionZ ?? 0) + roomCenter[1]
    ],
    rotationY: degreesToRadians(curation.rotationYDegrees ?? 0),
    artworkId: curation.artworkId || undefined,
    showInGallery: curation.showInGallery,
    placedInGallery: curation.placedInGallery,
    displayOrder: curation.displayOrder ?? index + 1,
    wallType,
    plaqueEnabled: curation.plaqueEnabled,
    plaqueSide: curation.plaqueSide
  };
}

export const galleryFloor = {
  width: galleryRoomSettings.floor.width,
  depth: galleryRoomSettings.floor.depth,
  color: galleryRoomSettings.floor.color
};

export const galleryRoom: GalleryRoom = {
  width: galleryFloor.width,
  depth: galleryFloor.depth,
  height: galleryRoomSettings.shell.height,
  wallThickness: galleryRoomSettings.shell.wallThickness,
  ceilingThickness: galleryRoomSettings.shell.ceilingThickness
};

export const galleryLayoutModules: GalleryLayoutModule[] = galleryRoomSettings.layout;

export const galleryMovementZones = galleryLayoutModules.map((module) => ({
  id: module.id,
  // Adjacent modules meet exactly at their connection threshold. A tiny
  // overlap prevents independently inset zones from creating an invisible
  // collision gap between a room and its hallway.
  minX: module.center[0] - module.width / 2 - 0.02,
  maxX: module.center[0] + module.width / 2 + 0.02,
  minZ: module.center[1] - module.depth / 2 - 0.02,
  maxZ: module.center[1] + module.depth / 2 + 0.02
}));

// Visual ceiling fixtures. These are intentionally data-driven so the local
// editor can eventually expose the same gallery-room controls instead of
// treating lighting as hardcoded scene decoration.
export const ceilingLightPanels: CeilingLightPanel[] = [
  {
    id: 'light-entry-panel',
    position: [0, 8.4],
    width: 1.18,
    depth: 0.72,
    rotationY: 0,
    intensity: 0.18,
    distance: 5.4
  },
  {
    id: 'light-left-wing-front-panel',
    position: [-8.75, 4.2],
    width: 0.92,
    depth: 0.92,
    rotationY: 0,
    intensity: 0.14,
    distance: 4.8
  },
  {
    id: 'light-left-wing-rear-panel',
    position: [-8.75, -4.8],
    width: 0.92,
    depth: 0.92,
    rotationY: 0,
    intensity: 0.14,
    distance: 4.8
  },
  {
    id: 'light-right-wing-front-panel',
    position: [8.75, 4.2],
    width: 0.92,
    depth: 0.92,
    rotationY: 0,
    intensity: 0.14,
    distance: 4.8
  },
  {
    id: 'light-right-wing-rear-panel',
    position: [8.75, -4.8],
    width: 0.92,
    depth: 0.92,
    rotationY: 0,
    intensity: 0.14,
    distance: 4.8
  },
  {
    id: 'light-rear-panel',
    position: [0, -10.8],
    width: 1.18,
    depth: 0.72,
    rotationY: 0,
    intensity: 0.16,
    distance: 5.2
  }
];

export const galleryStart = {
  position: galleryRoomSettings.start.position,
  yaw: galleryRoomSettings.start.yaw
};

export const movementBounds = {
  // Exterior room-shell movement bounds only.
  // Interior gallery wall-block collision is handled separately in
  // movementController.ts with its own wallCollisionRadius.
  //
  // These values now come from src/data/galleryRoom.json so the editor map,
  // room footprint, and runtime movement model can eventually share one
  // architectural source of truth.
  minX: galleryRoomSettings.movementBounds.minX,
  maxX: galleryRoomSettings.movementBounds.maxX,
  minZ: galleryRoomSettings.movementBounds.minZ,
  maxZ: galleryRoomSettings.movementBounds.maxZ
};

// Reusable wall dimensions.
// These presets keep wall placement consistent and easier to edit later.
export const wallPresets: Record<WallPresetName, WallPreset> = {
  narrow: {
    width: 2.15,
    height: 3.15,
    thickness: 0.2,
    artworkSize: 'small'
  },
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
const baseWallBlocks: WallBlock[] = [
  {
    id: 'wall-entry-hero-personal',
    preset: 'hero',
    wallType: 'feature-wall',
    position: [0, 7.2],
    rotationY: 0,
    artworkId: 'personal-01',
    artworkSize: 'hero'
  },

  {
    id: 'wall-entry-left-guide',
    preset: 'narrow',
    wallType: 'narrow-transition-wall',
    position: [-7.4, 9.7],
    rotationY: Math.PI / 2
  },
  {
    id: 'wall-entry-right-guide',
    preset: 'narrow',
    wallType: 'narrow-transition-wall',
    position: [7.4, 9.7],
    rotationY: -Math.PI / 2
  },

  {
    id: 'wall-left-climbing-01',
    preset: 'long',
    wallType: 'wide-display-wall',
    position: [-12.2, 5.6],
    rotationY: Math.PI / 2,
    artworkId: 'climbing-01',
    artworkSize: 'large'
  },
  {
    id: 'wall-left-climbing-02',
    preset: 'medium',
    wallType: 'standard-display-wall',
    position: [-12.2, 0],
    rotationY: Math.PI / 2,
    artworkId: 'climbing-02',
    artworkSize: 'medium'
  },
  {
    id: 'wall-left-climbing-03',
    preset: 'medium',
    wallType: 'standard-display-wall',
    position: [-12.2, -5.6],
    rotationY: Math.PI / 2,
    artworkId: 'climbing-03',
    artworkSize: 'medium'
  },

  {
    id: 'wall-left-inner-workbook-05',
    preset: 'long',
    wallType: 'wide-display-wall',
    position: [-5.35, 5.2],
    rotationY: -Math.PI / 2,
    artworkId: 'climbing-climbing-workbook-05',
    artworkSize: 'large'
  },
  {
    id: 'wall-left-inner-portfolio-08',
    preset: 'medium',
    wallType: 'standard-display-wall',
    position: [-5.35, -0.35],
    rotationY: -Math.PI / 2,
    artworkId: 'climbing-climbing-portfolio-08',
    artworkSize: 'medium'
  },
  {
    id: 'wall-left-inner-portfolio-09',
    preset: 'medium',
    wallType: 'standard-display-wall',
    position: [-5.35, -5.85],
    rotationY: -Math.PI / 2,
    artworkId: 'climbing-climbing-portfolio-09',
    artworkSize: 'medium'
  },

  {
    id: 'wall-rear-climbing-workbook-01',
    preset: 'medium',
    wallType: 'standard-display-wall',
    position: [-9.3, -12.4],
    rotationY: 0,
    artworkId: 'climbing-climbing-workbook-01',
    artworkSize: 'medium'
  },
  {
    id: 'wall-rear-climbing-workbook-03',
    preset: 'long',
    wallType: 'wide-display-wall',
    position: [-3.25, -12.4],
    rotationY: 0,
    artworkId: 'climbing-climbing-workbook-03',
    artworkSize: 'large'
  },

  {
    id: 'wall-right-landscape-01',
    preset: 'medium',
    wallType: 'standard-display-wall',
    position: [12.2, 5.6],
    rotationY: -Math.PI / 2,
    artworkId: 'landscape-01',
    artworkSize: 'medium'
  },
  {
    id: 'wall-right-landscape-02',
    preset: 'long',
    wallType: 'wide-display-wall',
    position: [12.2, 0],
    rotationY: -Math.PI / 2,
    artworkId: 'landscape-02',
    artworkSize: 'large'
  },
  {
    id: 'wall-right-landscape-03',
    preset: 'long',
    wallType: 'wide-display-wall',
    position: [12.2, -5.6],
    rotationY: -Math.PI / 2,
    artworkId: 'landscape-03',
    artworkSize: 'large'
  },

  {
    id: 'wall-right-inner-landscape-portfolio-02',
    preset: 'long',
    wallType: 'wide-display-wall',
    position: [5.35, 5.2],
    rotationY: Math.PI / 2,
    artworkId: 'landscape-201019-jtp6059',
    artworkSize: 'large'
  },
  {
    id: 'wall-right-inner-landscape-portfolio-06',
    preset: 'long',
    wallType: 'wide-display-wall',
    position: [5.35, -0.35],
    rotationY: Math.PI / 2,
    artworkId: 'climbing-landscape-portfolio-06',
    artworkSize: 'large'
  },
  {
    id: 'wall-rear-landscape-workbook-03',
    preset: 'long',
    wallType: 'wide-display-wall',
    position: [6.7, -12.4],
    rotationY: 0,
    artworkId: 'landscape-landscape-workbook-03',
    artworkSize: 'large'
  }
];

const baseWallIds = new Set(baseWallBlocks.map((wall) => wall.id));

function buildWallBlocks(): WallBlock[] {
  // Once galleryCuration.json exists, it becomes the wall-entity source of truth.
  // This lets the editor add/remove custom wall cards without resurrecting static
  // fallback wall slots from the original TypeScript layout. If the curation file
  // is empty or missing, keep the original authored room as a safety fallback.
  if (!normalizedGalleryCuration.length) {
    return baseWallBlocks;
  }

  const curatedBaseWalls = baseWallBlocks
    .filter((wall) => galleryCurationByWallId.has(wall.id))
    .map(applyGalleryCuration);
  const customWalls = normalizedGalleryCuration
    .filter((record) => !baseWallIds.has(record.wallId))
    .map(createWallFromGalleryCuration);

  return [...curatedBaseWalls, ...customWalls].sort((first, second) => {
    return (first.displayOrder ?? 9999) - (second.displayOrder ?? 9999);
  });
}

export const wallBlocks: WallBlock[] = buildWallBlocks();
