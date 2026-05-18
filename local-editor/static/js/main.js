// Main controller for the local image editor.
// It owns routing, in-memory state, save actions, import workflow, and event delegation.

import {
  importReviewedImagesApi,
  importReviewedAboutPhotosApi,
  listBackupsApi,
  loadDataApi,
  renameImageIdApi,
  restoreBackupApi,
  saveDataApi,
  saveGalleryCurationApi,
  saveGalleryCurationWallApi,
  saveImageUpdatesApi
} from "./api.js";
import { elements } from "./dom.js";
import {
  collectCategories,
  collectEditorData,
  collectImageCardSavePayload,
  collectGalleryCuration,
  collectGalleryCurationCard,
  collectImportReviewRecords,
  collectAboutImportReviewRecords,
  getFieldValue
} from "./collect.js";
import {
  renderAll,
  renderImportReview,
  renderAboutImportReview,
  updateFramingControl,
  updateGallerySizeControl
} from "./render.js";
import { formatObjectPosition, getFallbackCategoryId, slugify, titleFromFilename } from "./utils.js";
import {
  getImportGalleryDefaultSize,
  getImportOutputPaths,
  inferImageOrientation,
  makeImageIdFromTitle,
  makeUniqueImageId,
  validateImportRecords
} from "./importValidation.js";
import { resolveGalleryFrameDimensions } from "./galleryFraming.js";
import {
  GALLERY_GRID_MAX_CELLS,
  GALLERY_GRID_MIN_CELLS,
  GALLERY_GRID_TOTAL_CELLS,
  clampGridIndex,
  findGalleryPlacementBoundaryViolations,
  findGalleryPlacementCollisions,
  flipGalleryWallDegrees,
  galleryGridSizeToPercent,
  getGalleryPlacementBoundaryIds,
  getGalleryPlacementCollisionIds,
  getGalleryPlacementCollisionText,
  getGalleryWallFootprintLabel,
  getGalleryWallGridInfo,
  gridToMeters,
  isGalleryWallPlaced,
  metersToGrid,
  normalizeRotationDegrees,
  rotateGalleryWallDegrees
} from "./galleryGrid.js";

const VALID_PAGE_ROUTES = new Set(["images", "import", "gallery", "about", "about-photos", "categories", "backups"]);
const VALID_CROP_MODES = new Set(["hero", "gallery"]);

const EDITOR_THEME_STORAGE_KEY = "taylor-pike-editor-theme";

function getCurrentEditorTheme() {
  return document.documentElement.dataset.editorTheme === "dark" ? "dark" : "light";
}

function updateThemeToggleButton(theme = getCurrentEditorTheme()) {
  if (!elements.themeToggleButton) {
    return;
  }

  const isDark = theme === "dark";
  elements.themeToggleButton.textContent = isDark ? "Light Mode" : "Dark Mode";
  elements.themeToggleButton.setAttribute("aria-pressed", String(isDark));
}

function setEditorTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.editorTheme = nextTheme;
  window.localStorage?.setItem(EDITOR_THEME_STORAGE_KEY, nextTheme);
  updateThemeToggleButton(nextTheme);
}

let state = {
  categories: [],
  images: [],
  heroSlides: [],
  galleryCuration: [],
  galleryCurationStatus: {},
  galleryRoom: {},
  aboutPhotos: [],
  aboutCopy: {},
  backups: []
};

let pendingImportItems = [];
let pendingAboutImportItems = [];
let hasUnsavedChanges = false;
let lastConfirmedHash = window.location.hash || "#/images";
let isRestoringHash = false;
let activeCategoryOrderDrag = null;
let suppressNextCategoryOrderClick = false;
let activeGalleryWallDrag = null;
let activeGallerySelectedWallId = null;
let galleryTransparentDragImage = null;

function getGalleryTransparentDragImage() {
  if (galleryTransparentDragImage) {
    return galleryTransparentDragImage;
  }

  galleryTransparentDragImage = document.createElement("span");
  galleryTransparentDragImage.setAttribute("aria-hidden", "true");
  galleryTransparentDragImage.className = "gallery-transparent-drag-image";
  document.body.appendChild(galleryTransparentDragImage);

  return galleryTransparentDragImage;
}

function escapeGallerySelectorValue(value) {
  if (window.CSS?.escape) {
    return window.CSS.escape(value);
  }

  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function setGalleryDragVisualState(wallId, isDragging) {
  document.body.dataset.galleryWallDragging = isDragging ? "true" : "false";

  const safeWallId = escapeGallerySelectorValue(wallId);
  const selector = `[data-wall-id="${safeWallId}"], [data-placement-marker-wall-id="${safeWallId}"]`;
  const nodes = Array.from(elements.galleryCurationList?.querySelectorAll(selector) ?? []);

  nodes.forEach((node) => {
    node.dataset.galleryDragging = isDragging ? "true" : "false";
  });
}

function clearGalleryDragVisualState() {
  document.body.dataset.galleryWallDragging = "false";
  const nodes = Array.from(elements.galleryCurationList?.querySelectorAll('[data-gallery-dragging="true"]') ?? []);

  nodes.forEach((node) => {
    node.dataset.galleryDragging = "false";
  });
}

function suppressNativeGalleryDragPreview(event) {
  if (!event.dataTransfer) {
    return;
  }

  // Hide the browser's default dragged card/label ghost. The map already renders
  // the real landing footprint, which is the useful visual feedback while placing walls.
  event.dataTransfer.setDragImage(getGalleryTransparentDragImage(), 0, 0);
}

// Updates the short status message shown near the top of the editor.
// The optional state value controls the small status indicator color in CSS.
function setStatus(message, statusState = "neutral") {
  elements.statusText.textContent = message;
  elements.statusText.dataset.statusState = statusState;
}

// Tracks whether the visible editor data has changed since the last save.
// This gives the user clearer feedback before leaving or reloading the editor.
function setDirtyState(isDirty, message = null) {
  hasUnsavedChanges = isDirty;
  document.body.dataset.editorDirty = isDirty ? "true" : "false";

  if (elements.saveButton) {
    elements.saveButton.textContent = isDirty ? "Save Changes *" : "Save Changes";
    elements.saveButton.dataset.dirtyAction = isDirty ? "true" : "false";
  }

  if (elements.dirtyIndicator) {
    elements.dirtyIndicator.textContent = isDirty ? "Unsaved changes" : "Saved";
    elements.dirtyIndicator.dataset.dirtyState = isDirty ? "dirty" : "saved";
  }

  if (message) {
    setStatus(message, isDirty ? "warning" : "success");
  }
}

function confirmDiscardUnsavedChanges(actionLabel = "continue") {
  if (!hasUnsavedChanges) {
    return true;
  }

  return confirm(`You have unsaved editor changes. Discard them and ${actionLabel}?`);
}

// Updates the import workflow message shown below the import controls.
function setImportSummary(message) {
  if (elements.importSummary) {
    elements.importSummary.textContent = message;
  }
}

function getPendingImportCountLabel(count = pendingImportItems.length) {
  return `${count} photo${count === 1 ? "" : "s"}`;
}

function updateImportReviewControls() {
  if (!elements.saveReviewedImportButton) {
    return;
  }

  const count = pendingImportItems.length;
  elements.saveReviewedImportButton.textContent = count ? `Import ${getPendingImportCountLabel(count)}` : "Import 0 photos";

  if (!count) {
    elements.saveReviewedImportButton.disabled = true;
  }
}

function resetImportProgress() {
  if (elements.importProgress) {
    elements.importProgress.hidden = true;
  }

  if (elements.importProgressBar) {
    elements.importProgressBar.style.width = "0%";
  }

  if (elements.importProgressPercent) {
    elements.importProgressPercent.textContent = "0%";
  }

  if (elements.importProgressLabel) {
    elements.importProgressLabel.textContent = "Import progress";
  }

  if (elements.importProgressLog) {
    elements.importProgressLog.innerHTML = "";
  }
}

function setImportProgress(percent, label) {
  const safePercent = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));

  if (elements.importProgress) {
    elements.importProgress.hidden = false;
  }

  if (elements.importProgressBar) {
    elements.importProgressBar.style.width = `${safePercent}%`;
  }

  if (elements.importProgressPercent) {
    elements.importProgressPercent.textContent = `${safePercent}%`;
  }

  if (elements.importProgressLabel && label) {
    elements.importProgressLabel.textContent = label;
  }
}

function appendImportProgressLog(message) {
  if (!elements.importProgressLog) {
    return;
  }

  const item = document.createElement("li");
  item.textContent = message;
  elements.importProgressLog.appendChild(item);
  item.scrollIntoView({ block: "nearest" });
}

function getImportPreviewMeta(item) {
  const orientation = item?.imageOrientation || "unknown orientation";
  const width = item?.imageWidth || "—";
  const height = item?.imageHeight || "—";
  const aspect = Number(item?.imageAspectRatio) > 0 ? Number(item.imageAspectRatio).toFixed(3) : "—";

  return `${orientation} / ${width} × ${height} / aspect ${aspect}`;
}

function openImportLightbox(index) {
  syncPendingImportItemsFromReview();

  const item = pendingImportItems[index];

  if (!item || !elements.importLightbox) {
    return;
  }

  if (elements.importLightboxImage) {
    elements.importLightboxImage.src = item.previewUrl || "";
    elements.importLightboxImage.alt = item.alt || item.title || "Import preview";
  }

  if (elements.importLightboxTitle) {
    elements.importLightboxTitle.textContent = item.title || item.id || `Review item ${index + 1}`;
  }

  if (elements.importLightboxMeta) {
    elements.importLightboxMeta.textContent = getImportPreviewMeta(item);
  }

  elements.importLightbox.hidden = false;
  document.body.dataset.importLightboxOpen = "true";
  elements.importLightbox.querySelector("[data-import-lightbox-close]")?.focus();
}

function closeImportLightbox() {
  if (!elements.importLightbox) {
    return;
  }

  elements.importLightbox.hidden = true;
  document.body.dataset.importLightboxOpen = "false";

  if (elements.importLightboxImage) {
    elements.importLightboxImage.removeAttribute("src");
    elements.importLightboxImage.alt = "";
  }
}

function makeUniqueCategoryId(label) {
  const baseId = slugify(label) || "category";
  const usedIds = new Set(state.categories.map((category) => category.id));

  if (!usedIds.has(baseId)) {
    return baseId;
  }

  let count = 2;
  let nextId = `${baseId}-${count}`;

  while (usedIds.has(nextId)) {
    count += 1;
    nextId = `${baseId}-${count}`;
  }

  return nextId;
}

function getCategoryUsageStats(categoryId) {
  const images = state.images.filter((image) => image.category === categoryId);
  const total = images.length;
  const hidden = images.filter((image) => image.isPublic === false).length;
  const visible = total - hidden;
  const hero = state.heroSlides.filter((slide) => slide.targetCategory === categoryId).length;

  return { total, visible, hidden, hero };
}

function validateCategoryDrafts(categories) {
  if (!categories.length) {
    throw new Error("At least one category is required.");
  }

  const ids = categories.map((category) => category.id);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

  if (duplicateIds.length) {
    throw new Error(`Duplicate category ID${duplicateIds.length === 1 ? "" : "s"}: ${duplicateIds.join(", ")}. Edit the category IDs before saving.`);
  }

  const emptyLabel = categories.find((category) => !String(category.label ?? "").trim());

  if (emptyLabel) {
    throw new Error("Every category needs a display label before saving.");
  }
}

function getCategoryReassignTarget(row, categoryId) {
  const selectedTarget = row?.querySelector("[data-category-reassign]")?.value;

  if (selectedTarget && selectedTarget !== categoryId && state.categories.some((category) => category.id === selectedTarget)) {
    return selectedTarget;
  }

  return state.categories.find((category) => category.id !== categoryId)?.id ?? "personal";
}

function createImportCategory(selectCategoryId = true) {
  const label = prompt("New category name:");
  const cleanLabel = String(label ?? "").trim();

  if (!cleanLabel) {
    return null;
  }

  const existingCategory = state.categories.find((category) => {
    return category.label.trim().toLowerCase() === cleanLabel.toLowerCase();
  });

  const nextCategory = existingCategory ?? {
    id: makeUniqueCategoryId(cleanLabel),
    label: cleanLabel
  };

  if (!existingCategory) {
    state = {
      ...state,
      categories: [...state.categories, nextCategory]
    };
  }

  syncPendingImportItemsFromReview();
  renderAll(state, elements, getCurrentRoute());

  if (selectCategoryId && elements.importCategory) {
    elements.importCategory.value = nextCategory.id;
  }

  pendingImportItems = pendingImportItems.map((item) => ({
    ...item,
    category: item.category || nextCategory.id
  }));

  renderImportReview(state, elements, pendingImportItems);
  updateImportReviewValidation();
  updateImportReviewControls();
  setDirtyState(true, `Added category "${nextCategory.label}" for this import. It will be saved when the reviewed import is imported.`);

  return nextCategory;
}

