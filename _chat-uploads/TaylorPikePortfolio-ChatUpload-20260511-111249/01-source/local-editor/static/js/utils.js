export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function slugify(value) {
  const slug = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "item";
}

export function titleFromFilename(filename) {
  const stem = filename.replace(/\.[^/.]+$/, "");
  const cleaned = stem.replace(/[-_]+/g, " ").trim();

  return cleaned ? cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Untitled Image";
}

export function clampPositionValue(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return 50;
  }

  return Math.max(0, Math.min(100, number));
}

export function parseObjectPosition(position) {
  if (!position) {
    return { x: 50, y: 50 };
  }

  const matches = String(position).match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);

  if (!matches) {
    return { x: 50, y: 50 };
  }

  return {
    x: clampPositionValue(matches[1]),
    y: clampPositionValue(matches[2])
  };
}

export function formatObjectPosition(x, y) {
  return `${clampPositionValue(x)}% ${clampPositionValue(y)}%`;
}

export function getFallbackCategoryId(state) {
  return state.categories[0]?.id ?? "personal";
}

export function categoryOptions(categories, selectedCategory) {
  return categories.map((category) => {
    const selected = category.id === selectedCategory ? "selected" : "";
    return `<option value="${escapeHtml(category.id)}" ${selected}>${escapeHtml(category.label)}</option>`;
  }).join("");
}