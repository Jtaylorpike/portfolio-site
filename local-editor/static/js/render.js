// Markup renderer for the local image editor.
// It converts the current JSON-backed state into editor screens, cards, previews, and controls.

import {
  categoryOptions,
  escapeHtml,
  formatObjectPosition,
  getFallbackCategoryId,
  parseObjectPosition
} from "./utils.js";
import {
  getGalleryDefaultSize,
  getGalleryPreviewAspect as getResolvedGalleryPreviewAspect,
  getGallerySizeLimit,
  resolveGalleryFrameShape,
  resolveGallerySize
} from "./galleryFraming.js";
import {
  getImportOutputPaths,
  makeImageIdFromTitle,
  normalizeImportFitMode,
  normalizeImportFrameStyle
} from "./importValidation.js";

// Finds the hero slide record connected to one image.
function getHeroSlideForImage(state, imageId) {
  return state.heroSlides.find((slide) => slide.imageId === imageId);
}

// Looks up a readable category label for display.
function getCategoryLabel(state, categoryId) {
  const category = state.categories.find((item) => item.id === categoryId);

  return category?.label ?? categoryId;
}

// Returns all images assigned to one category.
function getImagesForCategory(state, categoryId) {
  return state.images.filter((image) => image.category === categoryId);
}

// Returns hero slides paired with their image records.
function getHeroImages(state) {
  return state.heroSlides
    .map((slide) => {
      const image = state.images.find((item) => item.id === slide.imageId);

      if (!image || !isHeroEligibleImage(image)) {
        return null;
      }

      return {
        image,
        slide
      };
    })
    .filter(Boolean);
}

// Finds the image aspect ratio used for preview layout decisions.
function getImageAspect(image) {
  if (Number(image.imageAspectRatio) > 0) {
    return Number(image.imageAspectRatio);
  }

  if (Number(image.imageWidth) > 0 && Number(image.imageHeight) > 0) {
    return Number(image.imageWidth) / Number(image.imageHeight);
  }

  return 1.5;
}

// Determines landscape, portrait, or square orientation for one image.
function getImageOrientation(image) {
  if (["landscape", "portrait", "square"].includes(image.imageOrientation)) {
    return image.imageOrientation;
  }

  const aspect = getImageAspect(image);

  if (Math.abs(aspect - 1) <= 0.04) {
    return "square";
  }

  return aspect > 1 ? "landscape" : "portrait";
}

// Reads gallery cover/contain mode with a safe default.
function getGalleryFitMode(image) {
  return image.galleryFitMode === "contain" ? "contain" : "cover";
}

// Normalizes a frame style value to a supported option.
function getFrameStyle(value) {
  if (["auto", "landscape", "portrait", "square"].includes(value)) {
    return value;
  }

  return "auto";
}

// The homepage hero is locked to a 16:9 landscape cover frame.
function isHeroEligibleImage(image) {
  return getImageOrientation(image) === "landscape";
}

function getHeroFrameStyle(_image) {
  return "landscape";
}

function getResolvedHeroFrameStyle(_image) {
  return "landscape";
}

function getHeroFitMode(_image) {
  return "cover";
}

function shouldShowHeroCropSliders(_image) {
  return true;
}

function getHeroCropModeSummary(_image) {
  return "Hero images are locked to a 16:9 landscape frame. Use the crop sliders to choose which part of the image remains visible. Portrait and square images cannot be added to the home hero.";
}


function getImportFitMode(item) {
  return normalizeImportFitMode(item.galleryFitMode);
}

function getImportFrameStyle(item) {
  return normalizeImportFrameStyle(item.galleryFrameStyle);
}

function renderImportHiddenValue(fieldName, value) {
  return `<input data-import-field="${fieldName}" value="${escapeHtml(value ?? "")}" type="hidden" />`;
}

function renderImportSelectOptions(options, selectedValue) {
  return options.map((option) => {
    const selected = option.value === selectedValue ? "selected" : "";

    return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
  }).join("");
}

function renderImportOutputSummary(item) {
  const outputPaths = getImportOutputPaths(item.id);

  return `
    <div class="import-pipeline-summary wide" data-import-output-summary>
      <p class="eyebrow">Rendition output</p>
      <strong>Will write into public/images/portfolio/</strong>
      <div class="import-path-grid">
        <span>display</span><code data-import-output-path="display">${escapeHtml(outputPaths.display)}</code>
        <span>thumb</span><code data-import-output-path="thumb">${escapeHtml(outputPaths.thumb)}</code>
        <span>texture</span><code data-import-output-path="texture">${escapeHtml(outputPaths.texture)}</code>
        <span>full</span><code data-import-output-path="full">${escapeHtml(outputPaths.full)}</code>
      </div>
    </div>
  `;
}

function renderImageIdentityPanel(image) {
  const suggestedId = makeImageIdFromTitle(image.title || image.id);
  const outputPaths = getImportOutputPaths(suggestedId);

  return `
    <div class="image-identity-panel wide">
      <p class="eyebrow">Image identity</p>
      <strong>Current ID: <code data-current-image-id>${escapeHtml(image.id)}</code></strong>
      <span>
        IDs drive hero references, editor routes, and portfolio rendition filenames.
        Use this controlled rename instead of editing paths by hand.
      </span>

      <label>
        <span>Suggested title-based ID</span>
        <input data-image-id-suggestion value="${escapeHtml(suggestedId)}" />
      </label>

      <div class="identity-path-preview" data-image-id-path-preview>
        <span>display</span><code data-image-id-preview-path="display">${escapeHtml(outputPaths.display)}</code>
        <span>thumb</span><code data-image-id-preview-path="thumb">${escapeHtml(outputPaths.thumb)}</code>
        <span>texture</span><code data-image-id-preview-path="texture">${escapeHtml(outputPaths.texture)}</code>
        <span>full</span><code data-image-id-preview-path="full">${escapeHtml(outputPaths.full)}</code>
      </div>

      <div class="identity-actions">
        <button class="button" type="button" data-suggest-title-id>Refresh From Title</button>
        <button class="button danger" type="button" data-rename-image-id>Rename ID + Rendition Files</button>
      </div>
    </div>
  `;
}



function getEditorHeroFrameInlineStyle(_image) {
  return [
    "width: 100% !important",
    "height: 100% !important",
    "max-width: 100% !important",
    "max-height: 100% !important",
    "aspect-ratio: auto !important"
  ].join("; ");
}

function getEditorHeroImageInlineStyle(_image, position) {
  return [
    "display: block !important",
    "width: 100% !important",
    "height: 100% !important",
    "max-width: none !important",
    "max-height: none !important",
    "object-fit: cover !important",
    `object-position: ${position} !important`
  ].join("; ");
}

// Reads the selected virtual gallery frame style.
function getGalleryFrameStyle(image) {
  return getFrameStyle(image.galleryFrameStyle);
}

// Converts auto gallery style into the actual frame shape used by the room.
function getResolvedGalleryFrameStyle(image) {
  return resolveGalleryFrameShape(
    getGalleryFrameStyle(image),
    getImageAspect(image),
    getImageOrientation(image)
  );
}

