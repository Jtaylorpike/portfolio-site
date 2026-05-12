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
const sourceDirInput = readOption('--source-dir', path.join('source-images', 'inbox'));
const category = readOption('--category', 'personal').trim() || 'personal';
const year = readOption('--year', '').trim();
const locationValue = readOption('--location', '').trim();
const note = readOption('--note', '').trim();
const apply = readFlag('--apply');
const updateCategories = readFlag('--update-categories');
const moveSource = readFlag('--move-source');
const force = readFlag('--force');

const sourceDir = path.resolve(projectRoot, sourceDirInput);
const galleryJsonPath = path.join(projectRoot, 'src', 'data', 'galleryImages.json');
const categoriesJsonPath = path.join(projectRoot, 'src', 'data', 'categories.json');
const reportDir = path.join(projectRoot, 'asset-reports');
const archiveDir = path.join(projectRoot, 'asset-archive');
const jsonBackupDir = path.join(archiveDir, 'json-backups');
const importedSourceDir = path.join(projectRoot, 'source-images', 'imported');

const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

const renditions = {
  full: {
    field: 'fullSrc',
    max: 2400,
    quality: 88
  },
  display: {
    field: 'src',
    max: 1600,
    quality: 84
  },
  texture: {
    field: 'textureSrc',
    max: 1024,
    quality: 78
  },
  thumb: {
    field: 'thumbSrc',
    max: 520,
    quality: 74
  }
};

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join('') + '-' + [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join('');
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'image';
}

