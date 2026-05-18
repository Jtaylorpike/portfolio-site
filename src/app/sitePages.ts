// Page renderer for the public, traditional portfolio website.
//
// The site is rendered as static HTML strings because it uses hash routing on a
// static host. Each exported function returns the full markup for one route. The
// router inserts that markup into the document, then the interaction controller
// attaches click, keyboard, carousel, and lightbox behavior.

import { galleryImages, type GalleryImage } from '../data/images';
import { aboutPhotos, type AboutPhoto } from '../data/aboutPhotos';
import { aboutCopy, type AboutCopyContactLink } from '../data/aboutCopy';
import { heroSlides } from '../data/heroSlides';
import { getCategoryLabel, portfolioCategories } from '../data/categories';
import {
  getHeroFitMode,
  getHeroFrameInlineStyle,
  getHeroImageHeight,
  getHeroImageInlineStyle,
  getHeroImageWidth,
  getHeroLayerClassName,
  getHeroMobileSource,
  getHeroShellInlineStyle,
  getResolvedHeroFrameStyle
} from './heroFraming';

type PageName = 'home' | 'portfolio' | 'about';
type PortfolioCategoryFilter = string;

type ResolvedHeroSlide = {
  imageId: string;
  targetCategory: string;
  image: GalleryImage;
};


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
  const homeCurrent = activePage === 'home' ? ' aria-current="page"' : '';
  const portfolioCurrent = activePage === 'portfolio' ? ' aria-current="page"' : '';
  const aboutCurrent = activePage === 'about' ? ' aria-current="page"' : '';

  return `
    <a class="skip-to-content" href="#main-content">Skip to content</a>

    <header class="modern-header">
      <a class="modern-brand" href="#/home" aria-label="Taylor Pike home">
        <span class="modern-brand-name">Taylor Pike</span>
        <span class="modern-brand-field">Photographer + Creative</span>
      </a>

      <nav class="modern-nav" aria-label="Main navigation">
        <a class="${activePage === 'home' ? 'is-active' : ''}" href="#/home"${homeCurrent}>Home</a>
        <a class="${activePage === 'portfolio' ? 'is-active' : ''}" href="#/portfolio"${portfolioCurrent}>Portfolio</a>
        <button class="modern-nav-gallery-button" type="button" data-open-virtual-gallery aria-label="Open virtual gallery">Gallery</button>
        <a class="${activePage === 'about' ? 'is-active' : ''}" href="#/about"${aboutCurrent}>About</a>
      </nav>
    </header>
  `;
}

