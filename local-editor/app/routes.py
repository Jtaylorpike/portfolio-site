"""HTTP routes for the local portfolio editor.

The frontend talks to these endpoints to load data, save JSON, save one image's
framing settings, import new images, and preview local image files.
"""

from __future__ import annotations

from flask import Blueprint, current_app, jsonify, render_template, request, send_from_directory

from .data_store import (
    DataValidationError,
    PUBLIC_DIR,
    get_current_data,
    get_current_about_photos,
    get_current_about_copy,
    get_current_gallery_curation,
    get_current_gallery_room,
    get_current_site_seo,
    get_current_site_copy,
    get_gallery_curation_status,
    list_data_backups,
    restore_data_backup,
    save_full_data,
    save_about_photos,
    save_gallery_curation,
    save_gallery_curation_wall,
    save_gallery_room,
    save_image_updates,
    save_site_seo,
    save_site_settings,
    rename_image_id,
)
from .image_importer import import_reviewed_images_from_request
from .about_importer import import_reviewed_about_photos_from_request


bp = Blueprint("editor_routes", __name__)


@bp.route("/")
def editor_page():
    """Serve the local editor HTML shell."""

    return render_template(
        "editor.html",
        editor_api_base=current_app.config.get("EDITOR_API_BASE", ""),
    )


@bp.route("/api/data")
def get_data():
    """Return normalized JSON data for the editor frontend."""

    try:
        categories, images, hero_slides = get_current_data()
        gallery_curation = get_current_gallery_curation(images)
        gallery_room = get_current_gallery_room()
        about_photos = get_current_about_photos()
        about_copy = get_current_about_copy()
        site_seo = get_current_site_seo()
        site_copy = get_current_site_copy()
    except DataValidationError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(
        {
            "categories": categories,
            "images": images,
            "heroSlides": hero_slides,
            "galleryCuration": gallery_curation,
            "galleryCurationStatus": get_gallery_curation_status(images, gallery_curation),
            "galleryRoom": gallery_room,
            "aboutPhotos": about_photos,
            "aboutCopy": about_copy,
            "siteSeo": site_seo,
            "siteCopy": site_copy,
        }
    )


@bp.route("/api/site-seo", methods=["POST"])
def save_site_seo_data():
    """Validate and save global and route-level SEO metadata."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict) or not isinstance(payload.get("siteSeo"), dict):
        return jsonify({"error": "siteSeo must be an object."}), 400

    try:
        site_seo, backup = save_site_seo(payload["siteSeo"])
    except DataValidationError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify({"ok": True, "siteSeo": site_seo, "backup": backup})


@bp.route("/api/site-settings", methods=["POST"])
def save_site_settings_data():
    """Save portfolio metadata plus entry-screen and homepage copy."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict) or not isinstance(payload.get("siteSeo"), dict) or not isinstance(payload.get("siteCopy"), dict):
        return jsonify({"error": "siteSeo and siteCopy must be objects."}), 400

    try:
        site_seo, site_copy, backup = save_site_settings(payload["siteSeo"], payload["siteCopy"])
    except DataValidationError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify({"ok": True, "siteSeo": site_seo, "siteCopy": site_copy, "backup": backup})


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
    raw_about_photos = payload.get("aboutPhotos")
    raw_about_copy = payload.get("aboutCopy")

    if not isinstance(raw_categories, list):
        return jsonify({"error": "categories must be a list."}), 400

    if not isinstance(raw_images, list):
        return jsonify({"error": "images must be a list."}), 400

    if not isinstance(raw_hero_slides, list):
        return jsonify({"error": "heroSlides must be a list."}), 400

    if raw_about_photos is not None and not isinstance(raw_about_photos, list):
        return jsonify({"error": "aboutPhotos must be a list."}), 400

    if raw_about_copy is not None and not isinstance(raw_about_copy, dict):
        return jsonify({"error": "aboutCopy must be an object."}), 400

    try:
        categories, images, hero_slides, about_photos, about_copy, backup = save_full_data(
            raw_categories,
            raw_images,
            raw_hero_slides,
            raw_about_photos,
            raw_about_copy,
        )
    except DataValidationError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(
        {
            "ok": True,
            "categories": categories,
            "images": images,
            "heroSlides": hero_slides,
            "galleryCuration": get_current_gallery_curation(images),
            "galleryCurationStatus": get_gallery_curation_status(images),
            "galleryRoom": get_current_gallery_room(),
            "aboutPhotos": about_photos,
            "aboutCopy": about_copy,
            "backup": backup,
            "categoryCount": len(categories),
            "imageCount": len(images),
            "heroSlideCount": len(hero_slides),
            "aboutPhotoCount": len(about_photos),
        }
    )


