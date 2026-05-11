const editorList = document.querySelector("#editorList");
const categoryList = document.querySelector("#categoryList");
const statusText = document.querySelector("#statusText");
const saveButton = document.querySelector("#saveButton");
const reloadButton = document.querySelector("#reloadButton");
const addCategoryButton = document.querySelector("#addCategoryButton");
const refreshCategoriesButton = document.querySelector("#refreshCategoriesButton");

const importFiles = document.querySelector("#importFiles");
const importCategory = document.querySelector("#importCategory");
const importYear = document.querySelector("#importYear");
const importLocation = document.querySelector("#importLocation");
const importAltPrefix = document.querySelector("#importAltPrefix");
const importNote = document.querySelector("#importNote");
const prepareImportButton = document.querySelector("#prepareImportButton");
const importSummary = document.querySelector("#importSummary");

const importReview = document.querySelector("#importReview");
const importReviewList = document.querySelector("#importReviewList");
const saveReviewedImportButton = document.querySelector("#saveReviewedImportButton");
const clearImportReviewButton = document.querySelector("#clearImportReviewButton");

let state = {
  categories: [],
  images: [],
  heroSlides: []
};

let pendingImportItems = [];

function setStatus(message) {
  statusText.textContent = message;
}

function setImportSummary(message) {
  importSummary.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  const slug = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "item";
}

function titleFromFilename(filename) {
  const stem = filename.replace(/\.[^/.]+$/, "");
  const cleaned = stem.replace(/[-_]+/g, " ").trim();

  return cleaned ? cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Untitled Image";
}

function clampPositionValue(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return 50;
  }

  return Math.max(0, Math.min(100, number));
}

function parseObjectPosition(position) {
  const fallback = {
    x: 50,
    y: 50
  };

  if (!position) {
    return fallback;
  }

  const matches = String(position).match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);

  if (!matches) {
    return fallback;
  }

  return {
    x: clampPositionValue(matches[1]),
    y: clampPositionValue(matches[2])
  };
}

function formatObjectPosition(x, y) {
  return `${clampPositionValue(x)}% ${clampPositionValue(y)}%`;
}

