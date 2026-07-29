// Dev-only image editor page.
//
// This page gives a browser-based view for editing image metadata and hero
// slideshow selections. It exports generated TypeScript that can be copied back
// into src/data/images.ts and src/data/heroSlides.ts.
//
// This does not write files automatically yet.

import { allGalleryImages } from '../../data/images';
import { heroSlides } from '../../data/heroSlides';

function escapeAttribute(value: string) {
  return value.replace(/"/g, '&quot;');
}

function getImageOrientation(image: { imageOrientation?: string; imageAspectRatio?: number; imageWidth?: number; imageHeight?: number }): string {
  if (image.imageOrientation === 'landscape' || image.imageOrientation === 'portrait' || image.imageOrientation === 'square') {
    return image.imageOrientation;
  }

  if (typeof image.imageAspectRatio === 'number' && image.imageAspectRatio > 0) {
    if (Math.abs(image.imageAspectRatio - 1) <= 0.04) {
      return 'square';
    }

    return image.imageAspectRatio > 1 ? 'landscape' : 'portrait';
  }

  if (typeof image.imageWidth === 'number' && typeof image.imageHeight === 'number' && image.imageWidth > 0 && image.imageHeight > 0) {
    return image.imageWidth > image.imageHeight ? 'landscape' : 'portrait';
  }

  return 'landscape';
}

function isHeroEligibleImage(image: { imageOrientation?: string; imageAspectRatio?: number; imageWidth?: number; imageHeight?: number }): boolean {
  return getImageOrientation(image) === 'landscape';
}

export function renderImageEditorPage() {
  const imageRows = allGalleryImages
    .map((image) => {
      const isHeroSlide = heroSlides.some((slide) => slide.imageId === image.id);
      const heroSlide = heroSlides.find((slide) => slide.imageId === image.id);
      const isHeroEligible = isHeroEligibleImage(image);
      const imageOrientation = getImageOrientation(image);

      return `
        <article class="image-editor-card" data-editor-image-card data-image-id="${image.id}">
          <div class="image-editor-preview">
            <img src="${image.src}" alt="${image.alt}" loading="lazy" />
          </div>

          <div class="image-editor-fields">
            <label>
              <span>ID</span>
              <input data-field="id" value="${escapeAttribute(image.id)}" readonly />
            </label>

            <label>
              <span>Title</span>
              <input data-field="title" value="${escapeAttribute(image.title)}" />
            </label>

            <label>
              <span>Category</span>
              <select data-field="category">
                <option value="climbing" ${image.category === 'climbing' ? 'selected' : ''}>Climbing</option>
                <option value="landscape" ${image.category === 'landscape' ? 'selected' : ''}>Landscape</option>
                <option value="personal" ${image.category === 'personal' ? 'selected' : ''}>Personal</option>
              </select>
            </label>

            <label>
              <span>Year</span>
              <input data-field="year" value="${escapeAttribute(image.year)}" />
            </label>

            <label>
              <span>Location</span>
              <input data-field="location" value="${escapeAttribute(image.location)}" />
            </label>

            <label>
              <span>Alt text</span>
              <input data-field="alt" value="${escapeAttribute(image.alt)}" />
            </label>

            <label>
              <span>Optimized source</span>
              <input data-field="src" value="${escapeAttribute(image.src)}" />
            </label>

            <label>
              <span>Full source</span>
              <input data-field="fullSrc" value="${escapeAttribute(image.fullSrc ?? '')}" />
            </label>

            <label class="image-editor-wide-field">
              <span>Note</span>
              <textarea data-field="note">${image.note}</textarea>
            </label>

            <div class="image-editor-hero-controls">
              <label class="image-editor-checkbox">
                <input
                  type="checkbox"
                  data-field="isHeroSlide"
                  ${isHeroSlide && isHeroEligible ? 'checked' : ''}
                  ${isHeroEligible ? '' : 'disabled'}
                />
                <span>Use in home hero slideshow</span>
              </label>

              <label>
                <span>Hero target category</span>
                <select data-field="heroTargetCategory" ${isHeroEligible ? '' : 'disabled'}>
                  <option value="climbing" ${heroSlide?.targetCategory === 'climbing' ? 'selected' : ''}>Climbing</option>
                  <option value="landscape" ${heroSlide?.targetCategory === 'landscape' ? 'selected' : ''}>Landscape</option>
                  <option value="personal" ${heroSlide?.targetCategory === 'personal' ? 'selected' : ''}>Personal</option>
                </select>
              </label>

              ${isHeroEligible ? '' : `<p class="image-editor-wide-field">Hero slides must be landscape. This image is ${escapeAttribute(imageOrientation)} and cannot be added to the homepage carousel.</p>`}
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  return `
    <div class="modern-site image-editor-page" data-page="editor">
      <header class="modern-header">
        <a class="modern-brand" href="#/home" aria-label="Taylor Pike home">
          <span class="modern-brand-name">
            <span>Taylor</span>
            <img class="modern-brand-symbol" src="/images/brand/taylor-pike-symbol-reversed.svg" alt="" aria-hidden="true" />
            <span>Pike</span>
          </span>
        </a>

        <nav class="modern-nav" aria-label="Editor navigation">
          <a href="#/home">Back to Site</a>
          <button type="button" data-export-images>Export Data</button>
        </nav>
      </header>

      <main class="modern-main image-editor-main">
        <section class="image-editor-intro">
          <p class="eyebrow">Dev Editor</p>
          <h1>Image data editor</h1>
          <p>
            Edit metadata here, then export generated TypeScript. This is a local editing tool for now. The homepage hero uses a fixed 16:9 landscape crop; edit crop position rather than frame ratio.
          </p>
        </section>

        <section class="image-editor-toolbar">
          <button class="button primary" type="button" data-export-images>Export Data</button>
          <button class="button secondary" type="button" data-copy-images-output>Copy Output</button>
        </section>

        <section class="image-editor-grid" aria-label="Editable image metadata">
          ${imageRows}
        </section>

        <section class="image-editor-output-section">
          <p class="eyebrow">Generated Output</p>
          <textarea class="image-editor-output" data-editor-output readonly placeholder="Click Export Data to generate updated images.ts and heroSlides.ts content."></textarea>
        </section>
      </main>
    </div>
  `;
}
