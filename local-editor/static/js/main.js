// Main controller for the local image editor.
// It owns routing, in-memory state, save actions, import workflow, and event delegation.

import { importReviewedImagesApi, loadDataApi, saveDataApi, saveImageUpdatesApi } from "./api.js";
import { elements } from "./dom.js";
import { collectEditorData, collectImportReviewRecords } from "./collect.js";
import {
  renderAll,
  renderImportReview,
  updateFramingControl,
  updateGallerySizeControl
} from "./render.js";
import { formatObjectPosition, getFallbackCategoryId, slugify, titleFromFilename } from "./utils.js";

const VALID_PAGE_ROUTES = new Set(["images", "import", "categories"]);
const VALID_CROP_MODES = new Set(["hero", "gallery"]);

let state = {
  categories: [],
  images: [],
  heroSlides: []
};

let pendingImportItems = [];

// Updates the short status message shown near the top of the editor.
function setStatus(message) {
  elements.statusText.textContent = message;
}

// Updates the import workflow message shown below the import controls.
function setImportSummary(message) {
  elements.importSummary.textContent = message;
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
    heroSlides: nextState.heroSlides ?? []
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
    heroSlides: nextState.heroSlides
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
  setStatus(`Loaded ${state.images.length} images and ${state.categories.length} categories.`);
}

async function savePayload(payload) {
  setStatus("Saving data...");

  const savedData = await saveDataApi(payload);

  applyLoadedState(savedData);
  setStatus(`Saved ${state.images.length} images and ${state.categories.length} categories.${getBackupStatusText(savedData)}`);
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

  setStatus("Saving crop settings...");

  const savedData = await saveImageUpdatesApi(imageId, updates);

  applyLoadedState(savedData);
  setStatus(`Saved crop settings.${getBackupStatusText(savedData)}`);
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
      setStatus(successMessage);
    }

    return;
  }

  if (direction === "up") {
    const previousCard = card.previousElementSibling;

    if (previousCard) {
      card.parentElement.insertBefore(card, previousCard);
      setStatus(successMessage);
    }

    return;
  }

  if (direction === "down") {
    const nextCard = card.nextElementSibling;

    if (nextCard) {
      card.parentElement.insertBefore(nextCard, card);
      setStatus(successMessage);
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
    setStatus("Moved category to top. Click Save Category Settings to preserve it.");
    return;
  }

  if (direction === "up") {
    const previousRow = row.previousElementSibling;

    if (previousRow) {
      elements.categoryList.insertBefore(row, previousRow);
      setStatus("Moved category up. Click Save Category Settings to preserve it.");
    }

    return;
  }

  if (direction === "down") {
    const nextRow = row.nextElementSibling;

    if (nextRow) {
      elements.categoryList.insertBefore(nextRow, row);
      setStatus("Moved category down. Click Save Category Settings to preserve it.");
    }
  }
}

// Creates editable preview records for selected image files before import.
function prepareImportReview() {
  state = collectEditorData(state);

  if (!elements.importFiles.files.length) {
    setImportSummary("Choose at least one image file first.");
    return;
  }

  clearPendingImportItems();

  const category = elements.importCategory.value || getFallbackCategoryId(state);
  const year = elements.importYear.value.trim();
  const location = elements.importLocation.value.trim();
  const note = elements.importNote.value.trim();
  const altPrefix = elements.importAltPrefix.value.trim() || "Photograph by Taylor Pike";
  const usedIds = new Set(state.images.map((image) => image.id));

  pendingImportItems = Array.from(elements.importFiles.files).map((file) => {
    const title = titleFromFilename(file.name);
    const baseId = `${category}-${slugify(file.name.replace(/\.[^/.]+$/, ""))}`;
    let id = baseId;
    let count = 2;

    while (usedIds.has(id)) {
      id = `${baseId}-${count}`;
      count += 1;
    }

    usedIds.add(id);

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
      heroFrameStyle: "auto",
      heroFitMode: "cover",
      galleryPosition: "50% 50%",
      galleryFitMode: "cover",
      galleryFrameStyle: "auto",
      gallerySize: "1"
    };
  });

  renderImportReview(state, elements, pendingImportItems);
  setImportSummary(`Prepared ${pendingImportItems.length} images for review.`);
}

