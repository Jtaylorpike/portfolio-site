"""Read, validate, back up, and write the portfolio JSON data files.

The local Flask editor is allowed to modify the same JSON files that the public
Vite site imports at build time. This module is the safety layer between the
browser editor and those source files. It normalizes incoming data, validates the
result, creates a timestamped backup, and then writes clean JSON back to disk.
"""

from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .asset_manager import relocate_imported_image_assets
from .utils import clean_string, slugify


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "src" / "data"
PUBLIC_DIR = PROJECT_ROOT / "public"
BACKUP_DIR = PROJECT_ROOT / "local-editor" / "backups"

CATEGORIES_PATH = DATA_DIR / "categories.json"
GALLERY_IMAGES_PATH = DATA_DIR / "galleryImages.json"
HERO_SLIDES_PATH = DATA_DIR / "heroSlides.json"

DEFAULT_CATEGORIES = [
    {"id": "climbing", "label": "Climbing"},
    {"id": "landscape", "label": "Landscape"},
    {"id": "personal", "label": "Personal"},
]

GALLERY_DEFAULT_SIZE_BY_STYLE = {
    "landscape": 1.0,
    "portrait": 1.32,
    "square": 1.08,
}

GALLERY_MAX_SIZE_BY_STYLE = {
    "landscape": 1.0,
    "portrait": 1.32,
    "square": 1.16,
}

GALLERY_MIN_SIZE = 0.55

SUPPORTED_FIT_MODES = {"cover", "contain"}
SUPPORTED_FRAME_STYLES = {"auto", "landscape", "portrait", "square"}
SUPPORTED_ORIENTATIONS = {"landscape", "portrait", "square"}
POSITION_PATTERN = re.compile(r"^\d{1,3}(?:\.\d+)?%\s+\d{1,3}(?:\.\d+)?%$")


class DataValidationError(ValueError):
    """Raised when normalized editor data would create an unsafe JSON state."""


# Reads a JSON file from disk and returns an empty list when the file does not exist yet.
def read_json(path: Path) -> Any:
    if not path.exists():
        return []

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


# Writes JSON with stable indentation so Git diffs remain readable.
def write_json(path: Path, data: Any) -> None:
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


# Creates a safe folder/file name from a human-readable save reason.
def make_backup_slug(reason: str) -> str:
    return slugify(reason or "editor-save")


# Creates timestamped backup copies before the editor changes source JSON files.
def create_data_backup(reason: str) -> dict[str, Any]:
    """Copy the current JSON files into a dated backup folder.

    A backup is created before every editor save. The files are grouped in one
    folder so a future restore can recover categories, images, and hero slides
    from the same point in time.
    """

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup_name = f"{timestamp}-{make_backup_slug(reason)}"
    backup_path = BACKUP_DIR / backup_name
    backup_path.mkdir(parents=True, exist_ok=True)

    backed_up_files: list[str] = []

    for source_path in [CATEGORIES_PATH, GALLERY_IMAGES_PATH, HERO_SLIDES_PATH]:
        if not source_path.exists():
            continue

        destination_path = backup_path / source_path.name
        shutil.copy2(source_path, destination_path)
        backed_up_files.append(source_path.name)

    manifest = {
        "reason": reason,
        "createdAtUtc": datetime.now(timezone.utc).isoformat(),
        "backupFolder": backup_name,
        "files": backed_up_files,
    }

    write_json(backup_path / "manifest.json", manifest)

    return manifest


# Accepts only backup folder names created by the editor.
def is_safe_backup_name(name: str) -> bool:
    """Reject path traversal and other unsafe backup names.

    Restore requests come from the browser, so the backend must treat the backup
    folder name as untrusted input. This check ensures a restore request can only
    target a simple folder name inside local-editor/backups/.
    """

    return bool(re.fullmatch(r"[A-Za-z0-9._-]+", name or ""))


