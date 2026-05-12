// Shared import validation rules for the local editor.
// These rules keep the browser review step aligned with the backend image pipeline.

export const VALID_IMPORT_FIT_MODES = new Set(["cover", "contain"]);
export const VALID_IMPORT_FRAME_STYLES = new Set(["auto", "landscape", "portrait", "square"]);
export const VALID_IMPORT_ORIENTATIONS = new Set(["landscape", "portrait", "square"]);
export const IMAGE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeImportFitMode(value) {
  return value === "contain" ? "contain" : "cover";
}

export function normalizeImportFrameStyle(value) {
  return VALID_IMPORT_FRAME_STYLES.has(value) ? value : "auto";
}

export function normalizeImportHeroFrameStyle(value) {
  return VALID_IMPORT_FRAME_STYLES.has(value) ? value : "landscape";
}

export function inferImageOrientation(width, height, fallback = "landscape") {
  const numericWidth = Number(width);
  const numericHeight = Number(height);

  if (!Number.isFinite(numericWidth) || !Number.isFinite(numericHeight) || numericWidth <= 0 || numericHeight <= 0) {
    return fallback;
  }

  const aspectRatio = numericWidth / numericHeight;

  if (Math.abs(aspectRatio - 1) <= 0.04) {
    return "square";
  }

  return aspectRatio > 1 ? "landscape" : "portrait";
}

export function getImportGalleryDefaultSize(orientation) {
  if (orientation === "portrait") {
    return "1.32";
  }

  if (orientation === "square") {
    return "1.08";
  }

  return "1";
}

export function getImportOutputPaths(imageId) {
  const safeId = String(imageId || "image-id").trim() || "image-id";

  return {
    display: `/images/portfolio/display/${safeId}.webp`,
    thumb: `/images/portfolio/thumb/${safeId}.webp`,
    texture: `/images/portfolio/texture/${safeId}.webp`,
    full: `/images/portfolio/full/${safeId}.webp`
  };
}

function addIndexedMessage(messages, index, message) {
  messages.push({
    index,
    message
  });
}

export function validateImportRecords(records, existingImages = []) {
  const errors = [];
  const warnings = [];
  const existingIds = new Set(existingImages.map((image) => image.id).filter(Boolean));
  const seenIds = new Set();

  records.forEach((record, index) => {
    const label = record.title || record.id || `Import ${index + 1}`;

    if (!record.id) {
      addIndexedMessage(errors, index, `${label}: ID is required.`);
    }
    else if (!IMAGE_ID_PATTERN.test(record.id)) {
      addIndexedMessage(errors, index, `${label}: ID must use lowercase letters, numbers, and hyphens only.`);
    }
    else if (seenIds.has(record.id)) {
      addIndexedMessage(errors, index, `${label}: ID is duplicated in this import review.`);
    }
    else if (existingIds.has(record.id)) {
      addIndexedMessage(errors, index, `${label}: ID already exists in galleryImages.json.`);
    }

    if (record.id) {
      seenIds.add(record.id);
    }

    if (!record.title) {
      addIndexedMessage(errors, index, `${label}: title is required.`);
    }

    if (!record.alt) {
      addIndexedMessage(errors, index, `${label}: alt text is required.`);
    }

    if (!VALID_IMPORT_FIT_MODES.has(record.heroFitMode)) {
      addIndexedMessage(errors, index, `${label}: hero fit mode must be cover or contain.`);
    }

    if (!VALID_IMPORT_FIT_MODES.has(record.galleryFitMode)) {
      addIndexedMessage(errors, index, `${label}: gallery fit mode must be cover or contain.`);
    }

    if (!VALID_IMPORT_FRAME_STYLES.has(record.heroFrameStyle)) {
      addIndexedMessage(errors, index, `${label}: hero frame style is invalid.`);
    }

    if (!VALID_IMPORT_FRAME_STYLES.has(record.galleryFrameStyle)) {
      addIndexedMessage(errors, index, `${label}: gallery frame style is invalid.`);
    }

    if (record.imageOrientation && !VALID_IMPORT_ORIENTATIONS.has(record.imageOrientation)) {
      addIndexedMessage(errors, index, `${label}: detected orientation is invalid.`);
    }

    if (record.imageOrientation && record.imageOrientation !== "landscape") {
      addIndexedMessage(warnings, index, `${label}: ${record.imageOrientation} images will import normally but cannot be added to the homepage hero.`);
    }
  });

  return {
    errors,
    warnings,
    isValid: errors.length === 0
  };
}
