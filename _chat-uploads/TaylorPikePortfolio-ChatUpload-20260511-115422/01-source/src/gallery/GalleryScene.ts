// Creates and manages the 3D gallery scene.
//
// This file controls scene composition:
// - renderer
// - camera
// - floor
// - lighting
// - wall blocks
// - orientation-aware artwork frames
// - center-ray artwork focus
// - animation loop
// - cleanup

import * as THREE from 'three';
import {
  galleryArtworks,
  galleryFloor,
  galleryStart,
  galleryWalls,
  type GalleryArtwork,
  type ResolvedGalleryWall
} from './artwork/galleryLayout';
import {
  getCoverTextureTransform,
  resolveGalleryFrameDimensions
} from './artwork/galleryFraming';
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
  createWallMaterial,
  createWallTrimMaterial
} from './environment/galleryMaterials';
import { addGalleryLighting } from './environment/galleryLighting';

type GallerySceneOptions = {
  container: HTMLElement;
  onExit: () => void;
  onArtworkFocus: (artwork: GalleryArtwork) => void;
  onArtworkClear: () => void;
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
  private wallMeshes: THREE.Mesh[] = [];
  private artworkMeshes: THREE.Mesh[] = [];
  private artworkMeshSets: ArtworkMeshSet[] = [];
  private focusedArtworkId: string | null = null;
  private readonly artworkFocusMaxDistance = 8.75;

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
    scene.fog = new THREE.Fog(0xf8f7f3, 24, 42);

    return scene;
  }

  private createCamera() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const camera = new THREE.PerspectiveCamera(68, width / height, 0.1, 100);

    camera.position.set(...galleryStart.position);

    return camera;
  }

  private createRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(
      Math.max(1, this.container.clientWidth),
      Math.max(1, this.container.clientHeight)
    );
    renderer.setClearColor(0xf8f7f3, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;

    return renderer;
  }

  private createFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(galleryFloor.width, galleryFloor.depth),
      createFloorMaterial()
    );

    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.userData = {
      gallerySurface: 'floor'
    };

    this.scene.add(floor);
  }

  private createLights() {
    addGalleryLighting(this.scene);
  }

  private createWalls() {
    const wallMaterial = createWallMaterial();
    const wallTrimMaterial = createWallTrimMaterial();

    galleryWalls.forEach((wall) => {
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(wall.width, wall.height, wall.thickness),
        wallMaterial
      );

      wallMesh.position.set(...wall.position);
      wallMesh.rotation.y = wall.rotationY;
      wallMesh.userData = {
        wallId: wall.id,
        gallerySurface: 'wall'
      };

      const trimMesh = this.createWallBaseTrim(wall, wallTrimMaterial);

      this.wallMeshes.push(wallMesh);
      this.scene.add(wallMesh);
      this.scene.add(trimMesh);
    });
  }

  private createWallBaseTrim(wall: ResolvedGalleryWall, material: THREE.Material) {
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(wall.width, 0.065, 0.055),
      material
    );

    trim.position.set(...wall.position);
    trim.position.y = 0.11;
    trim.rotation.y = wall.rotationY;
    trim.userData = {
      wallTrimId: wall.id,
      gallerySurface: 'wall-trim'
    };
    this.offsetArtworkFromWall(trim, wall.rotationY, wall.thickness / 2 + 0.028);

    return trim;
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
    frame.userData = {
      artworkFrameId: artwork.id
    };
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
    mat.userData = {
      artworkMatId: artwork.id
    };
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
    image.userData = {
      artworkId: artwork.id,
      textureUrl: artwork.image
    };
    this.offsetArtworkFromWall(image, artwork.rotationY, 0.024);

    return image;
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

  private resolveArtworkDimensions(
    artwork: GalleryArtwork,
    texture: THREE.Texture | null
  ): FrameDimensions {
    return resolveGalleryFrameDimensions({
      imageAspect: this.getImageAspect(artwork, texture),
      imageOrientation: artwork.imageOrientation,
      fitMode: artwork.galleryFitMode,
      frameStyle: artwork.galleryFrameStyle,
      requestedSize: artwork.gallerySize,
      maxWidth: artwork.maxWidth,
      maxHeight: artwork.maxHeight
    });
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
    const transform = getCoverTextureTransform(
      imageAspect,
      frameAspect,
      artwork.galleryPosition
    );

    texture.repeat.set(transform.repeatX, transform.repeatY);
    texture.offset.set(transform.offsetX, transform.offsetY);

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
    window.addEventListener('blur', this.handleWindowBlur);
  }

  private unbindEvents() {
    this.lookController.unbindEvents();

    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('blur', this.handleWindowBlur);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.onExit();
      return;
    }

    if (this.movementController.handleKeyDown(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (this.movementController.handleKeyUp(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  private handleWindowBlur = () => {
    this.movementController.reset();
  };

  private handleResize = () => {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(width, height);
  };

  private clearFocusedArtwork() {
    if (this.focusedArtworkId === null) {
      return;
    }

    this.focusedArtworkId = null;
    this.onArtworkClear();
  }

  private updateArtworkFocus() {
    this.raycaster.near = 0;
    this.raycaster.far = this.artworkFocusMaxDistance;
    this.raycaster.setFromCamera(this.centerPoint, this.camera);

    const intersections = this.raycaster.intersectObjects(
      [...this.artworkMeshes, ...this.wallMeshes],
      false
    );
    const firstIntersection = intersections[0];

    if (!firstIntersection) {
      this.clearFocusedArtwork();
      return;
    }

    const artworkId = firstIntersection.object.userData.artworkId as string | undefined;

    if (!artworkId) {
      this.clearFocusedArtwork();
      return;
    }

    if (artworkId === this.focusedArtworkId) {
      return;
    }

    const artwork = galleryArtworks.find((item) => item.id === artworkId);

    if (!artwork) {
      this.clearFocusedArtwork();
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

  private disposeSceneResources() {
    const disposedMaterials = new Set<THREE.Material>();

    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;

      if (!mesh.isMesh) {
        return;
      }

      mesh.geometry?.dispose();

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => this.disposeMaterial(material, disposedMaterials));
        return;
      }

      if (mesh.material) {
        this.disposeMaterial(mesh.material, disposedMaterials);
      }
    });
  }

  private disposeMaterial(material: THREE.Material, disposedMaterials: Set<THREE.Material>) {
    if (disposedMaterials.has(material)) {
      return;
    }

    disposedMaterials.add(material);
    material.dispose();
  }

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
    this.disposeSceneResources();

    this.wallMeshes = [];
    this.artworkMeshes = [];
    this.artworkMeshSets = [];
    this.focusedArtworkId = null;

    this.renderer.dispose();

    this.container.innerHTML = '';
  }
}
