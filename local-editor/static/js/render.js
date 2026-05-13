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
  resolveGalleryFrameDimensions,
  resolveGalleryFrameShape,
  resolveGallerySize
} from "./galleryFraming.js";
import {
  getImportOutputPaths,
  makeImageIdFromTitle,
  normalizeImportFitMode,
  normalizeImportFrameStyle
} from "./importValidation.js";
import {
  GALLERY_GRID_MAX_CELLS,
  GALLERY_GRID_MIN_CELLS,
  GALLERY_GRID_TOTAL_CELLS,
  GALLERY_GRID_CELL_METERS,
  findGalleryPlacementBoundaryViolations,
  findGalleryPlacementCollisions,
  getGalleryPlacementBoundaryIds,
  getGalleryPlacementCollisionIds,
  getGalleryPlacementCollisionText,
  galleryGridSizeToPercent,
  getGalleryWallFootprintLabel,
  getGalleryWallGridInfo,
  gridToMeters,
  isGalleryWallPlaced,
  metersToGrid
} from "./galleryGrid.js";

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


const GALLERY_WALL_PREVIEW_META = {
  "feature-wall": {
    label: "Hero-scale wall preview",
    surfaceClass: "is-feature",
    wallWidth: 6.25,
    wallHeight: 3.6,
    artworkWidth: 4.35,
    artworkHeight: 2.52
  },
  "wide-display-wall": {
    label: "Wide wall preview",
    surfaceClass: "is-wide",
    wallWidth: 4.9,
    wallHeight: 3.3,
    artworkWidth: 3.18,
    artworkHeight: 2.04
  },
  "standard-display-wall": {
    label: "Standard wall preview",
    surfaceClass: "is-standard",
    wallWidth: 3.55,
    wallHeight: 3.3,
    artworkWidth: 2.25,
    artworkHeight: 1.52
  },
  "compact-display-wall": {
    label: "Compact wall preview",
    surfaceClass: "is-compact",
    wallWidth: 2.7,
    wallHeight: 3.25,
    artworkWidth: 1.65,
    artworkHeight: 1.1
  },
  "narrow-transition-wall": {
    label: "Narrow transition wall preview",
    surfaceClass: "is-narrow",
    wallWidth: 2.15,
    wallHeight: 3.15,
    artworkWidth: 1.65,
    artworkHeight: 1.1
  }
};

const GALLERY_PREVIEW_FRAME_BORDER = 0.2;
const GALLERY_PREVIEW_PLAQUE_WIDTH = 0.74;
const GALLERY_PREVIEW_PLAQUE_HEIGHT = 0.22;
const GALLERY_PREVIEW_PLAQUE_GAP = 0.11;
const GALLERY_PREVIEW_SAFE_WALL_MARGIN = 0.14;

function getGalleryWallPreviewMeta(wallType) {
  return GALLERY_WALL_PREVIEW_META[wallType] ?? GALLERY_WALL_PREVIEW_META["standard-display-wall"];
}

function getGalleryPreviewWallAspect(wallType) {
  const meta = getGalleryWallPreviewMeta(wallType);

  return meta.wallWidth / meta.wallHeight;
}

function getGalleryPreviewArtworkPositionY(meta) {
  return Math.min(
    meta.wallHeight * 0.56,
    meta.wallHeight - meta.artworkHeight / 2 - 0.35
  );
}

function resolveGalleryPreviewFrameDimensions(meta, image) {
  if (!image) {
    return {
      width: Math.min(meta.artworkWidth * 0.72, meta.wallWidth * 0.46),
      height: Math.min(meta.artworkHeight * 0.72, meta.wallHeight * 0.36)
    };
  }

  return resolveGalleryFrameDimensions({
    imageAspect: getImageAspect(image),
    imageOrientation: getImageOrientation(image),
    fitMode: image.galleryFitMode ?? "cover",
    frameStyle: image.galleryFrameStyle ?? "auto",
    requestedSize: image.gallerySize,
    maxWidth: meta.artworkWidth,
    maxHeight: meta.artworkHeight
  });
}

function getGalleryPlaquePreviewPlacement(wallType, image, plaqueSide, plaqueEnabled) {
  if (!plaqueEnabled || plaqueSide === "none") {
    return "none";
  }

  const meta = getGalleryWallPreviewMeta(wallType);
  const dimensions = resolveGalleryPreviewFrameDimensions(meta, image);
  const frameHalfWidth = dimensions.width / 2 + GALLERY_PREVIEW_FRAME_BORDER / 2;
  const plaqueHalfWidth = GALLERY_PREVIEW_PLAQUE_WIDTH / 2;
  const requiredCenterOffset = frameHalfWidth + GALLERY_PREVIEW_PLAQUE_GAP + plaqueHalfWidth;
  const maxCenterOffset = meta.wallWidth / 2 - GALLERY_PREVIEW_SAFE_WALL_MARGIN - plaqueHalfWidth;
  const sidePlacementFits = requiredCenterOffset <= maxCenterOffset;

  if (plaqueSide === "left" || plaqueSide === "right") {
    return sidePlacementFits ? plaqueSide : "below";
  }

  return sidePlacementFits ? "right" : "below";
}

