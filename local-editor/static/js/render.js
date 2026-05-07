import {
  categoryOptions,
  escapeHtml,
  formatObjectPosition,
  getFallbackCategoryId,
  parseObjectPosition
} from "./utils.js";

function getHeroSlideForImage(state, imageId) {
  return state.heroSlides.find((slide) => slide.imageId === imageId);
}

function getCategoryLabel(state, categoryId) {
  const category = state.categories.find((item) => item.id === categoryId);

  return category?.label ?? categoryId;
}

function getImagesForCategory(state, categoryId) {
  return state.images.filter((image) => image.category === categoryId);
}

function getHeroImages(state) {
  return state.heroSlides
    .map((slide) => {
      const image = state.images.find((item) => item.id === slide.imageId);

      if (!image) {
        return null;
      }

      return {
        image,
        slide
      };
    })
    .filter(Boolean);
}

function getImageAspect(image) {
  if (Number(image.imageAspectRatio) > 0) {
    return Number(image.imageAspectRatio);
  }

  if (Number(image.imageWidth) > 0 && Number(image.imageHeight) > 0) {
    return Number(image.imageWidth) / Number(image.imageHeight);
  }

  return 1.5;
}

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

function getGalleryFitMode(image) {
  return image.galleryFitMode === "contain" ? "contain" : "cover";
}

function getFrameStyle(value) {
  if (["auto", "landscape", "portrait", "square"].includes(value)) {
    return value;
  }

  return "auto";
}

function getHeroFrameStyle(image) {
  return getFrameStyle(image.heroFrameStyle);
}

function getResolvedHeroFrameStyle(image) {
  const frameStyle = getHeroFrameStyle(image);

  if (frameStyle !== "auto") {
    return frameStyle;
  }

  return getImageOrientation(image);
}

function getHeroFitMode(image) {
  if (image.heroFitMode === "cover" || image.heroFitMode === "contain") {
    return image.heroFitMode;
  }

  return getResolvedHeroFrameStyle(image) === "landscape" ? "cover" : "contain";
}

function shouldShowHeroCropSliders(image) {
  return getHeroFitMode(image) === "cover";
}

function getHeroCropModeSummary(image) {
  if (getHeroFitMode(image) === "cover") {
    return "Cover mode is active. The image fills the full 16:9 hero frame, and the crop sliders control which part of the image remains visible.";
  }

  return "Fit Entire Image is active. The complete image is visible inside the 16:9 hero frame, so crop sliders are disabled because the image is not being cropped.";
}

function getGalleryFrameStyle(image) {
  return getFrameStyle(image.galleryFrameStyle);
}

function getResolvedGalleryFrameStyle(image) {
  const frameStyle = getGalleryFrameStyle(image);

  if (frameStyle !== "auto") {
    return frameStyle;
  }

  return getImageOrientation(image);
}

function getGallerySizeDefault(image) {
  const frameStyle = getResolvedGalleryFrameStyle(image);

  if (frameStyle === "portrait") {
    return 1.15;
  }

  if (frameStyle === "square") {
    return 1.08;
  }

  return 1;
}

function getGallerySizeMax(image) {
  const frameStyle = getResolvedGalleryFrameStyle(image);

  if (frameStyle === "portrait") {
    return 1.28;
  }

  if (frameStyle === "square") {
    return 1.14;
  }

  return 1;
}

function getGallerySize(image) {
  const value = Number(image.gallerySize);

  if (!Number.isFinite(value) || value <= 0) {
    return getGallerySizeDefault(image);
  }

  return Math.min(getGallerySizeMax(image), Math.max(0.55, value));
}

function getGalleryPreviewAspect(image) {
  const fitMode = getGalleryFitMode(image);

  if (fitMode === "contain") {
    return getImageAspect(image);
  }

  const frameStyle = getResolvedGalleryFrameStyle(image);

  if (frameStyle === "portrait") {
    return 2 / 3;
  }

  if (frameStyle === "square") {
    return 1;
  }

  return 1.5;
}

function getCropModeLabel(cropMode) {
  if (cropMode === "hero") {
    return "Hero Crop";
  }

  if (cropMode === "gallery") {
    return "Virtual Gallery Crop";
  }

  return "Crop";
}

function getCropFieldName(cropMode) {
  if (cropMode === "hero") {
    return "heroPosition";
  }

  if (cropMode === "gallery") {
    return "galleryPosition";
  }

  return "heroPosition";
}

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
  const cropPreviewImage = cropEditor?.querySelector("[data-crop-preview-image], .crop-preview img");

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

export function updateGallerySizeControl(range) {
  const container = range.closest(".gallery-size-control, .crop-editor-panel");
  const output = container?.querySelector("[data-gallery-size-output]");

  if (output) {
    output.textContent = `${Math.round(Number(range.value) * 100)}%`;
  }
}

export function updateImportCategoryOptions(state, elements) {
  elements.importCategory.innerHTML = categoryOptions(
    state.categories,
    elements.importCategory.value || getFallbackCategoryId(state)
  );
}

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

