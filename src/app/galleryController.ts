// Controls the fullscreen virtual gallery.
//
// This file handles:
// - opening the virtual gallery
// - closing the virtual gallery
// - showing the loading screen
// - preloading Three.js textures
// - updating the artwork info panel
// - blocking the virtual gallery on mobile/touch devices
// - showing a mobile fallback message
// - dismissing the controls card once the viewer has used the core inputs

import { galleryArtworks, type GalleryArtwork } from '../gallery/artwork/galleryLayout';

type GallerySceneInstance = {
  destroy: () => void;
};

let activeGallery: GallerySceneInstance | null = null;
let galleryPreloadPromise: Promise<void> | null = null;
let isGalleryOpening = false;
let hasMovedMouseInGallery = false;
let galleryInputListenersBound = false;
let controlCardDismissTimeout: number | null = null;

const usedMovementDirections = new Set<string>();

const mobileGalleryQuery = window.matchMedia(
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

function shouldUseMobileFallback() {
  return mobileGalleryQuery.matches;
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

function showMobileFallbackMessage() {
  const existingNotice = document.querySelector('.mobile-gallery-fallback');

  if (existingNotice) {
    existingNotice.remove();
  }

  const notice = document.createElement('div');

  notice.className = 'mobile-gallery-fallback';
  notice.innerHTML = `
    <div class="mobile-gallery-fallback-card" role="dialog" aria-modal="true" aria-labelledby="mobileGalleryFallbackTitle">
      <p class="eyebrow">Virtual Gallery</p>
      <h2 id="mobileGalleryFallbackTitle">This part is desktop-only for now.</h2>
      <p>
        The virtual gallery uses mouse-look and keyboard movement, so it is currently built for a laptop or desktop. The traditional portfolio still works on mobile.
      </p>
      <button class="button primary" type="button" data-mobile-gallery-close>Back to portfolio</button>
    </div>
  `;

  document.body.appendChild(notice);
  document.body.classList.add('gallery-fallback-is-open');

  const closeButton = notice.querySelector<HTMLButtonElement>('[data-mobile-gallery-close]');

  function closeNotice() {
    document.removeEventListener('keydown', handleKeyDown);
    document.body.classList.remove('gallery-fallback-is-open');
    notice.remove();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      closeNotice();
    }
  }

  notice.addEventListener('click', (event) => {
    if (event.target === notice) {
      closeNotice();
    }
  });

  closeButton?.addEventListener('click', closeNotice);
  document.addEventListener('keydown', handleKeyDown);

  closeButton?.focus();
}

export function setupGalleryController() {
  const galleryOverlay = document.querySelector<HTMLDivElement>('#galleryOverlay');
  const galleryCanvas = document.querySelector<HTMLDivElement>('#galleryCanvas');
  const galleryLoading = document.querySelector<HTMLDivElement>('#galleryLoading');
  const galleryControlCard = document.querySelector<HTMLElement>('#galleryControlCard');

  const closeGalleryButton = document.querySelector<HTMLButtonElement>('#closeGalleryButton');

  const galleryInfoPanel = document.querySelector<HTMLElement>('#galleryInfoPanel');
  const galleryInfoMeta = document.querySelector<HTMLElement>('#galleryInfoMeta');
  const galleryInfoTitle = document.querySelector<HTMLElement>('#galleryInfoTitle');
  const galleryInfoNote = document.querySelector<HTMLElement>('#galleryInfoNote');

  function shouldDismissControlCard() {
    return hasMovedMouseInGallery && usedMovementDirections.size >= 2;
  }

  function clearControlCardDismissTimeout() {
    if (controlCardDismissTimeout !== null) {
      window.clearTimeout(controlCardDismissTimeout);
      controlCardDismissTimeout = null;
    }
  }

  function updateControlCardVisibility() {
    if (!galleryControlCard) {
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
    if (!activeGallery) {
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

  function showArtworkInfo(artwork: GalleryArtwork) {
    if (!galleryInfoPanel || !galleryInfoMeta || !galleryInfoTitle || !galleryInfoNote) {
      return;
    }

    const displayIndex = String(artwork.displayOrder).padStart(2, '0');
    const yearLabel = artwork.year || 'Archive';

    galleryInfoPanel.classList.add('is-active');
    galleryInfoMeta.textContent = `${displayIndex} / ${artwork.wallSection} / ${artwork.category} / ${yearLabel}`;
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
    if (shouldUseMobileFallback()) {
      showMobileFallbackMessage();
      return;
    }

    if (!galleryOverlay || !galleryCanvas) {
      return;
    }

    if (isGalleryOpening || activeGallery) {
      return;
    }

    isGalleryOpening = true;

    galleryOverlay.classList.add('is-active');
    galleryOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gallery-is-open');

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
        onArtworkClear: clearArtworkInfo
      });

      bindGalleryInputListeners();

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
    resetControlCardState();
    clearArtworkInfo();

    galleryOverlay.classList.remove('is-active');
    galleryOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('gallery-is-open');
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