function getGalleryWallPreviewNote(showInGallery, image, plaqueSide, plaqueEnabled, plaquePlacement) {
  if (!showInGallery) {
    return "Hidden walls stay in curation data but do not participate as active display walls.";
  }

  if (!image) {
    return "Assign artwork to preview the wall, frame, and plaque relationship.";
  }

  if (!plaqueEnabled || plaqueSide === "none") {
    return "Plaque is disabled for this wall.";
  }

  if ((plaqueSide === "left" || plaqueSide === "right") && plaquePlacement === "below") {
    return "Side plaque fallback preview: the selected wall does not have enough physical side clearance, so the plaque resolves below the frame.";
  }

  if (plaqueSide === "auto" && plaquePlacement === "below") {
    return "Auto plaque preview: the selected wall does not have enough physical side clearance, so the plaque resolves below the frame.";
  }

  return "Wall preview: wall, frame, and plaque positions use the current gallery wall and artwork-size presets.";
}

function toGalleryPreviewPercent(value, total) {
  return `${Math.max(0, Math.min(100, (value / total) * 100)).toFixed(3)}%`;
}

function getGalleryWallPreviewGeometry(wallType, image, plaqueEnabled, plaquePlacement) {
  const meta = getGalleryWallPreviewMeta(wallType);
  const dimensions = resolveGalleryPreviewFrameDimensions(meta, image);
  const frameOuterWidth = dimensions.width + GALLERY_PREVIEW_FRAME_BORDER;
  const frameOuterHeight = dimensions.height + GALLERY_PREVIEW_FRAME_BORDER;
  const frameCenterX = meta.wallWidth / 2;
  const frameCenterY = getGalleryPreviewArtworkPositionY(meta);
  const wallAspect = meta.wallWidth / meta.wallHeight;

  const frame = {
    left: toGalleryPreviewPercent(frameCenterX - frameOuterWidth / 2, meta.wallWidth),
    top: toGalleryPreviewPercent(meta.wallHeight - frameCenterY - frameOuterHeight / 2, meta.wallHeight),
    width: toGalleryPreviewPercent(frameOuterWidth, meta.wallWidth),
    height: toGalleryPreviewPercent(frameOuterHeight, meta.wallHeight)
  };

  const plaque = {
    left: "50%",
    top: "50%",
    width: toGalleryPreviewPercent(GALLERY_PREVIEW_PLAQUE_WIDTH, meta.wallWidth),
    height: toGalleryPreviewPercent(GALLERY_PREVIEW_PLAQUE_HEIGHT, meta.wallHeight)
  };

  if (plaqueEnabled && plaquePlacement !== "none") {
    const plaqueHalfWidth = GALLERY_PREVIEW_PLAQUE_WIDTH / 2;
    const plaqueHalfHeight = GALLERY_PREVIEW_PLAQUE_HEIGHT / 2;

    if (plaquePlacement === "left" || plaquePlacement === "right") {
      const frameHalfWidth = dimensions.width / 2 + GALLERY_PREVIEW_FRAME_BORDER / 2;
      const centerOffset = frameHalfWidth + GALLERY_PREVIEW_PLAQUE_GAP + plaqueHalfWidth;
      const sideMultiplier = plaquePlacement === "left" ? -1 : 1;
      const plaqueCenterX = frameCenterX + centerOffset * sideMultiplier;
      const plaqueCenterY = Math.max(
        0.76,
        frameCenterY - dimensions.height / 2 + plaqueHalfHeight + 0.044
      );

      plaque.left = toGalleryPreviewPercent(plaqueCenterX - plaqueHalfWidth, meta.wallWidth);
      plaque.top = toGalleryPreviewPercent(meta.wallHeight - plaqueCenterY - plaqueHalfHeight, meta.wallHeight);
    }
    else {
      const belowFrameY = frameCenterY - frameOuterHeight / 2 - GALLERY_PREVIEW_PLAQUE_GAP - plaqueHalfHeight;
      const plaqueCenterY = Math.max(0.38, belowFrameY);

      plaque.left = toGalleryPreviewPercent(frameCenterX - plaqueHalfWidth, meta.wallWidth);
      plaque.top = toGalleryPreviewPercent(meta.wallHeight - plaqueCenterY - plaqueHalfHeight, meta.wallHeight);
    }
  }

  return {
    wallAspect: wallAspect.toFixed(5),
    wallWidth: meta.wallWidth,
    wallHeight: meta.wallHeight,
    frameWidth: dimensions.width,
    frameHeight: dimensions.height,
    frame,
    plaque
  };
}

