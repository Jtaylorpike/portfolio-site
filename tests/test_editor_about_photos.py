"""Regression coverage for About-photo placement, crop, and collage fields."""

from __future__ import annotations

import copy
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "local-editor"))

from app import data_store  # noqa: E402


class AboutPhotoContractTests(unittest.TestCase):
    def test_normalization_preserves_desktop_mobile_and_crop_fields(self) -> None:
        photo = data_store.normalize_about_photo(
            {
                "id": "about-layout-test",
                "title": "Layout Test",
                "src": "/images/about/layout-test.webp",
                "imageOrientation": "landscape",
                "placementRole": "background-float",
                "aboutPosition": "23% 67%",
                "aboutScale": 1.35,
                "backgroundX": -10,
                "backgroundY": 18,
                "backgroundWidth": 54,
                "collageX": 14,
                "collageY": 22,
                "collageWidth": 48,
                "collageLayer": 7,
                "collageRotation": -8,
                "collageOpacity": 0.42,
                "mobileX": 6,
                "mobileY": 31,
                "mobileWidth": 72,
                "mobileLayer": 11,
                "mobileRotation": 5,
                "mobileOpacity": 0.68,
                "sourceType": "portfolio-reference",
                "sourceImageId": "source-image",
                "isActive": False,
            }
        )

        expected = {
            "placementRole": "background-float",
            "aboutPosition": "23% 67%",
            "aboutScale": 1.35,
            "backgroundX": -10.0,
            "backgroundY": 18.0,
            "backgroundWidth": 54.0,
            "collageX": 14.0,
            "collageY": 22.0,
            "collageWidth": 48.0,
            "collageLayer": 7,
            "collageRotation": -8.0,
            "collageOpacity": 0.42,
            "mobileX": 6.0,
            "mobileY": 31.0,
            "mobileWidth": 72.0,
            "mobileLayer": 11,
            "mobileRotation": 5.0,
            "mobileOpacity": 0.68,
            "sourceImageId": "source-image",
            "isActive": False,
        }
        for field, value in expected.items():
            self.assertEqual(photo[field], value, field)

    def test_invalid_layout_values_are_safely_normalized(self) -> None:
        photo = data_store.normalize_about_photo(
            {
                "id": "unsafe-layout",
                "src": "/images/about/unsafe.webp",
                "placementRole": "unknown",
                "aboutScale": 0.1,
                "collageOpacity": 9,
                "mobileWidth": 2,
                "mobileRotation": 90,
            }
        )

        self.assertEqual(photo["placementRole"], "lower-collage")
        self.assertEqual(photo["aboutScale"], 1.0)
        self.assertEqual(photo["collageOpacity"], 1.0)
        self.assertEqual(photo["mobileWidth"], 12.0)
        self.assertEqual(photo["mobileRotation"], 45.0)

    def test_about_photo_save_backs_up_previous_assignments(self) -> None:
        current_photos = data_store.get_current_about_photos()
        next_photos = copy.deepcopy(current_photos)
        next_photos[0]["placementRole"] = "unused"
        next_photos[0]["isActive"] = False
        next_photos[0]["mobileX"] = 17
        next_photos[0]["mobileY"] = 29

        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            data_directory = root / "data"
            backup_directory = root / "backups"
            data_directory.mkdir()
            paths = {
                "CATEGORIES_PATH": data_directory / "categories.json",
                "GALLERY_IMAGES_PATH": data_directory / "galleryImages.json",
                "HERO_SLIDES_PATH": data_directory / "heroSlides.json",
                "GALLERY_CURATION_PATH": data_directory / "galleryCuration.json",
                "GALLERY_ROOM_PATH": data_directory / "galleryRoom.json",
                "ABOUT_PHOTOS_PATH": data_directory / "aboutPhotos.json",
                "ABOUT_COPY_PATH": data_directory / "aboutCopy.json",
                "SITE_SEO_PATH": data_directory / "siteSeo.json",
                "SITE_COPY_PATH": data_directory / "siteCopy.json",
                "BACKUP_DIR": backup_directory,
            }
            data_store.write_json(paths["ABOUT_PHOTOS_PATH"], current_photos)

            with patch.multiple(data_store, **paths):
                saved_photos, backup = data_store.save_about_photos(next_photos)

            backup_path = backup_directory / backup["backupFolder"]
            self.assertEqual(saved_photos[0]["placementRole"], "unused")
            self.assertFalse(saved_photos[0]["isActive"])
            self.assertEqual(saved_photos[0]["mobileX"], 17.0)
            self.assertEqual(saved_photos[0]["mobileY"], 29.0)
            self.assertEqual(data_store.read_json(paths["ABOUT_PHOTOS_PATH"]), saved_photos)
            self.assertEqual(data_store.read_json(backup_path / "aboutPhotos.json"), current_photos)


if __name__ == "__main__":
    unittest.main()
