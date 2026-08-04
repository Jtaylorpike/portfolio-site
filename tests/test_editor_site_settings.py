"""Regression coverage for the portfolio-specific Site Settings contract."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "local-editor"))

from app import create_app  # noqa: E402
from app import data_store  # noqa: E402


class SiteCopyNormalizationTests(unittest.TestCase):
    def test_normalization_preserves_every_registered_section(self) -> None:
        raw_copy = json.loads((PROJECT_ROOT / "src" / "data" / "siteCopy.json").read_text(encoding="utf-8"))

        normalized = data_store.normalize_site_copy(raw_copy)

        self.assertEqual(normalized, raw_copy)
        self.assertEqual(
            set(normalized),
            {"schemaVersion", "entry", "home", "navigation", "portfolio", "footer", "gallery"},
        )

    def test_blank_values_fall_back_without_dropping_fields(self) -> None:
        normalized = data_store.normalize_site_copy({"navigation": {"home": "  "}})

        self.assertEqual(normalized["navigation"]["home"], "Home")
        self.assertEqual(set(normalized["gallery"]), set(data_store.DEFAULT_SITE_COPY["gallery"]))


class SiteSettingsPersistenceTests(unittest.TestCase):
    def test_save_writes_both_documents_and_backs_up_previous_values(self) -> None:
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
            previous_seo = {"siteName": "Previous", "siteUrl": "https://previous.example"}
            previous_copy = data_store.normalize_site_copy({})
            data_store.write_json(paths["SITE_SEO_PATH"], previous_seo)
            data_store.write_json(paths["SITE_COPY_PATH"], previous_copy)

            next_seo = {"siteName": "Taylor Pike", "siteUrl": "https://taylorpike.com/"}
            next_copy = data_store.normalize_site_copy({"entry": {"eyebrow": "Updated entry"}})

            with patch.multiple(data_store, **paths):
                saved_seo, saved_copy, backup = data_store.save_site_settings(next_seo, next_copy)

            backup_path = backup_directory / backup["backupFolder"]
            self.assertEqual(data_store.read_json(paths["SITE_SEO_PATH"]), saved_seo)
            self.assertEqual(data_store.read_json(paths["SITE_COPY_PATH"]), saved_copy)
            self.assertEqual(data_store.read_json(backup_path / "siteSeo.json"), previous_seo)
            self.assertEqual(data_store.read_json(backup_path / "siteCopy.json"), previous_copy)
            self.assertIn("siteSeo.json", backup["files"])
            self.assertIn("siteCopy.json", backup["files"])


class SiteSettingsRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app()
        self.app.config.update(TESTING=True)
        self.client = self.app.test_client()

    def test_route_rejects_incomplete_payload(self) -> None:
        response = self.client.post("/api/site-settings", json={"siteSeo": {}})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], "siteSeo and siteCopy must be objects.")

    def test_route_returns_both_saved_documents(self) -> None:
        saved_seo = {"siteName": "Taylor Pike", "siteUrl": "https://taylorpike.com/"}
        saved_copy = data_store.normalize_site_copy({})
        backup = {"backupFolder": "test-backup", "files": ["siteSeo.json", "siteCopy.json"]}

        with patch("app.routes.save_site_settings", return_value=(saved_seo, saved_copy, backup)):
            response = self.client.post(
                "/api/site-settings",
                json={"siteSeo": saved_seo, "siteCopy": saved_copy},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["siteSeo"], saved_seo)
        self.assertEqual(response.get_json()["siteCopy"], saved_copy)
        self.assertEqual(response.get_json()["backup"], backup)


if __name__ == "__main__":
    unittest.main()