// Chooses the default virtual gallery size for the resolved frame shape.
function getGallerySizeDefault(image) {
  return getGalleryDefaultSize(getResolvedGalleryFrameStyle(image));
}

// Limits gallery frame scale so oversized images do not dominate the room.
function getGallerySizeMax(image) {
  return getGallerySizeLimit(getResolvedGalleryFrameStyle(image));
}

// Reads and clamps the saved gallery frame size.
function getGallerySize(image) {
  return resolveGallerySize(image.gallerySize, getResolvedGalleryFrameStyle(image));
}

// Determines the editor preview aspect ratio using the same rule set as the room.
function getGalleryPreviewAspect(image) {
  return getResolvedGalleryPreviewAspect({
    imageAspect: getImageAspect(image),
    imageOrientation: getImageOrientation(image),
    fitMode: getGalleryFitMode(image),
    frameStyle: getGalleryFrameStyle(image),
    requestedSize: getGallerySize(image),
    maxWidth: 1.6,
    maxHeight: 1
  });
}

// Returns the user-facing label for hero or gallery crop mode.
function getCropModeLabel(cropMode) {
  if (cropMode === "hero") {
    return "Hero Crop";
  }

  if (cropMode === "gallery") {
    return "Virtual Gallery Crop";
  }

  return "Crop";
}

// Maps crop mode to the JSON field that stores its object-position value.
function getCropFieldName(cropMode) {
  if (cropMode === "hero") {
    return "heroPosition";
  }

  if (cropMode === "gallery") {
    return "galleryPosition";
  }

  return "heroPosition";
}

// Builds help text for the selected crop editor mode.
function getCropDescription(image, cropMode) {
  if (cropMode === "hero") {
    return getHeroCropModeSummary(image);
  }

  if (cropMode === "gallery" && getGalleryFitMode(image) === "contain") {
    return "Fit Entire Image is active. The virtual gallery frame will resize within safe wall limits so the full image remains visible.";
  }

  if (cropMode === "gallery") {
    return "Adjust how this image is cropped inside its orientation-aware virtual gallery frame.";
  }

  return "Adjust image framing.";
}

// Builds quick navigation links for category-specific image pages.
function renderCategoryLinks(state, activeCategoryId = null, activeMetaCategory = null) {
  return `
    <nav class="category-jump-nav" aria-label="Image categories">
      <a class="${activeCategoryId === null && activeMetaCategory === null ? "is-active" : ""}" href="#/images">All</a>

      <a class="${activeMetaCategory === "hero" ? "is-active" : ""}" href="#/images/hero">
        Hero Slideshow
      </a>

      ${state.categories.map((category) => {
        return `
          <a
            class="${activeCategoryId === category.id ? "is-active" : ""}"
            href="#/images/category/${encodeURIComponent(category.id)}"
          >
            ${escapeHtml(category.label)}
          </a>
        `;
      }).join("")}
    </nav>
  `;
}

// Builds one card in the all-images overview grid.
function renderImageOverviewCard(state, image) {
  const thumbnailPosition = image.thumbnailPosition ?? "50% 50%";

  return `
    <a class="image-overview-card" href="#/image/${encodeURIComponent(image.id)}">
      <div class="image-overview-thumb">
        <img
          src="${escapeHtml(image.thumbSrc ?? image.src)}"
          alt="${escapeHtml(image.alt)}"
          loading="lazy"
          style="object-position: ${escapeHtml(thumbnailPosition)};"
        />
      </div>

      <div class="image-overview-meta">
        <strong>${escapeHtml(image.title)}</strong>
        <span>${escapeHtml(getCategoryLabel(state, image.category))} / ${escapeHtml(image.year)}</span>
      </div>
    </a>
  `;
}

// Builds one reorderable image card for a category page.
function renderImageOrderCard(state, image) {
  const thumbnailPosition = image.thumbnailPosition ?? "50% 50%";

  return `
    <article class="image-overview-card image-order-card" data-category-order-card data-image-id="${escapeHtml(image.id)}">
      <a class="image-overview-thumb" href="#/image/${encodeURIComponent(image.id)}">
        <img
          src="${escapeHtml(image.thumbSrc ?? image.src)}"
          alt="${escapeHtml(image.alt)}"
          loading="lazy"
          style="object-position: ${escapeHtml(thumbnailPosition)};"
        />
      </a>

      <div class="image-overview-meta">
        <strong>${escapeHtml(image.title)}</strong>
        <span>${escapeHtml(getCategoryLabel(state, image.category))} / ${escapeHtml(image.year)}</span>
      </div>

      <div class="image-overview-actions">
        <button class="button" type="button" data-move-category-image="top">Top</button>
        <button class="button" type="button" data-move-category-image="up">Up</button>
        <button class="button" type="button" data-move-category-image="down">Down</button>
      </div>
    </article>
  `;
}

// Builds one reorderable hero slide card.
function renderHeroOrderCard(state, image, slide) {
  const thumbnailPosition = image.thumbnailPosition ?? "50% 50%";
  const targetCategory = slide.targetCategory ?? image.category;

  return `
    <article class="image-overview-card image-order-card hero-order-card" data-hero-order-card data-image-id="${escapeHtml(image.id)}">
      <a class="image-overview-thumb" href="#/image/${encodeURIComponent(image.id)}">
        <img
          src="${escapeHtml(image.thumbSrc ?? image.src)}"
          alt="${escapeHtml(image.alt)}"
          loading="lazy"
          style="object-position: ${escapeHtml(thumbnailPosition)};"
        />
      </a>

      <div class="image-overview-meta">
        <strong>${escapeHtml(image.title)}</strong>
        <span>${escapeHtml(getCategoryLabel(state, image.category))} / ${escapeHtml(image.year)}</span>
      </div>

      <label class="hero-target-control">
        <span>Hero target category</span>
        <select data-hero-order-target-category>
          ${categoryOptions(state.categories, targetCategory)}
        </select>
      </label>

      <div class="image-overview-actions">
        <button class="button" type="button" data-move-hero-image="top">Top</button>
        <button class="button" type="button" data-move-hero-image="up">Up</button>
        <button class="button" type="button" data-move-hero-image="down">Down</button>
        <button class="button danger" type="button" data-remove-hero-image>Remove from Hero</button>
      </div>
    </article>
  `;
}

// Builds X/Y crop sliders and a text output for an object-position value.
export function renderPositionControls(fieldName, label, value, isImport = false) {
  const parsedPosition = parseObjectPosition(value);
  const fieldAttribute = isImport ? "data-import-field" : "data-field";

  return `
    <div class="framing-controls wide" data-framing-controls data-position-field="${fieldName}">
      <div class="framing-header">
        <span>${label}</span>
        <input
          ${fieldAttribute}="${fieldName}"
          data-position-output
          value="${escapeHtml(formatObjectPosition(parsedPosition.x, parsedPosition.y))}"
          readonly
        />
      </div>

      <label class="framing-slider">
        <span>X</span>
        <input type="range" min="0" max="100" step="1" value="${parsedPosition.x}" data-position-axis="x" />
        <strong data-position-value="x">${parsedPosition.x}%</strong>
      </label>

      <label class="framing-slider">
        <span>Y</span>
        <input type="range" min="0" max="100" step="1" value="${parsedPosition.y}" data-position-axis="y" />
        <strong data-position-value="y">${parsedPosition.y}%</strong>
      </label>
    </div>
  `;
}