@bp.route("/api/about-photos", methods=["POST"])
def save_about_photos_data():
    """Save only About photo records without rewriting unrelated editor data."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict) or not isinstance(payload.get("aboutPhotos"), list):
        return jsonify({"error": "aboutPhotos must be a list."}), 400

    try:
        about_photos, backup = save_about_photos(payload["aboutPhotos"])
    except DataValidationError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify({
        "ok": True,
        "aboutPhotos": about_photos,
        "backup": backup,
        "aboutPhotoCount": len(about_photos),
    })


@bp.route("/api/gallery-curation", methods=["POST"])
def save_gallery_curation_data():
    """Validate and save 3D gallery wall/artwork curation controls."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid JSON payload."}), 400

    raw_gallery_curation = payload.get("galleryCuration")

    if not isinstance(raw_gallery_curation, list):
        return jsonify({"error": "galleryCuration must be a list."}), 400

    try:
        categories, images, hero_slides, gallery_curation, backup = save_gallery_curation(raw_gallery_curation)
    except DataValidationError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(
        {
            "ok": True,
            "categories": categories,
            "images": images,
            "heroSlides": hero_slides,
            "galleryCuration": gallery_curation,
            "galleryCurationStatus": get_gallery_curation_status(images, gallery_curation),
            "galleryRoom": get_current_gallery_room(),
            "backup": backup,
            "galleryCurationCount": len(gallery_curation),
        }
    )


@bp.route("/api/gallery-curation/wall", methods=["POST"])
def save_single_gallery_curation_wall():
    """Validate and save one 3D gallery wall/artwork curation row."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid JSON payload."}), 400

    raw_wall_record = payload.get("wall")

    if not isinstance(raw_wall_record, dict):
        return jsonify({"error": "wall must be an object."}), 400

    try:
        categories, images, hero_slides, gallery_curation, backup = save_gallery_curation_wall(raw_wall_record)
    except DataValidationError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(
        {
            "ok": True,
            "categories": categories,
            "images": images,
            "heroSlides": hero_slides,
            "galleryCuration": gallery_curation,
            "galleryCurationStatus": get_gallery_curation_status(images, gallery_curation),
            "galleryRoom": get_current_gallery_room(),
            "backup": backup,
            "galleryCurationCount": len(gallery_curation),
            "updatedWallId": raw_wall_record.get("wallId"),
        }
    )


@bp.route("/api/gallery-room", methods=["POST"])
def save_gallery_room_data():
    """Validate and save modular gallery room and hallway records."""

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not isinstance(payload.get("galleryRoom"), dict):
        return jsonify({"error": "galleryRoom must be an object."}), 400

    try:
        gallery_room, backup = save_gallery_room(payload["galleryRoom"])
    except DataValidationError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify({
        "ok": True,
        "galleryRoom": gallery_room,
        "backup": backup,
    })


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
            "galleryCuration": get_current_gallery_curation(images),
            "galleryCurationStatus": get_gallery_curation_status(images),
            "galleryRoom": get_current_gallery_room(),
            "updatedImage": updated_image,
            "backup": backup,
            "categoryCount": len(categories),
            "imageCount": len(images),
            "heroSlideCount": len(hero_slides),
        }
    )


@bp.route("/api/rename-image-id", methods=["POST"])
def rename_image_record_id():
    """Rename one image ID and its portfolio rendition files."""

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid JSON payload."}), 400

    current_image_id = payload.get("currentImageId")
    new_image_id = payload.get("newImageId")
    image_updates = payload.get("imageUpdates")

    if not isinstance(current_image_id, str) or not current_image_id.strip():
        return jsonify({"error": "currentImageId must be a non-empty string."}), 400

    if not isinstance(new_image_id, str) or not new_image_id.strip():
        return jsonify({"error": "newImageId must be a non-empty string."}), 400

    try:
        categories, images, hero_slides, updated_image, backup, file_moves = rename_image_id(
            current_image_id.strip(),
            new_image_id.strip(),
            image_updates,
        )
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
            "galleryCuration": get_current_gallery_curation(images),
            "galleryCurationStatus": get_gallery_curation_status(images),
            "galleryRoom": get_current_gallery_room(),
            "updatedImage": updated_image,
            "backup": backup,
            "fileMoves": file_moves,
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
            "galleryCuration": get_current_gallery_curation(images),
            "galleryCurationStatus": get_gallery_curation_status(images),
            "galleryRoom": get_current_gallery_room(),
            "aboutPhotos": get_current_about_photos(),
            "aboutCopy": get_current_about_copy(),
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

    if status_code == 200 and isinstance(response, dict):
        images = response.get("images") if isinstance(response.get("images"), list) else []
        gallery_curation = get_current_gallery_curation(images)
        response["galleryCuration"] = gallery_curation
        response["galleryCurationStatus"] = get_gallery_curation_status(images, gallery_curation)
        response["galleryRoom"] = get_current_gallery_room()
        response["aboutPhotos"] = get_current_about_photos()
        response["aboutCopy"] = get_current_about_copy()

    return jsonify(response), status_code


@bp.route("/api/about-photos/import", methods=["POST"])
def import_reviewed_about_photos():
    """Import reviewed image files into the separate About page image folders."""

    response, status_code = import_reviewed_about_photos_from_request(request)

    if status_code == 200 and isinstance(response, dict):
        response["aboutCopy"] = get_current_about_copy()

    return jsonify(response), status_code


@bp.route("/images/<path:filename>")
def serve_images(filename: str):
    """Serve public image files through Flask so the local editor can preview them."""

    return send_from_directory(PUBLIC_DIR / "images", filename)
