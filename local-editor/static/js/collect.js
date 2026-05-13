// DOM-to-JSON collector for the local image editor.
// It reads visible form controls and converts them into data records that Flask can save.

import { getFallbackCategoryId, slugify } from "./utils.js";
import {
  normalizeImportFitMode,
  normalizeImportFrameStyle,
  normalizeImportHeroFrameStyle
} from "./importValidation.js";

// Reads a field value from one editor card and trims it for JSON output.
export function getFieldValue(card, field) {
  const input = card.querySelector(`[data-field="${field}"]`);
  return String(input?.value ?? "").trim();
}

export function getImportFieldValue(card, field) {
  const input = card.querySelector(`[data-import-field="${field}"]`);
  return String(input?.value ?? "").trim();
}

// Reads a checkbox state when a card uses boolean controls.
export function getCheckboxValue(card, field) {
  const input = card.querySelector(`[data-field="${field}"]`);
  return Boolean(input?.checked);
}

function getCardImageOrientation(card) {
  const savedOrientation = getFieldValue(card, "imageOrientation");

  if (["landscape", "portrait", "square"].includes(savedOrientation)) {
    return savedOrientation;
  }

  const aspectRatio = Number(getFieldValue(card, "imageAspectRatio"));

  if (Number.isFinite(aspectRatio) && aspectRatio > 0) {
    if (Math.abs(aspectRatio - 1) <= 0.04) {
      return "square";
    }

    return aspectRatio > 1 ? "landscape" : "portrait";
  }

  const width = Number(getFieldValue(card, "imageWidth"));
  const height = Number(getFieldValue(card, "imageHeight"));

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return width / height > 1 ? "landscape" : "portrait";
  }

  return "landscape";
}

function isHeroEligibleCard(card) {
  return getCardImageOrientation(card) === "landscape";
}