// Builds crop sliders for a dedicated crop page.
function renderCropPositionControls(fieldName, label, value) {
  const parsedPosition = parseObjectPosition(value);

  return `
    <div class="framing-controls crop-framing-controls" data-framing-controls data-position-field="${fieldName}">
      <div class="framing-header">
        <span>${label}</span>
        <input
          data-crop-field="${fieldName}"
          data-position-output
          value="${escapeHtml(formatObjectPosition(parsedPosition.x, parsedPosition.y))}"
          readonly
        />
      </div>

      <label class="framing-slider">
        <span>X</span>
        <input type="range" min="0" max="100" step="1" value="${parsedPosition.x}" data-position-axis="x" />
        <strong data-position-value="x">${parsedPosition.x}%</strong>
      </label>

      <label class="framing-slider">
        <span>Y</span>
        <input type="range" min="0" max="100" step="1" value="${parsedPosition.y}" data-position-axis="y" />
        <strong data-position-value="y">${parsedPosition.y}%</strong>
      </label>
    </div>
  `;
}

// Builds the virtual gallery size slider for one image.
function renderGallerySizeControl(image, fieldAttribute = "data-field") {
  const size = getGallerySize(image);
  const max = getGallerySizeMax(image);
  const maxPercent = Math.round(max * 100);

  return `
    <label class="gallery-size-control">
      <span>Virtual gallery size</span>
      <input
        ${fieldAttribute}="gallerySize"
        data-gallery-size-range
        type="range"
        min="0.55"
        max="${max}"
        step="0.01"
        value="${size}"
      />
      <strong data-gallery-size-output>${Math.round(size * 100)}%</strong>
      <small>Max for this frame style: ${maxPercent}%</small>
    </label>
  `;
}

// Updates the visible crop preview immediately when a slider moves.
export function updateFramingControl(slider) {
  const controls = slider.closest("[data-framing-controls]");

  if (!controls) {
    return;
  }

  const xSlider = controls.querySelector('[data-position-axis="x"]');
  const ySlider = controls.querySelector('[data-position-axis="y"]');
  const xValue = controls.querySelector('[data-position-value="x"]');
  const yValue = controls.querySelector('[data-position-value="y"]');
  const output = controls.querySelector("[data-position-output]");
  const fieldName = controls.dataset.positionField;

  const x = Number(xSlider?.value ?? 50);
  const y = Number(ySlider?.value ?? 50);
  const position = formatObjectPosition(x, y);

  if (xValue) {
    xValue.textContent = `${x}%`;
  }

  if (yValue) {
    yValue.textContent = `${y}%`;
  }

  if (output) {
    output.value = position;
  }

  const cropEditor = controls.closest("[data-crop-editor]");
  const cropPreviewImage = cropEditor?.querySelector("[data-crop-preview-image]") ?? cropEditor?.querySelector(".crop-preview img");

  if (cropPreviewImage) {
    cropPreviewImage.style.setProperty("object-position", position, "important");
  }

  if (fieldName === "thumbnailPosition") {
    const card = controls.closest("[data-image-card], [data-import-card]");
    const previewImage = card?.querySelector(".preview img");

    if (previewImage) {
      previewImage.style.objectPosition = position;
    }
  }
}

// Updates the gallery size text output when its slider moves.
export function updateGallerySizeControl(range) {
  const container = range.closest(".gallery-size-control, .crop-editor-panel");
  const output = container?.querySelector("[data-gallery-size-output]");

  if (output) {
    output.textContent = `${Math.round(Number(range.value) * 100)}%`;
  }
}

// Populates the import default-category dropdown.
export function updateImportCategoryOptions(state, elements) {
  elements.importCategory.innerHTML = categoryOptions(
    state.categories,
    elements.importCategory.value || getFallbackCategoryId(state)
  );
}

// Builds the category settings editor.
export function renderCategories(state, elements) {
  elements.categoryList.innerHTML = state.categories.map((category) => {
    const imageCount = state.images.filter((image) => image.category === category.id).length;

    return `
      <div class="category-row" data-category-row data-category-id="${escapeHtml(category.id)}">
        <label>
          <span>Category ID</span>
          <input data-category-field="id" value="${escapeHtml(category.id)}" />
        </label>

        <label>
          <span>Display Label</span>
          <input data-category-field="label" value="${escapeHtml(category.label)}" />
        </label>

        <div class="category-row-meta">
          <span>${imageCount} image${imageCount === 1 ? "" : "s"}</span>
        </div>

        <div class="category-row-actions">
          <button class="button" type="button" data-move-category-row="top">Top</button>
          <button class="button" type="button" data-move-category-row="up">Up</button>
          <button class="button" type="button" data-move-category-row="down">Down</button>
          <a class="button" href="#/images/category/${encodeURIComponent(category.id)}">View</a>
          <button class="button danger" type="button" data-remove-category="${escapeHtml(category.id)}">Remove</button>
        </div>
      </div>
    `;
  }).join("");
}

// Builds the all-images overview page.
function renderImageOverview(state, elements) {
  elements.imagesPageEyebrow.textContent = "Images";
  elements.imagesPageTitle.textContent = "All images";
  elements.imagesPageDescription.textContent = "Browse every image in the portfolio. The all-images hierarchy follows the category order, then each category’s image order.";

  elements.editorList.innerHTML = `
    ${renderCategoryLinks(state)}

    <div class="image-overview-grid">
      ${state.images.map((image) => renderImageOverviewCard(state, image)).join("")}
    </div>
  `;
}

// Builds the per-category ordering page.
function renderCategoryImageOverview(state, elements, categoryId) {
  const category = state.categories.find((item) => item.id === categoryId);
  const categoryImages = getImagesForCategory(state, categoryId);

  elements.imagesPageEyebrow.textContent = "Category Images";
  elements.imagesPageTitle.textContent = category ? category.label : "Category not found";
  elements.imagesPageDescription.textContent = category
    ? "This page controls the order of images within this category. Move images, then save JSON to preserve the order."
    : "The category ID in the route does not exist in categories.json.";

  if (!category) {
    elements.editorList.innerHTML = `
      ${renderCategoryLinks(state)}
      <div class="panel">
        <p>Category not found.</p>
        <a class="button" href="#/images">Back to Images</a>
      </div>
    `;
    return;
  }

  elements.editorList.innerHTML = `
    ${renderCategoryLinks(state, categoryId)}

    <div class="category-page-actions">
      <button class="button primary" type="button" data-save-category-order>Save Category Order</button>
    </div>

    <div class="image-overview-grid" data-category-order-grid data-category-id="${escapeHtml(categoryId)}">
      ${categoryImages.map((image) => renderImageOrderCard(state, image)).join("")}
    </div>
  `;
}