// Reads image dimensions in the browser before the backend import runs.
// This lets the review UI block bad hero/gallery values before Flask validation.
function readImportImageMetadata(file) {
  return new Promise((resolve) => {
    const previewUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      const aspectRatio = width > 0 && height > 0 ? width / height : 1;

      URL.revokeObjectURL(previewUrl);
      resolve({
        imageWidth: width,
        imageHeight: height,
        imageAspectRatio: Number(aspectRatio.toFixed(6)),
        imageOrientation: inferImageOrientation(width, height)
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      resolve({
        imageWidth: "",
        imageHeight: "",
        imageAspectRatio: "",
        imageOrientation: "landscape",
        metadataWarning: "Browser could not read dimensions before import. Backend validation will still run."
      });
    };

    image.src = previewUrl;
  });
}


function updateAboutImportSummary(message) {
  if (elements.aboutImportSummary) {
    elements.aboutImportSummary.textContent = message;
  }
}

function getPendingAboutImportCountLabel(count = pendingAboutImportItems.length) {
  return `${count} About photo${count === 1 ? "" : "s"}`;
}

function updateAboutImportReviewControls() {
  if (!elements.saveReviewedAboutImportButton) {
    return;
  }

  const count = pendingAboutImportItems.length;
  elements.saveReviewedAboutImportButton.textContent = count ? `Import ${getPendingAboutImportCountLabel(count)}` : "Import 0 About photos";
  elements.saveReviewedAboutImportButton.disabled = !count;
}

function resetAboutImportProgress() {
  if (!elements.aboutImportProgress) {
    return;
  }

  elements.aboutImportProgress.hidden = true;
  elements.aboutImportProgressBar.style.width = "0%";
  elements.aboutImportProgressPercent.textContent = "0%";
  elements.aboutImportProgressLabel.textContent = "About import progress";

  const log = document.querySelector("#aboutImportProgressLog");

  if (log) {
    log.innerHTML = "";
  }
}

function setAboutImportProgress(percent, label) {
  if (!elements.aboutImportProgress) {
    return;
  }

  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  elements.aboutImportProgress.hidden = false;
  elements.aboutImportProgressBar.style.width = `${safePercent}%`;
  elements.aboutImportProgressPercent.textContent = `${safePercent}%`;
  elements.aboutImportProgressLabel.textContent = label;
}

function appendAboutImportProgressLog(message) {
  const log = document.querySelector("#aboutImportProgressLog");

  if (!log) {
    return;
  }

  const item = document.createElement("li");
  item.textContent = message;
  log.appendChild(item);
}

function syncPendingAboutImportItemsFromReview() {
  if (!pendingAboutImportItems.length) {
    return;
  }

  const records = collectAboutImportReviewRecords();

  pendingAboutImportItems = pendingAboutImportItems.map((item, index) => ({
    ...item,
    ...(records[index] ?? {})
  }));
}

function clearPendingAboutImportItems() {
  pendingAboutImportItems.forEach((item) => {
    URL.revokeObjectURL(item.previewUrl);
  });

  pendingAboutImportItems = [];

  if (elements.aboutImportReview) {
    elements.aboutImportReview.classList.remove("is-active");
  }

  if (elements.aboutImportReviewList) {
    elements.aboutImportReviewList.innerHTML = "";
  }

  updateAboutImportSummary("");
  resetAboutImportProgress();
  updateAboutImportReviewControls();
}

async function prepareAboutImportReview() {
  state = collectEditorData(state);

  if (!elements.aboutImportFiles?.files.length) {
    updateAboutImportSummary("Choose at least one About image file first.");
    setStatus("Choose at least one About image before preparing an import.", "warning");
    return;
  }

  clearPendingAboutImportItems();
  setStatus("Reading About image dimensions...", "neutral");

  const year = elements.aboutImportYear.value.trim();
  const location = elements.aboutImportLocation.value.trim();
  const placementRole = elements.aboutImportPlacementRole?.value || "lower-collage";
  const note = elements.aboutImportNote.value.trim();
  const altPrefix = elements.aboutImportAltPrefix.value.trim() || "About page photograph by Taylor Pike";
  const usedIds = new Set((state.aboutPhotos ?? []).map((photo) => photo.id));
  const files = Array.from(elements.aboutImportFiles.files);

  pendingAboutImportItems = await Promise.all(files.map(async (file) => {
    const title = titleFromFilename(file.name);
    const baseId = makeImageIdFromTitle(title);
    const id = makeUniqueImageId(baseId, usedIds);

    usedIds.add(id);

    const metadata = await readImportImageMetadata(file);

    return {
      file,
      previewUrl: URL.createObjectURL(file),
      originalFilename: file.name,
      id,
      title,
      year,
      location,
      placementRole,
      note,
      alt: `${altPrefix}: ${title}`,
      ...metadata
    };
  }));

  if (elements.aboutImportReview) {
    elements.aboutImportReview.classList.add("is-active");
  }

  renderAboutImportReview(elements, pendingAboutImportItems);
  updateAboutImportReviewControls();
  resetAboutImportProgress();
  setDirtyState(true, `Prepared ${pendingAboutImportItems.length} About photos for review. Import them to write files into public/images/about/.`);
}

function removePendingAboutImportItem(index) {
  if (index < 0 || index >= pendingAboutImportItems.length) {
    return;
  }

  syncPendingAboutImportItemsFromReview();
  const [removedItem] = pendingAboutImportItems.splice(index, 1);

  if (removedItem?.previewUrl) {
    URL.revokeObjectURL(removedItem.previewUrl);
  }

  renderAboutImportReview(elements, pendingAboutImportItems);
  updateAboutImportReviewControls();

  if (!pendingAboutImportItems.length) {
    clearPendingAboutImportItems();
    setDirtyState(false, "About import review cleared.");
    return;
  }

  setDirtyState(true, `Removed one About photo from the import review. ${pendingAboutImportItems.length} remain.`);
}

async function saveReviewedAboutImport() {
  if (!pendingAboutImportItems.length) {
    updateAboutImportSummary("Prepare an About import first.");
    return;
  }

  syncPendingAboutImportItemsFromReview();

  const formData = new FormData();
  const records = collectAboutImportReviewRecords();

  setStatus(`Importing ${getPendingAboutImportCountLabel(pendingAboutImportItems.length)}...`, "neutral");
  updateAboutImportSummary("Uploading About images to the local editor...");
  resetAboutImportProgress();
  setAboutImportProgress(5, "Preparing About upload package");
  appendAboutImportProgressLog(`Queued ${getPendingAboutImportCountLabel(pendingAboutImportItems.length)}.`);

  if (elements.saveReviewedAboutImportButton) {
    elements.saveReviewedAboutImportButton.disabled = true;
  }

  pendingAboutImportItems.forEach((item) => {
    formData.append("images", item.file);
  });

  formData.append("records", JSON.stringify(records));

  let didMarkBackendProcessing = false;

  const result = await importReviewedAboutPhotosApi(formData, {
    onUploadProgress: ({ percent }) => {
      const uploadPercent = 5 + Math.round(percent * 0.45);
      setAboutImportProgress(uploadPercent, `Uploading About files (${percent}%)`);

      if (percent >= 100 && !didMarkBackendProcessing) {
        didMarkBackendProcessing = true;
        setAboutImportProgress(62, "Creating About WebP renditions and saving JSON");
        appendAboutImportProgressLog("Upload complete. Backend is creating About renditions.");
      }
    }
  });

  setAboutImportProgress(92, "Finalizing About records");
  applyLoadedState({ ...state, ...result });
  setAboutImportProgress(100, "About import complete");
  appendAboutImportProgressLog(`Imported ${result.importedAboutPhotos?.length ?? 0} About photo${(result.importedAboutPhotos?.length ?? 0) === 1 ? "" : "s"}.`);

  elements.aboutImportFiles.value = "";
  clearPendingAboutImportItems();
  window.location.hash = "#/about";
  setDirtyState(false);
  setStatus(`Imported ${result.importedAboutPhotos?.length ?? 0} About photos.${getBackupStatusText(result)}`, "success");
}

function moveAboutPhotoCard(card, direction) {
  const list = card?.closest("[data-about-photo-section-list]") ?? card?.closest("[data-about-photo-list]");

  if (!card || !list) {
    return;
  }

  if (direction === "top") {
    list.prepend(card);
    setDirtyState(true, "Moved About photo to top. Click Save Changes to preserve it.");
    return;
  }

  if (direction === "up") {
    const previous = card.previousElementSibling;

    if (previous) {
      list.insertBefore(card, previous);
      setDirtyState(true, "Moved About photo up. Click Save Changes to preserve it.");
    }

    return;
  }

  if (direction === "down") {
    const next = card.nextElementSibling;

    if (next) {
      list.insertBefore(next, card);
      setDirtyState(true, "Moved About photo down. Click Save Changes to preserve it.");
    }
  }
}

function removeAboutPhotoCard(card) {
  if (!card) {
    return;
  }

  const title = card.querySelector('[data-field="title"]')?.value || card.dataset.aboutPhotoId || "this About photo";

  if (!confirm(`Remove ${title} from aboutPhotos.json? This does not delete image files from disk.`)) {
    return;
  }

  card.remove();
  setDirtyState(true, "Removed About photo record. Click Save Changes to preserve it.");
}

function makeUniqueAboutPhotoId(baseId) {
  const usedIds = new Set((state.aboutPhotos ?? []).map((photo) => photo.id).filter(Boolean));
  const base = slugify(baseId || "about-photo") || "about-photo";
  let nextId = base;
  let suffix = 2;

  while (usedIds.has(nextId)) {
    nextId = `${base}-${suffix}`;
    suffix += 1;
  }

  return nextId;
}

function getPortfolioImageReferenceFromCard(card, fallbackImage) {
  const getValue = (field, fallback = "") => {
    const value = card ? getFieldValue(card, field) : "";
    return value || fallback || "";
  };

  const imageId = getValue("id", fallbackImage?.id);
  const title = getValue("title", fallbackImage?.title || imageId);

  return {
    sourceImageId: imageId,
    title,
    year: getValue("year", fallbackImage?.year),
    location: getValue("location", fallbackImage?.location),
    note: `Portfolio reference added from ${title}.`,
    src: getValue("src", fallbackImage?.src),
    thumbSrc: getValue("thumbSrc", fallbackImage?.thumbSrc || fallbackImage?.src),
    fullSrc: getValue("fullSrc", fallbackImage?.fullSrc || fallbackImage?.src),
    alt: getValue("alt", fallbackImage?.alt || title),
    imageWidth: getValue("imageWidth", fallbackImage?.imageWidth),
    imageHeight: getValue("imageHeight", fallbackImage?.imageHeight),
    imageAspectRatio: getValue("imageAspectRatio", fallbackImage?.imageAspectRatio),
    imageOrientation: getValue("imageOrientation", fallbackImage?.imageOrientation)
  };
}

function addPortfolioImageToAbout(imageId, triggerButton) {
  const card = triggerButton?.closest("[data-image-card]");
  const fallbackImage = state.images.find((image) => image.id === imageId) ?? null;
  const reference = getPortfolioImageReferenceFromCard(card, fallbackImage);

  if (!reference.sourceImageId || !reference.src) {
    setStatus("Could not add this image to About photos because the image record is missing an ID or display source.", "error");
    return;
  }

  const alreadyAdded = (state.aboutPhotos ?? []).some((photo) => (
    photo.sourceType === "portfolio-reference" && photo.sourceImageId === reference.sourceImageId
  ));

  if (alreadyAdded) {
    setStatus("This image is already present in the About photo list.", "warning");
    return;
  }

  const aboutPhoto = {
    id: makeUniqueAboutPhotoId(`about-${reference.sourceImageId}`),
    title: reference.title,
    year: reference.year,
    location: reference.location,
    note: reference.note,
    src: reference.src,
    thumbSrc: reference.thumbSrc,
    fullSrc: reference.fullSrc,
    alt: reference.alt,
    imageWidth: reference.imageWidth,
    imageHeight: reference.imageHeight,
    imageAspectRatio: reference.imageAspectRatio,
    imageOrientation: reference.imageOrientation,
    isActive: true,
    placementRole: "lower-collage",
    sourceType: "portfolio-reference",
    sourceImageId: reference.sourceImageId
  };

  state.aboutPhotos = [...(state.aboutPhotos ?? []), aboutPhoto];

  if (triggerButton) {
    triggerButton.disabled = true;
    triggerButton.textContent = "Added";
  }

  const panel = card?.querySelector("[data-image-to-about-panel]");
  const heading = panel?.querySelector("strong");
  const summary = panel?.querySelector("span");
  const countLabel = panel?.querySelector("small");

  if (heading) {
    heading.textContent = "Already added to About photos";
  }

  if (summary) {
    summary.textContent = "This portfolio image now has a reference record in the separate About photo list.";
  }

  if (countLabel) {
    countLabel.textContent = `${state.aboutPhotos.length} About records`;
  }

  setDirtyState(true, "Added this portfolio image to About photos. Click Save Changes to preserve it.");
  setStatus("Added portfolio image reference to the About photo list.", "success");
}

// Keeps the pending file list but updates metadata values after the user edits the review cards.
function syncPendingImportItemsFromReview() {
  if (!pendingImportItems.length) {
    return;
  }

  const records = collectImportReviewRecords(state);

  pendingImportItems = pendingImportItems.map((item, index) => {
    return {
      ...item,
      ...(records[index] ?? {})
    };
  });
}


function updateImportOutputPathPreview(card) {
  const idInput = card.querySelector('[data-import-field="id"]');
  const outputPaths = getImportOutputPaths(idInput?.value);

  Object.entries(outputPaths).forEach(([key, value]) => {
    const output = card.querySelector(`[data-import-output-path="${key}"]`);

    if (output) {
      output.textContent = value;
    }
  });
}


function getExistingIdsForImportCard(activeCard) {
  const ids = new Set(state.images.map((image) => image.id).filter(Boolean));

  document.querySelectorAll("[data-import-card]").forEach((card) => {
    if (card === activeCard) {
      return;
    }

    const idInput = card.querySelector('[data-import-field="id"]');
    const value = String(idInput?.value ?? "").trim();

    if (value) {
      ids.add(value);
    }
  });

  return ids;
}

function syncImportIdFromTitle(card, force = false) {
  if (!card) {
    return;
  }

  if (!force && card.dataset.importIdManual === "true") {
    return;
  }

  const titleInput = card.querySelector('[data-import-field="title"]');
  const idInput = card.querySelector('[data-import-field="id"]');

  if (!titleInput || !idInput) {
    return;
  }

  const titleId = makeImageIdFromTitle(titleInput.value);
  idInput.value = makeUniqueImageId(titleId, getExistingIdsForImportCard(card));
  card.dataset.importIdManual = force ? "false" : card.dataset.importIdManual;
  updateImportOutputPathPreview(card);
}

function updateImageIdPathPreview(card) {
  const suggestionInput = card?.querySelector("[data-image-id-suggestion]");

  if (!suggestionInput) {
    return;
  }

  const outputPaths = getImportOutputPaths(suggestionInput.value);

  Object.entries(outputPaths).forEach(([key, value]) => {
    const output = card.querySelector(`[data-image-id-preview-path="${key}"]`);

    if (output) {
      output.textContent = value;
    }
  });
}

function refreshImageIdSuggestionFromTitle(card) {
  const titleInput = card?.querySelector('[data-field="title"]');
  const suggestionInput = card?.querySelector("[data-image-id-suggestion]");

  if (!titleInput || !suggestionInput) {
    return;
  }

  const currentId = card.dataset.imageId ?? "";
  const existingIds = new Set(state.images.map((image) => image.id).filter(Boolean));
  suggestionInput.value = makeUniqueImageId(makeImageIdFromTitle(titleInput.value), existingIds, currentId);
  updateImageIdPathPreview(card);
}

function getImageDetailHash(imageId) {
  return `#/image/${encodeURIComponent(imageId)}`;
}

function replaceEditorHash(hash) {
  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(null, "", nextUrl);
  lastConfirmedHash = hash;
}

function getVisibleImageIdentityId() {
  const identityId = document.querySelector("[data-current-image-id]")?.textContent?.trim();

  if (identityId) {
    return identityId;
  }

  return document.querySelector('[data-image-card] [data-field="id"]')?.value?.trim() ?? "";
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function isVisibleImageRouteSynced(imageId) {
  const card = document.querySelector("[data-image-card]");
  const hiddenId = card?.querySelector('[data-field="id"]')?.value?.trim();

  return (
    card?.dataset.imageId === imageId &&
    hiddenId === imageId &&
    getVisibleImageIdentityId() === imageId
  );
}

function getAuthoritativeRenameState(imageId, renameResult) {
  const updatedImage = renameResult.images?.find((image) => image.id === imageId) ?? renameResult.updatedImage;

  if (!updatedImage || updatedImage.id !== imageId) {
    throw new Error(`Rename completed, but ${imageId} was not returned by the editor backend.`);
  }

  return {
    ...renameResult,
    updatedImage,
    backups: state.backups ?? []
  };
}

function collectRenameMetadataFromCard(card) {
  const updates = {};
  const safeRenameFields = [
    "title",
    "category",
    "year",
    "location",
    "note",
    "alt",
    "isPublic",
    "thumbnailPosition",
    "heroPosition",
    "galleryPosition",
    "galleryFitMode",
    "galleryFrameStyle",
    "gallerySize",
    "heroFitMode",
    "heroFrameStyle"
  ];

  safeRenameFields.forEach((fieldName) => {
    const field = card.querySelector(`[data-field="${fieldName}"]`);

    if (field) {
      updates[fieldName] = getFieldValue(card, fieldName);
    }
  });

  return updates;
}

async function renameImageIdFromCard(card) {
  if (!card) {
    return;
  }

  const currentImageId = card.dataset.imageId;
  const suggestionInput = card.querySelector("[data-image-id-suggestion]");
  const newImageId = makeImageIdFromTitle(suggestionInput?.value);

  if (!currentImageId || !newImageId) {
    throw new Error("Current and new image IDs are required.");
  }

  if (newImageId === currentImageId) {
    setStatus("Image ID is already current.", "neutral");
    return;
  }

  const confirmed = confirm(
    `Rename image ID from "${currentImageId}" to "${newImageId}"?\n\nThis also renames the four portfolio rendition files and updates hero slide references.`
  );

  if (!confirmed) {
    return;
  }

  setStatus("Renaming image ID and rendition files...", "neutral");

  const imageUpdates = collectRenameMetadataFromCard(card);
  const result = await renameImageIdApi(currentImageId, newImageId, imageUpdates);
  const updatedImageId = result.updatedImage?.id;

  if (!updatedImageId) {
    throw new Error("Rename finished, but the backend did not return the updated image ID.");
  }

  const nextRoute = {
    name: "image",
    page: "images",
    imageId: updatedImageId
  };
  const nextHash = getImageDetailHash(updatedImageId);
  const authoritativeState = getAuthoritativeRenameState(updatedImageId, result);

  // The old hash is invalid after a successful rename. Replace it first, then
  // render from the rename response so the identity panel reflects the backend's
  // final JSON and file-rendition state without a stale cached /api/data read.
  replaceEditorHash(nextHash);
  applyLoadedState(authoritativeState, nextRoute);
  setDirtyState(false);
  setStatus(`Renamed image ID to ${updatedImageId}.${getBackupStatusText(result)}`, "success");

  await waitForNextFrame();

  if (!isVisibleImageRouteSynced(updatedImageId)) {
    console.warn("Image ID rename completed, but the visible editor route did not sync. Reloading the editor page.");
    window.location.hash = nextHash;
    window.location.reload();
  }
}


// Gives immediate feedback on duplicate IDs, invalid fit modes, or unsupported values.
function updateImportReviewValidation() {
  if (!pendingImportItems.length) {
    updateImportReviewControls();

    return {
      errors: [],
      warnings: [],
      isValid: true
    };
  }

  const records = collectImportReviewRecords(state);
  const validation = validateImportRecords(records, state.images);

  document.querySelectorAll("[data-import-card]").forEach((card, index) => {
    const cardErrors = validation.errors.filter((item) => item.index === index);
    const cardWarnings = validation.warnings.filter((item) => item.index === index);
    const status = card.querySelector("[data-import-card-status]");

    updateImportOutputPathPreview(card);
    card.dataset.importState = cardErrors.length ? "error" : cardWarnings.length ? "warning" : "valid";

    if (status) {
      const messages = [...cardErrors, ...cardWarnings].map((item) => item.message);
      status.dataset.importState = card.dataset.importState;
      status.textContent = messages.length ? messages.join(" ") : "Ready to import into the portfolio rendition folders.";
    }
  });

  if (elements.saveReviewedImportButton) {
    elements.saveReviewedImportButton.disabled = !validation.isValid;
  }

  updateImportReviewControls();

  if (elements.saveReviewedImportButton && pendingImportItems.length) {
    elements.saveReviewedImportButton.disabled = !validation.isValid;
  }

  if (validation.errors.length) {
    setImportSummary(`${validation.errors.length} issue${validation.errors.length === 1 ? "" : "s"} must be fixed before import.`);
  }
  else if (validation.warnings.length) {
    setImportSummary(`${records.length} image${records.length === 1 ? "" : "s"} ready. ${validation.warnings.length} hero eligibility note${validation.warnings.length === 1 ? "" : "s"}.`);
  }
  else {
    setImportSummary(`${records.length} image${records.length === 1 ? "" : "s"} ready for the portfolio rendition pipeline.`);
  }

  return validation;
}

// Converts backup metadata from the backend into a short status suffix.
function getBackupStatusText(savedData) {
  const backupFolder = savedData?.backup?.backupFolder;

  if (!backupFolder) {
    return "";
  }

  return ` Backup created: local-editor/backups/${backupFolder}.`;
}

// Parses the hash URL into an editor route object.
function getCurrentRoute() {
  const rawRoute = window.location.hash.replace(/^#\/?/, "");
  const routeParts = rawRoute.split("/");
  const routeName = routeParts[0];

  if (routeName === "image" && routeParts[1]) {
    return {
      name: "image",
      page: "images",
      imageId: decodeURIComponent(routeParts[1])
    };
  }

  if (routeName === "crop" && routeParts[1] && routeParts[2]) {
    const cropMode = decodeURIComponent(routeParts[2]);

    return {
      name: "crop",
      page: "images",
      imageId: decodeURIComponent(routeParts[1]),
      cropMode: VALID_CROP_MODES.has(cropMode) ? cropMode : "hero"
    };
  }

  if (routeName === "images" && routeParts[1] === "category" && routeParts[2]) {
    return {
      name: "categoryImages",
      page: "images",
      categoryId: decodeURIComponent(routeParts[2])
    };
  }

  if (routeName === "images" && routeParts[1] === "hero") {
    return {
      name: "heroImages",
      page: "images"
    };
  }

  if (routeName === "about" && routeParts[1] === "photos") {
    return {
      name: "aboutPhotos",
      page: "about-photos"
    };
  }

  if (VALID_PAGE_ROUTES.has(routeName)) {
    return {
      name: routeName,
      page: routeName
    };
  }

  return {
    name: "images",
    page: "images"
  };
}

// Shows the correct editor page and highlights the matching nav item.
function setEditorRoute(route = getCurrentRoute()) {
  elements.editorPages.forEach((page) => {
    page.classList.toggle("is-active", page.dataset.editorPage === route.page);
  });

  elements.editorRouteLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.editorRouteLink === route.page);
  });

  if (!window.location.hash) {
    window.history.replaceState(null, "", "#/images");
  }
}

