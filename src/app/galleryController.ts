// Controls the fullscreen virtual gallery.
//
// This file handles:
// - opening the virtual gallery
// - closing the virtual gallery
// - showing the loading screen
// - preloading Three.js textures
// - updating the artwork info panel
// - selecting desktop or touch input mode
// - binding the mobile/touch movement control surface
// - dismissing the controls card once the viewer has used the core desktop inputs

import {
  galleryArtworks,
  formatGalleryArtworkPublicMeta,
  type GalleryArtwork
} from '../gallery/artwork/galleryLayout';
import {
  getGalleryAutomaticQualityCeiling,
  getGalleryPerformanceDiagnostics,
  getGalleryQualityModeLabel,
  getGalleryQualitySettings,
  getGalleryQualityState,
  getGalleryQualityTierLabel,
  setGalleryQualityMode,
  subscribeToGalleryQuality,
  type GalleryQualityMode,
  type GalleryQualityTier
} from '../gallery/performance/galleryQuality';
import type { GalleryRuntimeDiagnostics } from '../gallery/GalleryScene';

type GalleryInputMode = 'desktop' | 'touch';

type GallerySceneInstance = {
  destroy: () => void;
  setTouchMovement: (localX: number, localZ: number) => void;
  clearTouchMovement: () => void;
  getRuntimeDiagnostics: () => GalleryRuntimeDiagnostics;
};

let activeGallery: GallerySceneInstance | null = null;
let activeGalleryInputMode: GalleryInputMode = 'desktop';
let galleryPreloadPromise: Promise<void> = Promise.resolve();
let galleryPreloadTier: GalleryQualityTier | null = null;
let galleryAssetPrewarmTier: GalleryQualityTier | null = null;
let gallerySceneModulePromise: Promise<typeof import('../gallery/GalleryScene')> | null = null;
let galleryTextureLoaderModulePromise: Promise<typeof import('../gallery/artwork/galleryTextureLoader')> | null = null;
let galleryMaterialsModulePromise: Promise<typeof import('../gallery/environment/galleryMaterials')> | null = null;
let galleryPrewarmStarted = false;
let isGalleryOpening = false;
let hasMovedMouseInGallery = false;
let galleryInputListenersBound = false;
let touchMovePointerId: number | null = null;
let touchControlsBound = false;
let controlCardDismissTimeout: number | null = null;
let touchUiDismissTimeout: number | null = null;
let galleryTextureDisposeTimeout: number | null = null;

const usedMovementDirections = new Set<string>();

const touchGalleryQuery = window.matchMedia(
  '(hover: none), (pointer: coarse), (max-width: 860px)'
);

const movementDirectionByCode = new Map<string, string>([
  ['KeyW', 'forward'],
  ['ArrowUp', 'forward'],
  ['KeyS', 'backward'],
  ['ArrowDown', 'backward'],
  ['KeyA', 'left'],
  ['ArrowLeft', 'left'],
  ['KeyD', 'right'],
  ['ArrowRight', 'right']
]);

function getGalleryInputMode(): GalleryInputMode {
  return touchGalleryQuery.matches ? 'touch' : 'desktop';
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function waitForGalleryIdle() {
  return new Promise<void>((resolve) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => resolve(), { timeout: 1400 });
      return;
    }

    globalThis.setTimeout(() => resolve(), 160);
  });
}

function loadGalleryTextureLoaderModule() {
  if (!galleryTextureLoaderModulePromise) {
    galleryTextureLoaderModulePromise = import('../gallery/artwork/galleryTextureLoader');
  }

  return galleryTextureLoaderModulePromise;
}

function loadGallerySceneModule() {
  if (!gallerySceneModulePromise) {
    gallerySceneModulePromise = import('../gallery/GalleryScene');
  }

  return gallerySceneModulePromise;
}

