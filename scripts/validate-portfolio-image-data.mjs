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

async function main() {
  await fs.mkdir(reportDir, { recursive: true });

  const issues = [];
  const pathRows = [];
  const heroRows = [];

  const galleryImages = await readJson(galleryJsonPath, null);
  const categories = await readJson(categoriesJsonPath, []);
  const heroSlides = await readJson(heroSlidesJsonPath, []);

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
    `Path rows:            ${pathRows.length}`,
    `Errors:               ${errors.length}`,
    `Warnings:             ${warnings.length}`,
    `Warnings as errors:   ${warningsAsErrors}`,
    '',
    'Reports:',
    'asset-reports/portfolio-image-data-issues.txt',
    'asset-reports/portfolio-image-data-issues.csv',
    'asset-reports/portfolio-image-data-paths.csv',
    'asset-reports/portfolio-hero-slide-audit.csv'
  ];

  await fs.writeFile(path.join(reportDir, 'portfolio-image-data-validation-summary.txt'), `${summary.join('\n')}\n`, 'utf8');

  console.log('');
  console.log('Portfolio image data validation');
  console.log('');
  console.log(`Image records:      ${images.length}`);
  console.log(`Categories:         ${Array.isArray(categories) ? categories.length : 0}`);
  console.log(`Hero slides:        ${Array.isArray(heroSlides) ? heroSlides.length : 0}`);
  console.log(`Errors:             ${errors.length}`);
  console.log(`Warnings:           ${warnings.length}`);
  console.log(`Warnings as errors: ${warningsAsErrors}`);
  console.log('');
  console.log('Reports written to asset-reports/:');
  console.log('- portfolio-image-data-validation-summary.txt');
  console.log('- portfolio-image-data-issues.txt');
  console.log('- portfolio-image-data-issues.csv');
  console.log('- portfolio-image-data-paths.csv');
  console.log('- portfolio-hero-slide-audit.csv');
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
