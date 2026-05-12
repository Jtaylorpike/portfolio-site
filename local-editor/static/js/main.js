// Main controller for the local image editor.
// It owns routing, in-memory state, save actions, import workflow, and event delegation.

import {
  importReviewedImagesApi,
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
import { collectEditorData, collectGalleryCuration, collectGalleryCurationCard, collectImportReviewRecords } from "./collect.js";
import {
  renderAll,
  renderImportReview,
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

const VALID_PAGE_ROUTES = new Set(["images", "import", "gallery", "categories", "backups"]);
const VALID_CROP_MODES = new Set(["hero", "gallery"]);

let state = {
  categories: [],
  images: [],
  heroSlides: [],
  galleryCuration: [],
  backups: []
};

let pendingImportItems = [];
let hasUnsavedChanges = false;

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
  }

  if (message) {
    setStatus(message, isDirty ? "warning" : "success");
  }
}

// Updates the import workflow message shown below the import controls.
function setImportSummary(message) {
  elements.importSummary.textContent = message;
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

async function loadAuthoritativeStateForImage(imageId, renameResult) {
  const latestState = await loadDataApi();
  const updatedImage = latestState.images?.find((image) => image.id === imageId);

  if (!updatedImage) {
    throw new Error(`Rename completed, but ${imageId} was not found after reloading editor data.`);
  }

  return {
    ...latestState,
    updatedImage,
    backup: renameResult.backup,
    fileMoves: renameResult.fileMoves ?? []
  };
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

  const result = await renameImageIdApi(currentImageId, newImageId);
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
  const authoritativeState = await loadAuthoritativeStateForImage(updatedImageId, result);

  // The old hash is invalid after a successful rename. Replace it first, then
  // render from data reloaded from disk so the identity panel reflects the
  // backend's final JSON and file-rendition state instead of a stale DOM route.
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
    if (elements.saveReviewedImportButton) {
      elements.saveReviewedImportButton.disabled = false;
    }

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
      status.textContent = messages.length ? messages.join(" ") : "Ready to import into the portfolio rendition folders.";
    }
  });

  if (elements.saveReviewedImportButton) {
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
    backups: nextState.backups ?? state.backups ?? []
  };

  const route = routeOverride ?? getCurrentRoute();

  renderAll(state, elements, route);
  setEditorRoute(route);
}

