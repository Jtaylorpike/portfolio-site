"""Regression coverage for portfolio and About import preflight validation."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "local-editor"))

from app import about_importer, image_importer  # noqa: E402


class FakeUpload:
    def __init__(self, filename: str) -> None:
        self.filename = filename


class PortfolioImportPreflightTests(unittest.TestCase):
    def test_valid_records_keep_reviewed_ids_and_safe_filenames(self) -> None:
        uploads = [FakeUpload("First Image.JPG"), FakeUpload("second-image.png")]
        records = [
            {"id": "first-image", "title": "First"},
            {"id": "second-image", "title": "Second"},
        ]

        with patch("app.image_importer.get_rendition_collision_names", return_value=[]):
            normalized, errors = image_importer.validate_import_preflight(uploads, records, [])

        self.assertEqual(errors, [])
        self.assertEqual([record["id"] for record in normalized], ["first-image", "second-image"])
        self.assertEqual(normalized[0]["originalFilename"], "First_Image.JPG")

    def test_duplicate_existing_unsafe_and_unsupported_records_are_rejected(self) -> None:
        uploads = [
            FakeUpload("existing.jpg"),
            FakeUpload("duplicate.jpg"),
            FakeUpload("unsafe.jpg"),
            FakeUpload("unsupported.gif"),
        ]
        records = [
            {"id": "existing-image", "title": "Existing"},
            {"id": "existing-image", "title": "Duplicate"},
            {"id": "Unsafe ID", "title": "Unsafe"},
            {"id": "unsupported-file", "title": "Unsupported"},
        ]

        with patch("app.image_importer.get_rendition_collision_names", return_value=[]):
            normalized, errors = image_importer.validate_import_preflight(
                uploads,
                records,
                [{"id": "existing-image"}],
            )

        self.assertEqual(normalized, [])
        self.assertTrue(any("already exists" in error for error in errors))
        self.assertTrue(any("lowercase letters" in error for error in errors))
        self.assertTrue(any("not a supported image file" in error for error in errors))

    def test_rendition_collision_blocks_import_before_writes(self) -> None:
        with patch("app.image_importer.get_rendition_collision_names", return_value=["display", "full"]):
            normalized, errors = image_importer.validate_import_preflight(
                [FakeUpload("collision.jpg")],
                [{"id": "collision", "title": "Collision"}],
                [],
            )

        self.assertEqual(normalized, [])
        self.assertIn("would overwrite existing rendition file(s) in display, full", errors[0])


class AboutImportPreflightTests(unittest.TestCase):
    def test_valid_about_record_defaults_to_unused_safe_metadata(self) -> None:
        record = {
            "id": "new-about-photo",
            "title": "New About Photo",
            "originalFilename": "new-about-photo.webp",
            "placementRole": "unused",
            "isActive": False,
        }

        normalized, errors = about_importer.validate_about_import_preflight(
            [FakeUpload("new-about-photo.webp")],
            [record],
            [],
        )

        self.assertEqual(errors, [])
        self.assertEqual(normalized[0]["placementRole"], "unused")
        self.assertFalse(normalized[0]["isActive"])

    def test_about_duplicate_and_invalid_placement_are_rejected(self) -> None:
        records = [
            {"id": "duplicate-about", "originalFilename": "one.jpg", "placementRole": "invalid"},
            {"id": "duplicate-about", "originalFilename": "two.jpg", "placementRole": "upper-collage"},
        ]

        normalized, errors = about_importer.validate_about_import_preflight(
            [FakeUpload("one.jpg"), FakeUpload("two.jpg")],
            records,
            [],
        )

        self.assertEqual(len(normalized), 2)
        self.assertEqual(normalized[0]["placementRole"], "lower-collage")
        self.assertTrue(any("About placement must be" in error for error in errors))
        self.assertTrue(any("duplicated in this import review" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