// Stores data returned by the backend and re-renders an editor route.
// Most saves should render the current hash route. ID renames pass an explicit
// new route because the old hash becomes invalid as soon as the ID changes.
function applyLoadedState(nextState, routeOverride = null) {
  state = {
    categories: nextState.categories ?? [],
    images: nextState.images ?? [],
    heroSlides: nextState.heroSlides ?? [],
    galleryCuration: nextState.galleryCuration ?? state.galleryCuration ?? [],
    galleryCurationStatus: nextState.galleryCurationStatus ?? state.galleryCurationStatus ?? {},
    galleryRoom: nextState.galleryRoom ?? state.galleryRoom ?? {},
    aboutPhotos: nextState.aboutPhotos ?? state.aboutPhotos ?? [],
    aboutCopy: nextState.aboutCopy ?? state.aboutCopy ?? {},
    backups: nextState.backups ?? state.backups ?? []
  };

  const route = routeOverride ?? getCurrentRoute();

  renderAll(state, elements, route);
  setEditorRoute(route);

  if (route.name === "gallery") {
    syncGalleryPlacementCollisionState();
  }
}

// Refreshes in-memory state from the currently visible editor forms.
function updateStateFromCurrentDom() {
  const nextState = collectEditorData(state);

  state = {
    categories: nextState.categories,
    images: nextState.images,
    heroSlides: nextState.heroSlides,
    galleryCuration: state.galleryCuration ?? [],
    galleryCurationStatus: state.galleryCurationStatus ?? {},
    galleryRoom: state.galleryRoom ?? {},
    aboutPhotos: nextState.aboutPhotos ?? state.aboutPhotos ?? [],
    aboutCopy: nextState.aboutCopy ?? state.aboutCopy ?? {},
    backups: state.backups ?? []
  };
}

// Rebuilds the current editor screen after state changes.
function rerenderCurrentRoute(message) {
  const route = getCurrentRoute();

  renderAll(state, elements, route);
  setEditorRoute(route);

  if (message) {
    setStatus(message);
  }
}


function getEditorCategoryLabel(categoryId) {
  return state.categories.find((category) => category.id === categoryId)?.label ?? categoryId ?? "Uncategorized";
}

function getEditorImageById(imageId) {
  return state.images.find((image) => image.id === imageId);
}

function isEditorImagePublic(image) {
  return image?.isPublic !== false;
}

function isEditorLandscapeImage(image) {
  if (["landscape", "portrait", "square"].includes(image?.imageOrientation)) {
    return image.imageOrientation === "landscape";
  }

  const aspectRatio = Number(image?.imageAspectRatio);

  if (Number.isFinite(aspectRatio) && aspectRatio > 0) {
    return aspectRatio > 1;
  }

  const width = Number(image?.imageWidth);
  const height = Number(image?.imageHeight);

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return width > height;
  }

  return true;
}

function getBulkEditorToolbar() {
  return elements.editorList?.querySelector("[data-bulk-editor-toolbar]");
}

function getBulkSelectableCards() {
  return Array.from(elements.editorList?.querySelectorAll("[data-image-id] [data-bulk-image-select]") ?? [])
    .map((input) => input.closest("[data-image-id]"))
    .filter(Boolean);
}

function getSelectedBulkImageIds() {
  return Array.from(elements.editorList?.querySelectorAll("[data-bulk-image-select]:checked") ?? [])
    .map((input) => String(input.value ?? input.closest("[data-image-id]")?.dataset.imageId ?? "").trim())
    .filter(Boolean);
}

function hasBulkEditorChanges() {
  return ["visibility", "category", "hero"].some((fieldName) => Boolean(getBulkFieldValue(fieldName)));
}

function updateBulkSelectionCount() {
  const toolbar = getBulkEditorToolbar();
  const output = toolbar?.querySelector("[data-bulk-selection-count]");

  if (!toolbar || !output) {
    return;
  }

  const selectedImageIds = getSelectedBulkImageIds();
  const selectedIds = new Set(selectedImageIds);
  const selectedCount = selectedImageIds.length;
  const hasChanges = hasBulkEditorChanges();
  const applyButton = toolbar.querySelector("[data-bulk-apply]");

  getBulkSelectableCards().forEach((card) => {
    const imageId = String(card.dataset.imageId ?? "").trim();
    card.dataset.bulkSelected = selectedIds.has(imageId) ? "true" : "false";
  });

  toolbar.dataset.bulkHasSelection = selectedCount > 0 ? "true" : "false";
  toolbar.dataset.bulkHasChanges = hasChanges ? "true" : "false";
  toolbar.dataset.bulkReady = selectedCount > 0 && hasChanges ? "true" : "false";

  output.textContent = `${selectedCount} image${selectedCount === 1 ? "" : "s"} selected`;

  if (applyButton) {
    applyButton.disabled = !(selectedCount > 0 && hasChanges);
  }
}

function setBulkSelection(isSelected) {
  getBulkSelectableCards().forEach((card) => {
    const checkbox = card.querySelector("[data-bulk-image-select]");

    if (checkbox) {
      checkbox.checked = isSelected;
    }
  });

  updateBulkSelectionCount();
}

function getBulkFieldValue(fieldName) {
  const toolbar = getBulkEditorToolbar();
  const field = toolbar?.querySelector(`[data-bulk-field="${fieldName}"]`);

  return String(field?.value ?? "").trim();
}

function resetBulkControls() {
  const toolbar = getBulkEditorToolbar();

  toolbar?.querySelectorAll("[data-bulk-field]").forEach((field) => {
    field.value = "";
  });

  setBulkSelection(false);
}

function dedupeHeroSlides(heroSlides) {
  const seenImageIds = new Set();
  const dedupedSlides = [];

  heroSlides.forEach((slide) => {
    if (!slide?.imageId || seenImageIds.has(slide.imageId)) {
      return;
    }

    seenImageIds.add(slide.imageId);
    dedupedSlides.push(slide);
  });

  return dedupedSlides;
}

function buildBulkEditorPayload(selectedImageIds) {
  const selectedIds = new Set(selectedImageIds);
  const visibilityAction = getBulkFieldValue("visibility");
  const categoryAction = getBulkFieldValue("category");
  const heroAction = getBulkFieldValue("hero");
  const validCategoryIds = new Set(state.categories.map((category) => category.id));

  if (!selectedIds.size) {
    throw new Error("Select at least one image before applying bulk updates.");
  }

  if (!visibilityAction && !categoryAction && !heroAction) {
    throw new Error("Choose at least one bulk update to apply.");
  }

  if (categoryAction && !validCategoryIds.has(categoryAction)) {
    throw new Error("Bulk category target is not a valid category.");
  }

  const basePayload = collectEditorData(state);
  const fallbackCategoryId = getFallbackCategoryId({ categories: basePayload.categories });
  const updatedImages = basePayload.images.map((image) => {
    if (!selectedIds.has(image.id)) {
      return image;
    }

    const updatedImage = { ...image };

    if (visibilityAction === "show") {
      delete updatedImage.isPublic;
    }

    if (visibilityAction === "hide") {
      updatedImage.isPublic = false;
    }

    if (categoryAction) {
      updatedImage.category = categoryAction;
    }

    return updatedImage;
  });
  const imagesById = new Map(updatedImages.map((image) => [image.id, image]));
  const shouldRemoveSelectedFromHero = heroAction === "remove" || visibilityAction === "hide";
  let nextHeroSlides = basePayload.heroSlides.filter((slide) => {
    const image = imagesById.get(slide.imageId);

    if (!image || !isEditorImagePublic(image) || !isEditorLandscapeImage(image)) {
      return false;
    }

    if (shouldRemoveSelectedFromHero && selectedIds.has(slide.imageId)) {
      return false;
    }

    return true;
  });

  if (heroAction === "add") {
    const existingHeroIds = new Set(nextHeroSlides.map((slide) => slide.imageId));

    updatedImages.forEach((image) => {
      if (!selectedIds.has(image.id) || existingHeroIds.has(image.id)) {
        return;
      }

      if (!isEditorImagePublic(image) || !isEditorLandscapeImage(image)) {
        return;
      }

      nextHeroSlides.push({
        imageId: image.id,
        targetCategory: validCategoryIds.has(image.category) ? image.category : fallbackCategoryId
      });
      existingHeroIds.add(image.id);
    });
  }

  return {
    categories: basePayload.categories,
    images: updatedImages,
    heroSlides: dedupeHeroSlides(nextHeroSlides)
  };
}