// Builds the hero slideshow ordering page.
function renderHeroImageOverview(state, elements) {
  const heroImages = getHeroImages(state);

  elements.imagesPageEyebrow.textContent = "Hero Slideshow";
  elements.imagesPageTitle.textContent = "Hero slideshow order";
  elements.imagesPageDescription.textContent = "This page controls the order of landscape images in the home page hero slideshow. Portrait and square images are excluded because the public hero is locked to a 16:9 frame.";

  elements.editorList.innerHTML = `
    ${renderCategoryLinks(state, null, "hero")}

    <div class="category-page-actions">
      <button class="button primary" type="button" data-save-hero-order>Save Hero Order</button>
    </div>

    <div class="image-overview-grid" data-hero-order-grid>
      ${heroImages.map((item) => renderHeroOrderCard(state, item.image, item.slide)).join("")}
    </div>
  `;
}

// Builds the detailed metadata editor for one image.
function renderImageEditCard(state, image) {
  const heroSlide = getHeroSlideForImage(state, image.id);
  const isHeroSlide = Boolean(heroSlide);
  const heroTargetCategory = heroSlide?.targetCategory ?? image.category ?? getFallbackCategoryId(state);
  const thumbnailPosition = image.thumbnailPosition ?? "50% 50%";
  const orientation = getImageOrientation(image);
  const isHeroEligible = isHeroEligibleImage(image);
  const aspectRatio = getImageAspect(image);
  const galleryFitMode = getGalleryFitMode(image);
  const galleryFrameStyle = getGalleryFrameStyle(image);
  const heroFrameStyle = getHeroFrameStyle(image);
  const heroFitMode = getHeroFitMode(image);

  return `
    <article class="image-card" data-image-card data-image-id="${escapeHtml(image.id)}">
      <div class="preview">
        <img
          src="${escapeHtml(image.thumbSrc ?? image.src)}"
          alt="${escapeHtml(image.alt)}"
          loading="lazy"
          style="object-position: ${escapeHtml(thumbnailPosition)};"
        />

        <div class="image-diagnostics">
          <span>${escapeHtml(orientation)}</span>
          <span>${escapeHtml(String(image.imageWidth ?? "—"))} × ${escapeHtml(String(image.imageHeight ?? "—"))}</span>
          <span>${escapeHtml(aspectRatio.toFixed(3))}</span>
        </div>
      </div>

      <div class="fields">
        <input type="hidden" data-field="id" value="${escapeHtml(image.id)}" />

        ${renderImageIdentityPanel(image)}

        <label>
          <span>Title</span>
          <input data-field="title" value="${escapeHtml(image.title)}" />
        </label>

        <label>
          <span>Category</span>
          <select data-field="category">${categoryOptions(state.categories, image.category)}</select>
        </label>

        <label>
          <span>Year</span>
          <input data-field="year" value="${escapeHtml(image.year)}" />
        </label>

        <label>
          <span>Location</span>
          <input data-field="location" value="${escapeHtml(image.location)}" />
        </label>

        <label>
          <span>Alt text</span>
          <input data-field="alt" value="${escapeHtml(image.alt)}" />
        </label>

        <label>
          <span>Optimized source</span>
          <input data-field="src" value="${escapeHtml(image.src)}" />
        </label>

        <label>
          <span>Thumbnail source</span>
          <input data-field="thumbSrc" value="${escapeHtml(image.thumbSrc ?? "")}" />
        </label>

        <label>
          <span>Texture source</span>
          <input data-field="textureSrc" value="${escapeHtml(image.textureSrc ?? "")}" />
        </label>

        <label>
          <span>Full source</span>
          <input data-field="fullSrc" value="${escapeHtml(image.fullSrc ?? "")}" />
        </label>

        <label>
          <span>Image width</span>
          <input data-field="imageWidth" value="${escapeHtml(String(image.imageWidth ?? ""))}" readonly />
        </label>

        <label>
          <span>Image height</span>
          <input data-field="imageHeight" value="${escapeHtml(String(image.imageHeight ?? ""))}" readonly />
        </label>

        <label>
          <span>Aspect ratio</span>
          <input data-field="imageAspectRatio" value="${escapeHtml(String(image.imageAspectRatio ?? aspectRatio.toFixed(6)))}" readonly />
        </label>

        <label>
          <span>Detected orientation</span>
          <input data-field="imageOrientation" value="${escapeHtml(orientation)}" readonly />
        </label>

        <div class="wide hero-display-summary">
          <p class="eyebrow">Home hero display</p>
          <strong>Locked 16:9 landscape crop</strong>
          <span>Hero slide size and aspect ratio are fixed. Use Edit Hero Crop to adjust composition. Portrait and square images cannot be added to the hero.</span>
        </div>

        <label>
          <span>Gallery frame style</span>
          <select data-field="galleryFrameStyle">
            <option value="auto" ${galleryFrameStyle === "auto" ? "selected" : ""}>Auto</option>
            <option value="landscape" ${galleryFrameStyle === "landscape" ? "selected" : ""}>Landscape</option>
            <option value="portrait" ${galleryFrameStyle === "portrait" ? "selected" : ""}>Portrait</option>
            <option value="square" ${galleryFrameStyle === "square" ? "selected" : ""}>Square</option>
          </select>
        </label>

        <label>
          <span>Gallery fit mode</span>
          <select data-field="galleryFitMode">
            <option value="cover" ${galleryFitMode === "cover" ? "selected" : ""}>Cover / Crop to Frame</option>
            <option value="contain" ${galleryFitMode === "contain" ? "selected" : ""}>Fit Entire Image</option>
          </select>
        </label>

        ${renderGallerySizeControl(image)}

        <div class="wide gallery-display-summary">
          <p class="eyebrow">Virtual gallery display</p>
          <strong>${galleryFitMode === "contain" ? "Fit Entire Image" : "Cover / Crop to Frame"}</strong>
          <span>
            ${galleryFitMode === "contain"
              ? "The full photo will be shown and the frame will resize inside the wall block."
              : "The photo fills the chosen frame style and can be cropped with the gallery crop page."
            }
          </span>
        </div>

        <label class="wide">
          <span>Note</span>
          <textarea data-field="note">${escapeHtml(image.note)}</textarea>
        </label>

        <div class="hero-controls ${isHeroEligible ? "" : "is-disabled"}">
          <label class="checkbox">
            <input
              type="checkbox"
              data-field="isHeroSlide"
              ${isHeroSlide && isHeroEligible ? "checked" : ""}
              ${isHeroEligible ? "" : "disabled"}
            />
            <span>Use in home hero slideshow</span>
          </label>

          <label>
            <span>Hero target category</span>
            <select data-field="heroTargetCategory" ${isHeroEligible ? "" : "disabled"}>${categoryOptions(state.categories, heroTargetCategory)}</select>
          </label>

          ${isHeroEligible ? "" : `<p class="editor-inline-note">Hero slides must be landscape. This image is ${escapeHtml(orientation)} and cannot be added to the homepage carousel.</p>`}
        </div>

        <div class="crop-shortcuts wide">
          <a class="button" href="#/crop/${encodeURIComponent(image.id)}/hero">Edit Hero Crop</a>
          <a class="button" href="#/crop/${encodeURIComponent(image.id)}/gallery">Edit Virtual Gallery Crop</a>
        </div>

        <div class="image-card-actions">
          <button class="button primary" type="button" data-save-image-card>Save JSON</button>
          <button class="button danger" type="button" data-remove-image-card>Remove Record</button>
        </div>
      </div>
    </article>
  `;
}

