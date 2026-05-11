from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

from .utils import clean_string, make_unique_value, slugify


PROJECT_ROOT = Path(__file__).resolve().parents[2]
PUBLIC_DIR = PROJECT_ROOT / "public"
IMPORTED_IMAGES_DIR = PUBLIC_DIR / "images" / "imported"

ASSET_FIELDS = {
    "thumbSrc": "thumb",
    "src": "optimized",
    "textureSrc": "texture",
    "fullSrc": "full",
}


def url_to_public_path(url: str) -> Path:
    clean_url = url.lstrip("/")

    return PUBLIC_DIR / clean_url.removeprefix("public/")


def public_path_to_url(path: Path) -> str:
    return "/" + path.relative_to(PUBLIC_DIR).as_posix()


def get_imported_asset_info(url: str) -> tuple[str, str, Path] | None:
    if not url.startswith("/images/imported/"):
        return None

    path = url_to_public_path(url)

    try:
        relative_parts = path.relative_to(IMPORTED_IMAGES_DIR).parts
    except ValueError:
        return None

    # Expected:
    # <category>/<asset-folder>/<filename>
    if len(relative_parts) < 3:
        return None

    category = relative_parts[0]
    asset_folder = relative_parts[1]

    return category, asset_folder, path


def get_existing_stems_for_category(category: str) -> set[str]:
    category_dir = IMPORTED_IMAGES_DIR / category

    if not category_dir.exists():
        return set()

    stems: set[str] = set()

    for path in category_dir.rglob("*"):
        if path.is_file():
            stems.add(path.stem)

    return stems


def copy_asset(source_path: Path, destination_path: Path) -> bool:
    if not source_path.exists():
        return False

    destination_path.parent.mkdir(parents=True, exist_ok=True)

    if source_path.resolve() == destination_path.resolve():
        return True

    if destination_path.exists():
        return True

    shutil.copy2(source_path, destination_path)

    return True


def copy_original_asset(
    old_category: str,
    new_category: str,
    old_stem: str,
    new_stem: str,
) -> None:
    old_original_dir = IMPORTED_IMAGES_DIR / old_category / "original"
    new_original_dir = IMPORTED_IMAGES_DIR / new_category / "original"

    if not old_original_dir.exists():
        return

    for original_file in old_original_dir.glob(f"{old_stem}.*"):
        if not original_file.is_file():
            continue

        destination_path = new_original_dir / f"{new_stem}{original_file.suffix}"
        copy_asset(original_file, destination_path)


def relocate_imported_image_assets(images: list[dict[str, Any]]) -> list[dict[str, Any]]:
    relocated_images: list[dict[str, Any]] = []

    for image in images:
        target_category = slugify(clean_string(image.get("category")))

        if not target_category:
            relocated_images.append(image)
            continue

        managed_assets = []

        for field_name, expected_folder in ASSET_FIELDS.items():
            url = clean_string(image.get(field_name))

            if not url:
                continue

            asset_info = get_imported_asset_info(url)

            if not asset_info:
                continue

            current_category, current_folder, source_path = asset_info

            # Only relocate files that are in the expected managed folder.
            # Example: src should point to optimized/, thumbSrc should point to thumb/.
            if current_folder != expected_folder:
                continue

            managed_assets.append(
                {
                    "field_name": field_name,
                    "expected_folder": expected_folder,
                    "current_category": current_category,
                    "source_path": source_path,
                }
            )

        if not managed_assets:
            relocated_images.append(image)
            continue

        current_category = managed_assets[0]["current_category"]

        if current_category == target_category:
            relocated_images.append(image)
            continue

        old_stem = managed_assets[0]["source_path"].stem
        target_stem = make_unique_value(
            old_stem,
            get_existing_stems_for_category(target_category),
        )

        updated_image = dict(image)
        copied_any_asset = False

        for asset in managed_assets:
            source_path = asset["source_path"]
            expected_folder = asset["expected_folder"]
            field_name = asset["field_name"]

            destination_path = (
                IMPORTED_IMAGES_DIR
                / target_category
                / expected_folder
                / f"{target_stem}{source_path.suffix}"
            )

            if copy_asset(source_path, destination_path):
                updated_image[field_name] = public_path_to_url(destination_path)
                copied_any_asset = True

        if copied_any_asset:
            copy_original_asset(
                old_category=current_category,
                new_category=target_category,
                old_stem=old_stem,
                new_stem=target_stem,
            )

            relocated_images.append(updated_image)
        else:
            relocated_images.append(image)

    return relocated_images