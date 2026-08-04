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

// Missing isPublic means visible. false keeps an image in the editor while
// removing it from the public portfolio, public hero, and 3D gallery artwork.
function isImagePublic(image) {
  return image?.isPublic !== false;
}

// The homepage hero is locked to a 16:9 landscape cover frame and should not
// use records hidden from the public website.
function isHeroEligibleImage(image) {
  return isImagePublic(image) && getImageOrientation(image) === "landscape";
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

function getEditorHeroImageInlineStyle(image, position) {
  return [
    "display: block !important",
    "width: 100% !important",
    "height: 100% !important",
    "max-width: none !important",
    "max-height: none !important",
    "object-fit: cover !important",
    `object-position: ${position} !important`,
    `scale: ${Math.max(1, Number(image.heroScale ?? 1))} !important`
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

  if (cropMode === "about") {
    return "About Page Crop";
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

  if (cropMode === "about") {
    return "aboutPosition";
  }

  return "heroPosition";
}

function getCropScaleFieldName(cropMode) {
  if (cropMode === "gallery") return "galleryScale";
  if (cropMode === "about") return "aboutScale";
  return "heroScale";
}

function getAboutCropAspect(placementRole) {
  if (placementRole === "upper-collage") return 4 / 5;
  if (placementRole === "background-float") return 3 / 4;
  return 5 / 4;
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

function isImageHeroSlide(state, imageId) {
  return state.heroSlides.some((slide) => slide.imageId === imageId);
}

function renderImageStatusBadges(state, image) {
  const publicStatus = isImagePublic(image) ? "public" : "hidden";
  const publicLabel = isImagePublic(image) ? "Visible on site" : "Hidden from site";
  const heroBadge = isImageHeroSlide(state, image.id)
    ? `<span class="image-status-badge" data-image-status="hero"><span aria-hidden="true"></span>Homepage hero</span>`
    : "";

  return `
    <div class="image-status-badges" aria-label="Image status">
      <span class="image-status-badge" data-image-status="${publicStatus}"><span aria-hidden="true"></span>${publicLabel}</span>
      ${heroBadge}
    </div>
  `;
}

function renderBulkEditorToolbar(state, scopeLabel) {
  const categoryOptionsMarkup = state.categories.map((category) => {
    return `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`;
  }).join("");

  return `
    <details class="bulk-editor-toolbar" data-bulk-editor-toolbar>
      <summary class="mac-panel-titlebar">
        <strong>Bulk Edit</strong>
        <span>${escapeHtml(scopeLabel)} / <output class="bulk-editor-count" data-bulk-selection-count aria-live="polite">0 selected</output></span>
      </summary>

      <div class="bulk-editor-body">
        <div class="bulk-editor-selection-actions" aria-label="Bulk selection actions">
          <button class="button" type="button" data-bulk-select-visible>Select all visible cards</button>
          <button class="button" type="button" data-bulk-clear-selection>Clear selection</button>
        </div>

        <div class="bulk-editor-controls">
          <label>
            <span>Visibility</span>
            <select data-bulk-field="visibility">
              <option value="">Leave visibility unchanged</option>
              <option value="show">Show selected on public site</option>
              <option value="hide">Hide selected from public site</option>
            </select>
          </label>

          <label>
            <span>Category</span>
            <select data-bulk-field="category">
              <option value="">Leave category unchanged</option>
              ${categoryOptionsMarkup}
            </select>
          </label>

          <label>
            <span>Homepage hero</span>
            <select data-bulk-field="hero">
              <option value="">Leave hero status unchanged</option>
              <option value="add">Add eligible selected images</option>
              <option value="remove">Remove selected from hero</option>
            </select>
          </label>

          <button class="button primary" type="button" data-bulk-apply disabled>Apply selected updates</button>
        </div>

        <p class="bulk-editor-note">
          Hero additions require visible landscape images.
        </p>
      </div>
    </details>
  `;
}

// Builds one card in the all-images overview grid.
function renderImageOverviewCard(state, image) {
  const thumbnailPosition = image.thumbnailPosition ?? "50% 50%";

  return `
    <article class="image-overview-card" data-image-card-overview data-image-id="${escapeHtml(image.id)}" data-public-status="${isImagePublic(image) ? "public" : "hidden"}">
      <a class="image-overview-card-link" href="#/image/${encodeURIComponent(image.id)}">
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
          ${renderImageStatusBadges(state, image)}
        </div>
      </a>

      <label class="bulk-image-select-control">
        <input type="checkbox" data-bulk-image-select value="${escapeHtml(image.id)}" />
        <span>Select</span>
      </label>
    </article>
  `;
}

// Builds one reorderable image card for a category page.
function renderImageOrderCard(state, image) {
  const thumbnailPosition = image.thumbnailPosition ?? "50% 50%";

  return `
    <article class="image-overview-card image-order-card" data-category-order-card data-image-id="${escapeHtml(image.id)}" data-public-status="${isImagePublic(image) ? "public" : "hidden"}">
      <a class="image-overview-thumb" href="#/image/${encodeURIComponent(image.id)}" draggable="false">
        <img
          src="${escapeHtml(image.thumbSrc ?? image.src)}"
          alt="${escapeHtml(image.alt)}"
          loading="lazy"
          draggable="false"
          style="object-position: ${escapeHtml(thumbnailPosition)};"
        />
      </a>

      <div class="image-overview-meta">
        <strong>${escapeHtml(image.title)}</strong>
        <span>${escapeHtml(getCategoryLabel(state, image.category))} / ${escapeHtml(image.year)}</span>
        ${renderImageStatusBadges(state, image)}
      </div>

      <div class="image-record-footer">
        <label class="bulk-image-select-control" data-no-card-drag>
          <input type="checkbox" data-bulk-image-select value="${escapeHtml(image.id)}" />
          <span>Select</span>
        </label>

        <details class="image-card-command-menu" data-no-card-drag>
          <summary>Arrange</summary>
          <div class="image-overview-actions">
            <button class="button" type="button" data-move-category-image="top">Move to Top</button>
            <button class="button" type="button" data-move-category-image="up">Move Up</button>
            <button class="button" type="button" data-move-category-image="down">Move Down</button>
          </div>
        </details>
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
      <a class="image-overview-thumb" href="#/image/${encodeURIComponent(image.id)}" draggable="false">
        <img
          src="${escapeHtml(image.thumbSrc ?? image.src)}"
          alt="${escapeHtml(image.alt)}"
          loading="lazy"
          draggable="false"
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

      <details class="image-card-command-menu" data-no-card-drag>
        <summary>Slide Commands</summary>
        <div class="image-overview-actions">
          <button class="button" type="button" data-move-hero-image="top">Move to Top</button>
          <button class="button" type="button" data-move-hero-image="up">Move Up</button>
          <button class="button" type="button" data-move-hero-image="down">Move Down</button>
          <button class="button danger" type="button" data-remove-hero-image>Remove from Hero</button>
        </div>
      </details>
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

  if (fieldName === "aboutPosition") {
    const aboutCard = controls.closest("[data-about-photo-card]");
    const imageCard = controls.closest("[data-image-card]");
    const previewImage = aboutCard?.querySelector(".about-editor-thumb img")
      ?? imageCard?.querySelector(".image-about-crop-preview img");

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

function getCategoryUsageStats(state, categoryId) {
  const images = state.images.filter((image) => image.category === categoryId);
  const total = images.length;
  const hidden = images.filter((image) => image.isPublic === false).length;
  const visible = total - hidden;
  const hero = state.heroSlides.filter((slide) => slide.targetCategory === categoryId).length;

  return { total, visible, hidden, hero };
}

function renderCategoryReassignOptions(state, currentCategoryId) {
  const fallbackCategory = state.categories.find((category) => category.id !== currentCategoryId) ?? state.categories[0];

  return state.categories
    .filter((category) => category.id !== currentCategoryId)
    .map((category) => {
      const selected = category.id === fallbackCategory?.id ? "selected" : "";

      return `<option value="${escapeHtml(category.id)}" ${selected}>${escapeHtml(category.label)}</option>`;
    })
    .join("");
}

// Builds the category settings editor.
export function renderCategories(state, elements) {
  const totalImages = state.images.length;
  const hiddenImages = state.images.filter((image) => image.isPublic === false).length;
  const visibleImages = totalImages - hiddenImages;
  const heroCount = state.heroSlides.length;

  elements.categoryList.innerHTML = `
    <div class="category-manager-summary" aria-label="Category summary">
      <span><strong>${escapeHtml(String(state.categories.length))}</strong> categories</span>
      <span><strong>${escapeHtml(String(totalImages))}</strong> images</span>
      <span><strong>${escapeHtml(String(visibleImages))}</strong> visible</span>
      <span><strong>${escapeHtml(String(hiddenImages))}</strong> hidden</span>
      <span><strong>${escapeHtml(String(heroCount))}</strong> hero slides</span>
    </div>

    ${state.categories.map((category) => {
      const stats = getCategoryUsageStats(state, category.id);
      const canRemove = state.categories.length > 1;

      return `
        <div class="category-row" data-category-row data-category-id="${escapeHtml(category.id)}">
          <div class="category-row-fields">
            <label>
              <span>Category ID</span>
              <input data-category-field="id" value="${escapeHtml(category.id)}" />
            </label>

            <label>
              <span>Display Label</span>
              <input data-category-field="label" value="${escapeHtml(category.label)}" />
            </label>
          </div>

          <div class="category-row-meta">
            <span><strong>${escapeHtml(String(stats.total))}</strong> total</span>
            <span>${escapeHtml(String(stats.visible))} visible</span>
            <span>${escapeHtml(String(stats.hidden))} hidden</span>
            <span>${escapeHtml(String(stats.hero))} hero</span>
          </div>

          <label class="category-reassign-control">
            <span>On remove, move images/slides to</span>
            <select data-category-reassign ${canRemove ? "" : "disabled"}>
              ${renderCategoryReassignOptions(state, category.id)}
            </select>
          </label>

          <div class="category-row-actions">
            <button class="button" type="button" data-move-category-row="top">Top</button>
            <button class="button" type="button" data-move-category-row="up">Up</button>
            <button class="button" type="button" data-move-category-row="down">Down</button>
            <a class="button" href="#/images/category/${encodeURIComponent(category.id)}">View</a>
            <button class="button danger" type="button" data-remove-category="${escapeHtml(category.id)}" ${canRemove ? "" : "disabled"}>Remove</button>
          </div>
        </div>
      `;
    }).join("")}
  `;
}

// Builds the all-images overview page.
function renderImageOverview(state, elements) {
  elements.imagesPageEyebrow.textContent = "Images";
  elements.imagesPageTitle.textContent = "All images";
  elements.imagesPageDescription.textContent = "Browse every image in the portfolio. The all-images hierarchy follows the category order, then each category’s image order.";

  elements.editorList.innerHTML = `
    ${renderBulkEditorToolbar(state, `${state.images.length} total image records`)}

    <section class="mac-image-library-panel" aria-label="Image library">
      <div class="mac-panel-titlebar">
        <strong>Image Library</strong>
        <span>${state.images.length} records</span>
      </div>
      <div class="mac-panel-body">
        <div class="image-overview-grid">
          ${state.images.map((image) => renderImageOverviewCard(state, image)).join("")}
        </div>
      </div>
    </section>
  `;
}

// Builds the per-category ordering page.
function renderCategoryImageOverview(state, elements, categoryId) {
  const category = state.categories.find((item) => item.id === categoryId);
  const categoryImages = getImagesForCategory(state, categoryId);

  elements.imagesPageEyebrow.textContent = "Category Images";
  elements.imagesPageTitle.textContent = category ? category.label : "Category not found";
  elements.imagesPageDescription.textContent = category
    ? "This page controls the order of images within this category. Drag the image preview, title area, or any non-control part of a card, then save the category order."
    : "The category ID in the route does not exist in categories.json.";

  if (!category) {
    elements.editorList.innerHTML = `
      <div class="panel">
        <p>Category not found.</p>
        <a class="button" href="#/images">Back to Images</a>
      </div>
    `;
    return;
  }

  elements.editorList.innerHTML = `
    ${renderBulkEditorToolbar(state, `${categoryImages.length} image records in ${category.label}`)}

    <section class="mac-image-library-panel" aria-label="Reorder images in ${escapeHtml(category.label)}">
      <div class="mac-panel-titlebar">
        <strong>${escapeHtml(category.label)} Order</strong>
        <span>${categoryImages.length} records</span>
      </div>
      <div class="mac-panel-body">
        <div class="category-page-actions category-order-actions">
          <button class="button primary" type="button" data-save-category-order>Save Category Order</button>
        </div>
        <div class="image-overview-grid" data-category-order-grid data-category-id="${escapeHtml(categoryId)}">
          ${categoryImages.map((image) => renderImageOrderCard(state, image)).join("")}
        </div>
      </div>
    </section>
  `;
}

// Builds the hero slideshow ordering page.
function renderHeroImageOverview(state, elements) {
  const heroImages = getHeroImages(state);

  elements.imagesPageEyebrow.textContent = "Hero Slideshow";
  elements.imagesPageTitle.textContent = "Hero slideshow order";
  elements.imagesPageDescription.textContent = "This page controls the order of landscape images in the home page hero slideshow. Portrait and square images are excluded because the public hero is locked to a 16:9 frame.";

  elements.editorList.innerHTML = `
    <section class="mac-image-library-panel" aria-label="Reorder hero slideshow images">
      <div class="mac-panel-titlebar">
        <strong>Hero Slide Order</strong>
        <span>${heroImages.length} slides</span>
      </div>
      <div class="mac-panel-body">
        <div class="category-page-actions category-order-actions">
          <button class="button primary" type="button" data-save-hero-order>Save Hero Order</button>
        </div>
        <div class="image-overview-grid" data-hero-order-grid>
          ${heroImages.map((item) => renderHeroOrderCard(state, item.image, item.slide)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderContextPalette(state, elements, route) {
  if (!elements.editorContextPalette || !elements.editorContextPaletteContent) {
    return;
  }

  const imageRoutes = new Set(["images", "image", "crop", "categoryImages", "heroImages"]);
  const isImageWorkspace = imageRoutes.has(route.name);
  elements.editorContextPalette.hidden = !isImageWorkspace;

  if (!isImageWorkspace) {
    elements.editorContextPaletteContent.innerHTML = "";
    return;
  }

  const selectedImage = route.imageId
    ? state.images.find((image) => image.id === route.imageId)
    : null;
  const activeCategoryId = route.name === "categoryImages"
    ? route.categoryId
    : selectedImage?.category ?? null;
  const activeMetaCategory = route.name === "heroImages" ? "hero" : null;

  if (elements.editorContextTitle) {
    elements.editorContextTitle.textContent = "Images";
  }

  elements.editorContextPaletteContent.innerHTML = renderCategoryLinks(
    state,
    activeCategoryId,
    activeMetaCategory
  );
}

function isImageAlreadyInAboutPhotos(state, imageId) {
  return Boolean((state.aboutPhotos ?? []).some((photo) => photo.sourceType === "portfolio-reference" && photo.sourceImageId === imageId));
}

function renderAddToAboutPanel(state, image) {
  const aboutPhoto = (state.aboutPhotos ?? []).find((photo) => (
    photo.sourceType === "portfolio-reference" && photo.sourceImageId === image.id
  ));
  const alreadyAdded = Boolean(aboutPhoto);
  const aboutCount = (state.aboutPhotos ?? []).length;
  const placementRole = getAboutPlacementRole(aboutPhoto);
  const canCrop = alreadyAdded && placementRole !== "unused";

  return `
    <details class="wide image-to-about-panel inspector-disclosure" data-image-to-about-panel>
      <summary>About Page</summary>
      <div class="image-to-about-panel-body">
      <div>
        <p class="eyebrow">About page</p>
        <strong>${alreadyAdded ? "Already added to About photos" : "Add this image to the About page archive"}</strong>
        <span>
          ${alreadyAdded
            ? "This portfolio image already has a reference record in the separate About photo list."
            : "This creates an About photo reference that points to the existing portfolio renditions. It does not copy files or import this image into public/images/about/."}
        </span>
      </div>
      <div class="image-to-about-actions">
        <button class="button" type="button" data-add-image-to-about="${escapeHtml(image.id)}" ${alreadyAdded ? "disabled" : ""}>${alreadyAdded ? "Added" : "Add to About"}</button>
        <a class="button" href="#/about">Open About</a>
        <small>${escapeHtml(String(aboutCount))} About records</small>
      </div>
      ${alreadyAdded ? `
        <div class="image-about-crop-workspace wide" data-about-image-crop-workspace>
          <div class="image-about-crop-preview is-${escapeHtml(placementRole)}">
            <img src="${escapeHtml(aboutPhoto.thumbSrc ?? aboutPhoto.src)}" alt="" style="object-position:${escapeHtml(aboutPhoto.aboutPosition ?? "50% 50%")}" />
          </div>
          <div>
            <p class="eyebrow">Current placement</p>
            <strong>${escapeHtml(ABOUT_PLACEMENT_OPTIONS.find((option) => option.value === placementRole)?.label ?? placementRole)}</strong>
            ${canCrop
              ? `<button class="button primary" type="button" data-open-crop-modal="about" data-crop-image-id="${escapeHtml(image.id)}">Open About Crop Window</button>`
              : `<p class="editor-inline-note">Move this photo into an active About placement before adjusting its crop.</p>`}
          </div>
        </div>
      ` : ""}
      </div>
    </details>
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
      <div class="mac-panel-titlebar">
        <strong>Image Record</strong>
        <span>${escapeHtml(image.id)}</span>
      </div>

      <section class="image-record-preview-pane" aria-label="Image preview">
        <div class="mac-subpanel-title">Preview</div>
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
      </section>

      <section class="image-record-inspector" aria-label="Image record inspector">
        <div class="mac-subpanel-title">Record Inspector</div>
        <div class="fields">
          <input type="hidden" data-field="id" value="${escapeHtml(image.id)}" />
          <input type="hidden" data-field="heroScale" value="${escapeHtml(String(image.heroScale ?? 1))}" />
          <input type="hidden" data-field="galleryScale" value="${escapeHtml(String(image.galleryScale ?? 1))}" />

        ${renderImageIdentityPanel(image)}

        <label>
          <span>Title</span>
          <input data-field="title" value="${escapeHtml(image.title)}" />
        </label>

        <label>
          <span>Category</span>
          <select data-field="category">${categoryOptions(state.categories, image.category)}</select>
        </label>

        <label class="checkbox public-visibility-control wide">
          <input
            type="checkbox"
            data-field="isPublic"
            ${isImagePublic(image) ? "checked" : ""}
          />
          <span>
            <strong>Visible on public site</strong>
            <small>Turn this off to keep the image in the editor while hiding it from the portfolio, hero slideshow, and 3D gallery lookup.</small>
          </span>
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

        <details class="inspector-disclosure wide">
          <summary>File &amp; Rendition Data</summary>
          <div class="inspector-fields-grid">
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
          </div>
        </details>

        <label class="wide">
          <span>Note</span>
          <textarea data-field="note">${escapeHtml(image.note)}</textarea>
        </label>

        ${renderAddToAboutPanel(state, image)}

        <details class="inspector-disclosure wide">
          <summary>Homepage Hero</summary>
          <div class="inspector-fields-grid">
            <div class="wide hero-display-summary">
              <p class="eyebrow">Home hero display</p>
              <strong>Locked 16:9 landscape crop</strong>
              <span>Hero slide size and aspect ratio are fixed. Portrait and square images cannot be added to the hero.</span>
            </div>

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

              ${isHeroEligible ? "" : `<p class="editor-inline-note">Hero slides must be public landscape images. This image is ${isImagePublic(image) ? escapeHtml(orientation) : "hidden from the public site"} and cannot be added to the homepage carousel.</p>`}
            </div>

            <div class="crop-shortcuts wide">
              <button class="button" type="button" data-open-crop-modal="hero" data-crop-image-id="${escapeHtml(image.id)}">Edit Hero Crop</button>
            </div>
          </div>
        </details>

        <details class="inspector-disclosure wide">
          <summary>Virtual Gallery</summary>
          <div class="inspector-fields-grid">
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

            <div class="crop-shortcuts wide">
              <button class="button" type="button" data-open-crop-modal="gallery" data-crop-image-id="${escapeHtml(image.id)}">Edit Virtual Gallery Crop</button>
            </div>
          </div>
        </details>

        <div class="image-card-actions">
          <button class="button primary" type="button" data-save-image-card>Save JSON</button>
          <button class="button danger" type="button" data-remove-image-card>Remove Record</button>
        </div>
        </div>
      </section>
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

  elements.editorList.innerHTML = renderImageEditCard(state, image);
}

// Builds the dedicated hero or gallery crop editor page.
function renderCropPage(state, elements, imageId, cropMode) {
  const image = state.images.find((item) => item.id === imageId);
  const aboutPhoto = cropMode === "about"
    ? (state.aboutPhotos ?? []).find((photo) => photo.sourceImageId === imageId)
    : null;
  const fieldName = getCropFieldName(cropMode);
  const scaleFieldName = getCropScaleFieldName(cropMode);
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

  const imageSource = cropMode === "about"
    ? aboutPhoto?.src ?? image.src
    : cropMode === "hero"
      ? image.src
      : image.textureSrc ?? image.src;

  const currentPosition = cropMode === "about"
    ? aboutPhoto?.aboutPosition ?? "50% 50%"
    : image[fieldName] ?? "50% 50%";
  const currentScale = Math.max(1, Number(cropMode === "about" ? aboutPhoto?.aboutScale : image[scaleFieldName]) || 1);
  const isHeroCrop = cropMode === "hero";
  const isGalleryCrop = cropMode === "gallery";
  const isAboutCrop = cropMode === "about";
  const galleryFitMode = getGalleryFitMode(image);
  const galleryFrameStyle = getGalleryFrameStyle(image);
  const heroFrameStyle = getHeroFrameStyle(image);
  const heroFitMode = getHeroFitMode(image);
  const resolvedHeroFrameStyle = getResolvedHeroFrameStyle(image);
  const cropPreviewAspect = isGalleryCrop
    ? getGalleryPreviewAspect(image)
    : isAboutCrop
      ? getAboutCropAspect(aboutPhoto?.placementRole)
      : 16 / 9;
  const showCropSliders = isAboutCrop || (isHeroCrop ? shouldShowHeroCropSliders(image) : galleryFitMode === "cover");
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
      data-crop-scale-field="${escapeHtml(scaleFieldName)}"
    >
      <div class="image-detail-header">
        <a class="button" href="${isAboutCrop ? "#/about/photos" : `#/image/${encodeURIComponent(image.id)}`}">${isAboutCrop ? "Back to About Photos" : "Back to Image"}</a>
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
              style="object-position: ${escapeHtml(isGalleryCrop && galleryFitMode === "contain" ? "50% 50%" : currentPosition)}; scale:${escapeHtml(String(currentScale))};"
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
            ? `
              ${renderCropPositionControls(fieldName, cropLabel, currentPosition)}
              <label class="crop-zoom-control">
                <span>Zoom</span>
                <input type="range" min="1" max="4" step="0.01" value="${escapeHtml(String(currentScale))}" data-crop-zoom />
                <strong data-crop-zoom-output>${escapeHtml(String(Math.round(currentScale * 100)))}%</strong>
                <input data-crop-setting="${escapeHtml(scaleFieldName)}" value="${escapeHtml(String(currentScale))}" type="hidden" />
              </label>
              <p class="crop-drag-note">Drag the photograph inside the frame to position it.</p>
            `
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
        <div class="import-card-toolbar">
          <span>Review item ${index + 1} of ${pendingImportItems.length}</span>
          <button class="button danger subtle" type="button" data-remove-import-item="${index}">Remove from Import</button>
        </div>

        <button
          class="preview import-preview-button"
          type="button"
          data-open-import-lightbox="${index}"
          aria-label="Open full import preview for ${escapeHtml(item.title || item.id || `review item ${index + 1}`)}"
        >
          <img
            src="${escapeHtml(item.previewUrl)}"
            alt=""
            style="object-position: ${escapeHtml(item.thumbnailPosition)};"
          />

          <span class="import-preview-zoom">View full image</span>

          <div class="image-diagnostics">
            <span>${escapeHtml(orientation)}</span>
            <span>${escapeHtml(String(item.imageWidth || "—"))} × ${escapeHtml(String(item.imageHeight || "—"))}</span>
            <span>${escapeHtml(aspectRatio)}</span>
          </div>
        </button>

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

          <div class="import-category-create">
            <button class="button subtle" type="button" data-create-import-category>Create Category</button>
            <span>Add a category, then keep reviewing this import card.</span>
          </div>

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

          <div class="import-framing-defaults wide">
            <p class="eyebrow">Archive defaults</p>
            <strong>Crop and framing tools are handled after import.</strong>
            <span>New images keep centered thumbnail and gallery framing by default. Use the image detail crop editors later only when a specific image needs manual adjustment.</span>
          </div>

          ${renderImportHiddenValue("thumbnailPosition", item.thumbnailPosition ?? "50% 50%")}
          ${renderImportHiddenValue("galleryPosition", item.galleryPosition ?? "50% 50%")}
          ${renderImportHiddenValue("galleryFrameStyle", galleryFrameStyle)}
          ${renderImportHiddenValue("galleryFitMode", galleryFitMode)}
          ${renderImportHiddenValue("gallerySize", getGallerySize(importPreviewImage))}
          ${renderImportHiddenValue("heroPosition", item.heroPosition ?? "50% 50%")}          
          ${renderImportHiddenValue("heroFitMode", "cover")}
          ${renderImportHiddenValue("heroFrameStyle", "landscape")}
          ${renderImportHiddenValue("imageWidth", item.imageWidth ?? "")}
          ${renderImportHiddenValue("imageHeight", item.imageHeight ?? "")}
          ${renderImportHiddenValue("imageAspectRatio", item.imageAspectRatio ?? "")}
          ${renderImportHiddenValue("imageOrientation", orientation)}
          ${renderImportHiddenValue("originalFilename", item.file?.name ?? "")}

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
    maxHeight: meta.artworkHeight,
    wallWidth: meta.wallWidth,
    wallHeight: meta.wallHeight,
    artworkCenterY: getGalleryPreviewArtworkPositionY(meta),
    frameBorder: GALLERY_PREVIEW_FRAME_BORDER,
    wallMargin: 0.24
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
  const number = String(index + 1).padStart(2, "0");
  return `Wall ${number}`;
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
    <div class="gallery-curation-ledger-cell">
      <dt>${escapeHtml(label)}</dt>
      <dd>
        <strong>${escapeHtml(String(value))}</strong>
        ${note ? `<small>${escapeHtml(note)}</small>` : ""}
      </dd>
    </div>
  `;
}

function renderGalleryWallTypePills(stats) {
  return GALLERY_WALL_TYPES.map((wallType) => {
    const count = stats.wallTypeCounts.get(wallType.value) ?? 0;

    return `
      <span class="gallery-curation-type-entry" data-wall-type-pill="${escapeHtml(wallType.value)}">
        <span>${escapeHtml(wallType.label)}</span>
        <strong>${escapeHtml(String(count))}</strong>
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
        <button class="button" type="button" data-gallery-map-unplace aria-label="Remove selected wall from map" title="Remove selected wall from map" disabled>Unplace</button>
        <button class="button" type="button" data-undo-gallery-curation aria-label="Undo last gallery action" title="Undo last gallery action" disabled aria-keyshortcuts="Control+Z Meta+Z">Undo</button>
        <button class="button primary" type="button" data-save-gallery-curation aria-label="Save gallery curation" title="Save gallery curation">Save</button>
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
      <div class="mac-panel-titlebar gallery-placement-sidebar-titlebar">
        <strong>Wall Entities</strong>
        <span>${escapeHtml(String(records.length))} records</span>
      </div>
      <div class="gallery-placement-sidebar-heading">
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
  const rooms = state.galleryRoom?.layout?.rooms ?? [];
  const activeRoomId = rooms.some((room) => room.id === state.galleryEditorRoomId)
    ? state.galleryEditorRoomId
    : rooms[0]?.id ?? "room-main";
  const roomRecords = records
    .filter((record) => (record.roomId ?? "room-main") === activeRoomId)
    .sort((left, right) => Number(left.displayOrder ?? 0) - Number(right.displayOrder ?? 0));
  const placedRecords = roomRecords.filter(isGalleryWallPlaced);
  const collisions = findGalleryPlacementCollisions(roomRecords);
  const boundaryViolations = findGalleryPlacementBoundaryViolations(roomRecords);
  const collisionIds = getGalleryPlacementCollisionIds(roomRecords);
  const boundaryIds = getGalleryPlacementBoundaryIds(roomRecords);
  const markers = placedRecords.map((record) => {
    const placement = getGalleryWallPlacement(record);
    const wallType = getGalleryWallType(record);
    const showInGallery = record.showInGallery !== false;
    const roomIndex = roomRecords.findIndex((candidate) => candidate.wallId === record.wallId);
    const label = getGalleryWallDisplayName(record, roomIndex);
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
        <span class="gallery-placement-marker-number">${escapeHtml(String(roomIndex + 1))}</span>
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
      <div class="gallery-placement-map-intro">
        <p class="eyebrow">Floor Grid</p>
        <h4>Wall footprint map</h4>
        <p>Drag wall cards from the right sidebar, move placed footprints directly, and use the map controls for rotation, facing, and save behavior.</p>
        ${collisionMessage}
        <label class="field gallery-room-map-selector">Editing room
          <select data-gallery-wall-map-room>
            ${rooms.map((room) => `<option value="${escapeHtml(room.id)}"${room.id === activeRoomId ? " selected" : ""}>${escapeHtml(room.label || room.id)}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="gallery-placement-map-layout">
        <div class="gallery-placement-map-main">
          <div class="gallery-placement-map-room" data-gallery-placement-map>
            ${renderGalleryMapControls()}
            ${markers}
            <span class="gallery-placement-drop-preview" data-gallery-placement-drop-preview hidden aria-hidden="true"></span>
          </div>
        </div>
        ${renderGalleryPlacementSidebar(roomRecords, state)}
      </div>
    </div>
  `;
}

function renderGalleryLayoutBuilder(state) {
  const room = state.galleryRoom ?? {};
  const layout = room.layout ?? {};
  const rooms = Array.isArray(layout.rooms) ? layout.rooms : [];
  const hallways = Array.isArray(layout.hallways) ? layout.hallways : [];
  const modules = [
    ...rooms.map((module) => ({ ...module, kind: "room" })),
    ...hallways.map((module) => ({ ...module, kind: "hallway" }))
  ];
  const grid = room.grid ?? { minX: -16, maxX: 68, minZ: -86, maxZ: 16 };
  const spanX = Math.max(1, Number(grid.maxX) - Number(grid.minX));
  const spanZ = Math.max(1, Number(grid.maxZ) - Number(grid.minZ));
  const spawnPosition = Array.isArray(room.start?.position) ? room.start.position : [0, 1.65, 0];
  const spawnLeft = ((Number(spawnPosition[0]) - Number(grid.minX)) / spanX) * 100;
  const spawnTop = ((Number(spawnPosition[2]) - Number(grid.minZ)) / spanZ) * 100;
  const spawnYaw = Number(room.start?.yaw ?? 0);
  const moduleStyle = (module) => {
    const center = Array.isArray(module.center) ? module.center : [0, 0];
    const left = ((Number(center[0]) - Number(module.width) / 2 - Number(grid.minX)) / spanX) * 100;
    const top = ((Number(center[1]) - Number(module.depth) / 2 - Number(grid.minZ)) / spanZ) * 100;
    return `left:${left}%;top:${top}%;width:${(Number(module.width) / spanX) * 100}%;height:${(Number(module.depth) / spanZ) * 100}%;`;
  };
  const cards = modules.map((module) => {
    const center = Array.isArray(module.center) ? module.center : [0, 0];
    const isHallway = module.kind === "hallway";
    const isDefaultRoom = !isHallway && module.id === (room.defaultRoomId || rooms[0]?.id || "room-main");
    return `
      <article class="gallery-layout-module-card" data-gallery-layout-module data-module-kind="${module.kind}" data-module-id="${escapeHtml(module.id)}">
        <header>
          <div>
            <span>${isHallway ? "Hallway" : isDefaultRoom ? "Default room · Spawn" : "Room"}</span>
            <strong>${escapeHtml(module.label || module.id)}</strong>
          </div>
          <div>
            ${isHallway ? `<button class="button secondary" type="button" data-rotate-gallery-hallway>Rotate 90 deg</button>` : ""}
            <button class="button danger" type="button" data-remove-gallery-module${isDefaultRoom ? ` disabled title="The default spawn room cannot be deleted."` : ""}>Remove</button>
          </div>
        </header>
        <div class="gallery-layout-module-fields">
          <label class="field">Label
            <input type="text" data-gallery-module-field="label" value="${escapeHtml(module.label || "")}">
          </label>
          <label class="field">Center X
            <input type="number" step="0.5" data-gallery-module-field="centerX" value="${escapeHtml(String(center[0] ?? 0))}">
          </label>
          <label class="field">Center Z
            <input type="number" step="0.5" data-gallery-module-field="centerZ" value="${escapeHtml(String(center[1] ?? 0))}">
          </label>
          <label class="field">Width
            <input type="number" min="2" step="0.5" data-gallery-module-field="width" value="${escapeHtml(String(module.width ?? 7))}">
          </label>
          <label class="field">Depth
            <input type="number" min="2" step="0.5" data-gallery-module-field="depth" value="${escapeHtml(String(module.depth ?? 7))}">
          </label>
          ${isHallway ? `
            <label class="field">Length preset
              <select data-gallery-module-field="lengthPreset">
                <option value="short"${module.lengthPreset === "short" ? " selected" : ""}>Short / 10 m</option>
                <option value="long"${module.lengthPreset === "long" ? " selected" : ""}>Long / 16 m</option>
              </select>
            </label>
            <label class="field">Start connection
              <select data-gallery-module-field="startConnectionStyle">
                ${["centered", "left", "right", "corner"].map((value) => `<option value="${value}"${(module.startConnectionStyle ?? module.connectionStyle) === value ? " selected" : ""}>${value[0].toUpperCase()}${value.slice(1)}</option>`).join("")}
              </select>
            </label>
            <label class="field">End connection
              <select data-gallery-module-field="endConnectionStyle">
                ${["centered", "left", "right", "corner"].map((value) => `<option value="${value}"${(module.endConnectionStyle ?? module.connectionStyle) === value ? " selected" : ""}>${value[0].toUpperCase()}${value.slice(1)}</option>`).join("")}
              </select>
            </label>
          ` : ""}
        </div>
      </article>
    `;
  }).join("");

  return `
    <section class="gallery-layout-builder" aria-label="Room and hallway builder">
      <div class="gallery-layout-builder-heading">
        <div>
          <p class="eyebrow">Architecture</p>
          <h4>Room and hallway builder</h4>
          <p>Edit the shared runtime modules. Hallways contain no artwork; wall curation remains below.</p>
        </div>
        <div class="gallery-layout-builder-actions">
          <button class="button secondary" type="button" data-add-gallery-module="room">Add Room</button>
          <button class="button secondary" type="button" data-add-gallery-module="hallway">Add Hallway</button>
          <button class="button primary" type="button" data-save-gallery-room>Save Architecture</button>
        </div>
      </div>
      <div class="gallery-layout-preview" data-gallery-architecture-map aria-label="Modular layout preview">
        <div class="gallery-layout-map-controls">
          <div class="gallery-map-zoom-controls" aria-label="Map zoom">
            <span>Zoom</span>
            <button class="button" type="button" data-gallery-architecture-zoom="-1" aria-label="Zoom out" title="Zoom out">−</button>
            <button class="button" type="button" data-gallery-architecture-zoom="1" aria-label="Zoom in" title="Zoom in">+</button>
          </div>
          <div class="gallery-map-pan-controls" aria-label="Map pan">
            <span>Pan</span>
            <button class="button is-up" type="button" data-gallery-architecture-pan-y="-80" aria-label="Pan up" title="Pan up">↑</button>
            <button class="button is-left" type="button" data-gallery-architecture-pan-x="-80" aria-label="Pan left" title="Pan left">←</button>
            <button class="button is-right" type="button" data-gallery-architecture-pan-x="80" aria-label="Pan right" title="Pan right">→</button>
            <button class="button is-down" type="button" data-gallery-architecture-pan-y="80" aria-label="Pan down" title="Pan down">↓</button>
          </div>
          <button class="button gallery-spawn-toggle" type="button" data-gallery-architecture-toggle-spawn aria-pressed="true" title="Hide spawn marker">S</button>
        </div>
        <div class="gallery-layout-preview-world" data-gallery-architecture-world>
          ${modules.map((module) => `<button type="button" class="gallery-layout-preview-module is-${module.kind}" data-gallery-architecture-module data-module-id="${escapeHtml(module.id)}" data-module-kind="${module.kind}" data-center-x="${escapeHtml(String(module.center?.[0] ?? 0))}" data-center-z="${escapeHtml(String(module.center?.[1] ?? 0))}" data-module-width="${escapeHtml(String(module.width))}" data-module-depth="${escapeHtml(String(module.depth))}" style="${moduleStyle(module)}">${escapeHtml(module.label || module.id)}</button>`).join("")}
          <div class="gallery-layout-spawn-marker" data-gallery-architecture-spawn data-spawn-x="${escapeHtml(String(spawnPosition[0]))}" data-spawn-z="${escapeHtml(String(spawnPosition[2]))}" style="left:${spawnLeft}%;top:${spawnTop}%;--spawn-yaw:${spawnYaw}rad" aria-label="Gallery spawn point">
            <span aria-hidden="true"></span>
            <strong>Spawn</strong>
          </div>
        </div>
      </div>
      <div class="gallery-layout-module-list">
        ${cards || `<p class="panel-description">No room modules are loaded.</p>`}
      </div>
    </section>
  `;
}

function renderGalleryCurationSummary(state, records) {
  const stats = getGalleryCurationStats(state, records);
  const activeUnassigned = records.filter((record) => {
    return record.showInGallery !== false && !getCurationImage(state, record.artworkId);
  }).length;
  const statusNote = activeUnassigned
    ? `${activeUnassigned} visible wall${activeUnassigned === 1 ? "" : "s"} still need artwork.`
    : "Visible wall assignments are filled.";

  return `
    ${renderGalleryLayoutBuilder(state)}

    <section class="gallery-curation-summary" aria-label="Gallery curation summary">
      <div class="gallery-curation-summary-titlebar mac-panel-titlebar">
        <strong>Gallery Curation</strong>
        <span>${escapeHtml(String(stats.total))} wall records</span>
      </div>

      <div class="gallery-curation-summary-heading">
        <div class="gallery-curation-summary-copy">
          <p class="eyebrow">Archive Room Editor</p>
          <h3>Wall Control</h3>
          <p>Placement, artwork, visibility, and plaques.</p>
        </div>
        <div class="gallery-curation-summary-actions">
          <span class="gallery-curation-save-state">${escapeHtml(statusNote)}</span>
          <button class="button primary" type="button" data-save-gallery-curation>Save Gallery Curation</button>
        </div>
      </div>

      <dl class="gallery-curation-stat-grid" aria-label="Gallery record status">
        ${renderGalleryStatCard("Wall cards", stats.total, "Total editable wall records")}
        ${renderGalleryStatCard("On map", stats.placed, `${stats.unplaced} off-map`)}
        ${renderGalleryStatCard("Artwork", `${stats.assigned}/${stats.total}`, activeUnassigned ? `${activeUnassigned} visible gap${activeUnassigned === 1 ? "" : "s"}` : "Assignments ready")}
        ${renderGalleryStatCard("Visible", stats.active, `${stats.hidden} hidden`)}
      </dl>

      <div class="gallery-curation-type-strip" aria-label="Wall block type counts">
        <strong class="gallery-curation-type-label">Wall types</strong>
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
      <div class="mac-panel-titlebar gallery-finder-titlebar">
        <strong>Wall Finder</strong>
        <span>Non-destructive filter</span>
      </div>
      <div class="gallery-filter-heading">
        <div>
          <h4>Filter wall cards</h4>
        </div>
        <p>Use these controls to narrow the wall list without changing saved data.</p>
      </div>

      <div class="gallery-filter-grid">
        <label class="gallery-filter-search">
          <span>Search walls/artwork</span>
          <input data-gallery-curation-filter="search" placeholder="Search title, wall slot, type, or ID" />
        </label>

        <label>
          <span>Display status</span>
          <select data-gallery-curation-filter="status">
            <option value="all">All statuses</option>
            <option value="active">Visible in room</option>
            <option value="hidden">Hidden from room</option>
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
      </div>
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
  const wallDisplayName = image?.title ?? "No artwork assigned";
  const roomId = record.roomId ?? "room-main";
  const roomLabel = state.galleryRoom?.layout?.rooms?.find((room) => room.id === roomId)?.label ?? roomId;
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
  const roomRecords = (state.galleryCuration ?? []).filter((item) =>
    (item.roomId ?? "room-main") === (record.roomId ?? "room-main")
  );
  const collisions = findGalleryPlacementCollisions(roomRecords);
  const boundaryIds = getGalleryPlacementBoundaryIds(roomRecords);
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
  const artworkMeta = image
    ? [getCategoryLabel(state, image.category), image.year, image.location].filter(Boolean).join(" / ")
    : "No image mounted to this wall.";

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
      <div class="gallery-curation-card-header wide">
        <div class="gallery-curation-heading">
          <p class="eyebrow">Wall ${String(index + 1).padStart(2, "0")}</p>
          <div class="gallery-curation-heading-row">
            <div>
              <h3>${escapeHtml(wallDisplayName)}</h3>
              <span>Wall card ${String(index + 1).padStart(2, "0")}</span>
            </div>
            <div class="gallery-curation-heading-controls">
              <label class="gallery-curation-order-field">Order
                <input
                  type="number"
                  min="1"
                  max="${escapeHtml(String(roomRecords.length))}"
                  step="1"
                  value="${escapeHtml(String(index + 1))}"
                  data-gallery-display-order
                  aria-label="Wall card order"
                />
              </label>
              <button
                class="button gallery-curation-visibility-toggle"
                type="button"
                data-toggle-gallery-visibility
                aria-pressed="${showInGallery ? "true" : "false"}"
              >${showInGallery ? "Hide from gallery" : "Show in gallery"}</button>
              <div class="gallery-curation-badge-row" aria-label="Wall status">
              <span class="gallery-curation-badge">${escapeHtml(roomLabel)}</span>
              <span class="gallery-curation-badge" data-gallery-status-badge="${escapeHtml(displayStatus)}">${showInGallery ? "Visible in room" : "Hidden from room"}</span>
              <span class="gallery-curation-badge" data-gallery-placement-badge="${escapeHtml(placementStatus)}">${placedInGallery ? "On map" : "Not on map"}</span>
              <span class="gallery-curation-badge" data-gallery-artwork-badge="${escapeHtml(artworkState)}">${image ? "Artwork assigned" : "Needs artwork"}</span>
              <span class="gallery-curation-badge" data-gallery-wall-type-badge>${escapeHtml(wallTypeMeta.label)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

        <div class="gallery-slot-readout">
          <span>Map position</span>
          <strong>${escapeHtml(placedInGallery ? placementSummary : "Not placed on map")}</strong>
          <small>${escapeHtml(footprintLabel)}</small>
          ${collisionText ? `<p>${escapeHtml(collisionText)}</p>` : ""}
        </div>

        ${renderGalleryWallPreview(state, record, image, wallType, plaqueEnabled, plaqueSide, showInGallery)}
      </div>

      <div class="gallery-curation-fields">
        <section class="gallery-editor-section gallery-selected-artwork wide">
          <div>
            <p class="eyebrow">Assigned artwork</p>
            <h4 data-gallery-curation-selected-title>${escapeHtml(image?.title ?? "No artwork assigned")}</h4>
            <p data-gallery-curation-selected-meta>${image ? `${escapeHtml(artworkMeta)} / ${escapeHtml(image.id)}` : "Use the visual picker or choose an ID from the fallback select."}</p>
          </div>
          <div class="image-overview-actions">
            <button class="button primary" type="button" data-open-artwork-picker>Assign artwork</button>
            <button class="button" type="button" data-open-gallery-preview="artwork">Preview artwork</button>
          </div>
        </section>

        <section class="gallery-editor-section wide">
          <div class="gallery-section-title">
            <div>
              <p class="eyebrow">Wall settings</p>
              <h4>Room behavior</h4>
            </div>
            <span>${escapeHtml(wallTypeMeta.description)}</span>
          </div>

          <div class="gallery-field-grid">
            <label>
              <span>Wall block type</span>
              <select data-gallery-curation-field="wallType">
                ${renderGalleryCurationWallTypeOptions(wallType)}
              </select>
            </label>

            <label>
              <span>Display status</span>
              <select data-gallery-curation-field="showInGallery">
                ${renderGalleryCurationDisplayStatusOptions(showInGallery)}
              </select>
            </label>

            <label>
              <span>Plaque side</span>
              <select data-gallery-curation-field="plaqueSide">
                ${renderGalleryCurationPlaqueSideOptions(plaqueSide)}
              </select>
            </label>

            <label class="check-row gallery-plaque-toggle">
              <input data-gallery-curation-field="plaqueEnabled" type="checkbox" ${plaqueEnabled ? "checked" : ""} />
              <span>Show plaque</span>
            </label>
          </div>

          <div class="gallery-wall-type-note" data-gallery-wall-type-note>
            <span data-gallery-wall-type-label>${escapeHtml(wallTypeMeta.label)}</span>
            <p data-gallery-wall-type-description>${escapeHtml(wallTypeMeta.description)}</p>
          </div>
        </section>

        <details class="gallery-editor-section gallery-advanced-fields wide">
          <summary>Precise artwork ID fallback</summary>
          <label class="fallback-select">
            <span>Assigned artwork ID</span>
            <select data-gallery-curation-field="artworkId">
              ${renderGalleryCurationImageOptions(state, record.artworkId)}
            </select>
          </label>
        </details>

        <div class="gallery-placement-hidden-fields" data-gallery-placement-controls hidden aria-hidden="true">
          <strong data-gallery-placement-state-label>${placedInGallery ? "On map" : "Not on map"}</strong>
          <p data-gallery-placement-footprint>${escapeHtml(footprintLabel)}</p>
          <p data-gallery-placement-warning ${collisionText ? "" : "hidden"}>${escapeHtml(collisionText)}</p>
          <input data-gallery-curation-field="placedInGallery" type="hidden" value="${placedInGallery ? "placed" : "unplaced"}" />
          <input data-gallery-curation-field="roomId" type="hidden" value="${escapeHtml(record.roomId ?? "room-main")}" />
          <input data-gallery-grid-field="gridX" type="hidden" value="${escapeHtml(String(placement.gridX))}" />
          <input data-gallery-grid-field="gridZ" type="hidden" value="${escapeHtml(String(placement.gridZ))}" />
          <input data-gallery-curation-field="positionX" type="hidden" value="${escapeHtml(placement.positionX.toFixed(2))}" />
          <input data-gallery-curation-field="positionZ" type="hidden" value="${escapeHtml(placement.positionZ.toFixed(2))}" />
          <input data-gallery-curation-field="rotationYDegrees" type="hidden" value="${escapeHtml(String(placement.rotationYDegrees))}" />
        </div>

        <div class="gallery-card-actions wide">
          <button class="button primary" type="button" data-save-gallery-curation-wall>Save Wall</button>
          <button class="button" type="button" data-move-gallery-curation="top">Move Top</button>
          <button class="button" type="button" data-move-gallery-curation="up">Move Up</button>
          <button class="button" type="button" data-move-gallery-curation="down">Move Down</button>
          <button class="button danger" type="button" data-remove-gallery-wall-card>Remove Wall</button>
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
  const allRecords = state.galleryCuration ?? [];
  const rooms = state.galleryRoom?.layout?.rooms ?? [];
  const activeRoomId = rooms.some((room) => room.id === state.galleryEditorRoomId)
    ? state.galleryEditorRoomId
    : rooms[0]?.id ?? "room-main";
  const records = allRecords
    .filter((record) => (record.roomId ?? "room-main") === activeRoomId)
    .sort((left, right) => Number(left.displayOrder ?? 0) - Number(right.displayOrder ?? 0));

  if (!elements.galleryCurationList) {
    return;
  }

  if (!allRecords.length) {
    const curationStatus = state.galleryCurationStatus ?? {};
    const fileExists = curationStatus.fileExists;
    const rawRowCount = Number(curationStatus.rawRowCount ?? 0);
    const loadedRowCount = Number(curationStatus.loadedRowCount ?? 0);
    const heading = fileExists === false
      ? "galleryCuration.json was not found."
      : "No gallery wall rows are currently loaded.";
    const description = fileExists === false
      ? "The editor could not find src/data/galleryCuration.json. Restore that file before editing virtual gallery wall assignments."
      : rawRowCount > 0 && loadedRowCount === 0
        ? `src/data/galleryCuration.json exists and contains ${escapeHtml(String(rawRowCount))} raw row${rawRowCount === 1 ? "" : "s"}, but none passed editor normalization. Check for missing wall IDs or duplicate wall IDs.`
        : "src/data/galleryCuration.json exists, but no editable wall assignment rows are available yet. Add a wall card to start curating the virtual gallery.";

    elements.galleryCurationList.innerHTML = `
      <section class="panel backup-empty-state">
        <p class="eyebrow">No loaded gallery rows</p>
        <h2>${heading}</h2>
        <p class="panel-description">${description}</p>
      </section>
    `;
    return;
  }

  elements.galleryCurationList.innerHTML = `
    ${renderGalleryCurationSummary(state, records)}

    ${renderGalleryCurationFilters(state)}

    <div class="gallery-curation-list-header mac-panel-titlebar">
      <strong class="gallery-curation-filter-result" data-gallery-curation-filter-result>
        Showing ${escapeHtml(String(records.length))} wall cards in ${escapeHtml(rooms.find((room) => room.id === activeRoomId)?.label ?? activeRoomId)}.
      </strong>
      <button class="button primary" type="button" data-add-gallery-wall-card>Add Wall Card</button>
    </div>

    <div class="gallery-curation-list" data-gallery-curation-list>
      ${records.length
        ? records.map((record, index) => renderGalleryCurationCard(state, record, index)).join("")
        : `<p class="panel-description">This room has no gallery wall cards yet. Use Add Wall Card to create one here.</p>`}
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
    <div class="backup-toolbar">
      <div>
        <p class="eyebrow">Restore safety</p>
        <h3>Available JSON restore points</h3>
        <p>Restores affect category, image, hero, gallery curation, and gallery room JSON. The current JSON files are backed up before a restore runs.</p>
      </div>
      <button class="button" type="button" data-refresh-backups>Refresh Backups</button>
    </div>

    <div class="backup-list">
      ${backups.map((backup) => {
        const files = backup.files ?? [];
        const fileLabels = files.length ? files.join(", ") : "No JSON files detected";
        const canRestore = Boolean(backup.canRestore);

        return `
          <article class="backup-card" data-backup-card data-backup-folder="${escapeHtml(backup.backupFolder)}" data-backup-restorable="${canRestore ? "true" : "false"}">
            <div class="backup-card-main">
              <p class="eyebrow">${escapeHtml(formatBackupReason(backup.reason))}</p>
              <h3>${escapeHtml(backup.backupFolder)}</h3>
              <p>${escapeHtml(formatBackupDate(backup.createdAtUtc))}</p>
              <p><strong>Files:</strong> ${escapeHtml(fileLabels)}</p>
            </div>

            <div class="backup-card-actions">
              <span class="backup-restore-state">${canRestore ? "Ready to restore" : "Incomplete backup"}</span>
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


function getAboutPhotoAspect(photo) {
  const aspect = Number(photo.imageAspectRatio);

  if (Number.isFinite(aspect) && aspect > 0) {
    return aspect;
  }

  const width = Number(photo.imageWidth);
  const height = Number(photo.imageHeight);

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return width / height;
  }

  return 0.75;
}

function getAboutPhotoOrientation(photo) {
  if (["landscape", "portrait", "square"].includes(photo.imageOrientation)) {
    return photo.imageOrientation;
  }

  const aspect = getAboutPhotoAspect(photo);

  if (Math.abs(aspect - 1) <= 0.04) {
    return "square";
  }

  return aspect > 1 ? "landscape" : "portrait";
}

const ABOUT_PLACEMENT_OPTIONS = [
  { value: "upper-collage", label: "Upper collage (max 2 visible)" },
  { value: "lower-collage", label: "Lower collage" },
  { value: "background-float", label: "Transparent background float" },
  { value: "unused", label: "Unused / staged" }
];

function getAboutPlacementRole(photo) {
  const role = photo?.placementRole ?? "lower-collage";
  return ABOUT_PLACEMENT_OPTIONS.some((option) => option.value === role) ? role : "lower-collage";
}

function renderAboutPlacementOptions(selectedValue) {
  return ABOUT_PLACEMENT_OPTIONS.map((option) => `
    <option value="${escapeHtml(option.value)}" ${option.value === selectedValue ? "selected" : ""}>${escapeHtml(option.label)}</option>
  `).join("");
}

function renderAboutPhotoCard(photo, index) {
  const orientation = getAboutPhotoOrientation(photo);
  const aspect = getAboutPhotoAspect(photo);
  const isActive = photo.isActive !== false;

  return `
    <article class="about-editor-card" data-about-photo-card data-about-photo-id="${escapeHtml(photo.id)}">
      <button class="about-editor-thumb" type="button" data-open-crop-modal="about" data-crop-image-id="${escapeHtml(photo.sourceImageId ?? "")}" data-crop-about-photo-id="${escapeHtml(photo.id)}" aria-label="Adjust crop for ${escapeHtml(photo.title ?? photo.id)}" ${getAboutPlacementRole(photo) === "unused" ? "disabled" : ""}>
        <img src="${escapeHtml(photo.thumbSrc ?? photo.src)}" alt="${escapeHtml(photo.alt ?? photo.title)}" loading="lazy" draggable="false" style="object-position:${escapeHtml(photo.aboutPosition ?? "50% 50%")}" />
        <span>${escapeHtml(String(index + 1).padStart(2, "0"))}</span>
      </button>

      <div class="about-editor-fields">
        <input type="hidden" data-field="sourceType" value="${escapeHtml(photo.sourceType ?? "about")}" />
        <input type="hidden" data-field="sourceImageId" value="${escapeHtml(photo.sourceImageId ?? "")}" />
        <input type="hidden" data-field="aboutPosition" value="${escapeHtml(photo.aboutPosition ?? "50% 50%")}" />
        <input type="hidden" data-field="aboutScale" value="${escapeHtml(String(photo.aboutScale ?? 1))}" />
        <input type="hidden" data-field="backgroundX" value="${escapeHtml(String(photo.backgroundX ?? ""))}" />
        <input type="hidden" data-field="backgroundY" value="${escapeHtml(String(photo.backgroundY ?? ""))}" />
        <input type="hidden" data-field="backgroundWidth" value="${escapeHtml(String(photo.backgroundWidth ?? ""))}" />
        <input type="hidden" data-field="collageX" value="${escapeHtml(String(photo.collageX ?? ""))}" />
        <input type="hidden" data-field="collageY" value="${escapeHtml(String(photo.collageY ?? ""))}" />
        <input type="hidden" data-field="collageWidth" value="${escapeHtml(String(photo.collageWidth ?? ""))}" />
        <input type="hidden" data-field="collageLayer" value="${escapeHtml(String(photo.collageLayer ?? ""))}" />
        <input type="hidden" data-field="collageRotation" value="${escapeHtml(String(photo.collageRotation ?? ""))}" />
        <input type="hidden" data-field="collageOpacity" value="${escapeHtml(String(photo.collageOpacity ?? ""))}" />
        <input type="hidden" data-field="mobileX" value="${escapeHtml(String(photo.mobileX ?? ""))}" />
        <input type="hidden" data-field="mobileY" value="${escapeHtml(String(photo.mobileY ?? ""))}" />
        <input type="hidden" data-field="mobileWidth" value="${escapeHtml(String(photo.mobileWidth ?? ""))}" />
        <input type="hidden" data-field="mobileLayer" value="${escapeHtml(String(photo.mobileLayer ?? ""))}" />
        <input type="hidden" data-field="mobileRotation" value="${escapeHtml(String(photo.mobileRotation ?? ""))}" />
        <input type="hidden" data-field="mobileOpacity" value="${escapeHtml(String(photo.mobileOpacity ?? ""))}" />

        <label>
          <span>ID</span>
          <input data-field="id" value="${escapeHtml(photo.id)}" />
        </label>

        <label>
          <span>Title</span>
          <input data-field="title" value="${escapeHtml(photo.title ?? "")}" />
        </label>

        <label class="checkbox about-active-control">
          <input type="checkbox" data-field="isActive" ${isActive ? "checked" : ""} />
          <span>Use on About page</span>
        </label>

        <label>
          <span>About placement</span>
          <select data-field="placementRole">
            ${renderAboutPlacementOptions(getAboutPlacementRole(photo))}
          </select>
        </label>

        <label>
          <span>Year</span>
          <input data-field="year" value="${escapeHtml(photo.year ?? "")}" />
        </label>

        <label>
          <span>Location</span>
          <input data-field="location" value="${escapeHtml(photo.location ?? "")}" />
        </label>

        <label class="wide">
          <span>Alt text</span>
          <input data-field="alt" value="${escapeHtml(photo.alt ?? "")}" />
        </label>

        <label>
          <span>Display source</span>
          <input data-field="src" value="${escapeHtml(photo.src ?? "")}" />
        </label>

        <label>
          <span>Thumbnail source</span>
          <input data-field="thumbSrc" value="${escapeHtml(photo.thumbSrc ?? "")}" />
        </label>

        <label>
          <span>Full source</span>
          <input data-field="fullSrc" value="${escapeHtml(photo.fullSrc ?? "")}" />
        </label>

        <label>
          <span>Image width</span>
          <input data-field="imageWidth" value="${escapeHtml(String(photo.imageWidth ?? ""))}" readonly />
        </label>

        <label>
          <span>Image height</span>
          <input data-field="imageHeight" value="${escapeHtml(String(photo.imageHeight ?? ""))}" readonly />
        </label>

        <label>
          <span>Aspect ratio</span>
          <input data-field="imageAspectRatio" value="${escapeHtml(String(photo.imageAspectRatio ?? aspect.toFixed(6)))}" readonly />
        </label>

        <label>
          <span>Orientation</span>
          <input data-field="imageOrientation" value="${escapeHtml(orientation)}" readonly />
        </label>

        <label class="wide">
          <span>Note</span>
          <textarea data-field="note">${escapeHtml(photo.note ?? "")}</textarea>
        </label>

        ${getAboutPlacementRole(photo) === "unused"
          ? `<p class="editor-inline-note wide">Crop is unavailable while this photo is unused. Choose an active placement first.</p>`
          : ""}

        <div class="about-editor-actions wide">
          <button class="button" type="button" data-move-about-photo="top">Top</button>
          <button class="button" type="button" data-move-about-photo="up">Up</button>
          <button class="button" type="button" data-move-about-photo="down">Down</button>
          <button class="button danger" type="button" data-remove-about-photo>Remove</button>
        </div>
      </div>
    </article>
  `;
}

function renderAboutImportCard(item, index) {
  return `
    <article class="about-import-card" data-about-import-card data-import-index="${index}">
      <button class="about-import-thumb" type="button" data-about-import-preview="${index}">
        <img src="${escapeHtml(item.previewUrl)}" alt="" draggable="false" />
        <span>${escapeHtml(String(index + 1).padStart(2, "0"))}</span>
      </button>

      <div class="about-import-fields">
        <input type="hidden" data-import-field="originalFilename" value="${escapeHtml(item.originalFilename)}" />
        <input type="hidden" data-import-field="imageWidth" value="${escapeHtml(String(item.imageWidth ?? ""))}" />
        <input type="hidden" data-import-field="imageHeight" value="${escapeHtml(String(item.imageHeight ?? ""))}" />
        <input type="hidden" data-import-field="imageAspectRatio" value="${escapeHtml(String(item.imageAspectRatio ?? ""))}" />
        <input type="hidden" data-import-field="imageOrientation" value="${escapeHtml(item.imageOrientation ?? "portrait")}" />

        <label>
          <span>ID</span>
          <input data-import-field="id" value="${escapeHtml(item.id)}" />
        </label>

        <label>
          <span>Title</span>
          <input data-import-field="title" value="${escapeHtml(item.title)}" />
        </label>

        <label>
          <span>Year</span>
          <input data-import-field="year" value="${escapeHtml(item.year ?? "")}" />
        </label>

        <label>
          <span>Location</span>
          <input data-import-field="location" value="${escapeHtml(item.location ?? "")}" />
        </label>

        <label>
          <span>About placement</span>
          <select data-import-field="placementRole">
            ${renderAboutPlacementOptions(item.placementRole ?? "lower-collage")}
          </select>
        </label>

        <label class="wide">
          <span>Alt text</span>
          <input data-import-field="alt" value="${escapeHtml(item.alt ?? "")}" />
        </label>

        <label class="wide">
          <span>Note</span>
          <textarea data-import-field="note">${escapeHtml(item.note ?? "")}</textarea>
        </label>

        <div class="import-pipeline-summary wide">
          <p class="eyebrow">About output</p>
          <strong>Will write into public/images/about/</strong>
          <div class="import-path-grid">
            <span>display</span><code>/images/about/display/${escapeHtml(item.id)}.webp</code>
            <span>thumb</span><code>/images/about/thumb/${escapeHtml(item.id)}.webp</code>
            <span>full</span><code>/images/about/full/${escapeHtml(item.id)}.webp</code>
          </div>
        </div>

        <button class="button danger wide" type="button" data-remove-about-import="${index}">Remove from About Import</button>
      </div>
    </article>
  `;
}

export function renderAboutImportReview(elements, pendingAboutImportItems) {
  if (!elements.aboutImportReviewList) {
    return;
  }

  elements.aboutImportReviewList.innerHTML = pendingAboutImportItems.length
    ? pendingAboutImportItems.map((item, index) => renderAboutImportCard(item, index)).join("")
    : "";
}

function getAboutSectionEntries(aboutPhotos, placementRole) {
  return aboutPhotos
    .map((photo, index) => ({ photo, index }))
    .filter((entry) => getAboutPlacementRole(entry.photo) === placementRole);
}

function renderAboutPhotoSection({ title, eyebrow, description, placementRole, entries, usageNote }) {
  const activeCount = entries.filter((entry) => entry.photo.isActive !== false).length;
  const emptyMessage = `No ${title.toLowerCase()} records yet.`;

  return `
    <details class="about-editor-section panel" data-about-placement-section="${escapeHtml(placementRole)}" open>
      <summary class="about-editor-section-header">
        <div>
          <p class="eyebrow">${escapeHtml(eyebrow)}</p>
          <h3>${escapeHtml(title)}</h3>
          <p class="panel-description">${escapeHtml(description)}</p>
          ${usageNote ? `<p class="about-editor-usage-note">${escapeHtml(usageNote)}</p>` : ""}
        </div>
        <div class="about-editor-section-counts" aria-label="${escapeHtml(title)} counts">
          <span><strong>${escapeHtml(String(entries.length))}</strong> total</span>
          <span><strong>${escapeHtml(String(activeCount))}</strong> active</span>
        </div>
      </summary>

      <div class="about-editor-section-list" data-about-photo-section-list>
        ${entries.length
          ? entries.map((entry) => renderAboutPhotoCard(entry.photo, entry.index)).join("")
          : `<div class="about-editor-empty-state">${escapeHtml(emptyMessage)}</div>`}
      </div>
    </details>
  `;
}

function renderAboutPortfolioLibrary(state) {
  const images = state.images ?? [];
  const categoryOptionsMarkup = [
    `<option value="all">All categories</option>`,
    ...(state.categories ?? []).map((category) => (
      `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`
    ))
  ].join("");

  return `
    <details class="about-portfolio-library panel">
      <summary>
        <span>
          <strong>Add from Portfolio Library</strong>
          <small>Choose from all ${escapeHtml(String(images.length))} uploaded images</small>
        </span>
      </summary>
      <div class="about-portfolio-library-tools">
        <label>
          <span>Find an image</span>
          <input type="search" data-about-library-search placeholder="Search title, ID, year, or location" />
        </label>
        <label>
          <span>Category</span>
          <select data-about-library-category>${categoryOptionsMarkup}</select>
        </label>
        <label>
          <span>Add to</span>
          <select data-about-library-placement>
            <option value="unused">Unused / staged</option>
            <option value="upper-collage">Upper collage</option>
            <option value="lower-collage">Lower collage</option>
            <option value="background-float">Background float</option>
          </select>
        </label>
        <output data-about-library-result>${escapeHtml(String(images.length))} images shown</output>
      </div>
      <div class="about-portfolio-library-grid">
        ${images.map((image) => {
          const alreadyAdded = isImageAlreadyInAboutPhotos(state, image.id);
          const searchText = [image.title, image.id, image.year, image.location, image.category]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return `
            <article
              class="about-portfolio-library-card"
              data-about-library-card
              data-about-library-category="${escapeHtml(image.category ?? "")}"
              data-about-library-search-text="${escapeHtml(searchText)}"
            >
              <img src="${escapeHtml(image.thumbSrc ?? image.src)}" alt="" loading="lazy" />
              <div>
                <strong>${escapeHtml(image.title ?? image.id)}</strong>
                <small>${escapeHtml([image.category, image.year].filter(Boolean).join(" / "))}</small>
              </div>
              <button
                class="button"
                type="button"
                data-about-library-add="${escapeHtml(image.id)}"
                ${alreadyAdded ? "disabled" : ""}
              >${alreadyAdded ? "Added" : "Add"}</button>
            </article>
          `;
        }).join("")}
      </div>
    </details>
  `;
}

const ABOUT_BACKGROUND_PREVIEW_POSITIONS = [
  { x: -15, y: 0, width: 56 },
  { x: 62, y: -1, width: 54 },
  { x: -18, y: 25, width: 52 },
  { x: 62, y: 33, width: 56 },
  { x: 39, y: 40.2, width: 34 },
  { x: 63, y: 44.7, width: 54 },
  { x: -17, y: 59.5, width: 55 },
  { x: 64, y: 60.7, width: 52 }
];

const ABOUT_UPPER_PREVIEW_LAYOUT = [
  { x: 10, y: 3, width: 88 },
  { x: 29, y: 31, width: 54 }
];

const ABOUT_LOWER_PREVIEW_LAYOUT = [
  { x: 18, y: 14, width: 42, aspect: 270 / 470 },
  { x: 42, y: 23, width: 36, aspect: 230 / 340 },
  { x: 5, y: 55, width: 35, aspect: 220 / 300 },
  { x: 55, y: 58, width: 38, aspect: 250 / 290 },
  { x: 60, y: 7, width: 28, aspect: 180 / 250 },
  { x: 14, y: 4, width: 24, aspect: 160 / 180 }
];

const ABOUT_UPPER_PREVIEW_ROTATIONS = [0.4, -0.8];
const ABOUT_LOWER_PREVIEW_ROTATIONS = [-0.6, 1.4, -2, 2, -3, 3];
const ABOUT_BACKGROUND_PREVIEW_ROTATIONS = [-4, 2, 4, -1, -2, 3, 1, -5];
const ABOUT_LOWER_PREVIEW_OPACITIES = [1, 0.9, 0.78, 0.62, 0.28, 0.28];
const ABOUT_UPPER_PREVIEW_LAYERS = [2, 3];
const ABOUT_LOWER_PREVIEW_LAYERS = [4, 3, 2, 1, 1, 1];

function getAboutPreviewImageSource(photo) {
  return photo.fullSrc ?? photo.src ?? photo.thumbSrc ?? "";
}

function getAboutPreviewSourceAspect(photo) {
  const numericAspect = Number(photo.imageAspectRatio);
  if (Number.isFinite(numericAspect) && numericAspect > 0) return numericAspect;
  if (photo.imageOrientation === "landscape") return 3 / 2;
  if (photo.imageOrientation === "square") return 1;
  return 2 / 3;
}

function renderAboutForegroundEditorPhoto(entry, index, group) {
  const fallback = group === "upper"
    ? ABOUT_UPPER_PREVIEW_LAYOUT[index]
    : ABOUT_LOWER_PREVIEW_LAYOUT[index];
  const aspect = group === "upper" && index === 0
    ? getAboutPreviewSourceAspect(entry.photo)
    : fallback.aspect ?? 390 / 470;
  const x = Number.isFinite(Number(entry.photo.collageX)) ? Number(entry.photo.collageX) : fallback.x;
  const y = Number.isFinite(Number(entry.photo.collageY)) ? Number(entry.photo.collageY) : fallback.y;
  const width = Number.isFinite(Number(entry.photo.collageWidth)) ? Number(entry.photo.collageWidth) : fallback.width;
  const fallbackLayer = group === "upper"
    ? ABOUT_UPPER_PREVIEW_LAYERS[index] ?? index + 1
    : ABOUT_LOWER_PREVIEW_LAYERS[index] ?? index + 1;
  const layer = Number.isFinite(Number(entry.photo.collageLayer)) ? Number(entry.photo.collageLayer) : fallbackLayer;
  const fallbackRotation = group === "upper"
    ? ABOUT_UPPER_PREVIEW_ROTATIONS[index]
    : ABOUT_LOWER_PREVIEW_ROTATIONS[index];
  const rotation = Number.isFinite(Number(entry.photo.collageRotation))
    ? Number(entry.photo.collageRotation)
    : fallbackRotation ?? 0;
  const fallbackOpacity = group === "lower" ? ABOUT_LOWER_PREVIEW_OPACITIES[index] ?? 1 : 1;
  const opacity = Number.isFinite(Number(entry.photo.collageOpacity))
    ? Number(entry.photo.collageOpacity)
    : fallbackOpacity;

  return `
    <button
      class="about-collage-foreground about-collage-${group}-${index + 1}"
      type="button"
      data-about-collage-photo="${escapeHtml(entry.photo.id)}"
      data-about-collage-title="${escapeHtml(entry.photo.title ?? entry.photo.id)}"
      data-about-collage-kind="foreground"
      data-about-collage-aspect="${aspect}"
      data-default-x="${fallback.x}"
      data-default-y="${fallback.y}"
      data-default-width="${fallback.width}"
      data-default-layer="${fallbackLayer}"
      data-default-rotation="${fallbackRotation ?? 0}"
      data-default-opacity="${fallbackOpacity}"
      data-desktop-x="${x}" data-desktop-y="${y}" data-desktop-width="${width}"
      data-desktop-layer="${layer}" data-desktop-rotation="${rotation}" data-desktop-opacity="${opacity}"
      data-mobile-x="${Number.isFinite(Number(entry.photo.mobileX)) ? Number(entry.photo.mobileX) : x}"
      data-mobile-y="${Number.isFinite(Number(entry.photo.mobileY)) ? Number(entry.photo.mobileY) : y}"
      data-mobile-width="${Number.isFinite(Number(entry.photo.mobileWidth)) ? Number(entry.photo.mobileWidth) : width}"
      data-mobile-layer="${Number.isFinite(Number(entry.photo.mobileLayer)) ? Number(entry.photo.mobileLayer) : layer}"
      data-mobile-rotation="${Number.isFinite(Number(entry.photo.mobileRotation)) ? Number(entry.photo.mobileRotation) : rotation}"
      data-mobile-opacity="${Number.isFinite(Number(entry.photo.mobileOpacity)) ? Number(entry.photo.mobileOpacity) : opacity}"
      style="left:${x}%;right:auto;top:${y}%;bottom:auto;width:${width}%;height:auto;aspect-ratio:${aspect};--collage-layer:${layer};--collage-rotation:${rotation}deg;--collage-opacity:${opacity};"
      aria-label="Move ${escapeHtml(entry.photo.title ?? entry.photo.id)}"
    >
      <img src="${escapeHtml(getAboutPreviewImageSource(entry.photo))}" alt="" draggable="false" />
      <span>${escapeHtml(String(index + 1).padStart(2, "0"))}</span>
      <i class="about-collage-resize-handle is-nw" data-about-collage-resize="nw" aria-hidden="true"></i>
      <i class="about-collage-resize-handle is-ne" data-about-collage-resize="ne" aria-hidden="true"></i>
      <i class="about-collage-resize-handle is-sw" data-about-collage-resize="sw" aria-hidden="true"></i>
      <i class="about-collage-resize-handle is-se" data-about-collage-resize="se" aria-hidden="true"></i>
    </button>
  `;
}

function renderAboutBackgroundPreview(state, backgroundEntries) {
  const copy = getAboutCopy(state);
  const activeBackgroundEntries = backgroundEntries
    .filter((entry) => entry.photo.isActive !== false)
    .slice(0, 8);
  const upperPhotos = getAboutSectionEntries(state.aboutPhotos ?? [], "upper-collage")
    .filter((entry) => entry.photo.isActive !== false)
    .slice(0, 2);
  const lowerPhotos = getAboutSectionEntries(state.aboutPhotos ?? [], "lower-collage")
    .filter((entry) => entry.photo.isActive !== false)
    .slice(0, 6);

  return `
    <section class="about-collage-launcher panel">
      <div>
        <p class="eyebrow">Visual Layout</p>
        <h2>About collage composition</h2>
        <p>Open a fullscreen desktop mockup to arrange the foreground collages and background photographs.</p>
      </div>
      <button class="button primary" type="button" data-open-about-collage>Open Visual Editor</button>
    </section>

    <div class="about-collage-modal" data-about-collage-modal hidden>
    <section class="about-collage-workspace panel" data-about-collage-workspace data-about-preview-mode="desktop" data-preview-only="false" role="dialog" aria-modal="true" aria-label="About collage editor">
      <div class="mac-panel-titlebar">
        <strong>Visual About Collage</strong>
        <span class="about-collage-window-controls">
          <span data-about-collage-mode-label>Desktop preview / 1440px composition</span>
          <span class="about-collage-device-switcher" role="group" aria-label="About page preview size">
            <button type="button" data-about-preview-mode="desktop" aria-pressed="true">Desktop</button>
            <button type="button" data-about-preview-mode="tablet" aria-pressed="false">Tablet</button>
            <button type="button" data-about-preview-mode="mobile" aria-pressed="false">Mobile</button>
          </span>
          <button class="about-collage-undo" type="button" data-undo-about-collage disabled title="Undo last move or resize">Undo</button>
          <button class="about-collage-layer-toggle" type="button" data-toggle-about-collage-landmarks aria-pressed="false" title="Hide page copy and foreground collage">Background Only</button>
          <button type="button" data-accept-about-collage aria-label="Apply and save collage arrangement" title="Apply arrangement">✓</button>
          <button type="button" data-cancel-about-collage aria-label="Exit without applying collage arrangement" title="Exit without applying">×</button>
        </span>
      </div>
      <div class="about-collage-workspace-heading">
        <div>
          <p class="eyebrow">About Page Composition</p>
          <h2>Arrange the About page collages</h2>
          <p>
            Select, move, and resize photographs in the independent Desktop or Mobile composition. Tablet remains preview-only.
          </p>
        </div>
        <div class="about-collage-preview-status" data-about-collage-preview-status>
          <strong>No image selected</strong>
          <span>Choose ✓ to apply this arrangement or × to exit without applying.</span>
          <output data-about-collage-values>Position — / Size — / Rotation — / Opacity — / Layer —</output>
          <div class="about-collage-selection-actions">
            <button type="button" data-about-collage-layer="-1" disabled>Send Backward</button>
            <button type="button" data-about-collage-layer="1" disabled>Bring Forward</button>
            <button type="button" data-about-collage-rotate="-1" disabled>Rotate Left</button>
            <button type="button" data-about-collage-rotate="1" disabled>Rotate Right</button>
            <label class="about-collage-opacity-field">
              <span>Opacity</span>
              <input type="number" min="0" max="100" step="1" data-about-collage-opacity disabled />
              <span>%</span>
            </label>
            <button type="button" data-reset-about-collage-photo disabled>Reset Selected</button>
          </div>
          <span class="sr-only" data-about-collage-announcer role="status" aria-live="polite" aria-atomic="true"></span>
        </div>
      </div>

      <div class="about-collage-viewport" data-about-collage-viewport>
        <div class="about-collage-page" data-about-collage-page>
          ${activeBackgroundEntries.map((entry, index) => {
            const fallbackPosition = ABOUT_BACKGROUND_PREVIEW_POSITIONS[index] ?? { x: 40, y: 40 };
            const position = {
              x: Number.isFinite(Number(entry.photo.backgroundX)) ? Number(entry.photo.backgroundX) : fallbackPosition.x,
              y: Number.isFinite(Number(entry.photo.backgroundY)) ? Number(entry.photo.backgroundY) : fallbackPosition.y
            };
            const width = Number.isFinite(Number(entry.photo.backgroundWidth))
              ? Math.max(12, Math.min(90, Number(entry.photo.backgroundWidth)))
              : fallbackPosition.width;
            const layer = Number.isFinite(Number(entry.photo.collageLayer)) ? Number(entry.photo.collageLayer) : index + 1;
            const rotation = Number.isFinite(Number(entry.photo.collageRotation))
              ? Number(entry.photo.collageRotation)
              : ABOUT_BACKGROUND_PREVIEW_ROTATIONS[index] ?? 0;
            const fallbackOpacity = index === 4 ? 0.14 : 0.16;
            const opacity = Number.isFinite(Number(entry.photo.collageOpacity))
              ? Number(entry.photo.collageOpacity)
              : fallbackOpacity;
            return `
              <button
                class="about-collage-background-photo about-collage-background-photo-${index + 1}"
                type="button"
                data-about-collage-photo="${escapeHtml(entry.photo.id)}"
                data-about-collage-title="${escapeHtml(entry.photo.title ?? entry.photo.id)}"
                data-about-collage-kind="background"
                data-about-collage-aspect="0.75"
                data-default-x="${fallbackPosition.x}"
                data-default-y="${fallbackPosition.y}"
                data-default-width="${fallbackPosition.width}"
                data-default-layer="${index + 1}"
                data-default-rotation="${ABOUT_BACKGROUND_PREVIEW_ROTATIONS[index] ?? 0}"
                data-default-opacity="${fallbackOpacity}"
                data-desktop-x="${position.x}" data-desktop-y="${position.y}" data-desktop-width="${width}"
                data-desktop-layer="${layer}" data-desktop-rotation="${rotation}" data-desktop-opacity="${opacity}"
                data-mobile-x="${Number.isFinite(Number(entry.photo.mobileX)) ? Number(entry.photo.mobileX) : position.x}"
                data-mobile-y="${Number.isFinite(Number(entry.photo.mobileY)) ? Number(entry.photo.mobileY) : position.y}"
                data-mobile-width="${Number.isFinite(Number(entry.photo.mobileWidth)) ? Number(entry.photo.mobileWidth) : width}"
                data-mobile-layer="${Number.isFinite(Number(entry.photo.mobileLayer)) ? Number(entry.photo.mobileLayer) : layer}"
                data-mobile-rotation="${Number.isFinite(Number(entry.photo.mobileRotation)) ? Number(entry.photo.mobileRotation) : rotation}"
                data-mobile-opacity="${Number.isFinite(Number(entry.photo.mobileOpacity)) ? Number(entry.photo.mobileOpacity) : opacity}"
                style="left:${position.x}%;top:${position.y}%;width:${width}%;--collage-layer:${layer};--collage-rotation:${rotation}deg;--collage-opacity:${opacity};"
                tabindex="-1"
                aria-label="Move ${escapeHtml(entry.photo.title ?? entry.photo.id)}"
              >
                <img src="${escapeHtml(getAboutPreviewImageSource(entry.photo))}" alt="" draggable="false" />
                <span>${escapeHtml(String(index + 1).padStart(2, "0"))}</span>
                <i class="about-collage-resize-handle is-nw" data-about-collage-resize="nw" aria-hidden="true"></i>
                <i class="about-collage-resize-handle is-ne" data-about-collage-resize="ne" aria-hidden="true"></i>
                <i class="about-collage-resize-handle is-sw" data-about-collage-resize="sw" aria-hidden="true"></i>
                <i class="about-collage-resize-handle is-se" data-about-collage-resize="se" aria-hidden="true"></i>
              </button>
            `;
          }).join("")}

          <div class="about-collage-site-header">
            <strong>TAYLOR PIKE</strong>
            <span>PHOTOGRAPHER + CREATIVE</span>
            <nav>HOME&nbsp;&nbsp;&nbsp; PORTFOLIO&nbsp;&nbsp;&nbsp; GALLERY&nbsp;&nbsp;&nbsp; ABOUT</nav>
          </div>

          <section class="about-collage-page-section about-collage-page-hero">
            <div class="about-collage-copy-card">
              <small>${escapeHtml(copy.hero.eyebrow)}</small>
              <h3>${escapeHtml(copy.hero.headline)}</h3>
              <p>${escapeHtml(copy.hero.intro)}</p>
            </div>
            <div class="about-collage-upper-stack">
              ${upperPhotos.map((entry, index) => renderAboutForegroundEditorPhoto(entry, index, "upper")).join("")}
            </div>
          </section>

          <section class="about-collage-page-section about-collage-page-writing">
            <div class="about-collage-wide-copy">
              <small>${escapeHtml(copy.about.eyebrow)}</small>
              <h3>${escapeHtml(copy.about.heading)}</h3>
              <p>${escapeHtml(copy.about.paragraphs.join(" "))}</p>
            </div>
          </section>

          <section class="about-collage-page-section about-collage-page-project">
            <div class="about-collage-lower-stack">
              ${lowerPhotos.map((entry, index) => renderAboutForegroundEditorPhoto(entry, index, "lower")).join("")}
            </div>
            <div class="about-collage-copy-card">
              <small>${escapeHtml(copy.project.eyebrow)}</small>
              <h3>${escapeHtml(copy.project.heading)}</h3>
              <p>${escapeHtml(copy.project.paragraphs.join(" "))}</p>
            </div>
          </section>

          <section class="about-collage-page-section about-collage-page-writing">
            <div class="about-collage-wide-copy">
              <small>${escapeHtml(copy.additional.eyebrow)}</small>
              <h3>${escapeHtml(copy.additional.heading)}</h3>
              <p>${escapeHtml(copy.additional.paragraphs.join(" "))}</p>
            </div>
          </section>

          <section class="about-collage-page-section about-collage-page-contact">
            <div class="about-collage-wide-copy">
              <small>${escapeHtml(copy.contact.eyebrow)}</small>
              <h3>${escapeHtml(copy.contact.headline)}</h3>
              <p>${escapeHtml(copy.contact.body)}</p>
            </div>
          </section>
        </div>
      </div>
    </section>
    </div>
  `;
}


const FALLBACK_ABOUT_COPY = {
  hero: {
    eyebrow: "About / Contact",
    headline: "A reserved space for the personal side of the archive.",
    intro: "Placeholder copy. Replace this with your final About introduction when you are ready."
  },
  about: {
    eyebrow: "About Me",
    heading: "Personal background",
    paragraphs: [
      "Placeholder copy. Use this block for the short version of who you are, where you are from, and what shaped your creative point of view.",
      "Placeholder copy. Use this second paragraph for photography, climbing, community, technical work, and the personal thread between them."
    ]
  },
  project: {
    eyebrow: "Photography / Project",
    heading: "Creative practice, technical crossover, and the archive system.",
    paragraphs: [
      "Placeholder copy. Use this block for how you think about photography, climbing, landscape, portrait work, commercial work, visual storytelling, and building this site as an evolving archive.",
      "Placeholder copy. Use this block for the bridge between photography, editing, web development, support work, and the interactive gallery concept."
    ]
  },
  additional: {
    eyebrow: "Additional Notes",
    heading: "A third space for the story still taking shape.",
    paragraphs: [
      "Placeholder copy. Use this section to expand on an idea that does not fit naturally into the biography or project-practice sections above.",
      "Placeholder copy. This can become a note about process, influences, current direction, selected experience, or the relationship between the archive and future work."
    ]
  },
  contact: {
    eyebrow: "Contact",
    headline: "Available for selected projects, collaborations, and image work.",
    body: "Placeholder copy. Replace this with your preferred contact language and availability notes.",
    email: "jtaylorpike@gmail.com",
    links: []
  }
};

function getAboutCopy(state) {
  const copy = state.aboutCopy ?? {};

  return {
    hero: {
      eyebrow: copy.hero?.eyebrow ?? FALLBACK_ABOUT_COPY.hero.eyebrow,
      headline: copy.hero?.headline ?? FALLBACK_ABOUT_COPY.hero.headline,
      intro: copy.hero?.intro ?? FALLBACK_ABOUT_COPY.hero.intro
    },
    about: {
      eyebrow: copy.about?.eyebrow ?? FALLBACK_ABOUT_COPY.about.eyebrow,
      heading: copy.about?.heading ?? FALLBACK_ABOUT_COPY.about.heading,
      paragraphs: Array.isArray(copy.about?.paragraphs) && copy.about.paragraphs.length ? copy.about.paragraphs : FALLBACK_ABOUT_COPY.about.paragraphs
    },
    project: {
      eyebrow: copy.project?.eyebrow ?? FALLBACK_ABOUT_COPY.project.eyebrow,
      heading: copy.project?.heading ?? FALLBACK_ABOUT_COPY.project.heading,
      paragraphs: Array.isArray(copy.project?.paragraphs) && copy.project.paragraphs.length ? copy.project.paragraphs : FALLBACK_ABOUT_COPY.project.paragraphs
    },
    additional: {
      eyebrow: copy.additional?.eyebrow ?? FALLBACK_ABOUT_COPY.additional.eyebrow,
      heading: copy.additional?.heading ?? FALLBACK_ABOUT_COPY.additional.heading,
      paragraphs: Array.isArray(copy.additional?.paragraphs) && copy.additional.paragraphs.length ? copy.additional.paragraphs : FALLBACK_ABOUT_COPY.additional.paragraphs
    },
    contact: {
      eyebrow: copy.contact?.eyebrow ?? FALLBACK_ABOUT_COPY.contact.eyebrow,
      headline: copy.contact?.headline ?? FALLBACK_ABOUT_COPY.contact.headline,
      body: copy.contact?.body ?? FALLBACK_ABOUT_COPY.contact.body,
      email: copy.contact?.email ?? FALLBACK_ABOUT_COPY.contact.email,
      links: Array.isArray(copy.contact?.links) ? copy.contact.links : []
    }
  };
}

function renderAboutCopyInput(fieldName, label, value) {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <input data-about-copy-field="${escapeHtml(fieldName)}" value="${escapeHtml(value ?? "")}" />
    </label>
  `;
}

function renderAboutCopyTextarea(fieldName, label, value, className = "wide") {
  return `
    <label class="${escapeHtml(className)}">
      <span>${escapeHtml(label)}</span>
      <textarea data-about-copy-field="${escapeHtml(fieldName)}">${escapeHtml(value ?? "")}</textarea>
    </label>
  `;
}

function renderAboutCopyPanel({ eyebrow, title, description, fields }) {
  return `
    <section class="about-copy-editor-panel panel">
      <div class="about-copy-editor-heading">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h3>${escapeHtml(title)}</h3>
        <p class="panel-description">${escapeHtml(description)}</p>
      </div>
      <div class="about-copy-editor-fields">
        ${fields.join("")}
      </div>
    </section>
  `;
}

function renderAboutContactLinkFields(links) {
  const editableLinks = [0, 1, 2, 3].map((index) => links[index] ?? { label: "", url: "" });

  return editableLinks.map((link, index) => `
    <div class="about-copy-link-row">
      ${renderAboutCopyInput(`contact.links.${index}.label`, `Link ${index + 1} label`, link.label ?? "")}
      ${renderAboutCopyInput(`contact.links.${index}.url`, `Link ${index + 1} URL`, link.url ?? "")}
    </div>
  `).join("");
}

function renderAboutCopyEditor(state) {
  const copy = getAboutCopy(state);

  return `
    <section class="about-copy-editor-summary panel" data-about-copy-editor>
      <p class="eyebrow">About Copy</p>
      <h2>Public About/contact text</h2>
      <p class="panel-description">
        Edit the structured text fields that feed the public About page. This keeps final copy user-authored while removing copy changes from source-code edits.
      </p>
    </section>

    ${renderAboutCopyPanel({
      eyebrow: "Hero / Intro",
      title: "Top About block",
      description: "Controls the first text block beside the upper photo collage.",
      fields: [
        renderAboutCopyInput("hero.eyebrow", "Eyebrow", copy.hero.eyebrow),
        renderAboutCopyInput("hero.headline", "Headline", copy.hero.headline),
        renderAboutCopyTextarea("hero.intro", "Intro paragraph", copy.hero.intro)
      ]
    })}

    ${renderAboutCopyPanel({
      eyebrow: "Main writing band",
      title: "About Me block",
      description: "Controls the full-width copy band below the upper collage.",
      fields: [
        renderAboutCopyInput("about.eyebrow", "Eyebrow", copy.about.eyebrow),
        renderAboutCopyInput("about.heading", "Heading", copy.about.heading),
        renderAboutCopyTextarea("about.paragraphs.0", "Paragraph 1", copy.about.paragraphs[0] ?? ""),
        renderAboutCopyTextarea("about.paragraphs.1", "Paragraph 2", copy.about.paragraphs[1] ?? "")
      ]
    })}

    ${renderAboutCopyPanel({
      eyebrow: "Project / Practice",
      title: "Secondary copy block",
      description: "Controls the copy block beside the lower foreground collage.",
      fields: [
        renderAboutCopyInput("project.eyebrow", "Eyebrow", copy.project.eyebrow),
        renderAboutCopyInput("project.heading", "Heading", copy.project.heading),
        renderAboutCopyTextarea("project.paragraphs.0", "Paragraph 1", copy.project.paragraphs[0] ?? ""),
        renderAboutCopyTextarea("project.paragraphs.1", "Paragraph 2", copy.project.paragraphs[1] ?? "")
      ]
    })}

    ${renderAboutCopyPanel({
      eyebrow: "Additional Copy",
      title: "Third copy block",
      description: "Controls the full-width copy section between the project block and Contact.",
      fields: [
        renderAboutCopyInput("additional.eyebrow", "Eyebrow", copy.additional.eyebrow),
        renderAboutCopyInput("additional.heading", "Heading", copy.additional.heading),
        renderAboutCopyTextarea("additional.paragraphs.0", "Paragraph 1", copy.additional.paragraphs[0] ?? ""),
        renderAboutCopyTextarea("additional.paragraphs.1", "Paragraph 2", copy.additional.paragraphs[1] ?? "")
      ]
    })}

    ${renderAboutCopyPanel({
      eyebrow: "Contact",
      title: "Contact card",
      description: "Controls the lower contact section. Optional links render only when both label and URL are filled in.",
      fields: [
        renderAboutCopyInput("contact.eyebrow", "Eyebrow", copy.contact.eyebrow),
        renderAboutCopyInput("contact.headline", "Headline", copy.contact.headline),
        renderAboutCopyTextarea("contact.body", "Body text", copy.contact.body),
        renderAboutCopyInput("contact.email", "Email", copy.contact.email),
        `<div class="about-copy-links wide">${renderAboutContactLinkFields(copy.contact.links)}</div>`
      ]
    })}
  `;
}

function renderAboutPage(state, elements) {
  if (elements.aboutCopyEditor) {
    elements.aboutCopyEditor.innerHTML = renderAboutCopyEditor(state);
  }

  const aboutPhotos = state.aboutPhotos ?? [];
  const activeCount = aboutPhotos.filter((photo) => photo.isActive !== false).length;
  const nativeCount = aboutPhotos.filter((photo) => photo.sourceType !== "portfolio-reference").length;
  const referenceCount = aboutPhotos.length - nativeCount;
  const upperEntries = getAboutSectionEntries(aboutPhotos, "upper-collage");
  const lowerEntries = getAboutSectionEntries(aboutPhotos, "lower-collage");
  const backgroundEntries = getAboutSectionEntries(aboutPhotos, "background-float");
  const unusedEntries = getAboutSectionEntries(aboutPhotos, "unused");

  elements.aboutPhotoList.innerHTML = `
    ${renderAboutPortfolioLibrary(state)}

    <section class="about-editor-summary panel">
      <div class="mac-panel-titlebar">
        <strong>About Archive Status</strong>
        <span>${escapeHtml(String(aboutPhotos.length))} records</span>
      </div>
      <div class="about-editor-summary-ledger">
        <span><strong>${escapeHtml(String(aboutPhotos.length))}</strong> total</span>
        <span><strong>${escapeHtml(String(activeCount))}</strong> active</span>
        <span><strong>${escapeHtml(String(nativeCount))}</strong> about-native</span>
        <span><strong>${escapeHtml(String(referenceCount))}</strong> portfolio references</span>
        <span><strong>${escapeHtml(String(upperEntries.length))}</strong> upper collage</span>
        <span><strong>${escapeHtml(String(lowerEntries.length))}</strong> lower collage</span>
        <span><strong>${escapeHtml(String(backgroundEntries.length))}</strong> background floats</span>
        <span><strong>${escapeHtml(String(unusedEntries.length))}</strong> unused</span>
      </div>
    </section>

    ${renderAboutBackgroundPreview(state, backgroundEntries)}

    <div class="about-editor-list" data-about-photo-list>
      ${renderAboutPhotoSection({
        title: "Upper collage",
        eyebrow: "Foreground collage A",
        description: "Controls the top-right foreground stack on the public About page.",
        placementRole: "upper-collage",
        entries: upperEntries,
        usageNote: "The public page renders the first two active images only: one large base image with one smaller centered image stacked on top."
      })}
      ${renderAboutPhotoSection({
        title: "Lower collage",
        eyebrow: "Foreground collage B",
        description: "Controls the lower foreground image group beside the secondary copy block.",
        placementRole: "lower-collage",
        entries: lowerEntries,
        usageNote: "The public page renders this group in order as the lower image collage."
      })}
      ${renderAboutPhotoSection({
        title: "Background floats",
        eyebrow: "Transparent motion layer",
        description: "Controls the oversized, mostly transparent images that drift behind the copy and foreground collage layers.",
        placementRole: "background-float",
        entries: backgroundEntries,
        usageNote: "These photos are intentionally large and low-opacity on the public page."
      })}
      ${renderAboutPhotoSection({
        title: "Unused / staged",
        eyebrow: "Holding area",
        description: "Stores About photo records that should remain available in the editor without appearing in an active page role.",
        placementRole: "unused",
        entries: unusedEntries,
        usageNote: "Move photos here when they should stay in aboutPhotos.json but not participate in the current layout."
      })}
    </div>
  `;
}

const SITE_SEO_ROUTE_LABELS = {
  entry: "Entry",
  home: "Home",
  portfolio: "Portfolio",
  about: "About / Contact",
  gallery: "Virtual Gallery"
};

function renderSiteSettings(state, elements) {
  if (!elements.siteSettingsEditor) {
    return;
  }

  const seo = state.siteSeo ?? {};
  const siteCopy = state.siteCopy ?? {};
  const routes = seo.routes ?? {};
  const globalFields = [
    ["siteName", "Site name", seo.siteName],
    ["authorName", "Author name", seo.authorName],
    ["siteUrl", "Canonical site URL", seo.siteUrl],
    ["locale", "Locale", seo.locale],
    ["themeColor", "Theme color", seo.themeColor],
    ["defaultImage", "Default social image", seo.defaultImage],
    ["contactEmail", "Contact email", seo.contactEmail]
  ];

  elements.siteSettingsEditor.innerHTML = `
    <section class="panel">
      <p class="eyebrow">Public Copy</p>
      <h2>Entry screen</h2>
      <div class="panel-grid">
        ${[
          ["entry.eyebrow", "Eyebrow", siteCopy.entry?.eyebrow, false],
          ["entry.headline", "Headline", siteCopy.entry?.headline, true],
          ["entry.body", "Introduction", siteCopy.entry?.body, true],
          ["entry.primaryAction", "Website action", siteCopy.entry?.primaryAction, false],
          ["entry.galleryAction", "Gallery action", siteCopy.entry?.galleryAction, false]
        ].map(([field, label, value, wide]) => `
          <label class="${wide ? "panel-wide" : ""}">
            <span>${escapeHtml(label)}</span>
            <input data-site-copy-field="${field}" value="${escapeHtml(value ?? "")}" />
          </label>
        `).join("")}
      </div>
    </section>
    <section class="panel">
      <p class="eyebrow">Public Copy</p>
      <h2>Homepage introduction</h2>
      <div class="panel-grid">
        ${[
          ["home.eyebrow", "Eyebrow", siteCopy.home?.eyebrow, false],
          ["home.statement", "Statement", siteCopy.home?.statement, true],
          ["home.galleryAction", "Gallery action", siteCopy.home?.galleryAction, false],
          ["home.portfolioAction", "Portfolio action", siteCopy.home?.portfolioAction, false]
        ].map(([field, label, value, wide]) => `
          <label class="${wide ? "panel-wide" : ""}">
            <span>${escapeHtml(label)}</span>
            <input data-site-copy-field="${field}" value="${escapeHtml(value ?? "")}" />
          </label>
        `).join("")}
      </div>
    </section>
    <section class="panel">
      <p class="eyebrow">Public Copy</p>
      <h2>Navigation and archive</h2>
      <div class="panel-grid">
        ${[
          ["navigation.home", "Home navigation", siteCopy.navigation?.home, false],
          ["navigation.portfolio", "Portfolio navigation", siteCopy.navigation?.portfolio, false],
          ["navigation.gallery", "Gallery navigation", siteCopy.navigation?.gallery, false],
          ["navigation.about", "About navigation", siteCopy.navigation?.about, false],
          ["portfolio.eyebrow", "Portfolio label", siteCopy.portfolio?.eyebrow, false],
          ["portfolio.allWork", "All-work filter", siteCopy.portfolio?.allWork, false],
          ["portfolio.headline", "Portfolio heading", siteCopy.portfolio?.headline, true]
        ].map(([field, label, value, wide]) => `
          <label class="${wide ? "panel-wide" : ""}">
            <span>${escapeHtml(label)}</span>
            <input data-site-copy-field="${field}" value="${escapeHtml(value ?? "")}" />
          </label>
        `).join("")}
      </div>
    </section>
    <section class="panel">
      <p class="eyebrow">Public Copy</p>
      <h2>Footer</h2>
      <p class="panel-description">The current year and copyright symbol are generated automatically.</p>
      <div class="panel-grid">
        <label>
          <span>Copyright owner</span>
          <input data-site-copy-field="footer.owner" value="${escapeHtml(siteCopy.footer?.owner ?? "")}" />
        </label>
        <label>
          <span>Rights statement</span>
          <input data-site-copy-field="footer.rights" value="${escapeHtml(siteCopy.footer?.rights ?? "")}" />
        </label>
      </div>
    </section>
    <section class="panel">
      <p class="eyebrow">Public Copy</p>
      <h2>Virtual gallery notices</h2>
      <div class="panel-grid">
        ${[
          ["gallery.releaseStatus", "Release badge", siteCopy.gallery?.releaseStatus, false, false],
          ["gallery.persistentNotice", "Persistent experimental notice", siteCopy.gallery?.persistentNotice, true, false],
          ["gallery.loadingEyebrow", "Loading label", siteCopy.gallery?.loadingEyebrow, false, false],
          ["gallery.loadingHeadline", "Loading heading", siteCopy.gallery?.loadingHeadline, false, false],
          ["gallery.loadingBody", "Loading explanation", siteCopy.gallery?.loadingBody, true, true],
          ["gallery.loadingDisclaimer", "Loading disclaimer", siteCopy.gallery?.loadingDisclaimer, true, true],
          ["gallery.loadingPhase", "Initial loading phase", siteCopy.gallery?.loadingPhase, false, false],
          ["gallery.unavailableEyebrow", "Unavailable label", siteCopy.gallery?.unavailableEyebrow, false, false],
          ["gallery.unavailableHeadline", "Unavailable heading", siteCopy.gallery?.unavailableHeadline, true, false],
          ["gallery.unavailableBody", "Unavailable explanation", siteCopy.gallery?.unavailableBody, true, true],
          ["gallery.unavailableAction", "Portfolio fallback action", siteCopy.gallery?.unavailableAction, true, false]
        ].map(([field, label, value, wide, multiline]) => `
          <label class="${wide ? "panel-wide" : ""}">
            <span>${escapeHtml(label)}</span>
            ${multiline
              ? `<textarea data-site-copy-field="${field}">${escapeHtml(value ?? "")}</textarea>`
              : `<input data-site-copy-field="${field}" value="${escapeHtml(value ?? "")}" />`}
          </label>
        `).join("")}
      </div>
    </section>
    <section class="panel">
      <p class="eyebrow">Global</p>
      <h2>Site identity</h2>
      <div class="panel-grid">
        ${globalFields.map(([field, label, value]) => `
          <label class="${field === "siteUrl" || field === "defaultImage" ? "panel-wide" : ""}">
            <span>${escapeHtml(label)}</span>
            <input data-site-seo-field="${escapeHtml(field)}" value="${escapeHtml(value ?? "")}" />
          </label>
        `).join("")}
        <label class="panel-wide">
          <span>Keywords (one per line)</span>
          <textarea data-site-seo-field="keywords">${escapeHtml((seo.keywords ?? []).join("\n"))}</textarea>
        </label>
        <label class="panel-wide">
          <span>Profile URLs (one per line)</span>
          <textarea data-site-seo-field="sameAs">${escapeHtml((seo.sameAs ?? []).join("\n"))}</textarea>
        </label>
      </div>
    </section>
    ${Object.entries(SITE_SEO_ROUTE_LABELS).map(([routeId, label]) => {
      const route = routes[routeId] ?? {};
      return `
        <section class="panel" data-site-seo-route="${escapeHtml(routeId)}">
          <p class="eyebrow">Route</p>
          <h2>${escapeHtml(label)}</h2>
          <div class="panel-grid">
            <label class="panel-wide">
              <span>Document title</span>
              <input data-site-seo-route-field="title" value="${escapeHtml(route.title ?? "")}" />
            </label>
            <label class="panel-wide">
              <span>Description</span>
              <textarea data-site-seo-route-field="description">${escapeHtml(route.description ?? "")}</textarea>
            </label>
            <label>
              <span>Canonical path</span>
              <input data-site-seo-route-field="canonicalPath" value="${escapeHtml(route.canonicalPath ?? "/")}" />
            </label>
          </div>
        </section>
      `;
    }).join("")}
  `;
}

function updateEditorWindowTitle(state, elements, route) {
  const category = route.name === "categoryImages"
    ? state.categories.find((item) => item.id === route.categoryId)
    : null;
  const image = route.name === "image" || route.name === "crop"
    ? state.images.find((item) => item.id === route.imageId)
    : null;
  const routeTitles = {
    images: "Image Library",
    heroImages: "Hero Slideshow",
    import: "Image Import",
    gallery: "Virtual Gallery",
    about: "About Copy",
    aboutPhotos: "About Photos",
    categories: "Categories",
    settings: "Site Settings",
    backups: "Backups"
  };
  const contextTitle = category?.label
    ?? image?.title
    ?? routeTitles[route.name]
    ?? "Portfolio";
  const modeSuffix = route.name === "crop" ? " Crop" : "";
  const windowTitle = `${contextTitle}${modeSuffix} — Portfolio Editor`;

  if (elements.editorWindowTitle) {
    elements.editorWindowTitle.textContent = windowTitle;
  }
  document.title = `${windowTitle} — Taylor Pike`;
}

// Chooses which editor page to render for the current route.
export function renderAll(state, elements, route) {
  updateEditorWindowTitle(state, elements, route);
  renderCategories(state, elements);
  updateImportCategoryOptions(state, elements);
  renderContextPalette(state, elements, route);

  if (route.name === "settings") {
    renderSiteSettings(state, elements);
    return;
  }

  if (route.name === "backups") {
    renderBackupPage(state, elements);
    return;
  }

  if (route.name === "gallery") {
    renderGalleryCurationPage(state, elements);
    return;
  }

  if (route.name === "about" || route.name === "aboutPhotos") {
    renderAboutPage(state, elements);
    renderAboutImportReview(elements, []);
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
