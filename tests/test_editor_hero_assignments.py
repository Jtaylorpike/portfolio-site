"""Regression coverage for hero-slideshow assignment rules."""

from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "local-editor"))

from app import data_store  # noqa: E402


class HeroAssignmentContractTests(unittest.TestCase):
    def test_filter_keeps_unique_landscape_assignments_in_reviewed_order(self) -> None:
        images = [
            {"id": "landscape-one", "imageOrientation": "landscape"},
            {"id": "portrait-one", "imageOrientation": "portrait"},
            {"id": "square-one", "imageOrientation": "square"},
            {"id": "landscape-two", "imageWidth": 1600, "imageHeight": 900},
        ]
        slides = [
            {"imageId": "landscape-two", "targetCategory": "landscape"},
            {"imageId": "portrait-one", "targetCategory": "portraits"},
            {"imageId": "landscape-one", "targetCategory": "climbing"},
            {"imageId": "landscape-two", "targetCategory": "landscape"},
            {"imageId": "square-one", "targetCategory": "personal"},
            {"imageId": "missing-image", "targetCategory": "personal"},
        ]

        filtered = data_store.filter_hero_slides_for_landscape_images(slides, images)

        self.assertEqual(
            [slide["imageId"] for slide in filtered],
            ["landscape-two", "landscape-one"],
        )

    def test_save_normalization_removes_invalid_and_duplicate_assignments(self) -> None:
        categories, images, _hero_slides = data_store.get_current_data()
        landscape_images = [image for image in images if data_store.is_landscape_hero_image(image)]
        portrait_image = next(image for image in images if not data_store.is_landscape_hero_image(image))
        first_landscape = landscape_images[0]
        second_landscape = landscape_images[1]
        raw_slides = [
            {"imageId": first_landscape["id"], "targetCategory": first_landscape["category"]},
            {"imageId": portrait_image["id"], "targetCategory": portrait_image["category"]},
            {"imageId": "missing-image", "targetCategory": categories[0]["id"]},
            {"imageId": first_landscape["id"], "targetCategory": first_landscape["category"]},
            {"imageId": second_landscape["id"], "targetCategory": "invalid-category"},
        ]

        with patch("app.data_store.relocate_imported_image_assets", side_effect=lambda records: records):
            _categories, _images, normalized_slides = data_store.normalize_project_data_for_save(
                copy.deepcopy(categories),
                copy.deepcopy(images),
                raw_slides,
            )

        self.assertEqual(
            [slide["imageId"] for slide in normalized_slides],
            [first_landscape["id"], second_landscape["id"]],
        )
        self.assertEqual(normalized_slides[1]["targetCategory"], categories[0]["id"])

    def test_direct_validation_rejects_duplicate_hero_assignments(self) -> None:
        categories, images, hero_slides = data_store.get_current_data()
        duplicated = [copy.deepcopy(hero_slides[0]), copy.deepcopy(hero_slides[0])]

        with self.assertRaisesRegex(data_store.DataValidationError, "Duplicate hero image assignments"):
            data_store.validate_project_data(categories, images, duplicated)


if __name__ == "__main__":
    unittest.main()
