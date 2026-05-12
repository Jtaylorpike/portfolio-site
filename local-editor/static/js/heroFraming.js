// Defines the hero framing rules used by the local image editor.
//
// The public homepage hero is intentionally locked to a 16:9 landscape cover
// frame. The editor should therefore allow hero crop position only. Older image
// records may still contain heroFrameStyle or heroFitMode for compatibility, but
// those values are ignored by the current homepage and editor preview.

const HERO_ASPECT_RATIO = 16 / 9;
const VALID_ORIENTATIONS = new Set(["landscape", "portrait", "square"]);

function toPositiveNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : null;
}

export function getImageAspectRatio(image) {
  const explicitAspectRatio = toPositiveNumber(image?.imageAspectRatio);

  if (explicitAspectRatio) {
    return explicitAspectRatio;
  }

  const width = toPositiveNumber(image?.imageWidth);
  const height = toPositiveNumber(image?.imageHeight);

  if (width && height) {
    return width / height;
  }

  return HERO_ASPECT_RATIO;
}

export function getImageOrientation(image) {
  if (image?.imageOrientation && VALID_ORIENTATIONS.has(image.imageOrientation)) {
    return image.imageOrientation;
  }

  const aspectRatio = getImageAspectRatio(image);

  if (Math.abs(aspectRatio - 1) <= 0.04) {
    return "square";
  }

  return aspectRatio > 1 ? "landscape" : "portrait";
}

export function isHeroEligibleImage(image) {
  return getImageOrientation(image) === "landscape";
}

export function getHeroFrameStyle(_image) {
  return "landscape";
}

export function getResolvedHeroFrameStyle(_image) {
  return "landscape";
}

export function getHeroFitMode(_image) {
  return "cover";
}

export function getHeroFrameInlineStyle(_image) {
  return [
    "width: 100% !important",
    "height: 100% !important",
    "max-width: 100% !important",
    "max-height: 100% !important",
    "aspect-ratio: auto !important"
  ].join("; ");
}

export function getHeroImageInlineStyle(image, position = null) {
  const objectPosition = position ?? image?.heroPosition ?? "50% 50%";

  return [
    "display: block !important",
    "width: 100% !important",
    "height: 100% !important",
    "max-width: none !important",
    "max-height: none !important",
    "object-fit: cover !important",
    `object-position: ${objectPosition} !important`
  ].join("; ");
}
