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


def read_json(path: Path) -> Any:
    if not path.exists():
        return []

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path: Path, data: Any) -> None:
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


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


def clean_positive_int(value: Any) -> int | None:
    try:
        number = int(float(value))
    except (TypeError, ValueError):
        return None

    if number <= 0:
        return None

    return number


def clean_positive_float(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    if number <= 0:
        return None

    return round(number, 6)


def clean_gallery_size(value: Any) -> float:
    try:
        size = float(value)
    except (TypeError, ValueError):
        return 1.0

    if size <= 0:
        return 1.0

    return round(min(1.35, max(0.55, size)), 3)


def get_orientation_from_dimensions(width: int | None, height: int | None) -> str | None:
    if not width or not height:
        return None

    aspect_ratio = width / height

    if abs(aspect_ratio - 1) <= 0.04:
        return "square"

    if aspect_ratio > 1:
        return "landscape"

    return "portrait"


def normalize_orientation(value: Any, width: int | None, height: int | None) -> str | None:
    orientation = clean_string(value)

    if orientation in {"landscape", "portrait", "square"}:
        return orientation

    return get_orientation_from_dimensions(width, height)


def normalize_gallery_fit_mode(value: Any) -> str:
    fit_mode = clean_string(value)

    if fit_mode == "contain":
        return "contain"

    return "cover"


def normalize_hero_fit_mode(value: Any) -> str:
    fit_mode = clean_string(value)

    if fit_mode == "contain":
        return "contain"

    return "cover"


def normalize_frame_style(value: Any) -> str:
    frame_style = clean_string(value)

    if frame_style in {"auto", "landscape", "portrait", "square"}:
        return frame_style

    return "auto"


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

# Image-level update fields that can be changed by a focused editor screen, such
# as the hero crop editor. Keeping this allowlist prevents a small crop-save
# request from accidentally changing unrelated image metadata or category order.
ALLOWED_IMAGE_UPDATE_FIELDS = {
    "thumbnailPosition",
    "heroPosition",
    "heroFrameStyle",
    "heroFitMode",
    "galleryPosition",
    "galleryFitMode",
    "galleryFrameStyle",
    "gallerySize",
}


def save_image_updates(
    image_id: str,
    raw_updates: dict[str, Any],
) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]]]:
    """Update one image record without rewriting the editor's full page state.

    The crop editor only needs to modify framing fields for a single image. This
    function reads the current JSON from disk, applies the allowed updates to the
    matching image, normalizes the full data set, and writes the JSON back. This
    avoids bugs where a crop save accidentally depends on whatever page is
    currently rendered in the browser.
    """

    clean_image_id = clean_string(image_id)

    if not clean_image_id:
        raise ValueError("Missing image id.")

    if not isinstance(raw_updates, dict):
        raise ValueError("updates must be an object.")

    raw_categories = read_json(CATEGORIES_PATH)
    raw_images = read_json(GALLERY_IMAGES_PATH)
    raw_hero_slides = read_json(HERO_SLIDES_PATH)

    if not isinstance(raw_categories, list):
        raw_categories = DEFAULT_CATEGORIES

    if not isinstance(raw_images, list):
        raw_images = []

    if not isinstance(raw_hero_slides, list):
        raw_hero_slides = []

    did_update = False

    for raw_image in raw_images:
        if not isinstance(raw_image, dict):
            continue

        if clean_string(raw_image.get("id")) != clean_image_id:
            continue

        for field, value in raw_updates.items():
            if field not in ALLOWED_IMAGE_UPDATE_FIELDS:
                continue

            raw_image[field] = value

        did_update = True
        break

    if not did_update:
        raise ValueError(f"Image not found: {clean_image_id}")

    return save_full_data(raw_categories, raw_images, raw_hero_slides)

