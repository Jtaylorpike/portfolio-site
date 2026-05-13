// Grid/footprint helpers for the local gallery curation editor.
// The runtime gallery still stores meter positions, but the editor now treats
// placement as a voxel-style floor grid: every wall occupies full grid squares.

export const GALLERY_GRID_CELL_METERS = 0.5;
export const GALLERY_GRID_MIN_METERS = -16;
export const GALLERY_GRID_MAX_METERS = 16;
export const GALLERY_GRID_MIN_CELLS = Math.round(GALLERY_GRID_MIN_METERS / GALLERY_GRID_CELL_METERS);
export const GALLERY_GRID_MAX_CELLS = Math.round(GALLERY_GRID_MAX_METERS / GALLERY_GRID_CELL_METERS);
export const GALLERY_GRID_TOTAL_CELLS = GALLERY_GRID_MAX_CELLS - GALLERY_GRID_MIN_CELLS + 1;

export const GALLERY_SUPPORTED_ROTATIONS_DEGREES = [-180, -135, -90, -45, 0, 45, 90, 135, 180];

export const GALLERY_WALL_FOOTPRINTS = {
  "feature-wall": {
    label: "Feature wall",
    lengthCells: 13,
    thicknessCells: 1
  },
  "wide-display-wall": {
    label: "Wide display wall",
    lengthCells: 11,
    thicknessCells: 1
  },
  "standard-display-wall": {
    label: "Standard display wall",
    lengthCells: 7,
    thicknessCells: 1
  },
  "compact-display-wall": {
    label: "Compact display wall",
    lengthCells: 5,
    thicknessCells: 1
  },
  "narrow-transition-wall": {
    label: "Narrow transition wall",
    lengthCells: 3,
    thicknessCells: 1
  }
};

export function isGalleryWallPlaced(record) {
  return record?.placedInGallery !== false;
}

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

  const normalized = ((numberValue % 360) + 360) % 360;
  const signed = normalized > 180 ? normalized - 360 : normalized;
  const closest = GALLERY_SUPPORTED_ROTATIONS_DEGREES.reduce((current, candidate) => {
    return Math.abs(candidate - signed) < Math.abs(current - signed) ? candidate : current;
  }, 0);

  return closest === -180 ? 180 : closest;
}

export function rotateGalleryWallDegrees(value, delta) {
  return normalizeRotationDegrees(normalizeRotationDegrees(value) + Number(delta || 0));
}

export function flipGalleryWallDegrees(value) {
  return rotateGalleryWallDegrees(value, 180);
}

export function normalizeWallType(value) {
  return GALLERY_WALL_FOOTPRINTS[value] ? value : "standard-display-wall";
}

