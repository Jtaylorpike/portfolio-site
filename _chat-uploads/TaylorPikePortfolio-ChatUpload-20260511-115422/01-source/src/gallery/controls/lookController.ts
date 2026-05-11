// Handles mouse-look and pointer lock for the 3D gallery.
//
// This file owns:
// - clicking the canvas to lock the pointer
// - pointer lock state
// - mouse movement
// - yaw and pitch values
// - camera rotation

import * as THREE from 'three';

type LookControllerOptions = {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  initialYaw: number;
};

export class LookController {
  private canvas: HTMLCanvasElement;
  private camera: THREE.PerspectiveCamera;

  private yaw: number;
  private pitch = 0;
  private isPointerLocked = false;
  private sensitivity = 0.002;

  constructor(options: LookControllerOptions) {
    this.canvas = options.canvas;
    this.camera = options.camera;
    this.yaw = options.initialYaw;

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
  }

  public bindEvents() {
    this.canvas.addEventListener('click', this.handleCanvasClick);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  public unbindEvents() {
    this.canvas.removeEventListener('click', this.handleCanvasClick);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  public getYaw() {
    return this.yaw;
  }

  public releasePointerLock() {
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
  }

  private handleCanvasClick = () => {
    if (document.pointerLockElement === this.canvas) {
      return;
    }

    try {
      const lockRequest = this.canvas.requestPointerLock();

      void Promise.resolve(lockRequest).catch(() => {
        // Pointer lock can be rejected by the browser if the click is not
        // considered a valid user gesture. The gallery still remains usable
        // through the close button and keyboard focus path.
      });
    } catch {
      // Older browsers may throw instead of returning a rejected promise.
    }
  };

  private handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
  };

  private handlePointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  };

  private handleMouseMove = (event: MouseEvent) => {
    if (!this.isPointerLocked) {
      return;
    }

    this.yaw -= event.movementX * this.sensitivity;
    this.pitch -= event.movementY * this.sensitivity;

    const maxPitch = Math.PI / 2 - 0.1;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  };
}