# Resolves a backup folder name into an absolute path inside the backups folder.
def get_backup_path(backup_name: str) -> Path:
    """Return the backup folder path after validating the folder name."""

    clean_backup_name = clean_string(backup_name)

    if not is_safe_backup_name(clean_backup_name):
        raise ValueError("Backup name is not valid.")

    backup_path = BACKUP_DIR / clean_backup_name

    if not backup_path.exists() or not backup_path.is_dir():
        raise ValueError(f"Backup not found: {clean_backup_name}")

    return backup_path


# Reads optional backup metadata written when the backup was created.
def read_backup_manifest(backup_path: Path) -> dict[str, Any]:
    """Read manifest.json when available and return a safe fallback otherwise."""

    manifest_path = backup_path / "manifest.json"

    if not manifest_path.exists():
        return {}

    try:
        manifest = read_json(manifest_path)
    except (json.JSONDecodeError, OSError):
        return {}

    if isinstance(manifest, dict):
        return manifest

    return {}


# Builds one summary card for the Backups page in the editor.
def summarize_backup_folder(backup_path: Path) -> dict[str, Any]:
    """Return browser-friendly metadata for one backup folder."""

    manifest = read_backup_manifest(backup_path)
    files = [
        file_name
        for file_name in ["categories.json", "galleryImages.json", "heroSlides.json"]
        if (backup_path / file_name).exists()
    ]

    created_at_utc = clean_string(manifest.get("createdAtUtc"))

    if not created_at_utc:
        created_at_utc = datetime.fromtimestamp(
            backup_path.stat().st_mtime,
            timezone.utc,
        ).isoformat()

    return {
        "backupFolder": backup_path.name,
        "reason": clean_string(manifest.get("reason")) or "backup",
        "createdAtUtc": created_at_utc,
        "files": files,
        "canRestore": all(file_name in files for file_name in ["categories.json", "galleryImages.json", "heroSlides.json"]),
    }


# Lists all available JSON backup folders for the editor UI.
def list_data_backups() -> list[dict[str, Any]]:
    """Return backup folders newest-first.

    The UI uses this list to show restore options. Folders without all three JSON
    files are still shown for transparency, but the Restore button is disabled.
    """

    if not BACKUP_DIR.exists():
        return []

    backups = [
        summarize_backup_folder(path)
        for path in BACKUP_DIR.iterdir()
        if path.is_dir()
    ]

    return sorted(
        backups,
        key=lambda item: (clean_string(item.get("createdAtUtc")), clean_string(item.get("backupFolder"))),
        reverse=True,
    )


# Loads and normalizes the three JSON files stored inside one backup folder.
def load_backup_data(backup_path: Path) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]]]:
    """Read a backup folder and validate that it can safely restore the site."""

    required_paths = [
        backup_path / "categories.json",
        backup_path / "galleryImages.json",
        backup_path / "heroSlides.json",
    ]

    missing_files = [path.name for path in required_paths if not path.exists()]

    if missing_files:
        raise DataValidationError(f"Backup is missing required files: {', '.join(missing_files)}")

    raw_categories = read_json(backup_path / "categories.json")
    raw_images = read_json(backup_path / "galleryImages.json")
    raw_hero_slides = read_json(backup_path / "heroSlides.json")

    if not isinstance(raw_categories, list):
        raise DataValidationError("Backup categories.json must contain a list.")

    if not isinstance(raw_images, list):
        raise DataValidationError("Backup galleryImages.json must contain a list.")

    if not isinstance(raw_hero_slides, list):
        raise DataValidationError("Backup heroSlides.json must contain a list.")

    categories = normalize_categories(raw_categories)
    valid_category_ids = {category["id"] for category in categories}
    fallback_category_id = categories[0]["id"]

    images = [
        normalize_image(image, valid_category_ids, fallback_category_id)
        for image in raw_images
        if isinstance(image, dict)
    ]

    hero_slides = [
        normalize_hero_slide(slide, valid_category_ids, fallback_category_id)
        for slide in raw_hero_slides
        if isinstance(slide, dict)
    ]

    # Restore validation should be stricter than normal loading. If a backup has
    # a broken hero slide reference, the editor should refuse to restore it
    # instead of copying the exact broken backup back into the project.
    validate_project_data(categories, images, hero_slides)

    return categories, images, hero_slides


