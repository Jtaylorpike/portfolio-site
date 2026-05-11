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

const HERO_CROSSFADE_MS = 650;
const HERO_INPUT_COOLDOWN_MS = 180;

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

      return {
        ...slide,
        image
      };
    })
    .filter((slide): slide is ResolvedHeroSlide => slide !== null);
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
  slideshow.querySelectorAll<HTMLButtonElement>('[data-hero-prev], [data-hero-next]').forEach((button) => {
    button.disabled = !isEnabled;
  });

  slideshow.dataset.heroTransitioning = isEnabled ? 'false' : 'true';
}

// Creates the incoming slide layer used during crossfade.
function createTransitionLayer(image: GalleryImage): { layerElement: HTMLElement; imageElement: HTMLImageElement } {
  // The temporary layer uses the same DOM structure and inline styles as the
  // permanent layer. That keeps crossfades visually identical to the final slide.
  const layerElement = document.createElement('div');
  const frameElement = document.createElement('div');
  const imageElement = document.createElement('img');

  layerElement.className = getHeroLayerClassName(image, 'home-hero-transition-layer');
  layerElement.dataset.heroFrameStyle = getResolvedHeroFrameStyle(image);
  layerElement.dataset.heroFitMode = getHeroFitMode(image);

  frameElement.className = 'home-hero-image-frame';
  frameElement.dataset.heroImageFrame = 'true';
  frameElement.setAttribute('style', getHeroFrameInlineStyle(image));

  imageElement.className = 'home-hero-image';
  imageElement.dataset.heroLayerImage = 'true';
  imageElement.decoding = 'async';
  imageElement.src = image.src;
  imageElement.alt = '';
  imageElement.setAttribute('style', getHeroImageInlineStyle(image));

  frameElement.appendChild(imageElement);
  layerElement.appendChild(frameElement);

  return { layerElement, imageElement };
}

// Updates the center hero link so it routes to the active slide category.
function updateHeroLink(slideshow: HTMLElement, slide: ResolvedHeroSlide): void {
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

// Promotes the incoming slide to the permanent base slide after fade-in.
function finishHeroTransition(slideshow: HTMLElement, baseLayer: HTMLElement, transitionLayer: HTMLElement, slide: ResolvedHeroSlide): void {
  const state = getHeroTransitionState(slideshow);

  applyHeroFramingToLayer(baseLayer, slide.image);
  applyHeroShellSizingToSlideshow(slideshow, slide.image);
  transitionLayer.remove();

  state.activeTransitionLayer = null;
  state.cleanupTimer = null;
  state.isTransitioning = false;
  state.cooldownUntil = Date.now() + HERO_INPUT_COOLDOWN_MS;

  setHeroNavigationEnabled(slideshow, true);
}

// Runs the visual transition from the current hero slide to the requested slide.
function crossfadeHeroImage(slideshow: HTMLElement, slide: ResolvedHeroSlide): void {
  const imageShell = slideshow.querySelector<HTMLElement>('[data-hero-image-shell]');
  const baseLayer = slideshow.querySelector<HTMLElement>('[data-hero-layer]');
  const state = getHeroTransitionState(slideshow);

  if (!imageShell || !baseLayer) {
    state.isTransitioning = false;
    state.cooldownUntil = Date.now() + HERO_INPUT_COOLDOWN_MS;
    setHeroNavigationEnabled(slideshow, true);
    return;
  }

  clearActiveHeroTransition(slideshow);

  applyHeroShellSizingToSlideshow(slideshow, slide.image);

  const { layerElement, imageElement } = createTransitionLayer(slide.image);

  state.activeTransitionLayer = layerElement;
  imageShell.appendChild(layerElement);
  updateHeroLink(slideshow, slide);

  const completeTransition = () => finishHeroTransition(slideshow, baseLayer, layerElement, slide);

  const startTransition = () => {
    window.requestAnimationFrame(() => {
      layerElement.classList.add('is-visible');
    });

    state.cleanupTimer = window.setTimeout(completeTransition, HERO_CROSSFADE_MS + 80);
  };

  if (imageElement.complete && imageElement.naturalWidth > 0) {
    startTransition();
    return;
  }

  imageElement.addEventListener('load', startTransition, { once: true });
  imageElement.addEventListener('error', completeTransition, { once: true });
}

// Moves the carousel one slide while protecting against double-triggered inputs.
function requestHeroSlideMove(slideshow: HTMLElement, direction: number): void {
  // A strict input guard prevents a single key press or double-click from being
  // interpreted as multiple slide advances.
  const slides = getResolvedHeroSlides();
  const state = getHeroTransitionState(slideshow);
  const now = Date.now();

  if (slides.length <= 1 || state.isTransitioning || now < state.cooldownUntil) {
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

// Opens a fullscreen view of a portfolio image.
function openImageLightbox(image: GalleryImage): void {
  const existingLightbox = document.querySelector('.image-lightbox');

  if (existingLightbox) {
    existingLightbox.remove();
  }

  const largerImage = image.fullSrc ?? image.src;
  const lightbox = document.createElement('div');

  lightbox.className = 'image-lightbox';
  lightbox.innerHTML = `
    <div class="image-lightbox-inner" role="dialog" aria-modal="true" aria-label="Expanded image view">
      <button class="image-lightbox-close" type="button" data-lightbox-close aria-label="Close expanded image">Close</button>

      <figure>
        <img src="${largerImage}" alt="${image.alt}" />
        <figcaption>
          <span>${getCategoryLabel(image.category)}${image.year ? ` / ${image.year}` : ''}</span>
          <strong>${image.title}</strong>
          ${image.location ? `<span>${image.location}</span>` : ''}
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

// Connects mouse controls to every hero slideshow on the page.
function setupHeroSlideshows(): void {
  document.querySelectorAll<HTMLElement>('[data-hero-slideshow]').forEach((slideshow) => {
    if (slideshow.dataset.heroControllerBound === 'true') {
      return;
    }

    slideshow.dataset.heroControllerBound = 'true';
    slideshow.dataset.heroTransitioning = 'false';

    const initialSlide = getCurrentHeroSlide(slideshow);
    const baseLayer = slideshow.querySelector<HTMLElement>('[data-hero-layer]');

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

      if (image) {
        openImageLightbox(image);
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