function isHeroEligibleImage(image) {
  const orientation = image?.imageOrientation;

  if (["landscape", "portrait", "square"].includes(orientation)) {
    return orientation === "landscape";
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

// Collects category rows from the category settings page.
export function collectCategories() {
  const rows = Array.from(document.querySelectorAll("[data-category-row]"));

  return rows.map((row) => {
    const idInput = row.querySelector('[data-category-field="id"]');
    const labelInput = row.querySelector('[data-category-field="label"]');

    const label = String(labelInput?.value ?? "").trim();
    const id = slugify(String(idInput?.value ?? "").trim() || label);

    return {
      id,
      label: label || id.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    };
  });
}

function collectEditedImageFromCard(card, fallbackCategoryId, validCategoryIds) {
  const imageCategory = getFieldValue(card, "category");
  const safeCategory = validCategoryIds.has(imageCategory) ? imageCategory : fallbackCategoryId;

  const image = {
    id: getFieldValue(card, "id"),
    title: getFieldValue(card, "title"),
    category: safeCategory,
    year: getFieldValue(card, "year"),
    location: getFieldValue(card, "location"),
    note: getFieldValue(card, "note"),
    src: getFieldValue(card, "src"),
    alt: getFieldValue(card, "alt")
  };

  for (const optionalField of [
    "thumbSrc",
    "textureSrc",
    "thumbnailPosition",
    "heroPosition",
    "galleryPosition",
    "galleryFitMode",
    "galleryFrameStyle",
    "gallerySize",
    "fullSrc",
    "imageWidth",
    "imageHeight",
    "imageAspectRatio",
    "imageOrientation"
  ]) {
    const value = getFieldValue(card, optionalField);

    if (value) {
      image[optionalField] = value;
    }
  }

  return image;
}

function getCropPageEdit() {
  const cropEditor = document.querySelector("[data-crop-editor]");

  if (!cropEditor) {
    return null;
  }

  const imageId = cropEditor.dataset.cropImageId;

  if (!imageId) {
    return null;
  }

  const updates = {};

  const cropInput = cropEditor.querySelector("[data-crop-field]");
  const fieldName = cropInput?.dataset.cropField;
  const value = String(cropInput?.value ?? "").trim();

  if (fieldName && value) {
    updates[fieldName] = value;
  }

  cropEditor.querySelectorAll("[data-crop-setting]").forEach((input) => {
    const field = input.dataset.cropSetting;
    const settingValue = String(input.value ?? "").trim();

    if (field && settingValue) {
      updates[field] = settingValue;
    }
  });

  return {
    imageId,
    updates
  };
}

function getCategoryPageOrder() {
  const orderGrid = document.querySelector("[data-category-order-grid]");

  if (!orderGrid) {
    return null;
  }

  const categoryId = orderGrid.dataset.categoryId;

  if (!categoryId) {
    return null;
  }

  const orderedIds = Array.from(orderGrid.querySelectorAll("[data-category-order-card]"))
    .map((card) => card.dataset.imageId)
    .filter(Boolean);

  return {
    categoryId,
    orderedIds
  };
}

function sortImagesByCategoryHierarchy(images, categories) {
  const imagesByCategory = new Map();

  categories.forEach((category) => {
    imagesByCategory.set(category.id, []);
  });

  const uncategorizedImages = [];

  images.forEach((image) => {
    if (imagesByCategory.has(image.category)) {
      imagesByCategory.get(image.category).push(image);
      return;
    }

    uncategorizedImages.push(image);
  });

  const sortedImages = [];

  categories.forEach((category) => {
    sortedImages.push(...(imagesByCategory.get(category.id) ?? []));
  });

  sortedImages.push(...uncategorizedImages);

  return sortedImages;
}

function applyCategoryPageOrder(images, categories) {
  const categoryPageOrder = getCategoryPageOrder();

  if (!categoryPageOrder) {
    return sortImagesByCategoryHierarchy(images, categories);
  }

  const { categoryId, orderedIds } = categoryPageOrder;

  const imageById = new Map(
    images.map((image) => {
      return [image.id, image];
    })
  );

  const orderedIdSet = new Set(orderedIds);

  const orderedCategoryImages = orderedIds
    .map((imageId) => imageById.get(imageId))
    .filter(Boolean);

  const remainingCategoryImages = images.filter((image) => {
    return image.category === categoryId && !orderedIdSet.has(image.id);
  });

  const updatedImages = images.filter((image) => {
    return image.category !== categoryId;
  });

  const categoryIndex = categories.findIndex((category) => category.id === categoryId);
  const insertAfterCategoryIds = categories.slice(0, Math.max(categoryIndex, 0)).map((category) => category.id);

  const beforeTargetCategory = [];
  const afterTargetCategory = [];

  updatedImages.forEach((image) => {
    if (insertAfterCategoryIds.includes(image.category)) {
      beforeTargetCategory.push(image);
      return;
    }

    afterTargetCategory.push(image);
  });

  return sortImagesByCategoryHierarchy([
    ...beforeTargetCategory,
    ...orderedCategoryImages,
    ...remainingCategoryImages,
    ...afterTargetCategory
  ], categories);
}

function collectHeroPageOrder(categories, images) {
  const heroGrid = document.querySelector("[data-hero-order-grid]");

  if (!heroGrid) {
    return null;
  }

  const validCategoryIds = new Set(categories.map((category) => category.id));
  const fallbackCategoryId = categories[0]?.id ?? "personal";
  const imagesById = new Map(images.map((image) => [image.id, image]));

  return Array.from(heroGrid.querySelectorAll("[data-hero-order-card]"))
    .map((card) => {
      const imageId = card.dataset.imageId;
      const select = card.querySelector("[data-hero-order-target-category]");
      const targetCategory = String(select?.value ?? "").trim();

      if (!imageId) {
        return null;
      }

      const image = imagesById.get(imageId);

      if (!image || !isHeroEligibleImage(image)) {
        return null;
      }

      return {
        imageId,
        targetCategory: validCategoryIds.has(targetCategory) ? targetCategory : fallbackCategoryId
      };
    })
    .filter(Boolean);
}


function getGalleryCurationFieldValue(card, field) {
  const input = card.querySelector(`[data-gallery-curation-field="${field}"]`);

  if (input?.type === "checkbox") {
    return Boolean(input.checked);
  }

  return String(input?.value ?? "").trim();
}

function getGalleryBooleanSelectValue(card, field, trueValues, falseValues, fallback = true) {
  const value = getGalleryCurationFieldValue(card, field);

  if (typeof value === "boolean") {
    return value;
  }

  const normalizedValue = String(value ?? "").trim().toLowerCase();

  if (trueValues.includes(normalizedValue)) {
    return true;
  }

  if (falseValues.includes(normalizedValue)) {
    return false;
  }

  return fallback;
}

function getGalleryDisplayStatusValue(card) {
  return getGalleryBooleanSelectValue(
    card,
    "showInGallery",
    ["active", "visible", "true", "1", "on", "show"],
    ["hidden", "inactive", "false", "0", "off", "hide"],
    true
  );
}

function getGalleryPlacementStatusValue(card) {
  return getGalleryBooleanSelectValue(
    card,
    "placedInGallery",
    ["placed", "true", "1", "on", "map"],
    ["unplaced", "off-map", "false", "0", "off", "none"],
    true
  );
}

function getGalleryNumberFieldValue(card, field, fallback = 0) {
  const rawValue = getGalleryCurationFieldValue(card, field);
  const numberValue = Number(rawValue);

  return Number.isFinite(numberValue) ? numberValue : fallback;
}

// Collects one virtual gallery wall/artwork curation card.
export function collectGalleryCurationCard(card, state, fallbackDisplayOrder = 1) {
  const validImageIds = new Set((state.images ?? []).map((image) => image.id).filter(Boolean));
  const artworkId = getGalleryCurationFieldValue(card, "artworkId");
  const wallType = getGalleryCurationFieldValue(card, "wallType") || "standard-display-wall";
  const plaqueSide = getGalleryCurationFieldValue(card, "plaqueSide") || "auto";

  return {
    wallId: card.dataset.wallId ?? "",
    artworkId: validImageIds.has(artworkId) ? artworkId : "",
    showInGallery: getGalleryDisplayStatusValue(card),
    placedInGallery: getGalleryPlacementStatusValue(card),
    displayOrder: fallbackDisplayOrder,
    wallType,
    plaqueEnabled: Boolean(getGalleryCurationFieldValue(card, "plaqueEnabled")),
    plaqueSide,
    positionX: getGalleryNumberFieldValue(card, "positionX", 0),
    positionZ: getGalleryNumberFieldValue(card, "positionZ", 0),
    rotationYDegrees: getGalleryNumberFieldValue(card, "rotationYDegrees", 0)
  };
}

// Collects the virtual gallery wall/artwork curation page.
export function collectGalleryCuration(state) {
  const cards = Array.from(document.querySelectorAll("[data-gallery-curation-card]"));

  if (!cards.length) {
    return state.galleryCuration ?? [];
  }

  return cards.map((card, index) => collectGalleryCurationCard(card, state, index + 1));
}

// Builds the full JSON payload for normal Save JSON actions.
export function collectEditorData(state) {
  const categories = collectCategories();
  const validCategoryIds = new Set(categories.map((category) => category.id));
  const fallbackCategoryId = categories[0]?.id ?? "personal";
  const cards = Array.from(document.querySelectorAll("[data-image-card]"));
  const cropEdit = getCropPageEdit();

  const editedImagesById = new Map();

  cards.forEach((card) => {
    const editedImage = collectEditedImageFromCard(card, fallbackCategoryId, validCategoryIds);
    editedImagesById.set(editedImage.id, editedImage);
  });

  const imagesWithEdits = state.images.map((image) => {
    const editedImage = editedImagesById.get(image.id);

    if (editedImage) {
      return editedImage;
    }

    if (cropEdit && image.id === cropEdit.imageId) {
      return {
        ...image,
        ...cropEdit.updates
      };
    }

    return image;
  });

  const images = applyCategoryPageOrder(imagesWithEdits, categories);
  const heroPageOrder = collectHeroPageOrder(categories, images);

  if (heroPageOrder) {
    return {
      categories,
      images,
      heroSlides: heroPageOrder
    };
  }

  const editedImageIds = new Set(editedImagesById.keys());

  const imagesById = new Map(images.map((image) => [image.id, image]));

  const heroSlidesFromUneditedImages = state.heroSlides.filter((slide) => {
    const image = imagesById.get(slide.imageId);

    return !editedImageIds.has(slide.imageId) && image && isHeroEligibleImage(image);
  });

  const heroSlidesFromEditedImages = cards
    .filter((card) => getCheckboxValue(card, "isHeroSlide") && isHeroEligibleCard(card))
    .map((card) => {
      const heroCategory = getFieldValue(card, "heroTargetCategory");

      return {
        imageId: getFieldValue(card, "id"),
        targetCategory: validCategoryIds.has(heroCategory) ? heroCategory : fallbackCategoryId
      };
    });

  return {
    categories,
    images,
    heroSlides: [
      ...heroSlidesFromUneditedImages,
      ...heroSlidesFromEditedImages
    ]
  };
}

// Builds image metadata records for files waiting to be imported.
export function collectImportReviewRecords(state) {
  const cards = Array.from(document.querySelectorAll("[data-import-card]"));
  const categories = collectCategories();
  const validCategoryIds = new Set(categories.map((category) => category.id));
  const fallbackCategoryId = getFallbackCategoryId({ categories });

  return cards.map((card) => {
    const category = getImportFieldValue(card, "category");
    const galleryFitMode = normalizeImportFitMode(getImportFieldValue(card, "galleryFitMode"));
    const heroFitMode = normalizeImportFitMode(getImportFieldValue(card, "heroFitMode"));
    const galleryFrameStyle = normalizeImportFrameStyle(getImportFieldValue(card, "galleryFrameStyle"));
    const heroFrameStyle = normalizeImportHeroFrameStyle(getImportFieldValue(card, "heroFrameStyle"));

    return {
      id: getImportFieldValue(card, "id"),
      title: getImportFieldValue(card, "title"),
      category: validCategoryIds.has(category) ? category : fallbackCategoryId,
      year: getImportFieldValue(card, "year"),
      location: getImportFieldValue(card, "location"),
      alt: getImportFieldValue(card, "alt"),
      note: getImportFieldValue(card, "note"),
      thumbnailPosition: getImportFieldValue(card, "thumbnailPosition") || "50% 50%",
      heroPosition: getImportFieldValue(card, "heroPosition") || "50% 50%",
      heroFitMode,
      heroFrameStyle,
      galleryPosition: getImportFieldValue(card, "galleryPosition") || "50% 50%",
      galleryFitMode,
      galleryFrameStyle,
      gallerySize: getImportFieldValue(card, "gallerySize") || "1",
      imageWidth: getImportFieldValue(card, "imageWidth"),
      imageHeight: getImportFieldValue(card, "imageHeight"),
      imageAspectRatio: getImportFieldValue(card, "imageAspectRatio"),
      imageOrientation: getImportFieldValue(card, "imageOrientation")
    };
  });
}