function getGalleryWallAxisStep(rotationYDegrees) {
  const rotation = normalizeRotationDegrees(rotationYDegrees);
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

function getPerpendicularStep(axisStep) {
  return {
    dx: -axisStep.dz,
    dz: axisStep.dx
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

export function getGalleryWallFootprintCells(record) {
  const gridX = Number.isFinite(Number(record?.gridX))
    ? clampGridIndex(record.gridX)
    : metersToGrid(record?.positionX);
  const gridZ = Number.isFinite(Number(record?.gridZ))
    ? clampGridIndex(record.gridZ)
    : metersToGrid(record?.positionZ);
  const rotationYDegrees = normalizeRotationDegrees(record?.rotationYDegrees);
  const wallType = normalizeWallType(record?.wallType);
  const footprint = GALLERY_WALL_FOOTPRINTS[wallType];
  const axis = getGalleryWallAxisStep(rotationYDegrees);
  const perpendicular = getPerpendicularStep(axis);
  const lengthOffsets = makeCenteredOffsets(footprint.lengthCells);
  const thicknessOffsets = makeCenteredOffsets(footprint.thicknessCells);
  const cellsByKey = new Map();

  lengthOffsets.forEach((lengthOffset) => {
    thicknessOffsets.forEach((thicknessOffset) => {
      const x = gridX + axis.dx * lengthOffset + perpendicular.dx * thicknessOffset;
      const z = gridZ + axis.dz * lengthOffset + perpendicular.dz * thicknessOffset;
      const key = `${x}:${z}`;

      cellsByKey.set(key, { x, z });
    });
  });

  return Array.from(cellsByKey.values()).sort((first, second) => {
    if (first.z !== second.z) {
      return second.z - first.z;
    }

    return first.x - second.x;
  });
}

export function isGalleryGridCellInsideBounds(cell) {
  return cell.x >= GALLERY_GRID_MIN_CELLS
    && cell.x <= GALLERY_GRID_MAX_CELLS
    && cell.z >= GALLERY_GRID_MIN_CELLS
    && cell.z <= GALLERY_GRID_MAX_CELLS;
}

export function isGalleryWallFootprintInsideBounds(record) {
  return getGalleryWallFootprintCells(record).every(isGalleryGridCellInsideBounds);
}

export function findGalleryPlacementBoundaryViolations(records) {
  return (records ?? [])
    .filter(Boolean)
    .filter(isGalleryWallPlaced)
    .map((record) => ({
      wallId: String(record.wallId ?? "").trim(),
      cells: getGalleryWallFootprintCells(record)
    }))
    .filter((item) => item.wallId)
    .filter((item) => item.cells.some((cell) => !isGalleryGridCellInsideBounds(cell)))
    .map((item) => ({ wallId: item.wallId }));
}

export function getGalleryPlacementBoundaryIds(records) {
  return new Set(findGalleryPlacementBoundaryViolations(records).map((item) => item.wallId));
}

export function getGalleryWallFootprintBounds(record) {
  const cells = getGalleryWallFootprintCells(record);
  const fallbackX = Number.isFinite(Number(record?.gridX)) ? clampGridIndex(record.gridX) : metersToGrid(record?.positionX);
  const fallbackZ = Number.isFinite(Number(record?.gridZ)) ? clampGridIndex(record.gridZ) : metersToGrid(record?.positionZ);

  if (!cells.length) {
    return {
      minGridX: fallbackX,
      maxGridX: fallbackX,
      minGridZ: fallbackZ,
      maxGridZ: fallbackZ,
      widthCells: 1,
      depthCells: 1
    };
  }

  const xs = cells.map((cell) => cell.x);
  const zs = cells.map((cell) => cell.z);
  const minGridX = Math.min(...xs);
  const maxGridX = Math.max(...xs);
  const minGridZ = Math.min(...zs);
  const maxGridZ = Math.max(...zs);

  return {
    minGridX,
    maxGridX,
    minGridZ,
    maxGridZ,
    widthCells: maxGridX - minGridX + 1,
    depthCells: maxGridZ - minGridZ + 1
  };
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
  const cells = getGalleryWallFootprintCells({
    ...record,
    gridX,
    gridZ,
    rotationYDegrees,
    wallType
  });
  const bounds = getGalleryWallFootprintBounds({
    ...record,
    gridX,
    gridZ,
    rotationYDegrees,
    wallType
  });

  return {
    gridX,
    gridZ,
    positionX,
    positionZ,
    rotationYDegrees,
    wallType,
    footprint,
    placedInGallery: isGalleryWallPlaced(record),
    lengthCells: footprint.lengthCells,
    thicknessCells: footprint.thicknessCells,
    occupiedWidthCells: bounds.widthCells,
    occupiedDepthCells: bounds.depthCells,
    cells,
    ...bounds
  };
}

export function getGalleryWallFootprintLabel(record) {
  const info = getGalleryWallGridInfo(record);
  const widthMeters = (info.occupiedWidthCells * GALLERY_GRID_CELL_METERS).toFixed(1);
  const depthMeters = (info.occupiedDepthCells * GALLERY_GRID_CELL_METERS).toFixed(1);
  const lengthText = `${info.lengthCells} × ${info.thicknessCells} block${info.lengthCells * info.thicknessCells === 1 ? "" : "s"}`;

  if (!info.placedInGallery) {
    return `Not placed on the floor map / ${lengthText} when placed`;
  }

  return `${lengthText} / bounding area ${info.occupiedWidthCells} × ${info.occupiedDepthCells} grid cells / ${widthMeters}m × ${depthMeters}m`;
}

function cellSetsOverlap(firstCells, secondCells) {
  const firstKeys = new Set(firstCells.map((cell) => `${cell.x}:${cell.z}`));

  return secondCells.some((cell) => firstKeys.has(`${cell.x}:${cell.z}`));
}

export function findGalleryPlacementCollisions(records) {
  const normalizedRecords = (records ?? [])
    .filter(Boolean)
    .filter(isGalleryWallPlaced)
    .map((record) => ({
      record,
      wallId: String(record.wallId ?? "").trim(),
      cells: getGalleryWallFootprintCells(record)
    }))
    .filter((item) => item.wallId);
  const collisions = [];

  for (let firstIndex = 0; firstIndex < normalizedRecords.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < normalizedRecords.length; secondIndex += 1) {
      const first = normalizedRecords[firstIndex];
      const second = normalizedRecords[secondIndex];

      if (cellSetsOverlap(first.cells, second.cells)) {
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

export function galleryGridCellToPercent(value, invert = false) {
  const safeValue = clampGridIndex(value);
  const offset = invert
    ? GALLERY_GRID_MAX_CELLS - safeValue
    : safeValue - GALLERY_GRID_MIN_CELLS;
  const percent = Math.max(0, Math.min(100, (offset / GALLERY_GRID_TOTAL_CELLS) * 100));

  return `${percent.toFixed(3)}%`;
}

export function galleryGridSizeToPercent(value) {
  const percent = Math.max(0, Math.min(100, (Number(value) / GALLERY_GRID_TOTAL_CELLS) * 100));

  return `${percent.toFixed(3)}%`;
}
