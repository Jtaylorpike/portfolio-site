// Main controller for the local image editor.
// It owns routing, in-memory state, save actions, import workflow, and event delegation.

import {
  importReviewedImagesApi,
  listBackupsApi,
  loadDataApi,
  restoreBackupApi,
  saveDataApi,
  saveImageUpdatesApi
} from "./api.js";
import { elements } from "./dom.js";
import { collectEditorData, collectImportReviewRecords } from "./collect.js";
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
  validateImportRecords
} from "./importValidation.js";

const VALID_PAGE_ROUTES = new Set(["images", "import", "categories", "backups"]);
const VALID_CROP_MODES = new Set(["hero", "gallery"]);

let state = {
  categories: [],
  images: [],
  heroSlides: [],
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

// Stores data returned by the backend and re-renders the current editor route.
function applyLoadedState(nextState) {
  state = {
    categories: nextState.categories ?? [],
    images: nextState.images ?? [],
    heroSlides: nextState.heroSlides ?? [],
    backups: nextState.backups ?? state.backups ?? []
  };

  const route = getCurrentRoute();

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

async function saveData() {
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
    const baseId = `${category}-${slugify(file.name.replace(/\.[^/.]+$/, ""))}`;
    let id = baseId;
    let count = 2;

    while (usedIds.has(id)) {
      id = `${baseId}-${count}`;
      count += 1;
    }

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
  const editableField = event.target.closest("[data-field], [data-category-field]");

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
  const saveButton = event.target.closest("[data-save-image-card]");
  const removeButton = event.target.closest("[data-remove-image-card]");

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