async function applyBulkEditorUpdates() {
  const selectedImageIds = getSelectedBulkImageIds();
  const payload = buildBulkEditorPayload(selectedImageIds);
  const confirmed = confirm(`Apply bulk updates to ${selectedImageIds.length} selected image record${selectedImageIds.length === 1 ? "" : "s"}?`);

  if (!confirmed) {
    return;
  }

  setStatus("Applying bulk editor updates...", "neutral");
  const savedData = await saveDataApi(payload);

  applyLoadedState(savedData);
  setDirtyState(false);
  setStatus(`Applied bulk updates to ${selectedImageIds.length} image record${selectedImageIds.length === 1 ? "" : "s"}.${getBackupStatusText(savedData)}`, "success");
  resetBulkControls();
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

function getEditorImageAspect(image) {
  if (Number(image?.imageAspectRatio) > 0) {
    return Number(image.imageAspectRatio);
  }

  if (Number(image?.imageWidth) > 0 && Number(image?.imageHeight) > 0) {
    return Number(image.imageWidth) / Number(image.imageHeight);
  }

  return 1.5;
}

function getEditorImageOrientation(image) {
  if (["landscape", "portrait", "square"].includes(image?.imageOrientation)) {
    return image.imageOrientation;
  }

  const aspect = getEditorImageAspect(image);

  if (Math.abs(aspect - 1) <= 0.04) {
    return "square";
  }

  return aspect > 1 ? "landscape" : "portrait";
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
    imageAspect: getEditorImageAspect(image),
    imageOrientation: getEditorImageOrientation(image),
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

function applyGalleryWallPreviewGeometry(preview, geometry) {
  if (!preview) {
    return;
  }

  preview.style.setProperty("--preview-wall-aspect", geometry.wallAspect);
  preview.style.setProperty("--preview-frame-left", geometry.frame.left);
  preview.style.setProperty("--preview-frame-top", geometry.frame.top);
  preview.style.setProperty("--preview-frame-width", geometry.frame.width);
  preview.style.setProperty("--preview-frame-height", geometry.frame.height);
  preview.style.setProperty("--preview-plaque-left", geometry.plaque.left);
  preview.style.setProperty("--preview-plaque-top", geometry.plaque.top);
  preview.style.setProperty("--preview-plaque-width", geometry.plaque.width);
  preview.style.setProperty("--preview-plaque-height", geometry.plaque.height);
}

function renderGalleryCurationThumb(card, image) {
  const thumb = card?.querySelector("[data-gallery-curation-thumb]");

  if (!thumb) {
    return;
  }

  thumb.classList.toggle("is-empty", !image);
  thumb.innerHTML = "";
  thumb.setAttribute(
    "aria-label",
    image ? `Open large artwork preview for ${image.title || image.id}` : "Open large artwork preview for this empty wall slot"
  );

  if (!image) {
    const empty = document.createElement("span");
    empty.textContent = "No artwork";
    thumb.appendChild(empty);
    return;
  }

  const img = document.createElement("img");
  img.src = image.thumbSrc || image.src || "";
  img.alt = image.alt || image.title || "Gallery artwork";
  img.loading = "lazy";
  img.style.objectPosition = image.thumbnailPosition || "50% 50%";
  thumb.appendChild(img);
}


function getGalleryPreviewImageSrc(image) {
  return image?.src || image?.fullSrc || image?.thumbSrc || "";
}

function getGalleryPreviewWallName(card) {
  return card?.querySelector(".gallery-curation-heading h3")?.textContent?.trim() || card?.dataset.wallId || "Gallery wall";
}

function getGalleryPreviewLightbox() {
  return elements.galleryCurationList?.querySelector("[data-gallery-preview-lightbox]");
}

function clearElement(element) {
  if (!element) {
    return;
  }

  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function appendGalleryArtworkLightboxBody(body, image) {
  clearElement(body);

  if (!image) {
    const empty = document.createElement("div");
    empty.className = "gallery-preview-lightbox-empty";
    empty.textContent = "No artwork assigned.";
    body.appendChild(empty);
    return;
  }

  const figure = document.createElement("figure");
  figure.className = "gallery-preview-lightbox-artwork";

  const img = document.createElement("img");
  img.src = getGalleryPreviewImageSrc(image);
  img.alt = image.alt || image.title || "Gallery artwork";
  img.style.objectPosition = image.galleryPosition || image.thumbnailPosition || "50% 50%";

  const caption = document.createElement("figcaption");
  caption.textContent = `${image.title || image.id} / ${getEditorCategoryLabel(image.category)} / ${image.id}`;

  figure.appendChild(img);
  figure.appendChild(caption);
  body.appendChild(figure);
}

function appendGalleryWallLightboxBody(body, card) {
  clearElement(body);

  const preview = card?.querySelector("[data-gallery-wall-preview]");

  if (!preview) {
    const empty = document.createElement("div");
    empty.className = "gallery-preview-lightbox-empty";
    empty.textContent = "No wall preview is available for this slot.";
    body.appendChild(empty);
    return;
  }

  const clone = preview.cloneNode(true);
  clone.classList.add("is-lightbox-preview");
  clone.removeAttribute("data-open-gallery-preview");
  clone.removeAttribute("role");
  clone.removeAttribute("tabindex");
  clone.removeAttribute("aria-label");
  clone.querySelectorAll("[data-open-gallery-preview]").forEach((node) => {
    node.removeAttribute("data-open-gallery-preview");
    node.removeAttribute("role");
    node.removeAttribute("tabindex");
    node.removeAttribute("aria-label");
  });

  body.appendChild(clone);
}

function openGalleryPreviewLightbox(trigger) {
  const overlay = getGalleryPreviewLightbox();
  const card = trigger?.closest("[data-gallery-curation-card]");

  if (!overlay || !card) {
    return;
  }

  const kind = trigger.dataset.openGalleryPreview || "wall";
  const imageId = card.querySelector('[data-gallery-curation-field="artworkId"]')?.value ?? "";
  const image = getEditorImageById(imageId);
  const wallName = getGalleryPreviewWallName(card);
  const title = overlay.querySelector("[data-gallery-preview-title]");
  const meta = overlay.querySelector("[data-gallery-preview-meta]");
  const kindLabel = overlay.querySelector("[data-gallery-preview-kind]");
  const body = overlay.querySelector("[data-gallery-preview-body]");
  const note = overlay.querySelector("[data-gallery-preview-note]");

  if (kind === "artwork") {
    if (kindLabel) {
      kindLabel.textContent = "Assigned Artwork";
    }

    if (title) {
      title.textContent = image?.title ?? "No artwork assigned";
    }

    if (meta) {
      meta.textContent = image ? `${getEditorCategoryLabel(image.category)} / ${image.id}` : `${wallName} has no assigned artwork.`;
    }

    appendGalleryArtworkLightboxBody(body, image);

    if (note) {
      note.textContent = "This is a larger view of the assigned artwork preview. It does not change the saved wall assignment.";
    }
  }
  else {
    if (kindLabel) {
      kindLabel.textContent = "Wall Preview";
    }

    if (title) {
      title.textContent = wallName;
    }

    if (meta) {
      const wallType = card.querySelector('[data-gallery-curation-field="wallType"]')?.selectedOptions?.[0]?.textContent?.trim() || "Wall block type";
      const status = card.querySelector('[data-gallery-curation-field="showInGallery"]')?.selectedOptions?.[0]?.textContent?.trim() || "Display status";
      meta.textContent = `${wallType} / ${status}`;
    }

    appendGalleryWallLightboxBody(body, card);

    if (note) {
      note.textContent = "This enlarged preview uses the current unsaved wall-card controls, including artwork, wall block type, plaque side, and display status.";
    }
  }

  overlay.hidden = false;
  document.body.dataset.galleryPreviewOpen = "true";
  overlay.querySelector("[data-gallery-preview-close]")?.focus();
}

function closeGalleryPreviewLightbox() {
  const overlay = getGalleryPreviewLightbox();

  if (!overlay) {
    return;
  }

  overlay.hidden = true;
  document.body.dataset.galleryPreviewOpen = "false";
  clearElement(overlay.querySelector("[data-gallery-preview-body]"));
}

function syncGalleryWallPreview(card) {
  const preview = card?.querySelector("[data-gallery-wall-preview]");

  if (!preview) {
    return;
  }

  const artworkSelect = card.querySelector('[data-gallery-curation-field="artworkId"]');
  const wallTypeSelect = card.querySelector('[data-gallery-curation-field="wallType"]');
  const plaqueSideSelect = card.querySelector('[data-gallery-curation-field="plaqueSide"]');
  const statusSelect = card.querySelector('[data-gallery-curation-field="showInGallery"]');
  const plaqueEnabledInput = card.querySelector('[data-gallery-curation-field="plaqueEnabled"]');
  const image = getEditorImageById(artworkSelect?.value ?? "");
  const wallType = wallTypeSelect?.value || "standard-display-wall";
  const meta = getGalleryWallPreviewMeta(wallType);
  const plaqueSide = plaqueSideSelect?.value || "auto";
  const plaqueEnabled = plaqueEnabledInput?.checked !== false;
  const showInGallery = statusSelect?.value !== "hidden";
  const plaquePlacement = getGalleryPlaquePreviewPlacement(wallType, image, plaqueSide, plaqueEnabled);
  const geometry = getGalleryWallPreviewGeometry(wallType, image, plaqueEnabled, plaquePlacement);
  const previewFrame = preview.querySelector("[data-preview-frame]");
  const previewSurface = preview.querySelector("[data-preview-surface]");
  const previewTitle = preview.querySelector("[data-preview-artwork-title]");
  const previewMeta = preview.querySelector("[data-preview-artwork-meta]");
  const previewScale = preview.querySelector("[data-preview-scale]");
  const previewNote = preview.querySelector("[data-preview-note]");

  preview.dataset.previewWallType = wallType;
  preview.dataset.previewStatus = showInGallery ? "active" : "hidden";
  preview.dataset.previewPlaquePlacement = plaquePlacement;
  applyGalleryWallPreviewGeometry(preview, geometry);
  preview.setAttribute(
    "aria-label",
    image ? `Open large wall preview for ${image.title || image.id}` : "Open large wall preview for this empty wall slot"
  );

  if (previewSurface) {
    previewSurface.className = `gallery-wall-preview-surface ${meta.surfaceClass}`;
  }

  if (previewFrame) {
    previewFrame.classList.toggle("is-empty", !image);
    previewFrame.innerHTML = "";

    if (image) {
      const img = document.createElement("img");
      img.src = image.thumbSrc || image.src || "";
      img.alt = image.alt || image.title || "Gallery artwork";
      img.loading = "lazy";
      img.style.objectPosition = image.galleryPosition || image.thumbnailPosition || "50% 50%";
      previewFrame.appendChild(img);
    }
    else {
      const empty = document.createElement("span");
      empty.textContent = "No artwork";
      previewFrame.appendChild(empty);
    }
  }

  if (previewTitle) {
    previewTitle.textContent = image?.title ?? "No artwork assigned";
  }

  if (previewMeta) {
    previewMeta.textContent = image ? `${getEditorCategoryLabel(image.category)} / ${image.id}` : "No artwork assigned";
  }


  if (previewScale) {
    previewScale.textContent = `${geometry.wallWidth.toFixed(2)}m × ${geometry.wallHeight.toFixed(2)}m wall / ${image ? `${geometry.frameWidth.toFixed(2)}m × ${geometry.frameHeight.toFixed(2)}m frame` : "No mounted frame"}`;
  }

  if (previewNote) {
    previewNote.textContent = getGalleryWallPreviewNote(showInGallery, image, plaqueSide, plaqueEnabled, plaquePlacement);
  }
}

function syncGalleryCurationArtworkDisplay(card, imageId) {
  const image = getEditorImageById(imageId);
  const title = card?.querySelector("[data-gallery-curation-selected-title]");
  const meta = card?.querySelector("[data-gallery-curation-selected-meta]");

  renderGalleryCurationThumb(card, image);
  syncGalleryWallPreview(card);

  if (title) {
    title.textContent = image?.title ?? "No artwork assigned";
  }

  if (meta) {
    meta.textContent = image
      ? `${getEditorCategoryLabel(image.category)} / ${image.id}`
      : "Use the visual picker or choose an ID from the fallback select.";
  }

  syncGalleryCurationCardState(card);
  applyGalleryCurationFilters();
}

function setGalleryCurationArtwork(card, imageId) {
  const select = card?.querySelector('[data-gallery-curation-field="artworkId"]');

  if (!select) {
    return;
  }

  select.value = imageId;
  syncGalleryCurationArtworkDisplay(card, imageId);
  setDirtyState(true, "Gallery artwork assignment changed. Click Save Wall or Save All Gallery Curation to preserve it.");
}

function getGalleryCardPlacementRecord(card) {
  if (!card) {
    return null;
  }

  return {
    wallId: card.dataset.wallId ?? "",
    wallType: card.querySelector('[data-gallery-curation-field="wallType"]')?.value ?? "standard-display-wall",
    placedInGallery: card.querySelector('[data-gallery-curation-field="placedInGallery"]')?.value !== "unplaced",
    positionX: Number(card.querySelector('[data-gallery-curation-field="positionX"]')?.value ?? 0),
    positionZ: Number(card.querySelector('[data-gallery-curation-field="positionZ"]')?.value ?? 0),
    rotationYDegrees: Number(card.querySelector('[data-gallery-curation-field="rotationYDegrees"]')?.value ?? 0)
  };
}

function getGalleryCardPlacementRecords() {
  return Array.from(elements.galleryCurationList?.querySelectorAll("[data-gallery-curation-card]") ?? [])
    .map(getGalleryCardPlacementRecord)
    .filter(Boolean);
}

function syncGalleryGridPlacementFromField(field) {
  const card = field?.closest("[data-gallery-curation-card]");

  if (!card) {
    return;
  }

  const gridXInput = card.querySelector('[data-gallery-grid-field="gridX"]');
  const gridZInput = card.querySelector('[data-gallery-grid-field="gridZ"]');
  const positionXInput = card.querySelector('[data-gallery-curation-field="positionX"]');
  const positionZInput = card.querySelector('[data-gallery-curation-field="positionZ"]');
  const positionXReadout = card.querySelector('[data-gallery-meter-readout="positionX"]');
  const positionZReadout = card.querySelector('[data-gallery-meter-readout="positionZ"]');

  if (gridXInput && positionXInput) {
    const nextX = gridToMeters(gridXInput.value);
    gridXInput.value = String(metersToGrid(nextX));
    positionXInput.value = nextX.toFixed(2);

    if (positionXReadout) {
      positionXReadout.textContent = `${nextX.toFixed(2)}m`;
    }
  }

  if (gridZInput && positionZInput) {
    const nextZ = gridToMeters(gridZInput.value);
    gridZInput.value = String(metersToGrid(nextZ));
    positionZInput.value = nextZ.toFixed(2);

    if (positionZReadout) {
      positionZReadout.textContent = `${nextZ.toFixed(2)}m`;
    }
  }

  syncGalleryPlacementCollisionState();
}

function getGalleryWallCardById(wallId) {
  return Array.from(elements.galleryCurationList?.querySelectorAll("[data-gallery-curation-card]") ?? [])
    .find((card) => card.dataset.wallId === wallId);
}

function setGalleryWallPlacementStatus(card, placedInGallery) {
  const field = card?.querySelector('[data-gallery-curation-field="placedInGallery"]');

  if (!field) {
    return;
  }

  field.value = placedInGallery ? "placed" : "unplaced";
  const stateLabel = card.querySelector("[data-gallery-placement-state-label]");

  if (stateLabel) {
    stateLabel.textContent = placedInGallery ? "On map" : "Not on map";
  }

  syncGalleryCurationCardState(card);
  syncGalleryPlacementCollisionState();
}

function setGalleryWallGridPosition(card, gridX, gridZ) {
  if (!card) {
    return;
  }

  const gridXInput = card.querySelector('[data-gallery-grid-field="gridX"]');
  const gridZInput = card.querySelector('[data-gallery-grid-field="gridZ"]');

  if (gridXInput) {
    gridXInput.value = String(clampGridIndex(gridX));
  }

  if (gridZInput) {
    gridZInput.value = String(clampGridIndex(gridZ));
  }

  setGalleryWallPlacementStatus(card, true);
  syncGalleryGridPlacementFromField(gridXInput ?? gridZInput);
}

function getGalleryGridDropPosition(event, mapElement) {
  const rect = mapElement.getBoundingClientRect();
  const rawX = (event.clientX - rect.left) / rect.width;
  const rawZ = (event.clientY - rect.top) / rect.height;
  const clampedX = Math.max(0, Math.min(0.999999, rawX));
  const clampedZ = Math.max(0, Math.min(0.999999, rawZ));
  const gridX = clampGridIndex(GALLERY_GRID_MAX_CELLS - Math.floor(clampedX * (GALLERY_GRID_MAX_CELLS - GALLERY_GRID_MIN_CELLS + 1)));
  const gridZ = clampGridIndex(GALLERY_GRID_MAX_CELLS - Math.floor(clampedZ * (GALLERY_GRID_MAX_CELLS - GALLERY_GRID_MIN_CELLS + 1)));

  return { gridX, gridZ };
}

function galleryGridCellCenterToPercent(value, invert = false) {
  const safeValue = clampGridIndex(value);
  const offset = invert
    ? GALLERY_GRID_MAX_CELLS - safeValue
    : safeValue - GALLERY_GRID_MIN_CELLS;
  const percent = Math.max(0, Math.min(100, ((offset + 0.5) / GALLERY_GRID_TOTAL_CELLS) * 100));

  return `${percent.toFixed(3)}%`;
}

function getGalleryPlacementPreviewStyle(record) {
  const info = getGalleryWallGridInfo(record);
  // The editor map is visually mirrored on the X axis to match the desired room orientation.
  // Drop previews must use the same X mapping as resting wall markers or dragging feels inverted.
  const centerX = galleryGridCellCenterToPercent(info.gridX, true);
  const centerZ = galleryGridCellCenterToPercent(info.gridZ, true);
  const length = galleryGridSizeToPercent(info.lengthCells);
  const thickness = galleryGridSizeToPercent(info.thicknessCells);
  const wallRotation = -Number(info.rotationYDegrees || 0);

  return [
    `--preview-x: ${centerX}`,
    `--preview-z: ${centerZ}`,
    `--preview-width: ${length}`,
    `--preview-depth: ${thickness}`,
    `--preview-rotation: ${wallRotation}deg`
  ].join('; ');
}


function getGalleryPlacementPreviewCellsMarkup() {
  return `<span class="gallery-placement-wall-line" aria-hidden="true"></span>`;
}

function getGalleryWallDisplayLabel(card) {
  const sidebarItem = elements.galleryCurationList?.querySelector(`[data-gallery-wall-drag-source][data-wall-id="${escapeGallerySelectorValue(card?.dataset.wallId ?? "")}"]`);
  const wallNumber = sidebarItem?.querySelector(".gallery-placement-sidebar-number")?.textContent?.trim();
  const artworkTitle = sidebarItem?.querySelector(".gallery-placement-sidebar-artwork")?.textContent?.trim();

  return [wallNumber, artworkTitle].filter(Boolean).join(" / ") || card?.dataset.wallId || "Selected wall";
}

function applyGalleryMapSelectionState() {
  let selectedId = activeGallerySelectedWallId;
  let selectedCard = getGalleryWallCardById(selectedId);
  const controls = elements.galleryCurationList?.querySelector("[data-gallery-map-controls]");
  const label = controls?.querySelector("[data-gallery-map-selected-label]");
  const controlButtons = Array.from(controls?.querySelectorAll("button") ?? []);
  if (selectedId && !selectedCard) {
    activeGallerySelectedWallId = null;
    selectedId = null;
    selectedCard = null;
  }

  Array.from(elements.galleryCurationList?.querySelectorAll("[data-gallery-curation-card], [data-gallery-wall-drag-source], [data-placement-marker]") ?? []).forEach((node) => {
    const nodeWallId = node.dataset.wallId ?? node.dataset.placementMarkerWallId;
    node.dataset.gallerySelected = nodeWallId && selectedId && nodeWallId === selectedId ? "true" : "false";
  });

  if (label) {
    label.textContent = selectedCard ? getGalleryWallDisplayLabel(selectedCard) : "No wall selected";
  }

  controlButtons.forEach((button) => {
    button.disabled = !selectedCard;
  });
}

function selectGalleryWall(wallId) {
  activeGallerySelectedWallId = wallId || null;
  applyGalleryMapSelectionState();
}

function setGalleryWallRotation(card, rotationYDegrees) {
  const field = card?.querySelector('[data-gallery-curation-field="rotationYDegrees"]');

  if (!field) {
    return;
  }

  field.value = String(normalizeRotationDegrees(rotationYDegrees));
  syncGalleryCurationCardState(card);
  syncGalleryPlacementCollisionState();
}

function rotateSelectedGalleryWall(delta) {
  const card = getGalleryWallCardById(activeGallerySelectedWallId);

  if (!card) {
    return;
  }

  const field = card.querySelector('[data-gallery-curation-field="rotationYDegrees"]');
  const nextRotation = rotateGalleryWallDegrees(field?.value, delta);

  setGalleryWallRotation(card, nextRotation);
  setDirtyState(true, `Rotated ${card.dataset.wallId} to ${nextRotation} degrees. Click Save Wall or Save All Gallery Curation to preserve it.`);
  refreshGalleryPlacementMapFromCards();
}

function flipSelectedGalleryWall() {
  const card = getGalleryWallCardById(activeGallerySelectedWallId);

  if (!card) {
    return;
  }

  const field = card.querySelector('[data-gallery-curation-field="rotationYDegrees"]');
  const nextRotation = flipGalleryWallDegrees(field?.value);

  setGalleryWallRotation(card, nextRotation);
  setDirtyState(true, `Flipped ${card.dataset.wallId}. Click Save Wall or Save All Gallery Curation to preserve it.`);
  refreshGalleryPlacementMapFromCards();
}

function unplaceSelectedGalleryWall() {
  const card = getGalleryWallCardById(activeGallerySelectedWallId);

  if (!card) {
    return;
  }

  setGalleryWallPlacementStatus(card, false);
  setDirtyState(true, `Moved ${card.dataset.wallId} off the map. The wall card still exists and can be dragged back later.`);
  refreshGalleryPlacementMapFromCards();
}

function hideGalleryPlacementDropPreview(mapElement = null) {
  const root = mapElement ?? elements.galleryCurationList;
  const previews = Array.from(root?.querySelectorAll?.('[data-gallery-placement-drop-preview]') ?? []);

  previews.forEach((preview) => {
    preview.hidden = true;
    preview.removeAttribute('style');
    preview.dataset.dropCollision = 'false';
    preview.innerHTML = '';
  });

  const maps = mapElement ? [mapElement] : Array.from(elements.galleryCurationList?.querySelectorAll('[data-gallery-placement-map]') ?? []);

  maps.forEach((map) => {
    map.dataset.galleryDragOver = 'false';
    map.dataset.galleryDropCollision = 'false';
  });
}

function updateGalleryPlacementDropPreview(event, mapElement) {
  const wallId = activeGalleryWallDrag?.wallId;
  const card = getGalleryWallCardById(wallId);
  const preview = mapElement?.querySelector('[data-gallery-placement-drop-preview]');

  if (!wallId || !card || !preview) {
    return;
  }

  const position = getGalleryGridDropPosition(event, mapElement);
  const previewRecord = {
    ...getGalleryCardPlacementRecord(card),
    gridX: position.gridX,
    gridZ: position.gridZ,
    placedInGallery: true
  };
  const previewRecords = [...getGalleryCardPlacementRecords().filter((record) => record.wallId !== wallId), previewRecord];
  const hasCollision = findGalleryPlacementCollisions(previewRecords).length > 0
    || findGalleryPlacementBoundaryViolations(previewRecords).length > 0;

  preview.hidden = false;
  preview.setAttribute('style', getGalleryPlacementPreviewStyle(previewRecord));
  preview.innerHTML = getGalleryPlacementPreviewCellsMarkup(previewRecord);
  preview.dataset.dropCollision = hasCollision ? 'true' : 'false';
  mapElement.dataset.galleryDragOver = 'true';
  mapElement.dataset.galleryDropCollision = hasCollision ? 'true' : 'false';
}

function refreshGalleryPlacementMapFromCards() {
  const route = getCurrentRoute();

  if (route.name !== "gallery") {
    return;
  }

  state = {
    ...state,
    galleryCuration: collectGalleryCuration(state)
  };

  renderAll(state, elements, route);
  setEditorRoute(route);
  syncGalleryPlacementCollisionState();
  applyGalleryCurationFilters();
  applyGalleryMapSelectionState();
}

function beginGalleryWallDrag(wallId, source) {
  selectGalleryWall(wallId);
  activeGalleryWallDrag = {
    wallId,
    source,
    droppedOnMap: false
  };

  setGalleryDragVisualState(wallId, true);
}

function placeDraggedGalleryWallOnMap(event, mapElement) {
  const wallId = activeGalleryWallDrag?.wallId;
  const card = getGalleryWallCardById(wallId);

  if (!wallId || !card) {
    return;
  }

  const position = getGalleryGridDropPosition(event, mapElement);

  activeGalleryWallDrag.droppedOnMap = true;
  selectGalleryWall(wallId);
  setGalleryWallGridPosition(card, position.gridX, position.gridZ);
  setDirtyState(true, `Placed ${wallId} on the gallery map. Click Save Wall or Save All Gallery Curation to preserve it.`);
  refreshGalleryPlacementMapFromCards();
}

function endGalleryWallDrag() {
  if (!activeGalleryWallDrag) {
    clearGalleryDragVisualState();
    return;
  }

  const { wallId, source, droppedOnMap } = activeGalleryWallDrag;
  const card = getGalleryWallCardById(wallId);

  if (source === "map" && !droppedOnMap && card) {
    setGalleryWallPlacementStatus(card, false);
    setDirtyState(true, `Moved ${wallId} off the map. The wall card still exists and can be dragged back later.`);
    refreshGalleryPlacementMapFromCards();
  }

  activeGalleryWallDrag = null;
  clearGalleryDragVisualState();
  applyGalleryMapSelectionState();
}

function makeUniqueGalleryWallId() {
  const cards = Array.from(elements.galleryCurationList?.querySelectorAll("[data-gallery-curation-card]") ?? []);
  const usedIds = new Set(cards.map((card) => card.dataset.wallId).filter(Boolean));
  let index = usedIds.size + 1;
  let candidate = `custom-wall-${String(index).padStart(2, "0")}`;

  while (usedIds.has(candidate)) {
    index += 1;
    candidate = `custom-wall-${String(index).padStart(2, "0")}`;
  }

  return candidate;
}

function getGalleryAddWallOverlay() {
  return elements.galleryCurationList?.querySelector("[data-gallery-add-wall-overlay]");
}

function openGalleryAddWallOverlay() {
  const overlay = getGalleryAddWallOverlay();

  if (!overlay) {
    return;
  }

  overlay.hidden = false;
  document.body.dataset.galleryAddWallOpen = "true";
  overlay.querySelector('[data-gallery-add-wall-field="wallType"]')?.focus();
}

function closeGalleryAddWallOverlay() {
  const overlay = getGalleryAddWallOverlay();

  if (!overlay) {
    return;
  }

  overlay.hidden = true;
  delete document.body.dataset.galleryAddWallOpen;
}

function getGalleryAddWallFieldValue(name, fallback = "") {
  const overlay = getGalleryAddWallOverlay();
  const field = overlay?.querySelector(`[data-gallery-add-wall-field="${name}"]`);

  if (!field) {
    return fallback;
  }

  if (field.type === "checkbox") {
    return field.checked;
  }

  return field.value ?? fallback;
}

function addGalleryWallCardFromOverlay() {
  const wallId = makeUniqueGalleryWallId();
  const nextRecord = {
    wallId,
    artworkId: getGalleryAddWallFieldValue("artworkId", ""),
    showInGallery: getGalleryAddWallFieldValue("showInGallery", "hidden") === "active",
    placedInGallery: false,
    displayOrder: (state.galleryCuration ?? []).length + 1,
    wallType: getGalleryAddWallFieldValue("wallType", "standard-display-wall"),
    plaqueEnabled: getGalleryAddWallFieldValue("plaqueEnabled", true),
    plaqueSide: getGalleryAddWallFieldValue("plaqueSide", "auto"),
    positionX: 0,
    positionZ: 0,
    rotationYDegrees: 0
  };

  state = {
    ...state,
    galleryCuration: [...(collectGalleryCuration(state) ?? []), nextRecord]
  };

  closeGalleryAddWallOverlay();
  renderAll(state, elements, { name: "gallery", page: "gallery" });
  setEditorRoute({ name: "gallery", page: "gallery" });
  syncGalleryPlacementCollisionState();
  applyGalleryCurationFilters();
  selectGalleryWall(wallId);
  setDirtyState(true, `Added ${wallId}. Drag it from the sidebar onto the map when you are ready to place it.`);
}

function removeGalleryWallCard(card) {
  const wallId = card?.dataset.wallId ?? "";

  if (!card || !wallId) {
    return;
  }

  const confirmed = confirm(`Remove wall card "${wallId}"?\n\nThis removes the wall entity from gallery curation after you save. This is different from dragging it off the map, which keeps the card available for later.`);

  if (!confirmed) {
    return;
  }

  card.remove();
  state = {
    ...state,
    galleryCuration: collectGalleryCuration(state)
  };

  refreshGalleryPlacementMapFromCards();
  setDirtyState(true, `Removed ${wallId}. Click Save All Gallery Curation to preserve the removal.`);
}

function syncGalleryPlacementFootprintLabel(card) {
  const label = card?.querySelector("[data-gallery-placement-footprint]");

  if (!label) {
    return;
  }

  label.textContent = getGalleryWallFootprintLabel(getGalleryCardPlacementRecord(card));
}

function syncGalleryPlacementCollisionState() {
  const cards = Array.from(elements.galleryCurationList?.querySelectorAll("[data-gallery-curation-card]") ?? []);
  const records = cards.map(getGalleryCardPlacementRecord).filter(Boolean);
  const collisions = findGalleryPlacementCollisions(records);
  const boundaryViolations = findGalleryPlacementBoundaryViolations(records);
  const collisionIds = getGalleryPlacementCollisionIds(records);
  const boundaryIds = getGalleryPlacementBoundaryIds(records);
  const saveAllButton = elements.galleryCurationList?.querySelector("[data-save-gallery-curation]");

  cards.forEach((card) => {
    const wallId = card.dataset.wallId ?? "";
    const warning = card.querySelector("[data-gallery-placement-warning]");
    const saveButton = card.querySelector("[data-save-gallery-curation-wall]");
    const collisionText = getGalleryPlacementCollisionText(wallId, collisions);
    const hasCollision = collisionIds.has(wallId);
    const hasBoundaryViolation = boundaryIds.has(wallId);
    const hasPlacementIssue = hasCollision || hasBoundaryViolation;

    card.dataset.galleryPlacementCollision = hasPlacementIssue ? "true" : "false";
    syncGalleryPlacementFootprintLabel(card);

    if (warning) {
      warning.hidden = !hasPlacementIssue;
      warning.textContent = hasBoundaryViolation
        ? "This wall extends beyond the floor-map border. Move or rotate it fully inside the grid before saving."
        : collisionText;
    }

    if (saveButton) {
      saveButton.disabled = hasPlacementIssue;
    }
  });

  if (saveAllButton) {
    saveAllButton.disabled = collisions.length > 0 || boundaryViolations.length > 0;
  }

  return [...collisions, ...boundaryViolations];
}

function assertGalleryPlacementIsCollisionFree(records = getGalleryCardPlacementRecords()) {
  const collisions = findGalleryPlacementCollisions(records);
  const boundaryViolations = findGalleryPlacementBoundaryViolations(records);

  if (!collisions.length && !boundaryViolations.length) {
    return;
  }

  const collisionSummary = collisions
    .map((collision) => `${collision.firstWallId} overlaps ${collision.secondWallId}`);
  const boundarySummary = boundaryViolations
    .map((violation) => `${violation.wallId} extends beyond the floor-map border`);
  const summary = [...collisionSummary, ...boundarySummary].join("; ");

  throw new Error(`Gallery wall placement has ${collisions.length + boundaryViolations.length} issue${collisions.length + boundaryViolations.length === 1 ? "" : "s"}. ${summary}`);
}

function syncGalleryWallTypeDisplay(card) {
  const select = card?.querySelector('[data-gallery-curation-field="wallType"]');
  const selectedOption = select?.selectedOptions?.[0];
  const note = card?.querySelector('[data-gallery-wall-type-note]');
  const label = note?.querySelector('[data-gallery-wall-type-label]');
  const description = note?.querySelector('[data-gallery-wall-type-description]');

  if (label && selectedOption) {
    label.textContent = selectedOption.textContent?.trim() || "Wall block type";
  }

  if (description && selectedOption) {
    description.textContent = selectedOption.dataset.description || "This wall type controls the wall block and artwork scale used in the 3D gallery.";
  }

  syncGalleryCurationCardState(card);
  syncGalleryWallPreview(card);
  syncGalleryPlacementCollisionState();
  applyGalleryCurationFilters();
}

function getGalleryCurationCardDisplayOrder(card) {
  const cards = Array.from(elements.galleryCurationList?.querySelectorAll("[data-gallery-curation-card]") ?? []);
  const index = cards.indexOf(card);

  return index >= 0 ? index + 1 : cards.length + 1;
}

function getGalleryArtworkPickerOverlay() {
  return elements.galleryCurationList?.querySelector("[data-artwork-picker-overlay]");
}

function openGalleryArtworkPicker(card) {
  const overlay = getGalleryArtworkPickerOverlay();

  if (!overlay || !card) {
    return;
  }

  const select = card.querySelector('[data-gallery-curation-field="artworkId"]');
  const selectedImageId = select?.value ?? "";

  overlay.dataset.targetWallId = card.dataset.wallId ?? "";
  overlay.hidden = false;
  document.body.dataset.galleryPickerOpen = "true";

  const searchFilter = overlay.querySelector('[data-artwork-picker-filter="search"]');
  const categoryFilter = overlay.querySelector('[data-artwork-picker-filter="category"]');

  if (searchFilter) {
    searchFilter.value = "";
  }

  if (categoryFilter) {
    categoryFilter.value = "all";
  }

  overlay.querySelectorAll("[data-artwork-picker-option]").forEach((option) => {
    option.classList.toggle("is-selected", option.dataset.artworkPickerOption === selectedImageId);
  });

  applyArtworkPickerFilters();
  searchFilter?.focus();
}

function closeGalleryArtworkPicker() {
  const overlay = getGalleryArtworkPickerOverlay();

  if (!overlay) {
    return;
  }

  overlay.hidden = true;
  overlay.dataset.targetWallId = "";
  document.body.dataset.galleryPickerOpen = "false";
}

function chooseGalleryArtworkFromPicker(optionButton) {
  const overlay = getGalleryArtworkPickerOverlay();
  const targetWallId = overlay?.dataset.targetWallId ?? "";
  const cards = Array.from(elements.galleryCurationList?.querySelectorAll("[data-gallery-curation-card]") ?? []);
  const card = cards.find((candidate) => candidate.dataset.wallId === targetWallId);
  const imageId = optionButton?.dataset.artworkPickerOption ?? "";

  setGalleryCurationArtwork(card, imageId);
  closeGalleryArtworkPicker();
}

function normalizeFilterValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getGalleryFilterValue(name, fallback = "all") {
  const field = elements.galleryCurationList?.querySelector(`[data-gallery-curation-filter="${name}"]`);
  const value = String(field?.value ?? fallback).trim();

  return value || fallback;
}

function getGalleryCurationCardSearchText(card) {
  const select = card?.querySelector('[data-gallery-curation-field="artworkId"]');
  const selectedOption = select?.selectedOptions?.[0];
  const selectedArtworkText = selectedOption?.textContent ?? "";
  const placementText = [
    card?.querySelector('[data-gallery-curation-field="positionX"]')?.value,
    card?.querySelector('[data-gallery-curation-field="positionZ"]')?.value,
    card?.querySelector('[data-gallery-curation-field="rotationYDegrees"]')?.value
  ].filter(Boolean).join(" ");

  return normalizeFilterValue([
    card?.dataset.galleryCurationSearch,
    selectedArtworkText,
    placementText,
    card?.dataset.wallId
  ].filter(Boolean).join(" "));
}

function syncGalleryCurationCardState(card) {
  if (!card) {
    return;
  }

  const artworkSelect = card.querySelector('[data-gallery-curation-field="artworkId"]');
  const wallTypeSelect = card.querySelector('[data-gallery-curation-field="wallType"]');
  const statusSelect = card.querySelector('[data-gallery-curation-field="showInGallery"]');
  const placementSelect = card.querySelector('[data-gallery-curation-field="placedInGallery"]');
  const image = getEditorImageById(artworkSelect?.value ?? "");
  const selectedWallTypeLabel = wallTypeSelect?.selectedOptions?.[0]?.textContent?.trim() || "Wall block type";
  const displayStatus = statusSelect?.value === "hidden" ? "hidden" : "active";
  const placementStatus = placementSelect?.value === "unplaced" ? "unplaced" : "placed";
  const artworkState = image ? "assigned" : "unassigned";
  const placementText = [
    card.querySelector('[data-gallery-curation-field="positionX"]')?.value,
    card.querySelector('[data-gallery-curation-field="positionZ"]')?.value,
    card.querySelector('[data-gallery-curation-field="rotationYDegrees"]')?.value
  ].filter(Boolean).join(" ");

  card.dataset.galleryCurationStatus = displayStatus;
  card.dataset.galleryCurationPlacementStatus = placementStatus;
  card.dataset.galleryCurationWallType = wallTypeSelect?.value ?? "standard-display-wall";
  card.dataset.galleryCurationArtworkState = artworkState;
  card.dataset.galleryCurationCategory = image?.category ?? "";
  card.dataset.galleryCurationSearch = normalizeFilterValue([
    card.dataset.wallId,
    selectedWallTypeLabel,
    placementText,
    image?.title,
    image?.id,
    image ? getEditorCategoryLabel(image.category) : "",
    displayStatus,
    placementStatus
  ].filter(Boolean).join(" "));

  const statusBadge = card.querySelector("[data-gallery-status-badge]");
  const placementBadge = card.querySelector("[data-gallery-placement-badge]");
  const artworkBadge = card.querySelector("[data-gallery-artwork-badge]");
  const wallTypeBadge = card.querySelector("[data-gallery-wall-type-badge]");

  if (statusBadge) {
    statusBadge.dataset.galleryStatusBadge = displayStatus;
    statusBadge.textContent = displayStatus === "hidden" ? "Hidden from room" : "Visible in room";
  }

  if (placementBadge) {
    placementBadge.dataset.galleryPlacementBadge = placementStatus;
    placementBadge.textContent = placementStatus === "unplaced" ? "Not on map" : "On map";
  }

  if (artworkBadge) {
    artworkBadge.dataset.galleryArtworkBadge = artworkState;
    artworkBadge.textContent = image ? "Artwork assigned" : "Needs artwork";
  }

  if (wallTypeBadge) {
    wallTypeBadge.textContent = selectedWallTypeLabel;
  }
}

function applyGalleryCurationFilters() {
  const cards = Array.from(elements.galleryCurationList?.querySelectorAll("[data-gallery-curation-card]") ?? []);
  const search = normalizeFilterValue(getGalleryFilterValue("search", ""));
  const status = getGalleryFilterValue("status");
  const placement = getGalleryFilterValue("placement");
  const wallType = getGalleryFilterValue("wallType");
  const category = getGalleryFilterValue("category");
  let visibleCount = 0;

  cards.forEach((card) => {
    syncGalleryCurationCardState(card);

    const cardStatus = card.dataset.galleryCurationStatus ?? "active";
    const cardWallType = card.dataset.galleryCurationWallType ?? "standard-display-wall";
    const cardPlacementStatus = card.dataset.galleryCurationPlacementStatus ?? "placed";
    const cardArtworkState = card.dataset.galleryCurationArtworkState ?? "unassigned";
    const cardCategory = card.dataset.galleryCurationCategory ?? "";
    const matchesSearch = !search || getGalleryCurationCardSearchText(card).includes(search);
    const matchesStatus = status === "all"
      || status === cardStatus
      || (status === "needs-artwork" && cardArtworkState === "unassigned");
    const matchesPlacement = placement === "all" || placement === cardPlacementStatus;
    const matchesWallType = wallType === "all" || wallType === cardWallType;
    const matchesCategory = category === "all" || category === cardCategory;
    const isVisible = matchesSearch && matchesStatus && matchesPlacement && matchesWallType && matchesCategory;

    card.hidden = !isVisible;

    if (isVisible) {
      visibleCount += 1;
    }
  });

  const result = elements.galleryCurationList?.querySelector("[data-gallery-curation-filter-result]");

  if (result) {
    result.textContent = `Showing ${visibleCount} of ${cards.length} wall slots.`;
  }
}

function applyArtworkPickerFilters() {
  const overlay = getGalleryArtworkPickerOverlay();

  if (!overlay || overlay.hidden) {
    return;
  }

  const search = normalizeFilterValue(overlay.querySelector('[data-artwork-picker-filter="search"]')?.value);
  const category = String(overlay.querySelector('[data-artwork-picker-filter="category"]')?.value ?? "all");
  const options = Array.from(overlay.querySelectorAll("[data-artwork-picker-option]"));

  options.forEach((option) => {
    const isClearButton = option.dataset.artworkPickerOption === "";

    if (isClearButton) {
      option.hidden = false;
      return;
    }

    const matchesSearch = !search || normalizeFilterValue(option.dataset.artworkPickerSearch).includes(search);
    const matchesCategory = category === "all" || option.dataset.artworkPickerCategory === category;

    option.hidden = !(matchesSearch && matchesCategory);
  });
}

// Clears temporary browser preview URLs and resets the import review UI.
function clearPendingImportItems() {
  pendingImportItems.forEach((item) => {
    URL.revokeObjectURL(item.previewUrl);
  });

  pendingImportItems = [];
  elements.importReview.classList.remove("is-active");
  elements.importReviewList.innerHTML = "";
  setImportSummary("");
  resetImportProgress();
  updateImportReviewControls();
}

async function loadData() {
  setStatus("Loading data...");

  const nextState = await loadDataApi();

  applyLoadedState(nextState);
  setDirtyState(false);
  setStatus(`Loaded ${state.images.length} images, ${state.categories.length} categories, and About copy.`, "success");
}

async function refreshBackups(message = "Backups refreshed.") {
  setStatus("Loading backups...", "neutral");

  const result = await listBackupsApi();

  state = {
    ...state,
    backups: result.backups ?? []
  };

  const route = getCurrentRoute();

  renderAll(state, elements, route);
  setEditorRoute(route);
  setStatus(message, "success");
}

async function restoreBackup(backupFolder) {
  if (!confirmDiscardUnsavedChanges("restore a backup")) {
    return;
  }

  const confirmed = confirm(
    `Restore backup "${backupFolder}"?\n\nThe current JSON files will be backed up first, then replaced with this restore point.`
  );

  if (!confirmed) {
    return;
  }

  setStatus("Restoring backup...", "neutral");

  const restoredData = await restoreBackupApi(backupFolder);

  applyLoadedState(restoredData);
  setDirtyState(false);
  setStatus(`Restored ${backupFolder}.${getBackupStatusText(restoredData)}`, "success");
}

async function savePayload(payload) {
  setStatus("Saving data...", "neutral");

  const savedData = await saveDataApi(payload);

  applyLoadedState(savedData);
  setDirtyState(false);
  setStatus(`Saved ${state.images.length} images, ${state.categories.length} categories, and About page copy.${getBackupStatusText(savedData)}`, "success");
  return savedData;
}


async function saveGalleryCuration() {
  const galleryCuration = collectGalleryCuration(state);

  assertGalleryPlacementIsCollisionFree(galleryCuration);
  setStatus("Saving all gallery curation...", "neutral");

  const savedData = await saveGalleryCurationApi(galleryCuration);

  applyLoadedState(savedData);
  setDirtyState(false);
  setStatus(`Saved ${state.galleryCuration.length} gallery wall curation rows.${getBackupStatusText(savedData)}`, "success");
}

async function saveGalleryCurationWall(card) {
  if (!card) {
    throw new Error("No gallery wall card is currently selected.");
  }

  syncGalleryGridPlacementFromField(card.querySelector('[data-gallery-grid-field="gridX"]'));

  const displayOrder = getGalleryCurationCardDisplayOrder(card);
  const wallRecord = collectGalleryCurationCard(card, state, displayOrder);

  assertGalleryPlacementIsCollisionFree(getGalleryCardPlacementRecords());
  setStatus(`Saving gallery wall ${wallRecord.wallId}...`, "neutral");

  const savedData = await saveGalleryCurationWallApi(wallRecord);

  applyLoadedState(savedData);
  setDirtyState(false);
  setStatus(`Saved gallery wall ${wallRecord.wallId}.${getBackupStatusText(savedData)}`, "success");
}

async function saveData() {
  const route = getCurrentRoute();

  if (route.name === "gallery") {
    await saveGalleryCuration();
    return;
  }

  await savePayload(collectEditorData(state));
}

async function saveImageCard(card) {
  const payload = collectImageCardSavePayload(state, card);
  const imageTitle = card?.querySelector('[data-field="title"]')?.value?.trim() || card?.dataset.imageId || "image";

  const savedData = await savePayload(payload);
  setStatus(`Saved ${imageTitle} from the image editor.${getBackupStatusText(savedData)}`, "success");
}

// Reads only the crop/framing controls from the open crop page.
function getCropPageUpdatesFromDom() {
  const cropEditor = document.querySelector("[data-crop-editor]");

  if (!cropEditor) {
    throw new Error("No crop editor is currently open.");
  }

  const imageId = cropEditor.dataset.cropImageId;

  if (!imageId) {
    throw new Error("The crop editor does not have an image ID.");
  }

  const updates = {};
  const cropField = cropEditor.querySelector("[data-crop-field]");
  const cropFieldName = cropField?.dataset.cropField;

  if (cropFieldName) {
    const xSlider = cropEditor.querySelector('[data-position-axis="x"]');
    const ySlider = cropEditor.querySelector('[data-position-axis="y"]');

    if (xSlider && ySlider) {
      updates[cropFieldName] = formatObjectPosition(Number(xSlider.value), Number(ySlider.value));
    } else if (cropField?.value) {
      updates[cropFieldName] = String(cropField.value).trim();
    }
  }

  cropEditor.querySelectorAll("[data-crop-setting]").forEach((input) => {
    const field = input.dataset.cropSetting;
    const value = String(input.value ?? "").trim();

    if (field && value) {
      updates[field] = value;
    }
  });

  return { imageId, updates };
}

async function saveCropPage() {
  const { imageId, updates } = getCropPageUpdatesFromDom();

  setStatus("Saving crop settings...", "neutral");

  const savedData = await saveImageUpdatesApi(imageId, updates);

  applyLoadedState(savedData);
  setDirtyState(false);
  setStatus(`Saved crop settings.${getBackupStatusText(savedData)}`, "success");
}

// Moves image cards in the DOM before the user saves the new order.
function moveGridCard(card, direction, successMessage) {
  if (!card) {
    return;
  }

  if (direction === "top") {
    const parent = card.parentElement;

    if (parent) {
      parent.prepend(card);
      setDirtyState(true, successMessage);
    }

    return;
  }

  if (direction === "up") {
    const previousCard = card.previousElementSibling;

    if (previousCard) {
      card.parentElement.insertBefore(card, previousCard);
      setDirtyState(true, successMessage);
    }

    return;
  }

  if (direction === "down") {
    const nextCard = card.nextElementSibling;

    if (nextCard) {
      card.parentElement.insertBefore(nextCard, card);
      setDirtyState(true, successMessage);
    }
  }
}

function getCategoryOrderGridFromNode(node) {
  return node?.closest?.("[data-category-order-grid]") ?? null;
}

function isCategoryOrderInteractiveTarget(target) {
  return Boolean(target?.closest?.([
    "button",
    "input",
    "select",
    "textarea",
    "label",
    "summary",
    "details",
    "[contenteditable='true']",
    "[data-no-card-drag]"
  ].join(", ")));
}

function getCategoryOrderCards(grid) {
  return Array.from(grid.children)
    .filter((node) => node.matches?.("[data-category-order-card]") && !node.classList.contains("is-dragging"))
    .filter((node) => !node.hidden && node.offsetParent !== null);
}

function buildCategoryOrderRows(grid) {
  const candidates = getCategoryOrderCards(grid);

  if (!candidates.length) {
    return [];
  }

  const rowTolerance = 24;
  const rows = [];

  candidates.forEach((node, orderIndex) => {
    const rect = node.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const existingRow = rows.find((row) => Math.abs(row.centerY - centerY) <= rowTolerance);
    const item = { node, rect, centerY, orderIndex };

    if (existingRow) {
      existingRow.items.push(item);
      existingRow.centerY = existingRow.items.reduce((total, rowItem) => total + rowItem.centerY, 0) / existingRow.items.length;
    } else {
      rows.push({ centerY, items: [item] });
    }
  });

  rows.sort((a, b) => a.centerY - b.centerY);
  rows.forEach((row) => row.items.sort((a, b) => a.rect.left - b.rect.left));

  return rows;
}

function getCategoryOrderRowFromPointer(rows, clientY) {
  if (!rows.length) {
    return null;
  }

  let rowIndex = rows.findIndex((row, index) => {
    const previousRow = rows[index - 1];
    const nextRow = rows[index + 1];
    const upperBoundary = previousRow ? (previousRow.centerY + row.centerY) / 2 : Number.NEGATIVE_INFINITY;
    const lowerBoundary = nextRow ? (row.centerY + nextRow.centerY) / 2 : Number.POSITIVE_INFINITY;

    return clientY >= upperBoundary && clientY < lowerBoundary;
  });

  if (rowIndex < 0) {
    rowIndex = clientY < rows[0].centerY ? 0 : rows.length - 1;
  }

  return rows[rowIndex];
}

function clampCategoryOrderInsertionIndex(index, maxIndex) {
  if (!Number.isFinite(index)) {
    return 0;
  }

  return Math.max(0, Math.min(maxIndex, index));
}

function getCategoryOrderInsertionIndex(grid, clientX, clientY, currentIndex = 0) {
  const cards = getCategoryOrderCards(grid);
  const rows = buildCategoryOrderRows(grid);
  const row = getCategoryOrderRowFromPointer(rows, clientY);

  if (!row) {
    return 0;
  }

  const safeCurrentIndex = clampCategoryOrderInsertionIndex(currentIndex, cards.length);
  const firstItem = row.items[0];
  const lastItem = row.items[row.items.length - 1];

  if (clientX <= firstItem.rect.left) {
    return firstItem.orderIndex;
  }

  if (clientX >= lastItem.rect.right) {
    return lastItem.orderIndex + 1;
  }

  for (let index = 0; index < row.items.length; index += 1) {
    const item = row.items[index];
    const nextItem = row.items[index + 1];

    if (clientX >= item.rect.left && clientX <= item.rect.right) {
      const ratio = (clientX - item.rect.left) / Math.max(1, item.rect.width);
      const isMovingRightAcrossItem = safeCurrentIndex <= item.orderIndex;
      const isMovingLeftAcrossItem = safeCurrentIndex > item.orderIndex;

      // Moving right felt too abrupt because the placeholder advanced as soon
      // as the pointer crossed the target card midpoint. Use a small
      // direction-aware buffer so rightward movement requires a little more
      // commitment and better matches the steadier leftward pacing.
      if (isMovingRightAcrossItem) {
        return ratio >= CATEGORY_ORDER_DRAG_RIGHT_ADVANCE_RATIO ? item.orderIndex + 1 : item.orderIndex;
      }

      if (isMovingLeftAcrossItem) {
        // Leftward placement felt too sensitive once the single-placeholder
        // drag model was stable. Require the pointer to move deeper into the
        // left side of the target card before the placeholder crosses to that
        // card's leading edge. This keeps left and right placement from
        // feeling like they flip at different speeds.
        return ratio <= CATEGORY_ORDER_DRAG_LEFT_ADVANCE_RATIO ? item.orderIndex : item.orderIndex + 1;
      }

      return ratio >= CATEGORY_ORDER_DRAG_CENTER_ADVANCE_RATIO ? item.orderIndex + 1 : item.orderIndex;
    }

    if (nextItem && clientX > item.rect.right && clientX < nextItem.rect.left) {
      return safeCurrentIndex;
    }
  }

  return lastItem.orderIndex + 1;
}

function placeCategoryOrderPlaceholder(event) {
  if (!activeCategoryOrderDrag?.card || !activeCategoryOrderDrag?.grid) {
    return;
  }

  const { card, grid } = activeCategoryOrderDrag;
  let currentIndex = Array.from(grid.children).indexOf(card);

  // The real card becomes the placeholder while the ghost card floats above the
  // grid. Moving that one DOM node prevents the duplicate blank cell that could
  // appear when a separate placeholder node and the hidden source card competed
  // for CSS Grid placement.
  if (card.parentElement === grid) {
    card.remove();
  }

  const cards = getCategoryOrderCards(grid);
  currentIndex = clampCategoryOrderInsertionIndex(currentIndex, cards.length);

  const insertionIndex = getCategoryOrderInsertionIndex(grid, event.clientX, event.clientY, currentIndex);
  const insertionPoint = cards[insertionIndex] ?? null;

  if (insertionPoint) {
    grid.insertBefore(card, insertionPoint);
    return;
  }

  grid.appendChild(card);
}

function createCategoryOrderDragGhost(card, rect) {
  const ghost = card.cloneNode(true);
  ghost.classList.add("category-order-drag-ghost");
  ghost.classList.remove("is-dragging");
  ghost.setAttribute("aria-hidden", "true");
  ghost.querySelectorAll("a, button, input, select, textarea, label").forEach((node) => {
    node.setAttribute("tabindex", "-1");
  });
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  document.body.appendChild(ghost);

  return ghost;
}

function moveCategoryOrderGhost(event) {
  if (!activeCategoryOrderDrag?.ghost) {
    return;
  }

  const { ghost, pointerOffsetX, pointerOffsetY } = activeCategoryOrderDrag;
  ghost.style.left = `${event.clientX - pointerOffsetX}px`;
  ghost.style.top = `${event.clientY - pointerOffsetY}px`;
}

const CATEGORY_ORDER_DRAG_HOLD_MS = 140;
const CATEGORY_ORDER_DRAG_MOVE_THRESHOLD = 6;
// Keep before/after placement near the visual midpoint of a target card.
// The left threshold also controls how quickly a card that is already placed
// after a target will snap back before it; keeping it close to center prevents
// right-side placement from feeling like it activates after only a small overlap.
const CATEGORY_ORDER_DRAG_RIGHT_ADVANCE_RATIO = 0.58;
const CATEGORY_ORDER_DRAG_LEFT_ADVANCE_RATIO = 0.48;
const CATEGORY_ORDER_DRAG_CENTER_ADVANCE_RATIO = 0.54;

function getCategoryOrderDragSnapshot(event) {
  return {
    clientX: event.clientX,
    clientY: event.clientY,
    pointerId: event.pointerId,
    preventDefault: () => event.preventDefault()
  };
}

function clearCategoryOrderDragTimer() {
  if (activeCategoryOrderDrag?.holdTimer) {
    window.clearTimeout(activeCategoryOrderDrag.holdTimer);
    activeCategoryOrderDrag.holdTimer = null;
  }
}

function beginCategoryOrderDrag(card, event) {
  const grid = getCategoryOrderGridFromNode(card);

  if (!card || !grid || activeCategoryOrderDrag) {
    return;
  }

  const initialLink = event.target.closest?.("a[href]");

  const dragState = {
    card,
    grid,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startedAt: window.performance?.now ? window.performance.now() : Date.now(),
    latestX: event.clientX,
    latestY: event.clientY,
    started: false,
    ghost: null,
    originalNextSibling: card.nextElementSibling,
    initialLinkHref: initialLink?.getAttribute("href") ?? "",
    pointerOffsetX: 0,
    pointerOffsetY: 0,
    holdTimer: null
  };

  dragState.holdTimer = window.setTimeout(() => {
    if (!activeCategoryOrderDrag || activeCategoryOrderDrag.pointerId !== dragState.pointerId || activeCategoryOrderDrag.started) {
      return;
    }

    activateCategoryOrderDrag({
      clientX: activeCategoryOrderDrag.latestX,
      clientY: activeCategoryOrderDrag.latestY,
      pointerId: activeCategoryOrderDrag.pointerId,
      preventDefault: () => {}
    });
  }, CATEGORY_ORDER_DRAG_HOLD_MS);

  activeCategoryOrderDrag = dragState;
}

function activateCategoryOrderDrag(event) {
  if (!activeCategoryOrderDrag || activeCategoryOrderDrag.started) {
    return;
  }

  clearCategoryOrderDragTimer();

  const { card, grid } = activeCategoryOrderDrag;
  const rect = card.getBoundingClientRect();

  activeCategoryOrderDrag.started = true;
  card.setPointerCapture?.(event.pointerId);
  activeCategoryOrderDrag.pointerOffsetX = event.clientX - rect.left;
  activeCategoryOrderDrag.pointerOffsetY = event.clientY - rect.top;
  activeCategoryOrderDrag.ghost = createCategoryOrderDragGhost(card, rect);

  card.style.minHeight = `${Math.max(140, Math.round(rect.height))}px`;
  card.classList.add("is-dragging");
  grid.dataset.categoryDragging = "true";
  document.body.dataset.categoryImageDragging = "true";
  setStatus("Dragging image card. Release to keep the new order, then save the category order.", "neutral");
  moveCategoryOrderGhost(event);
  placeCategoryOrderPlaceholder(event);
}

function updateCategoryOrderDrag(event) {
  if (!activeCategoryOrderDrag || event.pointerId !== activeCategoryOrderDrag.pointerId) {
    return;
  }

  activeCategoryOrderDrag.latestX = event.clientX;
  activeCategoryOrderDrag.latestY = event.clientY;

  const distance = Math.hypot(
    event.clientX - activeCategoryOrderDrag.startX,
    event.clientY - activeCategoryOrderDrag.startY
  );

  if (!activeCategoryOrderDrag.started) {
    if (distance < CATEGORY_ORDER_DRAG_MOVE_THRESHOLD) {
      return;
    }

    const elapsed = window.performance?.now ? window.performance.now() : Date.now();

    if (elapsed - activeCategoryOrderDrag.startedAt < CATEGORY_ORDER_DRAG_HOLD_MS) {
      return;
    }
  }

  event.preventDefault();
  activateCategoryOrderDrag(getCategoryOrderDragSnapshot(event));
  moveCategoryOrderGhost(event);
  placeCategoryOrderPlaceholder(event);
}

function finishCategoryOrderDrag(event, commit = true) {
  if (!activeCategoryOrderDrag || event.pointerId !== activeCategoryOrderDrag.pointerId) {
    return;
  }

  clearCategoryOrderDragTimer();

  const { card, grid, started, ghost, originalNextSibling, initialLinkHref } = activeCategoryOrderDrag;

  if (card.hasPointerCapture?.(event.pointerId)) {
    card.releasePointerCapture(event.pointerId);
  }

  if (started) {
    if (!commit) {
      grid.insertBefore(card, originalNextSibling?.parentElement === grid ? originalNextSibling : null);
    }

    ghost?.remove();
  }

  card.style.minHeight = "";
  card.classList.remove("is-dragging");
  grid.dataset.categoryDragging = "false";
  delete document.body.dataset.categoryImageDragging;
  activeCategoryOrderDrag = null;

  if (!started && commit && initialLinkHref) {
    window.setTimeout(() => {
      if (window.location.hash !== initialLinkHref) {
        window.location.hash = initialLinkHref;
      }
    }, 0);
  }

  if (started && commit) {
    suppressNextCategoryOrderClick = true;
    window.setTimeout(() => {
      suppressNextCategoryOrderClick = false;
    }, 0);
    setDirtyState(true, "Reordered category images. Click Save Category Order to preserve it.");
  }
}

// Moves category rows in the DOM before saving category order.
function moveCategoryRow(row, direction) {
  if (!row) {
    return;
  }

  if (direction === "top") {
    elements.categoryList.prepend(row);
    setDirtyState(true, "Moved category to top. Click Save Category Settings to preserve it.");
    return;
  }

  if (direction === "up") {
    const previousRow = row.previousElementSibling;

    if (previousRow) {
      elements.categoryList.insertBefore(row, previousRow);
      setDirtyState(true, "Moved category up. Click Save Category Settings to preserve it.");
    }

    return;
  }

  if (direction === "down") {
    const nextRow = row.nextElementSibling;

    if (nextRow) {
      elements.categoryList.insertBefore(nextRow, row);
      setDirtyState(true, "Moved category down. Click Save Category Settings to preserve it.");
    }
  }
}

// Creates editable preview records for selected image files before import.
async function prepareImportReview() {
  state = collectEditorData(state);

  if (!elements.importFiles.files.length) {
    setImportSummary("Choose at least one image file first.");
    setStatus("Choose at least one image file before preparing an import.", "warning");
    return;
  }

  clearPendingImportItems();
  setStatus("Reading image dimensions...", "neutral");

  const category = elements.importCategory.value || getFallbackCategoryId(state);
  const year = elements.importYear.value.trim();
  const location = elements.importLocation.value.trim();
  const note = elements.importNote.value.trim();
  const altPrefix = elements.importAltPrefix.value.trim() || "Photograph by Taylor Pike";
  const usedIds = new Set(state.images.map((image) => image.id));
  const files = Array.from(elements.importFiles.files);

  pendingImportItems = await Promise.all(files.map(async (file) => {
    const title = titleFromFilename(file.name);
    const baseId = makeImageIdFromTitle(title);
    const id = makeUniqueImageId(baseId, usedIds);

    usedIds.add(id);

    const metadata = await readImportImageMetadata(file);
    const gallerySize = getImportGalleryDefaultSize(metadata.imageOrientation);

    return {
      file,
      previewUrl: URL.createObjectURL(file),
      id,
      title,
      category,
      year,
      location,
      note,
      alt: `${altPrefix}: ${title}`,
      thumbnailPosition: "50% 50%",
      heroPosition: "50% 50%",
      heroFitMode: "cover",
      heroFrameStyle: "landscape",
      galleryPosition: "50% 50%",
      galleryFitMode: "cover",
      galleryFrameStyle: "auto",
      gallerySize,
      ...metadata
    };
  }));

  renderImportReview(state, elements, pendingImportItems);
  updateImportReviewValidation();
  updateImportReviewControls();
  resetImportProgress();
  setDirtyState(true, `Prepared ${pendingImportItems.length} images for review. Review each card, remove anything you do not want, then import the approved photos.`);
}

function removePendingImportItem(index) {
  if (index < 0 || index >= pendingImportItems.length) {
    return;
  }

  syncPendingImportItemsFromReview();

  const [removedItem] = pendingImportItems.splice(index, 1);

  if (removedItem?.previewUrl) {
    URL.revokeObjectURL(removedItem.previewUrl);
  }

  renderImportReview(state, elements, pendingImportItems);
  updateImportReviewValidation();
  updateImportReviewControls();

  if (!pendingImportItems.length) {
    clearPendingImportItems();
    setDirtyState(false, "Import review cleared.");
    return;
  }

  setDirtyState(true, `Removed one photo from the import review. ${pendingImportItems.length} remain.`);
}

async function saveReviewedImport() {
  if (!pendingImportItems.length) {
    setImportSummary("Prepare an import first.");
    return;
  }

  syncPendingImportItemsFromReview();

  const formData = new FormData();
  const records = collectImportReviewRecords(state);
  const categories = collectCategories();
  const validation = validateImportRecords(records, state.images);

  if (!validation.isValid) {
    updateImportReviewValidation();
    throw new Error(validation.errors.map((item) => item.message).join(" "));
  }

  setStatus(`Importing ${getPendingImportCountLabel(pendingImportItems.length)}...`, "neutral");
  setImportSummary("Uploading files to the local editor...");
  resetImportProgress();
  setImportProgress(5, "Preparing upload package");
  appendImportProgressLog(`Queued ${getPendingImportCountLabel(pendingImportItems.length)} for import.`);

  if (elements.saveReviewedImportButton) {
    elements.saveReviewedImportButton.disabled = true;
  }

  pendingImportItems.forEach((item) => {
    formData.append("images", item.file);
  });

  formData.append("records", JSON.stringify(records));
  formData.append("categories", JSON.stringify(categories));

  appendImportProgressLog("Uploading original files and reviewed metadata.");

  let didMarkBackendProcessing = false;

  const result = await importReviewedImagesApi(formData, {
    onUploadProgress: ({ percent }) => {
      const uploadPercent = 5 + Math.round(percent * 0.45);
      setImportProgress(uploadPercent, `Uploading files (${percent}%)`);

      if (percent >= 100 && !didMarkBackendProcessing) {
        didMarkBackendProcessing = true;
        setImportProgress(62, "Creating WebP renditions and saving JSON");
        appendImportProgressLog("Upload complete. Backend is creating portfolio renditions and writing source data.");
      }
    }
  });

  setImportProgress(92, "Finalizing imported records");

  applyLoadedState(result);

  const importedTitles = result.importedImages.map((image) => image.title).join(", ");

  setImportProgress(100, "Import complete");
  appendImportProgressLog(`Imported ${result.importedImages.length} photo${result.importedImages.length === 1 ? "" : "s"}.`);

  elements.importFiles.value = "";
  clearPendingImportItems();

  window.location.hash = "#/images";

  setDirtyState(false);
  setStatus(`Imported ${result.importedImages.length} images.${getBackupStatusText(result)}`, "success");
  setImportSummary(importedTitles);
}

// Re-render the editor when the hash route changes, such as moving from Images to Import.
window.addEventListener("hashchange", () => {
  if (isRestoringHash) {
    isRestoringHash = false;
    return;
  }

  if (!confirmDiscardUnsavedChanges("switch editor sections")) {
    isRestoringHash = true;
    window.location.hash = lastConfirmedHash;
    return;
  }

  lastConfirmedHash = window.location.hash || "#/images";

  if (pendingImportItems.length) {
    clearPendingImportItems();
  }

  if (pendingAboutImportItems.length) {
    clearPendingAboutImportItems();
  }

  setDirtyState(false);

  const route = getCurrentRoute();

  renderAll(state, elements, route);
  setEditorRoute(route);

  if (route.name === "gallery") {
    syncGalleryPlacementCollisionState();
  }

  if (route.name === "backups") {
    refreshBackups().catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });
  }
});

elements.addCategoryButton.addEventListener("click", () => {
  state = collectEditorData(state);

  const label = prompt("Category name:");
  const cleanLabel = String(label ?? "").trim();

  if (!cleanLabel) {
    return;
  }

  const existingCategory = state.categories.find((category) => {
    return category.label.trim().toLowerCase() === cleanLabel.toLowerCase();
  });

  if (existingCategory) {
    setStatus(`Category "${existingCategory.label}" already exists.`, "neutral");
    return;
  }

  state.categories.push({
    id: makeUniqueCategoryId(cleanLabel),
    label: cleanLabel
  });

  setDirtyState(true, "Added category. Click Save Category Settings to preserve it.");
  rerenderCurrentRoute();
});

elements.saveCategorySettingsButton.addEventListener("click", () => {
  try {
    validateCategoryDrafts(collectCategories());
  } catch (error) {
    setStatus(error.message, "error");
    return;
  }

  saveData().catch((error) => {
    console.error(error);
    setStatus(error.message, "error");
  });
});

elements.refreshCategoriesButton.addEventListener("click", () => {
  state = collectEditorData(state);

  rerenderCurrentRoute("Category options refreshed.");
});

elements.categoryList.addEventListener("click", (event) => {
  const categoryMoveButton = event.target.closest("[data-move-category-row]");
  const removeButton = event.target.closest("[data-remove-category]");

  if (categoryMoveButton) {
    const row = categoryMoveButton.closest("[data-category-row]");
    const direction = categoryMoveButton.dataset.moveCategoryRow;

    moveCategoryRow(row, direction);
    return;
  }

  if (!removeButton) {
    return;
  }

  state = collectEditorData(state);

  const row = removeButton.closest("[data-category-row]");
  const categoryId = removeButton.dataset.removeCategory;
  const categoryIndex = state.categories.findIndex((category) => category.id === categoryId);

  if (categoryIndex === -1) {
    return;
  }

  if (state.categories.length <= 1) {
    setStatus("At least one category is required.", "error");
    return;
  }

  const category = state.categories[categoryIndex];
  const reassignTargetId = getCategoryReassignTarget(row, categoryId);
  const reassignTarget = state.categories.find((item) => item.id === reassignTargetId);
  const stats = getCategoryUsageStats(categoryId);
  const confirmed = confirm(
    `Remove category "${category.label}"?\n\n${stats.total} image${stats.total === 1 ? "" : "s"} and ${stats.hero} hero slide target${stats.hero === 1 ? "" : "s"} will be reassigned to "${reassignTarget?.label ?? reassignTargetId}". Save Category Settings afterward to write the change.`
  );

  if (!confirmed) {
    return;
  }

  state.categories.splice(categoryIndex, 1);

  const fallbackCategoryId = state.categories.some((item) => item.id === reassignTargetId)
    ? reassignTargetId
    : getFallbackCategoryId(state);
  const validCategoryIds = new Set(state.categories.map((item) => item.id));

  state.images = state.images.map((image) => {
    if (image.category !== categoryId && validCategoryIds.has(image.category)) {
      return image;
    }

    return {
      ...image,
      category: fallbackCategoryId
    };
  });

  state.heroSlides = state.heroSlides.map((slide) => {
    if (slide.targetCategory !== categoryId && validCategoryIds.has(slide.targetCategory)) {
      return slide;
    }

    return {
      ...slide,
      targetCategory: fallbackCategoryId
    };
  });

  setDirtyState(true, "Removed category and reassigned affected records. Click Save Category Settings to preserve it.");
  rerenderCurrentRoute();
});

// Live-preview slider changes without saving them yet.
elements.editorList.addEventListener("input", (event) => {
  const slider = event.target.closest("[data-position-axis]");
  const gallerySizeRange = event.target.closest("[data-gallery-size-range]");
  const editableField = event.target.closest("[data-field], [data-category-field], [data-image-id-suggestion]");
  const imageCard = event.target.closest("[data-image-card]");

  if (editableField?.dataset.field === "title" && imageCard) {
    refreshImageIdSuggestionFromTitle(imageCard);
  }

  if (event.target.closest("[data-image-id-suggestion]") && imageCard) {
    updateImageIdPathPreview(imageCard);
  }

  if (slider) {
    updateFramingControl(slider);
    setDirtyState(true, "Preview updated. Save the crop or JSON to keep this change.");
  }

  if (gallerySizeRange) {
    updateGallerySizeControl(gallerySizeRange);
    setDirtyState(true, "Gallery size updated. Click Save Changes or Save Crop to preserve it.");
  }

  if (editableField && !slider && !gallerySizeRange) {
    setDirtyState(true, "Unsaved changes. Click Save Changes to preserve them.");
  }
});

// Re-render preview sections when fit/frame dropdowns change.
elements.editorList.addEventListener("change", (event) => {
  const bulkSelect = event.target.closest("[data-bulk-image-select]");
  const bulkField = event.target.closest("[data-bulk-field]");
  const cropSetting = event.target.closest("[data-crop-setting]");
  const imageEditorSetting = event.target.closest('[data-field="galleryFrameStyle"], [data-field="galleryFitMode"], [data-field="isPublic"]');
  const editableField = event.target.closest("[data-field], [data-category-field]");

  if (bulkSelect || bulkField) {
    updateBulkSelectionCount();
    return;
  }

  if (!cropSetting && !imageEditorSetting && !editableField) {
    return;
  }

  updateStateFromCurrentDom();
  setDirtyState(true, "Preview updated. Click Save Changes or Save Crop to preserve it.");
  rerenderCurrentRoute();
});

elements.importReviewList.addEventListener("input", (event) => {
  const slider = event.target.closest("[data-position-axis]");
  const gallerySizeRange = event.target.closest("[data-gallery-size-range]");
  const importField = event.target.closest("[data-import-field]");
  const importCard = event.target.closest("[data-import-card]");

  if (importField?.dataset.importField === "id" && importCard) {
    importCard.dataset.importIdManual = "true";
    updateImportOutputPathPreview(importCard);
  }

  if (importField?.dataset.importField === "title" && importCard) {
    syncImportIdFromTitle(importCard);
  }

  if (slider) {
    updateFramingControl(slider);
    updateImportReviewValidation();
    setDirtyState(true, "Import crop preview updated. Save the reviewed import to keep it.");
    return;
  }

  if (gallerySizeRange) {
    updateGallerySizeControl(gallerySizeRange);
    updateImportReviewValidation();
    setDirtyState(true, "Import gallery size updated. Save the reviewed import to keep it.");
    return;
  }

  updateImportReviewValidation();
  setDirtyState(true, "Import review has unsaved changes. Save the reviewed import to keep it.");
});

elements.importReviewList.addEventListener("change", () => {
  updateImportReviewValidation();
  setDirtyState(true, "Import review has unsaved changes. Save the reviewed import to keep it.");
});



elements.aboutCopyEditor?.addEventListener("input", (event) => {
  const field = event.target.closest("[data-about-copy-field]");

  if (!field) {
    return;
  }

  setDirtyState(true, "About copy edits are unsaved. Click Save Changes to preserve them.");
});

elements.aboutCopyEditor?.addEventListener("change", (event) => {
  const field = event.target.closest("[data-about-copy-field]");

  if (!field) {
    return;
  }

  setDirtyState(true, "About copy edits are unsaved. Click Save Changes to preserve them.");
});

elements.aboutPhotoList?.addEventListener("input", (event) => {
  const field = event.target.closest("[data-field]");

  if (!field) {
    return;
  }

  setDirtyState(true, "About photo edits are unsaved. Click Save Changes to preserve them.");
});

elements.aboutPhotoList?.addEventListener("change", (event) => {
  const field = event.target.closest("[data-field]");

  if (!field) {
    return;
  }

  setDirtyState(true, "About photo edits are unsaved. Click Save Changes to preserve them.");
});

elements.aboutImportReviewList?.addEventListener("input", () => {
  setDirtyState(true, "About import review has unsaved changes. Import reviewed About photos to keep it.");
});

elements.aboutImportReviewList?.addEventListener("change", () => {
  setDirtyState(true, "About import review has unsaved changes. Import reviewed About photos to keep it.");
});


elements.importReviewList.addEventListener("click", (event) => {
  const previewButton = event.target.closest("[data-open-import-lightbox]");
  const removeButton = event.target.closest("[data-remove-import-item]");
  const createCategoryButton = event.target.closest("[data-create-import-category]");
  const useTitleIdButton = event.target.closest("[data-import-use-title-id]");

  if (previewButton) {
    openImportLightbox(Number(previewButton.dataset.openImportLightbox));
    return;
  }

  if (removeButton) {
    removePendingImportItem(Number(removeButton.dataset.removeImportItem));
    return;
  }

  if (createCategoryButton) {
    const card = createCategoryButton.closest("[data-import-card]");
    const nextCategory = createImportCategory(false);

    if (nextCategory && card) {
      const updatedCard = document.querySelector(`[data-import-card][data-import-index="${card.dataset.importIndex}"]`);
      const categorySelect = updatedCard?.querySelector('[data-import-field="category"]');

      if (categorySelect) {
        categorySelect.value = nextCategory.id;
        updateImportReviewValidation();
      }
    }

    return;
  }

  if (!useTitleIdButton) {
    return;
  }

  const card = useTitleIdButton.closest("[data-import-card]");

  if (!card) {
    return;
  }

  syncImportIdFromTitle(card, true);
  updateImportReviewValidation();
  setDirtyState(true, "Import ID refreshed from title. Save the reviewed import to keep it.");
});



// Tracks edits on the virtual gallery curation page.
elements.galleryCurationList?.addEventListener("input", (event) => {
  const galleryFilter = event.target.closest("[data-gallery-curation-filter]");
  const artworkPickerFilter = event.target.closest("[data-artwork-picker-filter]");
  const gridField = event.target.closest("[data-gallery-grid-field]");

  if (galleryFilter) {
    applyGalleryCurationFilters();
    return;
  }

  if (artworkPickerFilter) {
    applyArtworkPickerFilters();
    return;
  }

  if (gridField) {
    syncGalleryGridPlacementFromField(gridField);
  }

  setDirtyState(true, "Gallery curation has unsaved changes. Click Save Wall or Save All Gallery Curation to preserve it.");
});

elements.galleryCurationList?.addEventListener("change", (event) => {
  const galleryFilter = event.target.closest("[data-gallery-curation-filter]");
  const artworkPickerFilter = event.target.closest("[data-artwork-picker-filter]");
  const gridField = event.target.closest("[data-gallery-grid-field]");
  const field = event.target.closest("[data-gallery-curation-field]");

  if (galleryFilter) {
    applyGalleryCurationFilters();
    return;
  }

  if (artworkPickerFilter) {
    applyArtworkPickerFilters();
    return;
  }

  if (gridField) {
    syncGalleryGridPlacementFromField(gridField);
  }

  const card = field?.closest("[data-gallery-curation-card]") ?? gridField?.closest("[data-gallery-curation-card]");

  if (field?.dataset.galleryCurationField === "artworkId") {
    syncGalleryCurationArtworkDisplay(card, field.value);
  }

  if (field?.dataset.galleryCurationField === "wallType") {
    syncGalleryWallTypeDisplay(card);
    syncGalleryPlacementCollisionState();
    refreshGalleryPlacementMapFromCards();
    setDirtyState(true, "Wall block footprint changed. Click Save Wall or Save All Gallery Curation to preserve it.");
    return;
  }

  if (field?.dataset.galleryCurationField === "rotationYDegrees") {
    syncGalleryPlacementCollisionState();
  }

  if (field?.dataset.galleryCurationField === "placedInGallery") {
    syncGalleryPlacementCollisionState();
    syncGalleryCurationCardState(card);
    applyGalleryCurationFilters();
    refreshGalleryPlacementMapFromCards();
    setDirtyState(true, "Gallery map placement changed. Click Save Wall or Save All Gallery Curation to preserve it.");
    return;
  }

  if (field?.dataset.galleryCurationField === "showInGallery" || field?.dataset.galleryCurationField === "plaqueSide" || field?.dataset.galleryCurationField === "plaqueEnabled") {
    syncGalleryCurationCardState(card);
    syncGalleryWallPreview(card);
    applyGalleryCurationFilters();
  }

  setDirtyState(true, "Gallery curation has unsaved changes. Click Save Wall or Save All Gallery Curation to preserve it.");
});

elements.galleryCurationList?.addEventListener("click", (event) => {
  const saveGalleryButton = event.target.closest("[data-save-gallery-curation]");
  const saveGalleryWallButton = event.target.closest("[data-save-gallery-curation-wall]");
  const moveGalleryButton = event.target.closest("[data-move-gallery-curation]");
  const openArtworkPickerButton = event.target.closest("[data-open-artwork-picker]");
  const closeArtworkPickerButton = event.target.closest("[data-artwork-picker-close]");
  const artworkPickerOption = event.target.closest("[data-artwork-picker-option]");
  const openPreviewButton = event.target.closest("[data-open-gallery-preview]");
  const closePreviewButton = event.target.closest("[data-gallery-preview-close]");
  const addWallButton = event.target.closest("[data-add-gallery-wall-card]");
  const closeAddWallButton = event.target.closest("[data-gallery-add-wall-close]");
  const createAddWallButton = event.target.closest("[data-create-gallery-wall-card]");
  const removeWallButton = event.target.closest("[data-remove-gallery-wall-card]");
  const mapMarker = event.target.closest("[data-placement-marker]");
  const sidebarWall = event.target.closest("[data-gallery-wall-drag-source]");
  const rotateMapButton = event.target.closest("[data-gallery-map-rotate]");
  const flipMapButton = event.target.closest("[data-gallery-map-flip]");
  const unplaceMapButton = event.target.closest("[data-gallery-map-unplace]");

  if (rotateMapButton) {
    rotateSelectedGalleryWall(Number(rotateMapButton.dataset.galleryMapRotate));
    return;
  }

  if (flipMapButton) {
    flipSelectedGalleryWall();
    return;
  }

  if (unplaceMapButton) {
    unplaceSelectedGalleryWall();
    return;
  }

  if (mapMarker) {
    selectGalleryWall(mapMarker.dataset.placementMarkerWallId);
    return;
  }

  if (sidebarWall) {
    selectGalleryWall(sidebarWall.dataset.wallId);
    return;
  }

  if (addWallButton) {
    openGalleryAddWallOverlay();
    return;
  }

  if (closeAddWallButton) {
    closeGalleryAddWallOverlay();
    return;
  }

  if (createAddWallButton) {
    addGalleryWallCardFromOverlay();
    return;
  }

  if (removeWallButton) {
    removeGalleryWallCard(removeWallButton.closest("[data-gallery-curation-card]"));
    return;
  }

  if (openPreviewButton) {
    openGalleryPreviewLightbox(openPreviewButton);
    return;
  }

  if (closePreviewButton) {
    closeGalleryPreviewLightbox();
    return;
  }

  if (openArtworkPickerButton) {
    openGalleryArtworkPicker(openArtworkPickerButton.closest("[data-gallery-curation-card]"));
    return;
  }

  if (closeArtworkPickerButton) {
    closeGalleryArtworkPicker();
    return;
  }

  if (artworkPickerOption) {
    chooseGalleryArtworkFromPicker(artworkPickerOption);
    return;
  }

  if (saveGalleryButton) {
    saveGalleryCuration().catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });
    return;
  }

  if (saveGalleryWallButton) {
    saveGalleryCurationWall(saveGalleryWallButton.closest("[data-gallery-curation-card]")).catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });
    return;
  }

  if (moveGalleryButton) {
    const card = moveGalleryButton.closest("[data-gallery-curation-card]");
    const direction = moveGalleryButton.dataset.moveGalleryCuration;

    moveGridCard(card, direction, "Moved gallery wall assignment. Click Save Wall or Save All Gallery Curation to preserve it.");
  }
});

