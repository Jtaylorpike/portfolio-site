// Handles first-person movement inside the gallery.
//
// This file owns:
// - WASD / arrow key movement state
// - frame delta timing
// - gallery boundary limits
// - wall collision
// - wall sliding

import * as THREE from 'three';
import {
  galleryMovementBounds,
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
  private wallCollisionRadius = 0.36;
  private speed = 3.35;

  public getFrameDelta(timestamp?: number) {
    const currentTime = timestamp ?? performance.now();
    const delta = (currentTime - this.lastFrameTime) / 1000;

    this.lastFrameTime = currentTime;

    return Math.min(delta, 0.05);
  }

  public handleKeyDown(event: KeyboardEvent) {
    switch (event.code) {
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

  public reset() {
    this.movement.forward = false;
    this.movement.backward = false;
    this.movement.left = false;
    this.movement.right = false;
  }

  public update(camera: THREE.PerspectiveCamera, yaw: number, delta: number) {
    const direction = this.getMovementDirection(yaw);

    if (direction.lengthSq() === 0) {
      return;
    }

    const currentPosition = camera.position.clone();
    const nextPosition = currentPosition.clone().addScaledVector(direction, this.speed * delta);

    this.clampToGalleryBounds(nextPosition);

    if (!this.isCollidingWithWall(nextPosition)) {
      camera.position.copy(nextPosition);
      return;
    }

    // Try sliding on the X axis if the full movement hits a wall.
    const xOnlyPosition = currentPosition.clone();
    xOnlyPosition.x = nextPosition.x;
    this.clampToGalleryBounds(xOnlyPosition);

    if (!this.isCollidingWithWall(xOnlyPosition)) {
      camera.position.copy(xOnlyPosition);
      return;
    }

    // Try sliding on the Z axis if X movement is blocked.
    const zOnlyPosition = currentPosition.clone();
    zOnlyPosition.z = nextPosition.z;
    this.clampToGalleryBounds(zOnlyPosition);

    if (!this.isCollidingWithWall(zOnlyPosition)) {
      camera.position.copy(zOnlyPosition);
    }
  }

  private getMovementDirection(yaw: number) {
    const direction = new THREE.Vector3();

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

    direction.normalize();

    // Movement follows camera yaw only.
    // Pitch is ignored so looking up/down does not affect walking direction.
    const yawOnly = new THREE.Euler(0, yaw, 0, 'YXZ');
    direction.applyEuler(yawOnly);

    return direction;
  }

  private clampToGalleryBounds(position: THREE.Vector3) {
    position.x = Math.max(galleryMovementBounds.minX, Math.min(galleryMovementBounds.maxX, position.x));
    position.z = Math.max(galleryMovementBounds.minZ, Math.min(galleryMovementBounds.maxZ, position.z));
    position.y = galleryStart.position[1];

    return position;
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