function getGalleryWallPreviewStyle(geometry) {
  return [
    `--preview-wall-aspect: ${geometry.wallAspect}`,
    `--preview-frame-left: ${geometry.frame.left}`,
    `--preview-frame-top: ${geometry.frame.top}`,
    `--preview-frame-width: ${geometry.frame.width}`,
    `--preview-frame-height: ${geometry.frame.height}`,
    `--preview-plaque-left: ${geometry.plaque.left}`,
    `--preview-plaque-top: ${geometry.plaque.top}`,
    `--preview-plaque-width: ${geometry.plaque.width}`,
    `--preview-plaque-height: ${geometry.plaque.height}`
  ].join("; ");
}

function renderGalleryWallPreview(state, record, image, wallType, plaqueEnabled, plaqueSide, showInGallery) {
  const meta = getGalleryWallPreviewMeta(wallType);
  const plaquePlacement = getGalleryPlaquePreviewPlacement(wallType, image, plaqueSide, plaqueEnabled);
  const thumbSrc = image?.thumbSrc ?? image?.src ?? "";
  const objectPosition = image?.galleryPosition ?? image?.thumbnailPosition ?? "50% 50%";
  const imageLabel = image ? `${getCategoryLabel(state, image.category)} / ${image.id}` : "No artwork assigned";
  const note = getGalleryWallPreviewNote(showInGallery, image, plaqueSide, plaqueEnabled, plaquePlacement);
  const previewLabel = image
    ? `Open large wall preview for ${image.title ?? image.id}`
    : "Open large wall preview for this empty wall slot";
  const geometry = getGalleryWallPreviewGeometry(wallType, image, plaqueEnabled, plaquePlacement);
  const wallScaleLabel = `${geometry.wallWidth.toFixed(2)}m × ${geometry.wallHeight.toFixed(2)}m wall`;
  const frameScaleLabel = image
    ? `${geometry.frameWidth.toFixed(2)}m × ${geometry.frameHeight.toFixed(2)}m frame`
    : "No mounted frame";

  return `
    <div
      class="gallery-wall-preview wide"
      data-gallery-wall-preview
      data-open-gallery-preview="wall"
      data-preview-wall-type="${escapeHtml(wallType)}"
      data-preview-status="${showInGallery ? "active" : "hidden"}"
      data-preview-plaque-placement="${escapeHtml(plaquePlacement)}"
      role="button"
      tabindex="0"
      aria-label="${escapeHtml(previewLabel)}"
      style="${escapeHtml(getGalleryWallPreviewStyle(geometry))}"
    >
      <div class="gallery-wall-preview-heading">
        <span>${escapeHtml(meta.label)}</span>
        <strong data-preview-artwork-title>${escapeHtml(image?.title ?? "No artwork assigned")}</strong>
        <small data-preview-artwork-meta>${escapeHtml(imageLabel)}</small>
      </div>

      <div class="gallery-wall-preview-surface ${escapeHtml(meta.surfaceClass)}" data-preview-surface>
        <div class="gallery-wall-preview-wall-plane" data-preview-wall-plane>
          <div class="gallery-wall-preview-frame ${image ? "" : "is-empty"}" data-preview-frame>
            ${image ? `
              <img
                src="${escapeHtml(thumbSrc)}"
                alt="${escapeHtml(image.alt ?? image.title ?? "Gallery artwork")}" 
                loading="lazy"
                style="object-position: ${escapeHtml(objectPosition)};"
              />
            ` : `<span>No artwork</span>`}
          </div>

          <div class="gallery-wall-preview-plaque" data-preview-plaque aria-label="Plaque position preview">
            <span class="gallery-wall-preview-plaque-mark is-primary" aria-hidden="true"></span>
            <span class="gallery-wall-preview-plaque-mark is-secondary" aria-hidden="true"></span>
            <span class="gallery-wall-preview-plaque-mark is-tertiary" aria-hidden="true"></span>
          </div>
          <div class="gallery-wall-preview-baseboard"></div>
        </div>
        <div class="gallery-wall-preview-floor-plane" aria-hidden="true"></div>
      </div>

      <small class="gallery-wall-preview-scale" data-preview-scale>${escapeHtml(wallScaleLabel)} / ${escapeHtml(frameScaleLabel)}</small>
      <p data-preview-note>${escapeHtml(note)}</p>
    </div>
  `;
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

function renderGalleryCurationPlacementStatusOptions(placedInGallery) {
  return [
    { value: "placed", label: "Placed on map" },
    { value: "unplaced", label: "Not on map" }
  ].map((option) => {
    const selected = (placedInGallery ? "placed" : "unplaced") === option.value ? "selected" : "";

    return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
  }).join("");
}

function normalizeGalleryPlacementNumber(value, fallback = 0) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Number(numberValue.toFixed(2));
}

function getGalleryWallPlacement(record) {
  const gridInfo = getGalleryWallGridInfo({
    ...record,
    wallType: getGalleryWallType(record)
  });

  return {
    positionX: gridInfo.positionX,
    positionZ: gridInfo.positionZ,
    gridX: gridInfo.gridX,
    gridZ: gridInfo.gridZ,
    rotationYDegrees: gridInfo.rotationYDegrees
  };
}

