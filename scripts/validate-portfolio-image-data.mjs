#!/usr/bin/env node

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

function readFlag(name) {
  return args.includes(name);
}

function readOption(name, fallback = '') {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }

  return args[index + 1];
}

const projectRoot = path.resolve(readOption('--project-root', '.'));
const warningsAsErrors = readFlag('--warnings-as-errors');

const reportDir = path.join(projectRoot, 'asset-reports');
const galleryJsonPath = path.join(projectRoot, 'src', 'data', 'galleryImages.json');
const categoriesJsonPath = path.join(projectRoot, 'src', 'data', 'categories.json');
const heroSlidesJsonPath = path.join(projectRoot, 'src', 'data', 'heroSlides.json');
const galleryCurationJsonPath = path.join(projectRoot, 'src', 'data', 'galleryCuration.json');
const galleryRoomJsonPath = path.join(projectRoot, 'src', 'data', 'galleryRoom.json');

const expectedRenditionPrefixes = {
  src: '/images/portfolio/display/',
  thumbSrc: '/images/portfolio/thumb/',
  textureSrc: '/images/portfolio/texture/',
  fullSrc: '/images/portfolio/full/'
};

const requiredStringFields = [
  'id',
  'title',
  'category',
  'src',
  'thumbSrc',
  'textureSrc',
  'fullSrc',
  'alt'
];

const validWallTypes = new Set([
  'feature-wall',
  'wide-display-wall',
  'standard-display-wall',
  'compact-display-wall',
  'narrow-transition-wall'
]);

const validPlaqueSides = new Set(['auto', 'left', 'right', 'none']);
const validWallRotationDegrees = new Set([-180, -135, -90, -45, 0, 45, 90, 135, 180]);
let galleryPlacementMin = -16;
let galleryPlacementMax = 16;
let galleryPlacementMinZ = -16;
let galleryPlacementMaxZ = 16;
let galleryGridCellMeters = 0.5;
const galleryWallFootprints = {
  'feature-wall': { lengthCells: 13, thicknessCells: 1 },
  'wide-display-wall': { lengthCells: 11, thicknessCells: 1 },
  'standard-display-wall': { lengthCells: 7, thicknessCells: 1 },
  'compact-display-wall': { lengthCells: 5, thicknessCells: 1 },
  'narrow-transition-wall': { lengthCells: 3, thicknessCells: 1 }
};

function csvEscape(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

async function writeCsv(filePath, rows, columns) {
  const lines = [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(','))
  ];

  await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf8');
}

async function readJson(filePath, fallback) {
  if (!existsSync(filePath)) {
    return fallback;
  }

  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function publicUrlToLocalPath(publicUrl) {
  if (!publicUrl || /^(https?:|data:|blob:|#)/i.test(publicUrl)) {
    return null;
  }

  return path.join(projectRoot, 'public', publicUrl.replace(/^\/+/, '').split('/').join(path.sep));
}

function getOrientation(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return undefined;
  }

  if (width === height) {
    return 'square';
  }

  return width > height ? 'landscape' : 'portrait';
}

function pushIssue(issues, severity, code, imageId, field, message, value = '') {
  issues.push({
    severity,
    code,
    imageId: imageId ?? '',
    field: field ?? '',
    message,
    value
  });
}

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function isGalleryPlacementXNumber(value) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= galleryPlacementMin && numberValue <= galleryPlacementMax;
}

function isGalleryPlacementZNumber(value) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= galleryPlacementMinZ && numberValue <= galleryPlacementMaxZ;
}

function isSnappedToGalleryGrid(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return false;
  }

  const snapped = Math.round(numberValue / galleryGridCellMeters) * galleryGridCellMeters;
  return Math.abs(snapped - numberValue) < 0.0001;
}

