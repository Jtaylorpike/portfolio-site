// Browser behavior for the public portfolio website.
//
// The page renderer creates static HTML for each route. This file adds the parts
// that require browser state: hero carousel transitions, portfolio category links,
// fullscreen image viewing, and keyboard navigation.

import { galleryImages, type GalleryImage } from '../data/images';
import { heroSlides } from '../data/heroSlides';
import { getCategoryLabel } from '../data/categories';
import {
  applyHeroFramingToLayer,
  applyHeroShellSizingToSlideshow,
  getHeroFitMode,
  getHeroFrameInlineStyle,
  getHeroImageInlineStyle,
  getHeroLayerClassName,
  getHeroMobileSource,
  isHeroEligibleImage,
  getResolvedHeroFrameStyle
} from './heroFraming';

type ResolvedHeroSlide = {
  imageId: string;
  targetCategory: string;
  image: GalleryImage;
};

type HeroTransitionState = {
  isTransitioning: boolean;
  cooldownUntil: number;
  activeTransitionLayer: HTMLElement | null;
  cleanupTimer: number | null;
};

let keyboardNavigationBound = false;
let heroWheelNavigationBound = false;
let aboutScrollMotionBound = false;
let aboutScrollMotionFrame = 0;
const heroWheelAccumulation = new WeakMap<HTMLElement, number>();


function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTwoDigitNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}

const HERO_INPUT_COOLDOWN_MS = 20;
const HERO_IMAGE_LOAD_TIMEOUT_MS = 360;
const HERO_DEFERRED_PRELOAD_DELAY_MS = 1800;
const HERO_MOBILE_QUERY = '(max-width: 700px)';
const PORTFOLIO_CATEGORY_RAIL_SCROLL_KEY = 'taylor-pike-portfolio-category-rail-scroll-left';
const LIGHTBOX_FOCUSABLE_SELECTOR = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
const LIGHTBOX_SWIPE_THRESHOLD_PX = 44;
const LIGHTBOX_SWIPE_MAX_DURATION_MS = 700;
const LIGHTBOX_CONTROLS_IDLE_MS = 2000;
const PORTFOLIO_LOAD_WAVE_DELAY_MS = 12;
const PORTFOLIO_REVEAL_CLASS_MS = 220;

const heroTransitionStates = new WeakMap<HTMLElement, HeroTransitionState>();

// Looks up a portfolio image by ID for hero slides and lightbox actions.
function getImageById(imageId: string): GalleryImage | undefined {
  return galleryImages.find((image) => image.id === imageId);
}

// Converts hero slide JSON records into render-ready slide objects.
function getResolvedHeroSlides(): ResolvedHeroSlide[] {
  return heroSlides
    .map((slide) => {
      const image = getImageById(slide.imageId);

      if (!image) {
        console.warn(`Hero slide image not found: ${slide.imageId}`);
        return null;
      }

      if (!isHeroEligibleImage(image)) {
        console.warn(`Hero slide image is not landscape and was skipped: ${slide.imageId}`);
        return null;
      }

      return {
        ...slide,
        image
      };
    })
    .filter((slide): slide is ResolvedHeroSlide => slide !== null);
}

const preloadedHeroImageSources = new Set<string>();
let deferredHeroPreloadTimer: number | null = null;

function isSmallHeroViewport(): boolean {
  return window.matchMedia(HERO_MOBILE_QUERY).matches;
}

function getRuntimeHeroImageSource(image: GalleryImage): string {
  const mobileSource = getHeroMobileSource(image);

  if (isSmallHeroViewport() && mobileSource) {
    return mobileSource;
  }

  return image.src;
}

function preloadHeroImageSource(source: string): void {
  if (!source || preloadedHeroImageSources.has(source)) {
    return;
  }

  preloadedHeroImageSources.add(source);

  const image = new Image();
  image.decoding = 'async';
  image.loading = 'eager';
  image.src = source;
}

function normalizeHeroSlideIndex(index: number, totalSlides: number): number {
  return ((index % totalSlides) + totalSlides) % totalSlides;
}

function preloadHeroSlidesByIndex(slides: ResolvedHeroSlide[], indexes: number[]): void {
  if (!slides.length) {
    return;
  }

  indexes.forEach((index) => {
    const safeIndex = normalizeHeroSlideIndex(index, slides.length);
    preloadHeroImageSource(getRuntimeHeroImageSource(slides[safeIndex].image));
  });
}

function preloadHeroSlideNeighborhood(slides: ResolvedHeroSlide[], activeIndex: number): void {
  preloadHeroSlidesByIndex(slides, [activeIndex, activeIndex + 1, activeIndex - 1]);
}

function scheduleDeferredHeroPreload(slides: ResolvedHeroSlide[], activeIndex: number): void {
  if (!slides.length || deferredHeroPreloadTimer !== null) {
    return;
  }

  deferredHeroPreloadTimer = window.setTimeout(() => {
    deferredHeroPreloadTimer = null;

    slides.forEach((_slide, index) => {
      if (Math.abs(index - activeIndex) <= 1) {
        return;
      }

      preloadHeroSlidesByIndex(slides, [index]);
    });
  }, HERO_DEFERRED_PRELOAD_DELAY_MS);
}

