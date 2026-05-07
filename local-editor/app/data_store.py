"""Read, normalize, and write the portfolio JSON data files.

The Flask editor uses this module as the single place where raw browser input is
cleaned before it reaches the source JSON files used by the public Vite site.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .asset_manager import relocate_imported_image_assets
from .utils import clean_string, slugify


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "src" / "data"
PUBLIC_DIR = PROJECT_ROOT / "public"

CATEGORIES_PATH = DATA_DIR / "categories.json"
GALLERY_IMAGES_PATH = DATA_DIR / "galleryImages.json"
HERO_SLIDES_PATH = DATA_DIR / "heroSlides.json"

DEFAULT_CATEGORIES = [
    {"id": "climbing", "label": "Climbing"},
    {"id": "landscape", "label": "Landscape"},
    {"id": "personal", "label": "Personal"},
]


# Reads a JSON file from disk and returns an empty list when the file does not exist yet.
def read_json(path: Path) -> Any:
    if not path.exists():
        return []

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


# Writes normalized JSON with stable indentation so diffs stay readable.
def write_json(path: Path, data: Any) -> None:
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


# Cleans category records and guarantees each category has a unique ID.
def normalize_categories(raw_categories: list[Any]) -> list[dict[str, str]]:
    categories: list[dict[str, str]] = []
    used_ids: set[str] = set()

    for raw_category in raw_categories:
        if not isinstance(raw_category, dict):
            continue

        label = clean_string(raw_category.get("label"))
        category_id = slugify(clean_string(raw_category.get("id")) or label)

        if not label:
            label = category_id.replace("-", " ").title()

        original_id = category_id
        count = 2

        while category_id in used_ids:
            category_id = f"{original_id}-{count}"
            count += 1

        used_ids.add(category_id)
        categories.append({"id": category_id, "label": label})

    if not categories:
        return DEFAULT_CATEGORIES

    return categories


# Converts incoming values into positive integers for image dimensions.
def clean_positive_int(value: Any) -> int | None:
    try:
        number = int(float(value))
    except (TypeError, ValueError):
        return None

    if number <= 0:
        return None

    return number


# Converts incoming values into positive floats for aspect ratios and sizes.
def clean_positive_float(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    if number <= 0:
        return None

    return round(number, 6)


# Keeps virtual gallery frame size inside the allowed editor range.
def clean_gallery_size(value: Any) -> float:
    try:
        size = float(value)
    except (TypeError, ValueError):
        return 1.0

    if size <= 0:
        return 1.0

    return round(min(1.35, max(0.55, size)), 3)


# Infers image orientation from measured pixel dimensions.
def get_orientation_from_dimensions(width: int | None, height: int | None) -> str | None:
    if not width or not height:
        return None

    aspect_ratio = width / height

    if abs(aspect_ratio - 1) <= 0.04:
        return "square"

    if aspect_ratio > 1:
        return "landscape"

    return "portrait"


# Uses a valid saved orientation or falls back to measured dimensions.
def normalize_orientation(value: Any, width: int | None, height: int | None) -> str | None:
    orientation = clean_string(value)

    if orientation in {"landscape", "portrait", "square"}:
        return orientation

    return get_orientation_from_dimensions(width, height)


# Normalizes virtual gallery fit mode to cover or contain.
def normalize_gallery_fit_mode(value: Any) -> str:
    fit_mode = clean_string(value)

    if fit_mode == "contain":
        return "contain"

    return "cover"


# Normalizes hero fit mode to cover or contain.
def normalize_hero_fit_mode(value: Any) -> str:
    fit_mode = clean_string(value)

    if fit_mode == "contain":
        return "contain"

    return "cover"


# Normalizes frame style to auto, landscape, portrait, or square.
def normalize_frame_style(value: Any) -> str:
    frame_style = clean_string(value)

    if frame_style in {"auto", "landscape", "portrait", "square"}:
        return frame_style

    return "auto"


# Cleans one image record and preserves only supported fields.
def normalize_image(
    raw_image: dict[str, Any],
    valid_category_ids: set[str],
    fallback_category_id: str,
) -> dict[str, Any]:
    category = clean_string(raw_image.get("category"))

    if category not in valid_category_ids:
        category = fallback_category_id

    width = clean_positive_int(raw_image.get("imageWidth"))
    height = clean_positive_int(raw_image.get("imageHeight"))
    aspect_ratio = clean_positive_float(raw_image.get("imageAspectRatio"))

    if not aspect_ratio and width and height:
        aspect_ratio = round(width / height, 6)

    orientation = normalize_orientation(raw_image.get("imageOrientation"), width, height)

    image: dict[str, Any] = {
        "id": clean_string(raw_image.get("id")),
        "title": clean_string(raw_image.get("title")),
        "category": category,
        "year": clean_string(raw_image.get("year")),
        "location": clean_string(raw_image.get("location")),
        "note": clean_string(raw_image.get("note")),
        "src": clean_string(raw_image.get("src")),
        "alt": clean_string(raw_image.get("alt")),
    }

    if width:
        image["imageWidth"] = width

    if height:
        image["imageHeight"] = height

    if aspect_ratio:
        image["imageAspectRatio"] = aspect_ratio

    if orientation:
        image["imageOrientation"] = orientation

    for optional_field in [
        "thumbSrc",
        "textureSrc",
        "fullSrc",
        "thumbnailPosition",
        "heroPosition",
        "galleryPosition",
    ]:
        value = clean_string(raw_image.get(optional_field))

        if value:
            image[optional_field] = value

    image["heroFrameStyle"] = normalize_frame_style(raw_image.get("heroFrameStyle"))
    image["heroFitMode"] = normalize_hero_fit_mode(raw_image.get("heroFitMode"))
    image["galleryFitMode"] = normalize_gallery_fit_mode(raw_image.get("galleryFitMode"))
    image["galleryFrameStyle"] = normalize_frame_style(raw_image.get("galleryFrameStyle"))
    image["gallerySize"] = clean_gallery_size(raw_image.get("gallerySize"))

    return image


# Cleans one hero slide record and validates its target category.
def normalize_hero_slide(
    raw_slide: dict[str, Any],
    valid_category_ids: set[str],
    fallback_category_id: str,
) -> dict[str, str]:
    target_category = clean_string(raw_slide.get("targetCategory"))

    if target_category not in valid_category_ids:
        target_category = fallback_category_id

    return {
        "imageId": clean_string(raw_slide.get("imageId")),
        "targetCategory": target_category,
    }


# Reads all JSON data files and returns normalized categories, images, and hero slides.
def get_current_data() -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]]]:
    categories = read_json(CATEGORIES_PATH)

    if not categories:
        categories = DEFAULT_CATEGORIES

    categories = normalize_categories(categories)
    valid_category_ids = {category["id"] for category in categories}
    fallback_category_id = categories[0]["id"]

    images = [
        normalize_image(image, valid_category_ids, fallback_category_id)
        for image in read_json(GALLERY_IMAGES_PATH)
        if isinstance(image, dict)
    ]

    image_ids = {image["id"] for image in images}

    hero_slides = [
        normalize_hero_slide(slide, valid_category_ids, fallback_category_id)
        for slide in read_json(HERO_SLIDES_PATH)
        if isinstance(slide, dict)
    ]

    hero_slides = [
        slide
        for slide in hero_slides
        if slide["imageId"] in image_ids
    ]

    return categories, images, hero_slides


# Saves the entire editor state after normalizing categories, images, and hero slides.
def save_full_data(
    raw_categories: list[Any],
    raw_images: list[Any],
    raw_hero_slides: list[Any],
) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]]]:
    categories = normalize_categories(raw_categories)
    valid_category_ids = {category["id"] for category in categories}
    fallback_category_id = categories[0]["id"]

    images = [
        normalize_image(image, valid_category_ids, fallback_category_id)
        for image in raw_images
        if isinstance(image, dict)
    ]

    images = relocate_imported_image_assets(images)

    hero_slides = [
        normalize_hero_slide(slide, valid_category_ids, fallback_category_id)
        for slide in raw_hero_slides
        if isinstance(slide, dict)
    ]

    image_ids = {image["id"] for image in images}

    hero_slides = [
        slide
        for slide in hero_slides
        if slide["imageId"] in image_ids
    ]

    write_json(CATEGORIES_PATH, categories)
    write_json(GALLERY_IMAGES_PATH, images)
    write_json(HERO_SLIDES_PATH, hero_slides)

    return categories, images, hero_slides

# Fields that can be updated by the crop/detail pages without rewriting the
# entire image list. Keeping this list explicit prevents accidental edits to IDs,
# paths, categories, or other structural fields.
DIRECT_IMAGE_UPDATE_FIELDS = {
    "thumbnailPosition",
    "heroPosition",
    "heroFrameStyle",
    "heroFitMode",
    "galleryPosition",
    "galleryFitMode",
    "galleryFrameStyle",
    "gallerySize",
}


# Cleans the limited set of fields that can be saved from crop/detail pages.
def normalize_direct_image_updates(raw_updates: dict[str, Any]) -> dict[str, Any]:
    updates: dict[str, Any] = {}

    if "thumbnailPosition" in raw_updates:
        value = clean_string(raw_updates.get("thumbnailPosition"))
        if value:
            updates["thumbnailPosition"] = value

    if "heroPosition" in raw_updates:
        value = clean_string(raw_updates.get("heroPosition"))
        if value:
            updates["heroPosition"] = value

    if "galleryPosition" in raw_updates:
        value = clean_string(raw_updates.get("galleryPosition"))
        if value:
            updates["galleryPosition"] = value

    if "heroFrameStyle" in raw_updates:
        updates["heroFrameStyle"] = normalize_frame_style(raw_updates.get("heroFrameStyle"))

    if "heroFitMode" in raw_updates:
        updates["heroFitMode"] = normalize_hero_fit_mode(raw_updates.get("heroFitMode"))

    if "galleryFitMode" in raw_updates:
        updates["galleryFitMode"] = normalize_gallery_fit_mode(raw_updates.get("galleryFitMode"))

    if "galleryFrameStyle" in raw_updates:
        updates["galleryFrameStyle"] = normalize_frame_style(raw_updates.get("galleryFrameStyle"))

    if "gallerySize" in raw_updates:
        updates["gallerySize"] = clean_gallery_size(raw_updates.get("gallerySize"))

    return updates


# Updates one image record without rewriting data from hidden editor pages.
def save_image_updates(image_id: str, raw_updates: dict[str, Any]) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]], dict[str, Any]]:
    """Update one image record and persist the normalized JSON files.

    This is used by crop pages so changing a hero crop or fit mode does not rely
    on collecting every visible editor form field. The rest of the project data is
    read from disk, normalized, and written back with only the selected image
    changed.
    """

    categories, images, hero_slides = get_current_data()
    updates = normalize_direct_image_updates(raw_updates)

    for index, image in enumerate(images):
        if image.get("id") != image_id:
            continue

        updated_image = {
            **image,
            **updates,
        }

        valid_category_ids = {category["id"] for category in categories}
        fallback_category_id = categories[0]["id"] if categories else "personal"
        images[index] = normalize_image(updated_image, valid_category_ids, fallback_category_id)

        write_json(CATEGORIES_PATH, categories)
        write_json(GALLERY_IMAGES_PATH, images)
        write_json(HERO_SLIDES_PATH, hero_slides)

        return categories, images, hero_slides, images[index]

    raise ValueError(f"Image not found: {image_id}")