function loadGalleryMaterialsModule() {
  if (!galleryMaterialsModulePromise) {
    galleryMaterialsModulePromise = import('../gallery/environment/galleryMaterials');
  }

  return galleryMaterialsModulePromise;
}

const galleryQualityRank: Record<GalleryQualityTier, number> = {
  low: 0,
  balanced: 1,
  high: 2
};

function preloadGalleryImages(tier: GalleryQualityTier) {
  if (
    galleryPreloadTier &&
    galleryQualityRank[galleryPreloadTier] >= galleryQualityRank[tier]
  ) {
    return galleryPreloadPromise;
  }

  galleryPreloadTier = tier;
  galleryPreloadPromise = galleryPreloadPromise.then(() =>
    loadGalleryTextureLoaderModule().then(
      ({ preloadGalleryTextures }) => preloadGalleryTextures(galleryArtworks, tier)
    )
  );

  return galleryPreloadPromise;
}

function getGalleryAssetPrewarmTarget() {
  const qualityState = getGalleryQualityState();

  if (qualityState.mode === 'auto') {
    return getGalleryAutomaticQualityCeiling();
  }

  return qualityState.tier;
}

function prewarmGalleryAssets(
  targetTier = getGalleryAssetPrewarmTarget(),
  waitForPageLoad = true
) {
  if (waitForPageLoad && document.readyState !== 'complete') {
    window.addEventListener('load', () => {
      prewarmGalleryAssets(targetTier, false);
    }, { once: true });
    return;
  }

  if (
    galleryAssetPrewarmTier &&
    galleryQualityRank[galleryAssetPrewarmTier] >= galleryQualityRank[targetTier]
  ) {
    return;
  }

  galleryAssetPrewarmTier = targetTier;
  void loadGalleryTextureLoaderModule().then(({ prewarmGalleryAssetCache }) => {
    void prewarmGalleryAssetCache(galleryArtworks, targetTier).then((ready) => {
      if (!ready && galleryAssetPrewarmTier === targetTier) {
        galleryAssetPrewarmTier = null;
      }
    });
  });
}

function prewarmGalleryModules() {
  if (galleryPrewarmStarted) {
    return;
  }

  galleryPrewarmStarted = true;

  window.setTimeout(() => {
    void waitForGalleryIdle().then(() => {
      void loadGalleryTextureLoaderModule();
      void loadGallerySceneModule();
      void loadGalleryMaterialsModule().then(({ prewarmGalleryEnvironmentMaterials }) => {
        window.setTimeout(() => prewarmGalleryEnvironmentMaterials(), 0);
      });
      prewarmGalleryAssets();
    });
  }, 420);
}

function prewarmGalleryFromIntent() {
  void loadGalleryTextureLoaderModule();
  void loadGallerySceneModule();
  void loadGalleryMaterialsModule().then(({ prewarmGalleryEnvironmentMaterials }) => {
    window.setTimeout(() => prewarmGalleryEnvironmentMaterials(), 0);
  });
  prewarmGalleryAssets(getGalleryAssetPrewarmTarget(), false);
}