function preloadHeroSlideImages(slides: ResolvedHeroSlide[], activeIndex = 0): void {
  preloadHeroSlideNeighborhood(slides, activeIndex);
  scheduleDeferredHeroPreload(slides, activeIndex);
}

// Stores transition timing data for one hero slideshow element.
function getHeroTransitionState(slideshow: HTMLElement): HeroTransitionState {
  let state = heroTransitionStates.get(slideshow);

  if (!state) {
    state = {
      isTransitioning: false,
      cooldownUntil: 0,
      activeTransitionLayer: null,
      cleanupTimer: null
    };

    heroTransitionStates.set(slideshow, state);
  }

  return state;
}

// Reads the current hero index and returns the matching slide.
function getCurrentHeroSlide(slideshow: HTMLElement): ResolvedHeroSlide | null {
  const slides = getResolvedHeroSlides();

  if (!slides.length) {
    return null;
  }

  const currentIndex = Number(slideshow.dataset.heroIndex ?? '0');
  const safeIndex = (currentIndex + slides.length) % slides.length;

  slideshow.dataset.heroIndex = String(safeIndex);

  return slides[safeIndex];
}

// Temporarily disables or enables hero navigation buttons during transitions.
function setHeroNavigationEnabled(slideshow: HTMLElement, isEnabled: boolean): void {
  slideshow.querySelectorAll<HTMLButtonElement>('[data-hero-prev], [data-hero-next], [data-hero-jump]').forEach((button) => {
    button.disabled = !isEnabled;
  });

  slideshow.dataset.heroTransitioning = isEnabled ? 'false' : 'true';
}

// Loads the next hero image before swapping the permanent layer.
// The previous crossfade used an overlay layer; on slower image changes that made
// the old photo visibly hang around. This keeps one authoritative image layer and
// swaps it as soon as the next image is ready, with a short timeout fallback so
// navigation never gets stuck on a bad asset.
function loadHeroImageForSwap(image: GalleryImage, onReady: () => void): number {
  const imageLoader = new Image();
  let hasCompleted = false;

  const finish = () => {
    if (hasCompleted) {
      return;
    }

    hasCompleted = true;
    onReady();
  };

  imageLoader.decoding = 'async';
  imageLoader.loading = 'eager';
  imageLoader.src = getRuntimeHeroImageSource(image);

  if (imageLoader.complete && imageLoader.naturalWidth > 0) {
    finish();
    return 0;
  }

  imageLoader.addEventListener('load', finish, { once: true });
  imageLoader.addEventListener('error', finish, { once: true });

  return window.setTimeout(finish, HERO_IMAGE_LOAD_TIMEOUT_MS);
}

function setElementText(root: HTMLElement, selector: string, text: string): void {
  const element = root.querySelector<HTMLElement>(selector);

  if (element) {
    element.textContent = text;
  }
}

