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

import { galleryArtworks, type GalleryArtwork } from '../gallery/artwork/galleryLayout';

type GallerySceneInstance = {
  destroy: () => void;
};

let activeGallery: GallerySceneInstance | null = null;
let galleryPreloadPromise: Promise<void> | null = null;
let isGalleryOpening = false;

const mobileGalleryQuery = window.matchMedia(
  '(hover: none), (pointer: coarse), (max-width: 860px)'
);

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

  const closeGalleryButton = document.querySelector<HTMLButtonElement>('#closeGalleryButton');

  const galleryInfoPanel = document.querySelector<HTMLElement>('#galleryInfoPanel');
  const galleryInfoMeta = document.querySelector<HTMLElement>('#galleryInfoMeta');
  const galleryInfoTitle = document.querySelector<HTMLElement>('#galleryInfoTitle');
  const galleryInfoNote = document.querySelector<HTMLElement>('#galleryInfoNote');

  function showArtworkInfo(artwork: GalleryArtwork) {
    if (!galleryInfoPanel || !galleryInfoMeta || !galleryInfoTitle || !galleryInfoNote) {
      return;
    }

    galleryInfoPanel.classList.add('is-active');
    galleryInfoMeta.textContent = `${artwork.category} / ${artwork.year} / ${artwork.location}`;
    galleryInfoTitle.textContent = artwork.title;
    galleryInfoNote.textContent = artwork.note;
  }

  function clearArtworkInfo() {
    if (!galleryInfoPanel || !galleryInfoMeta || !galleryInfoTitle || !galleryInfoNote) {
      return;
    }

    galleryInfoPanel.classList.remove('is-active');
    galleryInfoMeta.textContent = 'Selected work';
    galleryInfoTitle.textContent = 'Look at a photo';
    galleryInfoNote.textContent = 'Artwork details will appear here when you look directly at one of the images.';
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