export function setupGalleryController() {
  const galleryOverlay = document.querySelector<HTMLDivElement>('#galleryOverlay');
  const galleryCanvas = document.querySelector<HTMLDivElement>('#galleryCanvas');
  const galleryLoading = document.querySelector<HTMLDivElement>('#galleryLoading');
  const galleryLoadingPhase = document.querySelector<HTMLElement>('#galleryLoadingPhase');
  const galleryControlCard = document.querySelector<HTMLElement>('#galleryControlCard');
  const galleryTouchControls = document.querySelector<HTMLElement>('#galleryTouchControls');
  const galleryTouchMove = document.querySelector<HTMLElement>('#galleryTouchMove');
  const galleryTouchMoveKnob = document.querySelector<HTMLElement>('#galleryTouchMoveKnob');
  const galleryDiagnostics = document.querySelector<HTMLElement>('#galleryDiagnostics');

  const closeGalleryButton = document.querySelector<HTMLButtonElement>('#closeGalleryButton');
  const galleryDiagnosticsToggle = document.querySelector<HTMLButtonElement>('#galleryDiagnosticsToggle');
  const galleryQualitySelect = document.querySelector<HTMLSelectElement>('#galleryQualitySelect');

  const galleryInfoPanel = document.querySelector<HTMLElement>('#galleryInfoPanel');
  const galleryInfoMeta = document.querySelector<HTMLElement>('#galleryInfoMeta');
  const galleryInfoTitle = document.querySelector<HTMLElement>('#galleryInfoTitle');
  const galleryInfoNote = document.querySelector<HTMLElement>('#galleryInfoNote');
  const diagnosticsEnabledByDefault =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    new URLSearchParams(window.location.search).get('galleryDiagnostics') === '1';
  let diagnosticsEnabled = diagnosticsEnabledByDefault;
  let diagnosticsInterval: number | null = null;

  function updateDiagnosticsToggle() {
    if (!galleryDiagnosticsToggle) {
      return;
    }

    galleryDiagnosticsToggle.setAttribute('aria-pressed', String(diagnosticsEnabled));
    galleryDiagnosticsToggle.title = diagnosticsEnabled
      ? 'Hide gallery diagnostics'
      : 'Show gallery diagnostics';
  }

  function setDiagnosticValue(name: string, value: string) {
    const output = galleryDiagnostics?.querySelector<HTMLElement>(
      `[data-gallery-diagnostic="${name}"]`
    );

    if (output) {
      output.textContent = value;
    }
  }

  function formatDiagnosticNumber(value: number, digits = 1) {
    return Number.isFinite(value) ? value.toFixed(digits) : '--';
  }

  function updateGalleryDiagnostics() {
    if (!diagnosticsEnabled || !activeGallery) {
      return;
    }

    const quality = getGalleryQualityState();
    const performance = getGalleryPerformanceDiagnostics();
    const runtime = activeGallery.getRuntimeDiagnostics();
    const navigatorHints = navigator as Navigator & {
      deviceMemory?: number;
      connection?: {
        effectiveType?: string;
        saveData?: boolean;
      };
    };
    const connection = navigatorHints.connection;

    setDiagnosticValue(
      'quality',
      `${getGalleryQualityModeLabel(quality.mode)} / ${getGalleryQualityTierLabel(quality.tier)} · ceiling ${getGalleryQualityTierLabel(quality.autoCeiling)}`
    );
    setDiagnosticValue(
      'readiness',
      `cache ${getGalleryQualityTierLabel(quality.cacheTier)} · GPU ${getGalleryQualityTierLabel(quality.gpuTier)}`
    );
    setDiagnosticValue(
      'cadence',
      `${formatDiagnosticNumber(performance.estimatedFps, 0)} fps · ${formatDiagnosticNumber(performance.averageIntervalMs)} ms avg · ${formatDiagnosticNumber(performance.p90IntervalMs)} p90`
    );
    setDiagnosticValue(
      'work',
      `${formatDiagnosticNumber(performance.averageWorkMs)} ms avg · ${formatDiagnosticNumber(performance.p90WorkMs)} p90 · ${performance.sampleCount} samples`
    );
    setDiagnosticValue(
      'pixel-ratio',
      `${formatDiagnosticNumber(runtime.renderPixelRatio, 2)} render · ${formatDiagnosticNumber(window.devicePixelRatio || 1, 2)} device · ${window.innerWidth}×${window.innerHeight}`
    );
    setDiagnosticValue('renderer', runtime.renderer);
    setDiagnosticValue(
      'scene',
      `${runtime.drawCalls} calls · ${runtime.triangles.toLocaleString()} triangles · ${runtime.geometries} geometries · ${runtime.textures} textures`
    );
    setDiagnosticValue(
      'device',
      `${navigator.hardwareConcurrency || '?'} cores · ${navigatorHints.deviceMemory ?? '?'} GB hint · ${connection?.effectiveType ?? 'unknown'}${connection?.saveData ? ' · Save-Data' : ''}`
    );
  }

  function startGalleryDiagnostics() {
    if (!diagnosticsEnabled || !galleryDiagnostics) {
      return;
    }

    galleryDiagnostics.hidden = false;
    updateGalleryDiagnostics();

    if (diagnosticsInterval !== null) {
      window.clearInterval(diagnosticsInterval);
    }

    diagnosticsInterval = window.setInterval(updateGalleryDiagnostics, 500);
  }

  function stopGalleryDiagnostics() {
    if (diagnosticsInterval !== null) {
      window.clearInterval(diagnosticsInterval);
      diagnosticsInterval = null;
    }

    if (galleryDiagnostics) {
      galleryDiagnostics.hidden = true;
    }
  }

  function toggleGalleryDiagnostics() {
    diagnosticsEnabled = !diagnosticsEnabled;
    updateDiagnosticsToggle();

    if (diagnosticsEnabled && activeGallery) {
      startGalleryDiagnostics();
      return;
    }

    stopGalleryDiagnostics();
  }

  function shouldDismissControlCard() {
    return hasMovedMouseInGallery && usedMovementDirections.size >= 2;
  }

  function clearTouchUiDismissTimeout() {
    if (touchUiDismissTimeout !== null) {
      window.clearTimeout(touchUiDismissTimeout);
      touchUiDismissTimeout = null;
    }
  }

  function clearControlCardDismissTimeout() {
    if (controlCardDismissTimeout !== null) {
      window.clearTimeout(controlCardDismissTimeout);
      controlCardDismissTimeout = null;
    }
  }

  function updateControlCardVisibility() {
    if (!galleryControlCard || activeGalleryInputMode === 'touch') {
      return;
    }

    if (!shouldDismissControlCard()) {
      clearControlCardDismissTimeout();
      galleryControlCard.classList.remove('is-dismissing', 'is-dismissed');
      return;
    }

    if (
      galleryControlCard.classList.contains('is-dismissing') ||
      galleryControlCard.classList.contains('is-dismissed')
    ) {
      return;
    }

    galleryControlCard.classList.add('is-dismissing');

    clearControlCardDismissTimeout();
    controlCardDismissTimeout = window.setTimeout(() => {
      galleryControlCard.classList.add('is-dismissed');
      controlCardDismissTimeout = null;
    }, 940);
  }

  function resetControlCardState() {
    clearControlCardDismissTimeout();
    hasMovedMouseInGallery = false;
    usedMovementDirections.clear();
    galleryControlCard?.classList.remove('is-dismissing', 'is-dismissed');
  }

  function handleGalleryMouseMove() {
    if (!activeGallery || activeGalleryInputMode === 'touch') {
      return;
    }

    hasMovedMouseInGallery = true;
    updateControlCardVisibility();
  }

  function handleGalleryKeyDown(event: KeyboardEvent) {
    if (!activeGallery) {
      return;
    }

    const movementDirection = movementDirectionByCode.get(event.code);

    if (movementDirection) {
      usedMovementDirections.add(movementDirection);
      updateControlCardVisibility();
    }
  }

  function bindGalleryInputListeners() {
    if (galleryInputListenersBound) {
      return;
    }

    document.addEventListener('mousemove', handleGalleryMouseMove, { passive: true });
    document.addEventListener('keydown', handleGalleryKeyDown);
    galleryInputListenersBound = true;
  }

  function unbindGalleryInputListeners() {
    if (!galleryInputListenersBound) {
      return;
    }

    document.removeEventListener('mousemove', handleGalleryMouseMove);
    document.removeEventListener('keydown', handleGalleryKeyDown);
    galleryInputListenersBound = false;
  }

  function setTouchControlsVisible(isVisible: boolean) {
    galleryTouchControls?.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
    document.body.classList.toggle('gallery-touch-enabled', isVisible);

    if (isVisible) {
      galleryTouchControls?.classList.add('is-visible');
      return;
    }

    galleryTouchControls?.classList.remove(
      'is-visible',
      'has-touch-input',
      'has-used-touch-look',
      'has-used-touch-move',
      'is-minimal',
      'is-looking'
    );
  }

  function markTouchControlUsed(kind: 'look' | 'move') {
    if (!galleryTouchControls || activeGalleryInputMode !== 'touch') {
      return;
    }

    galleryTouchControls.classList.add('has-touch-input', `has-used-touch-${kind}`);

    clearTouchUiDismissTimeout();
    touchUiDismissTimeout = window.setTimeout(() => {
      galleryTouchControls.classList.add('is-minimal');
      touchUiDismissTimeout = null;
    }, 1500);
  }

  function getTouchMoveVector(event: PointerEvent) {
    if (!galleryTouchMove) {
      return { localX: 0, localZ: 0, knobX: 0, knobY: 0 };
    }

    const rect = galleryTouchMove.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.33);
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const distance = Math.hypot(rawX, rawY);
    const scale = distance > radius ? radius / distance : 1;
    const knobX = rawX * scale;
    const knobY = rawY * scale;

    return {
      localX: knobX / radius,
      localZ: knobY / radius,
      knobX,
      knobY
    };
  }

  function updateTouchMove(event: PointerEvent) {
    if (!activeGallery || activeGalleryInputMode !== 'touch') {
      return;
    }

    const vector = getTouchMoveVector(event);

    activeGallery.setTouchMovement(vector.localX, vector.localZ);
    galleryTouchMoveKnob?.style.setProperty('--gallery-touch-knob-x', `${vector.knobX}px`);
    galleryTouchMoveKnob?.style.setProperty('--gallery-touch-knob-y', `${vector.knobY}px`);
  }

  function clearTouchMove() {
    activeGallery?.clearTouchMovement();
    galleryTouchMoveKnob?.style.setProperty('--gallery-touch-knob-x', '0px');
    galleryTouchMoveKnob?.style.setProperty('--gallery-touch-knob-y', '0px');
  }

  function releaseTouchMovePointerCapture() {
    if (touchMovePointerId === null || !galleryTouchMove?.hasPointerCapture(touchMovePointerId)) {
      return;
    }

    galleryTouchMove.releasePointerCapture(touchMovePointerId);
  }

  function clearActiveTouchInteraction() {
    releaseTouchMovePointerCapture();
    touchMovePointerId = null;
    galleryTouchMove?.classList.remove('is-active');
    galleryTouchControls?.classList.remove('is-looking');
    clearTouchMove();
  }

  function handleTouchMoveStart(event: PointerEvent) {
    if (activeGalleryInputMode !== 'touch' || event.pointerType === 'mouse' || touchMovePointerId !== null) {
      return;
    }

    touchMovePointerId = event.pointerId;
    galleryTouchMove?.setPointerCapture(event.pointerId);
    galleryTouchMove?.classList.add('is-active');
    markTouchControlUsed('move');
    updateTouchMove(event);
    event.preventDefault();
  }

  function handleTouchMoveChange(event: PointerEvent) {
    if (event.pointerId !== touchMovePointerId) {
      return;
    }

    updateTouchMove(event);
    event.preventDefault();
  }

  function handleTouchMoveEnd(event: PointerEvent) {
    if (event.pointerId !== touchMovePointerId) {
      return;
    }

    clearActiveTouchInteraction();
    event.preventDefault();
  }

  function handleTouchLookSurfaceStart(event: PointerEvent) {
    if (activeGalleryInputMode !== 'touch' || event.pointerType === 'mouse') {
      return;
    }

    galleryTouchControls?.classList.add('is-looking');
    markTouchControlUsed('look');
  }

  function handleTouchLookSurfaceEnd(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      return;
    }

    galleryTouchControls?.classList.remove('is-looking');
  }

  function handleTouchViewportInterruption() {
    if (activeGalleryInputMode !== 'touch') {
      return;
    }

    clearActiveTouchInteraction();
  }

  function handleTouchVisibilityChange() {
    if (!document.hidden) {
      return;
    }

    handleTouchViewportInterruption();
  }

  function bindTouchControls() {
    if (touchControlsBound || !galleryTouchMove) {
      return;
    }

    galleryCanvas?.addEventListener('pointerdown', handleTouchLookSurfaceStart);
    galleryCanvas?.addEventListener('pointerup', handleTouchLookSurfaceEnd);
    galleryCanvas?.addEventListener('pointercancel', handleTouchLookSurfaceEnd);

    galleryTouchMove.addEventListener('pointerdown', handleTouchMoveStart);
    galleryTouchMove.addEventListener('pointermove', handleTouchMoveChange);
    galleryTouchMove.addEventListener('pointerup', handleTouchMoveEnd);
    galleryTouchMove.addEventListener('pointercancel', handleTouchMoveEnd);
    galleryTouchMove.addEventListener('lostpointercapture', handleTouchMoveEnd);
    window.addEventListener('blur', handleTouchViewportInterruption);
    window.addEventListener('pagehide', handleTouchViewportInterruption);
    window.addEventListener('orientationchange', handleTouchViewportInterruption);
    document.addEventListener('visibilitychange', handleTouchVisibilityChange);
    touchControlsBound = true;
  }

  function unbindTouchControls() {
    if (!touchControlsBound || !galleryTouchMove) {
      return;
    }

    galleryCanvas?.removeEventListener('pointerdown', handleTouchLookSurfaceStart);
    galleryCanvas?.removeEventListener('pointerup', handleTouchLookSurfaceEnd);
    galleryCanvas?.removeEventListener('pointercancel', handleTouchLookSurfaceEnd);

    galleryTouchMove.removeEventListener('pointerdown', handleTouchMoveStart);
    galleryTouchMove.removeEventListener('pointermove', handleTouchMoveChange);
    galleryTouchMove.removeEventListener('pointerup', handleTouchMoveEnd);
    galleryTouchMove.removeEventListener('pointercancel', handleTouchMoveEnd);
    galleryTouchMove.removeEventListener('lostpointercapture', handleTouchMoveEnd);
    window.removeEventListener('blur', handleTouchViewportInterruption);
    window.removeEventListener('pagehide', handleTouchViewportInterruption);
    window.removeEventListener('orientationchange', handleTouchViewportInterruption);
    document.removeEventListener('visibilitychange', handleTouchVisibilityChange);
    touchControlsBound = false;
  }

  function resetTouchControls() {
    clearTouchUiDismissTimeout();
    clearActiveTouchInteraction();
    setTouchControlsVisible(false);
  }

  function showArtworkInfo(artwork: GalleryArtwork) {
    if (!galleryInfoPanel || !galleryInfoMeta || !galleryInfoTitle || !galleryInfoNote) {
      return;
    }

    // Low quality keeps full artwork textures demand-driven. The same focused
    // load is harmless in higher tiers because the shared loader deduplicates
    // cached and in-flight requests.
    void loadGalleryTextureLoaderModule().then(({ loadGalleryArtworkTextureOnDemand }) => {
      void loadGalleryArtworkTextureOnDemand(artwork);
    });

    galleryInfoPanel.classList.add('is-active');
    galleryInfoMeta.textContent = formatGalleryArtworkPublicMeta(artwork);
    galleryInfoTitle.textContent = artwork.title;
    galleryInfoNote.textContent = artwork.note;
  }

  function clearArtworkInfo() {
    if (!galleryInfoPanel || !galleryInfoMeta || !galleryInfoTitle || !galleryInfoNote) {
      return;
    }

    galleryInfoPanel.classList.remove('is-active');
    galleryInfoMeta.textContent = '';
    galleryInfoTitle.textContent = '';
    galleryInfoNote.textContent = '';
  }


  function updateGalleryQualitySelect() {
    if (!galleryQualitySelect) {
      return;
    }

    const qualityState = getGalleryQualityState();
    const modeLabel = getGalleryQualityModeLabel(qualityState.mode);
    const tierLabel = getGalleryQualityTierLabel(qualityState.tier);

    galleryQualitySelect.value = qualityState.mode;
    galleryQualitySelect.dataset.qualityTier = qualityState.tier;
    galleryQualitySelect.dataset.qualityAutoCeiling = qualityState.autoCeiling;
    galleryQualitySelect.dataset.qualityCacheTier = qualityState.cacheTier;
    galleryQualitySelect.dataset.qualityGpuTier = qualityState.gpuTier;
    const autoOption = galleryQualitySelect.querySelector<HTMLOptionElement>('option[value="auto"]');
    if (autoOption) {
      autoOption.textContent = qualityState.mode === 'auto'
        ? `Quality · Auto / ${tierLabel}`
        : 'Quality · Auto';
    }
    galleryQualitySelect.setAttribute(
      'aria-label',
      `Gallery quality is ${modeLabel}${qualityState.mode === 'auto' ? `, currently ${tierLabel}` : ''}.`
    );
    galleryQualitySelect.title = 'Choose gallery quality';
  }

  function handleGalleryQualityChange() {
    if (!galleryQualitySelect) {
      return;
    }

    setGalleryQualityMode(galleryQualitySelect.value as GalleryQualityMode);
    const qualityState = getGalleryQualityState();
    const settings = getGalleryQualitySettings(qualityState.tier);

    prewarmGalleryAssets(
      qualityState.mode === 'auto'
        ? qualityState.autoCeiling
        : qualityState.tier
    );

    if (activeGallery && settings.artworkTexturePolicy !== 'focus') {
      void preloadGalleryImages(qualityState.tier);
    }
  }


  function setGalleryLoadingPhase(message: string) {
    if (!galleryLoadingPhase) {
      return;
    }

    galleryLoadingPhase.textContent = message;
  }

  async function openGallery() {
    if (galleryTextureDisposeTimeout !== null) {
      window.clearTimeout(galleryTextureDisposeTimeout);
      galleryTextureDisposeTimeout = null;
    }

    if (!galleryOverlay || !galleryCanvas) {
      return;
    }

    if (isGalleryOpening || activeGallery) {
      return;
    }

    isGalleryOpening = true;
    activeGalleryInputMode = getGalleryInputMode();
    const qualityState = getGalleryQualityState();

    galleryOverlay.classList.add('is-active');
    galleryOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gallery-is-open');
    setTouchControlsVisible(activeGalleryInputMode === 'touch');

    resetControlCardState();
    clearArtworkInfo();
    galleryLoading?.classList.add('is-active');
    setGalleryLoadingPhase(`Preparing ${getGalleryQualityTierLabel(qualityState.tier).toLowerCase()} quality textures`);

    await waitForNextFrame();

    try {
      prewarmGalleryAssets(
        qualityState.mode === 'auto' ? qualityState.autoCeiling : qualityState.tier,
        false
      );
      const imagePreloadPromise = preloadGalleryImages(qualityState.tier);
      const sceneModulePromise = loadGallerySceneModule();
      const materialsPrewarmPromise = loadGalleryMaterialsModule().then(({ prewarmGalleryEnvironmentMaterials }) => {
        setGalleryLoadingPhase('Preparing room surfaces');
        prewarmGalleryEnvironmentMaterials();
      });

      await imagePreloadPromise;
      setGalleryLoadingPhase('Loading the gallery renderer');
      await waitForNextFrame();

      await materialsPrewarmPromise;
      setGalleryLoadingPhase('Building the room');
      await waitForNextFrame();

      const { GalleryScene } = await sceneModulePromise;
      setGalleryLoadingPhase('Activating lighting and shadows');
      await waitForNextFrame();

      activeGallery = new GalleryScene({
        container: galleryCanvas,
        onExit: closeGallery,
        onArtworkFocus: showArtworkInfo,
        onArtworkClear: clearArtworkInfo,
        inputMode: activeGalleryInputMode
      });
      startGalleryDiagnostics();

      bindGalleryInputListeners();

      if (activeGalleryInputMode === 'touch') {
        bindTouchControls();
      }

      setGalleryLoadingPhase('Entering the room');
      await waitForNextFrame();

      galleryLoading?.classList.remove('is-active');
      setGalleryLoadingPhase('Preparing image textures');
    } catch (error) {
      console.error('Gallery failed to open:', error);
      closeGallery();
    } finally {
      isGalleryOpening = false;
    }
  }

  function closeGallery() {
    if (!galleryOverlay) {
      return;
    }

    isGalleryOpening = false;
    stopGalleryDiagnostics();
    galleryLoading?.classList.remove('is-active');
    setGalleryLoadingPhase('Preparing image textures');

    if (activeGallery) {
      activeGallery.destroy();
      activeGallery = null;
    }

    if (galleryTextureDisposeTimeout !== null) {
      window.clearTimeout(galleryTextureDisposeTimeout);
    }

    galleryTextureDisposeTimeout = window.setTimeout(() => {
      galleryTextureDisposeTimeout = null;

      if (activeGallery || isGalleryOpening) {
        return;
      }

      void loadGalleryTextureLoaderModule().then(({ disposeGalleryTextureCache }) => {
        disposeGalleryTextureCache();
        galleryPreloadPromise = Promise.resolve();
        galleryPreloadTier = null;
      });
    }, 1500);

    unbindGalleryInputListeners();
    unbindTouchControls();
    resetTouchControls();
    resetControlCardState();
    clearArtworkInfo();

    galleryOverlay.classList.remove('is-active');
    galleryOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('gallery-is-open');
    activeGalleryInputMode = 'desktop';
  }

  prewarmGalleryModules();

  function getGalleryEntryTrigger(event: Event) {
    return event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-open-virtual-gallery]')
      : null;
  }

  document.addEventListener('pointerenter', (event) => {
    const trigger = getGalleryEntryTrigger(event);

    if (trigger) {
      prewarmGalleryFromIntent();
    }
  }, true);

  document.addEventListener('focusin', (event) => {
    const trigger = getGalleryEntryTrigger(event);

    if (trigger) {
      prewarmGalleryFromIntent();
    }
  });

  document.addEventListener('touchstart', (event) => {
    const trigger = getGalleryEntryTrigger(event);

    if (trigger) {
      prewarmGalleryFromIntent();
    }
  }, { passive: true });

  document.addEventListener('click', (event) => {
    const trigger = getGalleryEntryTrigger(event);

    if (!trigger) {
      return;
    }

    openGallery();
  });

  subscribeToGalleryQuality(({ mode, tier, autoCeiling }) => {
    updateGalleryQualitySelect();

    if (mode === 'auto' && activeGallery) {
      prewarmGalleryAssets(autoCeiling, false);
    }

    if (activeGallery && getGalleryQualitySettings(tier).artworkTexturePolicy !== 'focus') {
      void preloadGalleryImages(tier);
    }
  });

  galleryQualitySelect?.addEventListener('change', handleGalleryQualityChange);
  galleryDiagnosticsToggle?.addEventListener('click', toggleGalleryDiagnostics);
  closeGalleryButton?.addEventListener('click', closeGallery);
  updateDiagnosticsToggle();
}