function normalizeGalleryRotationDegrees(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  const normalized = ((numberValue % 360) + 360) % 360;
  const signed = normalized > 180 ? normalized - 360 : normalized;
  const supported = Array.from(validWallRotationDegrees);
  const closest = supported.reduce((current, candidate) => {
    return Math.abs(candidate - signed) < Math.abs(current - signed) ? candidate : current;
  }, 0);

  return closest === -180 ? 180 : closest;
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanNumber(value, fallback, min, max) {
  const numberValue = Number(value);
  let resolved = Number.isFinite(numberValue) ? numberValue : fallback;

  if (Number.isFinite(min)) {
    resolved = Math.max(min, resolved);
  }

  if (Number.isFinite(max)) {
    resolved = Math.min(max, resolved);
  }

  return Number(resolved.toFixed(4));
}

function normalizeOrderedBounds(rawMin, rawMax, fallbackMin, fallbackMax) {
  const min = cleanNumber(rawMin, fallbackMin);
  const max = cleanNumber(rawMax, fallbackMax);

  if (min >= max) {
    return { min: fallbackMin, max: fallbackMax };
  }

  return { min, max };
}

function validateGalleryRoom(galleryRoom, issues) {
  if (!isRecord(galleryRoom)) {
    pushIssue(issues, 'error', 'gallery-room-not-object', 'gallery-room', 'galleryRoom', 'src/data/galleryRoom.json must be an object.');
    return null;
  }

  const grid = isRecord(galleryRoom.grid) ? galleryRoom.grid : {};
  const floor = isRecord(galleryRoom.floor) ? galleryRoom.floor : {};
  const shell = isRecord(galleryRoom.shell) ? galleryRoom.shell : {};
  const movementBounds = isRecord(galleryRoom.movementBounds) ? galleryRoom.movementBounds : {};
  const start = isRecord(galleryRoom.start) ? galleryRoom.start : {};
  const validShapes = new Set(['rectangle', 'l-shaped', 'custom-footprint']);
  const shape = String(galleryRoom.shape ?? '').trim() || 'rectangle';

  if (!validShapes.has(shape)) {
    pushIssue(issues, 'error', 'invalid-gallery-room-shape', 'gallery-room', 'galleryRoom.shape', 'Gallery room shape must be rectangle, l-shaped, or custom-footprint.', shape);
  }

  const gridX = normalizeOrderedBounds(grid.minX, grid.maxX, -16, 16);
  const gridZ = normalizeOrderedBounds(grid.minZ, grid.maxZ, -16, 16);
  const cellMeters = cleanNumber(grid.cellMeters, 0.5, 0.25, 2);

  if (Number(grid.cellMeters) !== cellMeters) {
    pushIssue(issues, 'warning', 'gallery-room-grid-cell-normalized', 'gallery-room', 'galleryRoom.grid.cellMeters', 'Gallery room grid cell size will be normalized for runtime use.', grid.cellMeters ?? '');
  }

  if (gridX.min !== Number(grid.minX) || gridX.max !== Number(grid.maxX)) {
    pushIssue(issues, 'warning', 'gallery-room-grid-x-normalized', 'gallery-room', 'galleryRoom.grid', 'Gallery room X grid bounds will be normalized for runtime use.', `${grid.minX ?? ''} / ${grid.maxX ?? ''}`);
  }

  if (gridZ.min !== Number(grid.minZ) || gridZ.max !== Number(grid.maxZ)) {
    pushIssue(issues, 'warning', 'gallery-room-grid-z-normalized', 'gallery-room', 'galleryRoom.grid', 'Gallery room Z grid bounds will be normalized for runtime use.', `${grid.minZ ?? ''} / ${grid.maxZ ?? ''}`);
  }

  const floorWidth = cleanNumber(floor.width, 34, 4);
  const floorDepth = cleanNumber(floor.depth, 34, 4);
  const shellHeight = cleanNumber(shell.height, 3.9, 2.4, 8);
  const wallThickness = cleanNumber(shell.wallThickness, 0.34, 0.05, 1);
  const ceilingThickness = cleanNumber(shell.ceilingThickness, 0.12, 0.02, 1);
  const movementX = normalizeOrderedBounds(movementBounds.minX, movementBounds.maxX, -16.3, 16.3);
  const movementZ = normalizeOrderedBounds(movementBounds.minZ, movementBounds.maxZ, -16.3, 16.3);

  if (!Array.isArray(start.position) || start.position.length < 3) {
    pushIssue(issues, 'error', 'invalid-gallery-room-start-position', 'gallery-room', 'galleryRoom.start.position', 'Gallery room start.position must be an [x, y, z] array.');
  }

  return {
    grid: {
      cellMeters,
      minX: gridX.min,
      maxX: gridX.max,
      minZ: gridZ.min,
      maxZ: gridZ.max
    },
    floor: {
      width: floorWidth,
      depth: floorDepth
    },
    shell: {
      height: shellHeight,
      wallThickness,
      ceilingThickness
    },
    movementBounds: {
      minX: movementX.min,
      maxX: movementX.max,
      minZ: movementZ.min,
      maxZ: movementZ.max
    }
  };
}

function makeCenteredOffsets(length) {
  const safeLength = Math.max(1, Math.round(Number(length) || 1));
  const half = Math.floor(safeLength / 2);
  const offsets = [];

  for (let offset = -half; offset <= half; offset += 1) {
    offsets.push(offset);
  }

  return offsets.slice(0, safeLength);
}

function getGalleryWallAxisStep(rotationYDegrees) {
  const rotation = normalizeGalleryRotationDegrees(rotationYDegrees);
  const axis = ((rotation % 180) + 180) % 180;

  if (axis === 45) {
    return { dx: 1, dz: 1 };
  }

  if (axis === 90) {
    return { dx: 0, dz: 1 };
  }

  if (axis === 135) {
    return { dx: -1, dz: 1 };
  }

  return { dx: 1, dz: 0 };
}

function getGalleryWallFootprint(record) {
  const wallType = String(record.wallType ?? 'standard-display-wall');
  const footprint = galleryWallFootprints[wallType] ?? galleryWallFootprints['standard-display-wall'];
  const positionX = Number(record.positionX ?? 0);
  const positionZ = Number(record.positionZ ?? 0);
  const rotationYDegrees = Number(record.rotationYDegrees ?? 0);
  const gridX = Math.round(positionX / galleryGridCellMeters);
  const gridZ = Math.round(positionZ / galleryGridCellMeters);
  const axis = getGalleryWallAxisStep(rotationYDegrees);
  const perpendicular = { dx: -axis.dz, dz: axis.dx };
  const cells = new Set();

  makeCenteredOffsets(footprint.lengthCells).forEach((lengthOffset) => {
    makeCenteredOffsets(footprint.thicknessCells).forEach((thicknessOffset) => {
      cells.add(`${gridX + axis.dx * lengthOffset + perpendicular.dx * thicknessOffset}:${gridZ + axis.dz * lengthOffset + perpendicular.dz * thicknessOffset}`);
    });
  });

  return cells;
}

function isGalleryFootprintInsideBounds(footprint) {
  const minCellX = Math.round(galleryPlacementMin / galleryGridCellMeters);
  const maxCellX = Math.round(galleryPlacementMax / galleryGridCellMeters);
  const minCellZ = Math.round(galleryPlacementMinZ / galleryGridCellMeters);
  const maxCellZ = Math.round(galleryPlacementMaxZ / galleryGridCellMeters);

  for (const cell of footprint) {
    const [x, z] = cell.split(':').map(Number);

    if (x < minCellX || x > maxCellX || z < minCellZ || z > maxCellZ) {
      return false;
    }
  }

  return true;
}

function findGalleryPlacementBoundaryViolations(records) {
  return records
    .filter((record) => record?.placedInGallery !== false)
    .map((record) => ({
      wallId: String(record.wallId ?? '').trim(),
      footprint: getGalleryWallFootprint(record)
    }))
    .filter((item) => item.wallId)
    .filter((item) => !isGalleryFootprintInsideBounds(item.footprint))
    .map((item) => ({ wallId: item.wallId }));
}

function galleryWallFootprintsOverlap(first, second) {
  for (const cell of first) {
    if (second.has(cell)) {
      return true;
    }
  }

  return false;
}

function findGalleryPlacementCollisions(records) {
  const footprints = records
    .filter((record) => record?.placedInGallery !== false)
    .map((record) => ({
      wallId: String(record.wallId ?? '').trim(),
      footprint: getGalleryWallFootprint(record)
    }))
    .filter((item) => item.wallId);
  const collisions = [];

  for (let firstIndex = 0; firstIndex < footprints.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < footprints.length; secondIndex += 1) {
      const first = footprints[firstIndex];
      const second = footprints[secondIndex];

      if (galleryWallFootprintsOverlap(first.footprint, second.footprint)) {
        collisions.push({ firstWallId: first.wallId, secondWallId: second.wallId });
      }
    }
  }

  return collisions;
}