elements.galleryCurationList?.addEventListener("dragstart", (event) => {
  const source = event.target.closest("[data-gallery-wall-drag-source], [data-placement-marker]");

  if (!source) {
    return;
  }

  const wallId = source.dataset.wallId ?? source.dataset.placementMarkerWallId;
  const sourceType = source.matches("[data-placement-marker]") ? "map" : "sidebar";

  if (!wallId) {
    return;
  }

  beginGalleryWallDrag(wallId, sourceType);
  event.dataTransfer?.setData("text/plain", wallId);
  event.dataTransfer?.setData("application/x-gallery-wall-id", wallId);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
  suppressNativeGalleryDragPreview(event);
});

elements.galleryCurationList?.addEventListener("dragover", (event) => {
  const map = event.target.closest("[data-gallery-placement-map]");

  if (!map || !activeGalleryWallDrag) {
    return;
  }

  event.preventDefault();
  updateGalleryPlacementDropPreview(event, map);

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
});

elements.galleryCurationList?.addEventListener("dragleave", (event) => {
  const map = event.target.closest("[data-gallery-placement-map]");

  if (!map || map.contains(event.relatedTarget)) {
    return;
  }

  hideGalleryPlacementDropPreview(map);
});

elements.galleryCurationList?.addEventListener("drop", (event) => {
  const map = event.target.closest("[data-gallery-placement-map]");

  if (!map || !activeGalleryWallDrag) {
    return;
  }

  event.preventDefault();
  hideGalleryPlacementDropPreview(map);
  placeDraggedGalleryWallOnMap(event, map);
});