// Builds one hero slide using the stable layer, frame, and image structure.
function renderHeroImageLayer(image: GalleryImage, extraClassName = '', isPriorityImage = false): string {
  // A hero slide is a layer containing a frame containing an image. The layer
  // covers the whole 16:9 hero stage. The frame controls the crop shape in cover
  // mode. The image controls whether it crops or fits entirely.
  const mobileSource = getHeroMobileSource(image);
  const mobileSourceMarkup = mobileSource
    ? `<source data-hero-mobile-source media="(max-width: 700px)" srcset="${escapeHtml(mobileSource)}" />`
    : '<source data-hero-mobile-source media="(max-width: 700px)" />';
  const imageWidth = getHeroImageWidth(image);
  const imageHeight = getHeroImageHeight(image);
  const widthAttribute = imageWidth ? ` width="${imageWidth}"` : '';
  const heightAttribute = imageHeight ? ` height="${imageHeight}"` : '';
  const loadingAttribute = isPriorityImage ? 'eager' : 'lazy';
  const fetchPriorityAttribute = isPriorityImage ? 'high' : 'auto';

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
        <picture class="home-hero-picture" data-hero-picture>
          ${mobileSourceMarkup}
          <img
            class="home-hero-image"
            data-hero-image
            data-hero-layer-image
            src="${escapeHtml(image.src)}"
            alt="${escapeHtml(image.alt)}"
            loading="${loadingAttribute}"
            fetchpriority="${fetchPriorityAttribute}"
            decoding="async"${widthAttribute}${heightAttribute}
            style="${getHeroImageInlineStyle(image)}"
          />
        </picture>
      </div>
    </div>
  `;
}

function renderHeroSlideIndex(slides: ResolvedHeroSlide[]): string {
  return slides
    .map((slide, index) => {
      const categoryLabel = getCategoryLabel(slide.targetCategory);
      const activeClass = index === 0 ? ' is-active' : '';
      const ariaCurrent = index === 0 ? ' aria-current="true"' : '';

      return `
        <button
          class="hero-index-button${activeClass}"
          type="button"
          data-hero-jump="${index}"
          ${ariaCurrent}
          aria-label="Show hero image ${formatTwoDigitNumber(index)}: ${escapeHtml(slide.image.title)}"
        >
          <span class="hero-index-number">${formatTwoDigitNumber(index)}</span>
          <span class="hero-index-label">${escapeHtml(categoryLabel)}</span>
        </button>
      `;
    })
    .join('');
}

function renderHeroThumbnailStrip(slides: ResolvedHeroSlide[]): string {
  return slides
    .map((slide, index) => {
      const activeClass = index === 0 ? ' is-active' : '';
      const ariaCurrent = index === 0 ? ' aria-current="true"' : '';
      const imageSource = slide.image.thumbSrc ?? slide.image.src;

      return `
        <button
          class="hero-thumbnail-button${activeClass}"
          type="button"
          data-hero-jump="${index}"
          ${ariaCurrent}
          aria-label="Show thumbnail ${formatTwoDigitNumber(index)}: ${escapeHtml(slide.image.title)}"
        >
          <img src="${escapeHtml(imageSource)}" alt="" loading="lazy" decoding="async" />
          <span>${formatTwoDigitNumber(index)}</span>
        </button>
      `;
    })
    .join('');
}

function renderHeroMetadata(slide: ResolvedHeroSlide, index: number, totalSlides: number): string {
  const categoryLabel = getCategoryLabel(slide.targetCategory);
  const location = slide.image.location || 'Selected work';
  const hasYear = Boolean(slide.image.year);
  const yearLabel = hasYear ? 'Year' : 'Status';
  const yearValue = slide.image.year || 'Archive';

  return `
    <dl class="home-hero-meta" aria-label="Current hero image details">
      <div>
        <dt>Series</dt>
        <dd data-hero-meta-category>${escapeHtml(categoryLabel)}</dd>
      </div>
      <div>
        <dt>Location</dt>
        <dd data-hero-meta-location>${escapeHtml(location)}</dd>
      </div>
      <div>
        <dt data-hero-meta-year-label>${yearLabel}</dt>
        <dd data-hero-meta-year>${escapeHtml(yearValue)}</dd>
      </div>
      <div>
        <dt>Image</dt>
        <dd data-hero-meta-image>${formatTwoDigitNumber(index)} / ${String(totalSlides).padStart(2, '0')}</dd>
      </div>
    </dl>
  `;
}

// Builds the home-page hero carousel shell and click targets.
function renderHomeHeroSlideshow(): string {
  const slides = getResolvedHeroSlides();
  const firstSlide = slides[0] ?? getFirstHeroSlide();
  const totalSlides = slides.length || 1;
  const categoryLabel = getCategoryLabel(firstSlide.targetCategory);

  return `
    <section
      class="home-hero-slideshow home-hero-editorial"
      data-hero-slideshow
      data-hero-index="0"
      aria-label="Featured portfolio image"
    >
      <div class="home-hero-grid-mark home-hero-grid-mark-top-left" aria-hidden="true"></div>
      <div class="home-hero-grid-mark home-hero-grid-mark-top-right" aria-hidden="true"></div>
      <div class="home-hero-grid-mark home-hero-grid-mark-bottom-right" aria-hidden="true"></div>

      <aside class="home-hero-index-rail" data-hero-wheel-zone aria-label="Hero image index">
        <p class="home-hero-rail-label">Visual Index</p>
        <div class="home-hero-index-list">
          ${renderHeroSlideIndex(slides.length ? slides : [firstSlide])}
        </div>
        <p class="home-hero-scroll-hint"><span></span>Scroll wheel or use<br />arrow keys</p>
      </aside>

      <div class="home-hero-stage">
        <div class="home-hero-image-shell" data-hero-image-shell data-hero-wheel-zone style="${getHeroShellInlineStyle(firstSlide.image)}">
          ${renderHeroImageLayer(firstSlide.image, '', true)}

          <button
            class="home-hero-click-zone home-hero-click-zone-left"
            type="button"
            data-hero-prev
            aria-label="Previous featured image"
          ></button>

          <button
            class="home-hero-click-zone home-hero-click-zone-right"
            type="button"
            data-hero-next
            aria-label="Next featured image"
          ></button>
        </div>

        <div class="home-hero-copy-panel">
          <p class="home-hero-welcome">Selected Work</p>
          <p class="home-hero-statement">A visual archive of movement, space, and imagination.</p>

          <div class="home-hero-actions">
            <button class="home-hero-gallery-cta" type="button" data-open-virtual-gallery>
              <span class="home-hero-gallery-icon" aria-hidden="true">↗</span>
              <span>Enter Virtual Gallery</span>
            </button>
            <a
              class="home-hero-portfolio-link"
              data-hero-link
              href="#/portfolio/${firstSlide.targetCategory}"
            >
              <span data-hero-link-label>View Portfolio</span>
              <span class="sr-only" data-hero-link-context> — ${escapeHtml(categoryLabel)}</span>
            </a>
          </div>
        </div>
      </div>

      <aside class="home-hero-meta-panel">
        ${renderHeroMetadata(firstSlide, 0, totalSlides)}
      </aside>

      <div class="home-hero-thumbnail-strip" data-hero-wheel-zone aria-label="Hero image thumbnails">
        ${renderHeroThumbnailStrip(slides.length ? slides : [firstSlide])}
      </div>
    </section>
  `;
}

// Builds the masonry-style portfolio grid for the selected category.
function renderPortfolioGrid(initialCategory: PortfolioCategoryFilter = 'all'): string {
  const images = getImagesForCategory(initialCategory);
  const cards = images
    .map((image, index) => {
      const imageNumber = formatTwoDigitNumber(index);
      const imageSource = image.thumbSrc ?? image.src;
      const categoryLabel = getCategoryLabel(image.category);
      const orientationClass = image.imageOrientation
        ? ` portfolio-grid-card--${escapeHtml(image.imageOrientation)}`
        : '';
      const detailParts = [image.location, image.year].filter((value) => Boolean(value?.trim()));
      const detailMarkup = detailParts.length
        ? `<p class="portfolio-grid-card-detail">${detailParts.map(escapeHtml).join(' / ')}</p>`
        : '';

      return `
        <article class="portfolio-grid-card${orientationClass}">
          <button
            class="portfolio-grid-image-button"
            type="button"
            data-lightbox-image-id="${escapeHtml(image.id)}"
            data-lightbox-category="${escapeHtml(initialCategory)}"
            aria-label="Open larger view of ${escapeHtml(image.title)}"
          >
            <img
              src="${escapeHtml(imageSource)}"
              alt="${escapeHtml(image.alt)}"
              loading="lazy"
              decoding="async"
              style="object-position: ${escapeHtml(image.thumbnailPosition ?? '50% 50%')};"
            />
            <span class="portfolio-grid-card-index" aria-hidden="true">${imageNumber}</span>
            <span class="portfolio-grid-card-open" aria-hidden="true">Open</span>
          </button>

          <div class="portfolio-grid-card-meta">
            <p class="eyebrow portfolio-grid-card-category">${escapeHtml(categoryLabel)}</p>
            <h2>${escapeHtml(image.title)}</h2>
            ${detailMarkup}
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
  const categories = [
    { id: 'all', label: 'All Work' },
    ...portfolioCategories
  ];

  return categories
    .map((category, index) => {
      const isActive = initialCategory === category.id;
      const href = category.id === 'all' ? '#/portfolio' : `#/portfolio/${category.id}`;
      const categoryCount = category.id === 'all'
        ? galleryImages.length
        : getImagesForCategory(category.id).length;

      return `
        <button
          class="portfolio-index-button${isActive ? ' is-active' : ''}"
          type="button"
          data-carousel-filter="${category.id}"
          aria-pressed="${isActive}"
          data-portfolio-filter-link="${href}"
        >
          <span class="portfolio-index-number">${String(index).padStart(2, '0')}</span>
          <span class="portfolio-index-label">${escapeHtml(category.label)}</span>
          <span class="portfolio-index-count" aria-label="${String(categoryCount).padStart(2, '0')} images">${String(categoryCount).padStart(2, '0')}</span>
        </button>
      `;
    })
    .join('');
}



