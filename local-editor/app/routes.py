from __future__ import annotations

from flask import Blueprint, jsonify, render_template, request, send_from_directory

from .data_store import PUBLIC_DIR, get_current_data, save_full_data, save_image_updates
from .image_importer import import_reviewed_images_from_request


bp = Blueprint("editor_routes", __name__)


@bp.route("/")
def editor_page():
    return render_template("editor.html")


@bp.route("/api/data")
def get_data():
    categories, images, hero_slides = get_current_data()

    return jsonify(
        {
            "categories": categories,
            "images": images,
            "heroSlides": hero_slides,
        }
    )


@bp.route("/api/save", methods=["POST"])
def save_data():
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

    categories, images, hero_slides = save_full_data(
        raw_categories,
        raw_images,
        raw_hero_slides,
    )

    return jsonify(
        {
            "ok": True,
            "categories": categories,
            "images": images,
            "heroSlides": hero_slides,
            "categoryCount": len(categories),
            "imageCount": len(images),
            "heroSlideCount": len(hero_slides),
        }
    )


@bp.route("/api/image-updates", methods=["POST"])
def update_image_record():
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
        categories, images, hero_slides, updated_image = save_image_updates(image_id.strip(), updates)
    except ValueError as error:
        return jsonify({"error": str(error)}), 404

    return jsonify(
        {
            "ok": True,
            "categories": categories,
            "images": images,
            "heroSlides": hero_slides,
            "updatedImage": updated_image,
            "categoryCount": len(categories),
            "imageCount": len(images),
            "heroSlideCount": len(hero_slides),
        }
    )


@bp.route("/api/import-reviewed", methods=["POST"])
def import_reviewed_images():
    response, status_code = import_reviewed_images_from_request(request)

    return jsonify(response), status_code


@bp.route("/images/<path:filename>")
def serve_images(filename: str):
    return send_from_directory(PUBLIC_DIR / "images", filename)