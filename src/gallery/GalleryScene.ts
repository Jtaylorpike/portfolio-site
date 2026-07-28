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
  inputMode?: GalleryInputMode;
};

export type GalleryRuntimeDiagnostics = {
  renderPixelRatio: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  renderer: string;
};

type FrameDimensions = {
  width: number;
  height: number;
};

type ArtworkMeshSet = {
  artwork: GalleryArtwork;
  frame: THREE.Mesh;
  frameRails: THREE.Group;
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
  private qualityTier: GalleryQualityTier;
  private unsubscribeFromQualityUpdates: (() => void) | null = null;

  private raycaster = new THREE.Raycaster();
  private centerPoint = new THREE.Vector2(0, 0);
  private wallMeshes: THREE.Mesh[] = [];
  private artworkMeshes: THREE.Mesh[] = [];
  private artworkMeshSets: ArtworkMeshSet[] = [];
  private focusedArtworkId: string | null = null;
  private readonly artworkFocusMaxDistance = 8.75;
  private readonly artworkFrameDepth = 0.078;
  private readonly artworkFrameBorder = 0.24;
  private readonly artworkMatBorder = 0.07;
  private readonly artworkPlaqueWidth = 0.74;
  private readonly artworkPlaqueHeight = 0.22;
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

  constructor(options: GallerySceneOptions) {
    this.container = options.container;
    this.onExit = options.onExit;
    this.onArtworkFocus = options.onArtworkFocus;
    this.onArtworkClear = options.onArtworkClear;
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
    this.createArtwork();
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
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(module.width + 0.04, module.depth + 0.04),
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
      const ceiling = new THREE.Mesh(
        new THREE.BoxGeometry(module.width, galleryRoom.ceilingThickness, module.depth),
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
      interval: Interval
    ) => {
      const otherRectangles = rectangles.filter((rectangle) => rectangle.id !== ownerId);
      const junctionInset = galleryRoom.wallThickness / 2;
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
      const adjustedInterval: Interval = [
        interval[0] + (minConnects ? junctionInset : 0),
        interval[1] - (maxConnects ? junctionInset : 0)
      ];
      const length = interval[1] - interval[0];
      const center = (interval[0] + interval[1]) / 2;
      const trimLength = adjustedInterval[1] - adjustedInterval[0];
      const trimCenter = (adjustedInterval[0] + adjustedInterval[1]) / 2;
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? length : galleryRoom.wallThickness,
          galleryRoom.height,
          horizontal ? galleryRoom.wallThickness : length
        ),
        wallMaterial
      );
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? trimLength : 0.062,
          0.082,
          horizontal ? 0.062 : trimLength
        ),
        trimMaterial
      );

      wall.position.set(
        horizontal ? center : fixed,
        galleryRoom.height / 2,
        horizontal ? fixed : center
      );
      trim.position.set(
        horizontal ? trimCenter : fixed,
        0.12,
        horizontal ? fixed : trimCenter
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
        .forEach((segment, index) => addSegment(`${rectangle.id}-north-${index}`, rectangle.id, true, rectangle.minZ, segment));
      subtractIntervals([rectangle.minX, rectangle.maxX], southCuts)
        .forEach((segment, index) => addSegment(`${rectangle.id}-south-${index}`, rectangle.id, true, rectangle.maxZ, segment));
      subtractIntervals([rectangle.minZ, rectangle.maxZ], westCuts)
        .forEach((segment, index) => addSegment(`${rectangle.id}-west-${index}`, rectangle.id, false, rectangle.minX, segment));
      subtractIntervals([rectangle.minZ, rectangle.maxZ], eastCuts)
        .forEach((segment, index) => addSegment(`${rectangle.id}-east-${index}`, rectangle.id, false, rectangle.maxX, segment));
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

    ceilingLightPanels.forEach((panel) => {
      const fixture = new THREE.Group();
      const fixtureY = galleryRoom.height - 0.025;
      const outerWidth = panel.width + frameOverhang;
      const outerDepth = panel.depth + frameOverhang;

      fixture.position.set(panel.position[0], fixtureY, panel.position[1]);
      fixture.rotation.y = panel.rotationY;
      fixture.userData = {
        lightPanelId: panel.id,
        gallerySurface: 'ceiling-light-fixture'
      };

      const lightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(panel.width * 0.7, 0.007, panel.depth * 0.7),
        panelMaterial
      );

      lightPanel.userData = {
        lightPanelId: panel.id,
        gallerySurface: 'ceiling-light-panel'
      };

      const frameBars = [
        new THREE.Mesh(
          new THREE.BoxGeometry(outerWidth, 0.007, frameThickness),
          frameMaterial
        ),
        new THREE.Mesh(
          new THREE.BoxGeometry(outerWidth, 0.007, frameThickness),
          frameMaterial
        ),
        new THREE.Mesh(
          new THREE.BoxGeometry(frameThickness, 0.007, panel.depth + frameOverhang * 0.52),
          frameMaterial
        ),
        new THREE.Mesh(
          new THREE.BoxGeometry(frameThickness, 0.007, panel.depth + frameOverhang * 0.52),
          frameMaterial
        )
      ];

      frameBars[0].position.z = outerDepth / 2 - frameThickness / 2;
      frameBars[1].position.z = -outerDepth / 2 + frameThickness / 2;
      frameBars[2].position.x = -outerWidth / 2 + frameThickness / 2;
      frameBars[3].position.x = outerWidth / 2 - frameThickness / 2;

      frameBars.forEach((frameBar, index) => {
        frameBar.castShadow = true;
        frameBar.receiveShadow = true;
        frameBar.userData = {
          lightPanelId: panel.id,
          lightPanelFramePart: index + 1,
          gallerySurface: 'ceiling-light-panel-frame'
        };
        fixture.add(frameBar);
      });

      fixture.add(lightPanel);
      this.scene.add(fixture);
    });
  }

  private createTrackLightFixtures() {
    const housingMaterial = createTrackLightHousingMaterial();
    const lensMaterial = createTrackLightLensMaterial();
    const trackGeometry = new THREE.BoxGeometry(1, 0.035, 0.035);
    const stemGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8);
    const housingGeometry = new THREE.CylinderGeometry(0.066, 0.058, 0.19, 12);
    const lensGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.012, 12);
    const headCount = galleryWalls.length * 2;
    const tracks = new THREE.InstancedMesh(trackGeometry, housingMaterial, galleryWalls.length);
    const stems = new THREE.InstancedMesh(stemGeometry, housingMaterial, headCount);
    const housings = new THREE.InstancedMesh(housingGeometry, housingMaterial, headCount);
    const lenses = new THREE.InstancedMesh(lensGeometry, lensMaterial, headCount);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const identityScale = new THREE.Vector3(1, 1, 1);
    const ceilingY = galleryRoom.height - 0.075;
    const cylinderAxis = new THREE.Vector3(0, 1, 0);
    let headIndex = 0;

    galleryWalls.forEach((wall, wallIndex) => {
      const normal = new THREE.Vector3(
        Math.sin(wall.rotationY),
        0,
        Math.cos(wall.rotationY)
      );
      const tangent = new THREE.Vector3(
        Math.cos(wall.rotationY),
        0,
        -Math.sin(wall.rotationY)
      );
      const trackCenter = new THREE.Vector3(...wall.position)
        .addScaledVector(normal, 0.88)
        .setY(ceilingY);
      const trackLength = Math.min(1.35, Math.max(0.82, wall.width * 0.3));

      quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), wall.rotationY);
      matrix.compose(trackCenter, quaternion, new THREE.Vector3(trackLength, 1, 1));
      tracks.setMatrixAt(wallIndex, matrix);

      [-0.24, 0.24].forEach((offset) => {
        const stemPosition = trackCenter.clone()
          .addScaledVector(tangent, trackLength * offset)
          .add(new THREE.Vector3(0, -0.055, 0));
        matrix.compose(stemPosition, new THREE.Quaternion(), identityScale);
        stems.setMatrixAt(headIndex, matrix);

        const target = new THREE.Vector3(
          wall.position[0],
          Math.min(2.05, wall.position[1]),
          wall.position[2]
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

  private createWalls() {
    const wallMaterial = createPrototypeMuseumWallMaterial();
    const woodMaterial = createPrototypeDarkWoodMaterial();

    galleryWalls.forEach((wall) => {
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(wall.width, wall.height, wall.thickness),
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
    trim.castShadow = true;
    trim.receiveShadow = true;
    trim.userData = {
      wallTrimId: wall.id,
      gallerySurface: 'wall-trim'
    };
    this.offsetArtworkFromWall(trim, wall.rotationY, wall.thickness / 2 + 0.028);

    return trim;
  }

  private createArtwork() {
    const frameMaterial = createPrototypeDarkWoodMaterial();
    const frameRailMaterial = createPrototypeDarkWoodRailMaterial(0.25, 0.15);
    const frameRailHighlightMaterial = createPrototypeDarkWoodRailMaterial(0.19, 0.1);
    const frameRailCatchlightMaterial = createPrototypeDarkWoodRailMaterial(0.17, 0.075);
    const frameRailShadowEdgeMaterial = createPrototypeDarkWoodRailMaterial(0.42, 0.28);
    const matMaterial = createMatMaterial();

    galleryArtworks.forEach((artwork) => {
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

      const frame = this.createArtworkFrame(artwork, dimensions, frameMaterial);
      const frameRails = this.createArtworkFrameRails(
        artwork,
        dimensions,
        frameRailMaterial,
        frameRailHighlightMaterial,
        frameRailCatchlightMaterial,
        frameRailShadowEdgeMaterial,
        frame
      );
      const mat = this.createArtworkMat(artwork, dimensions, matMaterial, frame);
      const image = this.createArtworkImage(artwork, dimensions, initialTexture, initialTextureUrl, frame);
      const plaque = this.createArtworkPlaque(artwork, dimensions, frame);

      this.scene.add(frame);
      this.scene.add(frameRails);
      this.scene.add(mat);
      this.scene.add(image);

      if (plaque) {
        this.scene.add(plaque);
      }

      this.artworkMeshes.push(image);
      this.artworkMeshSets.push({
        artwork,
        frame,
        frameRails,
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
    shadowEdgeMaterial: THREE.Material,
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
      shadowEdgeMaterial,
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
    shadowEdgeMaterial: THREE.Material,
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

    railDefinitions.forEach((railDefinition) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(railDefinition.width, railDefinition.height, railDepth),
        railMaterial
      );

      rail.position.set(railDefinition.x, railDefinition.y, railZ);
      rail.castShadow = true;
      rail.receiveShadow = true;
      rail.userData = {
        artworkFrameRailId: artworkId,
        artworkFrameRailPart: railDefinition.id,
        artworkFrameRailLayer: 'base',
        gallerySurface: 'artwork-frame-rail'
      };

      frameRails.add(rail);
    });

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

    highlightDefinitions.forEach((highlightDefinition) => {
      const highlight = new THREE.Mesh(
        new THREE.BoxGeometry(highlightDefinition.width, highlightDefinition.height, highlightDepth),
        highlightMaterial
      );

      highlight.position.set(highlightDefinition.x, highlightDefinition.y, highlightZ);
      highlight.castShadow = true;
      highlight.receiveShadow = true;
      highlight.userData = {
        artworkFrameRailId: artworkId,
        artworkFrameRailPart: highlightDefinition.id,
        artworkFrameRailLayer: 'inner-sheen',
        gallerySurface: 'artwork-frame-rail-highlight'
      };

      frameRails.add(highlight);
    });

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
        material: catchlightMaterial,
        layer: 'lacquer-catchlight',
        surface: 'artwork-frame-rail-catchlight'
      },
      {
        id: 'left-lacquer-catchlight',
        width: catchlightWidth,
        height: Math.max(0.1, outerHeight - railWidth * 2.2),
        x: -outerWidth / 2 + catchlightWidth * 1.7,
        y: 0,
        material: catchlightMaterial,
        layer: 'lacquer-catchlight',
        surface: 'artwork-frame-rail-catchlight'
      },
      {
        id: 'right-lacquer-catchlight',
        width: catchlightWidth,
        height: Math.max(0.1, outerHeight - railWidth * 2.2),
        x: outerWidth / 2 - catchlightWidth * 1.7,
        y: 0,
        material: catchlightMaterial,
        layer: 'lacquer-catchlight',
        surface: 'artwork-frame-rail-catchlight'
      }
    ];

    catchlightDefinitions.forEach((definition) => {
      const catchlight = new THREE.Mesh(
        new THREE.BoxGeometry(definition.width, definition.height, catchlightDepth),
        definition.material
      );

      catchlight.position.set(definition.x, definition.y, catchlightZ);
      catchlight.castShadow = true;
      catchlight.receiveShadow = true;
      catchlight.userData = {
        artworkFrameRailId: artworkId,
        artworkFrameRailPart: definition.id,
        artworkFrameRailLayer: definition.layer,
        gallerySurface: definition.surface
      };

      frameRails.add(catchlight);
    });
  }

  private updateArtworkFrameRails(
    frameRails: THREE.Group,
    dimensions: FrameDimensions,
    railMaterial: THREE.Material,
    highlightMaterial: THREE.Material,
    catchlightMaterial: THREE.Material,
    shadowEdgeMaterial: THREE.Material,
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
      shadowEdgeMaterial,
      artworkId
    );
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
    const metaLine = formatGalleryArtworkPublicMeta(artwork);

    context.fillStyle = 'rgba(8, 9, 8, 1)';
    context.font = '700 54px Arial, Helvetica, sans-serif';
    context.textBaseline = 'top';
    context.fillText(this.truncatePlaqueText(context, title, width - 84), 38, 34);

    context.fillStyle = 'rgba(8, 9, 8, 0.9)';
    context.font = '700 30px Arial, Helvetica, sans-serif';
    context.fillText(this.truncatePlaqueText(context, metaLine.toUpperCase(), width - 84), 38, 126);

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
      this.updateFrameGeometry(
        meshSet.frame,
        dimensions.width + this.artworkFrameBorder,
        dimensions.height + this.artworkFrameBorder
      );
      const frameRailMaterial = (meshSet.frameRails.children.find((child) => child.userData.artworkFrameRailLayer === 'base') as THREE.Mesh | undefined)
        ?.material as THREE.Material | undefined;
      const frameRailHighlightMaterial = (meshSet.frameRails.children.find((child) => child.userData.artworkFrameRailLayer === 'inner-sheen') as THREE.Mesh | undefined)
        ?.material as THREE.Material | undefined;
      const frameRailCatchlightMaterial = (meshSet.frameRails.children.find((child) => child.userData.artworkFrameRailLayer === 'lacquer-catchlight') as THREE.Mesh | undefined)
        ?.material as THREE.Material | undefined;
      const frameRailShadowEdgeMaterial = (meshSet.frameRails.children.find((child) => child.userData.artworkFrameRailLayer === 'depth-shadow-edge') as THREE.Mesh | undefined)
        ?.material as THREE.Material | undefined;

      this.updateArtworkFrameRails(
        meshSet.frameRails,
        dimensions,
        frameRailMaterial ?? createPrototypeDarkWoodRailMaterial(0.25, 0.15),
        frameRailHighlightMaterial ?? createPrototypeDarkWoodRailMaterial(0.19, 0.1),
        frameRailCatchlightMaterial ?? createPrototypeDarkWoodRailMaterial(0.17, 0.075),
        frameRailShadowEdgeMaterial ?? createPrototypeDarkWoodRailMaterial(0.42, 0.28),
        meshSet.artwork.id
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
    const workStartedAt = performance.now();
    const delta = this.movementController.getFrameDelta(timestamp);

    this.movementController.update(this.camera, this.lookController.getYaw(), delta);
    this.updateArtworkFocus();
    this.renderer.render(this.scene, this.camera);

    if (typeof timestamp === 'number') {
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

    return {
      renderPixelRatio: this.renderer.getPixelRatio(),
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
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
    this.artworkMeshSets = [];
    this.focusedArtworkId = null;

    this.renderer.dispose();

    this.container.innerHTML = '';
  }
}