// Builds the first landing screen that lets visitors choose website or virtual gallery.
export function renderEntryPage(): string {
  return `
    <main id="main-content" class="entry-page modern-entry-page" data-page="entry" tabindex="-1">
      <div class="modern-entry-card">
        <a class="modern-entry-brand" href="#/home" aria-label="Taylor Pike home">
          <span>Taylor Pike</span>
          <span>Photographer + Creative</span>
        </a>

        <div>
          <p class="eyebrow">Creative Portfolio</p>
          <h1>A visual archive for photography, climbing, landscape, and experimental web spaces.</h1>
          <p>
            Enter the traditional portfolio or move through the work in the desktop virtual gallery.
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

      <main id="main-content" class="modern-main modern-home-page" tabindex="-1">
        <section class="modern-home-hero">
          ${renderHomeHeroSlideshow()}
        </section>
      </main>
    </div>
  `;
}

// Builds the portfolio page with sidebar filters and image grid.
export function renderPortfolioPage(initialCategory: PortfolioCategoryFilter = 'all'): string {
  const activeCategoryLabel = initialCategory === 'all' ? 'Selected Work' : getCategoryLabel(initialCategory);
  const activeImages = getImagesForCategory(initialCategory);
  const visibleImageCount = activeImages.length;
  const totalImageCount = galleryImages.length;

  return `
    <div class="modern-site" data-page="portfolio">
      ${renderTopNav('portfolio')}

      <main id="main-content" class="modern-main modern-portfolio-page" tabindex="-1">
        <aside class="portfolio-category-sidebar" aria-label="Portfolio categories">
          <p class="eyebrow">Portfolio</p>
          ${renderCategoryButtons(initialCategory)}
        </aside>

        <div class="portfolio-grid-main">
          <header class="portfolio-page-heading">
            <p class="eyebrow">${activeCategoryLabel}</p>
            <h1>A visual index of climbing, landscape, personal work, and experimental image studies.</h1>
            <div class="portfolio-page-meta-strip" aria-label="Portfolio archive details">
              <span>${String(visibleImageCount).padStart(2, '0')} shown</span>
              <span>${String(totalImageCount).padStart(2, '0')} total</span>
              <span>${String(portfolioCategories.length).padStart(2, '0')} categories</span>
            </div>
          </header>

          ${renderPortfolioGrid(initialCategory)}
        </div>
      </main>
    </div>
  `;
}


