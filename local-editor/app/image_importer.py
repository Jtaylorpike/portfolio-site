"""Import reviewed images and create portfolio rendition files.

The local editor lets the user choose image files, review metadata, and then save
those files into the portfolio. This module handles the backend side: it stores
the uploaded source temporarily, creates the standard WebP renditions, creates
the image JSON record, validates the final data set, and creates a backup before
the JSON files are changed.

The active image architecture is rendition-based, not category-folder-based:

/images/portfolio/full/<image-id>.webp
/images/portfolio/display/<image-id>.webp
/images/portfolio/texture/<image-id>.webp
/images/portfolio/thumb/<image-id>.webp
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from flask import Request
from PIL import Image, ImageOps
from werkzeug.utils import secure_filename

from .data_store import (
    DataValidationError,
    PUBLIC_DIR,
    get_current_data,
    normalize_categories,
    save_project_data,
)
from .utils import clean_string, make_unique_value, slugify, title_from_filename


PORTFOLIO_IMAGES_DIR = PUBLIC_DIR / "images" / "portfolio"
SOURCE_IMPORT_DIR = Path(__file__).resolve().parents[2] / "source-images" / "editor-imports"

ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}

RENDITION_CONFIGS = {
    "thumb": {
        "field": "thumbSrc",
        "folder": "thumb",
        "max_width": 520,
        "quality": 74,
    },
    "display": {
        "field": "src",
        "folder": "display",
        "max_width": 1600,
        "quality": 84,
    },
    "texture": {
        "field": "textureSrc",
        "folder": "texture",
        "max_width": 1024,
        "quality": 78,
    },
    "full": {
        "field": "fullSrc",
        "folder": "full",
        "max_width": 2400,
        "quality": 88,
    },
}

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
IMAGE_ID_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def get_public_url_for_file(path: Path) -> str:
    """Convert an absolute file path under public/ into a site URL."""

    relative_path = path.relative_to(PUBLIC_DIR).as_posix()

    return f"/{relative_path}"


def is_allowed_image_file(filename: str) -> bool:
    """Allow only image formats the importer knows how to process safely."""

    extension = Path(filename).suffix.lower()

    return extension in ALLOWED_IMAGE_EXTENSIONS


def get_resampling_filter():
    try:
        return Image.Resampling.LANCZOS
    except AttributeError:
        return Image.LANCZOS


def prepare_image_for_webp(image: Image.Image) -> Image.Image:
    """Apply EXIF rotation and convert into a WebP-friendly color mode."""

    image = ImageOps.exif_transpose(image)

    if image.mode in ("RGBA", "LA"):
        return image.convert("RGBA")

    return image.convert("RGB")


def resize_image(image: Image.Image, max_width: int) -> Image.Image:
    if image.width <= max_width:
        return image.copy()

    ratio = max_width / image.width
    new_height = round(image.height * ratio)

    return image.resize((max_width, new_height), get_resampling_filter())


def save_webp_version(
    source_path: Path,
    destination_path: Path,
    max_width: int,
    quality: int,
) -> None:
    """Create one optimized WebP copy for a given rendition."""

    destination_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source_path) as image:
        prepared_image = prepare_image_for_webp(image)
        resized_image = resize_image(prepared_image, max_width)

        resized_image.save(
            destination_path,
            "WEBP",
            quality=quality,
            method=6,
            optimize=True,
        )


def get_image_metadata(source_path: Path) -> dict[str, Any]:
    """Read dimensions so the editor can infer orientation behavior."""

    with Image.open(source_path) as image:
        image = ImageOps.exif_transpose(image)
        width = int(image.width)
        height = int(image.height)
        aspect_ratio = round(width / height, 6)

    if abs(aspect_ratio - 1) <= 0.04:
        orientation = "square"
    elif aspect_ratio > 1:
        orientation = "landscape"
    else:
        orientation = "portrait"

    return {
        "imageWidth": width,
        "imageHeight": height,
        "imageAspectRatio": aspect_ratio,
        "imageOrientation": orientation,
    }


def make_source_path(file_stem: str, extension: str) -> Path:
    return SOURCE_IMPORT_DIR / f"{file_stem}{extension}"


def make_rendition_paths(image_id: str) -> dict[str, Path]:
    return {
        rendition_name: PORTFOLIO_IMAGES_DIR / str(config["folder"]) / f"{image_id}.webp"
        for rendition_name, config in RENDITION_CONFIGS.items()
    }


def get_used_file_stems(images: list[dict[str, Any]]) -> set[str]:
    used_file_stems: set[str] = set()

    for image in images:
        image_id = clean_string(image.get("id"))

        if image_id:
            used_file_stems.add(image_id)

        for field in ["src", "thumbSrc", "textureSrc", "fullSrc"]:
            value = clean_string(image.get(field, ""))

            if value:
                used_file_stems.add(Path(value).stem)

    return used_file_stems


def normalize_position(value: Any) -> str:
    position = clean_string(value)

    if not position:
        return "50% 50%"

    return position


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


def resolve_gallery_frame_style(frame_style: str, orientation: str | None) -> str:
    if frame_style in {"landscape", "portrait", "square"}:
        return frame_style

    if orientation in {"portrait", "square"}:
        return orientation

    return "landscape"


def normalize_gallery_size(
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


def save_all_renditions(source_path: Path, rendition_paths: dict[str, Path]) -> dict[str, str]:
    urls: dict[str, str] = {}

    for rendition_name, config in RENDITION_CONFIGS.items():
        destination_path = rendition_paths[rendition_name]

        save_webp_version(
            source_path,
            destination_path,
            int(config["max_width"]),
            int(config["quality"]),
        )

        urls[str(config["field"])] = get_public_url_for_file(destination_path)

    return urls


def get_rendition_collision_names(image_id: str) -> list[str]:
    """Return existing rendition folders that would be overwritten by this ID."""

    collisions: list[str] = []

    for rendition_name, path in make_rendition_paths(image_id).items():
        if path.exists():
            collisions.append(rendition_name)

    return collisions


def get_review_record_label(record: dict[str, Any], index: int) -> str:
    """Build a readable label for import validation errors."""

    return clean_string(record.get("title")) or clean_string(record.get("id")) or f"Import item {index + 1}"


def validate_import_preflight(
    uploaded_files: list[Any],
    records: list[Any],
    existing_images: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[str]]:
    """Validate all reviewed records before any file is written to disk.

    The earlier importer silently uniqued colliding IDs. That was safe from an
    overwrite standpoint, but it made the final saved ID differ from the ID the
    editor showed during review. Preflight keeps the import atomic and forces the
    user to resolve ID/file collisions intentionally before the backend writes
    source images, renditions, or JSON.
    """

    existing_ids = {clean_string(image.get("id")) for image in existing_images if clean_string(image.get("id"))}
    seen_ids: set[str] = set()
    errors: list[str] = []
    normalized_records: list[dict[str, Any]] = []

    for index, (uploaded_file, raw_record) in enumerate(zip(uploaded_files, records)):
        if not isinstance(raw_record, dict):
            errors.append(f"Import item {index + 1}: metadata record was not an object.")
            continue

        original_filename = secure_filename(uploaded_file.filename or "")
        label = get_review_record_label(raw_record, index)

        if not original_filename:
            errors.append(f"{label}: uploaded file was missing a filename.")
            continue

        if not is_allowed_image_file(original_filename):
            errors.append(f"{label}: {original_filename} is not a supported image file. Use JPG, PNG, or WebP.")
            continue

        raw_id = clean_string(raw_record.get("id"))
        image_id = slugify(raw_id)

        if not raw_id:
            errors.append(f"{label}: image ID is required.")
            continue

        if raw_id != image_id or not IMAGE_ID_PATTERN.match(image_id):
            errors.append(f"{label}: image ID must use lowercase letters, numbers, and single hyphens only.")
            continue

        if image_id in seen_ids:
            errors.append(f"{label}: image ID '{image_id}' is duplicated in this import review.")
            continue

        if image_id in existing_ids:
            errors.append(f"{label}: image ID '{image_id}' already exists in galleryImages.json.")
            continue

        rendition_collisions = get_rendition_collision_names(image_id)

        if rendition_collisions:
            collision_list = ", ".join(rendition_collisions)
            errors.append(
                f"{label}: image ID '{image_id}' would overwrite existing rendition file(s) in {collision_list}. "
                "Choose a different ID or clean up the old files first."
            )
            continue

        seen_ids.add(image_id)
        normalized_records.append({**raw_record, "id": image_id, "originalFilename": original_filename})

    return normalized_records, errors


def import_reviewed_images_from_request(request: Request) -> tuple[dict[str, Any], int]:
    """Validate reviewed uploads, create renditions, update JSON, and create a backup."""

    categories, images, hero_slides = get_current_data()

    uploaded_files = request.files.getlist("images")
    records_raw = clean_string(request.form.get("records"))
    categories_raw = clean_string(request.form.get("categories"))

    if not uploaded_files:
        return {"error": "No image files were uploaded."}, 400

    try:
        records = json.loads(records_raw)
    except json.JSONDecodeError:
        return {"error": "Import records were not valid JSON."}, 400

    if not isinstance(records, list):
        return {"error": "Import records must be a list."}, 400

    if len(records) != len(uploaded_files):
        return {"error": "Import record count did not match file count."}, 400

    if categories_raw:
        try:
            reviewed_categories = json.loads(categories_raw)
        except json.JSONDecodeError:
            return {"error": "Import categories were not valid JSON."}, 400

        if not isinstance(reviewed_categories, list):
            return {"error": "Import categories must be a list."}, 400

        categories = normalize_categories(reviewed_categories)

    valid_category_ids = {category["id"] for category in categories}
    fallback_category_id = categories[0]["id"]

    normalized_records, preflight_errors = validate_import_preflight(uploaded_files, records, images)

    if preflight_errors:
        return {
            "error": "Import review has issues that must be fixed before files are written.",
            "errors": preflight_errors,
        }, 400

    used_file_stems = get_used_file_stems(images)

    imported_images: list[dict[str, Any]] = []
    skipped_files: list[str] = []
    created_source_paths: list[Path] = []
    created_rendition_paths: list[Path] = []

    try:
        for uploaded_file, raw_record in zip(uploaded_files, normalized_records):
            original_filename = clean_string(raw_record.get("originalFilename"))
            category = clean_string(raw_record.get("category"))

            if category not in valid_category_ids:
                category = fallback_category_id

            extension = Path(original_filename).suffix.lower()
            image_id = clean_string(raw_record.get("id"))

            source_stem = make_unique_value(image_id, used_file_stems)
            used_file_stems.add(source_stem)

            source_path = make_source_path(source_stem, extension)
            source_path.parent.mkdir(parents=True, exist_ok=True)
            uploaded_file.save(source_path)
            created_source_paths.append(source_path)

            rendition_paths = make_rendition_paths(image_id)

            try:
                image_metadata = get_image_metadata(source_path)
                rendition_urls = save_all_renditions(source_path, rendition_paths)
                created_rendition_paths.extend(rendition_paths.values())

            except Exception as error:
                raise RuntimeError(f"Could not optimize {original_filename}: {error}") from error

            title = clean_string(raw_record.get("title")) or title_from_filename(original_filename)
            alt = clean_string(raw_record.get("alt")) or f"Photograph by Taylor Pike: {title}"

            gallery_frame_style = normalize_frame_style(raw_record.get("galleryFrameStyle"))
            gallery_orientation = image_metadata.get("imageOrientation")

            image_record: dict[str, Any] = {
                "id": image_id,
                "title": title,
                "category": category,
                "year": clean_string(raw_record.get("year")),
                "location": clean_string(raw_record.get("location")),
                "note": clean_string(raw_record.get("note")),
                "src": rendition_urls["src"],
                "thumbSrc": rendition_urls["thumbSrc"],
                "textureSrc": rendition_urls["textureSrc"],
                "thumbnailPosition": normalize_position(raw_record.get("thumbnailPosition")),
                "heroPosition": normalize_position(raw_record.get("heroPosition")),
                "heroFrameStyle": normalize_frame_style(raw_record.get("heroFrameStyle")),
                "heroFitMode": normalize_hero_fit_mode(raw_record.get("heroFitMode")),
                "galleryPosition": normalize_position(raw_record.get("galleryPosition")),
                "galleryFitMode": normalize_gallery_fit_mode(raw_record.get("galleryFitMode")),
                "galleryFrameStyle": gallery_frame_style,
                "gallerySize": normalize_gallery_size(
                    raw_record.get("gallerySize"),
                    gallery_frame_style,
                    gallery_orientation,
                ),
                "alt": alt,
                "fullSrc": rendition_urls["fullSrc"],
            }

            for key, value in image_metadata.items():
                if value:
                    image_record[key] = value

            images.append(image_record)
            imported_images.append(image_record)

        if not imported_images:
            return {"error": "No valid image files were imported."}, 400

        backup = save_project_data(categories, images, hero_slides, "image-import")

    except (DataValidationError, RuntimeError) as error:
        for path in created_rendition_paths:
            if path.exists():
                path.unlink()

        for path in created_source_paths:
            if path.exists():
                path.unlink()

        return {"error": str(error)}, 400

    return {
        "ok": True,
        "categories": categories,
        "images": images,
        "heroSlides": hero_slides,
        "importedImages": imported_images,
        "skippedFiles": skipped_files,
        "backup": backup,
    }, 200
