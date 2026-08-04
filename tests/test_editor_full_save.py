"""Regression coverage for the local editor's complete portfolio save path."""

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


class FullEditorSaveTests(unittest.TestCase):
    def test_full_save_round_trips_portfolio_and_about_data_with_backup(self) -> None:
        categories, images, hero_slides = data_store.get_current_data()
        about_photos = data_store.get_current_about_photos()
        about_copy = data_store.get_current_about_copy()
        site_seo = data_store.get_current_site_seo()
        site_copy = data_store.get_current_site_copy()

        next_categories = copy.deepcopy(categories)
        next_images = copy.deepcopy(images)
        next_hero_slides = copy.deepcopy(hero_slides)
        next_about_photos = copy.deepcopy(about_photos)
        next_about_copy = copy.deepcopy(about_copy)
        next_images[0]["note"] = "Full-save regression note"
        next_about_photos[0]["note"] = "Full-save About regression note"
        next_about_copy["hero"]["eyebrow"] = "Full-save About heading"

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
            previous_documents = {
                "CATEGORIES_PATH": categories,
                "GALLERY_IMAGES_PATH": images,
                "HERO_SLIDES_PATH": hero_slides,
                "GALLERY_CURATION_PATH": [],
                "GALLERY_ROOM_PATH": data_store.DEFAULT_GALLERY_ROOM,
                "ABOUT_PHOTOS_PATH": about_photos,
                "ABOUT_COPY_PATH": about_copy,
                "SITE_SEO_PATH": site_seo,
                "SITE_COPY_PATH": site_copy,
            }
            for path_name, document in previous_documents.items():
                data_store.write_json(paths[path_name], document)

            with patch.multiple(data_store, **paths), patch(
                "app.data_store.relocate_imported_image_assets",
                side_effect=lambda records: records,
            ):
                saved = data_store.save_full_data(
                    next_categories,
                    next_images,
                    next_hero_slides,
                    next_about_photos,
                    next_about_copy,
                )

            saved_categories, saved_images, saved_hero_slides, saved_about_photos, saved_about_copy, backup = saved
            backup_path = backup_directory / backup["backupFolder"]

            self.assertEqual(data_store.read_json(paths["CATEGORIES_PATH"]), saved_categories)
            self.assertEqual(data_store.read_json(paths["GALLERY_IMAGES_PATH"]), saved_images)
            self.assertEqual(data_store.read_json(paths["HERO_SLIDES_PATH"]), saved_hero_slides)
            self.assertEqual(data_store.read_json(paths["ABOUT_PHOTOS_PATH"]), saved_about_photos)
            self.assertEqual(data_store.read_json(paths["ABOUT_COPY_PATH"]), saved_about_copy)
            self.assertEqual(saved_images[0]["note"], "Full-save regression note")
            self.assertEqual(saved_about_photos[0]["note"], "Full-save About regression note")
            self.assertEqual(saved_about_copy["hero"]["eyebrow"], "Full-save About heading")
            self.assertEqual(data_store.read_json(backup_path / "galleryImages.json"), images)
            self.assertEqual(data_store.read_json(backup_path / "aboutPhotos.json"), about_photos)
            self.assertEqual(data_store.read_json(backup_path / "aboutCopy.json"), about_copy)
            self.assertEqual(data_store.read_json(backup_path / "siteSeo.json"), site_seo)
            self.assertEqual(data_store.read_json(backup_path / "siteCopy.json"), site_copy)
            self.assertEqual(
                {slide["imageId"] for slide in saved_hero_slides},
                {slide["imageId"] for slide in next_hero_slides},
            )


if __name__ == "__main__":
    unittest.main()
