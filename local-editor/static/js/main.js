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

function setStatus(message) {
  elements.statusText.textContent = message;
}

function setImportSummary(message) {
  elements.importSummary.textContent = message;
}

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

function updateStateFromCurrentDom() {
  const nextState = collectEditorData(state);

  state = {
    categories: nextState.categories,
    images: nextState.images,
    heroSlides: nextState.heroSlides
  };
}

function rerenderCurrentRoute(message) {
  const route = getCurrentRoute();

  renderAll(state, elements, route);
  setEditorRoute(route);

  if (message) {
    setStatus(message);
  }
}

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
  setStatus(`Saved ${state.images.length} images and ${state.categories.length} categories.`);
}

async function saveData() {
  await savePayload(collectEditorData(state));
}

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

function getRangePositionFromControls(controls) {
  const xSlider = controls.querySelector('[data-position-axis="x"]');
  const ySlider = controls.querySelector('[data-position-axis="y"]');

  if (!xSlider || !ySlider) {
    return null;
  }

  return formatObjectPosition(xSlider.value, ySlider.value);
}

function collectCropPageSaveRequest() {
  const cropEditor = elements.editorList.querySelector("[data-crop-editor]");

  if (!cropEditor) {
    return null;
  }

  const imageId = cropEditor.dataset.cropImageId;
  const updates = {};

  if (!imageId) {
    return null;
  }

  // Read slider values directly from the range inputs instead of relying only
  // on the read-only text field. This makes Save Crop reliable even if a
  // browser delays or drops an input event while the user is dragging a slider.
  cropEditor.querySelectorAll("[data-framing-controls]").forEach((controls) => {
    const field = controls.dataset.positionField;
    const position = getRangePositionFromControls(controls);

    if (field && position) {
      updates[field] = position;
    }
  });

  cropEditor.querySelectorAll("[data-crop-field]").forEach((input) => {
    const field = input.dataset.cropField;
    const value = String(input.value ?? "").trim();

    if (field && value && !(field in updates)) {
      updates[field] = value;
    }
  });

  cropEditor.querySelectorAll("[data-crop-setting]").forEach((input) => {
    const field = input.dataset.cropSetting;
    const value = String(input.value ?? "").trim();

    if (field && value) {
      updates[field] = value;
    }
  });

  return {
    imageId,
    updates
  };
}

async function saveCropPage() {
  const cropSaveRequest = collectCropPageSaveRequest();

  if (!cropSaveRequest) {
    setStatus("No crop editor is currently open.");
    return;
  }

  setStatus("Saving crop settings...");

  const savedData = await saveImageUpdatesApi(cropSaveRequest.imageId, cropSaveRequest.updates);

  applyLoadedState(savedData);
  setStatus("Saved crop settings.");
}

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

  setStatus(`Imported ${result.importedImages.length} images.`);
  setImportSummary(importedTitles);
}

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

setEditorRoute();

loadData().catch((error) => {
  console.error(error);
  setStatus(error.message);
});