function renderGalleryRotationOptions(selectedValue) {
  return [
    { value: "0", label: "Face forward / +Z" },
    { value: "90", label: "Face right / +X" },
    { value: "-90", label: "Face left / -X" },
    { value: "180", label: "Face back / -Z" }
  ].map((option) => {
    const selected = Number(option.value) === Number(selectedValue) ? "selected" : "";

    return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
  }).join("");
}

function getGalleryPlacementSummary(record) {
  const placement = getGalleryWallPlacement(record);

  return `Grid ${placement.gridX}, ${placement.gridZ} / ${placement.positionX.toFixed(2)}m, ${placement.positionZ.toFixed(2)}m / ${placement.rotationYDegrees.toFixed(0)}°`;
}

function getCurationImage(state, imageId) {
  return state.images.find((image) => image.id === imageId);
}

function getGalleryCurationStats(state, records) {
  const stats = {
    total: records.length,
    active: 0,
    hidden: 0,
    assigned: 0,
    unassigned: 0,
    missingAssignedArtwork: 0,
    placed: 0,
    unplaced: 0,
    wallTypeCounts: new Map()
  };

  records.forEach((record) => {
    const showInGallery = record.showInGallery !== false;
    const image = getCurationImage(state, record.artworkId);
    const wallType = getGalleryWallType(record);
    const placedInGallery = isGalleryWallPlaced(record);

    stats.wallTypeCounts.set(wallType, (stats.wallTypeCounts.get(wallType) ?? 0) + 1);

    if (placedInGallery) {
      stats.placed += 1;
    } else {
      stats.unplaced += 1;
    }

    if (showInGallery) {
      stats.active += 1;
    } else {
      stats.hidden += 1;
    }

    if (record.artworkId && image) {
      stats.assigned += 1;
    } else {
      stats.unassigned += 1;
    }

    if (record.artworkId && !image) {
      stats.missingAssignedArtwork += 1;
    }
  });

  return stats;
}

function renderGalleryStatCard(label, value, note = "") {
  return `
    <div class="gallery-curation-stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      ${note ? `<p>${escapeHtml(note)}</p>` : ""}
    </div>
  `;
}

function renderGalleryWallTypePills(stats) {
  return GALLERY_WALL_TYPES.map((wallType) => {
    const count = stats.wallTypeCounts.get(wallType.value) ?? 0;

    return `
      <span class="gallery-curation-type-pill" data-wall-type-pill="${escapeHtml(wallType.value)}">
        ${escapeHtml(wallType.label)} <strong>${escapeHtml(String(count))}</strong>
      </span>
    `;
  }).join("");
}

function galleryGridCellCenterToPercent(value, invert = false) {
  const safeValue = Math.max(GALLERY_GRID_MIN_CELLS, Math.min(GALLERY_GRID_MAX_CELLS, Math.round(Number(value) || 0)));
  const offset = invert
    ? GALLERY_GRID_MAX_CELLS - safeValue
    : safeValue - GALLERY_GRID_MIN_CELLS;
  const percent = Math.max(0, Math.min(100, ((offset + 0.5) / GALLERY_GRID_TOTAL_CELLS) * 100));

  return `${percent.toFixed(3)}%`;
}

function getGalleryVisualWallStyle(record, prefix = "marker") {
  const info = getGalleryWallGridInfo({
    ...record,
    wallType: getGalleryWallType(record)
  });
  const centerX = galleryGridCellCenterToPercent(info.gridX, true);
  const centerZ = galleryGridCellCenterToPercent(info.gridZ, true);
  const length = galleryGridSizeToPercent(info.lengthCells);
  const thickness = galleryGridSizeToPercent(info.thicknessCells);
  const wallRotation = -Number(info.rotationYDegrees || 0);

  return [
    `--${prefix}-x: ${centerX}`,
    `--${prefix}-z: ${centerZ}`,
    `--${prefix}-width: ${length}`,
    `--${prefix}-depth: ${thickness}`,
    `--${prefix}-rotation: ${wallRotation}deg`,
    `--${prefix}-label-rotation: ${Number(info.rotationYDegrees || 0)}deg`
  ].join('; ');
}

function getGalleryPlacementMapMarkerStyle(record) {
  return getGalleryVisualWallStyle(record, "marker");
}

function renderGalleryPlacementWallVisual() {
  return `<span class="gallery-placement-wall-line" aria-hidden="true"></span>`;
}

function getGalleryFacingArrowStyle() {
  return "";
}

function renderGalleryMapControls() {
  return `
    <div class="gallery-map-controls" data-gallery-map-controls>
      <div>
        <p class="eyebrow">Map controls</p>
        <strong data-gallery-map-selected-label>No wall selected</strong>
        <small>Click or drag a wall on the map, then rotate or flip it here.</small>
      </div>
      <div class="gallery-map-control-buttons">
        <button class="button gallery-map-icon-button" type="button" data-gallery-map-rotate="-45" aria-label="Rotate selected wall left 45 degrees" title="Rotate left 45°" disabled>↺</button>
        <button class="button gallery-map-icon-button" type="button" data-gallery-map-rotate="45" aria-label="Rotate selected wall right 45 degrees" title="Rotate right 45°" disabled>↻</button>
        <button class="button gallery-map-icon-button" type="button" data-gallery-map-flip aria-label="Flip selected wall facing direction" title="Flip facing direction" disabled>⇄</button>
        <button class="button" type="button" data-gallery-map-unplace disabled>Remove from map</button>
        <button class="button primary" type="button" data-save-gallery-curation>Save Gallery Curation</button>
      </div>
    </div>
  `;
}

