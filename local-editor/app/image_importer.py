"""Import reviewed images and create optimized web versions.

The local editor lets the user choose image files, review metadata, and then save
those files into the portfolio. This module handles the backend side: it copies
the original file, creates smaller WebP versions for different parts of the
site, creates the image JSON record, validates the final data set, and creates a
backup before the JSON files are changed.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from flask import Request
from PIL import Image, ImageOps
from werkzeug.utils import secure_filename

from .data_store import (
    DataValidationError,
    PUBLIC_DIR,
    get_current_data,
    save_project_data,
)
from .utils import clean_string, make_unique_value, slugify, title_from_filename


IMPORTED_IMAGES_DIR = PUBLIC_DIR / "images" / "imported"

ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}

THUMB_MAX_WIDTH = 700
OPTIMIZED_MAX_WIDTH = 1600
TEXTURE_MAX_WIDTH = 1400
FULL_MAX_WIDTH = 2400

THUMB_WEBP_QUALITY = 76
OPTIMIZED_WEBP_QUALITY = 82
TEXTURE_WEBP_QUALITY = 80
FULL_WEBP_QUALITY = 88

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


# Converts an absolute file path under public/ into the URL used by the site.
def get_public_url_for_file(path: Path) -> str:
    relative_path = path.relative_to(PUBLIC_DIR).as_posix()

    return f"/{relative_path}"


# Allows only image formats the importer knows how to process safely.
def is_allowed_image_file(filename: str) -> bool:
    extension = Path(filename).suffix.lower()

    return extension in ALLOWED_IMAGE_EXTENSIONS


def get_resampling_filter():
    try:
        return Image.Resampling.LANCZOS
    except AttributeError:
        return Image.LANCZOS


# Applies EXIF rotation and converts the image into a WebP-friendly color mode.
def prepare_image_for_webp(image: Image.Image) -> Image.Image:
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


# Creates one optimized WebP copy for thumbnails, site display, texture loading, or fullscreen use.
def save_webp_version(
    source_path: Path,
    destination_path: Path,
    max_width: int,
    quality: int,
) -> None:
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


# Reads image dimensions so the editor can infer portrait, landscape, or square behavior.
def get_image_metadata(source_path: Path) -> dict[str, Any]:
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


def make_import_paths(category: str, file_stem: str, extension: str) -> dict[str, Path]:
    category_dir = IMPORTED_IMAGES_DIR / category

    return {
        "original": category_dir / "original" / f"{file_stem}{extension}",
        "thumb": category_dir / "thumb" / f"{file_stem}.webp",
        "optimized": category_dir / "optimized" / f"{file_stem}.webp",
        "texture": category_dir / "texture" / f"{file_stem}.webp",
        "full": category_dir / "full" / f"{file_stem}.webp",
    }


def get_used_file_stems(images: list[dict[str, Any]]) -> set[str]:
    used_file_stems: set[str] = set()

    for image in images:
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


# Main import endpoint worker: validates the upload, writes image files, updates JSON, and creates a backup.
def import_reviewed_images_from_request(request: Request) -> tuple[dict[str, Any], int]:
    categories, images, hero_slides = get_current_data()

    valid_category_ids = {category["id"] for category in categories}
    fallback_category_id = categories[0]["id"]

    uploaded_files = request.files.getlist("images")
    records_raw = clean_string(request.form.get("records"))

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

    used_image_ids = {image["id"] for image in images}
    used_file_stems = get_used_file_stems(images)

    imported_images: list[dict[str, Any]] = []
    skipped_files: list[str] = []

    for uploaded_file, raw_record in zip(uploaded_files, records):
        if not isinstance(raw_record, dict):
            continue

        original_filename = secure_filename(uploaded_file.filename or "")

        if not original_filename:
            continue

        if not is_allowed_image_file(original_filename):
            skipped_files.append(original_filename)
            continue

        category = clean_string(raw_record.get("category"))

        if category not in valid_category_ids:
            category = fallback_category_id

        extension = Path(original_filename).suffix.lower()
        original_stem = Path(original_filename).stem
        clean_stem = slugify(original_stem)

        file_stem = make_unique_value(clean_stem, used_file_stems)
        import_paths = make_import_paths(category, file_stem, extension)

        for path in import_paths.values():
            path.parent.mkdir(parents=True, exist_ok=True)

        uploaded_file.save(import_paths["original"])

        try:
            image_metadata = get_image_metadata(import_paths["original"])

            save_webp_version(
                import_paths["original"],
                import_paths["thumb"],
                THUMB_MAX_WIDTH,
                THUMB_WEBP_QUALITY,
            )

            save_webp_version(
                import_paths["original"],
                import_paths["optimized"],
                OPTIMIZED_MAX_WIDTH,
                OPTIMIZED_WEBP_QUALITY,
            )

            save_webp_version(
                import_paths["original"],
                import_paths["texture"],
                TEXTURE_MAX_WIDTH,
                TEXTURE_WEBP_QUALITY,
            )

            save_webp_version(
                import_paths["original"],
                import_paths["full"],
                FULL_MAX_WIDTH,
                FULL_WEBP_QUALITY,
            )

            thumb_url = get_public_url_for_file(import_paths["thumb"])
            src_url = get_public_url_for_file(import_paths["optimized"])
            texture_url = get_public_url_for_file(import_paths["texture"])
            full_src_url = get_public_url_for_file(import_paths["full"])

        except Exception as error:
            print(f"Could not optimize {original_filename}: {error}")

            fallback_url = get_public_url_for_file(import_paths["original"])
            thumb_url = fallback_url
            src_url = fallback_url
            texture_url = fallback_url
            full_src_url = fallback_url

            image_metadata = {
                "imageWidth": None,
                "imageHeight": None,
                "imageAspectRatio": None,
                "imageOrientation": None,
            }

        requested_id = slugify(clean_string(raw_record.get("id")) or f"{category}-{file_stem}")
        image_id = make_unique_value(requested_id, used_image_ids)
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
            "src": src_url,
            "thumbSrc": thumb_url,
            "textureSrc": texture_url,
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
            "fullSrc": full_src_url,
        }

        for key, value in image_metadata.items():
            if value:
                image_record[key] = value

        images.append(image_record)
        imported_images.append(image_record)

    if not imported_images:
        return {"error": "No valid image files were imported."}, 400

    try:
        backup = save_project_data(categories, images, hero_slides, "image-import")
    except DataValidationError as error:
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