async function main() {
  await fs.mkdir(reportDir, { recursive: true });

  const issues = [];
  const pathRows = [];
  const heroRows = [];
  const galleryCurationRows = [];

  const galleryImages = await readJson(galleryJsonPath, null);
  const categories = await readJson(categoriesJsonPath, []);
  const heroSlides = await readJson(heroSlidesJsonPath, []);
  const galleryCuration = await readJson(galleryCurationJsonPath, []);
  const galleryRoom = await readJson(galleryRoomJsonPath, null);
  const normalizedGalleryRoom = validateGalleryRoom(galleryRoom, issues);

  if (normalizedGalleryRoom) {
    galleryPlacementMin = normalizedGalleryRoom.grid.minX;
    galleryPlacementMax = normalizedGalleryRoom.grid.maxX;
    galleryPlacementMinZ = normalizedGalleryRoom.grid.minZ;
    galleryPlacementMaxZ = normalizedGalleryRoom.grid.maxZ;
    galleryGridCellMeters = normalizedGalleryRoom.grid.cellMeters;
  }

  if (!Array.isArray(galleryImages)) {
    pushIssue(issues, 'error', 'gallery-json-not-array', '', '', 'src/data/galleryImages.json must be an array.');
  }

  const images = Array.isArray(galleryImages) ? galleryImages : [];
  const categoryIds = new Set(Array.isArray(categories) ? categories.map((category) => category.id).filter(Boolean) : []);
  const imageIds = new Set();
  const duplicateIds = new Set();

  for (const image of images) {
    if (!image || typeof image !== 'object') {
      pushIssue(issues, 'error', 'invalid-image-record', '', '', 'Image record must be an object.');
      continue;
    }

    const imageId = image.id || '';

    if (!imageId) {
      pushIssue(issues, 'error', 'missing-id', '', 'id', 'Image record is missing an id.');
    } else if (imageIds.has(imageId)) {
      duplicateIds.add(imageId);
      pushIssue(issues, 'error', 'duplicate-id', imageId, 'id', `Duplicate image id: ${imageId}`, imageId);
    } else {
      imageIds.add(imageId);
    }

    for (const field of requiredStringFields) {
      if (typeof image[field] !== 'string' || image[field].trim() === '') {
        pushIssue(issues, 'error', 'missing-required-string', imageId, field, `Missing required string field: ${field}`);
      }
    }

    if (image.category && categoryIds.size > 0 && !categoryIds.has(image.category)) {
      pushIssue(
        issues,
        'warning',
        'unknown-category',
        imageId,
        'category',
        `Image category "${image.category}" is not listed in categories.json.`,
        image.category
      );
    }

    for (const [field, expectedPrefix] of Object.entries(expectedRenditionPrefixes)) {
      const value = image[field];

      if (!value) {
        continue;
      }

      const localPath = publicUrlToLocalPath(value);
      const exists = localPath ? existsSync(localPath) : false;
      const prefixOk = typeof value === 'string' && value.startsWith(expectedPrefix);
      const extensionOk = typeof value === 'string' && value.toLowerCase().endsWith('.webp');

      pathRows.push({
        imageId,
        field,
        value,
        expectedPrefix,
        exists,
        prefixOk,
        extensionOk
      });

      if (!prefixOk) {
        pushIssue(
          issues,
          'error',
          'bad-rendition-prefix',
          imageId,
          field,
          `Expected ${field} to start with ${expectedPrefix}.`,
          value
        );
      }

      if (!extensionOk) {
        pushIssue(
          issues,
          'warning',
          'non-webp-rendition',
          imageId,
          field,
          `Expected ${field} to point to a .webp runtime file.`,
          value
        );
      }

      if (!exists) {
        pushIssue(
          issues,
          'error',
          'missing-rendition-file',
          imageId,
          field,
          `File does not exist for ${field}.`,
          value
        );
      }
    }

    const width = Number(image.imageWidth);
    const height = Number(image.imageHeight);
    const aspect = Number(image.imageAspectRatio);
    const calculatedOrientation = getOrientation(width, height);

    if (!Number.isFinite(width) || width <= 0) {
      pushIssue(issues, 'warning', 'missing-image-width', imageId, 'imageWidth', 'imageWidth should be a positive number.');
    }

    if (!Number.isFinite(height) || height <= 0) {
      pushIssue(issues, 'warning', 'missing-image-height', imageId, 'imageHeight', 'imageHeight should be a positive number.');
    }

    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      const calculatedAspect = Number((width / height).toFixed(6));

      if (!Number.isFinite(aspect) || Math.abs(aspect - calculatedAspect) > 0.01) {
        pushIssue(
          issues,
          'warning',
          'aspect-ratio-mismatch',
          imageId,
          'imageAspectRatio',
          `imageAspectRatio should be close to ${calculatedAspect}.`,
          image.imageAspectRatio
        );
      }

      if (image.imageOrientation && calculatedOrientation && image.imageOrientation !== calculatedOrientation) {
        pushIssue(
          issues,
          'warning',
          'orientation-mismatch',
          imageId,
          'imageOrientation',
          `imageOrientation should be ${calculatedOrientation}.`,
          image.imageOrientation
        );
      }
    }
  }

  if (!Array.isArray(categories)) {
    pushIssue(issues, 'error', 'categories-json-not-array', '', '', 'src/data/categories.json must be an array.');
  } else {
    const seenCategories = new Set();

    for (const category of categories) {
      if (!category?.id) {
        pushIssue(issues, 'error', 'missing-category-id', '', 'categories.id', 'Category is missing id.');
        continue;
      }

      if (seenCategories.has(category.id)) {
        pushIssue(issues, 'error', 'duplicate-category-id', '', 'categories.id', `Duplicate category id: ${category.id}`, category.id);
      }

      seenCategories.add(category.id);

      if (!category.label) {
        pushIssue(issues, 'warning', 'missing-category-label', '', 'categories.label', `Category "${category.id}" is missing label.`);
      }
    }
  }

  if (!Array.isArray(heroSlides)) {
    pushIssue(issues, 'error', 'hero-slides-json-not-array', '', '', 'src/data/heroSlides.json must be an array.');
  } else {
    const heroImageIds = new Set();

    for (const [index, slide] of heroSlides.entries()) {
      const imageId = slide?.imageId ?? '';
      const image = images.find((candidate) => candidate.id === imageId);
      const row = {
        index,
        imageId,
        targetCategory: slide?.targetCategory ?? '',
        exists: Boolean(image),
        orientation: image?.imageOrientation ?? '',
        src: image?.src ?? ''
      };

      heroRows.push(row);

      if (!imageId) {
        pushIssue(issues, 'error', 'missing-hero-image-id', '', `heroSlides[${index}].imageId`, 'Hero slide is missing imageId.');
        continue;
      }

      if (heroImageIds.has(imageId)) {
        pushIssue(issues, 'warning', 'duplicate-hero-slide', imageId, `heroSlides[${index}].imageId`, `Hero slide repeats imageId: ${imageId}`);
      }

      heroImageIds.add(imageId);

      if (!image) {
        pushIssue(issues, 'error', 'unknown-hero-image-id', imageId, `heroSlides[${index}].imageId`, `Hero slide references an unknown imageId: ${imageId}`);
        continue;
      }

      if (image.imageOrientation && image.imageOrientation !== 'landscape') {
        pushIssue(
          issues,
          'error',
          'hero-not-landscape',
          imageId,
          `heroSlides[${index}].imageId`,
          'Hero slides should use landscape images only.',
          image.imageOrientation
        );
      }

      if (slide.targetCategory && categoryIds.size > 0 && !categoryIds.has(slide.targetCategory)) {
        pushIssue(
          issues,
          'warning',
          'hero-target-category-unknown',
          imageId,
          `heroSlides[${index}].targetCategory`,
          `Hero targetCategory "${slide.targetCategory}" is not listed in categories.json.`,
          slide.targetCategory
        );
      }
    }
  }

  if (!Array.isArray(galleryCuration)) {
    pushIssue(issues, 'error', 'gallery-curation-not-array', '', '', 'src/data/galleryCuration.json must be an array when present.');
  } else {
    const seenWallIds = new Set();
    const displayOrders = new Map();

    for (const [index, record] of galleryCuration.entries()) {
      if (!record || typeof record !== 'object') {
        pushIssue(issues, 'error', 'invalid-gallery-curation-record', '', `galleryCuration[${index}]`, 'Gallery curation row must be an object.');
        continue;
      }

      const wallId = String(record.wallId ?? '').trim();
      const artworkId = String(record.artworkId ?? '').trim();
      const wallType = String(record.wallType ?? '').trim();
      const plaqueSide = String(record.plaqueSide ?? '').trim();
      const showInGallery = record.showInGallery !== false;
      const placedInGallery = record.placedInGallery !== false;
      const image = artworkId ? images.find((candidate) => candidate.id === artworkId) : null;
      const displayOrder = record.displayOrder;
      const positionX = record.positionX;
      const positionZ = record.positionZ;
      const rotationYDegrees = record.rotationYDegrees;

      galleryCurationRows.push({
        index,
        wallId,
        artworkId,
        artworkExists: artworkId ? Boolean(image) : '',
        showInGallery,
        placedInGallery,
        displayOrder,
        wallType,
        plaqueEnabled: record.plaqueEnabled !== false,
        plaqueSide,
        positionX,
        positionZ,
        rotationYDegrees
      });

      if (!wallId) {
        pushIssue(issues, 'error', 'missing-gallery-wall-id', '', `galleryCuration[${index}].wallId`, 'Gallery curation row is missing wallId.');
      } else if (seenWallIds.has(wallId)) {
        pushIssue(issues, 'error', 'duplicate-gallery-wall-id', wallId, `galleryCuration[${index}].wallId`, `Duplicate gallery wall ID: ${wallId}`, wallId);
      } else {
        seenWallIds.add(wallId);
      }

      if (artworkId && !imageIds.has(artworkId)) {
        pushIssue(issues, 'error', 'unknown-gallery-artwork-id', artworkId, `galleryCuration[${index}].artworkId`, `Gallery wall references an unknown image ID: ${artworkId}`, artworkId);
      }

      if (showInGallery && placedInGallery && !artworkId) {
        pushIssue(issues, 'warning', 'active-gallery-wall-no-artwork', wallId, `galleryCuration[${index}].artworkId`, 'Active placed gallery wall has no assigned artwork.', wallId);
      }

      if (!validWallTypes.has(wallType)) {
        pushIssue(issues, 'error', 'invalid-gallery-wall-type', wallId, `galleryCuration[${index}].wallType`, `Invalid gallery wall type: ${wallType}`, wallType);
      }

      if (!validPlaqueSides.has(plaqueSide)) {
        pushIssue(issues, 'error', 'invalid-gallery-plaque-side', wallId, `galleryCuration[${index}].plaqueSide`, `Invalid gallery plaque side: ${plaqueSide}`, plaqueSide);
      }

      if (!isPositiveInteger(displayOrder)) {
        pushIssue(issues, 'error', 'invalid-gallery-display-order', wallId, `galleryCuration[${index}].displayOrder`, 'Gallery curation displayOrder must be a positive integer.', displayOrder);
      } else {
        const orderKey = String(Number(displayOrder));
        const previousWallId = displayOrders.get(orderKey);

        if (previousWallId) {
          pushIssue(issues, 'warning', 'duplicate-gallery-display-order', wallId, `galleryCuration[${index}].displayOrder`, `Display order ${orderKey} is also used by ${previousWallId}.`, displayOrder);
        }

        displayOrders.set(orderKey, wallId);
      }

      if (!isGalleryPlacementXNumber(positionX)) {
        pushIssue(issues, 'error', 'invalid-gallery-position-x', wallId, `galleryCuration[${index}].positionX`, 'Gallery wall positionX must be a number within the galleryRoom.json X grid bounds.', positionX);
      }

      if (!isGalleryPlacementZNumber(positionZ)) {
        pushIssue(issues, 'error', 'invalid-gallery-position-z', wallId, `galleryCuration[${index}].positionZ`, 'Gallery wall positionZ must be a number within the galleryRoom.json Z grid bounds.', positionZ);
      }

      if (isGalleryPlacementXNumber(positionX) && !isSnappedToGalleryGrid(positionX)) {
        pushIssue(issues, 'warning', 'gallery-position-x-not-grid-snapped', wallId, `galleryCuration[${index}].positionX`, 'Gallery wall positionX is valid but not snapped to the 0.5m floor grid.', positionX);
      }

      if (isGalleryPlacementZNumber(positionZ) && !isSnappedToGalleryGrid(positionZ)) {
        pushIssue(issues, 'warning', 'gallery-position-z-not-grid-snapped', wallId, `galleryCuration[${index}].positionZ`, 'Gallery wall positionZ is valid but not snapped to the 0.5m floor grid.', positionZ);
      }

      if (!validWallRotationDegrees.has(Number(rotationYDegrees))) {
        pushIssue(issues, 'error', 'invalid-gallery-rotation', wallId, `galleryCuration[${index}].rotationYDegrees`, 'Gallery wall rotationYDegrees must be one of -180, -135, -90, -45, 0, 45, 90, 135, or 180.', rotationYDegrees);
      }

      if (record.plaqueEnabled === false && plaqueSide !== 'none') {
        pushIssue(issues, 'warning', 'disabled-plaque-side-not-none', wallId, `galleryCuration[${index}].plaqueSide`, 'Plaque is disabled but plaqueSide is not none.', plaqueSide);
      }
    }

    const placementBoundaryViolations = findGalleryPlacementBoundaryViolations(galleryCuration);

    placementBoundaryViolations.forEach((violation) => {
      pushIssue(
        issues,
        'error',
        'gallery-wall-placement-out-of-bounds',
        violation.wallId,
        'galleryCuration.position',
        `Gallery wall footprint extends beyond the floor-map border: ${violation.wallId}.`,
        violation.wallId
      );
    });

    const placementCollisions = findGalleryPlacementCollisions(galleryCuration);

    placementCollisions.forEach((collision) => {
      pushIssue(
        issues,
        'error',
        'gallery-wall-placement-collision',
        collision.firstWallId,
        'galleryCuration.position',
        `Gallery wall footprint collision: ${collision.firstWallId} overlaps ${collision.secondWallId}.`,
        `${collision.firstWallId} / ${collision.secondWallId}`
      );
    });
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  const effectiveErrors = warningsAsErrors ? issues : errors;

  await writeCsv(
    path.join(reportDir, 'portfolio-image-data-issues.csv'),
    issues,
    ['severity', 'code', 'imageId', 'field', 'message', 'value']
  );

  await writeCsv(
    path.join(reportDir, 'portfolio-image-data-paths.csv'),
    pathRows,
    ['imageId', 'field', 'value', 'expectedPrefix', 'exists', 'prefixOk', 'extensionOk']
  );

  await writeCsv(
    path.join(reportDir, 'portfolio-hero-slide-audit.csv'),
    heroRows,
    ['index', 'imageId', 'targetCategory', 'exists', 'orientation', 'src']
  );

  await writeCsv(
    path.join(reportDir, 'portfolio-gallery-curation-audit.csv'),
    galleryCurationRows,
    ['index', 'wallId', 'artworkId', 'artworkExists', 'showInGallery', 'placedInGallery', 'displayOrder', 'wallType', 'plaqueEnabled', 'plaqueSide', 'positionX', 'positionZ', 'rotationYDegrees']
  );

  const issueLines = [
    'Portfolio image data validation issues',
    '',
    ...issues.map((issue) => {
      return `${issue.severity.toUpperCase()} | ${issue.code} | ${issue.imageId} | ${issue.field} | ${issue.message} | ${issue.value}`;
    })
  ];

  if (issues.length === 0) {
    issueLines.push('No issues found.');
  }

  await fs.writeFile(path.join(reportDir, 'portfolio-image-data-issues.txt'), `${issueLines.join('\n')}\n`, 'utf8');

  const summary = [
    'Portfolio image data validation summary',
    '',
    `Image records:        ${images.length}`,
    `Categories:           ${Array.isArray(categories) ? categories.length : 0}`,
    `Hero slides:          ${Array.isArray(heroSlides) ? heroSlides.length : 0}`,
    `Gallery wall slots:   ${Array.isArray(galleryCuration) ? galleryCuration.length : 0}`,
    `Gallery room:         ${isRecord(galleryRoom) ? String(galleryRoom.label ?? galleryRoom.id ?? 'present') : 'missing/invalid'}`,
    `Path rows:            ${pathRows.length}`,
    `Errors:               ${errors.length}`,
    `Warnings:             ${warnings.length}`,
    `Warnings as errors:   ${warningsAsErrors}`,
    '',
    'Reports:',
    'asset-reports/portfolio-image-data-issues.txt',
    'asset-reports/portfolio-image-data-issues.csv',
    'asset-reports/portfolio-image-data-paths.csv',
    'asset-reports/portfolio-hero-slide-audit.csv',
    'asset-reports/portfolio-gallery-curation-audit.csv'
  ];

  await fs.writeFile(path.join(reportDir, 'portfolio-image-data-validation-summary.txt'), `${summary.join('\n')}\n`, 'utf8');

  console.log('');
  console.log('Portfolio image data validation');
  console.log('');
  console.log(`Image records:        ${images.length}`);
  console.log(`Categories:           ${Array.isArray(categories) ? categories.length : 0}`);
  console.log(`Hero slides:          ${Array.isArray(heroSlides) ? heroSlides.length : 0}`);
  console.log(`Gallery wall slots:   ${Array.isArray(galleryCuration) ? galleryCuration.length : 0}`);
  console.log(`Gallery room:         ${isRecord(galleryRoom) ? String(galleryRoom.label ?? galleryRoom.id ?? 'present') : 'missing/invalid'}`);
  console.log(`Errors:               ${errors.length}`);
  console.log(`Warnings:             ${warnings.length}`);
  console.log(`Warnings as errors:   ${warningsAsErrors}`);
  console.log('');
  console.log('Reports written to asset-reports/:');
  console.log('- portfolio-image-data-validation-summary.txt');
  console.log('- portfolio-image-data-issues.txt');
  console.log('- portfolio-image-data-issues.csv');
  console.log('- portfolio-image-data-paths.csv');
  console.log('- portfolio-hero-slide-audit.csv');
  console.log('- portfolio-gallery-curation-audit.csv');
  console.log('');

  if (effectiveErrors.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('');
  console.error(error.message);
  process.exit(1);
});