function renderGalleryPlacementSidebar(records, state) {
  const items = records.map((record, index) => {
    const wallType = getGalleryWallType(record);
    const wallTypeMeta = getGalleryWallTypeMeta(wallType);
    const placedInGallery = isGalleryWallPlaced(record);
    const image = getCurationImage(state, record.artworkId);
    const wallNumber = `Wall ${String(index + 1).padStart(2, "0")}`;
    const artworkLabel = image?.title ?? "No artwork assigned";

    return `
      <button
        class="gallery-placement-sidebar-item"
        type="button"
        draggable="true"
        data-gallery-wall-drag-source
        data-wall-id="${escapeHtml(record.wallId)}"
        data-placement-state="${placedInGallery ? "placed" : "unplaced"}"
      >
        <span class="gallery-placement-sidebar-number">${escapeHtml(wallNumber)}</span>
        <strong class="gallery-placement-sidebar-artwork">${escapeHtml(artworkLabel)}</strong>
        <small>${escapeHtml(wallTypeMeta.label)} / ${placedInGallery ? "On map" : "Not on map"}</small>
      </button>
    `;
  }).join("");

  return `
    <aside class="gallery-placement-sidebar" aria-label="Wall entities">
      <div class="gallery-placement-sidebar-heading">
        <p class="eyebrow">Wall entities</p>
        <h5>Drag wall cards</h5>
        <p>Drag a wall card onto the map to place it. Drag a placed footprint off the map to mark it as not on map without deleting the card.</p>
      </div>
      <div class="gallery-placement-sidebar-list" data-gallery-placement-sidebar>
        ${items}
      </div>
    </aside>
  `;
}

function renderGalleryPlacementMap(state, records) {
  const placedRecords = records.filter(isGalleryWallPlaced);
  const collisions = findGalleryPlacementCollisions(records);
  const boundaryViolations = findGalleryPlacementBoundaryViolations(records);
  const collisionIds = getGalleryPlacementCollisionIds(records);
  const boundaryIds = getGalleryPlacementBoundaryIds(records);
  const markers = placedRecords.map((record, index) => {
    const placement = getGalleryWallPlacement(record);
    const wallType = getGalleryWallType(record);
    const showInGallery = record.showInGallery !== false;
    const label = getGalleryWallDisplayName(record, index);
    const hasCollision = collisionIds.has(record.wallId);
    const hasBoundaryViolation = boundaryIds.has(record.wallId);
    const title = `${label}: grid ${placement.gridX}, ${placement.gridZ}; ${placement.positionX.toFixed(2)}m, ${placement.positionZ.toFixed(2)}m; ${placement.rotationYDegrees.toFixed(0)} degrees`;

    return `
      <button
        class="gallery-placement-map-marker"
        type="button"
        draggable="true"
        data-placement-marker
        data-placement-marker-wall-id="${escapeHtml(record.wallId)}"
        data-placement-marker-wall-type="${escapeHtml(wallType)}"
        data-placement-marker-status="${showInGallery ? "active" : "hidden"}"
        data-placement-marker-collision="${hasCollision || hasBoundaryViolation ? "true" : "false"}"
        data-placement-marker-boundary="${hasBoundaryViolation ? "true" : "false"}"
        data-placement-marker-facing="${escapeHtml(String(placement.rotationYDegrees))}"
        title="${escapeHtml(title)}"
        style="${escapeHtml(getGalleryPlacementMapMarkerStyle(record))}"
      >
        ${renderGalleryPlacementWallVisual()}
        <span class="gallery-placement-marker-number">${escapeHtml(String(index + 1))}</span>
        <span class="gallery-placement-facing-arrow" style="${getGalleryFacingArrowStyle(record)}" aria-hidden="true"></span>
      </button>
    `;
  }).join("");

  const issueCount = collisions.length + boundaryViolations.length;
  const collisionMessage = issueCount
    ? `<p class="gallery-placement-map-warning">${escapeHtml(`${issueCount} placement issue${issueCount === 1 ? "" : "s"} detected. Move overlapping or border-crossing walls fully inside open floor cells before saving.`)}</p>`
    : `<p class="gallery-placement-map-success">No wall footprint collisions or border conflicts detected.</p>`;

  return `
    <div class="gallery-placement-map" aria-label="Gallery placement map">
      <div>
        <p class="eyebrow">Floor Grid</p>
        <h4>Wall footprint map</h4>
        <p>Drag wall cards from the right sidebar or drag placed footprints directly. Dragging a wall off the map marks it as not placed; it does not delete the wall card.</p>
        ${collisionMessage}
      </div>
      <div class="gallery-placement-map-layout">
        <div class="gallery-placement-map-main">
          ${renderGalleryMapControls()}
          <div class="gallery-placement-map-room" data-gallery-placement-map>
            ${markers}
            <span class="gallery-placement-drop-preview" data-gallery-placement-drop-preview hidden aria-hidden="true"></span>
          </div>
        </div>
        ${renderGalleryPlacementSidebar(records, state)}
      </div>
    </div>
  `;
}