// Refreshes in-memory state from the currently visible editor forms.
function updateStateFromCurrentDom() {
  const nextState = collectEditorData(state);

  state = {
    categories: nextState.categories,
    images: nextState.images,
    heroSlides: nextState.heroSlides,
    galleryCuration: state.galleryCuration ?? [],
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

function renderGalleryCurationThumb(card, image) {
  const thumb = card?.querySelector("[data-gallery-curation-thumb]");

  if (!thumb) {
    return;
  }

  thumb.classList.toggle("is-empty", !image);
  thumb.innerHTML = "";

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

function syncGalleryCurationArtworkDisplay(card, imageId) {
  const image = getEditorImageById(imageId);
  const title = card?.querySelector("[data-gallery-curation-selected-title]");
  const meta = card?.querySelector("[data-gallery-curation-selected-meta]");

  renderGalleryCurationThumb(card, image);

  if (title) {
    title.textContent = image?.title ?? "No artwork assigned";
  }

  if (meta) {
    meta.textContent = image
      ? `${getEditorCategoryLabel(image.category)} / ${image.id}`
      : "Use the visual picker or choose an ID from the fallback select.";
  }
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

  overlay.querySelectorAll("[data-artwork-picker-option]").forEach((option) => {
    option.classList.toggle("is-selected", option.dataset.artworkPickerOption === selectedImageId);
  });
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

// Clears temporary browser preview URLs and resets the import review UI.
function clearPendingImportItems() {
  pendingImportItems.forEach((item) => {
    URL.revokeObjectURL(item.previewUrl);
  });

  pendingImportItems = [];
  elements.importReview.classList.remove("is-active");
  elements.importReviewList.innerHTML = "";
  setImportSummary("");
}

async function loadData() {
  setStatus("Loading data...");

  const nextState = await loadDataApi();

  applyLoadedState(nextState);
  setDirtyState(false);
  setStatus(`Loaded ${state.images.length} images and ${state.categories.length} categories.`, "success");
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
  const confirmed = confirm(
    `Restore backup "${backupFolder}"? The editor will create a new backup of the current JSON files before restoring.`
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
  setStatus(`Saved ${state.images.length} images and ${state.categories.length} categories.${getBackupStatusText(savedData)}`, "success");
}


async function saveGalleryCuration() {
  setStatus("Saving all gallery curation...", "neutral");

  const savedData = await saveGalleryCurationApi(collectGalleryCuration(state));

  applyLoadedState(savedData);
  setDirtyState(false);
  setStatus(`Saved ${state.galleryCuration.length} gallery wall curation rows.${getBackupStatusText(savedData)}`, "success");
}

async function saveGalleryCurationWall(card) {
  if (!card) {
    throw new Error("No gallery wall card is currently selected.");
  }

  const displayOrder = getGalleryCurationCardDisplayOrder(card);
  const wallRecord = collectGalleryCurationCard(card, state, displayOrder);

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
  setDirtyState(true, `Prepared ${pendingImportItems.length} images for review. Review each card, then save the import.`);
}

async function saveReviewedImport() {
  if (!pendingImportItems.length) {
    setImportSummary("Prepare an import first.");
    return;
  }

  setStatus("Importing reviewed images...", "neutral");
  setImportSummary("Copying files and saving JSON...");

  syncPendingImportItemsFromReview();

  const formData = new FormData();
  const records = collectImportReviewRecords(state);
  const validation = validateImportRecords(records, state.images);

  if (!validation.isValid) {
    updateImportReviewValidation();
    throw new Error(validation.errors.map((item) => item.message).join(" "));
  }

  pendingImportItems.forEach((item) => {
    formData.append("images", item.file);
  });

  formData.append("records", JSON.stringify(records));

  const result = await importReviewedImagesApi(formData);

  applyLoadedState(result);

  const importedTitles = result.importedImages.map((image) => image.title).join(", ");

  elements.importFiles.value = "";
  clearPendingImportItems();

  window.location.hash = "#/images";

  setDirtyState(false);
  setStatus(`Imported ${result.importedImages.length} images.${getBackupStatusText(result)}`, "success");
  setImportSummary(importedTitles);
}

// Re-render the editor when the hash route changes, such as moving from Images to Import.
window.addEventListener("hashchange", () => {
  const route = getCurrentRoute();

  renderAll(state, elements, route);
  setEditorRoute(route);

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

  if (!label) {
    return;
  }

  state.categories.push({
    id: slugify(label),
    label: label.trim()
  });

  setDirtyState(true, "Added category. Click Save Category Settings to preserve it.");
  rerenderCurrentRoute();
});

elements.saveCategorySettingsButton.addEventListener("click", () => {
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

  const categoryId = removeButton.dataset.removeCategory;
  const categoryIndex = state.categories.findIndex((category) => category.id === categoryId);

  if (categoryIndex === -1) {
    return;
  }

  const confirmed = confirm("Remove this category? Images in this category will be moved to the first remaining category.");

  if (!confirmed) {
    return;
  }

  state.categories.splice(categoryIndex, 1);

  if (!state.categories.length) {
    state.categories.push({
      id: "personal",
      label: "Personal"
    });
  }

  const fallbackCategoryId = getFallbackCategoryId(state);
  const validCategoryIds = new Set(state.categories.map((category) => category.id));

  state.images = state.images.map((image) => {
    if (validCategoryIds.has(image.category)) {
      return image;
    }

    return {
      ...image,
      category: fallbackCategoryId
    };
  });

  state.heroSlides = state.heroSlides.map((slide) => {
    if (validCategoryIds.has(slide.targetCategory)) {
      return slide;
    }

    return {
      ...slide,
      targetCategory: fallbackCategoryId
    };
  });

  setDirtyState(true, "Removed category. Click Save JSON to preserve it.");
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
  const cropSetting = event.target.closest("[data-crop-setting]");
  const imageEditorSetting = event.target.closest('[data-field="galleryFrameStyle"], [data-field="galleryFitMode"]');
  const editableField = event.target.closest("[data-field], [data-category-field]");

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


elements.importReviewList.addEventListener("click", (event) => {
  const useTitleIdButton = event.target.closest("[data-import-use-title-id]");

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
elements.galleryCurationList?.addEventListener("input", () => {
  setDirtyState(true, "Gallery curation has unsaved changes. Click Save Wall or Save All Gallery Curation to preserve it.");
});

elements.galleryCurationList?.addEventListener("change", (event) => {
  const field = event.target.closest("[data-gallery-curation-field]");

  const card = field?.closest("[data-gallery-curation-card]");

  if (field?.dataset.galleryCurationField === "artworkId") {
    syncGalleryCurationArtworkDisplay(card, field.value);
  }

  if (field?.dataset.galleryCurationField === "wallType") {
    syncGalleryWallTypeDisplay(card);
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

// Route clicks inside the dynamic editor list to the correct action handler.
elements.editorList.addEventListener("click", (event) => {
  const cropSettingButton = event.target.closest("[data-set-crop-setting]");
  const categoryMoveButton = event.target.closest("[data-move-category-image]");
  const heroMoveButton = event.target.closest("[data-move-hero-image]");
  const removeHeroButton = event.target.closest("[data-remove-hero-image]");
  const saveCategoryOrderButton = event.target.closest("[data-save-category-order]");
  const saveHeroOrderButton = event.target.closest("[data-save-hero-order]");
  const saveCropButton = event.target.closest("[data-save-crop-page]");
  const suggestTitleIdButton = event.target.closest("[data-suggest-title-id]");
  const renameImageIdButton = event.target.closest("[data-rename-image-id]");
  const saveButton = event.target.closest("[data-save-image-card]");
  const removeButton = event.target.closest("[data-remove-image-card]");

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
    saveData().catch((error) => {
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
  });
});

elements.clearImportReviewButton.addEventListener("click", () => {
  clearPendingImportItems();
});

elements.saveButton.addEventListener("click", () => {
  saveData().catch((error) => {
    console.error(error);
    setStatus(error.message, "error");
  });
});

elements.reloadButton.addEventListener("click", () => {
  clearPendingImportItems();

  loadData().catch((error) => {
    console.error(error);
    setStatus(error.message, "error");
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeGalleryArtworkPicker();
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
setEditorRoute();

loadData().then(() => {
  if (getCurrentRoute().name === "backups") {
    return refreshBackups();
  }

  return null;
}).catch((error) => {
  console.error(error);
  setStatus(error.message, "error");
});