// Shows one image detail editor by ID.
function renderImageDetail(state, elements, imageId) {
  const image = state.images.find((item) => item.id === imageId);

  elements.imagesPageEyebrow.textContent = "Image Editor";
  elements.imagesPageTitle.textContent = image ? image.title : "Image not found";
  elements.imagesPageDescription.textContent = image
    ? "Edit this image record. Hero images use a locked 16:9 crop; virtual gallery fit mode and gallery size are controlled here."
    : "The image ID in the route does not exist in galleryImages.json.";

  if (!image) {
    elements.editorList.innerHTML = `
      <div class="panel">
        <p>Image not found.</p>
        <a class="button" href="#/images">Back to Images</a>
      </div>
    `;
    return;
  }

  elements.editorList.innerHTML = `
    <div class="image-detail-header">
      <a class="button" href="#/images">Back to Images</a>
      <a class="button" href="#/images/category/${encodeURIComponent(image.category)}">Back to ${escapeHtml(getCategoryLabel(state, image.category))}</a>
      <a class="button" href="#/images/hero">Hero Slideshow</a>
    </div>

    ${renderImageEditCard(state, image)}
  `;
}

// Builds the dedicated hero or gallery crop editor page.
function renderCropPage(state, elements, imageId, cropMode) {
  const image = state.images.find((item) => item.id === imageId);
  const fieldName = getCropFieldName(cropMode);
  const cropLabel = getCropModeLabel(cropMode);

  elements.imagesPageEyebrow.textContent = cropLabel;
  elements.imagesPageTitle.textContent = image ? image.title : "Image not found";
  elements.imagesPageDescription.textContent = image
    ? getCropDescription(image, cropMode)
    : "The image ID in the route does not exist in galleryImages.json.";

  if (!image) {
    elements.editorList.innerHTML = `
      <div class="panel">
        <p>Image not found.</p>
        <a class="button" href="#/images">Back to Images</a>
      </div>
    `;
    return;
  }

  const imageSource = cropMode === "hero"
    ? image.src
    : image.textureSrc ?? image.src;

  const currentPosition = image[fieldName] ?? "50% 50%";
  const isHeroCrop = cropMode === "hero";
  const isGalleryCrop = cropMode === "gallery";
  const galleryFitMode = getGalleryFitMode(image);
  const galleryFrameStyle = getGalleryFrameStyle(image);
  const heroFrameStyle = getHeroFrameStyle(image);
  const heroFitMode = getHeroFitMode(image);
  const resolvedHeroFrameStyle = getResolvedHeroFrameStyle(image);
  const cropPreviewAspect = isGalleryCrop ? getGalleryPreviewAspect(image) : 16 / 9;
  const showCropSliders = isHeroCrop ? shouldShowHeroCropSliders(image) : galleryFitMode === "cover";
  const previewModeClass = isHeroCrop
    ? `crop-preview-hero-${heroFitMode}`
    : `crop-preview-gallery-${galleryFitMode}`;
  const disabledCropExplanation = isHeroCrop
    ? getHeroCropModeSummary(image)
    : "The full image will be shown. The frame/image plane will resize inside the wall block instead of cropping the photo.";

  elements.editorList.innerHTML = `
    <section
      class="crop-editor"
      data-crop-editor
      data-crop-image-id="${escapeHtml(image.id)}"
      data-crop-mode="${escapeHtml(cropMode)}"
    >
      <div class="image-detail-header">
        <a class="button" href="#/image/${encodeURIComponent(image.id)}">Back to Image</a>
        <button class="button primary" type="button" data-save-crop-page>Save Crop</button>
      </div>

      <div class="crop-editor-layout">
        <div
          class="crop-preview crop-preview-${escapeHtml(cropMode)} ${escapeHtml(previewModeClass)}"
          style="aspect-ratio: ${escapeHtml(String(cropPreviewAspect))};"
        >
          ${isHeroCrop ? `
            <div
              class="editor-hero-preview-layer"
              data-hero-frame-style="${escapeHtml(resolvedHeroFrameStyle)}"
              data-hero-fit-mode="${escapeHtml(heroFitMode)}"
            >
              <div
                class="editor-hero-preview-frame"
                data-hero-image-frame
                style="${escapeHtml(getEditorHeroFrameInlineStyle(image))}"
              >
                <img
                  class="editor-hero-preview-image"
                  data-crop-preview-image
                  src="${escapeHtml(imageSource)}"
                  alt="${escapeHtml(image.alt)}"
                  style="${escapeHtml(getEditorHeroImageInlineStyle(image, currentPosition))}"
                />
              </div>
            </div>
          ` : `
            <img
              data-crop-preview-image
              src="${escapeHtml(imageSource)}"
              alt="${escapeHtml(image.alt)}"
              style="object-position: ${escapeHtml(galleryFitMode === "contain" ? "50% 50%" : currentPosition)};"
            />
          `}
        </div>

        <div class="crop-editor-panel">
          <p class="eyebrow">${escapeHtml(cropLabel)}</p>
          <h2>${escapeHtml(image.title)}</h2>
          <p class="crop-description">${escapeHtml(getCropDescription(image, cropMode))}</p>

          ${isHeroCrop ? `
            <div class="gallery-mode-panel hero-mode-panel">
              <p class="eyebrow">Hero frame</p>
              <strong>Locked 16:9 landscape crop</strong>
              <span>The public homepage hero no longer supports portrait, square, or fit-entire-image modes. Crop position is the only hero display control.</span>
            </div>
          ` : ""}

          ${isGalleryCrop ? `
            <div class="gallery-mode-panel">
              <p class="eyebrow">Gallery fit mode</p>
              <input data-crop-setting="galleryFitMode" value="${escapeHtml(galleryFitMode)}" type="hidden" />

              <div class="mode-button-row">
                <button
                  class="button ${galleryFitMode === "cover" ? "primary" : ""}"
                  type="button"
                  data-set-crop-setting="galleryFitMode"
                  data-setting-value="cover"
                >
                  Cover / Crop to Frame
                </button>

                <button
                  class="button ${galleryFitMode === "contain" ? "primary" : ""}"
                  type="button"
                  data-set-crop-setting="galleryFitMode"
                  data-setting-value="contain"
                >
                  Fit Entire Image
                </button>
              </div>
            </div>

            <label>
              <span>Gallery frame style</span>
              <select data-crop-setting="galleryFrameStyle">
                <option value="auto" ${galleryFrameStyle === "auto" ? "selected" : ""}>Auto</option>
                <option value="landscape" ${galleryFrameStyle === "landscape" ? "selected" : ""}>Landscape</option>
                <option value="portrait" ${galleryFrameStyle === "portrait" ? "selected" : ""}>Portrait</option>
                <option value="square" ${galleryFrameStyle === "square" ? "selected" : ""}>Square</option>
              </select>
            </label>

            ${renderGallerySizeControl(image, "data-crop-setting")}
          ` : ""}

          ${showCropSliders
            ? renderCropPositionControls(fieldName, cropLabel, currentPosition)
            : `
              <input data-crop-field="${fieldName}" value="${escapeHtml(currentPosition)}" type="hidden" />
              <div class="crop-contain-note">
                <strong>${isHeroCrop ? "Fit mode is active." : "Fit Entire Image is active."}</strong>
                <span>${escapeHtml(disabledCropExplanation)}</span>
              </div>
            `
          }

          <div class="crop-help">
            <p><strong>Detected orientation:</strong> ${escapeHtml(getImageOrientation(image))}</p>
            <p><strong>Image aspect:</strong> ${escapeHtml(getImageAspect(image).toFixed(3))}</p>
            <p><strong>Preview aspect:</strong> ${escapeHtml(cropPreviewAspect.toFixed(3))}</p>
            ${isHeroCrop ? `<p><strong>Hero frame:</strong> locked 16:9 landscape cover</p>` : ""}
            ${isGalleryCrop ? `<p><strong>Gallery size:</strong> ${escapeHtml(String(Math.round(getGallerySize(image) * 100)))}%</p>` : ""}
          </div>
        </div>
      </div>
    </section>
  `;
}

