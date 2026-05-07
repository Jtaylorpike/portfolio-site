// Builds the HTML strings for the public, traditional version of the portfolio site.
//
// This project uses hash-based routes, such as #/home and #/portfolio, so the site
// can be hosted as static files without a server-side router. Each exported render
// function returns the full markup for one page. The router replaces the page HTML
// and then the interaction controller attaches click, keyboard, and lightbox behavior.

import { galleryImages, type GalleryImage } from '../data/images';
import { heroSlides } from '../data/heroSlides';
import { getCategoryLabel, portfolioCategories } from '../data/categories';

// The public site currently has three traditional pages. The editor and virtual
// gallery are opened through separate controllers and are not part of this union.
type PageName = 'home' | 'portfolio' | 'about';

// Portfolio category filters are string IDs from categories.json, plus the special
// "all" filter used by the portfolio grid.
type PortfolioCategoryFilter = string;

// Hero framing values are saved per image by the local editor. "auto" means the
// public site should infer the best frame treatment from the image dimensions.
type HeroFrameStyle = 'auto' | 'landscape' | 'portrait' | 'square';
type HeroFitMode = 'cover' | 'contain';
type ResolvedHeroFrameStyle = Exclude<HeroFrameStyle, 'auto'>;

// GalleryImage is intentionally broad because records are loaded from JSON. This
// extension documents the optional fields that the hero renderer needs.
type HeroFrameImage = GalleryImage & {
  heroFrameStyle?: HeroFrameStyle;
  heroFitMode?: HeroFitMode;
  imageWidth?: number | string;
  imageHeight?: number | string;
  imageAspectRatio?: number | string;
  imageOrientation?: string;
};

function getImageById(imageId: string) {
  // Central lookup for image records. Keeping this in one place avoids repeating
  // the search logic in the hero, portfolio, and lightbox code.
  return galleryImages.find((image) => image.id === imageId);
}

function getResolvedHeroSlides() {
  // heroSlides.json stores lightweight slide records with image IDs. The public
  // hero needs the complete image record, so this resolves each ID to its image.
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
    .filter((slide): slide is { imageId: string; targetCategory: string; image: GalleryImage } => slide !== null);
}

function getFirstHeroSlide() {
  // The home page must always have an image. If the curated hero list is empty,
  // the first portfolio image becomes the fallback so the page does not render blank.
  const firstSlide = getResolvedHeroSlides()[0];

  if (!firstSlide) {
    const fallbackImage = galleryImages[0];

    if (!fallbackImage) {
      throw new Error('No gallery images found.');
    }

    return {
      imageId: fallbackImage.id,
      targetCategory: fallbackImage.category,
      image: fallbackImage
    };
  }

  return firstSlide;
}

function getImageAspect(image: GalleryImage) {
  // Prefer the saved aspect ratio because it is calculated from the original file.
  // Width/height are used as a fallback for older image records.
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

  // A landscape default keeps legacy records compatible with the original hero.
  return 16 / 9;
}

function getImageOrientation(image: GalleryImage): ResolvedHeroFrameStyle {
  // The editor can store an explicit orientation after reading the image file. Use
  // it when available, otherwise infer orientation from the aspect ratio.
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
  // The editor can override automatic orientation handling for edge cases. Invalid
  // values are treated as auto so malformed JSON cannot break the page layout.
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
  // Convert the saved hero setting into the concrete style used by CSS. The
  // frame style describes the image orientation treatment, while heroFitMode
  // decides whether the image crops to the hero frame or fits entirely inside it.
  const frameStyle = getHeroFrameStyle(image);

  if (frameStyle !== 'auto') {
    return frameStyle;
  }

  return getImageOrientation(image);
}

function getHeroFitMode(image: GalleryImage): HeroFitMode {
  // Cover means the image fills the 16:9 hero and may crop. Contain means the
  // complete image remains visible inside the 16:9 hero. If no explicit setting
  // is saved yet, portrait and square images default to contain, while landscape
  // images keep the original full-bleed cover behavior.
  const fitMode = (image as HeroFrameImage).heroFitMode;

  if (fitMode === 'cover' || fitMode === 'contain') {
    return fitMode;
  }

  return getResolvedHeroFrameStyle(image) === 'landscape' ? 'cover' : 'contain';
}