function getAboutPhotoImageSource(photo: AboutPhoto): string {
  return photo.thumbSrc ?? photo.src;
}

function getAboutPhotoFullSource(photo: AboutPhoto): string {
  return photo.fullSrc ?? photo.src;
}

function getAboutPhotoAlt(photo: AboutPhoto): string {
  return photo.alt?.trim() || photo.title?.trim() || 'About page image';
}

function getAboutPhotoMeta(photo: AboutPhoto): string {
  return photo.location?.trim() || photo.year?.trim() || 'About image';
}

function getSafeEmailAddress(email: string): string {
  return email.trim().replace(/[<>\s"']/g, '');
}

function getSafeExternalHref(url: string): string {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return '';
  }

  if (/^(https?:|mailto:|tel:)/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}([/?#].*)?$/i.test(trimmedUrl)) {
    return `https://${trimmedUrl}`;
  }

  return '';
}

function getAboutPlacementPhotoSet(placementRole: NonNullable<AboutPhoto['placementRole']>): AboutPhoto[] {
  return aboutPhotos.filter((photo) => photo.isActive !== false && photo.placementRole === placementRole);
}

function getFallbackAboutPhotos(excludedIds: Set<string>, limit: number): AboutPhoto[] {
  return aboutPhotos.filter((photo) => photo.isActive !== false && !excludedIds.has(photo.id)).slice(0, limit);
}

function renderAboutFigure(photo: AboutPhoto, index: number, className: string, motionSpeed = 0): string {
  const imageSource = getAboutPhotoImageSource(photo);
  const motionAttribute = motionSpeed ? ` data-about-float data-about-float-speed="${motionSpeed}"` : '';

  return `
    <figure class="${className}"${motionAttribute}>
      <img
        src="${escapeHtml(imageSource)}"
        alt="${escapeHtml(getAboutPhotoAlt(photo))}"
        loading="${index === 0 ? 'eager' : 'lazy'}"
        decoding="async"
      />
      <figcaption>
        <span>${formatTwoDigitNumber(index)}</span>
        <strong>${escapeHtml(photo.title)}</strong>
        <small>${escapeHtml(getAboutPhotoMeta(photo))}</small>
      </figcaption>
    </figure>
  `;
}


function renderAboutParagraphs(paragraphs: string[]): string {
  return paragraphs
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');
}

function renderAboutContactLinks(links: AboutCopyContactLink[]): string {
  const safeLinks = links
    .map((link) => ({
      label: link.label.trim(),
      href: getSafeExternalHref(link.url)
    }))
    .filter((link) => link.label && link.href);

  if (!safeLinks.length) {
    return '';
  }

  return `
    <div class="about-contact-links" aria-label="Additional contact links">
      ${safeLinks.map((link) => `
        <a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(link.label)} in a new tab">${escapeHtml(link.label)}</a>
      `).join('')}
    </div>
  `;
}

function renderAboutHeroPhotoCluster(): string {
  const upperPhotos = getAboutPlacementPhotoSet('upper-collage');
  const selectedPhotos = upperPhotos.length >= 2 ? upperPhotos.slice(0, 2) : getFallbackAboutPhotos(new Set(), 2);

  if (!selectedPhotos.length) {
    return `
      <div class="about-photo-cluster is-empty" aria-label="About page photo placeholders">
        <div class="about-photo-frame about-photo-placeholder">
          <span>Upper collage placeholders</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="about-photo-cluster about-upper-collage" aria-label="About page upper image collage">
      ${selectedPhotos.slice(0, 2).map((photo: AboutPhoto, index: number) => (
        renderAboutFigure(photo, index, `about-photo-frame about-photo-frame-${index + 1}`, 0.014 + index * 0.008)
      )).join('')}
    </div>
  `;
}

function renderAboutSecondaryPhotoStack(): string {
  const upperIds = new Set(getAboutPlacementPhotoSet('upper-collage').slice(0, 2).map((photo) => photo.id));
  const lowerPhotos = getAboutPlacementPhotoSet('lower-collage');
  const selectedPhotos = lowerPhotos.length ? lowerPhotos : getFallbackAboutPhotos(upperIds, 5);

  if (!selectedPhotos.length) {
    return `
      <div class="about-secondary-photo-stack is-empty" aria-label="About page secondary photo placeholder">
        <div class="about-photo-frame about-photo-placeholder"><span>Lower collage images</span></div>
      </div>
    `;
  }

  return `
    <div class="about-secondary-photo-stack about-lower-collage" aria-label="About page lower image collage">
      ${selectedPhotos.slice(0, 6).map((photo: AboutPhoto, index: number) => (
        renderAboutFigure(photo, index + 2, `about-photo-frame about-lower-photo about-lower-photo-${index + 1}`, 0.012 + index * 0.006)
      )).join('')}
    </div>
  `;
}

function renderAboutFloatingPhotos(): string {
  const usedForegroundIds = new Set([
    ...getAboutPlacementPhotoSet('upper-collage').slice(0, 2).map((photo) => photo.id),
    ...getAboutPlacementPhotoSet('lower-collage').slice(0, 6).map((photo) => photo.id)
  ]);
  const backgroundPhotos = getAboutPlacementPhotoSet('background-float');
  const floatingPhotos = backgroundPhotos.length ? backgroundPhotos : getFallbackAboutPhotos(usedForegroundIds, 7);

  if (!floatingPhotos.length) {
    return '';
  }

  return `
    <div class="about-floating-photos" aria-hidden="true">
      ${floatingPhotos.slice(0, 8).map((photo: AboutPhoto, index: number) => {
        // Keep the background atmosphere nearly static. Earlier Phase 5 passes
        // used more visible scroll-linked drifting; this keeps only a slow,
        // shallow parallax shift so the photos feel embedded in the page.
        const ySpeed = 0.004 + index * 0.0012;
        const xSpeed = index % 2 === 0 ? 0.0012 + index * 0.00035 : -0.0012 - index * 0.00035;
        return `
          <div
            class="about-floating-photo about-floating-photo-${index + 1}"
            data-about-float
            data-about-float-speed="${ySpeed.toFixed(3)}"
            data-about-float-x-speed="${xSpeed.toFixed(3)}"
          >
            <img src="${escapeHtml(getAboutPhotoImageSource(photo))}" alt="" loading="lazy" decoding="async" />
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Builds the about/contact page.
export function renderAboutPage(): string {
  const safeContactEmail = getSafeEmailAddress(aboutCopy.contact.email);
  const contactEmailHref = safeContactEmail ? `mailto:${encodeURI(safeContactEmail)}` : '';
  const contactEmailLink = safeContactEmail
    ? `<a class="about-contact-email" href="${escapeHtml(contactEmailHref)}" aria-label="Email Taylor Pike at ${escapeHtml(safeContactEmail)}">${escapeHtml(safeContactEmail)}</a>`
    : '';

  return `
    <div class="modern-site" data-page="about">
      ${renderTopNav('about')}
      ${renderAboutFloatingPhotos()}

      <main id="main-content" class="modern-main modern-about-page about-vertical-page" tabindex="-1">
        <section class="about-vertical-hero" aria-labelledby="about-page-title">
          <article class="about-copy-block about-copy-block-primary" data-about-float data-about-float-speed="-0.012">
            <p class="eyebrow">${escapeHtml(aboutCopy.hero.eyebrow)}</p>
            <h1 id="about-page-title">${escapeHtml(aboutCopy.hero.headline)}</h1>
            <p class="about-page-kicker">${escapeHtml(aboutCopy.hero.intro)}</p>
          </article>

          ${renderAboutHeroPhotoCluster()}
        </section>

        <section class="about-wide-copy-block" aria-labelledby="about-main-copy-title">
          <div>
            <p class="eyebrow">${escapeHtml(aboutCopy.about.eyebrow)}</p>
            <h2 id="about-main-copy-title">${escapeHtml(aboutCopy.about.heading)}</h2>
          </div>
          <div class="about-wide-copy-columns">
            ${renderAboutParagraphs(aboutCopy.about.paragraphs)}
          </div>
        </section>

        <section class="about-split-section" aria-labelledby="about-project-title">
          ${renderAboutSecondaryPhotoStack()}

          <article class="about-copy-block about-copy-block-secondary" data-about-float data-about-float-speed="-0.008">
            <p class="eyebrow">${escapeHtml(aboutCopy.project.eyebrow)}</p>
            <h2 id="about-project-title">${escapeHtml(aboutCopy.project.heading)}</h2>
            ${renderAboutParagraphs(aboutCopy.project.paragraphs)}
          </article>
        </section>

        <section class="about-contact-section" aria-labelledby="about-contact-title">
          <div>
            <p class="eyebrow">${escapeHtml(aboutCopy.contact.eyebrow)}</p>
            <h2 id="about-contact-title">${escapeHtml(aboutCopy.contact.headline)}</h2>
          </div>

          <div class="about-contact-card">
            <p>${escapeHtml(aboutCopy.contact.body)}</p>
            ${contactEmailLink}
            ${renderAboutContactLinks(aboutCopy.contact.links)}
          </div>
        </section>
      </main>
    </div>
  `;
}
