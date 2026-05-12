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
const imageId = readOption('--image-id', '').trim();
const apply = readFlag('--apply');
const keepFiles = readFlag('--keep-files');

const galleryJsonPath = path.join(projectRoot, 'src', 'data', 'galleryImages.json');
const heroSlidesJsonPath = path.join(projectRoot, 'src', 'data', 'heroSlides.json');
const reportDir = path.join(projectRoot, 'asset-reports');
const archiveRoot = path.join(projectRoot, 'asset-archive');
const jsonBackupDir = path.join(archiveRoot, 'json-backups');

const imageFields = ['src', 'thumbSrc', 'textureSrc', 'fullSrc'];

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

function localPathToProjectRelative(localPath) {
  return path.relative(projectRoot, localPath).split(path.sep).join('/');
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

async function ensureDirectoryFor(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function removeEmptyDirectories(startDirectory, stopDirectory) {
  let current = startDirectory;

  while (current.startsWith(stopDirectory) && current !== stopDirectory) {
    try {
      const entries = await fs.readdir(current);
      if (entries.length > 0) {
        break;
      }

      await fs.rmdir(current);
      current = path.dirname(current);
    } catch {
      break;
    }
  }
}

async function main() {
  const started = timestamp();

  if (!imageId) {
    throw new Error('Missing --image-id. Example: .\\scripts\\Remove-PortfolioImageRecord.ps1 -ImageId "personal-test-image"');
  }

  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(jsonBackupDir, { recursive: true });

  const galleryImages = await readJson(galleryJsonPath, []);
  const heroSlides = await readJson(heroSlidesJsonPath, []);

  if (!Array.isArray(galleryImages)) {
    throw new Error('src/data/galleryImages.json must be an array.');
  }

  if (!Array.isArray(heroSlides)) {
    throw new Error('src/data/heroSlides.json must be an array.');
  }

  const image = galleryImages.find((candidate) => candidate.id === imageId);

  if (!image) {
    throw new Error(`No image record found for id: ${imageId}`);
  }

  const remainingImages = galleryImages.filter((candidate) => candidate.id !== imageId);
  const removedHeroSlides = heroSlides.filter((slide) => slide.imageId === imageId);
  const remainingHeroSlides = heroSlides.filter((slide) => slide.imageId !== imageId);

  const fileRows = [];
  const seenPaths = new Set();

  for (const field of imageFields) {
    const publicUrl = image[field];
    const localPath = publicUrlToLocalPath(publicUrl);

    if (!localPath || seenPaths.has(localPath)) {
      continue;
    }

    seenPaths.add(localPath);

    const exists = existsSync(localPath);
    const archivePath = path.join(
      archiveRoot,
      `removed-images-${started}`,
      localPathToProjectRelative(localPath)
    );

    fileRows.push({
      imageId,
      field,
      publicUrl,
      localPath,
      projectRelativePath: localPathToProjectRelative(localPath),
      exists,
      archivePath,
      action: keepFiles ? 'keep-file' : (exists ? 'archive-file' : 'missing-file')
    });
  }

  await writeCsv(
    path.join(reportDir, 'remove-portfolio-image-record-files.csv'),
    fileRows,
    ['imageId', 'field', 'publicUrl', 'localPath', 'projectRelativePath', 'exists', 'archivePath', 'action']
  );

  const planLines = [
    'Remove portfolio image record plan',
    `Generated: ${started}`,
    '',
    `Image id:             ${imageId}`,
    `Title:                ${image.title ?? ''}`,
    `Category:             ${image.category ?? ''}`,
    `Apply enabled:        ${apply}`,
    `Keep files:           ${keepFiles}`,
    `Rendition files:      ${fileRows.length}`,
    `Hero slides removed:  ${removedHeroSlides.length}`,
    '',
    'Files:'
  ];

  if (fileRows.length === 0) {
    planLines.push('No local public image files found in the record fields.');
  } else {
    for (const row of fileRows) {
      planLines.push(`${row.action} | ${row.projectRelativePath} -> ${localPathToProjectRelative(row.archivePath)}`);
    }
  }

  if (removedHeroSlides.length > 0) {
    planLines.push('');
    planLines.push('Hero slides that would be removed:');
    for (const slide of removedHeroSlides) {
      planLines.push(JSON.stringify(slide));
    }
  }

  await fs.writeFile(path.join(reportDir, 'remove-portfolio-image-record-plan.txt'), `${planLines.join('\n')}\n`, 'utf8');

  if (apply) {
    const galleryBackupPath = path.join(jsonBackupDir, `galleryImages-before-remove-${imageId}-${started}.json`);
    const heroBackupPath = path.join(jsonBackupDir, `heroSlides-before-remove-${imageId}-${started}.json`);

    await fs.copyFile(galleryJsonPath, galleryBackupPath);
    await fs.copyFile(heroSlidesJsonPath, heroBackupPath);

    await fs.writeFile(galleryJsonPath, `${JSON.stringify(remainingImages, null, 2)}\n`, 'utf8');
    await fs.writeFile(heroSlidesJsonPath, `${JSON.stringify(remainingHeroSlides, null, 2)}\n`, 'utf8');

    if (!keepFiles) {
      for (const row of fileRows) {
        if (!row.exists) {
          continue;
        }

        await ensureDirectoryFor(row.archivePath);
        await fs.rename(row.localPath, row.archivePath);
        await removeEmptyDirectories(path.dirname(row.localPath), path.join(projectRoot, 'public', 'images'));
      }
    }
  }

  const summary = [
    'Remove portfolio image record summary',
    `Generated: ${started}`,
    '',
    `Image id:             ${imageId}`,
    `Record found:          true`,
    `Apply enabled:         ${apply}`,
    `Keep files:            ${keepFiles}`,
    `Rendition files:       ${fileRows.length}`,
    `Existing files:        ${fileRows.filter((row) => row.exists).length}`,
    `Hero slides removed:   ${removedHeroSlides.length}`,
    '',
    'Reports:',
    'asset-reports/remove-portfolio-image-record-plan.txt',
    'asset-reports/remove-portfolio-image-record-files.csv'
  ];

  await fs.writeFile(path.join(reportDir, 'remove-portfolio-image-record-summary.txt'), `${summary.join('\n')}\n`, 'utf8');

  console.log('');
  console.log('Remove portfolio image record');
  console.log('');
  console.log(`Image id:            ${imageId}`);
  console.log(`Title:               ${image.title ?? ''}`);
  console.log(`Apply enabled:       ${apply}`);
  console.log(`Keep files:          ${keepFiles}`);
  console.log(`Rendition files:     ${fileRows.length}`);
  console.log(`Existing files:      ${fileRows.filter((row) => row.exists).length}`);
  console.log(`Hero slides removed: ${removedHeroSlides.length}`);
  console.log('');
  console.log('Reports written to asset-reports/:');
  console.log('- remove-portfolio-image-record-plan.txt');
  console.log('- remove-portfolio-image-record-files.csv');
  console.log('- remove-portfolio-image-record-summary.txt');
  console.log('');

  if (!apply) {
    console.log('Dry run only. Re-run with -Apply after reviewing the plan.');
  }
}

main().catch((error) => {
  console.error('');
  console.error(error.message);
  process.exit(1);
});
