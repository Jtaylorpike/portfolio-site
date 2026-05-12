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
const validWallRotationDegrees = new Set([-180, -90, 0, 90, 180]);
const galleryPlacementMin = -16;
const galleryPlacementMax = 16;
const galleryGridCellMeters = 0.5;
const galleryWallFootprints = {
  'feature-wall': { width: 6.25, thickness: 0.26 },
  'wide-display-wall': { width: 4.9, thickness: 0.22 },
  'standard-display-wall': { width: 3.55, thickness: 0.22 },
  'compact-display-wall': { width: 2.7, thickness: 0.22 },
  'narrow-transition-wall': { width: 2.15, thickness: 0.2 }
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

function isGalleryPlacementNumber(value) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= galleryPlacementMin && numberValue <= galleryPlacementMax;
}

function isSnappedToGalleryGrid(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return false;
  }

  const snapped = Math.round(numberValue / galleryGridCellMeters) * galleryGridCellMeters;
  return Math.abs(snapped - numberValue) < 0.0001;
}

function getGalleryWallFootprint(record) {
  const wallType = String(record.wallType ?? 'standard-display-wall');
  const footprint = galleryWallFootprints[wallType] ?? galleryWallFootprints['standard-display-wall'];
  const positionX = Number(record.positionX ?? 0);
  const positionZ = Number(record.positionZ ?? 0);
  const rotationYDegrees = Number(record.rotationYDegrees ?? 0);
  const lengthCells = Math.max(1, Math.ceil(footprint.width / galleryGridCellMeters));
  const thicknessCells = Math.max(1, Math.ceil(footprint.thickness / galleryGridCellMeters));
  const isSideFacing = Math.abs(rotationYDegrees) === 90;
  const occupiedWidthCells = isSideFacing ? thicknessCells : lengthCells;
  const occupiedDepthCells = isSideFacing ? lengthCells : thicknessCells;
  const gridX = Math.round(positionX / galleryGridCellMeters);
  const gridZ = Math.round(positionZ / galleryGridCellMeters);

  return {
    minX: gridX - occupiedWidthCells / 2,
    maxX: gridX + occupiedWidthCells / 2,
    minZ: gridZ - occupiedDepthCells / 2,
    maxZ: gridZ + occupiedDepthCells / 2
  };
}

function galleryWallFootprintsOverlap(first, second) {
  return first.minX < second.maxX
    && first.maxX > second.minX
    && first.minZ < second.maxZ
    && first.maxZ > second.minZ;
}

function findGalleryPlacementCollisions(records) {
  const footprints = records
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

      if (showInGallery && !artworkId) {
        pushIssue(issues, 'warning', 'active-gallery-wall-no-artwork', wallId, `galleryCuration[${index}].artworkId`, 'Active gallery wall has no assigned artwork.', wallId);
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

      if (!isGalleryPlacementNumber(positionX)) {
        pushIssue(issues, 'error', 'invalid-gallery-position-x', wallId, `galleryCuration[${index}].positionX`, 'Gallery wall positionX must be a number between -16 and 16.', positionX);
      }

      if (!isGalleryPlacementNumber(positionZ)) {
        pushIssue(issues, 'error', 'invalid-gallery-position-z', wallId, `galleryCuration[${index}].positionZ`, 'Gallery wall positionZ must be a number between -16 and 16.', positionZ);
      }

      if (isGalleryPlacementNumber(positionX) && !isSnappedToGalleryGrid(positionX)) {
        pushIssue(issues, 'warning', 'gallery-position-x-not-grid-snapped', wallId, `galleryCuration[${index}].positionX`, 'Gallery wall positionX is valid but not snapped to the 0.5m floor grid.', positionX);
      }

      if (isGalleryPlacementNumber(positionZ) && !isSnappedToGalleryGrid(positionZ)) {
        pushIssue(issues, 'warning', 'gallery-position-z-not-grid-snapped', wallId, `galleryCuration[${index}].positionZ`, 'Gallery wall positionZ is valid but not snapped to the 0.5m floor grid.', positionZ);
      }

      if (!validWallRotationDegrees.has(Number(rotationYDegrees))) {
        pushIssue(issues, 'error', 'invalid-gallery-rotation', wallId, `galleryCuration[${index}].rotationYDegrees`, 'Gallery wall rotationYDegrees must be one of -180, -90, 0, 90, or 180.', rotationYDegrees);
      }

      if (record.plaqueEnabled === false && plaqueSide !== 'none') {
        pushIssue(issues, 'warning', 'disabled-plaque-side-not-none', wallId, `galleryCuration[${index}].plaqueSide`, 'Plaque is disabled but plaqueSide is not none.', plaqueSide);
      }
    }

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
    ['index', 'wallId', 'artworkId', 'artworkExists', 'showInGallery', 'displayOrder', 'wallType', 'plaqueEnabled', 'plaqueSide', 'positionX', 'positionZ', 'rotationYDegrees']
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