function renderGalleryCurationSummary(state, records) {
  const stats = getGalleryCurationStats(state, records);
  const activeUnassigned = records.filter((record) => {
    return record.showInGallery !== false && !getCurationImage(state, record.artworkId);
  }).length;

  return `
    <section class="gallery-curation-summary" aria-label="Gallery curation summary">
      <div class="gallery-curation-summary-heading">
        <p class="eyebrow">Curation Status</p>
        <h3>Wall assignments at a glance</h3>
        <p>
          Wall slots now use a voxel-style floor grid. Wall blocks occupy whole squares, map controls handle rotation/facing, and collision checks prevent two placed walls from using the same cell.
        </p>

      </div>

      <div class="gallery-curation-stat-grid">
        ${renderGalleryStatCard("Total wall cards", stats.total)}
        ${renderGalleryStatCard("On map", stats.placed)}
        ${renderGalleryStatCard("Not on map", stats.unplaced)}
        ${renderGalleryStatCard("Assigned artwork", stats.assigned, activeUnassigned ? `${activeUnassigned} active wall(s) still need artwork.` : "")}
      </div>

      <div class="gallery-curation-type-strip" aria-label="Wall block type counts">
        ${renderGalleryWallTypePills(stats)}
      </div>

      ${renderGalleryPlacementMap(state, records)}
    </section>
  `;
}

function renderGalleryCurationFilters(state) {
  const categoryOptionsMarkup = [
    `<option value="all">All categories</option>`,
    ...state.categories.map((category) => {
      return `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`;
    })
  ].join("");

  const wallTypeOptions = [
    `<option value="all">All wall block types</option>`,
    ...GALLERY_WALL_TYPES.map((wallType) => {
      return `<option value="${escapeHtml(wallType.value)}">${escapeHtml(wallType.label)}</option>`;
    })
  ].join("");

  return `
    <section class="gallery-curation-filters" aria-label="Gallery wall filters">
      <label>
        <span>Search walls/artwork</span>
        <input data-gallery-curation-filter="search" placeholder="Search title, wall slot, type, or ID" />
      </label>

      <label>
        <span>Display status</span>
        <select data-gallery-curation-filter="status">
          <option value="all">All statuses</option>
          <option value="active">Active / visible</option>
          <option value="hidden">Hidden / inactive</option>
          <option value="needs-artwork">Needs artwork</option>
        </select>
      </label>

      <label>
        <span>Map placement</span>
        <select data-gallery-curation-filter="placement">
          <option value="all">All placement states</option>
          <option value="placed">On map</option>
          <option value="unplaced">Not on map</option>
        </select>
      </label>

      <label>
        <span>Wall block type</span>
        <select data-gallery-curation-filter="wallType">
          ${wallTypeOptions}
        </select>
      </label>

      <label>
        <span>Artwork category</span>
        <select data-gallery-curation-filter="category">
          ${categoryOptionsMarkup}
        </select>
      </label>
    </section>
  `;
}

function renderGalleryArtworkPickerCategoryOptions(state) {
  return [
    `<option value="all">All categories</option>`,
    ...state.categories.map((category) => {
      return `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`;
    })
  ].join("");
}