elements.galleryCurationList?.addEventListener("dragend", () => {
  hideGalleryPlacementDropPreview();
  endGalleryWallDrag();
});

elements.galleryCurationList?.addEventListener("keydown", (event) => {
  const openPreviewButton = event.target.closest("[data-open-gallery-preview]");

  if (!openPreviewButton || (event.key !== "Enter" && event.key !== " ")) {
    return;
  }

  event.preventDefault();
  openGalleryPreviewLightbox(openPreviewButton);
});

// Handles backup page actions separately from image editor actions.
elements.backupList?.addEventListener("click", (event) => {
  const refreshButton = event.target.closest("[data-refresh-backups]");
  const restoreButton = event.target.closest("[data-restore-backup]");

  if (refreshButton) {
    refreshBackups().catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });
    return;
  }

  if (restoreButton) {
    const backupFolder = restoreButton.dataset.restoreBackup;

    if (!backupFolder) {
      return;
    }

    restoreBackup(backupFolder).catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });
  }
});

elements.editorList.addEventListener("dragstart", (event) => {
  if (event.target.closest("[data-category-order-card]")) {
    event.preventDefault();
  }
});

elements.editorList.addEventListener("pointerdown", (event) => {
  const card = event.target.closest("[data-category-order-card]");

  if (event.button !== 0 || !card || !getCategoryOrderGridFromNode(card) || isCategoryOrderInteractiveTarget(event.target)) {
    return;
  }

  beginCategoryOrderDrag(card, event);
});