# Restores one backup after creating a new backup of the current state.
def restore_data_backup(backup_name: str) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]], dict[str, Any], dict[str, Any]]:
    """Replace the current JSON files with a validated backup.

    The restore action is intentionally reversible. Before overwriting anything,
    the current JSON files are backed up into a new pre-restore folder.
    """

    backup_path = get_backup_path(backup_name)
    categories, images, hero_slides = load_backup_data(backup_path)
    safety_backup = create_data_backup(f"pre-restore-{backup_path.name}")

    # Copy the backup files back exactly as they were saved. Validation above
    # proves they can be loaded safely, and exact copying avoids unnecessary Git
    # diffs from reformatting or re-normalizing older backups.
    shutil.copy2(backup_path / "categories.json", CATEGORIES_PATH)
    shutil.copy2(backup_path / "galleryImages.json", GALLERY_IMAGES_PATH)
    shutil.copy2(backup_path / "heroSlides.json", HERO_SLIDES_PATH)

    restored_backup = summarize_backup_folder(backup_path)

    return categories, images, hero_slides, restored_backup, safety_backup


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


# Resolves auto frame style into the concrete shape used for size limits.
def resolve_gallery_frame_style(frame_style: str, orientation: str | None) -> str:
    if frame_style in {"landscape", "portrait", "square"}:
        return frame_style

    if orientation in {"portrait", "square"}:
        return orientation

    return "landscape"


# Keeps virtual gallery frame size inside the allowed editor range.
def clean_gallery_size(
    value: Any,
    frame_style: str = "auto",
    orientation: str | None = None,
) -> float:
    resolved_style = resolve_gallery_frame_style(frame_style, orientation)
    default_size = GALLERY_DEFAULT_SIZE_BY_STYLE[resolved_style]
    max_size = GALLERY_MAX_SIZE_BY_STYLE[resolved_style]

    try:
        size = float(value)
    except (TypeError, ValueError):
        return default_size

    if size <= 0:
        return default_size

    return round(min(max_size, max(GALLERY_MIN_SIZE, size)), 3)


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

    if orientation in SUPPORTED_ORIENTATIONS:
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

    if frame_style in SUPPORTED_FRAME_STYLES:
        return frame_style

    return "auto"


# Cleans an object-position value used by CSS crop controls.
def normalize_object_position(value: Any, fallback: str = "50% 50%") -> str:
    position = clean_string(value)

    if POSITION_PATTERN.match(position):
        return position

    return fallback


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

    for optional_field in ["thumbSrc", "textureSrc", "fullSrc"]:
        value = clean_string(raw_image.get(optional_field))

        if value:
            image[optional_field] = value

    image["thumbnailPosition"] = normalize_object_position(raw_image.get("thumbnailPosition"))
    image["heroPosition"] = normalize_object_position(raw_image.get("heroPosition"))
    image["galleryPosition"] = normalize_object_position(raw_image.get("galleryPosition"))

    gallery_frame_style = normalize_frame_style(raw_image.get("galleryFrameStyle"))

    image["heroFrameStyle"] = normalize_frame_style(raw_image.get("heroFrameStyle"))
    image["heroFitMode"] = normalize_hero_fit_mode(raw_image.get("heroFitMode"))
    image["galleryFitMode"] = normalize_gallery_fit_mode(raw_image.get("galleryFitMode"))
    image["galleryFrameStyle"] = gallery_frame_style
    image["gallerySize"] = clean_gallery_size(
        raw_image.get("gallerySize"),
        gallery_frame_style,
        orientation,
    )

    return image


