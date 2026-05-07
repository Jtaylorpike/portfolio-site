// Attaches browser behavior to the public portfolio pages.
//
// The site renderer builds static HTML strings for each route. After the router
// inserts that HTML into the page, this controller connects the interactive
// pieces: the home-page hero slideshow, portfolio category filters, fullscreen
// image lightbox, and keyboard navigation. The code deliberately keeps state on
// DOM elements and WeakMaps so old page instances can be garbage-collected after
// route changes.

import { galleryImages, type GalleryImage } from '../data/images';
import { heroSlides } from '../data/heroSlides';
import { getCategoryLabel } from '../data/categories';

// The global keyboard listener should only be registered once for the lifetime
// of the page. Route changes recreate page markup, but they should not add more
// document-level keydown listeners.
let keyboardNavigationBound = false;

// This duration must match the CSS transition for hero fade layers. The cleanup
// timer waits slightly longer than this so the visual fade can finish before the
// temporary layer is removed.
const HERO_CROSSFADE_MS = 650;

// A short post-transition lock prevents duplicate input from a key repeat,
// double-click, or double-bound browser event from advancing two slides. The
// user can still navigate quickly, but one visual transition must complete first.
const HERO_INPUT_COOLDOWN_MS = 220;

// Hero framing values are saved per image by the local editor. "auto" means the
// public site should infer a style from the saved image dimensions.
type HeroFrameStyle = 'auto' | 'landscape' | 'portrait' | 'square';
type HeroFitMode = 'cover' | 'contain';
type ResolvedHeroFrameStyle = Exclude<HeroFrameStyle, 'auto'>;

// GalleryImage records come from JSON and can contain optional image metadata.
// This type documents the optional fields used by the public hero carousel.
type HeroFrameImage = GalleryImage & {
  heroFrameStyle?: HeroFrameStyle;
  heroFitMode?: HeroFitMode;
  imageWidth?: number | string;
  imageHeight?: number | string;
  imageAspectRatio?: number | string;
  imageOrientation?: string;
};

type ResolvedHeroSlide = {
  imageId: string;
  targetCategory: string;
  image: GalleryImage;
};

type HeroTransitionState = {
  isTransitioning: boolean;
  cooldownUntil: number;
  cleanupTimer: number | null;
  activeTransitionLayer: HTMLElement | null;
};

// Per-slideshow transition state. WeakMap is used because the router replaces
// the slideshow DOM when changing pages, and old elements should not be retained.
const heroTransitionStates = new WeakMap<HTMLElement, HeroTransitionState>();

function getHeroTransitionState(slideshow: HTMLElement): HeroTransitionState {
  const existingState = heroTransitionStates.get(slideshow);

  if (existingState) {
    return existingState;
  }

  const initialState: HeroTransitionState = {
    isTransitioning: false,
    cooldownUntil: 0,
    cleanupTimer: null,
    activeTransitionLayer: null
  };

  heroTransitionStates.set(slideshow, initialState);

  return initialState;
}

function getImageById(imageId: string) {
  // Central image lookup. The hero slideshow and lightbox both work with image
  // IDs stored in JSON, so this avoids duplicating the search logic.
  return galleryImages.find((image) => image.id === imageId);
}

function getImageAspect(image: GalleryImage) {
  // The editor stores aspect ratio from the source image. Use that first because
  // it is available before the browser finishes loading the visible image.
  const heroImage = image as HeroFrameImage;
  const explicitAspectRatio = Number(heroImage.imageAspectRatio);

  if (explicitAspectRatio > 0) {
    return explicitAspectRatio;
  }

  const width = Number(heroImage.imageWidth);
  const height = Number(heroImage.imageHeight);

  if (width > 0 && height > 0) {
    return width / height;
  }

  // Default to a normal landscape hero if metadata is missing from an older
  // image record.
  return 16 / 9;
}