function renderPositionControls(fieldName, label, value, isImport = false) {
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
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value="${parsedPosition.x}"
          data-position-axis="x"
        />
        <strong data-position-value="x">${parsedPosition.x}%</strong>
      </label>

      <label class="framing-slider">
        <span>Y</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value="${parsedPosition.y}"
          data-position-axis="y"
        />
        <strong data-position-value="y">${parsedPosition.y}%</strong>
      </label>
    </div>
  `;
}

function updateFramingControl(slider) {
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

  const x = clampPositionValue(xSlider?.value ?? 50);
  const y = clampPositionValue(ySlider?.value ?? 50);
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

  if (fieldName === "thumbnailPosition") {
    const card = controls.closest("[data-image-card], [data-import-card]");
    const previewImage = card?.querySelector(".preview img");

    if (previewImage) {
      previewImage.style.objectPosition = position;
    }
  }
}

function getFallbackCategoryId() {
  return state.categories[0]?.id ?? "personal";
}

function categoryOptions(selectedCategory) {
  return state.categories.map((category) => {
    const selected = category.id === selectedCategory ? "selected" : "";
    return `<option value="${escapeHtml(category.id)}" ${selected}>${escapeHtml(category.label)}</option>`;
  }).join("");
}

function updateImportCategoryOptions() {
  importCategory.innerHTML = categoryOptions(importCategory.value || getFallbackCategoryId());
}

function getHeroSlideForImage(imageId) {
  return state.heroSlides.find((slide) => slide.imageId === imageId);
}

function renderCategories() {
  categoryList.innerHTML = state.categories.map((category, index) => {
    return `
      <div class="category-row" data-category-row data-category-index="${index}">
        <label>
          <span>Category ID</span>
          <input data-category-field="id" value="${escapeHtml(category.id)}" />
        </label>

        <label>
          <span>Display Label</span>
          <input data-category-field="label" value="${escapeHtml(category.label)}" />
        </label>

        <button class="button danger" type="button" data-remove-category="${index}">Remove</button>
      </div>
    `;
  }).join("");
}

function renderEditor() {
  editorList.innerHTML = state.images.map((image) => {
    const heroSlide = getHeroSlideForImage(image.id);
    const isHeroSlide = Boolean(heroSlide);
    const heroTargetCategory = heroSlide?.targetCategory ?? image.category ?? getFallbackCategoryId();
    const thumbnailPosition = image.thumbnailPosition ?? "50% 50%";
    const heroPosition = image.heroPosition ?? "50% 50%";

    return `
      <article class="image-card" data-image-card data-image-id="${escapeHtml(image.id)}">
        <div class="preview">
          <img
            src="${escapeHtml(image.thumbSrc ?? image.src)}"
            alt="${escapeHtml(image.alt)}"
            loading="lazy"
            style="object-position: ${escapeHtml(thumbnailPosition)};"
          />
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
            <select data-field="category">
              ${categoryOptions(image.category)}
            </select>
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

          ${renderPositionControls("thumbnailPosition", "Thumbnail crop position", thumbnailPosition)}
          ${renderPositionControls("heroPosition", "Hero crop position", heroPosition)}

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
              <select data-field="heroTargetCategory">
                ${categoryOptions(heroTargetCategory)}
              </select>
            </label>
          </div>

          <div class="image-card-actions">
            <button class="button primary" type="button" data-save-image-card>Save JSON</button>
            <button class="button danger" type="button" data-remove-image-card>Remove Record</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderAll() {
  renderCategories();
  updateImportCategoryOptions();
  renderEditor();
}

function clearPendingImportItems() {
  pendingImportItems.forEach((item) => {
    URL.revokeObjectURL(item.previewUrl);
  });

  pendingImportItems = [];
  importReview.classList.remove("is-active");
  importReviewList.innerHTML = "";
  setImportSummary("");
}

function renderImportReview() {
  if (!pendingImportItems.length) {
    importReview.classList.remove("is-active");
    importReviewList.innerHTML = "";
    return;
  }

  importReview.classList.add("is-active");

  importReviewList.innerHTML = pendingImportItems.map((item, index) => {
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
            <select data-import-field="category">
              ${categoryOptions(item.category)}
            </select>
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

          ${renderPositionControls("thumbnailPosition", "Thumbnail crop position", item.thumbnailPosition, true)}
          ${renderPositionControls("heroPosition", "Hero crop position", item.heroPosition, true)}

          <label class="wide">
            <span>Note</span>
            <textarea data-import-field="note">${escapeHtml(item.note)}</textarea>
          </label>
        </div>
      </article>
    `;
  }).join("");
}

async function loadData() {
  setStatus("Loading data...");

  const response = await fetch("/api/data");

  if (!response.ok) {
    throw new Error("Could not load data.");
  }

  state = await response.json();
  renderAll();

  setStatus(`Loaded ${state.images.length} images and ${state.categories.length} categories.`);
}

function getFieldValue(card, field) {
  const input = card.querySelector(`[data-field="${field}"]`);
  return String(input?.value ?? "").trim();
}

function getImportFieldValue(card, field) {
  const input = card.querySelector(`[data-import-field="${field}"]`);
  return String(input?.value ?? "").trim();
}

function getCheckboxValue(card, field) {
  const input = card.querySelector(`[data-field="${field}"]`);
  return Boolean(input?.checked);
}

function collectCategories() {
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

function collectEditorData() {
  const categories = collectCategories();
  const validCategoryIds = new Set(categories.map((category) => category.id));
  const fallbackCategoryId = categories[0]?.id ?? "personal";
  const cards = Array.from(document.querySelectorAll("[data-image-card]"));

  const images = cards.map((card) => {
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

    const thumbSrc = getFieldValue(card, "thumbSrc");
    const textureSrc = getFieldValue(card, "textureSrc");
    const fullSrc = getFieldValue(card, "fullSrc");
    const thumbnailPosition = getFieldValue(card, "thumbnailPosition");
    const heroPosition = getFieldValue(card, "heroPosition");

    if (thumbSrc) {
      image.thumbSrc = thumbSrc;
    }

    if (textureSrc) {
      image.textureSrc = textureSrc;
    }

    if (thumbnailPosition) {
      image.thumbnailPosition = thumbnailPosition;
    }

    if (heroPosition) {
      image.heroPosition = heroPosition;
    }

    if (fullSrc) {
      image.fullSrc = fullSrc;
    }

    return image;
  });

  const heroSlides = cards
    .filter((card) => getCheckboxValue(card, "isHeroSlide"))
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
    heroSlides
  };
}

function collectImportReviewRecords() {
  const cards = Array.from(document.querySelectorAll("[data-import-card]"));
  const categories = collectCategories();
  const validCategoryIds = new Set(categories.map((category) => category.id));
  const fallbackCategoryId = categories[0]?.id ?? "personal";

  return cards.map((card) => {
    const category = getImportFieldValue(card, "category");

    return {
      id: getImportFieldValue(card, "id"),
      title: getImportFieldValue(card, "title"),
      category: validCategoryIds.has(category) ? category : fallbackCategoryId,
      year: getImportFieldValue(card, "year"),
      location: getImportFieldValue(card, "location"),
      alt: getImportFieldValue(card, "alt"),
      note: getImportFieldValue(card, "note"),
      thumbnailPosition: getImportFieldValue(card, "thumbnailPosition") || "50% 50%",
      heroPosition: getImportFieldValue(card, "heroPosition") || "50% 50%"
    };
  });
}

async function savePayload(payload) {
  setStatus("Saving data...");

  const response = await fetch("/api/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? "Could not save data.");
  }

  const savedData = await response.json();

  state = {
    categories: savedData.categories,
    images: savedData.images,
    heroSlides: savedData.heroSlides
  };

  renderAll();
  setStatus(`Saved ${state.images.length} images and ${state.categories.length} categories.`);
}

async function saveData() {
  await savePayload(collectEditorData());
}

function prepareImportReview() {
  state = collectEditorData();

  if (!importFiles.files.length) {
    setImportSummary("Choose at least one image file first.");
    return;
  }

  clearPendingImportItems();

  const category = importCategory.value || getFallbackCategoryId();
  const year = importYear.value.trim();
  const location = importLocation.value.trim();
  const note = importNote.value.trim();
  const altPrefix = importAltPrefix.value.trim() || "Photograph by Taylor Pike";
  const usedIds = new Set(state.images.map((image) => image.id));

  pendingImportItems = Array.from(importFiles.files).map((file) => {
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
      heroPosition: "50% 50%"
    };
  });

  renderImportReview();
  setImportSummary(`Prepared ${pendingImportItems.length} images for review. The default note was copied into each image and can now be edited individually.`);
}

async function saveReviewedImport() {
  if (!pendingImportItems.length) {
    setImportSummary("Prepare an import first.");
    return;
  }

  setStatus("Importing reviewed images...");
  setImportSummary("Copying files and saving JSON...");

  const formData = new FormData();
  const records = collectImportReviewRecords();

  pendingImportItems.forEach((item) => {
    formData.append("images", item.file);
  });

  formData.append("records", JSON.stringify(records));

  const response = await fetch("/api/import-reviewed", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? "Could not import images.");
  }

  const result = await response.json();

  state = {
    categories: result.categories,
    images: result.images,
    heroSlides: result.heroSlides
  };

  const importedTitles = result.importedImages.map((image) => image.title).join(", ");

  importFiles.value = "";
  clearPendingImportItems();
  renderAll();

  setStatus(`Imported ${result.importedImages.length} images.`);
  setImportSummary(importedTitles);
}

addCategoryButton.addEventListener("click", () => {
  state = collectEditorData();

  const label = prompt("Category name:");

  if (!label) {
    return;
  }

  const id = slugify(label);

  state.categories.push({
    id,
    label: label.trim()
  });

  renderAll();
});

refreshCategoriesButton.addEventListener("click", () => {
  state = collectEditorData();
  renderAll();
  setStatus("Category options refreshed.");
});

categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-category]");

  if (!button) {
    return;
  }

  state = collectEditorData();

  const index = Number(button.dataset.removeCategory);

  state.categories.splice(index, 1);

  if (!state.categories.length) {
    state.categories.push({
      id: "personal",
      label: "Personal"
    });
  }

  const fallbackCategoryId = getFallbackCategoryId();
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

  renderAll();
});

editorList.addEventListener("input", (event) => {
  const slider = event.target.closest("[data-position-axis]");

  if (slider) {
    updateFramingControl(slider);
  }
});

importReviewList.addEventListener("input", (event) => {
  const slider = event.target.closest("[data-position-axis]");

  if (slider) {
    updateFramingControl(slider);
  }
});

editorList.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-image-card]");
  const removeButton = event.target.closest("[data-remove-image-card]");

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

    const payload = collectEditorData();

    payload.images = payload.images.filter((image) => image.id !== imageId);
    payload.heroSlides = payload.heroSlides.filter((slide) => slide.imageId !== imageId);

    savePayload(payload).catch((error) => {
      console.error(error);
      setStatus(error.message);
    });
  }
});

prepareImportButton.addEventListener("click", () => {
  prepareImportReview();
});

saveReviewedImportButton.addEventListener("click", () => {
  saveReviewedImport().catch((error) => {
    console.error(error);
    setStatus(error.message);
    setImportSummary(error.message);
  });
});

clearImportReviewButton.addEventListener("click", () => {
  clearPendingImportItems();
});

saveButton.addEventListener("click", () => {
  saveData().catch((error) => {
    console.error(error);
    setStatus(error.message);
  });
});

reloadButton.addEventListener("click", () => {
  clearPendingImportItems();

  loadData().catch((error) => {
    console.error(error);
    setStatus(error.message);
  });
});

loadData().catch((error) => {
  console.error(error);
  setStatus(error.message);
});