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

type GalleryInputMode = 'desktop' | 'touch';

type GallerySceneInstance = {
  destroy: () => void;
  setTouchMovement: (localX: number, localZ: number) => void;
  clearTouchMovement: () => void;
};

let activeGallery: GallerySceneInstance | null = null;
let activeGalleryInputMode: GalleryInputMode = 'desktop';
let galleryPreloadPromise: Promise<void> | null = null;
let isGalleryOpening = false;
let hasMovedMouseInGallery = false;
let galleryInputListenersBound = false;
let touchMovePointerId: number | null = null;
let touchControlsBound = false;
let controlCardDismissTimeout: number | null = null;
let touchUiDismissTimeout: number | null = null;

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

function preloadGalleryImages() {
  if (!galleryPreloadPromise) {
    galleryPreloadPromise = import('../gallery/artwork/galleryTextureLoader').then(
      ({ preloadGalleryTextures }) => preloadGalleryTextures(galleryArtworks)
    );
  }

  return galleryPreloadPromise;
}

export function setupGalleryController() {
  const galleryOverlay = document.querySelector<HTMLDivElement>('#galleryOverlay');
  const galleryCanvas = document.querySelector<HTMLDivElement>('#galleryCanvas');
  const galleryLoading = document.querySelector<HTMLDivElement>('#galleryLoading');
  const galleryControlCard = document.querySelector<HTMLElement>('#galleryControlCard');
  const galleryTouchControls = document.querySelector<HTMLElement>('#galleryTouchControls');
  const galleryTouchMove = document.querySelector<HTMLElement>('#galleryTouchMove');
  const galleryTouchMoveKnob = document.querySelector<HTMLElement>('#galleryTouchMoveKnob');

  const closeGalleryButton = document.querySelector<HTMLButtonElement>('#closeGalleryButton');

  const galleryInfoPanel = document.querySelector<HTMLElement>('#galleryInfoPanel');
  const galleryInfoMeta = document.querySelector<HTMLElement>('#galleryInfoMeta');
  const galleryInfoTitle = document.querySelector<HTMLElement>('#galleryInfoTitle');
  const galleryInfoNote = document.querySelector<HTMLElement>('#galleryInfoNote');

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
    const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.36);
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

    if (galleryTouchMove?.hasPointerCapture(event.pointerId)) {
      galleryTouchMove.releasePointerCapture(event.pointerId);
    }

    touchMovePointerId = null;
    galleryTouchMove?.classList.remove('is-active');
    clearTouchMove();
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
    touchControlsBound = false;
  }

  function resetTouchControls() {
    clearTouchUiDismissTimeout();
    touchMovePointerId = null;
    galleryTouchMove?.classList.remove('is-active');
    clearTouchMove();
    setTouchControlsVisible(false);
  }

  function showArtworkInfo(artwork: GalleryArtwork) {
    if (!galleryInfoPanel || !galleryInfoMeta || !galleryInfoTitle || !galleryInfoNote) {
      return;
    }

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

  async function openGallery() {
    if (!galleryOverlay || !galleryCanvas) {
      return;
    }

    if (isGalleryOpening || activeGallery) {
      return;
    }

    isGalleryOpening = true;
    activeGalleryInputMode = getGalleryInputMode();

    galleryOverlay.classList.add('is-active');
    galleryOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gallery-is-open');
    setTouchControlsVisible(activeGalleryInputMode === 'touch');

    resetControlCardState();
    clearArtworkInfo();
    galleryLoading?.classList.add('is-active');

    await waitForNextFrame();

    try {
      await preloadGalleryImages();
      await waitForNextFrame();

      const { GalleryScene } = await import('../gallery/GalleryScene');

      activeGallery = new GalleryScene({
        container: galleryCanvas,
        onExit: closeGallery,
        onArtworkFocus: showArtworkInfo,
        onArtworkClear: clearArtworkInfo,
        inputMode: activeGalleryInputMode
      });

      bindGalleryInputListeners();

      if (activeGalleryInputMode === 'touch') {
        bindTouchControls();
      }

      await waitForNextFrame();

      galleryLoading?.classList.remove('is-active');
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
    galleryLoading?.classList.remove('is-active');

    if (activeGallery) {
      activeGallery.destroy();
      activeGallery = null;
    }

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

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const trigger = target?.closest<HTMLElement>('[data-open-virtual-gallery]');

    if (!trigger) {
      return;
    }

    openGallery();
  });

  closeGalleryButton?.addEventListener('click', closeGallery);
}
