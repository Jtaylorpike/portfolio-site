// Converts the top-down gallery blueprint into wall and artwork data used by
// the virtual gallery scene.

import { galleryImages } from '../../data/images';
import {
  artworkSizes,
  galleryFloor,
  galleryStart,
  movementBounds,
  wallBlocks,
  wallPresets,
  type WallBlock
} from '../environment/galleryBlueprint';

export { galleryFloor, galleryStart, movementBounds };

export const galleryMovementBounds = movementBounds;

export type GalleryWall = {
  id: string;
  width: number;
  height: number;
  thickness: number;
  position: [number, number, number];
  rotationY: number;
};

export type ResolvedGalleryWall = GalleryWall;

export type GalleryFitMode = 'cover' | 'contain';
export type GalleryFrameStyle = 'auto' | 'landscape' | 'portrait' | 'square';
export type ImageOrientation = 'landscape' | 'portrait' | 'square';

export type GalleryArtwork = {
  id: string;
  title: string;
  category: string;
  year: string;
  location: string;
  note: string;

  image: string;
  previewImage?: string;

  imageWidth?: number;
  imageHeight?: number;
  imageAspectRatio?: number;
  imageOrientation?: ImageOrientation;

  galleryPosition?: string;
  galleryFitMode: GalleryFitMode;
  galleryFrameStyle: GalleryFrameStyle;
  gallerySize: number;

  position: [number, number, number];
  rotationY: number;

  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
};

const imageById = new Map(
  galleryImages.map((image) => {
    return [image.id, image];
  })
);

function getWallPreset(wall: WallBlock) {
  return wallPresets[wall.preset];
}

function getArtworkSize(wall: WallBlock) {
  const preset = getWallPreset(wall);
  const artworkSizeName = wall.artworkSize ?? preset.artworkSize;

  return artworkSizes[artworkSizeName];
}

function getWallPosition(wall: WallBlock): [number, number, number] {
  const preset = getWallPreset(wall);

  return [
    wall.position[0],
    preset.height / 2,
    wall.position[1]
  ];
}

function getArtworkPosition(wall: WallBlock): [number, number, number] {
  const preset = getWallPreset(wall);
  const artworkSize = getArtworkSize(wall);
  const normalX = Math.sin(wall.rotationY);
  const normalZ = Math.cos(wall.rotationY);
  const wallSurfaceOffset = preset.thickness / 2 + 0.018;

  const y = Math.min(
    preset.height * 0.56,
    preset.height - artworkSize.height / 2 - 0.35
  );

  return [
    wall.position[0] + normalX * wallSurfaceOffset,
    y,
    wall.position[1] + normalZ * wallSurfaceOffset
  ];
}

function normalizeFitMode(value: unknown): GalleryFitMode {
  return value === 'contain' ? 'contain' : 'cover';
}

function normalizeFrameStyle(value: unknown): GalleryFrameStyle {
  if (value === 'landscape' || value === 'portrait' || value === 'square') {
    return value;
  }

  return 'auto';
}

function normalizeOrientation(value: unknown): ImageOrientation | undefined {
  if (value === 'landscape' || value === 'portrait' || value === 'square') {
    return value;
  }

  return undefined;
}

function normalizeGallerySize(value: unknown) {
  const size = Number(value);

  if (!Number.isFinite(size) || size <= 0) {
    return 1;
  }

  return Math.min(1.35, Math.max(0.55, size));
}

export const galleryWalls: GalleryWall[] = wallBlocks.map((wall) => {
  const preset = getWallPreset(wall);

  return {
    id: wall.id,
    width: preset.width,
    height: preset.height,
    thickness: preset.thickness,
    position: getWallPosition(wall),
    rotationY: wall.rotationY
  };
});

export const galleryArtworks: GalleryArtwork[] = wallBlocks.flatMap((wall) => {
  if (!wall.artworkId) {
    return [];
  }

  const image = imageById.get(wall.artworkId);

  if (!image) {
    console.warn(`Gallery artwork image not found: ${wall.artworkId}`);
    return [];
  }

  const artworkSize = getArtworkSize(wall);

  return [
    {
      id: image.id,
      title: image.title,
      category: image.category,
      year: image.year,
      location: image.location,
      note: image.note,

      image: image.textureSrc ?? image.src,
      previewImage: image.thumbSrc ?? image.src,

      imageWidth: image.imageWidth,
      imageHeight: image.imageHeight,
      imageAspectRatio: image.imageAspectRatio,
      imageOrientation: normalizeOrientation(image.imageOrientation),

      galleryPosition: image.galleryPosition ?? '50% 50%',
      galleryFitMode: normalizeFitMode(image.galleryFitMode),
      galleryFrameStyle: normalizeFrameStyle(image.galleryFrameStyle),
      gallerySize: normalizeGallerySize(image.gallerySize),

      position: getArtworkPosition(wall),
      rotationY: wall.rotationY,

      width: artworkSize.width,
      height: artworkSize.height,
      maxWidth: artworkSize.width,
      maxHeight: artworkSize.height
    }
  ];
});
