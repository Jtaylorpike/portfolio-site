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

function isPublicImageCard(card) {
  const input = card.querySelector('[data-field="isPublic"]');

  if (!input) {
    return true;
  }

  return Boolean(input.checked);
}

function isHeroEligibleCard(card) {
  return isPublicImageCard(card) && getCardImageOrientation(card) === "landscape";
}

function isHeroEligibleImage(image) {
  if (image?.isPublic === false) {
    return false;
  }

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

  if (!isPublicImageCard(card)) {
    image.isPublic = false;
  }

  for (const optionalField of [
    "thumbSrc",
    "textureSrc",
    "thumbnailPosition",
    "heroPosition",
    "heroScale",
    "galleryPosition",
    "galleryScale",
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

function getEditableCategories(state) {
  const categoryRows = document.querySelectorAll("[data-category-row]");

  if (!categoryRows.length) {
    return state.categories ?? [];
  }

  const collectedCategories = collectCategories();

  return collectedCategories.length ? collectedCategories : state.categories ?? [];
}

function getHeroTargetCategoryFromCard(card, validCategoryIds, fallbackCategoryId) {
  const heroCategory = getFieldValue(card, "heroTargetCategory");

  return validCategoryIds.has(heroCategory) ? heroCategory : fallbackCategoryId;
}

// Builds a full save payload from one open image-detail card.
// This keeps the image page's lower Save JSON button scoped to the card the user
// is editing instead of relying on a broad DOM scan of every active editor pane.
export function collectImageCardSavePayload(state, card) {
  if (!card) {
    throw new Error("No image editor card is currently open.");
  }

  const originalImageId = card.dataset.imageId;

  if (!originalImageId) {
    throw new Error("The image editor card is missing its saved image ID.");
  }

  const categories = getEditableCategories(state);
  const validCategoryIds = new Set(categories.map((category) => category.id));
  const fallbackCategoryId = categories[0]?.id ?? "personal";
  const editedImage = collectEditedImageFromCard(card, fallbackCategoryId, validCategoryIds);
  let foundImage = false;

  const images = (state.images ?? []).map((image) => {
    if (image.id !== originalImageId) {
      return image;
    }

    foundImage = true;
    return editedImage;
  });

  if (!foundImage) {
    throw new Error(`Image not found in current editor state: ${originalImageId}`);
  }

  const heroSlidesWithoutEditedImage = (state.heroSlides ?? []).filter((slide) => {
    return slide.imageId !== originalImageId && slide.imageId !== editedImage.id;
  });

  const heroSlides = [...heroSlidesWithoutEditedImage];

  if (getCheckboxValue(card, "isHeroSlide") && isHeroEligibleCard(card)) {
    heroSlides.push({
      imageId: editedImage.id,
      targetCategory: getHeroTargetCategoryFromCard(card, validCategoryIds, fallbackCategoryId)
    });
  }

  return {
    categories,
    images,
    heroSlides,
    aboutPhotos: collectAboutPhotosFromPage(state),
    aboutCopy: collectAboutCopyFromPage(state)
  };
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
    roomId: getGalleryCurationFieldValue(card, "roomId") || "room-main",
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

  const existingByWallId = new Map((state.galleryCuration ?? []).map((record) => [record.wallId, record]));
  const visibleRecords = cards.map((card, index) => {
    const existingOrder = existingByWallId.get(card.dataset.wallId)?.displayOrder;
    return collectGalleryCurationCard(card, state, Number(existingOrder) || index + 1);
  });
  const visibleByWallId = new Map(visibleRecords.map((record) => [record.wallId, record]));
  const merged = (state.galleryCuration ?? []).map((record) => visibleByWallId.get(record.wallId) ?? record);
  const knownWallIds = new Set((state.galleryCuration ?? []).map((record) => record.wallId));
  visibleRecords.forEach((record) => {
    if (!knownWallIds.has(record.wallId)) merged.push(record);
  });
  return merged;
}


function collectAboutPhotosFromPage(state) {
  const cards = Array.from(document.querySelectorAll("[data-about-photo-card]"));

  if (!cards.length) {
    return state.aboutPhotos ?? [];
  }

  return cards.map((card) => {
    const photo = {
      id: getFieldValue(card, "id"),
      title: getFieldValue(card, "title"),
      year: getFieldValue(card, "year"),
      location: getFieldValue(card, "location"),
      note: getFieldValue(card, "note"),
      src: getFieldValue(card, "src"),
      thumbSrc: getFieldValue(card, "thumbSrc"),
      fullSrc: getFieldValue(card, "fullSrc"),
      alt: getFieldValue(card, "alt"),
      imageWidth: getFieldValue(card, "imageWidth"),
      imageHeight: getFieldValue(card, "imageHeight"),
      imageAspectRatio: getFieldValue(card, "imageAspectRatio"),
      imageOrientation: getFieldValue(card, "imageOrientation"),
      placementRole: getFieldValue(card, "placementRole") || "lower-collage",
      aboutPosition: getFieldValue(card, "aboutPosition") || "50% 50%",
      aboutScale: Number(getFieldValue(card, "aboutScale") || 1),
      sourceType: getFieldValue(card, "sourceType") || "about",
      sourceImageId: getFieldValue(card, "sourceImageId")
    };

    const backgroundX = getFieldValue(card, "backgroundX");
    const backgroundY = getFieldValue(card, "backgroundY");
    const backgroundWidth = getFieldValue(card, "backgroundWidth");
    const collageX = getFieldValue(card, "collageX");
    const collageY = getFieldValue(card, "collageY");
    const collageWidth = getFieldValue(card, "collageWidth");
    const collageLayer = getFieldValue(card, "collageLayer");
    const collageRotation = getFieldValue(card, "collageRotation");
    const collageOpacity = getFieldValue(card, "collageOpacity");
    const mobileX = getFieldValue(card, "mobileX");
    const mobileY = getFieldValue(card, "mobileY");
    const mobileWidth = getFieldValue(card, "mobileWidth");
    const mobileLayer = getFieldValue(card, "mobileLayer");
    const mobileRotation = getFieldValue(card, "mobileRotation");
    const mobileOpacity = getFieldValue(card, "mobileOpacity");
    if (backgroundX !== "" && backgroundY !== "") {
      photo.backgroundX = Number(backgroundX);
      photo.backgroundY = Number(backgroundY);
    }
    if (backgroundWidth !== "") {
      photo.backgroundWidth = Number(backgroundWidth);
    }
    if (collageX !== "" && collageY !== "") {
      photo.collageX = Number(collageX);
      photo.collageY = Number(collageY);
    }
    if (collageWidth !== "") {
      photo.collageWidth = Number(collageWidth);
    }
    if (collageLayer !== "") {
      photo.collageLayer = Number(collageLayer);
    }
    if (collageRotation !== "") {
      photo.collageRotation = Number(collageRotation);
    }
    if (collageOpacity !== "") {
      photo.collageOpacity = Number(collageOpacity);
    }
    if (mobileX !== "" && mobileY !== "") {
      photo.mobileX = Number(mobileX);
      photo.mobileY = Number(mobileY);
    }
    if (mobileWidth !== "") photo.mobileWidth = Number(mobileWidth);
    if (mobileLayer !== "") photo.mobileLayer = Number(mobileLayer);
    if (mobileRotation !== "") photo.mobileRotation = Number(mobileRotation);
    if (mobileOpacity !== "") photo.mobileOpacity = Number(mobileOpacity);

    if (!getCheckboxValue(card, "isActive")) {
      photo.isActive = false;
    }

    return photo;
  });
}


function collectAboutCopyFromPage(state) {
  const root = document.querySelector("#aboutCopyEditor");

  if (!root) {
    return state.aboutCopy ?? {};
  }

  const fields = Array.from(root.querySelectorAll("[data-about-copy-field]"));

  if (!fields.length) {
    return state.aboutCopy ?? {};
  }

  const getCopyFieldValue = (fieldName) => {
    const field = fields.find((input) => input.dataset.aboutCopyField === fieldName);

    return String(field?.value ?? "").trim();
  };

  const linkIndexes = [0, 1, 2, 3];
  const links = linkIndexes
    .map((index) => ({
      label: getCopyFieldValue(`contact.links.${index}.label`),
      url: getCopyFieldValue(`contact.links.${index}.url`)
    }))
    .filter((link) => link.label && link.url);

  return {
    schemaVersion: 2,
    hero: {
      eyebrow: getCopyFieldValue("hero.eyebrow"),
      headline: getCopyFieldValue("hero.headline"),
      intro: getCopyFieldValue("hero.intro")
    },
    about: {
      eyebrow: getCopyFieldValue("about.eyebrow"),
      heading: getCopyFieldValue("about.heading"),
      paragraphs: [
        getCopyFieldValue("about.paragraphs.0"),
        getCopyFieldValue("about.paragraphs.1")
      ].filter(Boolean)
    },
    project: {
      eyebrow: getCopyFieldValue("project.eyebrow"),
      heading: getCopyFieldValue("project.heading"),
      paragraphs: [
        getCopyFieldValue("project.paragraphs.0"),
        getCopyFieldValue("project.paragraphs.1")
      ].filter(Boolean)
    },
    additional: {
      eyebrow: getCopyFieldValue("additional.eyebrow"),
      heading: getCopyFieldValue("additional.heading"),
      paragraphs: [
        getCopyFieldValue("additional.paragraphs.0"),
        getCopyFieldValue("additional.paragraphs.1")
      ].filter(Boolean)
    },
    contact: {
      eyebrow: getCopyFieldValue("contact.eyebrow"),
      headline: getCopyFieldValue("contact.headline"),
      body: getCopyFieldValue("contact.body"),
      email: getCopyFieldValue("contact.email"),
      links
    }
  };
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
      heroSlides: heroPageOrder,
      aboutPhotos: collectAboutPhotosFromPage(state),
      aboutCopy: collectAboutCopyFromPage(state)
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
    aboutPhotos: collectAboutPhotosFromPage(state),
    aboutCopy: collectAboutCopyFromPage(state),
    heroSlides: [
      ...heroSlidesFromUneditedImages,
      ...heroSlidesFromEditedImages
    ]
  };
}

export function collectSiteSeoFromPage(state) {
  const current = state.siteSeo ?? {};
  const value = (field) => document.querySelector(`[data-site-seo-field="${field}"]`)?.value?.trim() ?? "";
  const lines = (field) => value(field).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const routes = {};

  document.querySelectorAll("[data-site-seo-route]").forEach((panel) => {
    const routeId = panel.dataset.siteSeoRoute;

    if (!routeId) {
      return;
    }

    const routeValue = (field) => panel.querySelector(`[data-site-seo-route-field="${field}"]`)?.value?.trim() ?? "";
    routes[routeId] = {
      title: routeValue("title"),
      description: routeValue("description"),
      canonicalPath: routeValue("canonicalPath") || "/"
    };
  });

  return {
    ...current,
    schemaVersion: 1,
    siteName: value("siteName"),
    authorName: value("authorName"),
    siteUrl: value("siteUrl"),
    locale: value("locale"),
    themeColor: value("themeColor"),
    defaultImage: value("defaultImage"),
    contactEmail: value("contactEmail"),
    keywords: lines("keywords"),
    sameAs: lines("sameAs"),
    routes
  };
}

export function collectSiteCopyFromPage(state) {
  const current = state.siteCopy ?? {};
  const value = (field) => document.querySelector(`[data-site-copy-field="${field}"]`)?.value?.trim() ?? "";

  return {
    ...current,
    schemaVersion: 1,
    entry: {
      eyebrow: value("entry.eyebrow"),
      headline: value("entry.headline"),
      body: value("entry.body"),
      primaryAction: value("entry.primaryAction"),
      galleryAction: value("entry.galleryAction")
    },
    home: {
      eyebrow: value("home.eyebrow"),
      statement: value("home.statement"),
      galleryAction: value("home.galleryAction"),
      portfolioAction: value("home.portfolioAction")
    },
    navigation: {
      home: value("navigation.home"),
      portfolio: value("navigation.portfolio"),
      gallery: value("navigation.gallery"),
      about: value("navigation.about")
    },
    portfolio: {
      eyebrow: value("portfolio.eyebrow"),
      headline: value("portfolio.headline"),
      allWork: value("portfolio.allWork")
    },
    footer: {
      owner: value("footer.owner"),
      rights: value("footer.rights")
    },
    gallery: {
      releaseStatus: value("gallery.releaseStatus"),
      persistentNotice: value("gallery.persistentNotice"),
      loadingEyebrow: value("gallery.loadingEyebrow"),
      loadingHeadline: value("gallery.loadingHeadline"),
      loadingBody: value("gallery.loadingBody"),
      loadingDisclaimer: value("gallery.loadingDisclaimer"),
      loadingPhase: value("gallery.loadingPhase"),
      unavailableEyebrow: value("gallery.unavailableEyebrow"),
      unavailableHeadline: value("gallery.unavailableHeadline"),
      unavailableBody: value("gallery.unavailableBody"),
      unavailableAction: value("gallery.unavailableAction")
    }
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
      imageOrientation: getImportFieldValue(card, "imageOrientation"),
      originalFilename: getImportFieldValue(card, "originalFilename")
    };
  });
}


export function collectAboutImportReviewRecords() {
  const cards = Array.from(document.querySelectorAll("[data-about-import-card]"));

  return cards.map((card) => {
    return {
      id: getImportFieldValue(card, "id"),
      title: getImportFieldValue(card, "title"),
      year: getImportFieldValue(card, "year"),
      location: getImportFieldValue(card, "location"),
      alt: getImportFieldValue(card, "alt"),
      note: getImportFieldValue(card, "note"),
      placementRole: getImportFieldValue(card, "placementRole") || "lower-collage",
      imageWidth: getImportFieldValue(card, "imageWidth"),
      imageHeight: getImportFieldValue(card, "imageHeight"),
      imageAspectRatio: getImportFieldValue(card, "imageAspectRatio"),
      imageOrientation: getImportFieldValue(card, "imageOrientation"),
      originalFilename: getImportFieldValue(card, "originalFilename"),
      isActive: true
    };
  });
}