function getHeroLayerClassName(image: GalleryImage, extraClassName = '') {
  // Each slide is rendered as a full-size layer. The layer, not the image alone,
  // owns the background and transition behavior. This prevents portrait slides
  // from revealing the previous slide in the empty side areas during a fade.
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

function getImagesForCategory(category: PortfolioCategoryFilter) {
  // The portfolio grid can show all images or one category at a time.
  if (category === 'all') {
    return galleryImages;
  }

  return galleryImages.filter((image) => image.category === category);
}

function renderTopNav(activePage: PageName) {
  // Shared public header. The virtual gallery button is handled by the gallery
  // controller. The editor link only appears during local development.
  return `
    <header class="modern-header">
      <a class="modern-logo" href="#/home">
        <img src="/images/logo/logo-black-transparent.png" alt="Taylor Pike Productions" />
      </a>

      <nav class="modern-nav" aria-label="Main navigation">
        <a class="${activePage === 'home' ? 'is-active' : ''}" href="#/home">Home</a>
        <button type="button" data-open-virtual-gallery>Virtual Gallery</button>
        <a class="${activePage === 'portfolio' ? 'is-active' : ''}" href="#/portfolio">Portfolio</a>
        <a class="${activePage === 'about' ? 'is-active' : ''}" href="#/about">About</a>
        ${import.meta.env.DEV ? '<a href="#/editor">Editor</a>' : ''}
      </nav>
    </header>
  `;
}

function renderHomeHeroSlideshow() {
  // The hero image is a layer containing an image, rather than a direct image in
  // the shell. This gives every slide a solid full-frame background, which fixes
  // the issue where portrait slides exposed parts of the outgoing slide during
  // crossfade transitions.
  const firstSlide = getFirstHeroSlide();
  const categoryLabel = getCategoryLabel(firstSlide.targetCategory);
  const resolvedHeroFrameStyle = getResolvedHeroFrameStyle(firstSlide.image);
  const heroFitMode = getHeroFitMode(firstSlide.image);

  return `
    <section
      class="home-hero-slideshow"
      data-hero-slideshow
      data-hero-index="0"
      aria-label="Featured portfolio image"
    >
      <div class="home-hero-image-shell" data-hero-image-shell>
        <div
          class="${getHeroLayerClassName(firstSlide.image)}"
          data-hero-layer
          data-hero-frame-style="${resolvedHeroFrameStyle}"
          data-hero-fit-mode="${heroFitMode}"
        >
          <div class="home-hero-image-frame" data-hero-image-frame>
            <img
              class="home-hero-image"
              data-hero-image
              data-hero-layer-image
              src="${firstSlide.image.src}"
              alt="${firstSlide.image.alt}"
              style="object-position: ${firstSlide.image.heroPosition ?? '50% 50%'};"
            />
          </div>
        </div>

        <button
          class="home-hero-click-zone home-hero-click-zone-left"
          type="button"
          data-hero-prev
          aria-label="Previous featured image"
        ></button>

        <a
          class="home-hero-center-link"
          data-hero-link
          href="#/portfolio/${firstSlide.targetCategory}"
          aria-label="View ${categoryLabel} portfolio"
        >
          <span>View ${categoryLabel}</span>
        </a>

        <button
          class="home-hero-click-zone home-hero-click-zone-right"
          type="button"
          data-hero-next
          aria-label="Next featured image"
        ></button>
      </div>
    </section>
  `;
}

function renderPortfolioGrid(initialCategory: PortfolioCategoryFilter = 'all') {
  // Renders the cascading portfolio grid. Each image opens the fullscreen lightbox
  // by exposing its image ID through a data attribute.
  const images = getImagesForCategory(initialCategory);

  const cards = images
    .map((image) => {
      return `
        <article class="portfolio-grid-card">
          <button
            class="portfolio-grid-image-button"
            type="button"
            data-lightbox-image-id="${image.id}"
            aria-label="Open larger view of ${image.title}"
          >
            <img
              src="${image.thumbSrc ?? image.src}"
              alt="${image.alt}"
              loading="lazy"
              decoding="async"
              style="object-position: ${image.thumbnailPosition ?? '50% 50%'};"
            />
          </button>

          <div class="portfolio-grid-card-meta">
            <p class="eyebrow">${getCategoryLabel(image.category)} / ${image.year}</p>
            <h2>${image.title}</h2>
          </div>
        </article>
      `;
    })
    .join('');

  return `
    <section class="portfolio-grid-section" aria-label="Portfolio images">
      <div class="portfolio-grid">
        ${cards}
      </div>
    </section>
  `;
}

function renderCategoryButtons(initialCategory: PortfolioCategoryFilter) {
  // Portfolio sidebar buttons route to #/portfolio or #/portfolio/<category-id>.
  // The router then re-renders this page using the selected category.
  const categoryButtons = portfolioCategories
    .map((category) => {
      return `
        <button
          class="${initialCategory === category.id ? 'is-active' : ''}"
          type="button"
          data-carousel-filter="${category.id}"
          aria-pressed="${initialCategory === category.id}"
        >
          ${category.label}
        </button>
      `;
    })
    .join('');

  return `
    <button class="${initialCategory === 'all' ? 'is-active' : ''}" type="button" data-carousel-filter="all" aria-pressed="${initialCategory === 'all'}">All</button>
    ${categoryButtons}
  `;
}

export function renderEntryPage() {
  // Initial desktop entry page. Mobile routing skips this in the site router.
  return `
    <main class="entry-page modern-entry-page" data-page="entry">
      <div class="modern-entry-card">
        <img src="/images/logo/logo-black-transparent.png" alt="Taylor Pike Productions" />

        <div>
          <p class="eyebrow">Photography Portfolio</p>
          <h1>Choose how you want to enter the work.</h1>
          <p>
            View the portfolio as a traditional website, or enter the virtual gallery and move through the images in a spatial way.
          </p>
        </div>

        <div class="entry-actions">
          <a class="button primary" href="#/home">Continue to Website</a>
          <button class="button secondary" type="button" data-open-virtual-gallery>Enter Virtual Gallery</button>
        </div>
      </div>
    </main>
  `;
}

export function renderHomePage() {
  // Public home page. The hero markup is rendered here; behavior is attached by
  // setupSiteInteractions after the page enters the DOM.
  return `
    <div class="modern-site" data-page="home">
      ${renderTopNav('home')}

      <main class="modern-main modern-home-page">
        <section class="modern-home-hero">
          ${renderHomeHeroSlideshow()}
        </section>

        <section class="modern-home-copy">
          <p class="eyebrow">About the Site</p>
          <h2>A photography portfolio built as both a traditional website and a virtual gallery.</h2>
          <p>
            This site is meant to show the work clearly while also testing a different way to move through a portfolio. The traditional version keeps everything simple and accessible. The virtual gallery is a desktop-focused space that lets the images exist in a room instead of only on a scrolling page.
          </p>

          <button class="button secondary" type="button" data-open-virtual-gallery>
            Enter Virtual Gallery
          </button>
        </section>
      </main>
    </div>
  `;
}

export function renderPortfolioPage(initialCategory: PortfolioCategoryFilter = 'all') {
  // Portfolio page with category navigation and the masonry-style image grid.
  return `
    <div class="modern-site" data-page="portfolio">
      ${renderTopNav('portfolio')}

      <main class="modern-main modern-portfolio-page">
        <aside class="portfolio-category-sidebar" aria-label="Portfolio categories">
          <p class="eyebrow">Portfolio</p>
          ${renderCategoryButtons(initialCategory)}
        </aside>

        <div class="portfolio-grid-main">
          ${renderPortfolioGrid(initialCategory)}
        </div>
      </main>
    </div>
  `;
}

export function renderAboutPage() {
  // Static about page content for the public site.
  return `
    <div class="modern-site" data-page="about">
      ${renderTopNav('about')}

      <main class="modern-main modern-about-page">
        <section class="modern-about-content">
          <p class="eyebrow">About</p>
          <h1>Photography started for me as a way to pay attention to the places I was already drawn to.</h1>

          <div class="modern-about-copy">
            <p>
              I grew up in the Piedmont forests of North Carolina, and that is probably where my interest in photography really started. I liked being outside and noticing things that other people might walk past. Later, I moved to Boone and my life became much more centered around climbing, the mountains, and the people I met through that community.
            </p>

            <p>
              I studied Commercial Photography at Appalachian State, where I learned the technical side of image making, color, lighting, printing, editing, and how photography fits into real business needs. Since then I have lived in Ashland, Oregon; Wilmington, North Carolina; Asheville, North Carolina; and now Doylestown, Pennsylvania. Each place has changed what I photograph a little bit.
            </p>

            <p>
              This portfolio is also a web project. I wanted to build something that could function as a normal photography website while also giving people the option to move through the work in a virtual gallery. The virtual side is not meant to be a full game. It borrows simple movement and controls from games because that makes the space easier to understand.
            </p>

            <p>
              I am open to commercial work, climbing projects, portraits, product photography, brand work, and other creative projects that make sense.
            </p>

            <a href="mailto:jtaylorpike@gmail.com">jtaylorpike@gmail.com</a>
          </div>
        </section>
      </main>
    </div>
  `;
}
