#!/usr/bin/env node

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

function readFlag(name) {
  return args.includes(name);
}

function readOption(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }

  return args[index + 1];
}

const projectRoot = path.resolve(readOption('--project-root', '.'));
const apply = readFlag('--apply');
const updateJson = readFlag('--update-json');
const force = readFlag('--force');

const galleryJsonPath = path.join(projectRoot, 'src', 'data', 'galleryImages.json');
const reportDir = path.join(projectRoot, 'asset-reports');
const backupDir = path.join(projectRoot, 'asset-archive', 'json-backups');

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

function publicUrlToLocalPath(publicUrl) {
  if (!publicUrl || /^(https?:|data:|blob:|#)/i.test(publicUrl)) {
    return null;
  }

  const clean = publicUrl.replace(/^\/+/, '').split('/').join(path.sep);
  return path.join(projectRoot, 'public', clean);
}

function canonicalUrl(imageId, rendition) {
  return `/images/portfolio/${rendition}/${imageId}.webp`;
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

function getImageOrientation(width, height) {
  if (!width || !height) {
    return undefined;
  }

  if (width === height) {
    return 'square';
  }

  return width > height ? 'landscape' : 'portrait';
}

async function getSharp() {
  try {
    const sharpModule = await import('sharp');
    return sharpModule.default;
  } catch (error) {
    throw new Error(
      [
        'The optimizer needs the "sharp" package to write image files or read dimensions.',
        'Install it with: npm install -D sharp',
        '',
        `Original error: ${error.message}`
      ].join('\n')
    );
  }
}

async function ensureDirectoryFor(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function findBestSource(image) {
  const candidates = [
    image.fullSrc,
    image.src,
    image.textureSrc,
    image.thumbSrc
  ].filter(Boolean);

  for (const publicUrl of candidates) {
    const localPath = publicUrlToLocalPath(publicUrl);

    if (localPath && existsSync(localPath)) {
      return {
        publicUrl,
        localPath
      };
    }
  }

  return null;
}

async function main() {
  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(backupDir, { recursive: true });

  const images = await readJson(galleryJsonPath);
  const sharp = apply || updateJson ? await getSharp() : null;

  const planRows = [];
  const missingRows = [];
  const summaryLines = [];
  const started = timestamp();

  let generatedCount = 0;
  let skippedExistingCount = 0;
  let jsonUpdatedCount = 0;
  let metadataUpdatedCount = 0;

  for (const image of images) {
    const imageId = image.id;
    const source = findBestSource(image);

    if (!imageId) {
      continue;
    }

    if (!source) {
      missingRows.push({
        imageId,
        title: image.title ?? '',
        reason: 'No local source found from fullSrc, src, textureSrc, or thumbSrc',
        fullSrc: image.fullSrc ?? '',
        src: image.src ?? '',
        textureSrc: image.textureSrc ?? '',
        thumbSrc: image.thumbSrc ?? ''
      });

      continue;
    }

    let sourceMetadata = null;
    if (sharp) {
      sourceMetadata = await sharp(source.localPath).rotate().metadata();

      if (updateJson && sourceMetadata.width && sourceMetadata.height) {
        image.imageWidth = sourceMetadata.width;
        image.imageHeight = sourceMetadata.height;
        image.imageAspectRatio = Number((sourceMetadata.width / sourceMetadata.height).toFixed(6));
        image.imageOrientation = getImageOrientation(sourceMetadata.width, sourceMetadata.height);
        metadataUpdatedCount += 1;
      }
    }

    for (const [renditionName, config] of Object.entries(renditions)) {
      const targetUrl = canonicalUrl(imageId, renditionName);
      const targetPath = publicUrlToLocalPath(targetUrl);
      const existedBefore = existsSync(targetPath);
      let action = 'planned';

      if (apply) {
        if (existedBefore && !force) {
          action = 'skipped-existing';
          skippedExistingCount += 1;
        } else {
          await ensureDirectoryFor(targetPath);

          await sharp(source.localPath)
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
          generatedCount += 1;
        }
      }

      if (updateJson && image[config.field] !== targetUrl) {
        image[config.field] = targetUrl;
        jsonUpdatedCount += 1;
      }

      planRows.push({
        imageId,
        title: image.title ?? '',
        rendition: renditionName,
        field: config.field,
        maxDimension: config.max,
        quality: config.quality,
        sourceUrl: source.publicUrl,
        sourcePath: source.localPath,
        targetUrl,
        targetPath,
        existedBefore,
        action
      });
    }
  }

  await writeCsv(
    path.join(reportDir, 'optimizer-plan.csv'),
    planRows,
    [
      'imageId',
      'title',
      'rendition',
      'field',
      'maxDimension',
      'quality',
      'sourceUrl',
      'sourcePath',
      'targetUrl',
      'targetPath',
      'existedBefore',
      'action'
    ]
  );

  await writeCsv(
    path.join(reportDir, 'optimizer-missing-sources.csv'),
    missingRows,
    ['imageId', 'title', 'reason', 'fullSrc', 'src', 'textureSrc', 'thumbSrc']
  );

  const planText = [
    'Portfolio image optimizer plan',
    `Generated: ${started}`,
    '',
    ...planRows.map((row) => {
      return `${row.action.toUpperCase()} | ${row.imageId} | ${row.rendition} | ${row.sourceUrl} -> ${row.targetUrl}`;
    })
  ];

  if (planRows.length === 0) {
    planText.push('No optimizer rows were generated.');
  }

  await fs.writeFile(path.join(reportDir, 'optimizer-plan.txt'), `${planText.join('\n')}\n`, 'utf8');

  const missingText = [
    'Portfolio image optimizer missing sources',
    `Generated: ${started}`,
    ''
  ];

  if (missingRows.length === 0) {
    missingText.push('No missing source images.');
  } else {
    missingText.push(...missingRows.map((row) => {
      return `${row.imageId} | ${row.reason}`;
    }));
  }

  await fs.writeFile(path.join(reportDir, 'optimizer-missing-sources.txt'), `${missingText.join('\n')}\n`, 'utf8');

  if (updateJson) {
    const backupPath = path.join(backupDir, `galleryImages-before-optimizer-${started}.json`);
    await fs.copyFile(galleryJsonPath, backupPath);
    await fs.writeFile(galleryJsonPath, `${JSON.stringify(images, null, 2)}\n`, 'utf8');
  }

  summaryLines.push('Portfolio image optimizer summary');
  summaryLines.push(`Generated: ${started}`);
  summaryLines.push('');
  summaryLines.push(`Image records scanned:       ${images.length}`);
  summaryLines.push(`Plan rows:                   ${planRows.length}`);
  summaryLines.push(`Missing source rows:         ${missingRows.length}`);
  summaryLines.push(`Apply enabled:               ${apply}`);
  summaryLines.push(`UpdateJson enabled:          ${updateJson}`);
  summaryLines.push(`Force enabled:               ${force}`);
  summaryLines.push(`Generated/overwritten files: ${generatedCount}`);
  summaryLines.push(`Skipped existing files:      ${skippedExistingCount}`);
  summaryLines.push(`JSON field updates:          ${jsonUpdatedCount}`);
  summaryLines.push(`Metadata rows updated:       ${metadataUpdatedCount}`);
  summaryLines.push('');
  summaryLines.push('Renditions:');
  summaryLines.push('full    -> max 2400px, webp quality 88');
  summaryLines.push('display -> max 1600px, webp quality 84');
  summaryLines.push('texture -> max 1024px, webp quality 78');
  summaryLines.push('thumb   -> max 520px, webp quality 74');

  await fs.writeFile(path.join(reportDir, 'optimizer-summary.txt'), `${summaryLines.join('\n')}\n`, 'utf8');

  console.log('');
  console.log('Portfolio image optimizer');
  console.log('');
  console.log(`Image records scanned:       ${images.length}`);
  console.log(`Plan rows:                   ${planRows.length}`);
  console.log(`Missing source rows:         ${missingRows.length}`);
  console.log(`Apply enabled:               ${apply}`);
  console.log(`UpdateJson enabled:          ${updateJson}`);
  console.log(`Force enabled:               ${force}`);
  console.log(`Generated/overwritten files: ${generatedCount}`);
  console.log(`Skipped existing files:      ${skippedExistingCount}`);
  console.log(`JSON field updates:          ${jsonUpdatedCount}`);
  console.log('');
  console.log('Reports written to asset-reports/:');
  console.log('- optimizer-plan.txt');
  console.log('- optimizer-plan.csv');
  console.log('- optimizer-missing-sources.txt');
  console.log('- optimizer-summary.txt');
  console.log('');

  if (!apply) {
    console.log('Dry run only. Re-run with -Apply -UpdateJson when the plan looks correct.');
  }
}

main().catch((error) => {
  console.error('');
  console.error(error.message);
  process.exit(1);
});