function updateHeroInterface(slideshow: HTMLElement, slide: ResolvedHeroSlide): void {
  const slides = getResolvedHeroSlides();
  const totalSlides = slides.length || 1;
  const currentIndex = Number(slideshow.dataset.heroIndex ?? '0');
  const safeIndex = ((currentIndex % totalSlides) + totalSlides) % totalSlides;
  const categoryLabel = getCategoryLabel(slide.targetCategory);
  const location = slide.image.location || 'Selected work';
  const hasYear = Boolean(slide.image.year);
  const yearLabel = hasYear ? 'Year' : 'Status';
  const yearValue = slide.image.year || 'Archive';

  setElementText(slideshow, '[data-hero-meta-category]', categoryLabel);
  setElementText(slideshow, '[data-hero-meta-location]', location);
  setElementText(slideshow, '[data-hero-meta-year-label]', yearLabel);
  setElementText(slideshow, '[data-hero-meta-year]', yearValue);
  setElementText(slideshow, '[data-hero-meta-image]', `${formatTwoDigitNumber(safeIndex)} / ${String(totalSlides).padStart(2, '0')}`);

  slideshow.querySelectorAll<HTMLButtonElement>('[data-hero-jump]').forEach((button) => {
    const buttonIndex = Number(button.dataset.heroJump ?? '-1');
    const isActive = buttonIndex === safeIndex;

    button.classList.toggle('is-active', isActive);

    if (isActive) {
      button.setAttribute('aria-current', 'true');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}

// Updates the portfolio link so it routes to the active slide category.
function updateHeroLink(slideshow: HTMLElement, slide: ResolvedHeroSlide): void {
  const categoryLabel = getCategoryLabel(slide.targetCategory);
  const linkElement = slideshow.querySelector<HTMLAnchorElement>('[data-hero-link]');

  if (!linkElement) {
    updateHeroInterface(slideshow, slide);
    return;
  }

  linkElement.href = `#/portfolio/${slide.targetCategory}`;
  linkElement.removeAttribute('aria-label');

  const label = linkElement.querySelector<HTMLElement>('[data-hero-link-label]');
  const context = linkElement.querySelector<HTMLElement>('[data-hero-link-context]');

  if (label) {
    label.textContent = 'View Portfolio';
  }

  if (context) {
    context.textContent = ` — ${categoryLabel}`;
  }

  updateHeroInterface(slideshow, slide);
}

// Cancels any unfinished transition before starting a new one.
function clearActiveHeroTransition(slideshow: HTMLElement): void {
  const state = getHeroTransitionState(slideshow);

  if (state.cleanupTimer !== null) {
    window.clearTimeout(state.cleanupTimer);
    state.cleanupTimer = null;
  }

  if (state.activeTransitionLayer) {
    state.activeTransitionLayer.remove();
    state.activeTransitionLayer = null;
  }
}

// Promotes the requested slide into the one permanent hero image layer.
function finishHeroSwap(slideshow: HTMLElement, baseLayer: HTMLElement, slide: ResolvedHeroSlide): void {
  const state = getHeroTransitionState(slideshow);

  applyHeroFramingToLayer(baseLayer, slide.image);
  applyHeroShellSizingToSlideshow(slideshow, slide.image);
  updateHeroLink(slideshow, slide);

  slideshow.classList.remove('is-hero-loading');
  slideshow.classList.add('is-hero-swapped');

  window.setTimeout(() => {
    slideshow.classList.remove('is-hero-swapped');
  }, 90);

  state.activeTransitionLayer = null;
  state.cleanupTimer = null;
  state.isTransitioning = false;
  state.cooldownUntil = Date.now() + HERO_INPUT_COOLDOWN_MS;

  setHeroNavigationEnabled(slideshow, true);
}

// Runs an immediate, non-crossfade hero swap.
function swapHeroImage(slideshow: HTMLElement, slide: ResolvedHeroSlide): void {
  const baseLayer = slideshow.querySelector<HTMLElement>('[data-hero-layer]');
  const state = getHeroTransitionState(slideshow);

  if (!baseLayer) {
    state.isTransitioning = false;
    state.cooldownUntil = Date.now() + HERO_INPUT_COOLDOWN_MS;
    setHeroNavigationEnabled(slideshow, true);
    return;
  }

  clearActiveHeroTransition(slideshow);
  slideshow.classList.add('is-hero-loading');

  const completeSwap = () => finishHeroSwap(slideshow, baseLayer, slide);
  const timeoutId = loadHeroImageForSwap(slide.image, completeSwap);

  if (timeoutId) {
    state.cleanupTimer = timeoutId;
  }
}

function requestHeroSlideByIndex(slideshow: HTMLElement, nextIndex: number): void {
  // A strict input guard prevents a single key press or double-click from being
  // interpreted as multiple slide advances.
  const slides = getResolvedHeroSlides();
  const state = getHeroTransitionState(slideshow);
  const now = Date.now();

  if (slides.length <= 1 || state.isTransitioning || now < state.cooldownUntil) {
    return;
  }

  const safeNextIndex = ((nextIndex % slides.length) + slides.length) % slides.length;
  const currentIndex = Number(slideshow.dataset.heroIndex ?? '0');

  if (safeNextIndex === currentIndex) {
    return;
  }

  state.isTransitioning = true;
  setHeroNavigationEnabled(slideshow, false);

  const nextSlide = slides[safeNextIndex];

  slideshow.dataset.heroIndex = String(safeNextIndex);
  preloadHeroSlideNeighborhood(slides, safeNextIndex);
  swapHeroImage(slideshow, nextSlide);
}

// Moves the carousel one slide while protecting against double-triggered inputs.
function requestHeroSlideMove(slideshow: HTMLElement, direction: number): void {
  const slides = getResolvedHeroSlides();

  if (!slides.length) {
    return;
  }

  const currentIndex = Number(slideshow.dataset.heroIndex ?? '0');
  requestHeroSlideByIndex(slideshow, currentIndex + direction);
}

// Jumps the carousel to a specific slide while preserving the same transition guard.
function requestHeroSlideJump(slideshow: HTMLElement, nextIndex: number): void {
  requestHeroSlideByIndex(slideshow, nextIndex);
}


function getPortfolioCategoryRail(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.portfolio-category-sidebar');
}

function savePortfolioCategoryRailScroll(): void {
  const categoryRail = getPortfolioCategoryRail();

  if (!categoryRail) {
    return;
  }

  try {
    window.sessionStorage.setItem(PORTFOLIO_CATEGORY_RAIL_SCROLL_KEY, String(categoryRail.scrollLeft));
  } catch {
    // Session storage can be unavailable in some privacy modes. The category
    // rail still works normally; it just cannot restore its horizontal offset.
  }
}

function restorePortfolioCategoryRailScroll(): void {
  const categoryRail = getPortfolioCategoryRail();

  if (!categoryRail) {
    return;
  }

  let storedOffset = 0;

  try {
    storedOffset = Number(window.sessionStorage.getItem(PORTFOLIO_CATEGORY_RAIL_SCROLL_KEY) ?? '0');
  } catch {
    storedOffset = 0;
  }

  if (!Number.isFinite(storedOffset) || storedOffset <= 0) {
    return;
  }

  window.requestAnimationFrame(() => {
    categoryRail.scrollLeft = storedOffset;
  });
}

function bindPortfolioCategoryRailScrollMemory(): void {
  const categoryRail = getPortfolioCategoryRail();

  if (!categoryRail || categoryRail.dataset.scrollMemoryBound === 'true') {
    return;
  }

  categoryRail.dataset.scrollMemoryBound = 'true';
  restorePortfolioCategoryRailScroll();
  categoryRail.addEventListener('scroll', savePortfolioCategoryRailScroll, { passive: true });
}

function getPortfolioImagesForCategory(category: string): GalleryImage[] {
  if (category === 'all') {
    return galleryImages;
  }

  const filteredImages = galleryImages.filter((image) => image.category === category);
  return filteredImages.length ? filteredImages : galleryImages;
}

function setLightboxImageSource(imageElement: HTMLImageElement, image: GalleryImage): void {
  const largerImage = image.fullSrc ?? image.src;

  imageElement.dataset.fallbackSrc = image.src;
  imageElement.src = largerImage;
  imageElement.alt = image.alt;
}

function updateLightboxContent(lightbox: HTMLElement, imageSet: GalleryImage[], activeIndex: number): number {
  const safeIndex = ((activeIndex % imageSet.length) + imageSet.length) % imageSet.length;
  const image = imageSet[safeIndex];
  const imageElement = lightbox.querySelector<HTMLImageElement>('[data-lightbox-image]');
  const counterElement = lightbox.querySelector<HTMLElement>('[data-lightbox-counter]');
  const categoryElement = lightbox.querySelector<HTMLElement>('[data-lightbox-category]');
  const titleElement = lightbox.querySelector<HTMLElement>('[data-lightbox-title]');
  const locationElement = lightbox.querySelector<HTMLElement>('[data-lightbox-location]');
  const yearElement = lightbox.querySelector<HTMLElement>('[data-lightbox-year]');

  lightbox.dataset.lightboxIndex = String(safeIndex);
  lightbox.dataset.lightboxOrientation = image.imageOrientation ?? (
    (image.imageWidth ?? 1) > (image.imageHeight ?? 1)
      ? 'landscape'
      : (image.imageWidth ?? 1) < (image.imageHeight ?? 1)
        ? 'portrait'
        : 'square'
  );

  if (imageElement) {
    setLightboxImageSource(imageElement, image);
  }

  if (counterElement) {
    counterElement.textContent = `${formatTwoDigitNumber(safeIndex)} / ${String(imageSet.length).padStart(2, '0')}`;
  }

  if (categoryElement) {
    categoryElement.textContent = getCategoryLabel(image.category);
  }

  if (titleElement) {
    titleElement.textContent = image.title;
  }

  if (locationElement) {
    locationElement.textContent = image.location || 'Selected work';
  }

  if (yearElement) {
    yearElement.textContent = image.year || 'Archive';
  }

  return safeIndex;
}

// Opens a fullscreen view of a portfolio image.
function openImageLightbox(image: GalleryImage, imageSet: GalleryImage[] = galleryImages, initialIndex = 0): void {
  const existingLightbox = document.querySelector('.image-lightbox');

  if (existingLightbox) {
    existingLightbox.remove();
  }

  const previouslyFocusedElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  const safeImageSet = imageSet.length ? imageSet : [image];
  const resolvedInitialIndex = Math.max(0, safeImageSet.findIndex((item) => item.id === image.id));
  const startIndex = resolvedInitialIndex >= 0 ? resolvedInitialIndex : initialIndex;
  const lightbox = document.createElement('div');
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  lightbox.className = 'image-lightbox';
  lightbox.dataset.lightboxIndex = String(startIndex);
  lightbox.innerHTML = `
    <div class="image-lightbox-inner" role="dialog" aria-modal="true" aria-label="Expanded image view">
      <button class="image-lightbox-close" type="button" data-lightbox-close aria-label="Close expanded image">Close</button>
      <button class="image-lightbox-nav image-lightbox-nav-prev" type="button" data-lightbox-prev aria-label="Previous image">Prev</button>
      <button class="image-lightbox-nav image-lightbox-nav-next" type="button" data-lightbox-next aria-label="Next image">Next</button>

      <figure>
        <div class="image-lightbox-frame">
          <img data-lightbox-image src="" alt="" />
        </div>
        <figcaption>
          <span class="image-lightbox-counter" data-lightbox-counter></span>
          <span class="image-lightbox-category" data-lightbox-category></span>
          <strong data-lightbox-title></strong>
          <span data-lightbox-location></span>
          <span data-lightbox-year></span>
        </figcaption>
      </figure>
    </div>
  `;

  document.body.appendChild(lightbox);
  document.body.classList.add('image-lightbox-is-open');
  const backgroundRoot = document.querySelector<HTMLElement>('#app');
  if (backgroundRoot) {
    backgroundRoot.inert = true;
  }

  const closeButton = lightbox.querySelector<HTMLButtonElement>('[data-lightbox-close]');
  const prevButton = lightbox.querySelector<HTMLButtonElement>('[data-lightbox-prev]');
  const nextButton = lightbox.querySelector<HTMLButtonElement>('[data-lightbox-next]');
  const imageElement = lightbox.querySelector<HTMLImageElement>('[data-lightbox-image]');
  const frameElement = lightbox.querySelector<HTMLElement>('.image-lightbox-frame');
  const dialogElement = lightbox.querySelector<HTMLElement>('.image-lightbox-inner');
  let controlIdleTimer: number | null = null;
  let controlLayoutFrame: number | null = null;
  let imageChangeRequest = 0;

  if (safeImageSet.length <= 1) {
    prevButton?.setAttribute('disabled', 'true');
    nextButton?.setAttribute('disabled', 'true');
  }

  function rectanglesIntersect(a: DOMRect, b: DOMRect): boolean {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function rectangleContains(outer: DOMRect, inner: DOMRect): boolean {
    return inner.left >= outer.left && inner.right <= outer.right && inner.top >= outer.top && inner.bottom <= outer.bottom;
  }

  function updateLightboxControlOverlap() {
    if (!imageElement || !imageElement.complete || imageElement.naturalWidth <= 0) {
      return;
    }

    lightbox.classList.remove('is-controls-idle');
    const imageRect = imageElement.getBoundingClientRect();

    [prevButton, nextButton].forEach((button) => {
      if (button) {
        button.dataset.overlapsImage = rectanglesIntersect(button.getBoundingClientRect(), imageRect) ? 'true' : 'false';
      }
    });

    if (closeButton) {
      const closeRect = closeButton.getBoundingClientRect();
      closeButton.dataset.closeControlMode = rectangleContains(imageRect, closeRect) ? 'fade' : 'retract';
      closeButton.dataset.overlapsImage = rectanglesIntersect(closeRect, imageRect) ? 'true' : 'false';
    }
  }

  function scheduleLightboxControlOverlap() {
    if (controlLayoutFrame !== null) {
      window.cancelAnimationFrame(controlLayoutFrame);
    }

    controlLayoutFrame = window.requestAnimationFrame(() => {
      controlLayoutFrame = null;
      updateLightboxControlOverlap();
    });
  }

  function hideInactiveLightboxControls() {
    lightbox.classList.add('is-controls-idle');
  }

  function revealLightboxControls() {
    lightbox.classList.remove('is-controls-idle');

    if (controlIdleTimer !== null) {
      window.clearTimeout(controlIdleTimer);
    }

    controlIdleTimer = window.setTimeout(hideInactiveLightboxControls, LIGHTBOX_CONTROLS_IDLE_MS);
  }

  function handleLightboxResize() {
    scheduleLightboxControlOverlap();
    revealLightboxControls();
  }

  function showImageAtIndex(nextIndex: number, showImmediately = false) {
    const safeIndex = ((nextIndex % safeImageSet.length) + safeImageSet.length) % safeImageSet.length;
    const nextImage = safeImageSet[safeIndex];
    const requestedSource = nextImage.fullSrc ?? nextImage.src;
    const requestId = ++imageChangeRequest;

    const applyImageChange = () => {
      if (requestId !== imageChangeRequest || !lightbox.isConnected) {
        return;
      }

      updateLightboxContent(lightbox, safeImageSet, safeIndex);
      revealLightboxControls();
      scheduleLightboxControlOverlap();
    };

    if (showImmediately) {
      applyImageChange();
      return;
    }

    const preloadImage = new Image();
    let isUsingFallback = requestedSource === nextImage.src;
    preloadImage.alt = '';
    preloadImage.onload = () => {
      const decoding = typeof preloadImage.decode === 'function'
        ? preloadImage.decode()
        : Promise.resolve();

      void decoding.catch(() => undefined).then(applyImageChange);
    };
    preloadImage.onerror = () => {
      if (isUsingFallback) {
        return;
      }

      isUsingFallback = true;
      preloadImage.src = nextImage.src;
    };
    preloadImage.src = requestedSource;
  }

  function moveLightbox(direction: number) {
    if (safeImageSet.length <= 1) {
      return;
    }

    const currentIndex = Number(lightbox.dataset.lightboxIndex ?? '0');
    showImageAtIndex(currentIndex + direction);
  }

  function closeLightbox() {
    document.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', handleLightboxResize);
    if (controlIdleTimer !== null) {
      window.clearTimeout(controlIdleTimer);
    }
    if (controlLayoutFrame !== null) {
      window.cancelAnimationFrame(controlLayoutFrame);
    }
    document.body.classList.remove('image-lightbox-is-open');
    lightbox.remove();
    if (backgroundRoot) {
      backgroundRoot.inert = false;
    }

    if (previouslyFocusedElement?.isConnected) {
      previouslyFocusedElement.focus({ preventScroll: true });
    }
  }

  function getFocusableLightboxElements(): HTMLElement[] {
    return Array.from(lightbox.querySelectorAll<HTMLElement>(LIGHTBOX_FOCUSABLE_SELECTOR))
      .filter((element) => !element.hasAttribute('disabled'));
  }

  function keepFocusInsideLightbox(event: KeyboardEvent) {
    const focusableElements = getFocusableLightboxElements();

    if (!focusableElements.length) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Tab') {
      keepFocusInsideLightbox(event);
      return;
    }

    if (event.code === 'Escape') {
      event.preventDefault();
      closeLightbox();
      return;
    }

    if (event.code === 'ArrowLeft') {
      event.preventDefault();
      moveLightbox(-1);
      return;
    }

    if (event.code === 'ArrowRight') {
      event.preventDefault();
      moveLightbox(1);
    }
  }

  function handleTouchStart(event: TouchEvent) {
    const target = event.target instanceof Element ? event.target : null;

    if (event.touches.length !== 1 || target?.closest('button')) {
      return;
    }

    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = window.performance.now();
  }

  function handleTouchEnd(event: TouchEvent) {
    if (safeImageSet.length <= 1 || touchStartTime <= 0 || !event.changedTouches.length) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const elapsed = window.performance.now() - touchStartTime;
    const absoluteX = Math.abs(deltaX);
    const absoluteY = Math.abs(deltaY);

    touchStartTime = 0;

    if (
      elapsed > LIGHTBOX_SWIPE_MAX_DURATION_MS ||
      absoluteX < LIGHTBOX_SWIPE_THRESHOLD_PX ||
      absoluteX <= absoluteY * 1.35
    ) {
      return;
    }

    moveLightbox(deltaX < 0 ? 1 : -1);
  }

  imageElement?.addEventListener('error', () => {
    if (!imageElement.dataset.fallbackSrc || imageElement.src.endsWith(imageElement.dataset.fallbackSrc)) {
      return;
    }

    imageElement.src = imageElement.dataset.fallbackSrc;
  });
  imageElement?.addEventListener('load', () => {
    scheduleLightboxControlOverlap();
    revealLightboxControls();
  });

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  lightbox.addEventListener('touchstart', handleTouchStart, { passive: true });
  lightbox.addEventListener('touchend', handleTouchEnd, { passive: true });
  frameElement?.addEventListener('pointermove', revealLightboxControls, { passive: true });
  frameElement?.addEventListener('pointerdown', revealLightboxControls, { passive: true });
  lightbox.addEventListener('focusin', revealLightboxControls);
  closeButton?.addEventListener('click', closeLightbox);
  prevButton?.addEventListener('click', () => moveLightbox(-1));
  nextButton?.addEventListener('click', () => moveLightbox(1));
  document.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', handleLightboxResize, { passive: true });
  showImageAtIndex(startIndex, true);
  dialogElement?.setAttribute('tabindex', '-1');
  dialogElement?.focus();
}

const HERO_WHEEL_ZONE_SELECTOR = '[data-hero-wheel-zone]';
const HERO_WHEEL_EXCLUDE_SELECTOR = [
  '.home-hero-copy-panel',
  '.home-hero-meta-panel',
  '.home-hero-actions',
  '[data-open-virtual-gallery]',
  '[data-hero-link]'
].join(', ');

const HERO_WHEEL_PIXEL_THRESHOLD = 65;

function getEventElementTarget(event: WheelEvent): Element | null {
  return event.target instanceof Element ? event.target : null;
}

function isInsideHeroWheelExclusion(element: Element | null): boolean {
  return Boolean(element?.closest(HERO_WHEEL_EXCLUDE_SELECTOR));
}

function getHeroWheelZoneFromEventPath(event: WheelEvent): HTMLElement | null {
  const path = event.composedPath();

  for (const entry of path) {
    if (!(entry instanceof Element)) {
      continue;
    }

    if (isInsideHeroWheelExclusion(entry)) {
      return null;
    }

    const wheelZone = entry.closest<HTMLElement>(HERO_WHEEL_ZONE_SELECTOR);

    if (wheelZone) {
      return wheelZone;
    }
  }

  return null;
}

function getHeroWheelZoneFromPoint(event: WheelEvent): HTMLElement | null {
  if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
    return null;
  }

  const elementsAtPoint = document.elementsFromPoint(event.clientX, event.clientY);

  if (elementsAtPoint.some((element) => isInsideHeroWheelExclusion(element))) {
    return null;
  }

  for (const element of elementsAtPoint) {
    const wheelZone = element.closest<HTMLElement>(HERO_WHEEL_ZONE_SELECTOR);

    if (wheelZone) {
      return wheelZone;
    }
  }

  for (const wheelZone of document.querySelectorAll<HTMLElement>(HERO_WHEEL_ZONE_SELECTOR)) {
    const rect = wheelZone.getBoundingClientRect();

    if (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    ) {
      return wheelZone;
    }
  }

  return null;
}

function getHeroSlideshowFromWheelEvent(event: WheelEvent): HTMLElement | null {
  const target = getEventElementTarget(event);

  if (isInsideHeroWheelExclusion(target)) {
    return null;
  }

  const wheelZone = getHeroWheelZoneFromEventPath(event) ?? getHeroWheelZoneFromPoint(event);
  const slideshow = wheelZone?.closest<HTMLElement>('[data-hero-slideshow]') ?? null;

  return slideshow;
}

function getNormalizedWheelDelta(event: WheelEvent): number {
  const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
    ? event.deltaX
    : event.deltaY;

  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return dominantDelta * 16;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return dominantDelta * window.innerHeight;
  }

  return dominantDelta;
}

function handleHeroWheelNavigation(event: WheelEvent): void {
  const slideshow = getHeroSlideshowFromWheelEvent(event);

  if (!slideshow) {
    return;
  }

  if (event.cancelable) {
    event.preventDefault();
  }

  event.stopPropagation();

  const delta = getNormalizedWheelDelta(event);

  if (Math.abs(delta) < 2) {
    return;
  }

  const previousAccumulation = heroWheelAccumulation.get(slideshow) ?? 0;
  const nextAccumulation = previousAccumulation + delta;

  heroWheelAccumulation.set(slideshow, nextAccumulation);

  if (Math.abs(nextAccumulation) < HERO_WHEEL_PIXEL_THRESHOLD) {
    return;
  }

  heroWheelAccumulation.set(slideshow, 0);
  requestHeroSlideMove(slideshow, nextAccumulation > 0 ? 1 : -1);
}

function bindHeroWheelNavigation(): void {
  if (heroWheelNavigationBound) {
    return;
  }

  window.addEventListener('wheel', handleHeroWheelNavigation, {
    capture: true,
    passive: false
  });

  heroWheelNavigationBound = true;
}


function updateAboutScrollMotion(): void {
  aboutScrollMotionFrame = 0;

  const page = document.querySelector<HTMLElement>('.modern-about-page');

  if (!page) {
    return;
  }

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const motionRoot = document.querySelector<HTMLElement>('.modern-site[data-page="about"]') ?? page;

  if (motionQuery.matches) {
    motionRoot.querySelectorAll<HTMLElement>('[data-about-float]').forEach((element) => {
      element.style.setProperty('--about-float-y', '0');
      element.style.setProperty('--about-float-x', '0');
    });
    return;
  }

  const pageRect = page.getBoundingClientRect();
  const viewportOffset = -pageRect.top;

  motionRoot.querySelectorAll<HTMLElement>('[data-about-float]').forEach((element) => {
    const speed = Number(element.dataset.aboutFloatSpeed ?? '0');
    const hasXMotion = typeof element.dataset.aboutFloatXSpeed === 'string';
    const xSpeed = Number(element.dataset.aboutFloatXSpeed ?? '0');

    if (!Number.isFinite(speed) || !Number.isFinite(xSpeed)) {
      return;
    }

    const y = Math.max(-34, Math.min(34, viewportOffset * speed));
    const x = hasXMotion ? Math.max(-16, Math.min(16, viewportOffset * xSpeed)) : 0;
    element.style.setProperty('--about-float-y', y.toFixed(2));
    element.style.setProperty('--about-float-x', x.toFixed(2));
  });
}

function requestAboutScrollMotionUpdate(): void {
  if (aboutScrollMotionFrame) {
    return;
  }

  aboutScrollMotionFrame = window.requestAnimationFrame(updateAboutScrollMotion);
}

function setupAboutScrollMotion(): void {
  updateAboutScrollMotion();

  if (aboutScrollMotionBound) {
    return;
  }

  aboutScrollMotionBound = true;
  window.addEventListener('scroll', requestAboutScrollMotionUpdate, { passive: true });
  window.addEventListener('resize', requestAboutScrollMotionUpdate, { passive: true });
}

// Connects mouse controls to every hero slideshow on the page.
function setupHeroSlideshows(): void {
  bindHeroWheelNavigation();

  document.querySelectorAll<HTMLElement>('[data-hero-slideshow]').forEach((slideshow) => {
    if (slideshow.dataset.heroControllerBound === 'true') {
      return;
    }

    slideshow.dataset.heroControllerBound = 'true';
    slideshow.dataset.heroTransitioning = 'false';

    const slides = getResolvedHeroSlides();
    const initialSlide = getCurrentHeroSlide(slideshow);
    const baseLayer = slideshow.querySelector<HTMLElement>('[data-hero-layer]');

    const initialHeroIndex = Number(slideshow.dataset.heroIndex ?? '0');
    preloadHeroSlideImages(slides, initialHeroIndex);

    if (initialSlide && baseLayer) {
      applyHeroShellSizingToSlideshow(slideshow, initialSlide.image);
      applyHeroFramingToLayer(baseLayer, initialSlide.image);
      updateHeroLink(slideshow, initialSlide);
    }

    slideshow.querySelector<HTMLButtonElement>('[data-hero-prev]')?.addEventListener('click', () => {
      requestHeroSlideMove(slideshow, -1);
    });

    slideshow.querySelector<HTMLButtonElement>('[data-hero-next]')?.addEventListener('click', () => {
      requestHeroSlideMove(slideshow, 1);
    });

    slideshow.querySelectorAll<HTMLButtonElement>('[data-hero-jump]').forEach((button) => {
      button.addEventListener('click', () => {
        const requestedIndex = Number(button.dataset.heroJump ?? '0');
        requestHeroSlideJump(slideshow, requestedIndex);
      });
    });
  });
}

// Connects portfolio category buttons to hash routes.
function setupPortfolioFilters(): void {
  bindPortfolioCategoryRailScrollMemory();

  document.querySelectorAll<HTMLButtonElement>('[data-carousel-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const selectedCategory = button.dataset.carouselFilter ?? 'all';

      savePortfolioCategoryRailScroll();

      window.location.hash = selectedCategory === 'all'
        ? '#/portfolio'
        : `#/portfolio/${selectedCategory}`;
    });
  });
}