# Returns True when an image is eligible for the fixed 16:9 homepage hero.
def is_landscape_hero_image(image: dict[str, Any] | None) -> bool:
    if not image:
        return False

    orientation = clean_string(image.get("imageOrientation"))

    if orientation in SUPPORTED_ORIENTATIONS:
        return orientation == "landscape"

    aspect_ratio = clean_positive_float(image.get("imageAspectRatio"))

    if aspect_ratio:
        return aspect_ratio > 1

    width = clean_positive_int(image.get("imageWidth"))
    height = clean_positive_int(image.get("imageHeight"))

    if width and height:
        return width > height

    return True


def filter_hero_slides_for_landscape_images(
    hero_slides: list[dict[str, str]],
    images: list[dict[str, Any]],
) -> list[dict[str, str]]:
    images_by_id = {image["id"]: image for image in images}

    return [
        slide
        for slide in hero_slides
        if is_landscape_hero_image(images_by_id.get(slide.get("imageId", "")))
    ]


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


# Validates the normalized data before it is allowed to overwrite source JSON.
def validate_project_data(
    categories: list[dict[str, str]],
    images: list[dict[str, Any]],
    hero_slides: list[dict[str, str]],
) -> None:
    if not categories:
        raise DataValidationError("At least one category is required.")

    category_ids = [category.get("id", "") for category in categories]
    duplicate_category_ids = sorted({category_id for category_id in category_ids if category_ids.count(category_id) > 1})

    if duplicate_category_ids:
        raise DataValidationError(f"Duplicate category IDs: {', '.join(duplicate_category_ids)}")

    for category in categories:
        if not category.get("id") or not category.get("label"):
            raise DataValidationError("Every category needs both an ID and a label.")

    valid_category_ids = set(category_ids)
    image_ids = [image.get("id", "") for image in images]
    duplicate_image_ids = sorted({image_id for image_id in image_ids if image_ids.count(image_id) > 1})

    if duplicate_image_ids:
        raise DataValidationError(f"Duplicate image IDs: {', '.join(duplicate_image_ids)}")

    for image in images:
        image_id = clean_string(image.get("id")) or "unknown image"

        if not clean_string(image.get("id")):
            raise DataValidationError("Every image needs a non-empty ID.")

        if not clean_string(image.get("title")):
            raise DataValidationError(f"Image '{image_id}' needs a title.")

        if image.get("category") not in valid_category_ids:
            raise DataValidationError(f"Image '{image_id}' has an invalid category.")

        if not clean_string(image.get("src")):
            raise DataValidationError(f"Image '{image_id}' needs a source path.")

        if not clean_string(image.get("alt")):
            raise DataValidationError(f"Image '{image_id}' needs alt text.")

        if image.get("heroFitMode") not in SUPPORTED_FIT_MODES:
            raise DataValidationError(f"Image '{image_id}' has an invalid hero fit mode.")

        if image.get("galleryFitMode") not in SUPPORTED_FIT_MODES:
            raise DataValidationError(f"Image '{image_id}' has an invalid gallery fit mode.")

        if image.get("heroFrameStyle") not in SUPPORTED_FRAME_STYLES:
            raise DataValidationError(f"Image '{image_id}' has an invalid hero frame style.")

        if image.get("galleryFrameStyle") not in SUPPORTED_FRAME_STYLES:
            raise DataValidationError(f"Image '{image_id}' has an invalid gallery frame style.")

    valid_image_ids = set(image_ids)
    images_by_id = {image["id"]: image for image in images}

    for slide in hero_slides:
        if slide.get("imageId") not in valid_image_ids:
            raise DataValidationError(f"Hero slide references a missing image: {slide.get('imageId')}")

        if slide.get("targetCategory") not in valid_category_ids:
            raise DataValidationError(f"Hero slide for '{slide.get('imageId')}' has an invalid target category.")

        if not is_landscape_hero_image(images_by_id.get(slide.get("imageId", ""))):
            raise DataValidationError(f"Hero slide must use a landscape image: {slide.get('imageId')}")


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

    hero_slides = [slide for slide in hero_slides if slide["imageId"] in image_ids]
    hero_slides = filter_hero_slides_for_landscape_images(hero_slides, images)

    validate_project_data(categories, images, hero_slides)

    return categories, images, hero_slides


