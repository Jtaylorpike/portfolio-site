// Data-backed gallery room settings.
//
// The virtual gallery still renders the same square room by default, but the
// dimensions, shell settings, movement bounds, and starting camera position now
// live in JSON so the room can eventually become larger or less rectangular
// without scattering hardcoded numbers across the Three.js scene.

import galleryRoomJson from './galleryRoom.json';

export type GalleryRoomShape = 'rectangle' | 'l-shaped' | 'custom-footprint';

export type GalleryRoomGridSettings = {
  cellMeters: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type GalleryRoomFloorSettings = {
  width: number;
  depth: number;
  color: number;
};

export type GalleryRoomShellSettings = {
  height: number;
  wallThickness: number;
  ceilingThickness: number;
};

export type GalleryRoomMovementBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type GalleryRoomStartSettings = {
  position: [number, number, number];
  yaw: number;
};

export type GalleryLayoutModule = {
  id: string;
  label: string;
  kind: 'room' | 'hallway';
  center: [number, number];
  width: number;
  depth: number;
  lengthPreset?: 'short' | 'long';
  startConnectionStyle?: 'centered' | 'left' | 'right' | 'corner';
  endConnectionStyle?: 'centered' | 'left' | 'right' | 'corner';
};

export type GalleryRoomSettings = {
  schemaVersion: number;
  id: string;
  label: string;
  defaultRoomId: string;
  shape: GalleryRoomShape;
  grid: GalleryRoomGridSettings;
  floor: GalleryRoomFloorSettings;
  shell: GalleryRoomShellSettings;
  movementBounds: GalleryRoomMovementBounds;
  start: GalleryRoomStartSettings;
  layout: GalleryLayoutModule[];
};

type RawRecord = Record<string, unknown>;

const defaultGalleryRoomSettings: GalleryRoomSettings = {
  schemaVersion: 1,
  id: 'main-gallery-room',
  label: 'Main gallery room',
  defaultRoomId: 'room-main',
  shape: 'rectangle',
  grid: {
    cellMeters: 0.5,
    minX: -16,
    maxX: 16,
    minZ: -16,
    maxZ: 16
  },
  floor: {
    width: 34,
    depth: 34,
    color: 0xd8d0c3
  },
  shell: {
    height: 3.9,
    wallThickness: 0.34,
    ceilingThickness: 0.12
  },
  movementBounds: {
    minX: -16.3,
    maxX: 16.3,
    minZ: -16.3,
    maxZ: 16.3
  },
  start: {
    position: [0, 1.65, 13.4],
    yaw: 0
  },
  layout: [{
    id: 'room-main',
    label: 'Main collection room',
    kind: 'room',
    center: [0, 0],
    width: 34,
    depth: 34
  }]
};

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getRecord(value: unknown): RawRecord {
  return isRecord(value) ? value : {};
}

function cleanString(value: unknown, fallback: string): string {
  const stringValue = typeof value === 'string' ? value.trim() : '';

  return stringValue || fallback;
}

function cleanNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  const numberValue = Number(value);
  let resolved = Number.isFinite(numberValue) ? numberValue : fallback;

  if (Number.isFinite(min)) {
    resolved = Math.max(min as number, resolved);
  }

  if (Number.isFinite(max)) {
    resolved = Math.min(max as number, resolved);
  }

  return Number(resolved.toFixed(4));
}

function cleanShape(value: unknown): GalleryRoomShape {
  const stringValue = cleanString(value, defaultGalleryRoomSettings.shape);

  if (stringValue === 'rectangle' || stringValue === 'l-shaped' || stringValue === 'custom-footprint') {
    return stringValue;
  }

  return defaultGalleryRoomSettings.shape;
}

function cleanColor(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const cleanValue = value.trim();

    if (/^#[0-9a-f]{6}$/i.test(cleanValue)) {
      return Number.parseInt(cleanValue.slice(1), 16);
    }

    if (/^0x[0-9a-f]{6}$/i.test(cleanValue)) {
      return Number.parseInt(cleanValue.slice(2), 16);
    }
  }

  return fallback;
}

function cleanPosition(value: unknown, fallback: [number, number, number]): [number, number, number] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return [
    cleanNumber(value[0], fallback[0]),
    cleanNumber(value[1], fallback[1], 0.2, 3.2),
    cleanNumber(value[2], fallback[2])
  ];
}

function cleanCenter(value: unknown, fallback: [number, number]): [number, number] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return [
    cleanNumber(value[0], fallback[0]),
    cleanNumber(value[1], fallback[1])
  ];
}