type PortfolioLoadItem = {
  image: HTMLImageElement;
  columnIndex: number;
  rowIndex: number;
};

function getPortfolioLoadOrder(): PortfolioLoadItem[] {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.portfolio-grid-card'));
  const columns: Array<{ left: number; cards: HTMLElement[] }> = [];

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    let column = columns.find((candidate) => Math.abs(candidate.left - rect.left) < 8);

    if (!column) {
      column = { left: rect.left, cards: [] };
      columns.push(column);
    }

    column.cards.push(card);
  });

  columns.sort((a, b) => a.left - b.left);
  columns.forEach((column) => {
    column.cards.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  });

  return columns
    .flatMap((column, columnIndex) => column.cards.map((card, rowIndex) => ({
      image: card.querySelector<HTMLImageElement>('[data-portfolio-image-src]'),
      columnIndex,
      rowIndex
    })))
    .filter((item): item is PortfolioLoadItem => Boolean(item.image))
    .sort((a, b) => a.rowIndex - b.rowIndex || a.columnIndex - b.columnIndex);
}

function revealPortfolioImage(image: HTMLImageElement): void {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      image.classList.remove('is-awaiting-load');
      image.classList.add('is-revealing');

      window.setTimeout(() => {
        image.classList.remove('is-revealing');
      }, PORTFOLIO_REVEAL_CLASS_MS);
    });
  });
}

