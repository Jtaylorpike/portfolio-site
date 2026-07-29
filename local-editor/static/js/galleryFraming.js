// Shared virtual gallery framing rules for the local editor.
//
// This file mirrors src/gallery/artwork/galleryFraming.ts. The public Three.js
// gallery cannot import editor JavaScript directly, so the editor keeps a small
// browser-friendly copy of the same framing rules for crop previews and controls.

export const GALLERY_PORTRAIT_FRAME_ASPECT = 2 / 3;
export const GALLERY_SQUARE_FRAME_ASPECT = 1;

export const GALLERY_DEFAULT_SIZE_BY_SHAPE = {
  landscape: 1,
  portrait: 1.32,
  square: 1.08
};

export const GALLERY_MAX_SIZE_BY_SHAPE = {
  landscape: 1,
  portrait: 1.32,
  square: 1.16
};

export const GALLERY_MIN_SIZE = 0.55;

export function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getImageOrientationFromAspect(imageAspect) {
  if (Math.abs(imageAspect - 1) <= 0.04) {
    return "square";
  }

  return imageAspect > 1 ? "landscape" : "portrait";
}

export function resolveGalleryFrameShape(frameStyle, imageAspect, imageOrientation) {
  if (["landscape", "portrait", "square"].includes(frameStyle)) {
    return frameStyle;
  }

  const orientation = imageOrientation || getImageOrientationFromAspect(imageAspect);

  if (orientation === "portrait" || orientation === "square") {
    return orientation;
  }

  return "landscape";
}

export function getGallerySizeLimit(shape) {
  return GALLERY_MAX_SIZE_BY_SHAPE[shape] ?? GALLERY_MAX_SIZE_BY_SHAPE.landscape;
}

export function getGalleryDefaultSize(shape) {
  return GALLERY_DEFAULT_SIZE_BY_SHAPE[shape] ?? GALLERY_DEFAULT_SIZE_BY_SHAPE.landscape;
}

export function resolveGallerySize(requestedSize, shape) {
  const numericSize = Number(requestedSize);
  const defaultSize = getGalleryDefaultSize(shape);
  const maxSize = getGallerySizeLimit(shape);

  if (!Number.isFinite(numericSize) || numericSize <= 0) {
    return defaultSize;
  }

  return clampNumber(numericSize, GALLERY_MIN_SIZE, maxSize);
}

export function getGalleryCoverFrameAspect(shape, wallArtworkAspect = 1.6) {
  if (shape === "portrait") {
    return GALLERY_PORTRAIT_FRAME_ASPECT;
  }

  if (shape === "square") {
    return GALLERY_SQUARE_FRAME_ASPECT;
  }

  return wallArtworkAspect;
}

export function fitAspectInsideMax(aspect, maxWidth, maxHeight) {
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

export function resolveGalleryFrameDimensions(input) {
  const wallArtworkAspect = input.maxWidth / input.maxHeight;
  const shape = resolveGalleryFrameShape(
    input.frameStyle,
    input.imageAspect,
    input.imageOrientation
  );
  const size = resolveGallerySize(input.requestedSize, shape);
  const maxWidth = input.maxWidth * size;
  const maxHeight = input.maxHeight * size;

  const dimensions = input.fitMode === "contain"
    ? fitAspectInsideMax(input.imageAspect, maxWidth, maxHeight)
    : fitAspectInsideMax(
      getGalleryCoverFrameAspect(shape, wallArtworkAspect),
      maxWidth,
      maxHeight
    );

  if (
    !Number.isFinite(input.wallWidth)
    || !Number.isFinite(input.wallHeight)
    || !Number.isFinite(input.artworkCenterY)
  ) {
    return dimensions;
  }

  const frameBorder = Math.max(0, Number(input.frameBorder) || 0);
  const wallMargin = Math.max(0.08, Number(input.wallMargin) || 0.24);
  const safeHalfHeight = Math.max(
    0.1,
    Math.min(
      Number(input.artworkCenterY) - wallMargin,
      Number(input.wallHeight) - Number(input.artworkCenterY) - wallMargin
    )
  );
  const physicalMaxWidth = Math.max(0.2, Number(input.wallWidth) - wallMargin * 2 - frameBorder);
  const physicalMaxHeight = Math.max(0.2, safeHalfHeight * 2 - frameBorder);

  return fitAspectInsideMax(
    dimensions.width / dimensions.height,
    Math.min(dimensions.width, physicalMaxWidth),
    Math.min(dimensions.height, physicalMaxHeight)
  );
}

export function getGalleryPreviewAspect(input) {
  const dimensions = resolveGalleryFrameDimensions(input);

  return dimensions.width / dimensions.height;
}
