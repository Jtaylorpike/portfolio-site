"""Regression coverage for complete, reversible editor backup restores."""

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


class EditorBackupRestoreTests(unittest.TestCase):
    def test_restore_recovers_all_documents_and_preserves_a_safety_backup(self) -> None:
        categories, images, hero_slides = data_store.get_current_data()
        gallery_curation = data_store.get_current_gallery_curation(images)
        gallery_room = data_store.get_current_gallery_room()
        about_photos = data_store.get_current_about_photos()
        about_copy = data_store.get_current_about_copy()
        site_seo = data_store.get_current_site_seo()
        site_copy = data_store.get_current_site_copy()

        restored_images = copy.deepcopy(images)
        restored_images[0]["note"] = "Restored image note"
        restored_site_copy = copy.deepcopy(site_copy)
        restored_site_copy["home"]["eyebrow"] = "Restored homepage label"

        current_images = copy.deepcopy(images)
        current_images[0]["note"] = "Pre-restore image note"
        current_site_copy = copy.deepcopy(site_copy)
        current_site_copy["home"]["eyebrow"] = "Pre-restore homepage label"

        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            data_directory = root / "data"
            backup_directory = root / "backups"
            restore_directory = backup_directory / "restore-target"
            data_directory.mkdir()
            restore_directory.mkdir(parents=True)
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
            current_documents = {
                "categories.json": categories,
                "galleryImages.json": current_images,
                "heroSlides.json": hero_slides,
                "galleryCuration.json": gallery_curation,
                "galleryRoom.json": gallery_room,
                "aboutPhotos.json": about_photos,
                "aboutCopy.json": about_copy,
                "siteSeo.json": site_seo,
                "siteCopy.json": current_site_copy,
            }
            restored_documents = {
                **current_documents,
                "galleryImages.json": restored_images,
                "siteCopy.json": restored_site_copy,
            }
            path_by_file = {path.name: path for name, path in paths.items() if name.endswith("_PATH")}

            for file_name, document in current_documents.items():
                data_store.write_json(path_by_file[file_name], document)
            for file_name, document in restored_documents.items():
                data_store.write_json(restore_directory / file_name, document)
            data_store.write_json(
                restore_directory / "manifest.json",
                {
                    "reason": "restore regression",
                    "createdAtUtc": "2026-08-04T12:00:00+00:00",
                    "backupFolder": "restore-target",
                    "files": list(restored_documents),
                },
            )

            with patch.multiple(data_store, **paths):
                _categories, _images, _hero_slides, restored_summary, safety_backup = data_store.restore_data_backup(
                    "restore-target"
                )

            safety_path = backup_directory / safety_backup["backupFolder"]
            self.assertTrue(restored_summary["canRestore"])
            self.assertEqual(data_store.read_json(paths["GALLERY_IMAGES_PATH"])[0]["note"], "Restored image note")
            self.assertEqual(
                data_store.read_json(paths["SITE_COPY_PATH"])["home"]["eyebrow"],
                "Restored homepage label",
            )
            self.assertEqual(
                data_store.read_json(safety_path / "galleryImages.json")[0]["note"],
                "Pre-restore image note",
            )
            self.assertEqual(
                data_store.read_json(safety_path / "siteCopy.json")["home"]["eyebrow"],
                "Pre-restore homepage label",
            )
            self.assertEqual(set(safety_backup["files"]), set(current_documents))


if __name__ == "__main__":
    unittest.main()
