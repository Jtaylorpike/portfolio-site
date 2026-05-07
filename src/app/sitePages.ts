// Page renderer for the public, traditional portfolio website.
//
// The site is rendered as static HTML strings because it uses hash routing on a
// static host. Each exported function returns the full markup for one route. The
// router inserts that markup into the document, then the interaction controller
// attaches click, keyboard, carousel, and lightbox behavior.

import { galleryImages, type GalleryImage } from '../data/images';
import { heroSlides } from '../data/heroSlides';
import { getCategoryLabel, portfolioCategories } from '../data/categories';
import {
  getHeroFitMode,
  getHeroFrameInlineStyle,
  getHeroImageInlineStyle,
  getHeroLayerClassName,
  getResolvedHeroFrameStyle
} from './heroFraming';

type PageName = 'home' | 'portfolio' | 'about';
type PortfolioCategoryFilter = string;

type ResolvedHeroSlide = {
  imageId: string;
  targetCategory: string;
  image: GalleryImage;
};

// Looks up a portfolio image by the ID stored in JSON.
function getImageById(imageId: string): GalleryImage | undefined {
  return galleryImages.find((image) => image.id === imageId);
}

// Combines hero slide records with their full image records.
function getResolvedHeroSlides(): ResolvedHeroSlide[] {
  // heroSlides.json stores image IDs instead of full image objects. This resolves
  // those IDs so the hero can read each image's source, category, crop, and fit data.
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

// Chooses the initial hero slide and falls back to the first image if needed.
function getFirstHeroSlide(): ResolvedHeroSlide {
  const firstSlide = getResolvedHeroSlides()[0];

  if (firstSlide) {
    return firstSlide;
  }

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

// Filters portfolio images for the selected category route.
function getImagesForCategory(category: PortfolioCategoryFilter): GalleryImage[] {
  if (category === 'all') {
    return galleryImages;
  }

  return galleryImages.filter((image) => image.category === category);
}

// Builds the shared top navigation shown on every traditional website page.
function renderTopNav(activePage: PageName): string {
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

// Builds one hero slide using the stable layer, frame, and image structure.
function renderHeroImageLayer(image: GalleryImage, extraClassName = ''): string {
  // A hero slide is a layer containing a frame containing an image. The layer
  // covers the whole 16:9 hero stage. The frame controls the crop shape in cover
  // mode. The image controls whether it crops or fits entirely.
  return `
    <div
      class="${getHeroLayerClassName(image, extraClassName)}"
      data-hero-layer
      data-hero-frame-style="${getResolvedHeroFrameStyle(image)}"
      data-hero-fit-mode="${getHeroFitMode(image)}"
    >
      <div
        class="home-hero-image-frame"
        data-hero-image-frame
        style="${getHeroFrameInlineStyle(image)}"
      >
        <img
          class="home-hero-image"
          data-hero-image
          data-hero-layer-image
          src="${image.src}"
          alt="${image.alt}"
          style="${getHeroImageInlineStyle(image)}"
        />
      </div>
    </div>
  `;
}

// Builds the home-page hero carousel shell and click targets.
function renderHomeHeroSlideshow(): string {
  const firstSlide = getFirstHeroSlide();
  const categoryLabel = getCategoryLabel(firstSlide.targetCategory);

  return `
    <section
      class="home-hero-slideshow"
      data-hero-slideshow
      data-hero-index="0"
      aria-label="Featured portfolio image"
    >
      <div class="home-hero-image-shell" data-hero-image-shell>
        ${renderHeroImageLayer(firstSlide.image)}

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

// Builds the masonry-style portfolio grid for the selected category.
function renderPortfolioGrid(initialCategory: PortfolioCategoryFilter = 'all'): string {
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

// Builds the portfolio category filter buttons.
function renderCategoryButtons(initialCategory: PortfolioCategoryFilter): string {
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

// Builds the first landing screen that lets visitors choose website or virtual gallery.
export function renderEntryPage(): string {
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

// Builds the traditional website home page.
export function renderHomePage(): string {
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

// Builds the portfolio page with sidebar filters and image grid.
export function renderPortfolioPage(initialCategory: PortfolioCategoryFilter = 'all'): string {
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

// Builds the about/contact page.
export function renderAboutPage(): string {
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
