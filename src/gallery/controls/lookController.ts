// Handles first-person look controls for the 3D gallery.
//
// Desktop uses pointer lock and mouse movement.
// Touch/coarse input uses direct drag-to-look on the gallery canvas.

import * as THREE from 'three';

type LookControllerOptions = {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  initialYaw: number;
  inputMode?: 'desktop' | 'touch';
};

export class LookController {
  private canvas: HTMLCanvasElement;
  private camera: THREE.PerspectiveCamera;
  private inputMode: 'desktop' | 'touch';

  private yaw: number;
  private pitch = 0;
  private isPointerLocked = false;
  private activeTouchLookPointerId: number | null = null;
  private lastTouchLookX = 0;
  private lastTouchLookY = 0;
  private sensitivity = 0.002;
  private touchSensitivity = 0.0041;
  private maxTouchLookDelta = 52;

  constructor(options: LookControllerOptions) {
    this.canvas = options.canvas;
    this.camera = options.camera;
    this.inputMode = options.inputMode ?? 'desktop';
    this.yaw = options.initialYaw;

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
  }

  public bindEvents() {
    this.canvas.addEventListener('click', this.handleCanvasClick);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    document.addEventListener('mousemove', this.handleMouseMove);

    if (this.inputMode === 'touch') {
      this.canvas.addEventListener('pointerdown', this.handleTouchLookStart);
      this.canvas.addEventListener('pointermove', this.handleTouchLookMove);
      this.canvas.addEventListener('pointerup', this.handleTouchLookEnd);
      this.canvas.addEventListener('pointercancel', this.handleTouchLookEnd);
      this.canvas.addEventListener('lostpointercapture', this.handleTouchLookEnd);
    }
  }

  public unbindEvents() {
    this.canvas.removeEventListener('click', this.handleCanvasClick);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    document.removeEventListener('mousemove', this.handleMouseMove);

    if (this.inputMode === 'touch') {
      this.canvas.removeEventListener('pointerdown', this.handleTouchLookStart);
      this.canvas.removeEventListener('pointermove', this.handleTouchLookMove);
      this.canvas.removeEventListener('pointerup', this.handleTouchLookEnd);
      this.canvas.removeEventListener('pointercancel', this.handleTouchLookEnd);
      this.canvas.removeEventListener('lostpointercapture', this.handleTouchLookEnd);
    }
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
    if (this.inputMode === 'touch') {
      return;
    }

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

    this.applyLookDelta(event.movementX, event.movementY, this.sensitivity);
  };

  private handleTouchLookStart = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' || this.activeTouchLookPointerId !== null) {
      return;
    }

    this.activeTouchLookPointerId = event.pointerId;
    this.lastTouchLookX = event.clientX;
    this.lastTouchLookY = event.clientY;
    this.canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  private handleTouchLookMove = (event: PointerEvent) => {
    if (event.pointerId !== this.activeTouchLookPointerId) {
      return;
    }

    const deltaX = this.clampTouchDelta(event.clientX - this.lastTouchLookX);
    const deltaY = this.clampTouchDelta(event.clientY - this.lastTouchLookY);

    this.lastTouchLookX = event.clientX;
    this.lastTouchLookY = event.clientY;
    this.applyLookDelta(deltaX, deltaY, this.touchSensitivity);
    event.preventDefault();
  };

  private handleTouchLookEnd = (event: PointerEvent) => {
    if (event.pointerId !== this.activeTouchLookPointerId) {
      return;
    }

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }

    this.activeTouchLookPointerId = null;
    event.preventDefault();
  };

  private clampTouchDelta(value: number) {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(-this.maxTouchLookDelta, Math.min(this.maxTouchLookDelta, value));
  }

  private applyLookDelta(deltaX: number, deltaY: number, sensitivity: number) {
    this.yaw -= deltaX * sensitivity;
    this.pitch -= deltaY * sensitivity;

    const maxPitch = Math.PI / 2 - 0.1;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