// Builds editable cards for files waiting to be imported.
export function renderImportReview(state, elements, pendingImportItems) {
  if (!pendingImportItems.length) {
    elements.importReview.classList.remove("is-active");
    elements.importReviewList.innerHTML = "";
    return;
  }

  elements.importReview.classList.add("is-active");

  elements.importReviewList.innerHTML = pendingImportItems.map((item, index) => {
    const orientation = item.imageOrientation || "landscape";
    const aspectRatio = Number(item.imageAspectRatio) > 0 ? Number(item.imageAspectRatio).toFixed(3) : "—";
    const galleryFitMode = getImportFitMode(item);
    const galleryFrameStyle = getImportFrameStyle(item);
    const heroEligible = orientation === "landscape";
    const importPreviewImage = {
      ...item,
      galleryFitMode,
      galleryFrameStyle
    };

    return `
      <article class="import-card" data-import-card data-import-index="${index}" data-import-id-manual="false" data-import-state="valid">
        <div class="preview">
          <img
            src="${escapeHtml(item.previewUrl)}"
            alt=""
            style="object-position: ${escapeHtml(item.thumbnailPosition)};"
          />

          <div class="image-diagnostics">
            <span>${escapeHtml(orientation)}</span>
            <span>${escapeHtml(String(item.imageWidth || "—"))} × ${escapeHtml(String(item.imageHeight || "—"))}</span>
            <span>${escapeHtml(aspectRatio)}</span>
          </div>
        </div>

        <div class="fields">
          <div class="import-card-status wide" data-import-card-status>
            Ready to import into the portfolio rendition folders.
          </div>

          <label>
            <span>ID</span>
            <input data-import-field="id" value="${escapeHtml(item.id)}" />
          </label>

          <div class="import-id-actions">
            <button class="button subtle" type="button" data-import-use-title-id>Use Title as ID</button>
            <span>IDs default to a slug based on title. Manual edits are allowed before save.</span>
          </div>

          <label>
            <span>Title</span>
            <input data-import-field="title" value="${escapeHtml(item.title)}" />
          </label>

          <label>
            <span>Category</span>
            <select data-import-field="category">${categoryOptions(state.categories, item.category)}</select>
          </label>

          <label>
            <span>Year</span>
            <input data-import-field="year" value="${escapeHtml(item.year)}" />
          </label>

          <label>
            <span>Location</span>
            <input data-import-field="location" value="${escapeHtml(item.location)}" />
          </label>

          <label>
            <span>Alt text</span>
            <input data-import-field="alt" value="${escapeHtml(item.alt)}" />
          </label>

          <div class="import-hero-summary wide ${heroEligible ? "" : "is-disabled"}">
            <p class="eyebrow">Home hero eligibility</p>
            <strong>${heroEligible ? "Landscape image: eligible" : `${orientation} image: not hero eligible`}</strong>
            <span>${heroEligible ? "The image can be added to the homepage hero later. Hero display remains locked to 16:9 cover." : "The image will still import, but it cannot be added to the homepage hero because the hero is landscape-only."}</span>
          </div>

          <label>
            <span>Gallery frame style</span>
            <select data-import-field="galleryFrameStyle">
              ${renderImportSelectOptions([
                { value: "auto", label: "Auto" },
                { value: "landscape", label: "Landscape" },
                { value: "portrait", label: "Portrait" },
                { value: "square", label: "Square" }
              ], galleryFrameStyle)}
            </select>
          </label>

          <label>
            <span>Gallery fit mode</span>
            <select data-import-field="galleryFitMode">
              ${renderImportSelectOptions([
                { value: "cover", label: "Cover / Crop to Frame" },
                { value: "contain", label: "Fit Entire Image" }
              ], galleryFitMode)}
            </select>
          </label>

          ${renderGallerySizeControl(importPreviewImage, "data-import-field")}

          ${renderPositionControls("thumbnailPosition", "Thumbnail crop", item.thumbnailPosition ?? "50% 50%", true)}
          ${renderPositionControls("galleryPosition", "Virtual gallery crop", item.galleryPosition ?? "50% 50%", true)}

          ${renderImportHiddenValue("heroPosition", item.heroPosition ?? "50% 50%")}          
          ${renderImportHiddenValue("heroFitMode", "cover")}
          ${renderImportHiddenValue("heroFrameStyle", "landscape")}
          ${renderImportHiddenValue("imageWidth", item.imageWidth ?? "")}
          ${renderImportHiddenValue("imageHeight", item.imageHeight ?? "")}
          ${renderImportHiddenValue("imageAspectRatio", item.imageAspectRatio ?? "")}
          ${renderImportHiddenValue("imageOrientation", orientation)}

          ${renderImportOutputSummary(item)}

          <label class="wide">
            <span>Note</span>
            <textarea data-import-field="note">${escapeHtml(item.note)}</textarea>
          </label>
        </div>
      </article>
    `;
  }).join("");
}




const GALLERY_WALL_TYPES = [
  {
    value: "feature-wall",
    label: "Feature wall",
    description: "Hero-scale wall block for the strongest first-read or anchor image. Uses the largest wall and artwork scale."
  },
  {
    value: "wide-display-wall",
    label: "Wide display wall",
    description: "Long horizontal wall block for large landscape-oriented display moments."
  },
  {
    value: "standard-display-wall",
    label: "Standard display wall",
    description: "Medium wall block for regular single-image display."
  },
  {
    value: "compact-display-wall",
    label: "Compact display wall",
    description: "Short wall block for smaller works, visual pauses, or tighter room sections."
  },
  {
    value: "narrow-transition-wall",
    label: "Narrow transition wall",
    description: "Slim wall block for tighter transitional moments, guide panels, or narrow room sections."
  }
];

