// Shared rules for showing images in the home-page hero carousel.
//
// The public hero now uses a fixed editorial landscape frame. Hero images always
// render as 16:9 cover/crop compositions so the page does not shift between
// portrait, square, and landscape layouts. The editor may still store older
// heroFrameStyle/heroFitMode values on image records for backward compatibility,
// but the homepage intentionally ignores those values. The only hero-specific
// visual control that should remain editable is heroPosition/object-position.

import type { GalleryImage } from '../data/images';

export type HeroFrameStyle = 'auto' | 'landscape' | 'portrait' | 'square';
export type ResolvedHeroFrameStyle = Exclude<HeroFrameStyle, 'auto'>;
export type HeroFitMode = 'cover' | 'contain';

const HERO_STAGE_ASPECT_RATIO = 16 / 9;

function toPositiveNumber(value: unknown): number | null {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : null;
}

export function getImageAspectRatio(image: GalleryImage): number {
  const explicitAspectRatio = toPositiveNumber(image.imageAspectRatio);

  if (explicitAspectRatio) {
    return explicitAspectRatio;
  }

  const width = toPositiveNumber(image.imageWidth);
  const height = toPositiveNumber(image.imageHeight);

  if (width && height) {
    return width / height;
  }

  return HERO_STAGE_ASPECT_RATIO;
}

export function getImageOrientation(image: GalleryImage): ResolvedHeroFrameStyle {
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

export function isHeroEligibleImage(image: GalleryImage): boolean {
  return getImageOrientation(image) === 'landscape';
}


// The homepage hero is locked to a landscape editorial frame.
export function getResolvedHeroFrameStyle(_image: GalleryImage): ResolvedHeroFrameStyle {
  return 'landscape';
}

// The homepage hero always crops to the locked 16:9 frame.
export function getHeroFitMode(_image: GalleryImage): HeroFitMode {
  return 'cover';
}

// Returns the saved crop position used by the locked cover frame.
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

// The visible frame always fills the 16:9 hero shell.
export function getHeroFrameInlineStyle(_image: GalleryImage): string {
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
  return [
    'display: block !important',
    'width: 100% !important',
    'height: 100% !important',
    'max-width: none !important',
    'max-height: none !important',
    'object-fit: cover !important',
    `object-position: ${getHeroImagePosition(image)} !important`,
    `transform-origin: ${getHeroImagePosition(image)} !important`,
    `scale: ${Math.max(1, Number(image.heroScale ?? 1))} !important`
  ].join('; ');
}

// Uses the lighter thumb rendition for small mobile hero frames while preserving
// the display rendition for tablet/desktop. This keeps the phone LCP candidate
// from loading the full desktop display rendition when the hero is only a few
// hundred CSS pixels wide.
export function getHeroMobileSource(image: GalleryImage): string | null {
  return image.thumbSrc && image.thumbSrc !== image.src ? image.thumbSrc : null;
}

export function getHeroImageWidth(image: GalleryImage): number | null {
  return toPositiveNumber(image.imageWidth);
}

export function getHeroImageHeight(image: GalleryImage): number | null {
  return toPositiveNumber(image.imageHeight);
}

// The outer hero shell is fixed so carousel changes never resize the stage.
export function getHeroShellAspectRatio(_image: GalleryImage): number {
  return HERO_STAGE_ASPECT_RATIO;
}

// Builds the CSS variable that sizes the outer hero stage for one slide.
export function getHeroShellInlineStyle(image: GalleryImage): string {
  return `--hero-display-aspect: ${getHeroShellAspectRatio(image).toFixed(5)}`;
}

// Updates the outer hero stage when the active slide changes.
export function applyHeroShellSizingToSlideshow(slideshow: HTMLElement, image: GalleryImage): void {
  const imageShell = slideshow.querySelector<HTMLElement>('[data-hero-image-shell]');

  if (!imageShell) {
    return;
  }

  imageShell.setAttribute('style', getHeroShellInlineStyle(image));
}

// Updates an existing hero slide layer after a slide change.
export function applyHeroFramingToLayer(layerElement: HTMLElement, image: GalleryImage): void {
  const frameElement = layerElement.querySelector<HTMLElement>('[data-hero-image-frame]');
  const mobileSourceElement = layerElement.querySelector<HTMLSourceElement>('[data-hero-mobile-source]');
  const imageElement = layerElement.querySelector<HTMLImageElement>('[data-hero-layer-image]');
  const mobileSource = getHeroMobileSource(image);
  const imageWidth = getHeroImageWidth(image);
  const imageHeight = getHeroImageHeight(image);

  layerElement.className = getHeroLayerClassName(image);
  layerElement.dataset.heroFrameStyle = getResolvedHeroFrameStyle(image);
  layerElement.dataset.heroFitMode = getHeroFitMode(image);

  if (frameElement) {
    frameElement.setAttribute('style', getHeroFrameInlineStyle(image));
  }

  if (mobileSourceElement) {
    if (mobileSource) {
      mobileSourceElement.srcset = mobileSource;
    } else {
      mobileSourceElement.removeAttribute('srcset');
    }
  }

  if (imageElement) {
    imageElement.src = image.src;
    imageElement.alt = image.alt;
    imageElement.setAttribute('style', getHeroImageInlineStyle(image));

    if (imageWidth) {
      imageElement.width = imageWidth;
    } else {
      imageElement.removeAttribute('width');
    }

    if (imageHeight) {
      imageElement.height = imageHeight;
    } else {
      imageElement.removeAttribute('height');
    }
  }
}