elements.editorList.addEventListener("pointermove", (event) => {
  updateCategoryOrderDrag(event);
});

window.addEventListener("pointermove", (event) => {
  updateCategoryOrderDrag(event);
});

elements.editorList.addEventListener("pointerup", (event) => {
  finishCategoryOrderDrag(event, true);
});

elements.editorList.addEventListener("pointercancel", (event) => {
  finishCategoryOrderDrag(event, false);
});

window.addEventListener("pointerup", (event) => {
  finishCategoryOrderDrag(event, true);
});

window.addEventListener("pointercancel", (event) => {
  finishCategoryOrderDrag(event, false);
});

elements.editorList.addEventListener("click", (event) => {
  if (!suppressNextCategoryOrderClick) {
    return;
  }

  const card = event.target.closest("[data-category-order-card]");

  if (card) {
    event.preventDefault();
    event.stopPropagation();
    suppressNextCategoryOrderClick = false;
  }
}, true);

// Route clicks inside the dynamic editor list to the correct action handler.
elements.editorList.addEventListener("click", (event) => {
  const bulkSelectVisibleButton = event.target.closest("[data-bulk-select-visible]");
  const bulkClearSelectionButton = event.target.closest("[data-bulk-clear-selection]");
  const bulkApplyButton = event.target.closest("[data-bulk-apply]");
  const cropSettingButton = event.target.closest("[data-set-crop-setting]");
  const categoryMoveButton = event.target.closest("[data-move-category-image]");
  const heroMoveButton = event.target.closest("[data-move-hero-image]");
  const removeHeroButton = event.target.closest("[data-remove-hero-image]");
  const saveCategoryOrderButton = event.target.closest("[data-save-category-order]");
  const saveHeroOrderButton = event.target.closest("[data-save-hero-order]");
  const saveCropButton = event.target.closest("[data-save-crop-page]");
  const suggestTitleIdButton = event.target.closest("[data-suggest-title-id]");
  const renameImageIdButton = event.target.closest("[data-rename-image-id]");
  const addImageToAboutButton = event.target.closest("[data-add-image-to-about]");
  const saveButton = event.target.closest("[data-save-image-card]");
  const removeButton = event.target.closest("[data-remove-image-card]");

  if (bulkSelectVisibleButton) {
    setBulkSelection(true);
    setStatus("Selected visible image cards for bulk editing.", "neutral");
    return;
  }

  if (bulkClearSelectionButton) {
    resetBulkControls();
    setStatus("Cleared bulk editor selection.", "neutral");
    return;
  }

  if (bulkApplyButton) {
    applyBulkEditorUpdates().catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });

    return;
  }

  if (suggestTitleIdButton) {
    const card = suggestTitleIdButton.closest("[data-image-card]");
    refreshImageIdSuggestionFromTitle(card);
    setDirtyState(true, "Title-based ID suggestion refreshed. Click Rename ID + Rendition Files to apply it.");
    return;
  }

  if (renameImageIdButton) {
    const card = renameImageIdButton.closest("[data-image-card]");

    renameImageIdFromCard(card).catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });

    return;
  }

  if (addImageToAboutButton) {
    addPortfolioImageToAbout(addImageToAboutButton.dataset.addImageToAbout, addImageToAboutButton);
    return;
  }

  if (cropSettingButton) {
    const field = cropSettingButton.dataset.setCropSetting;
    const value = cropSettingButton.dataset.settingValue;
    const cropEditor = cropSettingButton.closest("[data-crop-editor]");
    const input = cropEditor?.querySelector(`[data-crop-setting="${field}"]`);

    if (input && value) {
      input.value = value;
      updateStateFromCurrentDom();
      setDirtyState(true, "Crop preview updated. Click Save Crop to preserve it.");
      rerenderCurrentRoute();
    }

    return;
  }

  if (categoryMoveButton) {
    const card = categoryMoveButton.closest("[data-category-order-card]");
    const direction = categoryMoveButton.dataset.moveCategoryImage;

    moveGridCard(card, direction, "Moved image. Click Save Category Order to preserve it.");
    return;
  }

  if (heroMoveButton) {
    const card = heroMoveButton.closest("[data-hero-order-card]");
    const direction = heroMoveButton.dataset.moveHeroImage;

    moveGridCard(card, direction, "Moved hero slide. Click Save Hero Order to preserve it.");
    return;
  }

  if (removeHeroButton) {
    const card = removeHeroButton.closest("[data-hero-order-card]");

    if (card) {
      card.remove();
      setDirtyState(true, "Removed image from hero slideshow. Click Save Hero Order to preserve it.");
    }

    return;
  }

  if (saveCropButton) {
    saveCropPage().catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });

    return;
  }

  if (saveCategoryOrderButton || saveHeroOrderButton) {
    saveData().catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });

    return;
  }

  if (saveButton) {
    const card = saveButton.closest("[data-image-card]");

    saveImageCard(card).catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });

    return;
  }

  if (removeButton) {
    const card = removeButton.closest("[data-image-card]");
    const imageId = card?.dataset.imageId;

    if (!imageId) {
      return;
    }

    const confirmed = confirm("Remove this image record from JSON? This will not delete the image file from disk.");

    if (!confirmed) {
      return;
    }

    const payload = collectEditorData(state);

    payload.images = payload.images.filter((image) => image.id !== imageId);
    payload.heroSlides = payload.heroSlides.filter((slide) => slide.imageId !== imageId);

    savePayload(payload).then(() => {
      window.location.hash = "#/images";
    }).catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });
  }
});

