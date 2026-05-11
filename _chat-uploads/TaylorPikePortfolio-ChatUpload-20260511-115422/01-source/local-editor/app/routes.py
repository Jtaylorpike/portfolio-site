"""HTTP routes for the local portfolio editor.

The frontend talks to these endpoints to load data, save JSON, save one image's
framing settings, import new images, and preview local image files.
"""

from __future__ import annotations

from flask import Blueprint, jsonify, render_template, request, send_from_directory

from .data_store import (
    DataValidationError,
    PUBLIC_DIR,
    get_current_data,
    list_data_backups,
    restore_data_backup,
    save_full_data,
    save_image_updates,
)
from .image_importer import import_reviewed_images_from_request


bp = Blueprint("editor_routes", __name__)


@bp.route("/")
def editor_page():
    """Serve the local editor HTML shell."""

    return render_template("editor.html")


@bp.route("/api/data")
def get_data():
    """Return normalized JSON data for the editor frontend."""

    try:
        categories, images, hero_slides = get_current_data()
    except DataValidationError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(
        {
            "categories": categories,
            "images": images,
            "heroSlides": hero_slides,
        }
    )


@bp.route("/api/save", methods=["POST"])
def save_data():
    """Validate and save the full editor state.

    The backend creates a timestamped backup immediately before writing the JSON
    files. The response includes the backup folder name so the editor can show a
    more useful save message.
    """

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid JSON payload."}), 400

    raw_categories = payload.get("categories")
    raw_images = payload.get("images")
    raw_hero_slides = payload.get("heroSlides")

    if not isinstance(raw_categories, list):
        return jsonify({"error": "categories must be a list."}), 400

    if not isinstance(raw_images, list):
        return jsonify({"error": "images must be a list."}), 400

    if not isinstance(raw_hero_slides, list):
        return jsonify({"error": "heroSlides must be a list."}), 400

    try:
        categories, images, hero_slides, backup = save_full_data(
            raw_categories,
            raw_images,
            raw_hero_slides,
        )
    except DataValidationError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(
        {
            "ok": True,
            "categories": categories,
            "images": images,
            "heroSlides": hero_slides,
            "backup": backup,
            "categoryCount": len(categories),
            "imageCount": len(images),
            "heroSlideCount": len(hero_slides),
        }
    )


@bp.route("/api/image-updates", methods=["POST"])
def update_image_record():
    """Save a small set of updates for one image record."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid JSON payload."}), 400

    image_id = payload.get("imageId")
    updates = payload.get("updates")

    if not isinstance(image_id, str) or not image_id.strip():
        return jsonify({"error": "imageId must be a non-empty string."}), 400

    if not isinstance(updates, dict):
        return jsonify({"error": "updates must be an object."}), 400

    try:
        categories, images, hero_slides, updated_image, backup = save_image_updates(image_id.strip(), updates)
    except DataValidationError as error:
        return jsonify({"error": str(error)}), 400
    except ValueError as error:
        return jsonify({"error": str(error)}), 404

    return jsonify(
        {
            "ok": True,
            "categories": categories,
            "images": images,
            "heroSlides": hero_slides,
            "updatedImage": updated_image,
            "backup": backup,
            "categoryCount": len(categories),
            "imageCount": len(images),
            "heroSlideCount": len(hero_slides),
        }
    )


@bp.route("/api/backups")
def list_backups():
    """Return the backup folders that can be shown in the editor UI."""

    return jsonify(
        {
            "ok": True,
            "backups": list_data_backups(),
        }
    )


@bp.route("/api/backups/restore", methods=["POST"])
def restore_backup():
    """Restore one validated backup and return the new editor state."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid JSON payload."}), 400

    backup_name = payload.get("backupFolder")

    if not isinstance(backup_name, str) or not backup_name.strip():
        return jsonify({"error": "backupFolder must be a non-empty string."}), 400

    try:
        categories, images, hero_slides, restored_backup, safety_backup = restore_data_backup(backup_name.strip())
    except DataValidationError as error:
        return jsonify({"error": str(error)}), 400
    except ValueError as error:
        return jsonify({"error": str(error)}), 404

    return jsonify(
        {
            "ok": True,
            "categories": categories,
            "images": images,
            "heroSlides": hero_slides,
            "backups": list_data_backups(),
            "restoredBackup": restored_backup,
            "backup": safety_backup,
            "categoryCount": len(categories),
            "imageCount": len(images),
            "heroSlideCount": len(hero_slides),
        }
    )


@bp.route("/api/import-reviewed", methods=["POST"])
def import_reviewed_images():
    """Handle reviewed image uploads and metadata creation."""

    response, status_code = import_reviewed_images_from_request(request)

    return jsonify(response), status_code


@bp.route("/images/<path:filename>")
def serve_images(filename: str):
    """Serve public image files through Flask so the local editor can preview them."""

    return send_from_directory(PUBLIC_DIR / "images", filename)