function getWallTypeFromLegacySection(value) {
  switch (String(value ?? "").trim()) {
    case "Entry":
    case "Personal":
      return "feature-wall";
    case "Climbing":
    case "Landscape":
    case "Rear Wall":
      return "wide-display-wall";
    default:
      return "standard-display-wall";
  }
}

function getWallTypeFromLegacyType(value) {
  switch (String(value ?? "").trim()) {
    case "entry-feature-wall":
      return "feature-wall";
    case "transition-guide-wall":
    case "outer-gallery-wall":
    case "rear-gallery-wall":
      return "wide-display-wall";
    case "inner-partition-wall":
      return "standard-display-wall";
    case "unassigned-wall":
      return "narrow-transition-wall";
    default:
      return "";
  }
}

function getGalleryWallType(record) {
  const value = record.wallType ?? getWallTypeFromLegacySection(record.wallSection);
  const migratedValue = getWallTypeFromLegacyType(value) || value;

  return GALLERY_WALL_TYPES.some((type) => type.value === migratedValue) ? migratedValue : "standard-display-wall";
}

function getGalleryWallTypeMeta(value) {
  return GALLERY_WALL_TYPES.find((type) => type.value === value) ?? GALLERY_WALL_TYPES.find((type) => type.value === "standard-display-wall") ?? GALLERY_WALL_TYPES[0];
}

function getGalleryWallDisplayName(record, index) {
  const wallId = String(record.wallId ?? "");
  const number = String(index + 1).padStart(2, "0");

  if (wallId === "wall-entry-hero-personal") {
    return "Entry feature wall";
  }

  if (wallId === "wall-entry-left-guide") {
    return "Left entry guide wall";
  }

  if (wallId === "wall-entry-right-guide") {
    return "Right entry guide wall";
  }

  if (wallId.includes("left-inner")) {
    return `Left inner partition ${number}`;
  }

  if (wallId.includes("right-inner")) {
    return `Right inner partition ${number}`;
  }

  if (wallId.includes("left-climbing")) {
    return `Left outer display wall ${number}`;
  }

  if (wallId.includes("right-landscape")) {
    return `Right outer display wall ${number}`;
  }

  if (wallId.includes("rear")) {
    return `Rear gallery wall ${number}`;
  }

  return `Gallery wall ${number}`;
}

function renderGalleryCurationImageOptions(state, selectedImageId) {
  const options = [
    `<option value="">No artwork assigned</option>`,
    ...state.images.map((image) => {
      const selected = image.id === selectedImageId ? "selected" : "";
      const label = `${image.title} / ${getCategoryLabel(state, image.category)}`;

      return `<option value="${escapeHtml(image.id)}" ${selected}>${escapeHtml(label)}</option>`;
    })
  ];

  return options.join("");
}

function renderGalleryCurationWallTypeOptions(selectedValue) {
  return GALLERY_WALL_TYPES.map((option) => {
    const selected = option.value === selectedValue ? "selected" : "";

    return `
      <option
        value="${escapeHtml(option.value)}"
        data-description="${escapeHtml(option.description)}"
        ${selected}
      >${escapeHtml(option.label)}</option>
    `;
  }).join("");
}

function renderGalleryCurationPlaqueSideOptions(selectedValue) {
  return [
    { value: "auto", label: "Auto" },
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
    { value: "none", label: "None" }
  ].map((option) => {
    const selected = option.value === selectedValue ? "selected" : "";

    return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
  }).join("");
}

function renderGalleryCurationDisplayStatusOptions(showInGallery) {
  return [
    { value: "active", label: "Active / visible" },
    { value: "hidden", label: "Hidden / inactive" }
  ].map((option) => {
    const selected = (showInGallery ? "active" : "hidden") === option.value ? "selected" : "";

    return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
  }).join("");
}

function getCurationImage(state, imageId) {
  return state.images.find((image) => image.id === imageId);
}

function renderGalleryArtworkPickerOverlay(state) {
  const imageCards = state.images.map((image) => {
    const categoryLabel = getCategoryLabel(state, image.category);
    const thumbSrc = image.thumbSrc ?? image.src ?? "";
    const thumbnailPosition = image.thumbnailPosition ?? "50% 50%";

    return `
      <button
        class="gallery-artwork-picker-card"
        type="button"
        data-artwork-picker-option="${escapeHtml(image.id)}"
      >
        <span class="gallery-artwork-picker-image">
          <img
            src="${escapeHtml(thumbSrc)}"
            alt="${escapeHtml(image.alt)}"
            loading="lazy"
            style="object-position: ${escapeHtml(thumbnailPosition)};"
          />
        </span>
        <span class="gallery-artwork-picker-title">${escapeHtml(image.title)}</span>
        <span class="gallery-artwork-picker-meta">${escapeHtml(categoryLabel)} / ${escapeHtml(image.year ?? "")}</span>
      </button>
    `;
  }).join("");

  return `
    <section class="gallery-artwork-picker" data-artwork-picker-overlay hidden aria-label="Assign artwork overlay">
      <div class="gallery-artwork-picker-backdrop" data-artwork-picker-close></div>
      <div class="gallery-artwork-picker-panel" role="dialog" aria-modal="true" aria-labelledby="galleryArtworkPickerTitle">
        <div class="gallery-artwork-picker-header">
          <div>
            <p class="eyebrow">Assign Artwork</p>
            <h2 id="galleryArtworkPickerTitle">Choose an image visually</h2>
            <p class="panel-description">
              Select the photograph that should appear on this gallery wall slot. The ID select remains below each card as a precise fallback.
            </p>
          </div>
          <button class="button" type="button" data-artwork-picker-close>Close</button>
        </div>

        <div class="gallery-artwork-picker-actions">
          <button class="button" type="button" data-artwork-picker-option="">No artwork</button>
        </div>

        <div class="gallery-artwork-picker-grid">
          ${imageCards}
        </div>
      </div>
    </section>
  `;
}

