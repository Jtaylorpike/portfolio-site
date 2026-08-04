"""Regression coverage for focused image crop and framing saves."""

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


class FocusedImageUpdateTests(unittest.TestCase):
    def test_crop_save_updates_only_whitelisted_fields_on_the_selected_image(self) -> None:
        categories, images, hero_slides = data_store.get_current_data()
        selected_before = copy.deepcopy(images[0])
        unrelated_before = copy.deepcopy(images[1])

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
            documents = {
                "CATEGORIES_PATH": categories,
                "GALLERY_IMAGES_PATH": images,
                "HERO_SLIDES_PATH": hero_slides,
                "GALLERY_CURATION_PATH": data_store.get_current_gallery_curation(images),
                "GALLERY_ROOM_PATH": data_store.get_current_gallery_room(),
                "ABOUT_PHOTOS_PATH": data_store.get_current_about_photos(),
                "ABOUT_COPY_PATH": data_store.get_current_about_copy(),
                "SITE_SEO_PATH": data_store.get_current_site_seo(),
                "SITE_COPY_PATH": data_store.get_current_site_copy(),
            }
            for path_name, document in documents.items():
                data_store.write_json(paths[path_name], document)

            updates = {
                "thumbnailPosition": "12% 34%",
                "heroPosition": "22% 44%",
                "heroScale": 1.25,
                "galleryPosition": "66% 77%",
                "galleryScale": 1.4,
                "galleryFitMode": "cover",
                "galleryFrameStyle": "portrait",
                "title": "This field must not be changed by a crop save",
            }

            with patch.multiple(data_store, **paths):
                _categories, saved_images, saved_hero_slides, updated_image, backup = data_store.save_image_updates(
                    selected_before["id"],
                    updates,
                )

            backup_path = backup_directory / backup["backupFolder"]
            self.assertEqual(updated_image["thumbnailPosition"], "12% 34%")
            self.assertEqual(updated_image["heroPosition"], "22% 44%")
            self.assertEqual(updated_image["heroScale"], 1.25)
            self.assertEqual(updated_image["galleryPosition"], "66% 77%")
            self.assertEqual(updated_image["galleryScale"], 1.4)
            self.assertEqual(updated_image["galleryFitMode"], "cover")
            self.assertEqual(updated_image["galleryFrameStyle"], "portrait")
            self.assertEqual(updated_image["title"], selected_before["title"])
            self.assertEqual(saved_images[1], unrelated_before)
            self.assertEqual(saved_hero_slides, hero_slides)
            self.assertEqual(data_store.read_json(backup_path / "galleryImages.json")[0], selected_before)

    def test_crop_save_rejects_an_unknown_image_id(self) -> None:
        with patch("app.data_store.get_current_data", return_value=([{"id": "personal", "label": "Personal"}], [], [])):
            with self.assertRaisesRegex(ValueError, "Image not found"):
                data_store.save_image_updates("missing-image", {"heroPosition": "50% 50%"})


if __name__ == "__main__":
    unittest.main()