function renderGalleryArtworkPickerOverlay(state) {
  const imageCards = state.images.map((image) => {
    const categoryLabel = getCategoryLabel(state, image.category);
    const thumbSrc = image.thumbSrc ?? image.src ?? "";
    const thumbnailPosition = image.thumbnailPosition ?? "50% 50%";
    const searchText = [image.title, image.id, categoryLabel, image.year, image.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return `
      <button
        class="gallery-artwork-picker-card"
        type="button"
        data-artwork-picker-option="${escapeHtml(image.id)}"
        data-artwork-picker-category="${escapeHtml(image.category)}"
        data-artwork-picker-search="${escapeHtml(searchText)}"
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

        <div class="gallery-artwork-picker-toolbar">
          <label>
            <span>Search images</span>
            <input data-artwork-picker-filter="search" placeholder="Search title, ID, location, or year" />
          </label>
          <label>
            <span>Category</span>
            <select data-artwork-picker-filter="category">
              ${renderGalleryArtworkPickerCategoryOptions(state)}
            </select>
          </label>
          <button class="button" type="button" data-artwork-picker-option="">No artwork</button>
        </div>

        <div class="gallery-artwork-picker-grid" data-artwork-picker-grid>
          ${imageCards}
        </div>
      </div>
    </section>
  `;
}


function renderGalleryPreviewLightboxOverlay() {
  return `
    <section class="gallery-preview-lightbox" data-gallery-preview-lightbox hidden aria-label="Expanded gallery preview overlay">
      <div class="gallery-preview-lightbox-backdrop" data-gallery-preview-close></div>
      <div class="gallery-preview-lightbox-panel" role="dialog" aria-modal="true" aria-labelledby="galleryPreviewLightboxTitle">
        <div class="gallery-preview-lightbox-header">
          <div>
            <p class="eyebrow" data-gallery-preview-kind>Gallery Preview</p>
            <h2 id="galleryPreviewLightboxTitle" data-gallery-preview-title>Preview</h2>
            <p class="panel-description" data-gallery-preview-meta></p>
          </div>
          <button class="button" type="button" data-gallery-preview-close>Close</button>
        </div>

        <div class="gallery-preview-lightbox-body" data-gallery-preview-body></div>
        <p class="gallery-preview-lightbox-note" data-gallery-preview-note></p>
      </div>
    </section>
  `;
}

function renderGalleryCurationCard(state, record, index) {
  const image = getCurationImage(state, record.artworkId);
  const thumbSrc = image?.thumbSrc ?? image?.src ?? "";
  const thumbnailPosition = image?.thumbnailPosition ?? "50% 50%";
  const showInGallery = record.showInGallery !== false;
  const placedInGallery = isGalleryWallPlaced(record);
  const displayStatus = showInGallery ? "active" : "hidden";
  const placementStatus = placedInGallery ? "placed" : "unplaced";
  const artworkState = image ? "assigned" : "unassigned";
  const plaqueEnabled = record.plaqueEnabled !== false;
  const wallType = getGalleryWallType(record);
  const wallTypeMeta = getGalleryWallTypeMeta(wallType);
  const wallDisplayName = getGalleryWallDisplayName(record, index);
  const plaqueSide = record.plaqueSide ?? "auto";
  const placement = getGalleryWallPlacement(record);
  const placementSummary = getGalleryPlacementSummary(record);
  const searchText = [
    wallDisplayName,
    record.wallId,
    wallTypeMeta.label,
    placementSummary,
    image?.title,
    image?.id,
    image ? getCategoryLabel(state, image.category) : "",
    displayStatus,
    placementStatus
  ].filter(Boolean).join(" ").toLowerCase();
  const collisions = findGalleryPlacementCollisions(state.galleryCuration ?? []);
  const boundaryIds = getGalleryPlacementBoundaryIds(state.galleryCuration ?? []);
  const collisionText = boundaryIds.has(record.wallId)
    ? "This wall extends beyond the floor-map border."
    : getGalleryPlacementCollisionText(record.wallId, collisions);
  const footprintLabel = getGalleryWallFootprintLabel({
    ...record,
    wallType,
    positionX: placement.positionX,
    positionZ: placement.positionZ,
    rotationYDegrees: placement.rotationYDegrees
  });

  return `
    <article
      class="gallery-curation-card"
      data-gallery-curation-card
      data-wall-id="${escapeHtml(record.wallId)}"
      data-gallery-curation-status="${escapeHtml(displayStatus)}"
      data-gallery-curation-placement-status="${escapeHtml(placementStatus)}"
      data-gallery-curation-wall-type="${escapeHtml(wallType)}"
      data-gallery-curation-artwork-state="${escapeHtml(artworkState)}"
      data-gallery-curation-category="${escapeHtml(image?.category ?? "")}" 
      data-gallery-curation-search="${escapeHtml(searchText)}"
      data-gallery-placement-collision="${collisionText ? "true" : "false"}"
    >
      <div class="gallery-curation-preview-column">
        <button
          class="gallery-curation-thumb ${image ? "" : "is-empty"}"
          data-gallery-curation-thumb
          data-open-gallery-preview="artwork"
          type="button"
          aria-label="${escapeHtml(image ? `Open large artwork preview for ${image.title ?? image.id}` : "Open large artwork preview for this empty wall slot")}"
        >
          ${image ? `
            <img
              src="${escapeHtml(thumbSrc)}"
              alt="${escapeHtml(image.alt)}"
              loading="lazy"
              style="object-position: ${escapeHtml(thumbnailPosition)};"
            />
          ` : `<span>No artwork</span>`}
        </button>

        ${renderGalleryWallPreview(state, record, image, wallType, plaqueEnabled, plaqueSide, showInGallery)}
      </div>

      <div class="gallery-curation-fields">
        <div class="gallery-curation-heading">
          <div class="gallery-curation-heading-row">
            <div>
              <p class="eyebrow">Wall ${index + 1}</p>
              <h3>${escapeHtml(wallDisplayName)}</h3>
            </div>
            <div class="gallery-curation-badge-row" aria-label="Wall status">
              <span class="gallery-curation-badge" data-gallery-status-badge="${escapeHtml(displayStatus)}">${showInGallery ? "Active" : "Hidden"}</span>
              <span class="gallery-curation-badge" data-gallery-placement-badge="${escapeHtml(placementStatus)}">${placedInGallery ? "On map" : "Not on map"}</span>
              <span class="gallery-curation-badge" data-gallery-artwork-badge="${escapeHtml(artworkState)}">${image ? "Assigned" : "Needs artwork"}</span>
              <span class="gallery-curation-badge" data-gallery-wall-type-badge>${escapeHtml(wallTypeMeta.label)}</span>
            </div>
          </div>
          <span>Blueprint slot: ${escapeHtml(record.wallId)} / Display order ${escapeHtml(String(record.displayOrder ?? index + 1))} / ${escapeHtml(placementSummary)}</span>
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

        <div class="gallery-placement-readout wide" data-gallery-placement-controls>
          <p class="eyebrow">Map placement</p>
          <strong data-gallery-placement-state-label>${placedInGallery ? "On map" : "Not on map"}</strong>
          <p>Drag this wall on the floor map to place it. Use the map controls to rotate, flip, or remove it from the map.</p>
          <p class="gallery-placement-footprint" data-gallery-placement-footprint>${escapeHtml(footprintLabel)}</p>
          <p class="gallery-placement-warning" data-gallery-placement-warning ${collisionText ? "" : "hidden"}>${escapeHtml(collisionText)}</p>
          <input data-gallery-curation-field="placedInGallery" type="hidden" value="${placedInGallery ? "placed" : "unplaced"}" />
          <input data-gallery-grid-field="gridX" type="hidden" value="${escapeHtml(String(placement.gridX))}" />
          <input data-gallery-grid-field="gridZ" type="hidden" value="${escapeHtml(String(placement.gridZ))}" />
          <input data-gallery-curation-field="positionX" type="hidden" value="${escapeHtml(placement.positionX.toFixed(2))}" />
          <input data-gallery-curation-field="positionZ" type="hidden" value="${escapeHtml(placement.positionZ.toFixed(2))}" />
          <input data-gallery-curation-field="rotationYDegrees" type="hidden" value="${escapeHtml(String(placement.rotationYDegrees))}" />
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
          <button class="button danger" type="button" data-remove-gallery-wall-card>Remove Wall</button>
          <button class="button" type="button" data-move-gallery-curation="top">Top</button>
          <button class="button" type="button" data-move-gallery-curation="up">Up</button>
          <button class="button" type="button" data-move-gallery-curation="down">Down</button>
        </div>
      </div>
    </article>
  `;
}

function renderGalleryAddWallOverlay(state) {
  return `
    <div class="gallery-add-wall-overlay" data-gallery-add-wall-overlay hidden>
      <div class="gallery-add-wall-backdrop" data-gallery-add-wall-close></div>
      <section class="gallery-add-wall-panel" role="dialog" aria-modal="true" aria-labelledby="gallery-add-wall-title">
        <div class="gallery-add-wall-heading">
          <div>
            <p class="eyebrow">New wall entity</p>
            <h3 id="gallery-add-wall-title">Add wall card</h3>
            <p>Configure the wall before adding it to the curation list. New walls start off-map until you drag them onto the floor grid.</p>
          </div>
          <button class="button" type="button" data-gallery-add-wall-close>Close</button>
        </div>

        <div class="gallery-add-wall-grid">
          <label>
            <span>Wall block type</span>
            <select data-gallery-add-wall-field="wallType">
              ${renderGalleryCurationWallTypeOptions("standard-display-wall")}
            </select>
          </label>

          <label>
            <span>Assigned artwork</span>
            <select data-gallery-add-wall-field="artworkId">
              ${renderGalleryCurationImageOptions(state, "")}
            </select>
          </label>

          <label>
            <span>Display status</span>
            <select data-gallery-add-wall-field="showInGallery">
              ${renderGalleryCurationDisplayStatusOptions(false)}
            </select>
          </label>

          <label>
            <span>Plaque side</span>
            <select data-gallery-add-wall-field="plaqueSide">
              ${renderGalleryCurationPlaqueSideOptions("auto")}
            </select>
          </label>

          <label class="check-row">
            <input data-gallery-add-wall-field="plaqueEnabled" type="checkbox" checked />
            <span>Show plaque</span>
          </label>
        </div>

        <div class="gallery-add-wall-actions">
          <button class="button" type="button" data-gallery-add-wall-close>Cancel</button>
          <button class="button primary" type="button" data-create-gallery-wall-card>Add Wall Card</button>
        </div>
      </section>
    </div>
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
    ${renderGalleryCurationSummary(state, records)}

    ${renderGalleryCurationFilters(state)}

    <div class="gallery-curation-list-header">
      <p class="gallery-curation-filter-result" data-gallery-curation-filter-result>
        Showing ${escapeHtml(String(records.length))} wall cards.
      </p>
      <button class="button primary" type="button" data-add-gallery-wall-card>Add Wall Card</button>
    </div>

    <div class="gallery-curation-list" data-gallery-curation-list>
      ${records.map((record, index) => renderGalleryCurationCard(state, record, index)).join("")}
    </div>

    ${renderGalleryArtworkPickerOverlay(state)}
    ${renderGalleryPreviewLightboxOverlay()}
    ${renderGalleryAddWallOverlay(state)}
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
