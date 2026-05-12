"""Asset normalization helpers for editor saves.

The active portfolio image structure is rendition-based, not category-folder-based.
Changing an image category should only update JSON metadata; it should not move
files between category folders.

This module keeps the old data_store hook available while preventing legacy
`/images/imported/<category>/...` relocation from being reapplied to the cleaned
pipeline.
"""

from __future__ import annotations

from typing import Any

from .utils import clean_string


PORTFOLIO_RENDITION_PREFIXES = {
    "thumbSrc": "/images/portfolio/thumb/",
    "src": "/images/portfolio/display/",
    "textureSrc": "/images/portfolio/texture/",
    "fullSrc": "/images/portfolio/full/",
}


def is_portfolio_rendition_url(field_name: str, url: str) -> bool:
    expected_prefix = PORTFOLIO_RENDITION_PREFIXES.get(field_name)

    if not expected_prefix:
        return False

    return clean_string(url).startswith(expected_prefix)


def normalize_portfolio_image_assets(image: dict[str, Any]) -> dict[str, Any]:
    """Return a copy of one image with only safe path normalization applied."""

    updated_image = dict(image)

    for field_name, expected_prefix in PORTFOLIO_RENDITION_PREFIXES.items():
        url = clean_string(updated_image.get(field_name))

        if not url:
            continue

        if url.startswith(expected_prefix):
            updated_image[field_name] = url
            continue

        # Preserve non-canonical legacy paths for now. Validation/audit scripts
        # are responsible for surfacing those paths before a deliberate migration.
        updated_image[field_name] = url

    return updated_image


def relocate_imported_image_assets(images: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Keep the existing data_store hook but do not relocate files by category."""

    return [normalize_portfolio_image_assets(image) for image in images]