function renderHeroImageOverview(state, elements) {
  const heroImages = getHeroImages(state);

  elements.imagesPageEyebrow.textContent = "Hero Slideshow";
  elements.imagesPageTitle.textContent = "Hero slideshow order";
  elements.imagesPageDescription.textContent = "This page controls the order of images in the home page hero slideshow. Add images to the slideshow from their individual image edit pages.";

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

function renderImageEditCard(state, image) {
  const heroSlide = getHeroSlideForImage(state, image.id);
  const isHeroSlide = Boolean(heroSlide);
  const heroTargetCategory = heroSlide?.targetCategory ?? image.category ?? getFallbackCategoryId(state);
  const thumbnailPosition = image.thumbnailPosition ?? "50% 50%";
  const orientation = getImageOrientation(image);
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
        <label>
          <span>ID</span>
          <input data-field="id" value="${escapeHtml(image.id)}" readonly />
        </label>

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

        <label>
          <span>Hero display style</span>
          <select data-field="heroFrameStyle">
            <option value="auto" ${heroFrameStyle === "auto" ? "selected" : ""}>Auto</option>
            <option value="landscape" ${heroFrameStyle === "landscape" ? "selected" : ""}>Landscape</option>
            <option value="portrait" ${heroFrameStyle === "portrait" ? "selected" : ""}>Portrait mode</option>
            <option value="square" ${heroFrameStyle === "square" ? "selected" : ""}>Square</option>
          </select>
        </label>

        <label>
          <span>Hero fit mode</span>
          <select data-field="heroFitMode">
            <option value="cover" ${heroFitMode === "cover" ? "selected" : ""}>Cover / Crop to Hero Frame</option>
            <option value="contain" ${heroFitMode === "contain" ? "selected" : ""}>Fit Entire Image</option>
          </select>
        </label>

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

        <div class="hero-controls">
          <label class="checkbox">
            <input type="checkbox" data-field="isHeroSlide" ${isHeroSlide ? "checked" : ""} />
            <span>Use in home hero slideshow</span>
          </label>

          <label>
            <span>Hero target category</span>
            <select data-field="heroTargetCategory">${categoryOptions(state.categories, heroTargetCategory)}</select>
          </label>
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

function renderImageDetail(state, elements, imageId) {
  const image = state.images.find((item) => item.id === imageId);

  elements.imagesPageEyebrow.textContent = "Image Editor";
  elements.imagesPageTitle.textContent = image ? image.title : "Image not found";
  elements.imagesPageDescription.textContent = image
    ? "Edit this image record. Hero portrait mode, gallery fit mode, and gallery size are controlled here."
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
              <div class="editor-hero-preview-frame">
                <img
                  src="${escapeHtml(imageSource)}"
                  alt="${escapeHtml(image.alt)}"
                  data-crop-preview-image
                  style="object-position: ${escapeHtml(currentPosition)};"
                />
              </div>
            </div>
          ` : `
            <img
              src="${escapeHtml(imageSource)}"
              alt="${escapeHtml(image.alt)}"
              data-crop-preview-image
              style="object-position: ${escapeHtml(currentPosition)};"
            />
          `}
        </div>

        <div class="crop-editor-panel">
          <p class="eyebrow">${escapeHtml(cropLabel)}</p>
          <h2>${escapeHtml(image.title)}</h2>
          <p class="crop-description">${escapeHtml(getCropDescription(image, cropMode))}</p>

          ${isHeroCrop ? `
            <div class="gallery-mode-panel hero-mode-panel">
              <label>
                <span>Hero display style</span>
                <select data-crop-setting="heroFrameStyle">
                  <option value="auto" ${heroFrameStyle === "auto" ? "selected" : ""}>Auto</option>
                  <option value="landscape" ${heroFrameStyle === "landscape" ? "selected" : ""}>Landscape hero frame</option>
                  <option value="portrait" ${heroFrameStyle === "portrait" ? "selected" : ""}>Portrait hero frame</option>
                  <option value="square" ${heroFrameStyle === "square" ? "selected" : ""}>Square hero frame</option>
                </select>
              </label>
            </div>

            <div class="gallery-mode-panel hero-fit-panel">
              <label>
                <span>Hero fit mode</span>
                <select data-crop-setting="heroFitMode">
                  <option value="cover" ${heroFitMode === "cover" ? "selected" : ""}>Cover / Crop to selected frame</option>
                  <option value="contain" ${heroFitMode === "contain" ? "selected" : ""}>Fit Entire Image</option>
                </select>
              </label>
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
            ${isHeroCrop ? `<p><strong>Resolved hero style:</strong> ${escapeHtml(resolvedHeroFrameStyle)}</p><p><strong>Hero fit mode:</strong> ${escapeHtml(heroFitMode)}</p>` : ""}
            ${isGalleryCrop ? `<p><strong>Gallery size:</strong> ${escapeHtml(String(Math.round(getGallerySize(image) * 100)))}%</p>` : ""}
          </div>
        </div>
      </div>
    </section>
  `;
}

export function renderImportReview(state, elements, pendingImportItems) {
  if (!pendingImportItems.length) {
    elements.importReview.classList.remove("is-active");
    elements.importReviewList.innerHTML = "";
    return;
  }

  elements.importReview.classList.add("is-active");

  elements.importReviewList.innerHTML = pendingImportItems.map((item, index) => {
    return `
      <article class="import-card" data-import-card data-import-index="${index}">
        <div class="preview">
          <img
            src="${escapeHtml(item.previewUrl)}"
            alt=""
            style="object-position: ${escapeHtml(item.thumbnailPosition)};"
          />
        </div>

        <div class="fields">
          <label>
            <span>ID</span>
            <input data-import-field="id" value="${escapeHtml(item.id)}" />
          </label>

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

          <label class="wide">
            <span>Note</span>
            <textarea data-import-field="note">${escapeHtml(item.note)}</textarea>
          </label>
        </div>
      </article>
    `;
  }).join("");
}

export function renderAll(state, elements, route) {
  renderCategories(state, elements);
  updateImportCategoryOptions(state, elements);

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
