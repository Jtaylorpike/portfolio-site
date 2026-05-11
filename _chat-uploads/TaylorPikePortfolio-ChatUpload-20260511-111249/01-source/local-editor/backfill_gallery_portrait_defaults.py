"""One-time migration for portrait virtual-gallery artwork sizing.

The editor stores each image's virtual-gallery size in src/data/galleryImages.json.
Changing the default size constant only affects new or missing values. Existing
portrait images that already saved the old default size still need their stored
value updated once.

This script updates only portrait-shaped gallery records that are still using the
old portrait default. It avoids changing images that were intentionally set to a
custom larger or smaller size.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
GALLERY_IMAGES_PATH = PROJECT_ROOT / "src" / "data" / "galleryImages.json"

OLD_PORTRAIT_DEFAULT = 1.16
NEW_PORTRAIT_DEFAULT = 1.32
TOLERANCE = 0.001


def read_gallery_images() -> list[dict[str, Any]]:
    with GALLERY_IMAGES_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("galleryImages.json must contain a list of image records.")

    return [image for image in data if isinstance(image, dict)]


def write_gallery_images(images: list[dict[str, Any]]) -> None:
    GALLERY_IMAGES_PATH.write_text(
        json.dumps(images, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def get_orientation(image: dict[str, Any]) -> str:
    saved_orientation = image.get("imageOrientation")

    if saved_orientation in {"landscape", "portrait", "square"}:
        return saved_orientation

    width = image.get("imageWidth")
    height = image.get("imageHeight")

    try:
        numeric_width = float(width)
        numeric_height = float(height)
    except (TypeError, ValueError):
        return "landscape"

    if numeric_width <= 0 or numeric_height <= 0:
        return "landscape"

    aspect_ratio = numeric_width / numeric_height

    if abs(aspect_ratio - 1) <= 0.04:
        return "square"

    if aspect_ratio > 1:
        return "landscape"

    return "portrait"


def get_resolved_gallery_shape(image: dict[str, Any]) -> str:
    frame_style = image.get("galleryFrameStyle")

    if frame_style in {"landscape", "portrait", "square"}:
        return frame_style

    orientation = get_orientation(image)

    if orientation in {"portrait", "square"}:
        return orientation

    return "landscape"


def is_legacy_default_size(value: Any) -> bool:
    if value is None or value == "":
        return True

    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return True

    return abs(numeric_value - OLD_PORTRAIT_DEFAULT) <= TOLERANCE


def main() -> None:
    images = read_gallery_images()
    changed_count = 0

    for image in images:
        if get_resolved_gallery_shape(image) != "portrait":
            continue

        if not is_legacy_default_size(image.get("gallerySize")):
            continue

        image["gallerySize"] = NEW_PORTRAIT_DEFAULT
        changed_count += 1

    write_gallery_images(images)

    print(
        f"Updated {changed_count} portrait gallery image(s) from "
        f"{OLD_PORTRAIT_DEFAULT} to {NEW_PORTRAIT_DEFAULT}."
    )


if __name__ == "__main__":
    main()
