from __future__ import annotations

import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = PROJECT_ROOT / "public"
GALLERY_IMAGES_PATH = PROJECT_ROOT / "src" / "data" / "galleryImages.json"

THUMB_MAX_WIDTH = 700
OPTIMIZED_MAX_WIDTH = 1600
TEXTURE_MAX_WIDTH = 1400
FULL_MAX_WIDTH = 2400

THUMB_WEBP_QUALITY = 76
OPTIMIZED_WEBP_QUALITY = 82
TEXTURE_WEBP_QUALITY = 80
FULL_WEBP_QUALITY = 88


def read_json(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path: Path, data: Any) -> None:
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def url_to_public_path(url: str) -> Path:
    clean_url = url.lstrip("/")
    return PUBLIC_DIR / clean_url.removeprefix("public/")


def public_path_to_url(path: Path) -> str:
    return "/" + path.relative_to(PUBLIC_DIR).as_posix()


def get_resampling_filter():
    try:
        return Image.Resampling.LANCZOS
    except AttributeError:
        return Image.LANCZOS


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


def should_skip_image(image: dict[str, Any]) -> bool:
    src = str(image.get("src", ""))

    return not src.startswith("/images/imported/")


def get_source_path(image: dict[str, Any]) -> Path | None:
    candidates = [
        str(image.get("fullSrc", "")),
        str(image.get("src", "")),
        str(image.get("thumbSrc", "")),
        str(image.get("textureSrc", "")),
    ]

    for candidate_url in candidates:
        if not candidate_url:
            continue

        candidate_path = url_to_public_path(candidate_url)

        if candidate_path.exists():
            return candidate_path

    return None


def get_category_from_image(image: dict[str, Any]) -> str:
    category = str(image.get("category", "")).strip()

    return category or "uncategorized"


def optimize_existing_imports() -> None:
    images = read_json(GALLERY_IMAGES_PATH)

    backup_path = GALLERY_IMAGES_PATH.with_suffix(
        f".json.bak-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )

    shutil.copy2(GALLERY_IMAGES_PATH, backup_path)

    updated_count = 0
    skipped_count = 0

    for image in images:
        if should_skip_image(image):
            skipped_count += 1
            continue

        source_path = get_source_path(image)

        if not source_path:
            print(f"Skipped missing file: {image.get('id')}")
            skipped_count += 1
            continue

        category = get_category_from_image(image)
        file_stem = source_path.stem
        extension = source_path.suffix.lower()

        category_dir = PUBLIC_DIR / "images" / "imported" / category

        original_path = category_dir / "original" / f"{file_stem}{extension}"
        thumb_path = category_dir / "thumb" / f"{file_stem}.webp"
        optimized_path = category_dir / "optimized" / f"{file_stem}.webp"
        texture_path = category_dir / "texture" / f"{file_stem}.webp"
        full_path = category_dir / "full" / f"{file_stem}.webp"

        original_path.parent.mkdir(parents=True, exist_ok=True)

        if source_path.resolve() != original_path.resolve():
            shutil.copy2(source_path, original_path)

        save_webp_version(
            original_path,
            thumb_path,
            THUMB_MAX_WIDTH,
            THUMB_WEBP_QUALITY,
        )

        save_webp_version(
            original_path,
            optimized_path,
            OPTIMIZED_MAX_WIDTH,
            OPTIMIZED_WEBP_QUALITY,
        )

        save_webp_version(
            original_path,
            texture_path,
            TEXTURE_MAX_WIDTH,
            TEXTURE_WEBP_QUALITY,
        )

        save_webp_version(
            original_path,
            full_path,
            FULL_MAX_WIDTH,
            FULL_WEBP_QUALITY,
        )

        image["thumbSrc"] = public_path_to_url(thumb_path)
        image["src"] = public_path_to_url(optimized_path)
        image["textureSrc"] = public_path_to_url(texture_path)
        image["fullSrc"] = public_path_to_url(full_path)

        updated_count += 1

    write_json(GALLERY_IMAGES_PATH, images)

    print(f"Backup created: {backup_path}")
    print(f"Optimized existing imports: {updated_count}")
    print(f"Skipped records: {skipped_count}")


if __name__ == "__main__":
    optimize_existing_imports()