elements.createImportCategoryButton?.addEventListener("click", () => {
  createImportCategory(true);
});

elements.prepareImportButton.addEventListener("click", () => {
  prepareImportReview().catch((error) => {
    console.error(error);
    setStatus(error.message, "error");
    setImportSummary(error.message);
  });
});

elements.saveReviewedImportButton.addEventListener("click", () => {
  saveReviewedImport().catch((error) => {
    console.error(error);
    setStatus(error.message, "error");
    setImportSummary(error.message);
    updateImportReviewValidation();
    updateImportReviewControls();
  });
});

elements.clearImportReviewButton.addEventListener("click", () => {
  if (!pendingImportItems.length) {
    clearPendingImportItems();
    return;
  }

  if (!confirm("Clear the current import review? This discards reviewed metadata for the pending photos.")) {
    return;
  }

  clearPendingImportItems();
  setDirtyState(false, "Import review cleared.");
});

document.body.addEventListener("click", (event) => {
  const removeAboutImportButton = event.target.closest("[data-remove-about-import]");
  const moveAboutPhotoButton = event.target.closest("[data-move-about-photo]");
  const removeAboutPhotoButton = event.target.closest("[data-remove-about-photo]");

  if (removeAboutImportButton) {
    removePendingAboutImportItem(Number(removeAboutImportButton.dataset.removeAboutImport));
    return;
  }

  if (moveAboutPhotoButton) {
    moveAboutPhotoCard(moveAboutPhotoButton.closest("[data-about-photo-card]"), moveAboutPhotoButton.dataset.moveAboutPhoto);
    return;
  }

  if (removeAboutPhotoButton) {
    removeAboutPhotoCard(removeAboutPhotoButton.closest("[data-about-photo-card]"));
    return;
  }

  if (event.target.closest("[data-import-lightbox-close]")) {
    closeImportLightbox();
  }
});



elements.prepareAboutImportButton?.addEventListener("click", () => {
  prepareAboutImportReview().catch((error) => {
    console.error(error);
    setStatus(error.message, "error");
    updateAboutImportSummary(error.message);
  });
});

elements.saveReviewedAboutImportButton?.addEventListener("click", () => {
  saveReviewedAboutImport().catch((error) => {
    console.error(error);
    setStatus(error.message, "error");
    updateAboutImportSummary(error.message);
    updateAboutImportReviewControls();
  });
});

elements.clearAboutImportReviewButton?.addEventListener("click", () => {
  if (!pendingAboutImportItems.length) {
    clearPendingAboutImportItems();
    return;
  }

  if (!confirm("Clear the current About import review? This discards reviewed metadata for the pending About photos.")) {
    return;
  }

  clearPendingAboutImportItems();
  setDirtyState(false, "About import review cleared.");
});

elements.themeToggleButton?.addEventListener("click", () => {
  setEditorTheme(getCurrentEditorTheme() === "dark" ? "light" : "dark");
});

elements.saveButton.addEventListener("click", () => {
  saveData().catch((error) => {
    console.error(error);
    setStatus(error.message, "error");
  });
});

elements.reloadButton.addEventListener("click", () => {
  if (!confirmDiscardUnsavedChanges("reload JSON data from disk")) {
    return;
  }

  clearPendingImportItems();

  loadData().catch((error) => {
    console.error(error);
    setStatus(error.message, "error");
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeGalleryArtworkPicker();
    closeGalleryPreviewLightbox();
    closeGalleryAddWallOverlay();
    closeImportLightbox();
  }
});

// Warn before closing or refreshing if the user has unsaved editor changes.
window.addEventListener("beforeunload", (event) => {
  if (!hasUnsavedChanges) {
    return;
  }

  event.preventDefault();
  event.returnValue = "";
});

// Start the editor by selecting the initial route and loading JSON data.
updateThemeToggleButton();
setEditorRoute();
lastConfirmedHash = window.location.hash || "#/images";

loadData().then(() => {
  if (getCurrentRoute().name === "backups") {
    return refreshBackups();
  }

  return null;
}).catch((error) => {
  console.error(error);
  setStatus(error.message, "error");
});
