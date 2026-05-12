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
import { resolveGalleryFrameDimensions } from "./galleryFraming.js";
import {
  findGalleryPlacementCollisions,
  getGalleryPlacementCollisionIds,
  getGalleryPlacementCollisionText,
  getGalleryWallFootprintLabel,
  getGalleryWallGridInfo,
  gridToMeters,
  metersToGrid
} from "./galleryGrid.js";

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
  const collisionIds = getGalleryPlacementCollisionIds(records);
  const saveAllButton = elements.galleryCurationList?.querySelector("[data-save-gallery-curation]");

  cards.forEach((card) => {
    const wallId = card.dataset.wallId ?? "";
    const warning = card.querySelector("[data-gallery-placement-warning]");
    const saveButton = card.querySelector("[data-save-gallery-curation-wall]");
    const collisionText = getGalleryPlacementCollisionText(wallId, collisions);
    const hasCollision = collisionIds.has(wallId);

    card.dataset.galleryPlacementCollision = hasCollision ? "true" : "false";
    syncGalleryPlacementFootprintLabel(card);

    if (warning) {
      warning.hidden = !hasCollision;
      warning.textContent = collisionText;
    }

    if (saveButton) {
      saveButton.disabled = hasCollision;
    }
  });

  if (saveAllButton) {
    saveAllButton.disabled = collisions.length > 0;
  }

  return collisions;
}

function assertGalleryPlacementIsCollisionFree(records = getGalleryCardPlacementRecords()) {
  const collisions = findGalleryPlacementCollisions(records);

  if (!collisions.length) {
    return;
  }

  const summary = collisions
    .map((collision) => `${collision.firstWallId} overlaps ${collision.secondWallId}`)
    .join("; ");

  throw new Error(`Gallery wall placement has ${collisions.length} collision${collisions.length === 1 ? "" : "s"}. ${summary}`);
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
  const image = getEditorImageById(artworkSelect?.value ?? "");
  const selectedWallTypeLabel = wallTypeSelect?.selectedOptions?.[0]?.textContent?.trim() || "Wall block type";
  const displayStatus = statusSelect?.value === "hidden" ? "hidden" : "active";
  const artworkState = image ? "assigned" : "unassigned";
  const placementText = [
    card.querySelector('[data-gallery-curation-field="positionX"]')?.value,
    card.querySelector('[data-gallery-curation-field="positionZ"]')?.value,
    card.querySelector('[data-gallery-curation-field="rotationYDegrees"]')?.value
  ].filter(Boolean).join(" ");

  card.dataset.galleryCurationStatus = displayStatus;
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
    displayStatus
  ].filter(Boolean).join(" "));

  const statusBadge = card.querySelector("[data-gallery-status-badge]");
  const artworkBadge = card.querySelector("[data-gallery-artwork-badge]");
  const wallTypeBadge = card.querySelector("[data-gallery-wall-type-badge]");

  if (statusBadge) {
    statusBadge.dataset.galleryStatusBadge = displayStatus;
    statusBadge.textContent = displayStatus === "hidden" ? "Hidden" : "Active";
  }

  if (artworkBadge) {
    artworkBadge.dataset.galleryArtworkBadge = artworkState;
    artworkBadge.textContent = image ? "Assigned" : "Needs artwork";
  }

  if (wallTypeBadge) {
    wallTypeBadge.textContent = selectedWallTypeLabel;
  }
}

function applyGalleryCurationFilters() {
  const cards = Array.from(elements.galleryCurationList?.querySelectorAll("[data-gallery-curation-card]") ?? []);
  const search = normalizeFilterValue(getGalleryFilterValue("search", ""));
  const status = getGalleryFilterValue("status");
  const wallType = getGalleryFilterValue("wallType");
  const category = getGalleryFilterValue("category");
  let visibleCount = 0;

  cards.forEach((card) => {
    syncGalleryCurationCardState(card);

    const cardStatus = card.dataset.galleryCurationStatus ?? "active";
    const cardWallType = card.dataset.galleryCurationWallType ?? "standard-display-wall";
    const cardArtworkState = card.dataset.galleryCurationArtworkState ?? "unassigned";
    const cardCategory = card.dataset.galleryCurationCategory ?? "";
    const matchesSearch = !search || getGalleryCurationCardSearchText(card).includes(search);
    const matchesStatus = status === "all"
      || status === cardStatus
      || (status === "needs-artwork" && cardArtworkState === "unassigned");
    const matchesWallType = wallType === "all" || wallType === cardWallType;
    const matchesCategory = category === "all" || category === cardCategory;
    const isVisible = matchesSearch && matchesStatus && matchesWallType && matchesCategory;

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
  }

  if (field?.dataset.galleryCurationField === "rotationYDegrees") {
    syncGalleryPlacementCollisionState();
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
    closeGalleryPreviewLightbox();
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