function startPortfolioImageLoad(item: PortfolioLoadItem): void {
  const { image, rowIndex } = item;
  const source = image.dataset.portfolioImageSrc;

  if (!source || image.src) {
    return;
  }

  image.loading = rowIndex === 0 ? 'eager' : 'lazy';
  image.fetchPriority = rowIndex === 0 ? 'high' : rowIndex === 1 ? 'auto' : 'low';
  image.addEventListener('load', () => revealPortfolioImage(image), { once: true });
  image.addEventListener('error', () => image.classList.remove('is-awaiting-load'), { once: true });
  image.src = source;
}

function setupPortfolioImageLoading(): void {
  const grid = document.querySelector<HTMLElement>('.portfolio-grid');

  if (!grid) {
    return;
  }

  window.requestAnimationFrame(() => {
    const loadOrder = getPortfolioLoadOrder();

    loadOrder.forEach((item) => {
      window.setTimeout(() => {
        if (item.image.isConnected) {
          startPortfolioImageLoad(item);
        }
      }, item.rowIndex * PORTFOLIO_LOAD_WAVE_DELAY_MS);
    });
  });
}

// Connects portfolio image buttons to the fullscreen lightbox.
function setupPortfolioLightbox(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-lightbox-image-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const imageId = button.dataset.lightboxImageId;
      const image = imageId ? getImageById(imageId) : null;
      const category = button.dataset.lightboxCategory ?? 'all';
      const imageSet = getPortfolioImagesForCategory(category);
      const imageIndex = image ? imageSet.findIndex((item) => item.id === image.id) : 0;

      if (image) {
        openImageLightbox(image, imageSet, imageIndex);
      }
    });
  });
}

