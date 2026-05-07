// Creates and manages the 3D gallery scene.
//
// This file controls scene composition:
// - renderer
// - camera
// - floor
// - lighting
// - wall blocks
// - orientation-aware artwork frames
// - animation loop
// - cleanup

import * as THREE from 'three';
import {
  galleryArtworks,
  galleryFloor,
  galleryStart,
  galleryWalls,
  type GalleryArtwork,
  type GalleryFrameStyle,
  type ImageOrientation
} from './artwork/galleryLayout';
import {
  getCachedGalleryTexture,
  subscribeToGalleryTextureUpdates
} from './artwork/galleryTextureLoader';
import { MovementController } from './controls/movementController';
import { LookController } from './controls/lookController';
import {
  createArtworkImageMaterial,
  createFloorMaterial,
  createFrameMaterial,
  createMatMaterial,
  createWallMaterial
} from './environment/galleryMaterials';
import { addGalleryLighting } from './environment/galleryLighting';

type GallerySceneOptions = {
  container: HTMLElement;
  onExit: () => void;
  onArtworkFocus: (artwork: GalleryArtwork) => void;
  onArtworkClear: () => void;
};

type ParsedPosition = {
  x: number;
  y: number;
};

type FrameDimensions = {
  width: number;
  height: number;
};

type ArtworkMeshSet = {
  artwork: GalleryArtwork;
  frame: THREE.Mesh;
  mat: THREE.Mesh;
  image: THREE.Mesh;
};

const PORTRAIT_FRAME_ASPECT = 2 / 3;
const SQUARE_FRAME_ASPECT = 1;

const DEFAULT_SIZE_BY_STYLE = {
  landscape: 1,
  portrait: 1.15,
  square: 1.08
};

const MAX_SIZE_BY_STYLE = {
  landscape: 1,
  portrait: 1.28,
  square: 1.14
};

export class GalleryScene {
  private container: HTMLElement;
  private onExit: () => void;
  private onArtworkFocus: (artwork: GalleryArtwork) => void;
  private onArtworkClear: () => void;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId = 0;

  private raycaster = new THREE.Raycaster();
  private centerPoint = new THREE.Vector2(0, 0);
  private artworkMeshes: THREE.Mesh[] = [];
  private artworkMeshSets: ArtworkMeshSet[] = [];
  private focusedArtworkId: string | null = null;

  private movementController = new MovementController();
  private lookController!: LookController;
  private unsubscribeFromTextureUpdates: (() => void) | null = null;
  private framedTextures = new Set<THREE.Texture>();

  constructor(options: GallerySceneOptions) {
    this.container = options.container;
    this.onExit = options.onExit;
    this.onArtworkFocus = options.onArtworkFocus;
    this.onArtworkClear = options.onArtworkClear;

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();

    this.container.appendChild(this.renderer.domElement);

    this.lookController = new LookController({
      canvas: this.renderer.domElement,
      camera: this.camera,
      initialYaw: galleryStart.yaw
    });

    this.createFloor();
    this.createLights();
    this.createWalls();
    this.createArtwork();
    this.subscribeToHighResolutionTextureUpdates();
    this.bindEvents();
    this.animate();
  }

  private createScene() {
    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0xf8f7f3);