function renderGalleryCurationCard(state, record, index) {
  const image = getCurationImage(state, record.artworkId);
  const thumbSrc = image?.thumbSrc ?? image?.src ?? "";
  const thumbnailPosition = image?.thumbnailPosition ?? "50% 50%";
  const showInGallery = record.showInGallery !== false;
  const plaqueEnabled = record.plaqueEnabled !== false;
  const wallType = getGalleryWallType(record);
  const wallTypeMeta = getGalleryWallTypeMeta(wallType);
  const wallDisplayName = getGalleryWallDisplayName(record, index);
  const plaqueSide = record.plaqueSide ?? "auto";

  return `
    <article class="gallery-curation-card" data-gallery-curation-card data-wall-id="${escapeHtml(record.wallId)}">
      <div class="gallery-curation-thumb ${image ? "" : "is-empty"}" data-gallery-curation-thumb>
        ${image ? `
          <img
            src="${escapeHtml(thumbSrc)}"
            alt="${escapeHtml(image.alt)}"
            loading="lazy"
            style="object-position: ${escapeHtml(thumbnailPosition)};"
          />
        ` : `<span>No artwork</span>`}
      </div>

      <div class="gallery-curation-fields">
        <div class="gallery-curation-heading">
          <p class="eyebrow">Wall ${index + 1}</p>
          <h3>${escapeHtml(wallDisplayName)}</h3>
          <span>Blueprint slot: ${escapeHtml(record.wallId)} / Display order ${escapeHtml(String(record.displayOrder ?? index + 1))}</span>
        </div>

        <div class="gallery-selected-artwork wide">
          <p class="eyebrow">Assigned artwork</p>
          <h4 data-gallery-curation-selected-title>${escapeHtml(image?.title ?? "No artwork assigned")}</h4>
          <p data-gallery-curation-selected-meta>${image ? `${escapeHtml(getCategoryLabel(state, image.category))} / ${escapeHtml(image.id)}` : "Use the visual picker or choose an ID from the fallback select."}</p>
          <div class="image-overview-actions">
            <button class="button primary" type="button" data-open-artwork-picker>Assign artwork</button>
          </div>
        </div>

        <label class="wide fallback-select">
          <span>Assigned artwork ID fallback</span>
          <select data-gallery-curation-field="artworkId">
            ${renderGalleryCurationImageOptions(state, record.artworkId)}
          </select>
        </label>

        <label>
          <span>Wall block type</span>
          <select data-gallery-curation-field="wallType">
            ${renderGalleryCurationWallTypeOptions(wallType)}
          </select>
        </label>

        <div class="gallery-wall-type-note" data-gallery-wall-type-note>
          <span data-gallery-wall-type-label>${escapeHtml(wallTypeMeta.label)}</span>
          <p data-gallery-wall-type-description>${escapeHtml(wallTypeMeta.description)}</p>
        </div>

        <label>
          <span>Plaque side</span>
          <select data-gallery-curation-field="plaqueSide">
            ${renderGalleryCurationPlaqueSideOptions(plaqueSide)}
          </select>
        </label>

        <label>
          <span>Display status</span>
          <select data-gallery-curation-field="showInGallery">
            ${renderGalleryCurationDisplayStatusOptions(showInGallery)}
          </select>
        </label>

        <label class="check-row">
          <input data-gallery-curation-field="plaqueEnabled" type="checkbox" ${plaqueEnabled ? "checked" : ""} />
          <span>Show plaque</span>
        </label>

        <div class="image-overview-actions wide">
          <button class="button primary" type="button" data-save-gallery-curation-wall>Save Wall</button>
          <button class="button" type="button" data-move-gallery-curation="top">Top</button>
          <button class="button" type="button" data-move-gallery-curation="up">Up</button>
          <button class="button" type="button" data-move-gallery-curation="down">Down</button>
        </div>
      </div>
    </article>
  `;
}

// Builds the virtual gallery curation page.
function renderGalleryCurationPage(state, elements) {
  const records = state.galleryCuration ?? [];

  if (!elements.galleryCurationList) {
    return;
  }

  if (!records.length) {
    elements.galleryCurationList.innerHTML = `
      <section class="panel backup-empty-state">
        <p class="eyebrow">No curation rows</p>
        <h2>galleryCuration.json is empty or missing.</h2>
        <p class="panel-description">
          The editor expects src/data/galleryCuration.json to define editable wall assignments for the virtual gallery.
        </p>
      </section>
    `;
    return;
  }

  elements.galleryCurationList.innerHTML = `
    <div class="category-page-actions">
      <button class="button primary" type="button" data-save-gallery-curation>Save All Gallery Curation</button>
    </div>

    <div class="gallery-curation-list" data-gallery-curation-list>
      ${records.map((record, index) => renderGalleryCurationCard(state, record, index)).join("")}
    </div>

    ${renderGalleryArtworkPickerOverlay(state)}
  `;
}

// Converts a backup creation timestamp into a readable local date/time.
function formatBackupDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "Unknown date";
  }

  return date.toLocaleString();
}

// Converts a machine-friendly save reason into a readable label.
function formatBackupReason(value) {
  return String(value || "backup")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Builds the Backups page where the user can restore previous JSON states.
function renderBackupPage(state, elements) {
  const backups = state.backups ?? [];

  if (!elements.backupList) {
    return;
  }

  if (!backups.length) {
    elements.backupList.innerHTML = `
      <section class="panel backup-empty-state">
        <p class="eyebrow">No backups found</p>
        <h2>No backup folders are available yet.</h2>
        <p class="panel-description">
          Backups are created automatically before saves, imports, crop saves, and restore actions.
          After you save from the editor, refresh this page to see available restore points.
        </p>

        <div class="actions">
          <button class="button" type="button" data-refresh-backups>Refresh Backups</button>
        </div>
      </section>
    `;
    return;
  }

  elements.backupList.innerHTML = `
    <div class="category-page-actions">
      <button class="button" type="button" data-refresh-backups>Refresh Backups</button>
    </div>

    <div class="backup-list">
      ${backups.map((backup) => {
        const files = backup.files ?? [];
        const fileLabels = files.length ? files.join(", ") : "No JSON files detected";
        const canRestore = Boolean(backup.canRestore);

        return `
          <article class="backup-card" data-backup-card data-backup-folder="${escapeHtml(backup.backupFolder)}">
            <div class="backup-card-main">
              <p class="eyebrow">${escapeHtml(formatBackupReason(backup.reason))}</p>
              <h3>${escapeHtml(backup.backupFolder)}</h3>
              <p>${escapeHtml(formatBackupDate(backup.createdAtUtc))}</p>
              <p><strong>Files:</strong> ${escapeHtml(fileLabels)}</p>
            </div>

            <div class="backup-card-actions">
              <button
                class="button danger"
                type="button"
                data-restore-backup="${escapeHtml(backup.backupFolder)}"
                ${canRestore ? "" : "disabled"}
              >
                Restore Backup
              </button>

              ${canRestore ? "" : `<span>This folder is missing one or more required JSON files.</span>`}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

// Chooses which editor page to render for the current route.
export function renderAll(state, elements, route) {
  renderCategories(state, elements);
  updateImportCategoryOptions(state, elements);

  if (route.name === "backups") {
    renderBackupPage(state, elements);
    return;
  }

  if (route.name === "gallery") {
    renderGalleryCurationPage(state, elements);
    return;
  }

  if (route.name === "image") {
    renderImageDetail(state, elements, route.imageId);
    return;
  }

  if (route.name === "crop") {
    renderCropPage(state, elements, route.imageId, route.cropMode);
    return;
  }

  if (route.name === "categoryImages") {
    renderCategoryImageOverview(state, elements, route.categoryId);
    return;
  }

  if (route.name === "heroImages") {
    renderHeroImageOverview(state, elements);
    return;
  }

  renderImageOverview(state, elements);
}