function getImageOrientation(image: GalleryImage): ResolvedHeroFrameStyle {
  // Prefer the explicit orientation saved by the editor. If it is missing, infer
  // orientation from the aspect ratio.
  const heroImage = image as HeroFrameImage;

  if (
    heroImage.imageOrientation === 'landscape' ||
    heroImage.imageOrientation === 'portrait' ||
    heroImage.imageOrientation === 'square'
  ) {
    return heroImage.imageOrientation;
  }

  const aspectRatio = getImageAspect(image);

  if (Math.abs(aspectRatio - 1) <= 0.04) {
    return 'square';
  }

  return aspectRatio > 1 ? 'landscape' : 'portrait';
}

function getHeroFrameStyle(image: GalleryImage): HeroFrameStyle {
  // The editor can force landscape, portrait, or square behavior. Any invalid
  // value falls back to auto so malformed data cannot break the page.
  const frameStyle = (image as HeroFrameImage).heroFrameStyle;

  if (
    frameStyle === 'landscape' ||
    frameStyle === 'portrait' ||
    frameStyle === 'square'
  ) {
    return frameStyle;
  }

  return 'auto';
}

function getResolvedHeroFrameStyle(image: GalleryImage): ResolvedHeroFrameStyle {
  // Converts the saved editor setting into the exact orientation treatment used
  // by CSS. This does not decide whether the photo crops or fits; that separate
  // decision is handled by getHeroFitMode.
  const frameStyle = getHeroFrameStyle(image);

  if (frameStyle !== 'auto') {
    return frameStyle;
  }

  return getImageOrientation(image);
}

function getHeroFitMode(image: GalleryImage): HeroFitMode {
  // Cover fills the 16:9 hero frame and may crop. Contain keeps the entire image
  // visible. When an older image does not yet have heroFitMode, portraits and
  // squares default to contain, while landscapes keep the original cover look.
  const fitMode = (image as HeroFrameImage).heroFitMode;

  if (fitMode === 'cover' || fitMode === 'contain') {
    return fitMode;
  }

  return getResolvedHeroFrameStyle(image) === 'landscape' ? 'cover' : 'contain';
}

function getHeroLayerClassName(image: GalleryImage, extraClassName = '') {
  // Every slide is a full-frame layer. The image inside the layer can crop or
  // contain, but the layer itself always covers the whole hero area. This is what
  // prevents previous slides from showing through the side gutters of portrait
  // images during crossfades.
  const frameStyle = getResolvedHeroFrameStyle(image);
  const fitMode = getHeroFitMode(image);
  const classNames = [
    'home-hero-image-layer',
    `home-hero-image-layer-${frameStyle}`,
    `home-hero-fit-${fitMode}`,
    extraClassName
  ].filter(Boolean);

  return classNames.join(' ');
}

function getResolvedHeroSlides() {
  // heroSlides.json stores lightweight slide entries that reference image IDs.
  // The public slideshow needs the full image record, so this resolves each ID.
  return heroSlides
    .map((slide) => {
      const image = getImageById(slide.imageId);

      if (!image) {
        console.warn(`Hero slide image not found: ${slide.imageId}`);
        return null;
      }

      return {
        ...slide,
        image
      };
    })
    .filter((slide): slide is ResolvedHeroSlide => slide !== null);
}

function getCurrentHeroSlide(slideshow: HTMLElement) {
  // Reads the current slide index from the slideshow element and normalizes it so
  // it always points to a valid slide.
  const slides = getResolvedHeroSlides();

  if (!slides.length) {
    return null;
  }

  const currentIndex = Number(slideshow.dataset.heroIndex ?? '0');
  const safeIndex = (currentIndex + slides.length) % slides.length;

  slideshow.dataset.heroIndex = String(safeIndex);

  return slides[safeIndex];
}