    return scene;
  }

  private createCamera() {
    const camera = new THREE.PerspectiveCamera(
      70,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      100
    );

    camera.position.set(...galleryStart.position);

    return camera;
  }

  private createRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    return renderer;
  }

  private createFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(galleryFloor.width, galleryFloor.depth),
      createFloorMaterial()
    );

    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;

    this.scene.add(floor);
  }

  private createLights() {
    addGalleryLighting(this.scene);
  }

  private createWalls() {
    const wallMaterial = createWallMaterial();

    galleryWalls.forEach((wall) => {
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(wall.width, wall.height, wall.thickness),
        wallMaterial
      );

      wallMesh.position.set(...wall.position);
      wallMesh.rotation.y = wall.rotationY;
      wallMesh.userData = {
        wallId: wall.id
      };

      this.scene.add(wallMesh);
    });
  }

  private createArtwork() {
    const frameMaterial = createFrameMaterial();
    const matMaterial = createMatMaterial();

    galleryArtworks.forEach((artwork) => {
      const highResolutionTexture = getCachedGalleryTexture(artwork.image);
      const previewTexture = artwork.previewImage
        ? getCachedGalleryTexture(artwork.previewImage)
        : null;

      const initialTexture = highResolutionTexture ?? previewTexture;
      const dimensions = this.resolveArtworkDimensions(artwork, initialTexture);

      const frame = this.createArtworkFrame(artwork, dimensions, frameMaterial);
      const mat = this.createArtworkMat(artwork, dimensions, matMaterial, frame);
      const image = this.createArtworkImage(artwork, dimensions, initialTexture, frame);

      this.scene.add(frame);
      this.scene.add(mat);
      this.scene.add(image);

      this.artworkMeshes.push(image);
      this.artworkMeshSets.push({
        artwork,
        frame,
        mat,
        image
      });
    });
  }

  private createArtworkFrame(
    artwork: GalleryArtwork,
    dimensions: FrameDimensions,
    material: THREE.Material
  ) {
    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(dimensions.width + 0.22, dimensions.height + 0.22),
      material
    );

    frame.position.set(...artwork.position);
    frame.rotation.y = artwork.rotationY;
    this.offsetArtworkFromWall(frame, artwork.rotationY, 0);

    return frame;
  }

  private createArtworkMat(
    artwork: GalleryArtwork,
    dimensions: FrameDimensions,
    material: THREE.Material,
    frame: THREE.Mesh
  ) {
    const mat = new THREE.Mesh(
      new THREE.PlaneGeometry(dimensions.width + 0.08, dimensions.height + 0.08),
      material
    );

    mat.position.copy(frame.position);
    mat.rotation.copy(frame.rotation);
    this.offsetArtworkFromWall(mat, artwork.rotationY, 0.012);

    return mat;
  }

  private createArtworkImage(
    artwork: GalleryArtwork,
    dimensions: FrameDimensions,
    sourceTexture: THREE.Texture | null,
    frame: THREE.Mesh
  ) {
    if (!sourceTexture) {
      console.warn(`Gallery texture was not preloaded: ${artwork.image}`);
    }

    const framedTexture = sourceTexture
      ? this.createFramedArtworkTexture(sourceTexture, artwork, dimensions)
      : null;

    const image = new THREE.Mesh(
      new THREE.PlaneGeometry(dimensions.width, dimensions.height),
      createArtworkImageMaterial(framedTexture)
    );

    image.position.copy(frame.position);
    image.rotation.copy(frame.rotation);
    this.offsetArtworkFromWall(image, artwork.rotationY, 0.024);

    image.userData = {
      artworkId: artwork.id,
      textureUrl: artwork.image
    };

    return image;
  }

  private parsePosition(position: string | undefined): ParsedPosition {
    const match = position?.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);

    if (!match) {
      return {
        x: 50,
        y: 50
      };
    }

    return {
      x: Math.max(0, Math.min(100, Number(match[1]))),
      y: Math.max(0, Math.min(100, Number(match[2])))
    };
  }

  private getTextureAspect(texture: THREE.Texture | null) {
    const image = texture?.image as { width?: number; height?: number } | undefined;
    const width = image?.width ?? 0;
    const height = image?.height ?? 0;

    if (width > 0 && height > 0) {
      return width / height;
    }

    return null;
  }

  private getImageAspect(artwork: GalleryArtwork, texture: THREE.Texture | null) {
    if (artwork.imageAspectRatio && artwork.imageAspectRatio > 0) {
      return artwork.imageAspectRatio;
    }

    if (artwork.imageWidth && artwork.imageHeight && artwork.imageWidth > 0 && artwork.imageHeight > 0) {
      return artwork.imageWidth / artwork.imageHeight;
    }

    return this.getTextureAspect(texture) ?? artwork.maxWidth / artwork.maxHeight;
  }

  private getEffectiveOrientation(
    artwork: GalleryArtwork,
    imageAspect: number
  ): ImageOrientation {
    if (artwork.imageOrientation) {
      return artwork.imageOrientation;
    }

    if (Math.abs(imageAspect - 1) <= 0.04) {
      return 'square';
    }

    return imageAspect > 1 ? 'landscape' : 'portrait';
  }

  private resolveFrameStyle(
    frameStyle: GalleryFrameStyle,
    artwork: GalleryArtwork,
    imageAspect: number
  ) {
    if (frameStyle !== 'auto') {
      return frameStyle;
    }

    const orientation = this.getEffectiveOrientation(artwork, imageAspect);

    if (orientation === 'portrait') {
      return 'portrait';
    }

    if (orientation === 'square') {
      return 'square';
    }

    return 'landscape';
  }

  private getFrameAspectForCover(
    artwork: GalleryArtwork,
    imageAspect: number
  ) {
    const frameStyle = this.resolveFrameStyle(artwork.galleryFrameStyle, artwork, imageAspect);
    const maxAspect = artwork.maxWidth / artwork.maxHeight;

    if (frameStyle === 'portrait') {
      return PORTRAIT_FRAME_ASPECT;
    }

    if (frameStyle === 'square') {
      return SQUARE_FRAME_ASPECT;
    }

    return maxAspect;
  }

  private getStyleSizeLimit(style: 'landscape' | 'portrait' | 'square') {
    return MAX_SIZE_BY_STYLE[style];
  }

  private getDefaultSize(style: 'landscape' | 'portrait' | 'square') {
    return DEFAULT_SIZE_BY_STYLE[style];
  }

  private getEffectiveGallerySize(artwork: GalleryArtwork, imageAspect: number) {
    const style = this.resolveFrameStyle(artwork.galleryFrameStyle, artwork, imageAspect);
    const requestedSize = artwork.gallerySize > 0 ? artwork.gallerySize : this.getDefaultSize(style);
    const maxSize = this.getStyleSizeLimit(style);

    return Math.min(maxSize, Math.max(0.55, requestedSize));
  }

  private fitAspectInsideMax(
    aspect: number,
    maxWidth: number,
    maxHeight: number
  ): FrameDimensions {
    let width = maxWidth;
    let height = width / aspect;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspect;
    }

    return {
      width,
      height
    };
  }

  private resolveArtworkDimensions(
    artwork: GalleryArtwork,
    texture: THREE.Texture | null
  ): FrameDimensions {
    const imageAspect = this.getImageAspect(artwork, texture);
    const size = this.getEffectiveGallerySize(artwork, imageAspect);
    const maxWidth = artwork.maxWidth * size;
    const maxHeight = artwork.maxHeight * size;

    if (artwork.galleryFitMode === 'contain') {
      return this.fitAspectInsideMax(imageAspect, maxWidth, maxHeight);
    }

    const frameAspect = this.getFrameAspectForCover(artwork, imageAspect);

    return this.fitAspectInsideMax(frameAspect, maxWidth, maxHeight);
  }

  private createFramedArtworkTexture(
    sourceTexture: THREE.Texture,
    artwork: GalleryArtwork,
    dimensions: FrameDimensions
  ) {
    const texture = sourceTexture.clone();

    texture.needsUpdate = true;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    if (artwork.galleryFitMode === 'contain') {
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      this.framedTextures.add(texture);
      return texture;
    }

    const imageAspect = this.getImageAspect(artwork, sourceTexture);
    const frameAspect = dimensions.width / dimensions.height;
    const position = this.parsePosition(artwork.galleryPosition);

    let repeatX = 1;
    let repeatY = 1;
    let offsetX = 0;
    let offsetY = 0;

    if (imageAspect > frameAspect) {
      repeatX = frameAspect / imageAspect;
      offsetX = (1 - repeatX) * (position.x / 100);
    }

    if (imageAspect < frameAspect) {
      repeatY = imageAspect / frameAspect;
      offsetY = (1 - repeatY) * (1 - position.y / 100);
    }

    texture.repeat.set(repeatX, repeatY);
    texture.offset.set(offsetX, offsetY);

    this.framedTextures.add(texture);

    return texture;
  }

  private updatePlaneGeometry(mesh: THREE.Mesh, width: number, height: number) {
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(width, height);
  }

  private replaceMaterialTexture(
    material: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial,
    texture: THREE.Texture
  ) {
    const existingTexture = material.map;

    material.map = texture;
    material.needsUpdate = true;

    if (existingTexture && this.framedTextures.has(existingTexture)) {
      existingTexture.dispose();
      this.framedTextures.delete(existingTexture);
    }
  }

  private subscribeToHighResolutionTextureUpdates() {
    this.unsubscribeFromTextureUpdates = subscribeToGalleryTextureUpdates(
      (url, texture) => {
        this.applyHighResolutionTexture(url, texture);
      }
    );
  }

  private applyHighResolutionTexture(url: string, texture: THREE.Texture) {
    this.artworkMeshSets.forEach((meshSet) => {
      if (meshSet.image.userData.textureUrl !== url) {
        return;
      }

      if (Array.isArray(meshSet.image.material)) {
        return;
      }

      const dimensions = this.resolveArtworkDimensions(meshSet.artwork, texture);

      this.updatePlaneGeometry(meshSet.frame, dimensions.width + 0.22, dimensions.height + 0.22);
      this.updatePlaneGeometry(meshSet.mat, dimensions.width + 0.08, dimensions.height + 0.08);
      this.updatePlaneGeometry(meshSet.image, dimensions.width, dimensions.height);

      const framedTexture = this.createFramedArtworkTexture(texture, meshSet.artwork, dimensions);
      const material = meshSet.image.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;

      this.replaceMaterialTexture(material, framedTexture);
    });
  }

  private offsetArtworkFromWall(mesh: THREE.Object3D, rotationY: number, amount: number) {
    const normal = new THREE.Vector3(0, 0, 1);

    normal.applyEuler(new THREE.Euler(0, rotationY, 0));
    mesh.position.addScaledVector(normal, amount);
  }

  private bindEvents() {
    this.lookController.bindEvents();

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
  }

  private unbindEvents() {
    this.lookController.unbindEvents();

    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Escape') {
      this.onExit();
      return;
    }

    this.movementController.handleKeyDown(event);
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.movementController.handleKeyUp(event);
  };

  private handleResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(width, height);
  };

  private updateArtworkFocus() {
    this.raycaster.setFromCamera(this.centerPoint, this.camera);

    const intersections = this.raycaster.intersectObjects(this.artworkMeshes, false);
    const firstIntersection = intersections[0];

    if (!firstIntersection) {
      if (this.focusedArtworkId !== null) {
        this.focusedArtworkId = null;
        this.onArtworkClear();
      }

      return;
    }

    const artworkId = firstIntersection.object.userData.artworkId as string | undefined;

    if (!artworkId || artworkId === this.focusedArtworkId) {
      return;
    }

    const artwork = galleryArtworks.find((item) => item.id === artworkId);

    if (!artwork) {
      return;
    }

    this.focusedArtworkId = artworkId;
    this.onArtworkFocus(artwork);
  }

  private animate = (timestamp?: number) => {
    const delta = this.movementController.getFrameDelta(timestamp);

    this.movementController.update(this.camera, this.lookController.getYaw(), delta);
    this.updateArtworkFocus();
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = window.requestAnimationFrame(this.animate);
  };

  public destroy() {
    window.cancelAnimationFrame(this.animationFrameId);

    this.unsubscribeFromTextureUpdates?.();
    this.unsubscribeFromTextureUpdates = null;

    this.framedTextures.forEach((texture) => {
      texture.dispose();
    });

    this.framedTextures.clear();

    this.lookController.releasePointerLock();
    this.unbindEvents();

    this.renderer.dispose();

    this.container.innerHTML = '';
  }
}
