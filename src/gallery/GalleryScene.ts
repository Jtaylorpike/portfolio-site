// Creates and manages the 3D gallery scene.
//
// This file controls scene composition:
// - renderer
// - camera
// - floor
// - architectural room shell
// - lighting
// - wall blocks
// - orientation-aware artwork frames
// - center-ray artwork focus
// - animation loop
// - cleanup

import * as THREE from 'three';
import {
  ceilingLightPanels,
  galleryArtworks,
  galleryFloor,
  galleryRoom,
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
  createCeilingLightPanelMaterial,
  createCeilingMaterial,
  createFloorMaterial,
  createFrameMaterial,
  createMatMaterial,
  createPlaqueBodyMaterial,
  createPlaqueMaterial,
  createRoomShellWallMaterial,
  createWallMaterial,
  createWallTrimMaterial
} from './environment/galleryMaterials';
import { addGalleryLighting } from './environment/galleryLighting';

type GalleryInputMode = 'desktop' | 'touch';

type GallerySceneOptions = {
  container: HTMLElement;
  onExit: () => void;
  onArtworkFocus: (artwork: GalleryArtwork) => void;
  onArtworkClear: () => void;
  inputMode?: GalleryInputMode;
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
  plaque?: THREE.Mesh;
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
  private readonly artworkFrameDepth = 0.052;
  private readonly artworkFrameBorder = 0.2;
  private readonly artworkMatBorder = 0.072;
  private readonly artworkPlaqueWidth = 0.74;
  private readonly artworkPlaqueHeight = 0.22;
  private readonly artworkPlaqueDepth = 0.012;
  private readonly artworkPlaqueGap = 0.11;
  private plaqueTextures = new Set<THREE.Texture>();

  private movementController = new MovementController();
  private lookController!: LookController;
  private inputMode: GalleryInputMode;
  private unsubscribeFromTextureUpdates: (() => void) | null = null;
  private framedTextures = new Set<THREE.Texture>();

  constructor(options: GallerySceneOptions) {
    this.container = options.container;
    this.onExit = options.onExit;
    this.onArtworkFocus = options.onArtworkFocus;
    this.onArtworkClear = options.onArtworkClear;
    this.inputMode = options.inputMode ?? 'desktop';

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();

    this.container.appendChild(this.renderer.domElement);

    this.lookController = new LookController({
      canvas: this.renderer.domElement,
      camera: this.camera,
      initialYaw: galleryStart.yaw,
      inputMode: this.inputMode
    });

    this.createFloor();
    this.createRoomShell();
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

  private createRoomShell() {
    const wallMaterial = createRoomShellWallMaterial();
    const ceilingMaterial = createCeilingMaterial();

    this.createPerimeterWall({
      id: 'room-shell-north',
      width: galleryRoom.width,
      height: galleryRoom.height,
      depth: galleryRoom.wallThickness,
      position: [0, galleryRoom.height / 2, -galleryRoom.depth / 2],
      material: wallMaterial
    });

    this.createPerimeterWall({
      id: 'room-shell-south',
      width: galleryRoom.width,
      height: galleryRoom.height,
      depth: galleryRoom.wallThickness,
      position: [0, galleryRoom.height / 2, galleryRoom.depth / 2],
      material: wallMaterial
    });

    this.createPerimeterWall({
      id: 'room-shell-west',
      width: galleryRoom.wallThickness,
      height: galleryRoom.height,
      depth: galleryRoom.depth,
      position: [-galleryRoom.width / 2, galleryRoom.height / 2, 0],
      material: wallMaterial
    });

    this.createPerimeterWall({
      id: 'room-shell-east',
      width: galleryRoom.wallThickness,
      height: galleryRoom.height,
      depth: galleryRoom.depth,
      position: [galleryRoom.width / 2, galleryRoom.height / 2, 0],
      material: wallMaterial
    });

    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(galleryRoom.width, galleryRoom.ceilingThickness, galleryRoom.depth),
      ceilingMaterial
    );

    ceiling.position.set(0, galleryRoom.height + galleryRoom.ceilingThickness / 2, 0);
    ceiling.userData = {
      gallerySurface: 'ceiling'
    };

    this.scene.add(ceiling);
    this.createRoomBaseTrim();
    this.createCeilingLightPanels();
  }

  private createRoomBaseTrim() {
    const material = createWallTrimMaterial();
    const trimHeight = 0.082;
    const trimDepth = 0.062;
    const trimY = 0.12;
    const northZ = -galleryRoom.depth / 2 + galleryRoom.wallThickness / 2 + trimDepth / 2;
    const southZ = galleryRoom.depth / 2 - galleryRoom.wallThickness / 2 - trimDepth / 2;
    const westX = -galleryRoom.width / 2 + galleryRoom.wallThickness / 2 + trimDepth / 2;
    const eastX = galleryRoom.width / 2 - galleryRoom.wallThickness / 2 - trimDepth / 2;

    const trims = [
      new THREE.Mesh(
        new THREE.BoxGeometry(galleryRoom.width, trimHeight, trimDepth),
        material
      ),
      new THREE.Mesh(
        new THREE.BoxGeometry(galleryRoom.width, trimHeight, trimDepth),
        material
      ),
      new THREE.Mesh(
        new THREE.BoxGeometry(trimDepth, trimHeight, galleryRoom.depth),
        material
      ),
      new THREE.Mesh(
        new THREE.BoxGeometry(trimDepth, trimHeight, galleryRoom.depth),
        material
      )
    ];

    trims[0].position.set(0, trimY, northZ);
    trims[1].position.set(0, trimY, southZ);
    trims[2].position.set(westX, trimY, 0);
    trims[3].position.set(eastX, trimY, 0);

    trims.forEach((trim, index) => {
      trim.userData = {
        roomTrimId: `room-shell-trim-${index + 1}`,
        gallerySurface: 'room-shell-trim'
      };

      this.scene.add(trim);
    });
  }

  private createPerimeterWall(options: {
    id: string;
    width: number;
    height: number;
    depth: number;
    position: [number, number, number];
    material: THREE.Material;
  }) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(options.width, options.height, options.depth),
      options.material
    );

    wall.position.set(...options.position);
    wall.userData = {
      wallId: options.id,
      gallerySurface: 'room-shell-wall'
    };

    this.wallMeshes.push(wall);
    this.scene.add(wall);
  }

  private createCeilingLightPanels() {
    const material = createCeilingLightPanelMaterial();

    ceilingLightPanels.forEach((panel) => {
      const lightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(panel.width, 0.018, panel.depth),
        material
      );

      lightPanel.position.set(panel.position[0], galleryRoom.height - 0.065, panel.position[1]);
      lightPanel.rotation.y = panel.rotationY;
      lightPanel.userData = {
        lightPanelId: panel.id,
        gallerySurface: 'ceiling-light-panel'
      };

      this.scene.add(lightPanel);
    });
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
      const plaque = this.createArtworkPlaque(artwork, dimensions, frame);

      this.scene.add(frame);
      this.scene.add(mat);
      this.scene.add(image);

      if (plaque) {
        this.scene.add(plaque);
      }

      this.artworkMeshes.push(image);
      this.artworkMeshSets.push({
        artwork,
        frame,
        mat,
        image,
        plaque
      });
    });
  }

  private createArtworkFrame(
    artwork: GalleryArtwork,
    dimensions: FrameDimensions,
    material: THREE.Material
  ) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(
        dimensions.width + this.artworkFrameBorder,
        dimensions.height + this.artworkFrameBorder,
        this.artworkFrameDepth
      ),
      material
    );

    frame.position.set(...artwork.position);
    frame.rotation.y = artwork.rotationY;
    frame.userData = {
      artworkFrameId: artwork.id
    };
    this.offsetArtworkFromWall(frame, artwork.rotationY, this.artworkFrameDepth / 2 + 0.006);

    return frame;
  }

  private createArtworkMat(
    artwork: GalleryArtwork,
    dimensions: FrameDimensions,
    material: THREE.Material,
    frame: THREE.Mesh
  ) {
    const mat = new THREE.Mesh(
      new THREE.PlaneGeometry(dimensions.width + this.artworkMatBorder, dimensions.height + this.artworkMatBorder),
      material
    );

    mat.position.copy(frame.position);
    mat.rotation.copy(frame.rotation);
    mat.userData = {
      artworkMatId: artwork.id
    };
    this.offsetArtworkFromWall(mat, artwork.rotationY, this.artworkFrameDepth / 2 + 0.014);

    return mat;
  }

  private createArtworkPlaqueTexture(artwork: GalleryArtwork) {
    const canvas = document.createElement('canvas');
    const width = 1024;
    const height = 336;
    const context = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    if (!context) {
      return null;
    }

    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgba(246, 242, 234, 1)';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = 'rgba(10, 11, 10, 0.28)';
    context.lineWidth = 3;
    context.strokeRect(1.5, 1.5, width - 3, height - 3);

    context.fillStyle = 'rgba(196, 186, 169, 1)';
    context.fillRect(0, 0, width, 10);

    const title = artwork.title.toUpperCase();
    const metaParts = [
      String(artwork.displayOrder).padStart(2, '0'),
      artwork.wallSection,
      artwork.year || 'Archive'
    ];

    context.fillStyle = 'rgba(8, 9, 8, 1)';
    context.font = '700 54px Arial, Helvetica, sans-serif';
    context.textBaseline = 'top';
    context.fillText(this.truncatePlaqueText(context, title, width - 84), 38, 34);

    context.fillStyle = 'rgba(8, 9, 8, 0.9)';
    context.font = '700 30px Arial, Helvetica, sans-serif';
    context.fillText(this.truncatePlaqueText(context, metaParts.join(' / ').toUpperCase(), width - 84), 38, 126);

    context.fillStyle = 'rgba(8, 9, 8, 0.78)';
    context.font = '600 28px Arial, Helvetica, sans-serif';
    context.fillText(this.truncatePlaqueText(context, artwork.location.toUpperCase(), width - 84), 38, 178);

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;

    this.plaqueTextures.add(texture);

    return texture;
  }

  private truncatePlaqueText(
    context: CanvasRenderingContext2D,
    value: string,
    maxWidth: number
  ) {
    if (context.measureText(value).width <= maxWidth) {
      return value;
    }

    let nextValue = value;

    while (nextValue.length > 4 && context.measureText(`${nextValue}...`).width > maxWidth) {
      nextValue = nextValue.slice(0, -1);
    }

    return `${nextValue}...`;
  }

  private createArtworkPlaque(
    artwork: GalleryArtwork,
    dimensions: FrameDimensions,
    frame: THREE.Mesh
  ) {
    if (!artwork.plaqueEnabled) {
      return undefined;
    }

    const texture = this.createArtworkPlaqueTexture(artwork);

    if (!texture) {
      return undefined;
    }

    const plaqueMaterials = [
      createPlaqueBodyMaterial(),
      createPlaqueBodyMaterial(),
      createPlaqueBodyMaterial(),
      createPlaqueBodyMaterial(),
      createPlaqueMaterial(texture),
      createPlaqueBodyMaterial()
    ];

    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(
        this.artworkPlaqueWidth,
        this.artworkPlaqueHeight,
        this.artworkPlaqueDepth
      ),
      plaqueMaterials
    );

    plaque.rotation.copy(frame.rotation);
    plaque.userData = {
      artworkPlaqueId: artwork.id,
      gallerySurface: 'artwork-plaque'
    };

    this.positionArtworkPlaque(plaque, artwork, dimensions, frame);

    return plaque;
  }

  private positionArtworkPlaque(
    plaque: THREE.Mesh,
    artwork: GalleryArtwork,
    dimensions: FrameDimensions,
    _frame: THREE.Mesh
  ) {
    const tangent = new THREE.Vector3(1, 0, 0);
    tangent.applyEuler(new THREE.Euler(0, artwork.rotationY, 0));

    const normal = new THREE.Vector3(
      Math.sin(artwork.rotationY),
      0,
      Math.cos(artwork.rotationY)
    );

    // artwork.position is already slightly in front of the wall surface.
    // That offset is 0.018 in galleryLayout. To make the plaque truly flush,
    // place its center so the rear face lands exactly on the wall plane.
    const artworkSurfaceOffset = 0.018;
    const plaqueCenterOutset = this.artworkPlaqueDepth / 2;
    const flushWallOffset = -artworkSurfaceOffset + plaqueCenterOutset;

    if (this.canPlacePlaqueBesideArtwork(artwork, dimensions)) {
      this.positionArtworkPlaqueBesideFrame(
        plaque,
        artwork,
        dimensions,
        tangent,
        normal,
        flushWallOffset
      );
    } else {
      this.positionArtworkPlaqueBelowFrame(
        plaque,
        artwork,
        dimensions,
        normal,
        flushWallOffset
      );
    }

    plaque.rotation.copy(_frame.rotation);
  }

  private canPlacePlaqueBesideArtwork(
    artwork: GalleryArtwork,
    dimensions: FrameDimensions
  ) {
    const wallHalfWidth = artwork.wallWidth / 2;
    const plaqueHalfWidth = this.artworkPlaqueWidth / 2;
    const safeWallMargin = 0.14;
    const frameHalfWidth = dimensions.width / 2 + this.artworkFrameBorder / 2;
    const requiredCenterOffset = frameHalfWidth + this.artworkPlaqueGap + plaqueHalfWidth;
    const maxCenterOffset = wallHalfWidth - safeWallMargin - plaqueHalfWidth;

    return requiredCenterOffset <= maxCenterOffset;
  }

  private getPlaqueSideMultiplier(artwork: GalleryArtwork) {
    return artwork.plaqueSide === 'left' ? -1 : 1;
  }

  private positionArtworkPlaqueBesideFrame(
    plaque: THREE.Mesh,
    artwork: GalleryArtwork,
    dimensions: FrameDimensions,
    tangent: THREE.Vector3,
    normal: THREE.Vector3,
    flushWallOffset: number
  ) {
    const plaqueHalfWidth = this.artworkPlaqueWidth / 2;
    const frameHalfWidth = dimensions.width / 2 + this.artworkFrameBorder / 2;
    const sideMultiplier = this.getPlaqueSideMultiplier(artwork);
    const centerOffset = frameHalfWidth + this.artworkPlaqueGap + plaqueHalfWidth;

    plaque.position.set(...artwork.position);
    plaque.position.addScaledVector(tangent, centerOffset * sideMultiplier);
    plaque.position.addScaledVector(normal, flushWallOffset);
    plaque.position.y = Math.max(
      0.76,
      artwork.position[1] - dimensions.height / 2 + this.artworkPlaqueHeight / 2 + 0.044
    );
    plaque.userData.plaquePlacement = artwork.plaqueSide;
  }

  private positionArtworkPlaqueBelowFrame(
    plaque: THREE.Mesh,
    artwork: GalleryArtwork,
    dimensions: FrameDimensions,
    normal: THREE.Vector3,
    flushWallOffset: number
  ) {
    const frameHalfHeight = dimensions.height / 2 + this.artworkFrameBorder / 2;
    const plaqueHalfHeight = this.artworkPlaqueHeight / 2;
    const belowFrameY = artwork.position[1] - frameHalfHeight - this.artworkPlaqueGap - plaqueHalfHeight;

    plaque.position.set(...artwork.position);
    plaque.position.addScaledVector(normal, flushWallOffset);
    plaque.position.y = Math.max(0.38, belowFrameY);
    plaque.userData.plaquePlacement = 'below';
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
    this.offsetArtworkFromWall(image, artwork.rotationY, this.artworkFrameDepth / 2 + 0.03);

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

  private updateFrameGeometry(mesh: THREE.Mesh, width: number, height: number) {
    mesh.geometry.dispose();
    mesh.geometry = new THREE.BoxGeometry(width, height, this.artworkFrameDepth);
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
      this.updateFrameGeometry(
        meshSet.frame,
        dimensions.width + this.artworkFrameBorder,
        dimensions.height + this.artworkFrameBorder
      );
      this.updatePlaneGeometry(
        meshSet.mat,
        dimensions.width + this.artworkMatBorder,
        dimensions.height + this.artworkMatBorder
      );
      this.updatePlaneGeometry(meshSet.image, dimensions.width, dimensions.height);

      if (meshSet.plaque) {
        this.positionArtworkPlaque(meshSet.plaque, meshSet.artwork, dimensions, meshSet.frame);
      }

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
    const disposedTextures = new Set<THREE.Texture>();

    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;

      if (!mesh.isMesh) {
        return;
      }

      mesh.geometry?.dispose();

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => this.disposeMaterial(material, disposedMaterials, disposedTextures));
        return;
      }

      if (mesh.material) {
        this.disposeMaterial(mesh.material, disposedMaterials, disposedTextures);
      }
    });
  }

  private disposeMaterial(
    material: THREE.Material,
    disposedMaterials: Set<THREE.Material>,
    disposedTextures: Set<THREE.Texture>
  ) {
    if (disposedMaterials.has(material)) {
      return;
    }

    disposedMaterials.add(material);

    const materialWithMap = material as THREE.Material & { map?: THREE.Texture | null };

    if (materialWithMap.map && !disposedTextures.has(materialWithMap.map)) {
      disposedTextures.add(materialWithMap.map);
      materialWithMap.map.dispose();
    }

    material.dispose();
  }

  public setTouchMovement(localX: number, localZ: number) {
    this.movementController.setTouchMovement(localX, localZ);
  }

  public clearTouchMovement() {
    this.movementController.clearTouchMovement();
  }

  public destroy() {
    window.cancelAnimationFrame(this.animationFrameId);

    this.unsubscribeFromTextureUpdates?.();
    this.unsubscribeFromTextureUpdates = null;

    this.framedTextures.forEach((texture) => {
      texture.dispose();
    });

    this.framedTextures.clear();

    this.plaqueTextures.forEach((texture) => {
      texture.dispose();
    });

    this.plaqueTextures.clear();

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
