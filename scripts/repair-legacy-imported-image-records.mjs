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
const apply = readFlag('--apply');
const force = readFlag('--force');

const galleryJsonPath = path.join(projectRoot, 'src', 'data', 'galleryImages.json');
const reportDir = path.join(projectRoot, 'asset-reports');
const backupDir = path.join(projectRoot, 'asset-archive', 'json-backups');

const fieldRules = {
  src: {
    rendition: 'display',
    expectedPrefix: '/images/portfolio/display/'
  },
  thumbSrc: {
    rendition: 'thumb',
    expectedPrefix: '/images/portfolio/thumb/'
  },
  textureSrc: {
    rendition: 'texture',
    expectedPrefix: '/images/portfolio/texture/'
  },
  fullSrc: {
    rendition: 'full',
    expectedPrefix: '/images/portfolio/full/'
  }
};

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');

  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function publicUrlToLocalPath(publicUrl) {
  if (!publicUrl || /^(https?:|data:|blob:|#)/i.test(publicUrl)) {
    return null;
  }

  return path.join(projectRoot, 'public', publicUrl.replace(/^\/+/, '').split('/').join(path.sep));
}

function targetUrlFor(imageId, rendition) {
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

async function getSharp() {
  try {
    const sharpModule = await import('sharp');
    return sharpModule.default;
  } catch (error) {
    throw new Error([
      'Repair apply mode needs the "sharp" package when a legacy source is not already WebP.',
      'Install it with: npm install -D sharp',
      '',
      `Original error: ${error.message}`
    ].join('\n'));
  }
}

async function ensureDirectoryFor(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function copyOrConvertToWebp(sourcePath, targetPath, sharp) {
  const sourceExtension = path.extname(sourcePath).toLowerCase();
  await ensureDirectoryFor(targetPath);

  if (sourceExtension === '.webp') {
    await fs.copyFile(sourcePath, targetPath);
    return 'copied-webp';
  }

  await sharp(sourcePath)
    .rotate()
    .webp({
      quality: 88,
      effort: 5
    })
    .toFile(targetPath);

  return 'converted-webp';
}

async function main() {
  const started = timestamp();
  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(backupDir, { recursive: true });

  const raw = await fs.readFile(galleryJsonPath, 'utf8');
  const images = JSON.parse(raw);

  const rows = [];
  const missingRows = [];
  let jsonUpdates = 0;
  let fileWrites = 0;
  let needsSharp = false;

  for (const image of images) {
    if (!image || typeof image !== 'object' || !image.id) {
      continue;
    }

    for (const [field, rule] of Object.entries(fieldRules)) {
      const currentUrl = image[field];

      if (!currentUrl || typeof currentUrl !== 'string') {
        continue;
      }

      const targetUrl = targetUrlFor(image.id, rule.rendition);
      const targetPath = publicUrlToLocalPath(targetUrl);
      const sourcePath = publicUrlToLocalPath(currentUrl);
      const alreadyCanonical = currentUrl.startsWith(rule.expectedPrefix);
      const targetExists = existsSync(targetPath);
      const sourceExists = sourcePath ? existsSync(sourcePath) : false;
      const needsRepair = !alreadyCanonical;

      if (!needsRepair) {
        continue;
      }

      if (!sourceExists && !targetExists) {
        missingRows.push({
          imageId: image.id,
          field,
          currentUrl,
          sourcePath,
          targetUrl,
          reason: 'Neither source nor target file exists'
        });

        rows.push({
          imageId: image.id,
          field,
          currentUrl,
          targetUrl,
          sourceExists,
          targetExists,
          action: 'missing',
          jsonUpdated: false
        });

        continue;
      }

      if (sourceExists && path.extname(sourcePath).toLowerCase() !== '.webp') {
        needsSharp = true;
      }

      rows.push({
        imageId: image.id,
        title: image.title ?? '',
        field,
        currentUrl,
        sourcePath,
        targetUrl,
        targetPath,
        sourceExists,
        targetExists,
        action: targetExists && !force ? 'update-json-only' : 'copy-or-convert',
        jsonUpdated: apply
      });
    }
  }

  let sharp = null;
  if (apply && needsSharp) {
    sharp = await getSharp();
  }

  if (apply) {
    for (const row of rows) {
      if (row.action === 'missing') {
        continue;
      }

      if (row.action === 'copy-or-convert') {
        if (!row.sourceExists) {
          continue;
        }

        let writeAction = 'copy-or-convert';

        if (!row.targetExists || force) {
          writeAction = await copyOrConvertToWebp(row.sourcePath, row.targetPath, sharp);
          fileWrites += 1;
        }

        row.action = writeAction;
      }

      const image = images.find((candidate) => candidate.id === row.imageId);

      if (image) {
        image[row.field] = row.targetUrl;
        jsonUpdates += 1;
      }
    }

    if (jsonUpdates > 0) {
      const backupPath = path.join(backupDir, `galleryImages-before-legacy-import-repair-${started}.json`);
      await fs.copyFile(galleryJsonPath, backupPath);
      await fs.writeFile(galleryJsonPath, `${JSON.stringify(images, null, 2)}\n`, 'utf8');
    }
  }

  await writeCsv(
    path.join(reportDir, 'legacy-imported-image-repair-plan.csv'),
    rows,
    ['imageId', 'title', 'field', 'currentUrl', 'sourcePath', 'targetUrl', 'targetPath', 'sourceExists', 'targetExists', 'action', 'jsonUpdated']
  );

  await writeCsv(
    path.join(reportDir, 'legacy-imported-image-repair-missing.csv'),
    missingRows,
    ['imageId', 'field', 'currentUrl', 'sourcePath', 'targetUrl', 'reason']
  );

  const lines = [
    'Legacy imported image record repair plan',
    `Generated: ${started}`,
    '',
    `Rows needing repair: ${rows.length}`,
    `Missing rows:        ${missingRows.length}`,
    `Apply enabled:       ${apply}`,
    `Force enabled:       ${force}`,
    `File writes:         ${fileWrites}`,
    `JSON updates:        ${jsonUpdates}`,
    ''
  ];

  if (rows.length === 0) {
    lines.push('No legacy imported image record paths found.');
  } else {
    for (const row of rows) {
      lines.push(`${row.imageId} | ${row.field} | ${row.currentUrl} -> ${row.targetUrl} | ${row.action}`);
    }
  }

  await fs.writeFile(path.join(reportDir, 'legacy-imported-image-repair-plan.txt'), `${lines.join('\n')}\n`, 'utf8');

  console.log('');
  console.log('Legacy imported image record repair');
  console.log('');
  console.log(`Rows needing repair: ${rows.length}`);
  console.log(`Missing rows:        ${missingRows.length}`);
  console.log(`Apply enabled:       ${apply}`);
  console.log(`Force enabled:       ${force}`);
  console.log(`File writes:         ${fileWrites}`);
  console.log(`JSON updates:        ${jsonUpdates}`);
  console.log('');
  console.log('Reports written to asset-reports/:');
  console.log('- legacy-imported-image-repair-plan.txt');
  console.log('- legacy-imported-image-repair-plan.csv');
  console.log('- legacy-imported-image-repair-missing.csv');
  console.log('');

  if (!apply) {
    console.log('Dry run only. Re-run with -Apply after reviewing the plan.');
  }

  if (missingRows.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('');
  console.error(error.message);
  process.exit(1);
});
