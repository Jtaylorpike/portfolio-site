import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const targets = [
  ['production', path.join(projectRoot, 'src', 'data', 'galleryRoom.json')],
  ['multi-module fixture', path.join(projectRoot, 'tests', 'fixtures', 'gallery-room-multi-module.json')]
];
const epsilon = 0.03;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function boundsFor(module) {
  const [centerX, centerZ] = module.center;
  return {
    minX: centerX - module.width / 2,
    maxX: centerX + module.width / 2,
    minZ: centerZ - module.depth / 2,
    maxZ: centerZ + module.depth / 2
  };
}

function modulesConnect(first, second) {
  const a = boundsFor(first);
  const b = boundsFor(second);
  return (
    a.maxX + epsilon >= b.minX
    && b.maxX + epsilon >= a.minX
    && a.maxZ + epsilon >= b.minZ
    && b.maxZ + epsilon >= a.minZ
  );
}

function pointInside(module, x, z) {
  const bounds = boundsFor(module);
  return (
    x >= bounds.minX - epsilon
    && x <= bounds.maxX + epsilon
    && z >= bounds.minZ - epsilon
    && z <= bounds.maxZ + epsilon
  );
}

function validateLayout(name, document) {
  const rooms = Array.isArray(document.layout?.rooms)
    ? document.layout.rooms.map((module) => ({ ...module, kind: 'room' }))
    : [];
  const hallways = Array.isArray(document.layout?.hallways)
    ? document.layout.hallways.map((module) => ({ ...module, kind: 'hallway' }))
    : [];
  const modules = [...rooms, ...hallways];

  assert(rooms.length > 0, `${name}: at least one room is required.`);
  assert(modules.length > 0, `${name}: layout is empty.`);
  const defaultRoomId = typeof document.defaultRoomId === 'string' && document.defaultRoomId.trim()
    ? document.defaultRoomId
    : rooms[0].id;
  const defaultRoom = rooms.find((room) => room.id === defaultRoomId);
  assert(defaultRoom, `${name}: default room "${defaultRoomId}" does not exist.`);

  const ids = new Set();
  modules.forEach((module) => {
    assert(typeof module.id === 'string' && module.id.trim(), `${name}: every module requires an id.`);
    assert(!ids.has(module.id), `${name}: duplicate module id "${module.id}".`);
    ids.add(module.id);
    assert(
      Array.isArray(module.center)
      && module.center.length === 2
      && module.center.every(Number.isFinite),
      `${name}/${module.id}: center must contain two finite numbers.`
    );
    assert(
      Number.isFinite(module.width) && module.width >= 2
      && Number.isFinite(module.depth) && module.depth >= 2,
      `${name}/${module.id}: width and depth must be at least 2 meters.`
    );
  });

  const movement = document.movementBounds;
  assert(movement && Number.isFinite(movement.minX) && Number.isFinite(movement.maxX), `${name}: invalid movement X bounds.`);
  assert(movement && Number.isFinite(movement.minZ) && Number.isFinite(movement.maxZ), `${name}: invalid movement Z bounds.`);
  modules.forEach((module) => {
    const bounds = boundsFor(module);
    assert(
      bounds.minX >= movement.minX - epsilon
      && bounds.maxX <= movement.maxX + epsilon
      && bounds.minZ >= movement.minZ - epsilon
      && bounds.maxZ <= movement.maxZ + epsilon,
      `${name}/${module.id}: module extends outside movement bounds.`
    );
  });

  const [startX, , startZ] = document.start?.position ?? [];
  assert(Number.isFinite(startX) && Number.isFinite(startZ), `${name}: invalid start position.`);
  const startModule = modules.find((module) => pointInside(module, startX, startZ));
  assert(startModule, `${name}: start position is outside every movement module.`);
  assert(
    pointInside(defaultRoom, startX, startZ),
    `${name}: start position must be inside default room "${defaultRoomId}".`
  );

  hallways.forEach((hallway) => {
    const connections = modules.filter(
      (module) => module.id !== hallway.id && modulesConnect(hallway, module)
    );
    assert(
      connections.length >= 2,
      `${name}/${hallway.id}: hallway must connect at least two modules; found ${connections.length}.`
    );
  });

  const visited = new Set([startModule.id]);
  const queue = [startModule];
  while (queue.length) {
    const current = queue.shift();
    modules.forEach((candidate) => {
      if (!visited.has(candidate.id) && modulesConnect(current, candidate)) {
        visited.add(candidate.id);
        queue.push(candidate);
      }
    });
  }
  assert(
    visited.size === modules.length,
    `${name}: disconnected modules: ${modules.filter((module) => !visited.has(module.id)).map((module) => module.id).join(', ')}.`
  );

  return `${name}: ${rooms.length} room(s), ${hallways.length} hallway(s), connected from ${startModule.id}`;
}

for (const [name, filePath] of targets) {
  console.log(`PASS ${validateLayout(name, readJson(filePath))}`);
}
