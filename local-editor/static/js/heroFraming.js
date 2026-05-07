// Defines the hero framing rules used by the local image editor.
//
// This file mirrors src/app/heroFraming.ts for the browser-based editor. The editor
// is plain JavaScript, while the public site is TypeScript, so the same rules are
// duplicated in the two formats. The important behavior is the same in both places:
// frame style chooses the crop shape, and fit mode chooses crop versus full-image fit.

const VALID_FRAME_STYLES = new Set(["auto", "landscape", "portrait", "square"]);
const VALID_RESOLVED_FRAME_STYLES = new Set(["landscape", "portrait", "square"]);
const VALID_FIT_MODES = new Set(["cover", "contain"]);

// Converts JSON values into usable positive numbers for layout calculations.
function toPositiveNumber(value) {
  // JSON values may arrive as strings or numbers. This normalizes either form.
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : null;
}

// Finds the best aspect ratio available for an editor image record.
export function getImageAspectRatio(image) {
  // Prefer the explicit aspect ratio when available, and fall back to width/height.
  const explicitAspectRatio = toPositiveNumber(image?.imageAspectRatio);

  if (explicitAspectRatio) {
    return explicitAspectRatio;
  }

  const width = toPositiveNumber(image?.imageWidth);
  const height = toPositiveNumber(image?.imageHeight);

  if (width && height) {
    return width / height;
  }

  return 16 / 9;
}

// Determines the image orientation when the saved record does not specify it.
export function getImageOrientation(image) {
  // The saved orientation is trusted only when it matches a supported option.
  if (image?.imageOrientation && VALID_RESOLVED_FRAME_STYLES.has(image.imageOrientation)) {
    return image.imageOrientation;
  }

  const aspectRatio = getImageAspectRatio(image);

  if (Math.abs(aspectRatio - 1) <= 0.04) {
    return "square";
  }

  return aspectRatio > 1 ? "landscape" : "portrait";
}

// Reads the selected hero frame style and falls back to auto.
export function getHeroFrameStyle(image) {
  // Auto lets the editor derive the frame from the image orientation.
  const frameStyle = image?.heroFrameStyle;

  if (frameStyle && VALID_FRAME_STYLES.has(frameStyle)) {
    return frameStyle;
  }

  return "auto";
}

// Turns auto into a concrete frame style for the preview.
export function getResolvedHeroFrameStyle(image) {
  // The CSS needs a concrete frame style, never auto.
  const frameStyle = getHeroFrameStyle(image);

  if (frameStyle !== "auto") {
    return frameStyle;
  }

  return getImageOrientation(image);
}

// Reads whether the editor should crop the image or fit the whole image.
export function getHeroFitMode(image) {
  // Cover crops to the selected frame. Contain fits the complete image into the full hero stage.
  const fitMode = image?.heroFitMode;

  if (fitMode && VALID_FIT_MODES.has(fitMode)) {
    return fitMode;
  }

  return "cover";
}

// Returns the values needed to render a hero preview consistently.
export function getHeroLayout(image) {
  // A shared layout object keeps the crop preview and save logic simple.
  return {
    frameStyle: getResolvedHeroFrameStyle(image),
    fitMode: getHeroFitMode(image),
    objectPosition: image?.heroPosition || "50% 50%"
  };
}