function toTitle(value) {
  return value
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getOrientation(width, height) {
  if (!width || !height) {
    return undefined;
  }

  if (width === height) {
    return 'square';
  }

  return width > height ? 'landscape' : 'portrait';
}

function publicUrlFor(imageId, rendition) {
  return `/images/portfolio/${rendition}/${imageId}.webp`;
}

function localPathForPublicUrl(publicUrl) {
  const clean = publicUrl.replace(/^\/+/, '').split('/').join(path.sep);
  return path.join(projectRoot, 'public', clean);
}

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

async function walkFiles(directory) {
  if (!existsSync(directory)) {
    await fs.mkdir(directory, { recursive: true });
    return [];
  }

  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function getSharp() {
  try {
    const sharpModule = await import('sharp');
    return sharpModule.default;
  } catch (error) {
    throw new Error([
      'The importer needs the "sharp" package for apply mode.',
      'Install it with: npm install -D sharp',
      '',
      `Original error: ${error.message}`
    ].join('\n'));
  }
}

function getUniqueId(baseId, existingIds, plannedIds) {
  let candidate = baseId;
  let index = 2;

  while (existingIds.has(candidate) || plannedIds.has(candidate)) {
    candidate = `${baseId}-${index}`;
    index += 1;
  }

  plannedIds.add(candidate);
  return candidate;
}

async function ensureDirectoryFor(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function main() {
  const started = timestamp();
  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(jsonBackupDir, { recursive: true });

  const galleryImages = await readJson(galleryJsonPath, []);
  const categories = await readJson(categoriesJsonPath, []);
  const existingIds = new Set(galleryImages.map((image) => image.id));
  const plannedIds = new Set();

  const files = (await walkFiles(sourceDir))
    .filter((filePath) => supportedExtensions.has(path.extname(filePath).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const sharp = apply ? await getSharp() : null;
  const planRows = [];
  const skippedRows = [];
  const newRecords = [];

  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();

    if (!supportedExtensions.has(extension)) {
      skippedRows.push({
        filePath,
        reason: 'Unsupported extension'
      });
      continue;
    }

    const filenameBase = path.basename(filePath, extension);
    const baseId = `${slugify(category)}-${slugify(filenameBase)}`;
    const imageId = getUniqueId(baseId, existingIds, plannedIds);
    const title = toTitle(filenameBase);
    const targetUrls = Object.fromEntries(
      Object.keys(renditions).map((renditionName) => [renditionName, publicUrlFor(imageId, renditionName)])
    );

    const rowBase = {
      filePath,
      imageId,
      title,
      category,
      year,
      location: locationValue,
      note
    };

    let metadata = null;
    if (apply) {
      metadata = await sharp(filePath).rotate().metadata();
    }

    const imageWidth = metadata?.width ?? undefined;
    const imageHeight = metadata?.height ?? undefined;
    const imageAspectRatio = imageWidth && imageHeight ? Number((imageWidth / imageHeight).toFixed(6)) : undefined;
    const imageOrientation = getOrientation(imageWidth, imageHeight);

    const record = {
      id: imageId,
      title,
      category,
      year,
      location: locationValue,
      note,
      src: targetUrls.display,
      thumbSrc: targetUrls.thumb,
      textureSrc: targetUrls.texture,
      fullSrc: targetUrls.full,
      alt: `Photograph by Taylor Pike: ${title}`,
      imageWidth,
      imageHeight,
      imageAspectRatio,
      imageOrientation,
      thumbnailPosition: '50% 50%',
      heroPosition: '50% 50%',
      galleryPosition: '50% 50%',
      heroFrameStyle: 'auto',
      heroFitMode: 'cover',
      galleryFitMode: 'cover',
      galleryFrameStyle: 'auto',
      gallerySize: 1.0
    };

    for (const [renditionName, config] of Object.entries(renditions)) {
      const targetUrl = targetUrls[renditionName];
      const targetPath = localPathForPublicUrl(targetUrl);
      const existedBefore = existsSync(targetPath);
      let action = 'planned';

      if (apply) {
        if (existedBefore && !force) {
          action = 'skipped-existing';
        } else {
          await ensureDirectoryFor(targetPath);

          await sharp(filePath)
            .rotate()
            .resize({
              width: config.max,
              height: config.max,
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({
              quality: config.quality,
              effort: 5
            })
            .toFile(targetPath);

          action = existedBefore ? 'overwritten' : 'generated';
        }
      }

      planRows.push({
        ...rowBase,
        rendition: renditionName,
        field: config.field,
        sourcePath: filePath,
        targetUrl,
        targetPath,
        existedBefore,
        action
      });
    }

    newRecords.push(record);

    if (apply && moveSource) {
      const importedTarget = path.join(importedSourceDir, started, path.basename(filePath));
      await ensureDirectoryFor(importedTarget);
      await fs.rename(filePath, importedTarget);
    }
  }

  await writeCsv(
    path.join(reportDir, 'portfolio-image-import-plan.csv'),
    planRows,
    [
      'filePath',
      'imageId',
      'title',
      'category',
      'year',
      'location',
      'note',
      'rendition',
      'field',
      'sourcePath',
      'targetUrl',
      'targetPath',
      'existedBefore',
      'action'
    ]
  );

  await writeCsv(
    path.join(reportDir, 'portfolio-image-import-skipped.csv'),
    skippedRows,
    ['filePath', 'reason']
  );

  const planText = [
    'Portfolio image import plan',
    `Generated: ${started}`,
    '',
    `Source directory: ${sourceDir}`,
    `Files found: ${files.length}`,
    `New records planned: ${newRecords.length}`,
    `Plan rows: ${planRows.length}`,
    `Apply enabled: ${apply}`,
    `Update categories enabled: ${updateCategories}`,
    `Move source enabled: ${moveSource}`,
    '',
    ...newRecords.map((record) => {
      return `${record.id} | ${record.title} | ${record.category} | ${record.src}`;
    })
  ];

  if (newRecords.length === 0) {
    planText.push('No new records planned.');
  }

  await fs.writeFile(path.join(reportDir, 'portfolio-image-import-plan.txt'), `${planText.join('\n')}\n`, 'utf8');

  if (apply && newRecords.length > 0) {
    const backupPath = path.join(jsonBackupDir, `galleryImages-before-import-${started}.json`);
    await fs.copyFile(galleryJsonPath, backupPath);

    const nextGalleryImages = [...galleryImages, ...newRecords];
    await fs.writeFile(galleryJsonPath, `${JSON.stringify(nextGalleryImages, null, 2)}\n`, 'utf8');

    if (updateCategories) {
      const categoryExists = categories.some((item) => item.id === category);
      if (!categoryExists) {
        const nextCategories = [
          ...categories,
          {
            id: category,
            label: toTitle(category)
          }
        ];

        const categoryBackupPath = path.join(jsonBackupDir, `categories-before-import-${started}.json`);
        if (existsSync(categoriesJsonPath)) {
          await fs.copyFile(categoriesJsonPath, categoryBackupPath);
        }
        await fs.writeFile(categoriesJsonPath, `${JSON.stringify(nextCategories, null, 2)}\n`, 'utf8');
      }
    }
  }

  const summary = [
    'Portfolio image import summary',
    `Generated: ${started}`,
    '',
    `Source directory:       ${sourceDir}`,
    `Source files found:     ${files.length}`,
    `New records planned:    ${newRecords.length}`,
    `Plan rows:              ${planRows.length}`,
    `Skipped rows:           ${skippedRows.length}`,
    `Apply enabled:          ${apply}`,
    `Update categories:      ${updateCategories}`,
    `Move source:            ${moveSource}`,
    `Force enabled:          ${force}`,
    '',
    'Reports:',
    'asset-reports/portfolio-image-import-plan.txt',
    'asset-reports/portfolio-image-import-plan.csv',
    'asset-reports/portfolio-image-import-skipped.csv'
  ];

  await fs.writeFile(path.join(reportDir, 'portfolio-image-import-summary.txt'), `${summary.join('\n')}\n`, 'utf8');

  console.log('');
  console.log('Portfolio image import');
  console.log('');
  console.log(`Source files found:  ${files.length}`);
  console.log(`New records planned: ${newRecords.length}`);
  console.log(`Plan rows:           ${planRows.length}`);
  console.log(`Apply enabled:       ${apply}`);
  console.log('');
  console.log('Reports written to asset-reports/:');
  console.log('- portfolio-image-import-plan.txt');
  console.log('- portfolio-image-import-plan.csv');
  console.log('- portfolio-image-import-summary.txt');
  console.log('');

  if (!apply) {
    console.log('Dry run only. Re-run with -Apply when the plan looks correct.');
  }
}

main().catch((error) => {
  console.error('');
  console.error(error.message);
  process.exit(1);
});
