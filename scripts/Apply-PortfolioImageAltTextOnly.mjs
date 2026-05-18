#!/usr/bin/env node
/**
 * Updates only the "alt" string values in src/data/galleryImages.json.
 *
 * Dry run:
 *   node scripts/Apply-PortfolioImageAltTextOnly.mjs
 *
 * Apply:
 *   node scripts/Apply-PortfolioImageAltTextOnly.mjs --apply
 *
 * Optional paths:
 *   node scripts/Apply-PortfolioImageAltTextOnly.mjs --alt-text docs/alt-text/portfolio-image-alt-text-20260515.json --image-data src/data/galleryImages.json --apply
 *
 * The script intentionally performs a line-level replacement of existing alt fields
 * instead of reserializing the entire JSON file. That keeps all non-alt formatting,
 * field ordering, and data untouched.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

function hasFlag(flagName) {
  return args.includes(flagName);
}

function getArgValue(flagName, fallbackValue) {
  const index = args.indexOf(flagName);
  if (index === -1) {
    return fallbackValue;
  }

  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flagName}`);
  }

  return value;
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeAltItems(altDocument) {
  const items = [];

  if (Array.isArray(altDocument)) {
    items.push(...altDocument);
  } else {
    if (Array.isArray(altDocument.items)) {
      items.push(...altDocument.items);
    }

    // Include this optional list too. Entries that do not match the main image
    // data are reported as unmatched and are not written.
    if (Array.isArray(altDocument.unreferencedThumbnailItems)) {
      items.push(...altDocument.unreferencedThumbnailItems);
    }

    if (altDocument.alts && typeof altDocument.alts === 'object') {
      for (const [id, alt] of Object.entries(altDocument.alts)) {
        items.push({ id, alt });
      }
    }
  }

  const altMap = new Map();

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const id = String(item.id ?? '').trim();
    const alt = String(item.alt ?? '').trim();

    if (!id || !alt) {
      continue;
    }

    altMap.set(id, alt);
  }

  return altMap;
}

function parseJsonStringLiteral(innerValue) {
  return JSON.parse(`"${innerValue}"`);
}

function updateAltLines(rawText, altMap) {
  const newline = rawText.includes('\r\n') ? '\r\n' : '\n';
  const trailingNewline = rawText.endsWith('\n');
  const lines = rawText.split(/\r?\n/);

  if (trailingNewline) {
    lines.pop();
  }

  let currentId = null;
  let updatedCount = 0;
  let unchangedCount = 0;
  const seenMatchedIds = new Set();
  const imageIdsWithAltLine = new Set();

  const idLinePattern = /^(\s*)"id":\s*"((?:\\.|[^"\\])*)"\s*,?\s*$/;
  const altLinePattern = /^(\s*"alt":\s*)"(?:\\.|[^"\\])*"(\s*,?\s*)$/;

  const updatedLines = lines.map((line) => {
    const idMatch = line.match(idLinePattern);

    if (idMatch) {
      currentId = parseJsonStringLiteral(idMatch[2]);
      return line;
    }

    if (!currentId) {
      return line;
    }

    const altMatch = line.match(altLinePattern);

    if (!altMatch) {
      return line;
    }

    imageIdsWithAltLine.add(currentId);

    if (!altMap.has(currentId)) {
      return line;
    }

    const nextAlt = altMap.get(currentId);
    const nextLine = `${altMatch[1]}${JSON.stringify(nextAlt)}${altMatch[2]}`;

    seenMatchedIds.add(currentId);

    if (nextLine === line) {
      unchangedCount += 1;
      return line;
    }

    updatedCount += 1;
    return nextLine;
  });

  return {
    text: updatedLines.join(newline) + (trailingNewline ? newline : ''),
    updatedCount,
    unchangedCount,
    seenMatchedIds,
    imageIdsWithAltLine
  };
}

const projectRoot = path.resolve(getArgValue('--project-root', '.'));
const imageDataPath = path.resolve(projectRoot, getArgValue('--image-data', 'src/data/galleryImages.json'));
const altTextPath = path.resolve(projectRoot, getArgValue('--alt-text', 'docs/alt-text/portfolio-image-alt-text-20260515.json'));
const shouldApply = hasFlag('--apply');
const strict = hasFlag('--strict');
const noBackup = hasFlag('--no-backup');

if (!fs.existsSync(imageDataPath)) {
  throw new Error(`Image data file not found: ${imageDataPath}`);
}

if (!fs.existsSync(altTextPath)) {
  throw new Error(`Alt text JSON file not found: ${altTextPath}`);
}

const galleryImages = readJsonFile(imageDataPath);

if (!Array.isArray(galleryImages)) {
  throw new Error('Expected gallery image data to be a JSON array.');
}

const imageIds = galleryImages.map((image) => String(image.id ?? '').trim()).filter(Boolean);
const imageIdSet = new Set(imageIds);

if (imageIdSet.size !== imageIds.length) {
  throw new Error('Duplicate image IDs found in gallery image data. Resolve duplicates before updating alt text.');
}

const altDocument = readJsonFile(altTextPath);
const altMap = normalizeAltItems(altDocument);
const rawImageData = fs.readFileSync(imageDataPath, 'utf8');
const result = updateAltLines(rawImageData, altMap);

const missingAltTextIds = imageIds.filter((id) => !altMap.has(id));
const missingAltLineIds = imageIds.filter((id) => !result.imageIdsWithAltLine.has(id));
const unmatchedAltIds = Array.from(altMap.keys()).filter((id) => !imageIdSet.has(id));

console.log('Portfolio alt text update report');
console.log(`Image data: ${path.relative(projectRoot, imageDataPath)}`);
console.log(`Alt text JSON: ${path.relative(projectRoot, altTextPath)}`);
console.log(`Mode: ${shouldApply ? 'apply' : 'dry run'}`);
console.log(`Gallery image records: ${imageIds.length}`);
console.log(`Alt text entries loaded: ${altMap.size}`);
console.log(`Alt lines changed: ${result.updatedCount}`);
console.log(`Alt lines already current: ${result.unchangedCount}`);
console.log(`Gallery IDs missing alt text entries: ${missingAltTextIds.length}`);
console.log(`Gallery IDs missing an existing alt line: ${missingAltLineIds.length}`);
console.log(`Alt entries not matched to current gallery data: ${unmatchedAltIds.length}`);

if (missingAltTextIds.length > 0) {
  console.log('');
  console.log('Missing alt text entries:');
  for (const id of missingAltTextIds) {
    console.log(`- ${id}`);
  }
}

if (missingAltLineIds.length > 0) {
  console.log('');
  console.log('Records missing an existing alt line:');
  for (const id of missingAltLineIds) {
    console.log(`- ${id}`);
  }
}

if (unmatchedAltIds.length > 0) {
  console.log('');
  console.log('Unmatched alt entries, not written:');
  for (const id of unmatchedAltIds) {
    console.log(`- ${id}`);
  }
}

if (strict && (missingAltTextIds.length > 0 || missingAltLineIds.length > 0)) {
  throw new Error('Strict mode failed because at least one gallery image cannot be fully updated.');
}

if (!shouldApply) {
  console.log('');
  console.log('Dry run only. Re-run with --apply to write changes.');
  process.exit(0);
}

if (result.text === rawImageData) {
  console.log('');
  console.log('No file changes needed.');
  process.exit(0);
}

if (!noBackup) {
  const backupPath = `${imageDataPath}.alt-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.writeFileSync(backupPath, rawImageData, 'utf8');
  console.log(`Backup written: ${path.relative(projectRoot, backupPath)}`);
}

fs.writeFileSync(imageDataPath, result.text, 'utf8');
console.log('');
console.log('Updated only matching alt text lines.');