# Writes all three source JSON files after validation and backup creation.
def save_project_data(
    categories: list[dict[str, str]],
    images: list[dict[str, Any]],
    hero_slides: list[dict[str, str]],
    backup_reason: str,
) -> dict[str, Any]:
    validate_project_data(categories, images, hero_slides)
    backup = create_data_backup(backup_reason)

    write_json(CATEGORIES_PATH, categories)
    write_json(GALLERY_IMAGES_PATH, images)
    write_json(HERO_SLIDES_PATH, hero_slides)

    return backup


# Saves the entire editor state after normalizing categories, images, and hero slides.
def save_full_data(
    raw_categories: list[Any],
    raw_images: list[Any],
    raw_hero_slides: list[Any],
) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]], dict[str, Any]]:
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
    hero_slides = [slide for slide in hero_slides if slide["imageId"] in image_ids]
    hero_slides = filter_hero_slides_for_landscape_images(hero_slides, images)

    backup = save_project_data(categories, images, hero_slides, "full-editor-save")

    return categories, images, hero_slides, backup


# Fields that can be updated by crop pages without rewriting the entire image list.
DIRECT_IMAGE_UPDATE_FIELDS = {
    "thumbnailPosition",
    "heroPosition",
    "galleryPosition",
    "galleryFitMode",
    "galleryFrameStyle",
    "gallerySize",
}


# Cleans the limited set of fields that can be saved from crop pages.
def normalize_direct_image_updates(raw_updates: dict[str, Any]) -> dict[str, Any]:
    updates: dict[str, Any] = {}

    if "thumbnailPosition" in raw_updates:
        updates["thumbnailPosition"] = normalize_object_position(raw_updates.get("thumbnailPosition"))

    if "heroPosition" in raw_updates:
        updates["heroPosition"] = normalize_object_position(raw_updates.get("heroPosition"))

    if "galleryPosition" in raw_updates:
        updates["galleryPosition"] = normalize_object_position(raw_updates.get("galleryPosition"))


    if "galleryFitMode" in raw_updates:
        updates["galleryFitMode"] = normalize_gallery_fit_mode(raw_updates.get("galleryFitMode"))

    if "galleryFrameStyle" in raw_updates:
        updates["galleryFrameStyle"] = normalize_frame_style(raw_updates.get("galleryFrameStyle"))

    if "gallerySize" in raw_updates:
        # Context-aware clamping happens in normalize_image after this value is
        # merged with the existing image orientation and frame style.
        updates["gallerySize"] = raw_updates.get("gallerySize")

    return updates


# Updates one image record without rewriting data from hidden editor pages.
def save_image_updates(
    image_id: str,
    raw_updates: dict[str, Any],
) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]], dict[str, Any], dict[str, Any]]:
    """Update one image record and persist the normalized JSON files.

    Crop pages use this function so a hero or gallery framing save only touches
    the selected image. This prevents hidden editor pages from overwriting data
    the user did not intend to edit.
    """

    categories, images, hero_slides = get_current_data()
    updates = normalize_direct_image_updates(raw_updates)
    valid_category_ids = {category["id"] for category in categories}
    fallback_category_id = categories[0]["id"] if categories else "personal"

    for index, image in enumerate(images):
        if image.get("id") != image_id:
            continue

        updated_image = {**image, **updates}
        images[index] = normalize_image(updated_image, valid_category_ids, fallback_category_id)
        backup = save_project_data(categories, images, hero_slides, "single-image-framing-save")

        return categories, images, hero_slides, images[index], backup

    raise ValueError(f"Image not found: {image_id}")