function normalizeLayout(record: RawRecord): GalleryLayoutModule[] {
  const layoutRecord = getRecord(record.layout);
  const roomRecords = Array.isArray(layoutRecord.rooms) ? layoutRecord.rooms : [];
  const hallwayRecords = Array.isArray(layoutRecord.hallways) ? layoutRecord.hallways : [];
  const normalizeModule = (
    value: unknown,
    index: number,
    kind: GalleryLayoutModule['kind']
  ): GalleryLayoutModule | null => {
    const moduleRecord = getRecord(value);
    const id = cleanString(moduleRecord.id, `${kind}-${index + 1}`);

    if (!id) {
      return null;
    }

    const module: GalleryLayoutModule = {
      id,
      label: cleanString(moduleRecord.label, id),
      kind,
      center: cleanCenter(moduleRecord.center, [0, 0]),
      width: cleanNumber(moduleRecord.width, kind === 'room' ? 34 : 7, 2),
      depth: cleanNumber(moduleRecord.depth, kind === 'room' ? 34 : 7, 2)
    };

    if (kind === 'hallway') {
      module.lengthPreset = moduleRecord.lengthPreset === 'long' ? 'long' : 'short';
      const legacyStyle = cleanString(moduleRecord.connectionStyle, 'centered');
      const cleanConnectionStyle = (value: unknown) => {
        const style = cleanString(value, legacyStyle);
        return style === 'left' || style === 'right' || style === 'corner' ? style : 'centered';
      };
      module.startConnectionStyle = cleanConnectionStyle(moduleRecord.startConnectionStyle);
      module.endConnectionStyle = cleanConnectionStyle(moduleRecord.endConnectionStyle);
    }

    return module;
  };
  const modules = [
    ...roomRecords.map((value, index) => normalizeModule(value, index, 'room')),
    ...hallwayRecords.map((value, index) => normalizeModule(value, index, 'hallway'))
  ].filter((module): module is GalleryLayoutModule => Boolean(module));

  return modules.length > 0 ? modules : defaultGalleryRoomSettings.layout;
}

function ensureOrderedBounds(min: number, max: number, fallbackMin: number, fallbackMax: number) {
  if (min >= max) {
    return { min: fallbackMin, max: fallbackMax };
  }

  return { min, max };
}

export function normalizeGalleryRoomSettings(value: unknown): GalleryRoomSettings {
  const record = getRecord(value);
  const gridRecord = getRecord(record.grid);
  const floorRecord = getRecord(record.floor);
  const shellRecord = getRecord(record.shell);
  const movementRecord = getRecord(record.movementBounds);
  const startRecord = getRecord(record.start);

  const gridX = ensureOrderedBounds(
    cleanNumber(gridRecord.minX, defaultGalleryRoomSettings.grid.minX),
    cleanNumber(gridRecord.maxX, defaultGalleryRoomSettings.grid.maxX),
    defaultGalleryRoomSettings.grid.minX,
    defaultGalleryRoomSettings.grid.maxX
  );
  const gridZ = ensureOrderedBounds(
    cleanNumber(gridRecord.minZ, defaultGalleryRoomSettings.grid.minZ),
    cleanNumber(gridRecord.maxZ, defaultGalleryRoomSettings.grid.maxZ),
    defaultGalleryRoomSettings.grid.minZ,
    defaultGalleryRoomSettings.grid.maxZ
  );
  const movementX = ensureOrderedBounds(
    cleanNumber(movementRecord.minX, defaultGalleryRoomSettings.movementBounds.minX),
    cleanNumber(movementRecord.maxX, defaultGalleryRoomSettings.movementBounds.maxX),
    defaultGalleryRoomSettings.movementBounds.minX,
    defaultGalleryRoomSettings.movementBounds.maxX
  );
  const movementZ = ensureOrderedBounds(
    cleanNumber(movementRecord.minZ, defaultGalleryRoomSettings.movementBounds.minZ),
    cleanNumber(movementRecord.maxZ, defaultGalleryRoomSettings.movementBounds.maxZ),
    defaultGalleryRoomSettings.movementBounds.minZ,
    defaultGalleryRoomSettings.movementBounds.maxZ
  );

  const layout = normalizeLayout(record);
  const rooms = layout.filter((module) => module.kind === 'room');
  const requestedDefaultRoomId = cleanString(record.defaultRoomId, 'room-main');
  const defaultRoomId = rooms.some((room) => room.id === requestedDefaultRoomId)
    ? requestedDefaultRoomId
    : rooms[0]?.id ?? 'room-main';

  return {
    schemaVersion: cleanNumber(record.schemaVersion, defaultGalleryRoomSettings.schemaVersion, 1),
    id: cleanString(record.id, defaultGalleryRoomSettings.id),
    label: cleanString(record.label, defaultGalleryRoomSettings.label),
    defaultRoomId,
    shape: cleanShape(record.shape),
    grid: {
      cellMeters: cleanNumber(gridRecord.cellMeters, defaultGalleryRoomSettings.grid.cellMeters, 0.25, 2),
      minX: gridX.min,
      maxX: gridX.max,
      minZ: gridZ.min,
      maxZ: gridZ.max
    },
    floor: {
      width: cleanNumber(floorRecord.width, defaultGalleryRoomSettings.floor.width, 4),
      depth: cleanNumber(floorRecord.depth, defaultGalleryRoomSettings.floor.depth, 4),
      color: cleanColor(floorRecord.color, defaultGalleryRoomSettings.floor.color)
    },
    shell: {
      height: cleanNumber(shellRecord.height, defaultGalleryRoomSettings.shell.height, 2.4, 8),
      wallThickness: cleanNumber(shellRecord.wallThickness, defaultGalleryRoomSettings.shell.wallThickness, 0.05, 1),
      ceilingThickness: cleanNumber(shellRecord.ceilingThickness, defaultGalleryRoomSettings.shell.ceilingThickness, 0.02, 1)
    },
    movementBounds: {
      minX: movementX.min,
      maxX: movementX.max,
      minZ: movementZ.min,
      maxZ: movementZ.max
    },
    start: {
      position: cleanPosition(startRecord.position, defaultGalleryRoomSettings.start.position),
      yaw: cleanNumber(startRecord.yaw, defaultGalleryRoomSettings.start.yaw)
    },
    layout
  };
}

export const galleryRoomSettings = normalizeGalleryRoomSettings(galleryRoomJson);
