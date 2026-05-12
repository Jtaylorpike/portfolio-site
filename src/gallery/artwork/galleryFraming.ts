// Shared virtual gallery framing rules.
//
// The 3D gallery and the local editor both need to answer the same questions:
// - what shape should this artwork frame be?
// - how large can it be on the wall?
// - should the image cover/crop the frame or fit entirely inside it?
//
// Keeping those rules in one small module reduces the chance that the editor
// preview says one thing while the Three.js gallery renders something else.

import type { GalleryFitMode, GalleryFrameStyle, ImageOrientation } from './galleryLayout';

export type GalleryFrameShape = 'landscape' | 'portrait' | 'square';

export type GalleryFrameDimensions = {
  width: number;
  height: number;
};

export type GalleryTextureTransform = {
  repeatX: number;
  repeatY: number;
  offsetX: number;
  offsetY: number;
};

export type GalleryFramingInput = {
  imageAspect: number;
  imageOrientation?: ImageOrientation;
  fitMode: GalleryFitMode;
  frameStyle: GalleryFrameStyle;
  requestedSize?: number;
  maxWidth: number;
  maxHeight: number;
};

export const GALLERY_PORTRAIT_FRAME_ASPECT = 2 / 3;
export const GALLERY_SQUARE_FRAME_ASPECT = 1;

// These values describe scale relative to the wall block's normal artwork size.
// Portrait images get a larger default because the maximum tested portrait size better matches
// the visual weight of landscape pieces on the same wall.
export const GALLERY_DEFAULT_SIZE_BY_SHAPE: Record<GalleryFrameShape, number> = {
  landscape: 0.92,
  portrait: 1.32,
  square: 1.08
};

// These caps prevent a single artwork from growing beyond the safe wall area.
// The values are intentionally conservative because the gallery uses physical
// walls and player movement, not an unlimited scroll page.
export const GALLERY_MAX_SIZE_BY_SHAPE: Record<GalleryFrameShape, number> = {
  landscape: 0.92,
  portrait: 1.32,
  square: 1.16
};

export const GALLERY_MIN_SIZE = 0.55;

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getImageOrientationFromAspect(imageAspect: number): ImageOrientation {
  if (Math.abs(imageAspect - 1) <= 0.04) {
    return 'square';
  }

  return imageAspect > 1 ? 'landscape' : 'portrait';
}

export function resolveGalleryFrameShape(
  frameStyle: GalleryFrameStyle,
  imageAspect: number,
  imageOrientation?: ImageOrientation
): GalleryFrameShape {
  if (frameStyle === 'landscape' || frameStyle === 'portrait' || frameStyle === 'square') {
    return frameStyle;
  }

  const orientation = imageOrientation ?? getImageOrientationFromAspect(imageAspect);

  if (orientation === 'portrait' || orientation === 'square') {
    return orientation;
  }

  return 'landscape';
}

export function getGallerySizeLimit(shape: GalleryFrameShape) {
  return GALLERY_MAX_SIZE_BY_SHAPE[shape];
}

export function getGalleryDefaultSize(shape: GalleryFrameShape) {
  return GALLERY_DEFAULT_SIZE_BY_SHAPE[shape];
}

export function resolveGallerySize(requestedSize: unknown, shape: GalleryFrameShape) {
  const numericSize = Number(requestedSize);
  const defaultSize = getGalleryDefaultSize(shape);
  const maxSize = getGallerySizeLimit(shape);

  if (!Number.isFinite(numericSize) || numericSize <= 0) {
    return defaultSize;
  }

  return clampNumber(numericSize, GALLERY_MIN_SIZE, maxSize);
}

export function getGalleryCoverFrameAspect(shape: GalleryFrameShape, wallArtworkAspect: number) {
  if (shape === 'portrait') {
    return GALLERY_PORTRAIT_FRAME_ASPECT;
  }

  if (shape === 'square') {
    return GALLERY_SQUARE_FRAME_ASPECT;
  }

  return wallArtworkAspect;
}

export function fitAspectInsideMax(
  aspect: number,
  maxWidth: number,
  maxHeight: number
): GalleryFrameDimensions {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : maxWidth / maxHeight;
  let width = maxWidth;
  let height = width / safeAspect;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * safeAspect;
  }

  return {
    width,
    height
  };
}

export function resolveGalleryFrameDimensions(input: GalleryFramingInput): GalleryFrameDimensions {
  const wallArtworkAspect = input.maxWidth / input.maxHeight;
  const shape = resolveGalleryFrameShape(
    input.frameStyle,
    input.imageAspect,
    input.imageOrientation
  );
  const size = resolveGallerySize(input.requestedSize, shape);
  const maxWidth = input.maxWidth * size;
  const maxHeight = input.maxHeight * size;

  if (input.fitMode === 'contain') {
    return fitAspectInsideMax(input.imageAspect, maxWidth, maxHeight);
  }

  return fitAspectInsideMax(
    getGalleryCoverFrameAspect(shape, wallArtworkAspect),
    maxWidth,
    maxHeight
  );
}

export function parseGalleryObjectPosition(position: string | undefined) {
  const match = position?.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);

  if (!match) {
    return {
      x: 50,
      y: 50
    };
  }

  return {
    x: clampNumber(Number(match[1]), 0, 100),
    y: clampNumber(Number(match[2]), 0, 100)
  };
}

export function getCoverTextureTransform(
  imageAspect: number,
  frameAspect: number,
  position: string | undefined
): GalleryTextureTransform {
  const parsedPosition = parseGalleryObjectPosition(position);
  let repeatX = 1;
  let repeatY = 1;
  let offsetX = 0;
  let offsetY = 0;

  // Wider source images are cropped on the left and right edges.
  if (imageAspect > frameAspect) {
    repeatX = frameAspect / imageAspect;
    offsetX = (1 - repeatX) * (parsedPosition.x / 100);
  }

  // Taller source images are cropped on the top and bottom edges. The Y value is
  // inverted because Three.js texture coordinates start at the bottom edge.
  if (imageAspect < frameAspect) {
    repeatY = imageAspect / frameAspect;
    offsetY = (1 - repeatY) * (1 - parsedPosition.y / 100);
  }

  return {
    repeatX,
    repeatY,
    offsetX,
    offsetY
  };
}
