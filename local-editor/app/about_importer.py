"""Import reviewed About/contact page images into separate About folders.

About-page images intentionally do not use the portfolio rendition folders. This
keeps personal/About imagery out of galleryImages.json and out of
public/images/portfolio/ while still giving the local editor a simple import
workflow for the About page.
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
    ABOUT_PHOTOS_PATH,
    DataValidationError,
    PUBLIC_DIR,
    create_data_backup,
    get_current_about_photos,
    normalize_about_photos,
    write_json,
)
from .utils import clean_string, slugify, title_from_filename


ABOUT_IMAGES_DIR = PUBLIC_DIR / "images" / "about"
SOURCE_IMPORT_DIR = Path(__file__).resolve().parents[2] / "source-images" / "about-editor-imports"

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
IMAGE_ID_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ABOUT_PHOTO_PLACEMENT_ROLES = {"upper-collage", "lower-collage", "background-float", "unused"}

ABOUT_RENDITION_CONFIGS = {
    "thumb": {"field": "thumbSrc", "folder": "thumb", "max_width": 560, "quality": 76},
    "display": {"field": "src", "folder": "display", "max_width": 1600, "quality": 84},
    "full": {"field": "fullSrc", "folder": "full", "max_width": 2400, "quality": 88},
}


def get_resampling_filter():
    try:
        return Image.Resampling.LANCZOS
    except AttributeError:
        return Image.LANCZOS


def is_allowed_image_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_IMAGE_EXTENSIONS


def prepare_image_for_webp(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)

    if image.mode in ("RGBA", "LA"):
        return image.convert("RGBA")

    return image.convert("RGB")


def resize_image(image: Image.Image, max_width: int) -> Image.Image:
    if image.width <= max_width:
        return image.copy()

    ratio = max_width / image.width
    return image.resize((max_width, round(image.height * ratio)), get_resampling_filter())


def save_webp_version(source_path: Path, destination_path: Path, max_width: int, quality: int) -> None:
    destination_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source_path) as image:
      prepared_image = prepare_image_for_webp(image)
      resized_image = resize_image(prepared_image, max_width)
      resized_image.save(destination_path, "WEBP", quality=quality, method=6, optimize=True)


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


def make_source_path(file_stem: str, extension: str) -> Path:
    safe_stem = secure_filename(file_stem) or "about-photo"
    return SOURCE_IMPORT_DIR / f"{safe_stem}{extension}"


def make_rendition_paths(image_id: str) -> dict[str, Path]:
    return {
        rendition_name: ABOUT_IMAGES_DIR / str(config["folder"]) / f"{image_id}.webp"
        for rendition_name, config in ABOUT_RENDITION_CONFIGS.items()
    }


def get_public_url_for_file(path: Path) -> str:
    return f"/{path.relative_to(PUBLIC_DIR).as_posix()}"


def save_all_renditions(source_path: Path, rendition_paths: dict[str, Path]) -> dict[str, str]:
    urls: dict[str, str] = {}

    for rendition_name, config in ABOUT_RENDITION_CONFIGS.items():
        destination_path = rendition_paths[rendition_name]
        save_webp_version(source_path, destination_path, int(config["max_width"]), int(config["quality"]))
        urls[str(config["field"])] = get_public_url_for_file(destination_path)

    return urls


def get_used_file_stems(about_photos: list[dict[str, Any]]) -> set[str]:
    used: set[str] = set()

    for photo in about_photos:
        photo_id = clean_string(photo.get("id"))

        if photo_id:
            used.add(photo_id)

        for field in ["src", "thumbSrc", "fullSrc"]:
            value = clean_string(photo.get(field))

            if value:
                used.add(Path(value).stem)

    return used


def make_unique_stem(base_stem: str, used_stems: set[str]) -> str:
    stem = slugify(base_stem) or "about-photo"
    candidate = stem
    suffix = 2

    while candidate in used_stems:
        candidate = f"{stem}-{suffix}"
        suffix += 1

    used_stems.add(candidate)
    return candidate


def record_label(record: dict[str, Any], fallback_index: int) -> str:
    return clean_string(record.get("originalFilename")) or clean_string(record.get("title")) or f"photo {fallback_index}"


def validate_about_import_preflight(uploaded_files: list[Any], records: list[Any], existing_about_photos: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[str]]:
    errors: list[str] = []
    normalized_records: list[dict[str, Any]] = []
    existing_ids = {clean_string(photo.get("id")) for photo in existing_about_photos if clean_string(photo.get("id"))}
    next_ids: set[str] = set()

    for index, (uploaded_file, raw_record) in enumerate(zip(uploaded_files, records), start=1):
        record = raw_record if isinstance(raw_record, dict) else {}
        original_filename = clean_string(record.get("originalFilename")) or clean_string(getattr(uploaded_file, "filename", ""))
        label = record_label(record, index)
        extension = Path(original_filename).suffix.lower()
        image_id = slugify(clean_string(record.get("id")) or Path(original_filename).stem)
        placement_role = clean_string(record.get("placementRole")) or "lower-collage"

        if placement_role not in ABOUT_PHOTO_PLACEMENT_ROLES:
            errors.append(f"{label}: About placement must be upper-collage, lower-collage, background-float, or unused.")
            placement_role = "lower-collage"

        if not original_filename:
            errors.append(f"{label}: missing original filename.")

        if not is_allowed_image_file(original_filename):
            errors.append(f"{label}: unsupported file type. Use JPG, PNG, or WebP.")

        if not image_id or not IMAGE_ID_PATTERN.fullmatch(image_id):
            errors.append(f"{label}: image ID must use lowercase letters, numbers, and hyphens only.")

        if image_id in existing_ids:
            errors.append(f"{label}: About photo ID '{image_id}' already exists.")

        if image_id in next_ids:
            errors.append(f"{label}: About photo ID '{image_id}' is duplicated in this import review.")

        next_ids.add(image_id)

        for path in make_rendition_paths(image_id).values():
            if path.exists():
                errors.append(f"{label}: output file already exists at {path.relative_to(PUBLIC_DIR).as_posix()}.")

        normalized_records.append({
            "id": image_id,
            "title": clean_string(record.get("title")) or title_from_filename(original_filename),
            "year": clean_string(record.get("year")),
            "location": clean_string(record.get("location")),
            "note": clean_string(record.get("note")),
            "alt": clean_string(record.get("alt")),
            "originalFilename": original_filename,
            "placementRole": placement_role,
            "isActive": record.get("isActive") is not False,
        })

    return normalized_records, errors


def import_reviewed_about_photos_from_request(request: Request) -> tuple[dict[str, Any], int]:
    """Validate reviewed uploads, create About renditions, update aboutPhotos.json."""

    about_photos = get_current_about_photos()
    uploaded_files = request.files.getlist("images")
    records_raw = clean_string(request.form.get("records"))

    if not uploaded_files:
        return {"error": "No About image files were uploaded."}, 400

    try:
        records = json.loads(records_raw)
    except json.JSONDecodeError:
        return {"error": "About import records were not valid JSON."}, 400

    if not isinstance(records, list):
        return {"error": "About import records must be a list."}, 400

    if len(records) != len(uploaded_files):
        return {"error": "About import record count did not match file count."}, 400

    normalized_records, preflight_errors = validate_about_import_preflight(uploaded_files, records, about_photos)

    if preflight_errors:
        return {
            "error": "About import review has issues that must be fixed before files are written.",
            "errors": preflight_errors,
        }, 400

    used_file_stems = get_used_file_stems(about_photos)
    imported_about_photos: list[dict[str, Any]] = []
    created_source_paths: list[Path] = []
    created_rendition_paths: list[Path] = []

    try:
        for uploaded_file, record in zip(uploaded_files, normalized_records):
            original_filename = clean_string(record.get("originalFilename"))
            extension = Path(original_filename).suffix.lower()
            image_id = clean_string(record.get("id"))
            source_stem = make_unique_stem(image_id, used_file_stems)
            source_path = make_source_path(source_stem, extension)
            source_path.parent.mkdir(parents=True, exist_ok=True)
            uploaded_file.save(source_path)
            created_source_paths.append(source_path)

            rendition_paths = make_rendition_paths(image_id)
            metadata = get_image_metadata(source_path)
            rendition_urls = save_all_renditions(source_path, rendition_paths)
            created_rendition_paths.extend(rendition_paths.values())

            title = clean_string(record.get("title")) or title_from_filename(original_filename)
            alt = clean_string(record.get("alt")) or f"About page photograph by Taylor Pike: {title}"

            about_record: dict[str, Any] = {
                "id": image_id,
                "title": title,
                "year": clean_string(record.get("year")),
                "location": clean_string(record.get("location")),
                "note": clean_string(record.get("note")),
                "src": rendition_urls["src"],
                "thumbSrc": rendition_urls["thumbSrc"],
                "fullSrc": rendition_urls["fullSrc"],
                "alt": alt,
                "placementRole": clean_string(record.get("placementRole")) or "lower-collage",
                "sourceType": "about",
            }

            if record.get("isActive") is False:
                about_record["isActive"] = False

            about_record.update(metadata)
            about_photos.append(about_record)
            imported_about_photos.append(about_record)

        if not imported_about_photos:
            return {"error": "No About photos were imported."}, 400

        about_photos = normalize_about_photos(about_photos)
        backup = create_data_backup("about-photo-import")
        write_json(ABOUT_PHOTOS_PATH, about_photos)

    except (DataValidationError, RuntimeError, OSError) as error:
        for path in created_rendition_paths:
            if path.exists():
                path.unlink()

        for path in created_source_paths:
            if path.exists():
                path.unlink()

        return {"error": str(error)}, 400

    return {
        "ok": True,
        "aboutPhotos": about_photos,
        "importedAboutPhotos": imported_about_photos,
        "backup": backup,
    }, 200
