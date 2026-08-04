"""Regression coverage for focused gallery-wall curation saves."""

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


class GalleryCurationContractTests(unittest.TestCase):
    def test_single_wall_save_preserves_other_walls_and_backs_up_curation(self) -> None:
        categories, images, hero_slides = data_store.get_current_data()
        curation = data_store.get_current_gallery_curation(images)
        selected_before = copy.deepcopy(curation[0])
        unrelated_before = copy.deepcopy(curation[1])
        updated_wall = {**selected_before, "plaqueEnabled": False, "plaqueSide": "left"}

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
                "GALLERY_CURATION_PATH": curation,
                "GALLERY_ROOM_PATH": data_store.get_current_gallery_room(),
                "ABOUT_PHOTOS_PATH": data_store.get_current_about_photos(),
                "ABOUT_COPY_PATH": data_store.get_current_about_copy(),
                "SITE_SEO_PATH": data_store.get_current_site_seo(),
                "SITE_COPY_PATH": data_store.get_current_site_copy(),
            }
            for path_name, document in documents.items():
                data_store.write_json(paths[path_name], document)

            with patch.multiple(data_store, **paths):
                _categories, _images, _hero_slides, saved_curation, backup = data_store.save_gallery_curation_wall(
                    updated_wall
                )

            saved_wall = next(record for record in saved_curation if record["wallId"] == selected_before["wallId"])
            unrelated_wall = next(record for record in saved_curation if record["wallId"] == unrelated_before["wallId"])
            backup_path = backup_directory / backup["backupFolder"]
            self.assertFalse(saved_wall["plaqueEnabled"])
            self.assertEqual(saved_wall["plaqueSide"], "left")
            self.assertEqual(unrelated_wall, unrelated_before)
            self.assertEqual(data_store.read_json(paths["GALLERY_CURATION_PATH"]), saved_curation)
            self.assertEqual(data_store.read_json(backup_path / "galleryCuration.json"), curation)

    def test_colliding_wall_update_is_rejected_before_backup_or_write(self) -> None:
        categories, images, hero_slides = data_store.get_current_data()
        curation = data_store.get_current_gallery_curation(images)
        selected = copy.deepcopy(curation[0])
        occupied = curation[1]
        selected.update(
            {
                "positionX": occupied["positionX"],
                "positionZ": occupied["positionZ"],
                "rotationYDegrees": occupied["rotationYDegrees"],
                "roomId": occupied["roomId"],
            }
        )

        with patch("app.data_store.get_current_data", return_value=(categories, images, hero_slides)), patch(
            "app.data_store.get_current_gallery_curation",
            return_value=curation,
        ), patch("app.data_store.create_data_backup") as create_backup:
            with self.assertRaisesRegex(data_store.DataValidationError, "collision"):
                data_store.save_gallery_curation_wall(selected)

        create_backup.assert_not_called()


if __name__ == "__main__":
    unittest.main()