// Prevents keyboard shortcuts from interfering with forms and overlays.
function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  const tagName = target?.tagName.toLowerCase();

  if (
    event.repeat ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target?.isContentEditable
  ) {
    return true;
  }

  return (
    document.body.classList.contains('gallery-is-open') ||
    document.body.classList.contains('image-lightbox-is-open') ||
    document.body.classList.contains('gallery-fallback-is-open')
  );
}

// Adds left/right keyboard control for the hero carousel.
function setupKeyboardNavigation(): void {
  if (keyboardNavigationBound) {
    return;
  }

  keyboardNavigationBound = true;

  document.addEventListener('keydown', (event) => {
    if (shouldIgnoreKeyboardEvent(event)) {
      return;
    }

    if (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') {
      return;
    }

    const heroSlideshow = document.querySelector<HTMLElement>('[data-hero-slideshow]');

    if (!heroSlideshow) {
      return;
    }

    event.preventDefault();
    requestHeroSlideMove(heroSlideshow, event.code === 'ArrowLeft' ? -1 : 1);
  });
}

// Initializes all traditional website behavior after each route render.
export function setupSiteInteractions(): void {
  setupHeroSlideshows();
  setupPortfolioFilters();
  setupPortfolioImageLoading();
  setupPortfolioLightbox();
  setupKeyboardNavigation();
  setupAboutScrollMotion();
}
