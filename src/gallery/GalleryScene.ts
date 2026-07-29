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
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  ceilingLightPanels,
  galleryArtworks,
  galleryLayoutModules,
  galleryRoom,
  galleryStart,
  galleryWalls,
  formatGalleryArtworkPublicMeta,
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
  createCeilingDetailMaterial,
  createCeilingLightPanelFrameMaterial,
  createCeilingLightPanelMaterial,
  createCeilingMaterial,
  createFloorMaterial,
  createMatMaterial,
  createPrototypeDarkWoodMaterial,
  createPrototypeDarkWoodRailMaterial,
  createPrototypeMuseumWallMaterial,
  createPlaqueBodyMaterial,
  createPlaqueMaterial,
  createRoomShellWallMaterial,
  createTrackLightHousingMaterial,
  createTrackLightLensMaterial
} from './environment/galleryMaterials';
import { addGalleryLighting, applyGalleryLightingQuality } from './environment/galleryLighting';
import {
  getGalleryQualitySettings,
  getGalleryQualityState,
  markGalleryGpuTierReady,
  recordGalleryFrame,
  resetGalleryGpuTier,
  subscribeToGalleryQuality,
  type GalleryQualityTier
} from './performance/galleryQuality';

type GalleryInputMode = 'desktop' | 'touch';

type GallerySceneOptions = {
  container: HTMLElement;
  onExit: () => void;
  onArtworkFocus: (artwork: GalleryArtwork) => void;
  onArtworkClear: () => void;
  onContextStateChange: (state: 'lost' | 'restored') => void;
  inputMode?: GalleryInputMode;
};

export type GalleryRuntimeDiagnostics = {
  renderPixelRatio: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  artworkLightCount: number;
  litArtworkCount: number;
  displayedArtworkCount: number;
  layoutModuleCount: number;
  roomCount: number;
  hallwayCount: number;
  renderer: string;
};

type FrameDimensions = {
  width: number;
  height: number;
};

type ArtworkMeshSet = {
  artwork: GalleryArtwork;
  frame: THREE.Mesh;
  frameInstanceIndex: number;
  frameRails: THREE.Group;
  mat: THREE.Mesh;
  matInstanceIndex: number;
  image: THREE.Mesh;
  plaque?: THREE.Mesh;
};

export class GalleryScene {
  private static readonly surfaceTextureReferenceMeters = 3.55;
  private static readonly surfaceTextureReferenceHeight = 3.3;
  private container: HTMLElement;
  private onExit: () => void;
  private onArtworkFocus: (artwork: GalleryArtwork) => void;
  private onArtworkClear: () => void;
  private onContextStateChange: (state: 'lost' | 'restored') => void;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId = 0;
  private qualityTier: GalleryQualityTier;
  private unsubscribeFromQualityUpdates: (() => void) | null = null;

  private raycaster = new THREE.Raycaster();
  private centerPoint = new THREE.Vector2(0, 0);
  private wallMeshes: THREE.Mesh[] = [];
  private artworkMeshes: THREE.Mesh[] = [];
  private focusRaycastTargets: THREE.Object3D[] = [];
  private artworkMeshSets: ArtworkMeshSet[] = [];
  private artworkFrameInstances: THREE.InstancedMesh | null = null;
  private artworkMatInstances: THREE.InstancedMesh | null = null;
  private focusedArtworkId: string | null = null;
  private readonly artworkFocusMaxDistance = 8.75;
  private readonly artworkFrameDepth = 0.078;
  private readonly artworkFrameBorder = 0.24;
  private readonly artworkMatBorder = 0.07;
  private readonly artworkPlaqueWidth = 0.82;
  private readonly artworkPlaqueHeight = 0.27;
  private readonly artworkPlaqueDepth = 0.012;
  private readonly artworkPlaqueGap = 0.11;
  private plaqueTextures = new Set<THREE.Texture>();

  private movementController = new MovementController();
  private lookController!: LookController;
  private inputMode: GalleryInputMode;
  private unsubscribeFromTextureUpdates: (() => void) | null = null;
  private qualityTransitionId = 0;
  private framedTextures = new Set<THREE.Texture>();
  private pendingTextureUpdates = new Map<string, THREE.Texture>();
  private texturePreparationScheduled = false;
  private preparedFullTextureUrls = new Set<string>();
  private preparedPreviewTextureUrls = new Set<string>();
  private destroyed = false;
  private contextLost = false;

  constructor(options: GallerySceneOptions) {
    this.container = options.container;
    this.onExit = options.onExit;
    this.onArtworkFocus = options.onArtworkFocus;
    this.onArtworkClear = options.onArtworkClear;
    this.onContextStateChange = options.onContextStateChange;
    this.inputMode = options.inputMode ?? 'desktop';
    this.qualityTier = getGalleryQualityState().tier;

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
    this.applyQualityTier(this.qualityTier);
    this.createWalls();
    this.createWayfindingMarkers();
    this.createArtwork();
    this.focusRaycastTargets = [...this.artworkMeshes, ...this.wallMeshes];
    this.applyEnvironmentTextureFiltering(this.qualityTier);
    this.subscribeToHighResolutionTextureUpdates();
    this.subscribeToQualityUpdates();
    this.bindEvents();
    this.animate();
  }

  private createScene() {
    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x1d1814);

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

    renderer.setPixelRatio(Math.min(
      window.devicePixelRatio,
      getGalleryQualitySettings(this.qualityTier).pixelRatioCap
    ));
    renderer.setSize(
      Math.max(1, this.container.clientWidth),
      Math.max(1, this.container.clientHeight)
    );
    renderer.setClearColor(0x1d1814, 1);
    renderer.shadowMap.enabled = this.qualityTier === 'high';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = this.qualityTier === 'high';

    // Keep the gallery canvas fully frame-cleared during camera movement. This
    // is normally Three.js' default behavior, but setting it explicitly helps
    // prevent future material/renderer experiments from leaving visual residue
    // between frames.
    renderer.autoClear = true;
    renderer.autoClearColor = true;
    renderer.autoClearDepth = true;
    renderer.autoClearStencil = true;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.03;

