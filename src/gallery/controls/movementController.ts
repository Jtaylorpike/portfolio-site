// Handles first-person movement inside the gallery.
//
// This file owns:
// - WASD / arrow key movement state
// - frame delta timing
// - gallery boundary limits
// - touch/analog movement state
// - wall collision
// - wall sliding

import * as THREE from 'three';
import {
  galleryMovementZones,
  galleryStart,
  galleryWalls,
  type ResolvedGalleryWall
} from '../artwork/galleryLayout';

type MovementState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
};

export class MovementController {
  private movement: MovementState = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  private lastFrameTime = performance.now();
  private touchMovementX = 0;
  private touchMovementZ = 0;
  private running = false;

  // Interior wall-block collision only.
  // Exterior room-shell distance is controlled by movementBounds in
  // galleryBlueprint.ts so perimeter-wall tuning does not make the editable
  // gallery wall blocks feel too tight or too loose.
  private wallCollisionRadius = 0.52;
  private speed = 3.35;
  private touchSpeedMultiplier = 0.94;

  public getFrameDelta(timestamp?: number) {
    const currentTime = timestamp ?? performance.now();
    const delta = (currentTime - this.lastFrameTime) / 1000;

    this.lastFrameTime = currentTime;

    return Math.min(delta, 0.05);
  }

  public handleKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight':
        this.running = true;
        return true;

      case 'KeyW':
      case 'ArrowUp':
        this.movement.forward = true;
        return true;

      case 'KeyS':
      case 'ArrowDown':
        this.movement.backward = true;
        return true;

      case 'KeyA':
      case 'ArrowLeft':
        this.movement.left = true;
        return true;

      case 'KeyD':
      case 'ArrowRight':
        this.movement.right = true;
        return true;

      default:
        return false;
    }
  }

  public handleKeyUp(event: KeyboardEvent) {
    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight':
        this.running = false;
        return true;

      case 'KeyW':
      case 'ArrowUp':
        this.movement.forward = false;
        return true;

      case 'KeyS':
      case 'ArrowDown':
        this.movement.backward = false;
        return true;

      case 'KeyA':
      case 'ArrowLeft':
        this.movement.left = false;
        return true;

      case 'KeyD':
      case 'ArrowRight':
        this.movement.right = false;
        return true;

      default:
        return false;
    }
  }

  public setTouchMovement(localX: number, localZ: number) {
    this.touchMovementX = this.shapeAnalogValue(localX);
    this.touchMovementZ = this.shapeAnalogValue(localZ);
  }

  public clearTouchMovement() {
    this.touchMovementX = 0;
    this.touchMovementZ = 0;
  }

  public reset() {
    this.movement.forward = false;
    this.movement.backward = false;
    this.movement.left = false;
    this.movement.right = false;
    this.running = false;
    this.clearTouchMovement();
  }

  public update(camera: THREE.PerspectiveCamera, yaw: number, delta: number) {
    const direction = this.getMovementDirection(yaw);

    if (direction.lengthSq() === 0) {
      return;
    }

    const currentPosition = camera.position.clone();
    const movementSpeed = (this.hasTouchMovement() ? this.speed * this.touchSpeedMultiplier : this.speed)
      * (this.running ? 1.85 : 1);
    const nextPosition = currentPosition.clone().addScaledVector(direction, movementSpeed * delta);
    nextPosition.y = galleryStart.position[1];

    if (this.isInsideMovementZone(nextPosition) && !this.isCollidingWithWall(nextPosition)) {
      camera.position.copy(nextPosition);
      return;
    }

    // Try sliding on the X axis if the full movement hits a wall.
    const xOnlyPosition = currentPosition.clone();
    xOnlyPosition.x = nextPosition.x;
    xOnlyPosition.y = galleryStart.position[1];

    if (this.isInsideMovementZone(xOnlyPosition) && !this.isCollidingWithWall(xOnlyPosition)) {
      camera.position.copy(xOnlyPosition);
      return;
    }

    // Try sliding on the Z axis if X movement is blocked.
    const zOnlyPosition = currentPosition.clone();
    zOnlyPosition.z = nextPosition.z;
    zOnlyPosition.y = galleryStart.position[1];

    if (this.isInsideMovementZone(zOnlyPosition) && !this.isCollidingWithWall(zOnlyPosition)) {
      camera.position.copy(zOnlyPosition);
    }
  }

  private getMovementDirection(yaw: number) {
    const direction = new THREE.Vector3();

    direction.x += this.touchMovementX;
    direction.z += this.touchMovementZ;

    if (this.movement.forward) {
      direction.z -= 1;
    }

    if (this.movement.backward) {
      direction.z += 1;
    }

    if (this.movement.left) {
      direction.x -= 1;
    }

    if (this.movement.right) {
      direction.x += 1;
    }

    if (direction.lengthSq() === 0) {
      return direction;
    }

    if (direction.lengthSq() > 1) {
      direction.normalize();
    }

    // Movement follows camera yaw only.
    // Pitch is ignored so looking up/down does not affect walking direction.
    const yawOnly = new THREE.Euler(0, yaw, 0, 'YXZ');
    direction.applyEuler(yawOnly);

    return direction;
  }

  private hasTouchMovement() {
    return Math.abs(this.touchMovementX) > 0.001 || Math.abs(this.touchMovementZ) > 0.001;
  }

  private shapeAnalogValue(value: number) {
    if (!Number.isFinite(value)) {
      return 0;
    }

    const clamped = Math.max(-1, Math.min(1, value));
    const magnitude = Math.abs(clamped);
    const deadZone = 0.1;

    if (magnitude < deadZone) {
      return 0;
    }

    const normalized = (magnitude - deadZone) / (1 - deadZone);
    const curved = Math.pow(normalized, 1.02);

    return Math.sign(clamped) * curved;
  }

  private isInsideMovementZone(position: THREE.Vector3) {
    return galleryMovementZones.some((zone) =>
      position.x >= zone.minX &&
      position.x <= zone.maxX &&
      position.z >= zone.minZ &&
      position.z <= zone.maxZ
    );
  }

  private isCollidingWithWall(position: THREE.Vector3) {
    return galleryWalls.some((wall) => this.isInsideWallCollisionBox(position, wall));
  }

  private isInsideWallCollisionBox(position: THREE.Vector3, wall: ResolvedGalleryWall) {
    const dx = position.x - wall.position[0];
    const dz = position.z - wall.position[2];

    const cos = Math.cos(-wall.rotationY);
    const sin = Math.sin(-wall.rotationY);

    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;

    const halfWidth = wall.width / 2 + this.wallCollisionRadius;
    const halfThickness = wall.thickness / 2 + this.wallCollisionRadius;

    return Math.abs(localX) < halfWidth && Math.abs(localZ) < halfThickness;
  }
}
