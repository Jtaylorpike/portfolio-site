from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = PROJECT_ROOT / "public"
GALLERY_IMAGES_PATH = PROJECT_ROOT / "src" / "data" / "galleryImages.json"


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path: Path, data: Any) -> None:
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def get_local_path(public_url: str) -> Path | None:
    if not public_url.startswith("/"):
        return None

    local_path = PUBLIC_DIR / public_url.lstrip("/")

    if local_path.exists():
        return local_path

    return None


def get_best_image_path(image: dict[str, Any]) -> Path | None:
    for field in ["fullSrc", "src", "textureSrc", "thumbSrc"]:
        value = str(image.get(field, "")).strip()

        if not value:
            continue

        local_path = get_local_path(value)

        if local_path:
            return local_path

    return None


def get_image_metadata(path: Path) -> dict[str, Any]:
    with Image.open(path) as image:
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


def main() -> None:
    if not GALLERY_IMAGES_PATH.exists():
        raise FileNotFoundError(f"Could not find {GALLERY_IMAGES_PATH}")

    images = read_json(GALLERY_IMAGES_PATH)

    if not isinstance(images, list):
        raise ValueError("galleryImages.json must contain a list")

    backup_path = GALLERY_IMAGES_PATH.with_suffix(".json.backup-image-dimensions")
    write_json(backup_path, images)

    updated_count = 0
    skipped_count = 0

    for image in images:
      if not isinstance(image, dict):
          skipped_count += 1
          continue

      local_path = get_best_image_path(image)

      if not local_path:
          print(f"Skipped {image.get('id', 'unknown')}: no local image path found")
          skipped_count += 1
          continue

      try:
          metadata = get_image_metadata(local_path)
      except Exception as error:
          print(f"Skipped {image.get('id', 'unknown')}: {error}")
          skipped_count += 1
          continue

      image.update(metadata)

      image.setdefault("galleryFitMode", "cover")
      image.setdefault("galleryFrameStyle", "auto")
      image.setdefault("galleryPosition", "50% 50%")
      image.setdefault("heroPosition", "50% 50%")
      image.setdefault("thumbnailPosition", "50% 50%")

      updated_count += 1

    write_json(GALLERY_IMAGES_PATH, images)

    print(f"Backed up original JSON to: {backup_path}")
    print(f"Updated {updated_count} image records.")
    print(f"Skipped {skipped_count} image records.")


if __name__ == "__main__":
    main()