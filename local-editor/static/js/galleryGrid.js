// Grid/footprint helpers for the local gallery curation editor.
// The 3D gallery still stores physical meter positions, but the editor presents
// those positions as floor-grid cells so wall placement is easier to reason about
// and unsafe overlaps can be caught before saving.

export const GALLERY_GRID_CELL_METERS = 0.5;
export const GALLERY_GRID_MIN_METERS = -16;
export const GALLERY_GRID_MAX_METERS = 16;
export const GALLERY_GRID_MIN_CELLS = Math.round(GALLERY_GRID_MIN_METERS / GALLERY_GRID_CELL_METERS);
export const GALLERY_GRID_MAX_CELLS = Math.round(GALLERY_GRID_MAX_METERS / GALLERY_GRID_CELL_METERS);
export const GALLERY_GRID_TOTAL_CELLS = GALLERY_GRID_MAX_CELLS - GALLERY_GRID_MIN_CELLS;

export const GALLERY_WALL_FOOTPRINTS = {
  "feature-wall": {
    label: "Feature wall",
    widthMeters: 6.25,
    thicknessMeters: 0.26
  },
  "wide-display-wall": {
    label: "Wide display wall",
    widthMeters: 4.9,
    thicknessMeters: 0.22
  },
  "standard-display-wall": {
    label: "Standard display wall",
    widthMeters: 3.55,
    thicknessMeters: 0.22
  },
  "compact-display-wall": {
    label: "Compact display wall",
    widthMeters: 2.7,
    thicknessMeters: 0.22
  },
  "narrow-transition-wall": {
    label: "Narrow transition wall",
    widthMeters: 2.15,
    thicknessMeters: 0.2
  }
};

export function clampGridIndex(value) {
  const numberValue = Number(value);
  const integerValue = Number.isFinite(numberValue) ? Math.round(numberValue) : 0;

  return Math.max(GALLERY_GRID_MIN_CELLS, Math.min(GALLERY_GRID_MAX_CELLS, integerValue));
}

export function metersToGrid(value) {
  const numberValue = Number(value);
  const safeValue = Number.isFinite(numberValue) ? numberValue : 0;

  return clampGridIndex(safeValue / GALLERY_GRID_CELL_METERS);
}

export function gridToMeters(value) {
  return Number((clampGridIndex(value) * GALLERY_GRID_CELL_METERS).toFixed(2));
}

export function normalizeRotationDegrees(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  const supported = [-180, -90, 0, 90, 180];
  return supported.reduce((closest, candidate) => {
    return Math.abs(candidate - numberValue) < Math.abs(closest - numberValue) ? candidate : closest;
  }, 0);
}

export function normalizeWallType(value) {
  return GALLERY_WALL_FOOTPRINTS[value] ? value : "standard-display-wall";
}

export function getGalleryWallGridInfo(record) {
  const gridX = Number.isFinite(Number(record?.gridX))
    ? clampGridIndex(record.gridX)
    : metersToGrid(record?.positionX);
  const gridZ = Number.isFinite(Number(record?.gridZ))
    ? clampGridIndex(record.gridZ)
    : metersToGrid(record?.positionZ);
  const positionX = gridToMeters(gridX);
  const positionZ = gridToMeters(gridZ);
  const rotationYDegrees = normalizeRotationDegrees(record?.rotationYDegrees);
  const wallType = normalizeWallType(record?.wallType);
  const footprint = GALLERY_WALL_FOOTPRINTS[wallType];
  const lengthCells = Math.max(1, Math.ceil(footprint.widthMeters / GALLERY_GRID_CELL_METERS));
  const thicknessCells = Math.max(1, Math.ceil(footprint.thicknessMeters / GALLERY_GRID_CELL_METERS));
  const isNorthSouthFacing = Math.abs(rotationYDegrees) === 90;
  const occupiedWidthCells = isNorthSouthFacing ? thicknessCells : lengthCells;
  const occupiedDepthCells = isNorthSouthFacing ? lengthCells : thicknessCells;

  return {
    gridX,
    gridZ,
    positionX,
    positionZ,
    rotationYDegrees,
    wallType,
    footprint,
    lengthCells,
    thicknessCells,
    occupiedWidthCells,
    occupiedDepthCells,
    minGridX: gridX - occupiedWidthCells / 2,
    maxGridX: gridX + occupiedWidthCells / 2,
    minGridZ: gridZ - occupiedDepthCells / 2,
    maxGridZ: gridZ + occupiedDepthCells / 2
  };
}

export function getGalleryWallFootprintLabel(record) {
  const info = getGalleryWallGridInfo(record);
  const widthMeters = (info.occupiedWidthCells * GALLERY_GRID_CELL_METERS).toFixed(1);
  const depthMeters = (info.occupiedDepthCells * GALLERY_GRID_CELL_METERS).toFixed(1);

  return `${info.occupiedWidthCells} × ${info.occupiedDepthCells} floor cells / ${widthMeters}m × ${depthMeters}m footprint`;
}

function footprintsOverlap(first, second) {
  return first.minGridX < second.maxGridX
    && first.maxGridX > second.minGridX
    && first.minGridZ < second.maxGridZ
    && first.maxGridZ > second.minGridZ;
}

export function findGalleryPlacementCollisions(records) {
  const normalizedRecords = (records ?? [])
    .filter(Boolean)
    .map((record) => ({
      record,
      wallId: String(record.wallId ?? "").trim(),
      info: getGalleryWallGridInfo(record)
    }))
    .filter((item) => item.wallId);
  const collisions = [];

  for (let firstIndex = 0; firstIndex < normalizedRecords.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < normalizedRecords.length; secondIndex += 1) {
      const first = normalizedRecords[firstIndex];
      const second = normalizedRecords[secondIndex];

      if (footprintsOverlap(first.info, second.info)) {
        collisions.push({
          firstWallId: first.wallId,
          secondWallId: second.wallId
        });
      }
    }
  }

  return collisions;
}

export function getGalleryPlacementCollisionIds(records) {
  const collisions = findGalleryPlacementCollisions(records);
  const ids = new Set();

  collisions.forEach((collision) => {
    ids.add(collision.firstWallId);
    ids.add(collision.secondWallId);
  });

  return ids;
}

export function getGalleryPlacementCollisionText(wallId, collisions) {
  const related = collisions
    .filter((collision) => collision.firstWallId === wallId || collision.secondWallId === wallId)
    .map((collision) => collision.firstWallId === wallId ? collision.secondWallId : collision.firstWallId);

  if (!related.length) {
    return "";
  }

  return `Placement collision: this wall overlaps ${related.join(", ")}. Move one wall to another grid cell before saving.`;
}

export function recordsHaveGalleryPlacementCollisions(records) {
  return findGalleryPlacementCollisions(records).length > 0;
}