    return renderer;
  }

  private createFloor() {
    const floorMaterial = createFloorMaterial();

    galleryLayoutModules.forEach((module) => {
      const geometry = new THREE.PlaneGeometry(module.width, module.depth);
      this.alignFloorGeometryUvsToWorld(
        geometry,
        module.center[0],
        module.center[1]
      );
      const floor = new THREE.Mesh(
        geometry,
        floorMaterial
      );

      floor.rotation.x = -Math.PI / 2;
      floor.position.set(module.center[0], 0, module.center[1]);
      floor.receiveShadow = true;
      floor.userData = {
        galleryModuleId: module.id,
        gallerySurface: 'floor'
      };

      this.scene.add(floor);
    });
  }

  private createRoomShell() {
    const wallMaterial = createRoomShellWallMaterial();
    const ceilingMaterial = createCeilingMaterial();

    galleryLayoutModules.forEach((module) => {
      const geometry = this.createWorldAlignedSurfaceBoxGeometry(
        module.width,
        galleryRoom.ceilingThickness,
        module.depth,
        module.center[0],
        module.center[1]
      );
      const ceiling = new THREE.Mesh(
        geometry,
        ceilingMaterial
      );

      ceiling.position.set(
        module.center[0],
        galleryRoom.height + galleryRoom.ceilingThickness / 2,
        module.center[1]
      );
      ceiling.receiveShadow = true;
      ceiling.userData = {
        galleryModuleId: module.id,
        gallerySurface: 'ceiling'
      };
      this.scene.add(ceiling);
    });

    this.createModuleBoundaryWalls(wallMaterial, createPrototypeDarkWoodMaterial());
    // Phase 8V removes the explicit ceiling-grid strip geometry so the
    // ceiling reads through material texture instead of visible panel lines.
    this.createTrackLightFixtures();
  }

  private createModuleBoundaryWalls(
    wallMaterial: THREE.Material,
    trimMaterial: THREE.Material
  ) {
    type Interval = [number, number];
    const rectangles = galleryLayoutModules.map((module) => ({
      id: module.id,
      minX: module.center[0] - module.width / 2,
      maxX: module.center[0] + module.width / 2,
      minZ: module.center[1] - module.depth / 2,
      maxZ: module.center[1] + module.depth / 2
    }));
    const subtractIntervals = (source: Interval, cuts: Interval[]) => {
      let segments = [source];

      cuts.forEach(([cutMin, cutMax]) => {
        segments = segments.flatMap(([min, max]) => {
          if (cutMax <= min || cutMin >= max) {
            return [[min, max] as Interval];
          }

          const next: Interval[] = [];
          if (cutMin > min) next.push([min, Math.min(cutMin, max)]);
          if (cutMax < max) next.push([Math.max(cutMax, min), max]);
          return next;
        });
      });

      return segments.filter(([min, max]) => max - min > 0.05);
    };
    const addSegment = (
      id: string,
      ownerId: string,
      horizontal: boolean,
      fixed: number,
      interval: Interval,
      interiorDirection: -1 | 1
    ) => {
      const ownerRectangle = rectangles.find((rectangle) => rectangle.id === ownerId);
      const otherRectangles = rectangles.filter((rectangle) => rectangle.id !== ownerId);
      const junctionInset = galleryRoom.wallThickness / 2;
      const trimDepth = 0.062;
      const trimSurfaceOffset = galleryRoom.wallThickness / 2 + trimDepth / 2;
      const ownerInterval: Interval = horizontal
        ? [ownerRectangle?.minX ?? interval[0], ownerRectangle?.maxX ?? interval[1]]
        : [ownerRectangle?.minZ ?? interval[0], ownerRectangle?.maxZ ?? interval[1]];
      const endpointTolerance = 0.001;
      const minConnects = otherRectangles.some((rectangle) =>
        horizontal
          ? rectangle.minX < interval[0] &&
            rectangle.maxX >= interval[0] &&
            fixed >= rectangle.minZ &&
            fixed <= rectangle.maxZ
          : rectangle.minZ < interval[0] &&
            rectangle.maxZ >= interval[0] &&
            fixed >= rectangle.minX &&
            fixed <= rectangle.maxX
      );
      const maxConnects = otherRectangles.some((rectangle) =>
        horizontal
          ? rectangle.minX <= interval[1] &&
            rectangle.maxX > interval[1] &&
            fixed >= rectangle.minZ &&
            fixed <= rectangle.maxZ
          : rectangle.minZ <= interval[1] &&
            rectangle.maxZ > interval[1] &&
            fixed >= rectangle.minX &&
            fixed <= rectangle.maxX
      );
      const minIsPerimeterCorner = Math.abs(interval[0] - ownerInterval[0]) <= endpointTolerance;
      const maxIsPerimeterCorner = Math.abs(interval[1] - ownerInterval[1]) <= endpointTolerance;
      const minInset = minIsPerimeterCorner
        ? trimSurfaceOffset
        : minConnects
          ? junctionInset
          : 0;
      const maxInset = maxIsPerimeterCorner
        ? trimSurfaceOffset
        : maxConnects
          ? junctionInset
          : 0;
      const adjustedInterval: Interval = [
        interval[0] + minInset,
        interval[1] - maxInset
      ];
      const length = interval[1] - interval[0];
      const center = (interval[0] + interval[1]) / 2;
      const trimLength = adjustedInterval[1] - adjustedInterval[0];
      const safeTrimLength = Math.max(0.001, trimLength);
      const trimCenter = (adjustedInterval[0] + adjustedInterval[1]) / 2;
      const wall = new THREE.Mesh(
        this.createWorldAlignedSurfaceBoxGeometry(
          horizontal ? length : galleryRoom.wallThickness,
          galleryRoom.height,
          horizontal ? galleryRoom.wallThickness : length,
          horizontal ? center : fixed,
          horizontal ? fixed : center
        ),
        wallMaterial
      );
      const trimGeometry = new THREE.BoxGeometry(
        horizontal ? safeTrimLength : trimDepth,
        0.082,
        horizontal ? trimDepth : safeTrimLength
      );
      this.scaleGeometryUvs(
        trimGeometry,
        safeTrimLength / GalleryScene.surfaceTextureReferenceMeters,
        1
      );
      const trim = new THREE.Mesh(trimGeometry, trimMaterial);

      wall.position.set(
        horizontal ? center : fixed,
        galleryRoom.height / 2,
        horizontal ? fixed : center
      );
      trim.position.set(
        horizontal ? trimCenter : fixed + interiorDirection * trimSurfaceOffset,
        0.12,
        horizontal ? fixed + interiorDirection * trimSurfaceOffset : trimCenter
      );
      wall.castShadow = true;
      wall.receiveShadow = true;
      trim.castShadow = true;
      trim.receiveShadow = true;
      wall.userData = { wallId: id, gallerySurface: 'room-shell-wall' };
      trim.userData = { roomTrimId: `${id}-trim`, gallerySurface: 'room-shell-trim' };
      this.wallMeshes.push(wall);
      this.scene.add(wall);
      if (trimLength > 0.05) {
        this.scene.add(trim);
      } else {
        trimGeometry.dispose();
      }
    };

    rectangles.forEach((rectangle) => {
      const others = rectangles.filter((candidate) => candidate.id !== rectangle.id);
      const northCuts = others
        .filter((other) => other.minZ < rectangle.minZ && other.maxZ >= rectangle.minZ)
        .map((other) => [Math.max(rectangle.minX, other.minX), Math.min(rectangle.maxX, other.maxX)] as Interval);
      const southCuts = others
        .filter((other) => other.minZ <= rectangle.maxZ && other.maxZ > rectangle.maxZ)
        .map((other) => [Math.max(rectangle.minX, other.minX), Math.min(rectangle.maxX, other.maxX)] as Interval);
      const westCuts = others
        .filter((other) => other.minX < rectangle.minX && other.maxX >= rectangle.minX)
        .map((other) => [Math.max(rectangle.minZ, other.minZ), Math.min(rectangle.maxZ, other.maxZ)] as Interval);
      const eastCuts = others
        .filter((other) => other.minX <= rectangle.maxX && other.maxX > rectangle.maxX)
        .map((other) => [Math.max(rectangle.minZ, other.minZ), Math.min(rectangle.maxZ, other.maxZ)] as Interval);

      subtractIntervals([rectangle.minX, rectangle.maxX], northCuts)
        .forEach((segment, index) => addSegment(`${rectangle.id}-north-${index}`, rectangle.id, true, rectangle.minZ, segment, 1));
      subtractIntervals([rectangle.minX, rectangle.maxX], southCuts)
        .forEach((segment, index) => addSegment(`${rectangle.id}-south-${index}`, rectangle.id, true, rectangle.maxZ, segment, -1));
      subtractIntervals([rectangle.minZ, rectangle.maxZ], westCuts)
        .forEach((segment, index) => addSegment(`${rectangle.id}-west-${index}`, rectangle.id, false, rectangle.minX, segment, 1));
      subtractIntervals([rectangle.minZ, rectangle.maxZ], eastCuts)
        .forEach((segment, index) => addSegment(`${rectangle.id}-east-${index}`, rectangle.id, false, rectangle.maxX, segment, -1));
    });
  }

  private createRoomBaseTrim() {
    const material = createPrototypeDarkWoodMaterial();
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
      trim.castShadow = true;
      trim.receiveShadow = true;
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
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.userData = {
      wallId: options.id,
      gallerySurface: 'room-shell-wall'
    };

    this.wallMeshes.push(wall);
    this.scene.add(wall);
  }

  private createCeilingSurfaceDetails() {
    const material = createCeilingDetailMaterial();
    const ceilingY = galleryRoom.height - 0.026;
    const inset = 0.9;
    const stripHeight = 0.005;
    const stripWidth = 0.014;
    const usableWidth = galleryRoom.width - inset * 2;
    const usableDepth = galleryRoom.depth - inset * 2;
    const longitudinalXPositions = [
      -galleryRoom.width * 0.28,
      0,
      galleryRoom.width * 0.28
    ];
    const crossZPositions = [
      -galleryRoom.depth * 0.27,
      0,
      galleryRoom.depth * 0.27
    ];

    longitudinalXPositions.forEach((x, index) => {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(stripWidth, stripHeight, usableDepth),
        material
      );

      strip.position.set(x, ceilingY, 0);
      strip.receiveShadow = true;
      strip.userData = {
        ceilingDetailId: `ceiling-longitudinal-${index + 1}`,
        gallerySurface: 'ceiling-detail'
      };

      this.scene.add(strip);
    });

    crossZPositions.forEach((z, index) => {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(usableWidth, stripHeight, stripWidth),
        material
      );

      strip.position.set(0, ceilingY - 0.002, z);
      strip.receiveShadow = true;
      strip.userData = {
        ceilingDetailId: `ceiling-cross-${index + 1}`,
        gallerySurface: 'ceiling-detail'
      };

      this.scene.add(strip);
    });
  }

  private createCeilingLightPanels() {
    const panelMaterial = createCeilingLightPanelMaterial();
    const frameMaterial = createCeilingLightPanelFrameMaterial();
    const frameThickness = 0.024;
    const frameOverhang = 0.048;
    const fixtureY = galleryRoom.height - 0.025;
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const panelInstances = new THREE.InstancedMesh(
      unitBox,
      panelMaterial,
      ceilingLightPanels.length
    );
    const frameInstances = new THREE.InstancedMesh(
      unitBox.clone(),
      frameMaterial,
      ceilingLightPanels.length * 4
    );
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const worldUp = new THREE.Vector3(0, 1, 0);
    let frameIndex = 0;

    const setFixtureMatrix = (
      target: THREE.InstancedMesh,
      index: number,
      centerX: number,
      centerZ: number,
      rotationY: number,
      localX: number,
      localZ: number,
      width: number,
      height: number,
      depth: number
    ) => {
      const cosine = Math.cos(rotationY);
      const sine = Math.sin(rotationY);
      position.set(
        centerX + localX * cosine + localZ * sine,
        fixtureY,
        centerZ - localX * sine + localZ * cosine
      );
      quaternion.setFromAxisAngle(worldUp, rotationY);
      scale.set(width, height, depth);
      matrix.compose(position, quaternion, scale);
      target.setMatrixAt(index, matrix);
    };

    ceilingLightPanels.forEach((panel, panelIndex) => {
      const outerWidth = panel.width + frameOverhang;
      const outerDepth = panel.depth + frameOverhang;
      const sideDepth = panel.depth + frameOverhang * 0.52;

      setFixtureMatrix(
        panelInstances,
        panelIndex,
        panel.position[0],
        panel.position[1],
        panel.rotationY,
        0,
        0,
        panel.width * 0.7,
        0.007,
        panel.depth * 0.7
      );

      [
        [0, outerDepth / 2 - frameThickness / 2, outerWidth, frameThickness],
        [0, -outerDepth / 2 + frameThickness / 2, outerWidth, frameThickness],
        [-outerWidth / 2 + frameThickness / 2, 0, frameThickness, sideDepth],
        [outerWidth / 2 - frameThickness / 2, 0, frameThickness, sideDepth]
      ].forEach(([localX, localZ, width, depth]) => {
        setFixtureMatrix(
          frameInstances,
          frameIndex,
          panel.position[0],
          panel.position[1],
          panel.rotationY,
          localX,
          localZ,
          width,
          0.007,
          depth
        );
        frameIndex += 1;
      });
    });

    panelInstances.instanceMatrix.needsUpdate = true;
    panelInstances.userData = {
      lightPanelIds: ceilingLightPanels.map((panel) => panel.id),
      gallerySurface: 'ceiling-light-panel',
      fixtureBatch: 'panel-faces'
    };

    frameInstances.castShadow = true;
    frameInstances.receiveShadow = true;
    frameInstances.instanceMatrix.needsUpdate = true;
    frameInstances.userData = {
      lightPanelIds: ceilingLightPanels.map((panel) => panel.id),
      gallerySurface: 'ceiling-light-panel-frame',
      fixtureBatch: 'frame-bars'
    };

    this.scene.add(panelInstances);
    this.scene.add(frameInstances);
  }

  private createTrackLightFixtures() {
    const housingMaterial = createTrackLightHousingMaterial();
    const lensMaterial = createTrackLightLensMaterial();
    const trackGeometry = new THREE.BoxGeometry(1, 0.035, 0.035);
    const stemGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8);
    const housingGeometry = new THREE.CylinderGeometry(0.066, 0.058, 0.19, 12);
    const lensGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.012, 12);
    const headCount = galleryArtworks.length * 2;
    const tracks = new THREE.InstancedMesh(trackGeometry, housingMaterial, galleryArtworks.length);
    const stems = new THREE.InstancedMesh(stemGeometry, housingMaterial, headCount);
    const housings = new THREE.InstancedMesh(housingGeometry, housingMaterial, headCount);
    const lenses = new THREE.InstancedMesh(lensGeometry, lensMaterial, headCount);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const identityScale = new THREE.Vector3(1, 1, 1);
    const ceilingY = galleryRoom.height - 0.075;
    const cylinderAxis = new THREE.Vector3(0, 1, 0);
    let headIndex = 0;

    galleryArtworks.forEach((artwork, artworkIndex) => {
      const normal = new THREE.Vector3(
        Math.sin(artwork.rotationY),
        0,
        Math.cos(artwork.rotationY)
      );
      const tangent = new THREE.Vector3(
        Math.cos(artwork.rotationY),
        0,
        -Math.sin(artwork.rotationY)
      );
      const trackCenter = new THREE.Vector3(...artwork.position)
        .addScaledVector(normal, 0.88)
        .setY(ceilingY);
      const trackLength = Math.min(1.35, Math.max(0.82, artwork.width * 0.38));

      quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), artwork.rotationY);
      matrix.compose(trackCenter, quaternion, new THREE.Vector3(trackLength, 1, 1));
      tracks.setMatrixAt(artworkIndex, matrix);

      [-0.24, 0.24].forEach((offset) => {
        const stemPosition = trackCenter.clone()
          .addScaledVector(tangent, trackLength * offset)
          .add(new THREE.Vector3(0, -0.055, 0));
        matrix.compose(stemPosition, new THREE.Quaternion(), identityScale);
        stems.setMatrixAt(headIndex, matrix);

        const target = new THREE.Vector3(
          artwork.position[0],
          artwork.position[1],
          artwork.position[2]
        );
        const direction = target.clone().sub(stemPosition).normalize();
        const headPosition = stemPosition.clone().addScaledVector(direction, 0.13);
        quaternion.setFromUnitVectors(cylinderAxis, direction);
        matrix.compose(headPosition, quaternion, identityScale);
        housings.setMatrixAt(headIndex, matrix);

        const lensPosition = headPosition.clone().addScaledVector(direction, 0.101);
        matrix.compose(lensPosition, quaternion, identityScale);
        lenses.setMatrixAt(headIndex, matrix);
        headIndex += 1;
      });
    });

    [tracks, stems, housings, lenses].forEach((mesh) => {
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.userData = {
        gallerySurface: 'track-light-fixture',
        fixtureSource: 'displayed-artwork',
        minimumGalleryQuality: 'low'
      };
      mesh.instanceMatrix.needsUpdate = true;
      this.scene.add(mesh);
    });
  }

  private createLights() {
    addGalleryLighting(this.scene);
  }

  private subscribeToQualityUpdates() {
    this.unsubscribeFromQualityUpdates = subscribeToGalleryQuality(({ mode, tier }) => {
      if (tier !== this.qualityTier) {
        this.applyQualityTier(tier, mode === 'auto');
      }
    });
  }

  private applyQualityTier(tier: GalleryQualityTier, smoothTransition = false) {
    const previousTier = this.qualityTier;
    const qualityRank: Record<GalleryQualityTier, number> = {
      low: 0,
      balanced: 1,
      high: 2
    };
    const isPromotion = qualityRank[tier] > qualityRank[previousTier];
    const transitionId = ++this.qualityTransitionId;

    this.qualityTier = tier;
    const settings = getGalleryQualitySettings(tier);
    this.applyEnvironmentTextureFiltering(tier);

    const applyRendererResolution = () => {
      if (transitionId !== this.qualityTransitionId) {
        return;
      }

      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatioCap));
    };

    const applyShadowQuality = () => {
      if (transitionId !== this.qualityTransitionId) {
        return;
      }

      this.renderer.shadowMap.enabled = tier === 'high';
      this.renderer.shadowMap.needsUpdate = tier === 'high';
    };

    if (smoothTransition && isPromotion) {
      window.requestAnimationFrame(() => {
        applyRendererResolution();
        applyGalleryLightingQuality(this.scene, tier);

        const idleWindow = window as Window & {
          requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
        };

        const scheduleShadows = () => window.requestAnimationFrame(applyShadowQuality);

        if (idleWindow.requestIdleCallback) {
          idleWindow.requestIdleCallback(scheduleShadows, { timeout: 900 });
        } else {
          window.setTimeout(scheduleShadows, 120);
        }
      });
    } else if (smoothTransition) {
      // Demotion used to resize the drawing buffer twice while changing every
      // other quality feature in the same frame. Shed shadows, optional lights,
      // and resolution across separate frames so recovery does not itself hitch.
      applyShadowQuality();
      window.requestAnimationFrame(() => {
        if (transitionId !== this.qualityTransitionId) {
          return;
        }

        applyGalleryLightingQuality(this.scene, tier);
        window.requestAnimationFrame(applyRendererResolution);
      });
    } else {
      applyGalleryLightingQuality(this.scene, tier);
      applyRendererResolution();
      applyShadowQuality();
    }

    // setTier() already resets sampling and starts its cooldown before it
    // notifies subscribers. Resetting again here would clear that cooldown
    // during every automatic quality transition.
  }

  private applyEnvironmentTextureFiltering(tier: GalleryQualityTier) {
    const requestedAnisotropy: Record<GalleryQualityTier, number> = {
      low: 1,
      balanced: 4,
      high: 8
    };
    const anisotropy = Math.min(
      requestedAnisotropy[tier],
      this.renderer.capabilities.getMaxAnisotropy()
    );
    const visitedTextures = new Set<THREE.Texture>();
    const textureProperties = ['map', 'roughnessMap', 'bumpMap'] as const;

    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        const texturedMaterial = material as THREE.Material & Partial<Record<typeof textureProperties[number], THREE.Texture | null>>;

        textureProperties.forEach((property) => {
          const texture = texturedMaterial[property];
          if (
            !texture
            || !texture.userData.galleryEnvironmentTexture
            || visitedTextures.has(texture)
          ) {
            return;
          }

          visitedTextures.add(texture);
          if (texture.anisotropy !== anisotropy) {
            texture.anisotropy = anisotropy;
            texture.needsUpdate = true;
          }
        });
      });
    });
  }

  private createWalls() {
    const wallMaterial = createPrototypeMuseumWallMaterial();
    const woodMaterial = createPrototypeDarkWoodMaterial();
    const wallGeometries: THREE.BufferGeometry[] = [];
    const trimGeometries: THREE.BufferGeometry[] = [];

    galleryWalls.forEach((wall) => {
      const wallMesh = new THREE.Mesh(
        this.createWorldAlignedSurfaceBoxGeometry(
          wall.width,
          wall.height,
          wall.thickness,
          wall.position[0],
          wall.position[2],
          wall.rotationY
        ),
        wallMaterial
      );

      wallMesh.position.set(...wall.position);
      wallMesh.rotation.y = wall.rotationY;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      wallMesh.userData = {
        wallId: wall.id,
        gallerySurface: 'wall'
      };
      const trimMesh = this.createWallBaseTrim(wall, woodMaterial);

      wallMesh.updateMatrix();
      trimMesh.updateMatrix();
      wallMesh.geometry.applyMatrix4(wallMesh.matrix);
      trimMesh.geometry.applyMatrix4(trimMesh.matrix);
      wallGeometries.push(wallMesh.geometry);
      trimGeometries.push(trimMesh.geometry);
    });

    const mergedWallGeometry = mergeGeometries(wallGeometries, false);
    const mergedTrimGeometry = mergeGeometries(trimGeometries, false);

    if (!mergedWallGeometry || !mergedTrimGeometry) {
      wallGeometries.forEach((geometry) => geometry.dispose());
      trimGeometries.forEach((geometry) => geometry.dispose());
      throw new Error('Could not merge static gallery wall geometry.');
    }

    wallGeometries.forEach((geometry) => geometry.dispose());
    trimGeometries.forEach((geometry) => geometry.dispose());

    const wallBatch = new THREE.Mesh(mergedWallGeometry, wallMaterial);
    wallBatch.castShadow = true;
    wallBatch.receiveShadow = true;
    wallBatch.userData = {
      wallIds: galleryWalls.map((wall) => wall.id),
      gallerySurface: 'wall',
      geometryBatch: 'static-display-walls'
    };

    const trimBatch = new THREE.Mesh(mergedTrimGeometry, woodMaterial);
    trimBatch.castShadow = true;
    trimBatch.receiveShadow = true;
    trimBatch.userData = {
      wallTrimIds: galleryWalls.map((wall) => wall.id),
      gallerySurface: 'wall-trim',
      geometryBatch: 'static-display-wall-trim'
    };

    this.wallMeshes.push(wallBatch);
    this.scene.add(wallBatch);
    this.scene.add(trimBatch);
  }

  private createWayfindingMarkers() {
    const markers = [
      {
        wallId: 'wall-entry-left-guide',
        label: 'CLIMBING',
        direction: 'LEFT WING',
        arrow: '\u2190'
      },
      {
        wallId: 'wall-entry-right-guide',
        label: 'LANDSCAPE',
        direction: 'RIGHT WING',
        arrow: '\u2192'
      }
    ];

    markers.forEach((marker) => {
      const wall = galleryWalls.find((candidate) => candidate.id === marker.wallId);
      if (!wall) return;

      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#25211d';
      context.textBaseline = 'middle';
      context.font = '600 74px Arial, sans-serif';
      context.letterSpacing = '9px';
      context.fillText(`${marker.arrow}  ${marker.label}`, 38, 104);
      context.fillStyle = '#6f675d';
      context.font = '500 29px Arial, sans-serif';
      context.letterSpacing = '7px';
      context.fillText(marker.direction, 42, 185);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      this.plaqueTextures.add(texture);

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false
      });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 0.59), material);

      sign.position.set(...wall.position);
      sign.position.y = 1.72;
      sign.rotation.y = wall.rotationY;
      this.offsetArtworkFromWall(sign, wall.rotationY, wall.thickness / 2 + 0.006);
      sign.userData = {
        wayfindingId: marker.wallId,
        gallerySurface: 'wayfinding-marker'
      };

      this.scene.add(sign);
    });
  }


  private createWallBaseTrim(wall: ResolvedGalleryWall, material: THREE.Material) {
    const geometry = new THREE.BoxGeometry(wall.width, 0.065, 0.055);
    this.scaleGeometryUvs(
      geometry,
      wall.width / GalleryScene.surfaceTextureReferenceMeters,
      1
    );
    const trim = new THREE.Mesh(geometry, material);

    trim.position.set(...wall.position);
    trim.position.y = 0.11;
    trim.rotation.y = wall.rotationY;
    trim.castShadow = true;
    trim.receiveShadow = true;
    trim.userData = {
      wallTrimId: wall.id,
      gallerySurface: 'wall-trim'
    };
    this.offsetArtworkFromWall(trim, wall.rotationY, wall.thickness / 2 + 0.028);

    return trim;
  }

  private createWorldAlignedSurfaceBoxGeometry(
    width: number,
    height: number,
    depth: number,
    centerX: number,
    centerZ: number,
    rotationY = 0
  ) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    this.alignBoxGeometryUvsToWorld(geometry, centerX, centerZ, rotationY);
    return geometry;
  }

  private scaleGeometryUvs(geometry: THREE.BufferGeometry, repeatX: number, repeatY: number) {
    const uv = geometry.getAttribute('uv');
    if (!uv) return;

    const safeRepeatX = Math.max(0.25, repeatX);
    const safeRepeatY = Math.max(0.25, repeatY);

    for (let index = 0; index < uv.count; index += 1) {
      uv.setXY(
        index,
        uv.getX(index) * safeRepeatX,
        uv.getY(index) * safeRepeatY
      );
    }

    uv.needsUpdate = true;
  }

  private alignFloorGeometryUvsToWorld(
    geometry: THREE.BufferGeometry,
    centerX: number,
    centerZ: number
  ) {
    const uv = geometry.getAttribute('uv');
    const positions = geometry.getAttribute('position');
    if (!uv || !positions) return;

    for (let index = 0; index < uv.count; index += 1) {
      const worldX = positions.getX(index) + centerX;
      // PlaneGeometry is authored in XY and then rotated onto XZ. Its positive
      // local Y axis becomes negative world Z after the -90 degree rotation.
      const worldZ = -positions.getY(index) + centerZ;
      uv.setXY(
        index,
        worldX / GalleryScene.surfaceTextureReferenceMeters,
        worldZ / GalleryScene.surfaceTextureReferenceMeters
      );
    }

    uv.needsUpdate = true;
  }

  private alignBoxGeometryUvsToWorld(
    geometry: THREE.BufferGeometry,
    centerX: number,
    centerZ: number,
    rotationY: number
  ) {
    const uv = geometry.getAttribute('uv');
    const positions = geometry.getAttribute('position');
    const normals = geometry.getAttribute('normal');
    if (!uv || !positions || !normals) return;

    const cosine = Math.cos(rotationY);
    const sine = Math.sin(rotationY);

    for (let index = 0; index < uv.count; index += 1) {
      const localX = positions.getX(index);
      const localZ = positions.getZ(index);
      const worldX = localX * cosine + localZ * sine + centerX;
      const worldZ = -localX * sine + localZ * cosine + centerZ;
      const worldNormalX = normals.getX(index) * cosine + normals.getZ(index) * sine;
      const normalX = Math.abs(worldNormalX);
      const normalY = Math.abs(normals.getY(index));
      const positionY = positions.getY(index);

      if (normalY > 0.5) {
        uv.setXY(
          index,
          worldX / GalleryScene.surfaceTextureReferenceMeters,
          worldZ / GalleryScene.surfaceTextureReferenceMeters
        );
      } else if (normalX > 0.5) {
        uv.setXY(
          index,
          worldZ / GalleryScene.surfaceTextureReferenceMeters,
          positionY / GalleryScene.surfaceTextureReferenceHeight
        );
      } else {
        uv.setXY(
          index,
          worldX / GalleryScene.surfaceTextureReferenceMeters,
          positionY / GalleryScene.surfaceTextureReferenceHeight
        );
      }
    }

    uv.needsUpdate = true;
  }

  private createArtwork() {
    const frameMaterial = createPrototypeDarkWoodMaterial();
    const frameRailMaterial = createPrototypeDarkWoodRailMaterial(0.25, 0.15);
    const frameRailHighlightMaterial = createPrototypeDarkWoodRailMaterial(0.19, 0.1);
    const frameRailCatchlightMaterial = createPrototypeDarkWoodRailMaterial(0.17, 0.075);
    const matMaterial = createMatMaterial();
    const plaqueBodyMaterial = galleryArtworks.some((artwork) => artwork.plaqueEnabled)
      ? createPlaqueBodyMaterial()
      : null;
    const frameInstances = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      frameMaterial,
      galleryArtworks.length
    );
    const matInstances = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1),
      matMaterial,
      galleryArtworks.length
    );

    galleryArtworks.forEach((artwork, frameInstanceIndex) => {
      const highResolutionTexture = getCachedGalleryTexture(artwork.image);
      const previewTexture = artwork.previewImage
        ? getCachedGalleryTexture(artwork.previewImage)
        : null;

      const initialTexture = highResolutionTexture ?? previewTexture;
      const initialTextureUrl = highResolutionTexture
        ? artwork.image
        : previewTexture
          ? artwork.previewImage ?? artwork.image
          : null;
      const dimensions = this.resolveArtworkDimensions(artwork, initialTexture);

      const frame = this.createArtworkFrame(artwork, frameMaterial);
      this.updateArtworkFrameInstance(frameInstances, frameInstanceIndex, frame, dimensions);
      const frameRails = this.createArtworkFrameRails(
        artwork,
        dimensions,
        frameRailMaterial,
        frameRailHighlightMaterial,
        frameRailCatchlightMaterial,
        frame
      );
      const mat = this.createArtworkMat(artwork, matMaterial, frame);
      this.updateArtworkMatInstance(matInstances, frameInstanceIndex, mat, dimensions);
      const image = this.createArtworkImage(artwork, dimensions, initialTexture, initialTextureUrl, frame);
      const plaque = this.createArtworkPlaque(artwork, dimensions, frame, plaqueBodyMaterial);

      this.scene.add(frameRails);
      this.scene.add(image);

      if (plaque) {
        this.scene.add(plaque);
      }

      this.artworkMeshes.push(image);
      this.artworkMeshSets.push({
        artwork,
        frame,
        frameInstanceIndex,
        frameRails,
        mat,
        matInstanceIndex: frameInstanceIndex,
        image,
        plaque
      });
    });

    frameInstances.castShadow = true;
    frameInstances.receiveShadow = true;
    frameInstances.instanceMatrix.needsUpdate = true;
    frameInstances.userData = {
      artworkFrameIds: galleryArtworks.map((artwork) => artwork.id),
      gallerySurface: 'artwork-frame',
      geometryBatch: 'artwork-frame-bodies'
    };
    this.artworkFrameInstances = frameInstances;
    this.scene.add(frameInstances);

    matInstances.receiveShadow = true;
    matInstances.instanceMatrix.needsUpdate = true;
    matInstances.userData = {
      artworkMatIds: galleryArtworks.map((artwork) => artwork.id),
      gallerySurface: 'artwork-mat',
      geometryBatch: 'artwork-mats'
    };
    this.artworkMatInstances = matInstances;
    this.scene.add(matInstances);
  }

  private updateArtworkFrameInstance(
    instances: THREE.InstancedMesh,
    index: number,
    frame: THREE.Object3D,
    dimensions: FrameDimensions
  ) {
    frame.updateMatrix();
    const matrix = frame.matrix.clone();
    matrix.scale(new THREE.Vector3(
      dimensions.width + this.artworkFrameBorder,
      dimensions.height + this.artworkFrameBorder,
      this.artworkFrameDepth
    ));
    instances.setMatrixAt(index, matrix);
    instances.instanceMatrix.needsUpdate = true;
  }

  private updateArtworkMatInstance(
    instances: THREE.InstancedMesh,
    index: number,
    mat: THREE.Object3D,
    dimensions: FrameDimensions
  ) {
    mat.updateMatrix();
    const matrix = mat.matrix.clone();
    matrix.scale(new THREE.Vector3(
      dimensions.width + this.artworkMatBorder,
      dimensions.height + this.artworkMatBorder,
      1
    ));
    instances.setMatrixAt(index, matrix);
    instances.instanceMatrix.needsUpdate = true;
  }

  private createArtworkFrame(
    artwork: GalleryArtwork,
    material: THREE.Material
  ) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      material
    );

    frame.position.set(...artwork.position);
    frame.rotation.y = artwork.rotationY;
    frame.castShadow = true;
    frame.receiveShadow = true;
    frame.userData = {
      artworkFrameId: artwork.id
    };
    this.offsetArtworkFromWall(frame, artwork.rotationY, this.artworkFrameDepth / 2 + 0.006);

    return frame;
  }

  private createArtworkFrameRails(
    artwork: GalleryArtwork,
    dimensions: FrameDimensions,
    railMaterial: THREE.Material,
    highlightMaterial: THREE.Material,
    catchlightMaterial: THREE.Material,
    frame: THREE.Mesh
  ) {
    const frameRails = new THREE.Group();

    frameRails.position.copy(frame.position);
    frameRails.rotation.copy(frame.rotation);
    frameRails.userData = {
      artworkFrameRailId: artwork.id,
      gallerySurface: 'artwork-frame-rails'
    };

    this.populateArtworkFrameRails(
      frameRails,
      dimensions,
      railMaterial,
      highlightMaterial,
      catchlightMaterial,
      artwork.id
    );

    return frameRails;
  }

  private populateArtworkFrameRails(
    frameRails: THREE.Group,
    dimensions: FrameDimensions,
    railMaterial: THREE.Material,
    highlightMaterial: THREE.Material,
    catchlightMaterial: THREE.Material,
    artworkId: string
  ) {
    const outerWidth = dimensions.width + this.artworkFrameBorder;
    const outerHeight = dimensions.height + this.artworkFrameBorder;
    const railWidth = Math.max(0.062, (this.artworkFrameBorder - this.artworkMatBorder) / 2 + 0.014);
    const railDepth = Math.min(0.044, this.artworkFrameDepth * 0.58);
    const railZ = this.artworkFrameDepth * 0.22;
    const verticalHeight = Math.max(0.1, outerHeight - railWidth * 2);

    const railDefinitions = [
      { id: 'top', width: outerWidth, height: railWidth, x: 0, y: outerHeight / 2 - railWidth / 2 },
      { id: 'bottom', width: outerWidth, height: railWidth, x: 0, y: -outerHeight / 2 + railWidth / 2 },
      { id: 'left', width: railWidth, height: verticalHeight, x: -outerWidth / 2 + railWidth / 2, y: 0 },
      { id: 'right', width: railWidth, height: verticalHeight, x: outerWidth / 2 - railWidth / 2, y: 0 }
    ];

    this.addMergedArtworkFrameLayer(
      frameRails,
      railDefinitions,
      railDepth,
      railZ,
      railMaterial,
      artworkId,
      'base',
      'artwork-frame-rail'
    );

    const highlightWidth = Math.max(0.014, railWidth * 0.24);
    const highlightDepth = Math.min(0.014, this.artworkFrameDepth * 0.2);
    const highlightZ = railZ + railDepth / 2 + highlightDepth / 2 + 0.002;
    const highlightHorizontalWidth = Math.max(0.1, outerWidth - railWidth * 2 + highlightWidth * 2);
    const highlightVerticalHeight = Math.max(0.1, outerHeight - railWidth * 2 + highlightWidth * 2);
    const highlightDefinitions = [
      {
        id: 'top-inner-sheen',
        width: highlightHorizontalWidth,
        height: highlightWidth,
        x: 0,
        y: outerHeight / 2 - railWidth + highlightWidth / 2
      },
      {
        id: 'bottom-inner-sheen',
        width: highlightHorizontalWidth,
        height: highlightWidth,
        x: 0,
        y: -outerHeight / 2 + railWidth - highlightWidth / 2
      },
      {
        id: 'left-inner-sheen',
        width: highlightWidth,
        height: highlightVerticalHeight,
        x: -outerWidth / 2 + railWidth - highlightWidth / 2,
        y: 0
      },
      {
        id: 'right-inner-sheen',
        width: highlightWidth,
        height: highlightVerticalHeight,
        x: outerWidth / 2 - railWidth + highlightWidth / 2,
        y: 0
      }
    ];

    this.addMergedArtworkFrameLayer(
      frameRails,
      highlightDefinitions,
      highlightDepth,
      highlightZ,
      highlightMaterial,
      artworkId,
      'inner-sheen',
      'artwork-frame-rail-highlight'
    );

    const catchlightWidth = Math.max(0.01, railWidth * 0.15);
    const catchlightDepth = Math.min(0.011, this.artworkFrameDepth * 0.16);
    const catchlightZ = highlightZ + highlightDepth / 2 + catchlightDepth / 2 + 0.0015;
    const catchlightDefinitions = [
      {
        id: 'top-lacquer-catchlight',
        width: Math.max(0.1, outerWidth - catchlightWidth * 4),
        height: catchlightWidth,
        x: 0,
        y: outerHeight / 2 - catchlightWidth * 1.6,
      },
      {
        id: 'left-lacquer-catchlight',
        width: catchlightWidth,
        height: Math.max(0.1, outerHeight - railWidth * 2.2),
        x: -outerWidth / 2 + catchlightWidth * 1.7,
        y: 0,
      },
      {
        id: 'right-lacquer-catchlight',
        width: catchlightWidth,
        height: Math.max(0.1, outerHeight - railWidth * 2.2),
        x: outerWidth / 2 - catchlightWidth * 1.7,
        y: 0,
      }
    ];

    this.addMergedArtworkFrameLayer(
      frameRails,
      catchlightDefinitions,
      catchlightDepth,
      catchlightZ,
      catchlightMaterial,
      artworkId,
      'lacquer-catchlight',
      'artwork-frame-rail-catchlight'
    );
  }

  private addMergedArtworkFrameLayer(
    frameRails: THREE.Group,
    definitions: Array<{ id: string; width: number; height: number; x: number; y: number }>,
    depth: number,
    z: number,
    material: THREE.Material,
    artworkId: string,
    layer: string,
    surface: string
  ) {
    const pieceGeometries = definitions.map((definition) => {
      const geometry = new THREE.BoxGeometry(definition.width, definition.height, depth);
      geometry.translate(definition.x, definition.y, z);
      return geometry;
    });
    const mergedGeometry = mergeGeometries(pieceGeometries, false);
    pieceGeometries.forEach((geometry) => geometry.dispose());

    if (!mergedGeometry) {
      throw new Error(`Could not merge ${layer} frame geometry for ${artworkId}.`);
    }

    const mesh = new THREE.Mesh(mergedGeometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      artworkFrameRailId: artworkId,
      artworkFrameRailParts: definitions.map((definition) => definition.id),
      artworkFrameRailLayer: layer,
      gallerySurface: surface
    };
    frameRails.add(mesh);
  }

  private updateArtworkFrameRails(
    frameRails: THREE.Group,
    dimensions: FrameDimensions,
    railMaterial: THREE.Material,
    highlightMaterial: THREE.Material,
    catchlightMaterial: THREE.Material,
    artworkId: string
  ) {
    [...frameRails.children].forEach((child) => {
      const mesh = child as THREE.Mesh;

      mesh.geometry?.dispose();
      frameRails.remove(child);
    });

    this.populateArtworkFrameRails(
      frameRails,
      dimensions,
      railMaterial,
      highlightMaterial,
      catchlightMaterial,
      artworkId
    );
  }

  private createArtworkMat(
    artwork: GalleryArtwork,
    material: THREE.Material,
    frame: THREE.Mesh
  ) {
    const mat = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      material
    );

    mat.position.copy(frame.position);
    mat.rotation.copy(frame.rotation);
    mat.receiveShadow = true;
    mat.userData = {
      artworkMatId: artwork.id
    };
    this.offsetArtworkFromWall(mat, artwork.rotationY, this.artworkFrameDepth / 2 + 0.014);

    return mat;
  }

  private createArtworkPlaqueTexture(artwork: GalleryArtwork) {
    const canvas = document.createElement('canvas');
    const width = 1024;
    // Keep the label texture ratio aligned with the physical plaque so type
    // remains optically correct instead of stretching across the wall plane.
    const height = 337;
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

    const title = artwork.title;
    const metaLine = formatGalleryArtworkPublicMeta(artwork);

    context.fillStyle = 'rgba(8, 9, 8, 1)';
    context.font = '700 62px Arial, Helvetica, sans-serif';
    context.textBaseline = 'top';
    context.fillText(this.truncatePlaqueText(context, title, width - 84), 38, 30);

    context.fillStyle = 'rgba(8, 9, 8, 0.9)';
    context.font = '700 33px Arial, Helvetica, sans-serif';
    context.fillText(this.truncatePlaqueText(context, metaLine.toUpperCase(), width - 84), 38, 132);

    context.fillStyle = 'rgba(8, 9, 8, 0.78)';
    context.font = '600 30px Arial, Helvetica, sans-serif';
    context.fillText(this.truncatePlaqueText(context, artwork.location.toUpperCase(), width - 84), 38, 190);

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
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
    frame: THREE.Mesh,
    bodyMaterial: THREE.Material | null
  ) {
    if (!artwork.plaqueEnabled || !bodyMaterial) {
      return undefined;
    }

    const texture = this.createArtworkPlaqueTexture(artwork);

    if (!texture) {
      return undefined;
    }

    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(
        this.artworkPlaqueWidth,
        this.artworkPlaqueHeight,
        this.artworkPlaqueDepth
      ),
      bodyMaterial
    );
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(this.artworkPlaqueWidth, this.artworkPlaqueHeight),
      createPlaqueMaterial(texture)
    );

    label.position.z = this.artworkPlaqueDepth / 2 + 0.0005;
    label.userData = {
      artworkPlaqueId: artwork.id,
      gallerySurface: 'artwork-plaque-label'
    };
    plaque.add(label);
    plaque.rotation.copy(frame.rotation);
    plaque.castShadow = true;
    plaque.receiveShadow = true;
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
    sourceTextureUrl: string | null,
    frame: THREE.Mesh
  ) {
    if (!sourceTexture) {
      console.warn(`Gallery texture was not preloaded: ${artwork.image}`);
    }

    const framedTexture = sourceTexture
      ? this.createFramedArtworkTexture(sourceTexture, artwork, dimensions)
      : null;

    if (framedTexture && sourceTextureUrl) {
      this.renderer.initTexture(framedTexture);
      this.markArtworkTexturePrepared(
        sourceTextureUrl,
        sourceTextureUrl === artwork.image ? 'full' : 'preview'
      );
    }

    const image = new THREE.Mesh(
      new THREE.PlaneGeometry(dimensions.width, dimensions.height),
      createArtworkImageMaterial(framedTexture)
    );

    image.position.copy(frame.position);
    image.rotation.copy(frame.rotation);
    image.castShadow = true;
    image.userData = {
      artworkId: artwork.id,
      textureUrl: artwork.image,
      previewTextureUrl: artwork.previewImage,
      activeTextureUrl: sourceTextureUrl
    };
    this.offsetArtworkFromWall(image, artwork.rotationY, this.artworkFrameDepth / 2 + 0.03);

    return image;
  }

  private markArtworkTexturePrepared(url: string, kind: 'preview' | 'full') {
    if (kind === 'preview') {
      this.preparedPreviewTextureUrls.add(url);
      const requiredPreviewTextureUrls = new Set(
        galleryArtworks
          .map((artwork) => artwork.previewImage)
          .filter((source): source is string => Boolean(source))
      );

      if ([...requiredPreviewTextureUrls].every((source) => this.preparedPreviewTextureUrls.has(source))) {
        markGalleryGpuTierReady('balanced');
      }
      return;
    }

    this.preparedFullTextureUrls.add(url);
    const requiredFullTextureUrls = new Set(galleryArtworks.map((artwork) => artwork.image));

    if ([...requiredFullTextureUrls].every((source) => this.preparedFullTextureUrls.has(source))) {
      markGalleryGpuTierReady('high');
    }
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
      maxHeight: artwork.maxHeight,
      wallWidth: artwork.wallWidth,
      wallHeight: artwork.wallHeight,
      artworkCenterY: artwork.position[1],
      frameBorder: this.artworkFrameBorder,
      wallMargin: 0.24
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
      artwork.galleryPosition,
      artwork.galleryScale
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
        const isPreviewTexture = galleryArtworks.some((artwork) => artwork.previewImage === url);

        if (isPreviewTexture) {
          // Preview textures are the correctness path, not an optional quality
          // enhancement. Never leave an empty frame waiting for idle time.
          window.requestAnimationFrame(() => {
            if (!this.destroyed) {
              this.applyHighResolutionTexture(url, texture);
            }
          });
          return;
        }

        this.pendingTextureUpdates.set(url, texture);
        this.schedulePreparedTextureUpdate();
      }
    );
  }

  private schedulePreparedTextureUpdate() {
    if (this.texturePreparationScheduled || this.pendingTextureUpdates.size === 0) {
      return;
    }

    this.texturePreparationScheduled = true;
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: (deadline: { timeRemaining: () => number }) => void) => number;
    };
    const prepareNext = (hasIdleBudget = true) => {
      this.texturePreparationScheduled = false;

      if (!hasIdleBudget) {
        this.schedulePreparedTextureUpdate();
        return;
      }

      const next = this.pendingTextureUpdates.entries().next();

      if (next.done) {
        return;
      }

      const [url, texture] = next.value;
      this.pendingTextureUpdates.delete(url);
      this.applyHighResolutionTexture(url, texture);
      this.schedulePreparedTextureUpdate();
    };

    if (idleWindow.requestIdleCallback) {
      // Never force a GPU upload through an expired idle callback. Waiting is
      // preferable to creating a visible long frame merely to reach High.
      idleWindow.requestIdleCallback((deadline) => prepareNext(deadline.timeRemaining() >= 8));
    } else {
      window.setTimeout(() => {
        const startedAt = performance.now();
        window.requestAnimationFrame(() => prepareNext(performance.now() - startedAt < 20));
      }, 80);
    }
  }

  private applyHighResolutionTexture(url: string, texture: THREE.Texture) {
    this.artworkMeshSets.forEach((meshSet) => {
      const isFullTexture = meshSet.image.userData.textureUrl === url;
      const isPreviewTexture = meshSet.image.userData.previewTextureUrl === url;

      if (!isFullTexture && !isPreviewTexture) {
        return;
      }

      if (isPreviewTexture && meshSet.image.userData.activeTextureUrl === meshSet.image.userData.textureUrl) {
        return;
      }

      if (Array.isArray(meshSet.image.material)) {
        return;
      }

      const dimensions = this.resolveArtworkDimensions(meshSet.artwork, texture);
      if (this.artworkFrameInstances) {
        this.updateArtworkFrameInstance(
          this.artworkFrameInstances,
          meshSet.frameInstanceIndex,
          meshSet.frame,
          dimensions
        );
      }
      const frameRailMaterial = (meshSet.frameRails.children.find((child) => child.userData.artworkFrameRailLayer === 'base') as THREE.Mesh | undefined)
        ?.material as THREE.Material | undefined;
      const frameRailHighlightMaterial = (meshSet.frameRails.children.find((child) => child.userData.artworkFrameRailLayer === 'inner-sheen') as THREE.Mesh | undefined)
        ?.material as THREE.Material | undefined;
      const frameRailCatchlightMaterial = (meshSet.frameRails.children.find((child) => child.userData.artworkFrameRailLayer === 'lacquer-catchlight') as THREE.Mesh | undefined)
        ?.material as THREE.Material | undefined;
      this.updateArtworkFrameRails(
        meshSet.frameRails,
        dimensions,
        frameRailMaterial ?? createPrototypeDarkWoodRailMaterial(0.25, 0.15),
        frameRailHighlightMaterial ?? createPrototypeDarkWoodRailMaterial(0.19, 0.1),
        frameRailCatchlightMaterial ?? createPrototypeDarkWoodRailMaterial(0.17, 0.075),
        meshSet.artwork.id
      );
      if (this.artworkMatInstances) {
        this.updateArtworkMatInstance(
          this.artworkMatInstances,
          meshSet.matInstanceIndex,
          meshSet.mat,
          dimensions
        );
      }
      this.updatePlaneGeometry(meshSet.image, dimensions.width, dimensions.height);

      if (meshSet.plaque) {
        this.positionArtworkPlaque(meshSet.plaque, meshSet.artwork, dimensions, meshSet.frame);
      }

      const framedTexture = this.createFramedArtworkTexture(texture, meshSet.artwork, dimensions);
      // Upload the replacement while this idle task owns the main thread. The
      // following visual swap then reuses an initialized GPU texture instead
      // of making the next visible render pay the upload cost.
      this.renderer.initTexture(framedTexture);
      if (isPreviewTexture) {
        this.markArtworkTexturePrepared(url, 'preview');
      }
      if (isFullTexture) {
        this.markArtworkTexturePrepared(url, 'full');
      }
      const material = meshSet.image.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;

      window.requestAnimationFrame(() => {
        if (this.destroyed) {
          framedTexture.dispose();
          this.framedTextures.delete(framedTexture);
          return;
        }

        if (!this.pendingTextureUpdates.has(url) || this.pendingTextureUpdates.get(url) === texture) {
          this.replaceMaterialTexture(material, framedTexture);
          meshSet.image.userData.activeTextureUrl = url;
        } else {
          framedTexture.dispose();
          this.framedTextures.delete(framedTexture);
        }
      });
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
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private unbindEvents() {
    this.lookController.unbindEvents();

    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('blur', this.handleWindowBlur);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private handleContextLost = (event: Event) => {
    event.preventDefault();
    if (this.destroyed || this.contextLost) return;

    this.contextLost = true;
    this.movementController.reset();
    this.lookController.resetInteraction();
    this.clearFocusedArtwork();
    this.onContextStateChange('lost');
  };

  private handleContextRestored = () => {
    if (this.destroyed || !this.contextLost) return;

    this.contextLost = false;
    this.applyQualityTier(this.qualityTier);
    this.renderer.shadowMap.needsUpdate = this.qualityTier === 'high';
    this.onContextStateChange('restored');
  };

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
    this.lookController.resetInteraction();
  };

  private handleResize = () => {
    if (this.inputMode === 'touch') {
      this.movementController.reset();
      this.lookController.resetInteraction();
    }

    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(Math.min(
      window.devicePixelRatio,
      getGalleryQualitySettings(this.qualityTier).pixelRatioCap
    ));
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
      this.focusRaycastTargets,
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
    const workStartedAt = performance.now();
    const delta = this.movementController.getFrameDelta(timestamp);

    if (!this.contextLost) {
      this.lookController.update(delta);
      this.movementController.update(this.camera, this.lookController.getYaw(), delta);
      this.updateArtworkFocus();
      this.renderer.render(this.scene, this.camera);
    }

    if (!this.contextLost && typeof timestamp === 'number') {
      recordGalleryFrame(timestamp, performance.now() - workStartedAt);
    }

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

    if (
      materialWithMap.map &&
      !materialWithMap.map.userData.galleryEnvironmentTexture &&
      !disposedTextures.has(materialWithMap.map)
    ) {
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

  public getRuntimeDiagnostics(): GalleryRuntimeDiagnostics {
    const context = this.renderer.getContext();
    const debugInfo = context.getExtension('WEBGL_debug_renderer_info') as {
      UNMASKED_RENDERER_WEBGL: number;
    } | null;
    const rendererName = debugInfo
      ? String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
      : String(context.getParameter(context.RENDERER));
    const litArtworkIds = new Set<string>();
    let artworkLightCount = 0;

    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Light) || !object.visible) return;
      const artworkId = object.userData.artworkId as string | undefined;
      if (!artworkId) return;
      artworkLightCount += 1;
      litArtworkIds.add(artworkId);
    });

    return {
      renderPixelRatio: this.renderer.getPixelRatio(),
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      artworkLightCount,
      litArtworkCount: litArtworkIds.size,
      displayedArtworkCount: galleryArtworks.length,
      layoutModuleCount: galleryLayoutModules.length,
      roomCount: galleryLayoutModules.filter((module) => module.kind === 'room').length,
      hallwayCount: galleryLayoutModules.filter((module) => module.kind === 'hallway').length,
      renderer: rendererName
    };
  }

  public destroy() {
    this.destroyed = true;
    this.qualityTransitionId += 1;
    window.cancelAnimationFrame(this.animationFrameId);

    this.unsubscribeFromTextureUpdates?.();
    this.unsubscribeFromTextureUpdates = null;
    this.pendingTextureUpdates.clear();
    this.preparedFullTextureUrls.clear();
    this.preparedPreviewTextureUrls.clear();
    resetGalleryGpuTier();

    this.unsubscribeFromQualityUpdates?.();
    this.unsubscribeFromQualityUpdates = null;

    this.framedTextures.forEach((texture) => {
      texture.dispose();
    });

    this.framedTextures.clear();

    this.plaqueTextures.forEach((texture) => {
      texture.dispose();
    });

    this.plaqueTextures.clear();

    this.lookController.resetInteraction();
    this.lookController.releasePointerLock();
    this.unbindEvents();
    this.disposeSceneResources();

    this.wallMeshes = [];
    this.artworkMeshes = [];
    this.focusRaycastTargets = [];
    this.artworkMeshSets.forEach((meshSet) => {
      meshSet.frame.geometry.dispose();
      meshSet.mat.geometry.dispose();
    });
    this.artworkMeshSets = [];
    this.artworkFrameInstances = null;
    this.artworkMatInstances = null;
    this.focusedArtworkId = null;

    this.renderer.dispose();

    this.container.innerHTML = '';
  }
}