function setHeroNavigationEnabled(slideshow: HTMLElement, isEnabled: boolean) {
  // Disabling the buttons while a transition is running prevents pointer devices
  // from sending duplicate next/previous requests during the same fade.
  slideshow.querySelectorAll<HTMLButtonElement>('[data-hero-prev], [data-hero-next]').forEach((button) => {
    button.disabled = !isEnabled;
  });

  slideshow.dataset.heroTransitioning = isEnabled ? 'false' : 'true';
}

function applyHeroLayerAttributes(layerElement: HTMLElement, image: GalleryImage) {
  // Updates the permanent base layer so it matches the current slide after the
  // transition layer has completed its fade.
  const imageElement = layerElement.querySelector<HTMLImageElement>('[data-hero-layer-image]');

  layerElement.className = getHeroLayerClassName(image);
  layerElement.dataset.heroFrameStyle = getResolvedHeroFrameStyle(image);
  layerElement.dataset.heroFitMode = getHeroFitMode(image);

  if (!imageElement) {
    return;
  }

  imageElement.src = image.src;
  imageElement.alt = image.alt;
  imageElement.style.objectPosition = image.heroPosition ?? '50% 50%';
}

function createTransitionLayer(image: GalleryImage) {
  // Creates the temporary incoming slide. The transition layer uses the same
  // layer -> frame -> image structure that the permanent hero slide uses. The
  // frame element is important because portrait and square presentations need a
  // centered frame inside the 16:9 hero area, while landscape presentations use
  // the entire hero area as their frame.
  const layerElement = document.createElement('div');
  const frameElement = document.createElement('div');
  const imageElement = document.createElement('img');

  layerElement.className = getHeroLayerClassName(image, 'home-hero-transition-layer');
  layerElement.dataset.heroFrameStyle = getResolvedHeroFrameStyle(image);
  layerElement.dataset.heroFitMode = getHeroFitMode(image);

  frameElement.className = 'home-hero-image-frame';
  frameElement.dataset.heroImageFrame = 'true';

  imageElement.className = 'home-hero-image';
  imageElement.dataset.heroLayerImage = 'true';
  imageElement.decoding = 'async';
  imageElement.src = image.src;
  imageElement.alt = '';
  imageElement.style.objectPosition = image.heroPosition ?? '50% 50%';

  frameElement.appendChild(imageElement);
  layerElement.appendChild(frameElement);

  return {
    layerElement,
    imageElement
  };
}

function updateHeroLink(slideshow: HTMLElement, slide: ResolvedHeroSlide) {
  // The invisible center link should always point to the portfolio category for
  // the current slide.
  const categoryLabel = getCategoryLabel(slide.targetCategory);
  const linkElement = slideshow.querySelector<HTMLAnchorElement>('[data-hero-link]');

  if (!linkElement) {
    return;
  }

  linkElement.href = `#/portfolio/${slide.targetCategory}`;
  linkElement.setAttribute('aria-label', `View ${categoryLabel} portfolio`);

  const label = linkElement.querySelector('span');

  if (label) {
    label.textContent = `View ${categoryLabel}`;
  }
}

