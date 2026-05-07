// Shared rules for showing images in the home-page hero carousel.
//
// The hero carousel has two independent choices:
// - Frame style: the shape of the area the photo is allowed to occupy.
// - Fit mode: whether the photo fills that frame by cropping, or fits entirely.
//
// Keeping those concepts separate prevents a common bug where a portrait setting
// accidentally forces every image to crop, or a fit setting still gets trapped
// inside a portrait-sized frame.

import type { GalleryImage } from '../data/images';

export type HeroFrameStyle = 'auto' | 'landscape' | 'portrait' | 'square';
export type ResolvedHeroFrameStyle = Exclude<HeroFrameStyle, 'auto'>;
export type HeroFitMode = 'cover' | 'contain';

const HERO_STAGE_ASPECT_RATIO = 16 / 9;
const PORTRAIT_FRAME_ASPECT_RATIO = 2 / 3;
const SQUARE_FRAME_ASPECT_RATIO = 1;

// Converts unknown JSON values into positive numbers, or null when the value is unusable.
function toPositiveNumber(value: unknown): number | null {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : null;
}

// Finds the best aspect ratio available for an image record.
function getImageAspectRatio(image: GalleryImage): number {
  // Image records created by the editor store the measured aspect ratio. Older
  // records may only have width and height, so those are used as a fallback.
  const explicitAspectRatio = toPositiveNumber(image.imageAspectRatio);

  if (explicitAspectRatio) {
    return explicitAspectRatio;
  }

  const width = toPositiveNumber(image.imageWidth);
  const height = toPositiveNumber(image.imageHeight);

  if (width && height) {
    return width / height;
  }

  // The original carousel was landscape, so this is the least disruptive default
  // for legacy records with no measured dimensions.
  return HERO_STAGE_ASPECT_RATIO;
}

// Infers whether an image should be treated as landscape, portrait, or square.
function getDetectedImageOrientation(image: GalleryImage): ResolvedHeroFrameStyle {
  if (
    image.imageOrientation === 'landscape' ||
    image.imageOrientation === 'portrait' ||
    image.imageOrientation === 'square'
  ) {
    return image.imageOrientation;
  }

  const aspectRatio = getImageAspectRatio(image);

  if (Math.abs(aspectRatio - 1) <= 0.04) {
    return 'square';
  }

  return aspectRatio > 1 ? 'landscape' : 'portrait';
}

// Reads the editor-selected hero frame style and falls back to auto when missing.
export function getSavedHeroFrameStyle(image: GalleryImage): HeroFrameStyle {
  if (
    image.heroFrameStyle === 'landscape' ||
    image.heroFrameStyle === 'portrait' ||
    image.heroFrameStyle === 'square'
  ) {
    return image.heroFrameStyle;
  }

  return 'auto';
}

// Turns auto into a concrete frame style that CSS can render.
export function getResolvedHeroFrameStyle(image: GalleryImage): ResolvedHeroFrameStyle {
  // Auto follows the measured image orientation. Explicit values let the editor
  // force a different visual treatment when that looks better for a specific image.
  const savedFrameStyle = getSavedHeroFrameStyle(image);

  if (savedFrameStyle !== 'auto') {
    return savedFrameStyle;
  }

  return getDetectedImageOrientation(image);
}

// Reads whether the hero should crop the image or fit the entire image.
export function getHeroFitMode(image: GalleryImage): HeroFitMode {
  // Cover means the image may crop. Contain means the entire image must remain
  // visible inside the full 16:9 hero stage.
  if (image.heroFitMode === 'contain') {
    return 'contain';
  }

  return 'cover';
}

// Returns the saved crop position used by cover mode.
export function getHeroImagePosition(image: GalleryImage): string {
  return image.heroPosition ?? '50% 50%';
}

// Builds CSS class names for one rendered hero slide layer.
export function getHeroLayerClassName(image: GalleryImage, extraClassName = ''): string {
  return [
    'home-hero-image-layer',
    `home-hero-image-layer-${getResolvedHeroFrameStyle(image)}`,
    `home-hero-fit-${getHeroFitMode(image)}`,
    extraClassName
  ].filter(Boolean).join(' ');
}

// Calculates the visible hero frame size for the current fit and frame settings.
export function getHeroFrameInlineStyle(image: GalleryImage): string {
  // Fit Entire Image always uses the full 16:9 hero stage. The selected frame
  // style only matters when the image is being cropped in cover mode.
  if (getHeroFitMode(image) === 'contain') {
    return [
      'width: 100% !important',
      'height: 100% !important',
      'max-width: 100% !important',
      'max-height: 100% !important',
      'aspect-ratio: auto !important'
    ].join('; ');
  }

  const frameStyle = getResolvedHeroFrameStyle(image);

  if (frameStyle === 'portrait') {
    return [
      'width: auto !important',
      'height: 100% !important',
      'max-width: 100% !important',
      `aspect-ratio: ${PORTRAIT_FRAME_ASPECT_RATIO} !important`
    ].join('; ');
  }

  if (frameStyle === 'square') {
    return [
      'width: auto !important',
      'height: 100% !important',
      'max-width: 100% !important',
      `aspect-ratio: ${SQUARE_FRAME_ASPECT_RATIO} !important`
    ].join('; ');
  }

  return [
    'width: 100% !important',
    'height: 100% !important',
    'max-width: 100% !important',
    'max-height: 100% !important',
    'aspect-ratio: auto !important'
  ].join('; ');
}

// Calculates image-level object-fit and crop-position styles.
export function getHeroImageInlineStyle(image: GalleryImage): string {
  const fitMode = getHeroFitMode(image);
  const objectFit = fitMode === 'contain' ? 'contain' : 'cover';
  const objectPosition = fitMode === 'contain' ? '50% 50%' : getHeroImagePosition(image);

  return [
    'display: block !important',
    'width: 100% !important',
    'height: 100% !important',
    'max-width: none !important',
    'max-height: none !important',
    `object-fit: ${objectFit} !important`,
    `object-position: ${objectPosition} !important`
  ].join('; ');
}

// Updates an existing hero slide layer after a transition completes.
export function applyHeroFramingToLayer(layerElement: HTMLElement, image: GalleryImage): void {
  // Used by the interaction controller after a transition finishes. Updating all
  // attributes and inline styles together keeps the live DOM synchronized with
  // the saved JSON record.
  const frameElement = layerElement.querySelector<HTMLElement>('[data-hero-image-frame]');
  const imageElement = layerElement.querySelector<HTMLImageElement>('[data-hero-layer-image]');

  layerElement.className = getHeroLayerClassName(image);
  layerElement.dataset.heroFrameStyle = getResolvedHeroFrameStyle(image);
  layerElement.dataset.heroFitMode = getHeroFitMode(image);

  if (frameElement) {
    frameElement.setAttribute('style', getHeroFrameInlineStyle(image));
  }

  if (imageElement) {
    imageElement.src = image.src;
    imageElement.alt = image.alt;
    imageElement.setAttribute('style', getHeroImageInlineStyle(image));
  }
}
