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

const HERO_INPUT_COOLDOWN_MS = 30;
const HERO_IMAGE_LOAD_TIMEOUT_MS = 450;

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

function preloadHeroSlideImages(slides: ResolvedHeroSlide[]): void {
  slides.forEach((slide) => {
    const sources = [slide.image.src, slide.image.thumbSrc].filter((source): source is string => Boolean(source));

    sources.forEach((source) => {
      if (preloadedHeroImageSources.has(source)) {
        return;
      }

      preloadedHeroImageSources.add(source);

      const image = new Image();
      image.decoding = 'async';
      image.loading = 'eager';
      image.src = source;
    });
  });
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
  imageLoader.src = image.src;

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
  linkElement.setAttribute('aria-label', `View ${categoryLabel} portfolio`);

  const label = linkElement.querySelector('span');

  if (label) {
    label.textContent = 'View Portfolio';
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

  const safeImageSet = imageSet.length ? imageSet : [image];
  const resolvedInitialIndex = Math.max(0, safeImageSet.findIndex((item) => item.id === image.id));
  const startIndex = resolvedInitialIndex >= 0 ? resolvedInitialIndex : initialIndex;
  const lightbox = document.createElement('div');

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

  const closeButton = lightbox.querySelector<HTMLButtonElement>('[data-lightbox-close]');
  const prevButton = lightbox.querySelector<HTMLButtonElement>('[data-lightbox-prev]');
  const nextButton = lightbox.querySelector<HTMLButtonElement>('[data-lightbox-next]');
  const imageElement = lightbox.querySelector<HTMLImageElement>('[data-lightbox-image]');

  if (safeImageSet.length <= 1) {
    prevButton?.setAttribute('disabled', 'true');
    nextButton?.setAttribute('disabled', 'true');
  }

  function showImageAtIndex(nextIndex: number) {
    updateLightboxContent(lightbox, safeImageSet, nextIndex);
  }

  function moveLightbox(direction: number) {
    const currentIndex = Number(lightbox.dataset.lightboxIndex ?? '0');
    showImageAtIndex(currentIndex + direction);
  }

  function closeLightbox() {
    document.removeEventListener('keydown', handleKeyDown);
    document.body.classList.remove('image-lightbox-is-open');
    lightbox.remove();
  }

  function handleKeyDown(event: KeyboardEvent) {
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

  imageElement?.addEventListener('error', () => {
    if (!imageElement.dataset.fallbackSrc || imageElement.src.endsWith(imageElement.dataset.fallbackSrc)) {
      return;
    }

    imageElement.src = imageElement.dataset.fallbackSrc;
  });

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  closeButton?.addEventListener('click', closeLightbox);
  prevButton?.addEventListener('click', () => moveLightbox(-1));
  nextButton?.addEventListener('click', () => moveLightbox(1));
  document.addEventListener('keydown', handleKeyDown);
  showImageAtIndex(startIndex);
  closeButton?.focus();
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

    preloadHeroSlideImages(slides);

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
  document.querySelectorAll<HTMLButtonElement>('[data-carousel-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const selectedCategory = button.dataset.carouselFilter ?? 'all';

      window.location.hash = selectedCategory === 'all'
        ? '#/portfolio'
        : `#/portfolio/${selectedCategory}`;
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
  setupPortfolioLightbox();
  setupKeyboardNavigation();
}