function clearActiveHeroTransition(slideshow: HTMLElement) {
  // Removes an unfinished transition layer and clears its timer. This is mostly a
  // safety cleanup for route changes or image-load failures.
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

function crossfadeHeroImage(slideshow: HTMLElement, slide: ResolvedHeroSlide) {
  // Runs a single hero transition. The incoming slide sits above the current
  // slide. Once the fade finishes, the permanent base layer is updated to the
  // incoming image and the temporary layer is removed.
  const imageShell = slideshow.querySelector<HTMLElement>('[data-hero-image-shell]');
  const baseLayer = slideshow.querySelector<HTMLElement>('[data-hero-layer]');
  const state = getHeroTransitionState(slideshow);

  if (!imageShell || !baseLayer) {
    state.isTransitioning = false;
    state.cooldownUntil = Date.now() + HERO_INPUT_COOLDOWN_MS;
    setHeroNavigationEnabled(slideshow, true);
    return;
  }

  const resolvedBaseLayer = baseLayer;

  clearActiveHeroTransition(slideshow);

  const { layerElement, imageElement } = createTransitionLayer(slide.image);

  state.activeTransitionLayer = layerElement;
  imageShell.appendChild(layerElement);
  updateHeroLink(slideshow, slide);

  function finishTransition() {
    applyHeroLayerAttributes(resolvedBaseLayer, slide.image);
    layerElement.remove();

    state.activeTransitionLayer = null;
    state.cleanupTimer = null;
    state.isTransitioning = false;
    state.cooldownUntil = Date.now() + HERO_INPUT_COOLDOWN_MS;

    setHeroNavigationEnabled(slideshow, true);
  }

  function startTransition() {
    window.requestAnimationFrame(() => {
      layerElement.classList.add('is-visible');
    });

    state.cleanupTimer = window.setTimeout(finishTransition, HERO_CROSSFADE_MS + 80);
  }

  if (imageElement.complete && imageElement.naturalWidth > 0) {
    startTransition();
    return;
  }

  imageElement.addEventListener('load', startTransition, { once: true });
  imageElement.addEventListener('error', finishTransition, { once: true });
}

function requestHeroSlideMove(slideshow: HTMLElement, direction: number) {
  // Public entry point for next/previous commands. The guard here is intentionally
  // strict: while a transition is running, and for a short cooldown afterward,
  // additional input is ignored. This fixes accidental double-advances from
  // key-repeat, fast double-clicks, or duplicate event delivery.
  const slides = getResolvedHeroSlides();
  const state = getHeroTransitionState(slideshow);
  const now = Date.now();

  if (slides.length <= 1) {
    return;
  }

  if (state.isTransitioning || now < state.cooldownUntil) {
    return;
  }

  state.isTransitioning = true;
  setHeroNavigationEnabled(slideshow, false);

  const currentIndex = Number(slideshow.dataset.heroIndex ?? '0');
  const nextIndex = (currentIndex + direction + slides.length) % slides.length;
  const nextSlide = slides[nextIndex];

  slideshow.dataset.heroIndex = String(nextIndex);
  crossfadeHeroImage(slideshow, nextSlide);
}

function openImageLightbox(image: GalleryImage) {
  // Creates a temporary fullscreen lightbox for the selected portfolio image.
  // The lightbox is removed from the DOM on close so it cannot interfere with the
  // gallery overlay or future route renders.
  const existingLightbox = document.querySelector('.image-lightbox');

  if (existingLightbox) {
    existingLightbox.remove();
  }

  const largerImage = image.fullSrc ?? image.src;
  const lightbox = document.createElement('div');

  lightbox.className = 'image-lightbox';
  lightbox.innerHTML = `
    <div class="image-lightbox-inner" role="dialog" aria-modal="true" aria-label="Expanded image view">
      <button class="image-lightbox-close" type="button" data-lightbox-close>Close</button>

      <figure>
        <img src="${largerImage}" alt="${image.alt}" />
        <figcaption>
          <span>${getCategoryLabel(image.category)} / ${image.year}</span>
          <strong>${image.title}</strong>
          <span>${image.location}</span>
        </figcaption>
      </figure>
    </div>
  `;

  document.body.appendChild(lightbox);
  document.body.classList.add('image-lightbox-is-open');

  const closeButton = lightbox.querySelector<HTMLButtonElement>('[data-lightbox-close]');

  function closeLightbox() {
    document.removeEventListener('keydown', handleKeyDown);
    document.body.classList.remove('image-lightbox-is-open');
    lightbox.remove();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      closeLightbox();
    }
  }

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  closeButton?.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', handleKeyDown);

  closeButton?.focus();
}