async function saveReviewedImport() {
  if (!pendingImportItems.length) {
    setImportSummary("Prepare an import first.");
    return;
  }

  setStatus("Importing reviewed images...");
  setImportSummary("Copying files and saving JSON...");

  const formData = new FormData();
  const records = collectImportReviewRecords(state);

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

  setStatus(`Imported ${result.importedImages.length} images.${getBackupStatusText(result)}`);
  setImportSummary(importedTitles);
}

// Re-render the editor when the hash route changes, such as moving from Images to Import.
window.addEventListener("hashchange", () => {
  const route = getCurrentRoute();

  renderAll(state, elements, route);
  setEditorRoute(route);
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

  rerenderCurrentRoute();
});

elements.saveCategorySettingsButton.addEventListener("click", () => {
  saveData().catch((error) => {
    console.error(error);
    setStatus(error.message);
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

  rerenderCurrentRoute();
});

// Live-preview slider changes without saving them yet.
elements.editorList.addEventListener("input", (event) => {
  const slider = event.target.closest("[data-position-axis]");
  const gallerySizeRange = event.target.closest("[data-gallery-size-range]");

  if (slider) {
    updateFramingControl(slider);
  }

  if (gallerySizeRange) {
    updateGallerySizeControl(gallerySizeRange);
  }
});

// Re-render preview sections when fit/frame dropdowns change.
elements.editorList.addEventListener("change", (event) => {
  const cropSetting = event.target.closest("[data-crop-setting]");
  const imageEditorSetting = event.target.closest('[data-field="galleryFrameStyle"], [data-field="galleryFitMode"], [data-field="heroFrameStyle"], [data-field="heroFitMode"]');

  if (!cropSetting && !imageEditorSetting) {
    return;
  }

  updateStateFromCurrentDom();
  rerenderCurrentRoute("Preview updated. Click Save JSON or Save Crop to preserve it.");
});

elements.importReviewList.addEventListener("input", (event) => {
  const slider = event.target.closest("[data-position-axis]");

  if (slider) {
    updateFramingControl(slider);
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
      rerenderCurrentRoute("Crop preview updated. Click Save Crop to preserve it.");
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
      setStatus("Removed image from hero slideshow. Click Save Hero Order to preserve it.");
    }

    return;
  }

  if (saveCropButton) {
    saveCropPage().catch((error) => {
      console.error(error);
      setStatus(error.message);
    });

    return;
  }

  if (saveCategoryOrderButton || saveHeroOrderButton) {
    saveData().catch((error) => {
      console.error(error);
      setStatus(error.message);
    });

    return;
  }

  if (saveButton) {
    saveData().catch((error) => {
      console.error(error);
      setStatus(error.message);
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
      setStatus(error.message);
    });
  }
});

elements.prepareImportButton.addEventListener("click", () => {
  prepareImportReview();
});

elements.saveReviewedImportButton.addEventListener("click", () => {
  saveReviewedImport().catch((error) => {
    console.error(error);
    setStatus(error.message);
    setImportSummary(error.message);
  });
});

elements.clearImportReviewButton.addEventListener("click", () => {
  clearPendingImportItems();
});

elements.saveButton.addEventListener("click", () => {
  saveData().catch((error) => {
    console.error(error);
    setStatus(error.message);
  });
});

elements.reloadButton.addEventListener("click", () => {
  clearPendingImportItems();

  loadData().catch((error) => {
    console.error(error);
    setStatus(error.message);
  });
});

// Start the editor by selecting the initial route and loading JSON data.
setEditorRoute();

loadData().catch((error) => {
  console.error(error);
  setStatus(error.message);
});