function setupHeroSlideshows() {
  // Connects the next/previous controls to every hero slideshow on the page. The
  // bound flag protects against duplicate listeners if setup is accidentally run
  // more than once on the same DOM.
  const heroSlideshows = document.querySelectorAll<HTMLElement>('[data-hero-slideshow]');

  heroSlideshows.forEach((slideshow) => {
    if (slideshow.dataset.heroControllerBound === 'true') {
      return;
    }

    slideshow.dataset.heroControllerBound = 'true';
    slideshow.dataset.heroTransitioning = 'false';

    const initialSlide = getCurrentHeroSlide(slideshow);

    if (initialSlide) {
      updateHeroLink(slideshow, initialSlide);
    }

    slideshow.querySelector<HTMLButtonElement>('[data-hero-prev]')?.addEventListener('click', () => {
      requestHeroSlideMove(slideshow, -1);
    });

    slideshow.querySelector<HTMLButtonElement>('[data-hero-next]')?.addEventListener('click', () => {
      requestHeroSlideMove(slideshow, 1);
    });

    slideshow.addEventListener('mouseenter', () => {
      // There is no autoplay in the current hero, but keeping hover as an input
      // boundary prevents future timers from advancing while the user is engaged
      // with the carousel.
      slideshow.dataset.heroPointerInside = 'true';
    });

    slideshow.addEventListener('mouseleave', () => {
      slideshow.dataset.heroPointerInside = 'false';
    });
  });
}

function setupPortfolioFilters() {
  // Category buttons use hash routes. The router will re-render the portfolio
  // grid with the selected category.
  const filterButtons = document.querySelectorAll<HTMLButtonElement>('[data-carousel-filter]');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedCategory = button.dataset.carouselFilter ?? 'all';

      window.location.hash = selectedCategory === 'all'
        ? '#/portfolio'
        : `#/portfolio/${selectedCategory}`;
    });
  });
}

function setupPortfolioLightbox() {
  // Attaches click handlers to portfolio grid images so each one can open in the
  // fullscreen lightbox.
  const imageButtons = document.querySelectorAll<HTMLButtonElement>('[data-lightbox-image-id]');

  imageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const imageId = button.dataset.lightboxImageId;
      const image = imageId ? getImageById(imageId) : null;

      if (image) {
        openImageLightbox(image);
      }
    });
  });
}

function shouldIgnoreKeyboardEvent(event: KeyboardEvent) {
  // Text inputs, open overlays, and modal states should own keyboard input. The
  // hero carousel only handles left/right arrows when the page itself is idle.
  const target = event.target as HTMLElement | null;
  const tagName = target?.tagName.toLowerCase();

  if (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target?.isContentEditable
  ) {
    return true;
  }

  if (
    document.body.classList.contains('gallery-is-open') ||
    document.body.classList.contains('image-lightbox-is-open') ||
    document.body.classList.contains('gallery-fallback-is-open')
  ) {
    return true;
  }

  return false;
}

function setupKeyboardNavigation() {
  // One global keyboard listener supports the hero slideshow after each page
  // render. Repeated keydown events from holding an arrow key are ignored so a
  // single hold does not rush through multiple slides.
  if (keyboardNavigationBound) {
    return;
  }

  keyboardNavigationBound = true;

  document.addEventListener('keydown', (event) => {
    if (event.repeat || shouldIgnoreKeyboardEvent(event)) {
      return;
    }

    if (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') {
      return;
    }

    const heroSlideshow = document.querySelector<HTMLElement>('[data-hero-slideshow]');

    if (!heroSlideshow) {
      return;
    }

    const direction = event.code === 'ArrowLeft' ? -1 : 1;

    event.preventDefault();
    requestHeroSlideMove(heroSlideshow, direction);
  });
}

export function setupSiteInteractions() {
  // Called after every route render. Page-specific listeners are bound to the new
  // DOM, while global listeners protect themselves from duplicate registration.
  setupHeroSlideshows();
  setupPortfolioFilters();
  setupPortfolioLightbox();
  setupKeyboardNavigation();
}
