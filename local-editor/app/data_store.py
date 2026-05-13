"""Read, validate, back up, and write the portfolio JSON data files.

The local Flask editor is allowed to modify the same JSON files that the public
Vite site imports at build time. This module is the safety layer between the
browser editor and those source files. It normalizes incoming data, validates the
result, creates a timestamped backup, and then writes clean JSON back to disk.
"""

from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .asset_manager import relocate_imported_image_assets
from .utils import clean_string, slugify


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "src" / "data"
PUBLIC_DIR = PROJECT_ROOT / "public"
BACKUP_DIR = PROJECT_ROOT / "local-editor" / "backups"

CATEGORIES_PATH = DATA_DIR / "categories.json"
GALLERY_IMAGES_PATH = DATA_DIR / "galleryImages.json"
HERO_SLIDES_PATH = DATA_DIR / "heroSlides.json"
GALLERY_CURATION_PATH = DATA_DIR / "galleryCuration.json"
GALLERY_ROOM_PATH = DATA_DIR / "galleryRoom.json"

DEFAULT_CATEGORIES = [
    {"id": "climbing", "label": "Climbing"},
    {"id": "landscape", "label": "Landscape"},
    {"id": "personal", "label": "Personal"},
]

GALLERY_DEFAULT_SIZE_BY_STYLE = {
    "landscape": 1.0,
    "portrait": 1.32,
    "square": 1.08,
}

GALLERY_MAX_SIZE_BY_STYLE = {
    "landscape": 1.0,
    "portrait": 1.32,
    "square": 1.16,
}

GALLERY_MIN_SIZE = 0.55

SUPPORTED_FIT_MODES = {"cover", "contain"}
SUPPORTED_FRAME_STYLES = {"auto", "landscape", "portrait", "square"}
SUPPORTED_ORIENTATIONS = {"landscape", "portrait", "square"}
IMAGE_ID_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
PORTFOLIO_RENDITION_FOLDERS = {
    "src": "display",
    "thumbSrc": "thumb",
    "textureSrc": "texture",
    "fullSrc": "full",
}
POSITION_PATTERN = re.compile(r"^\d{1,3}(?:\.\d+)?%\s+\d{1,3}(?:\.\d+)?%$")
SUPPORTED_WALL_TYPES = {
    "feature-wall",
    "wide-display-wall",
    "standard-display-wall",
    "compact-display-wall",
    "narrow-transition-wall",
}
LEGACY_WALL_TYPES = {
    "entry-feature-wall": "feature-wall",
    "transition-guide-wall": "wide-display-wall",
    "outer-gallery-wall": "wide-display-wall",
    "inner-partition-wall": "standard-display-wall",
    "rear-gallery-wall": "wide-display-wall",
    "unassigned-wall": "narrow-transition-wall",
}
SUPPORTED_PLAQUE_SIDES = {"auto", "left", "right", "none"}
GALLERY_POSITION_MIN = -16.0
GALLERY_POSITION_MAX = 16.0
SUPPORTED_WALL_ROTATIONS_DEGREES = {-180.0, -135.0, -90.0, -45.0, 0.0, 45.0, 90.0, 135.0, 180.0}
GALLERY_GRID_CELL_METERS = 0.5
GALLERY_WALL_FOOTPRINTS = {
    "feature-wall": {"length_cells": 13, "thickness_cells": 1},
    "wide-display-wall": {"length_cells": 11, "thickness_cells": 1},
    "standard-display-wall": {"length_cells": 7, "thickness_cells": 1},
    "compact-display-wall": {"length_cells": 5, "thickness_cells": 1},
    "narrow-transition-wall": {"length_cells": 3, "thickness_cells": 1},
}

DEFAULT_GALLERY_ROOM = {
    "schemaVersion": 1,
    "id": "main-gallery-room",
    "label": "Main gallery room",
    "shape": "rectangle",
    "grid": {
        "cellMeters": GALLERY_GRID_CELL_METERS,
        "minX": GALLERY_POSITION_MIN,
        "maxX": GALLERY_POSITION_MAX,
        "minZ": GALLERY_POSITION_MIN,
        "maxZ": GALLERY_POSITION_MAX,
    },
    "floor": {"width": 34.0, "depth": 34.0, "color": "#d8d0c3"},
    "shell": {"height": 3.9, "wallThickness": 0.34, "ceilingThickness": 0.12},
    "movementBounds": {"minX": -16.3, "maxX": 16.3, "minZ": -16.3, "maxZ": 16.3},
    "start": {"position": [0.0, 1.65, 13.4], "yaw": 0.0},
}

SUPPORTED_GALLERY_ROOM_SHAPES = {"rectangle", "l-shaped", "custom-footprint"}


def clean_number(value: Any, fallback: float, minimum: float | None = None, maximum: float | None = None) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = fallback

    if minimum is not None:
        number = max(minimum, number)

    if maximum is not None:
        number = min(maximum, number)

    return round(number, 4)


def normalize_ordered_bounds(
    raw_min: Any,
    raw_max: Any,
    fallback_min: float,
    fallback_max: float,
) -> tuple[float, float]:
    minimum = clean_number(raw_min, fallback_min)
    maximum = clean_number(raw_max, fallback_max)

    if minimum >= maximum:
        return fallback_min, fallback_max

    return minimum, maximum


def normalize_gallery_room(raw_room: Any) -> dict[str, Any]:
    """Normalize the data-backed virtual gallery room footprint settings."""

    if not isinstance(raw_room, dict):
        raw_room = {}

    grid = raw_room.get("grid") if isinstance(raw_room.get("grid"), dict) else {}
    floor = raw_room.get("floor") if isinstance(raw_room.get("floor"), dict) else {}
    shell = raw_room.get("shell") if isinstance(raw_room.get("shell"), dict) else {}
    movement = raw_room.get("movementBounds") if isinstance(raw_room.get("movementBounds"), dict) else {}
    start = raw_room.get("start") if isinstance(raw_room.get("start"), dict) else {}

    grid_min_x, grid_max_x = normalize_ordered_bounds(
        grid.get("minX"),
        grid.get("maxX"),
        DEFAULT_GALLERY_ROOM["grid"]["minX"],
        DEFAULT_GALLERY_ROOM["grid"]["maxX"],
    )
    grid_min_z, grid_max_z = normalize_ordered_bounds(
        grid.get("minZ"),
        grid.get("maxZ"),
        DEFAULT_GALLERY_ROOM["grid"]["minZ"],
        DEFAULT_GALLERY_ROOM["grid"]["maxZ"],
    )
    movement_min_x, movement_max_x = normalize_ordered_bounds(
        movement.get("minX"),
        movement.get("maxX"),
        DEFAULT_GALLERY_ROOM["movementBounds"]["minX"],
        DEFAULT_GALLERY_ROOM["movementBounds"]["maxX"],
    )
    movement_min_z, movement_max_z = normalize_ordered_bounds(
        movement.get("minZ"),
        movement.get("maxZ"),
        DEFAULT_GALLERY_ROOM["movementBounds"]["minZ"],
        DEFAULT_GALLERY_ROOM["movementBounds"]["maxZ"],
    )

    shape = clean_string(raw_room.get("shape")) or DEFAULT_GALLERY_ROOM["shape"]

    if shape not in SUPPORTED_GALLERY_ROOM_SHAPES:
        shape = DEFAULT_GALLERY_ROOM["shape"]

    start_position = start.get("position")

    if not isinstance(start_position, list) or len(start_position) < 3:
        start_position = DEFAULT_GALLERY_ROOM["start"]["position"]

    return {
        "schemaVersion": int(clean_number(raw_room.get("schemaVersion"), DEFAULT_GALLERY_ROOM["schemaVersion"], 1)),
        "id": slugify(clean_string(raw_room.get("id")) or DEFAULT_GALLERY_ROOM["id"]),
        "label": clean_string(raw_room.get("label")) or DEFAULT_GALLERY_ROOM["label"],
        "shape": shape,
        "grid": {
            "cellMeters": clean_number(grid.get("cellMeters"), DEFAULT_GALLERY_ROOM["grid"]["cellMeters"], 0.25, 2.0),
            "minX": grid_min_x,
            "maxX": grid_max_x,
            "minZ": grid_min_z,
            "maxZ": grid_max_z,
        },
        "floor": {
            "width": clean_number(floor.get("width"), DEFAULT_GALLERY_ROOM["floor"]["width"], 4.0),
            "depth": clean_number(floor.get("depth"), DEFAULT_GALLERY_ROOM["floor"]["depth"], 4.0),
            "color": clean_string(floor.get("color")) or DEFAULT_GALLERY_ROOM["floor"]["color"],
        },
        "shell": {
            "height": clean_number(shell.get("height"), DEFAULT_GALLERY_ROOM["shell"]["height"], 2.4, 8.0),
            "wallThickness": clean_number(shell.get("wallThickness"), DEFAULT_GALLERY_ROOM["shell"]["wallThickness"], 0.05, 1.0),
            "ceilingThickness": clean_number(shell.get("ceilingThickness"), DEFAULT_GALLERY_ROOM["shell"]["ceilingThickness"], 0.02, 1.0),
        },
        "movementBounds": {
            "minX": movement_min_x,
            "maxX": movement_max_x,
            "minZ": movement_min_z,
            "maxZ": movement_max_z,
        },
        "start": {
            "position": [
                clean_number(start_position[0], DEFAULT_GALLERY_ROOM["start"]["position"][0]),
                clean_number(start_position[1], DEFAULT_GALLERY_ROOM["start"]["position"][1], 0.2, 3.2),
                clean_number(start_position[2], DEFAULT_GALLERY_ROOM["start"]["position"][2]),
            ],
            "yaw": clean_number(start.get("yaw"), DEFAULT_GALLERY_ROOM["start"]["yaw"]),
        },
    }


def get_current_gallery_room() -> dict[str, Any]:
    """Read the current room footprint settings, falling back to the default room."""

    return normalize_gallery_room(read_json(GALLERY_ROOM_PATH))


# Maps earlier semantic/gallery-zone wall labels into the current physical
# wall-block type model. The editor now treats wall type as scale/shape metadata
# because room placement will continue to evolve.
def legacy_wall_section_to_type(value: str) -> str:
    legacy = clean_string(value)

    if legacy in {"Entry", "Personal"}:
        return "feature-wall"

    if legacy in {"Climbing", "Landscape", "Rear Wall"}:
        return "wide-display-wall"

    return "standard-display-wall"


def make_unique_image_id(requested_image_id: str, existing_ids: set[str], current_image_id: str = "") -> str:
    """Return a safe, unique image ID for the controlled rename workflow.

    The browser sends a suggested title-based ID, but the backend remains the
    authority. This mirrors the import review behavior by slugifying the value
    and appending a numeric suffix only when another image already owns the ID.
    """

    base_id = slugify(clean_string(requested_image_id))
    current_image_id = clean_string(current_image_id)

    if current_image_id and base_id == current_image_id:
        return current_image_id

    candidate = base_id
    count = 2

    while candidate in existing_ids:
        candidate = f"{base_id}-{count}"
        count += 1

    return candidate


def make_portfolio_rendition_url(field_name: str, image_id: str) -> str:
    """Build the canonical public URL for one image rendition field."""

    folder_name = PORTFOLIO_RENDITION_FOLDERS.get(field_name)

    if not folder_name:
        raise DataValidationError(f"Unsupported rendition field for image ID rename: {field_name}")

    return f"/images/portfolio/{folder_name}/{image_id}.webp"


def resolve_public_url_path(url: str) -> Path:
    """Resolve a public asset URL to a safe path inside public/."""

    clean_url = clean_string(url)

    if not clean_url.startswith("/"):
        raise DataValidationError(f"Portfolio image path must start with '/': {clean_url}")

    relative_path = clean_url.lstrip("/")
    resolved_path = (PUBLIC_DIR / relative_path).resolve()
    public_root = PUBLIC_DIR.resolve()

    if public_root not in resolved_path.parents and resolved_path != public_root:
        raise DataValidationError(f"Portfolio image path is outside public/: {clean_url}")

    return resolved_path


def get_rename_file_plan(image: dict[str, Any], new_image_id: str) -> list[dict[str, Any]]:
    """Plan JSON path updates and filesystem moves for all portfolio renditions."""

    file_plan: list[dict[str, Any]] = []

    for field_name in ["src", "thumbSrc", "textureSrc", "fullSrc"]:
        current_url = clean_string(image.get(field_name))

        if not current_url:
            raise DataValidationError(f"Image '{image.get('id', 'unknown')}' is missing {field_name}.")

        target_url = make_portfolio_rendition_url(field_name, new_image_id)
        current_path = resolve_public_url_path(current_url)
        target_path = resolve_public_url_path(target_url)

        if current_path == target_path:
            file_plan.append(
                {
                    "field": field_name,
                    "currentUrl": current_url,
                    "targetUrl": target_url,
                    "currentPath": current_path,
                    "targetPath": target_path,
                    "moveRequired": False,
                }
            )
            continue

        if not current_path.exists():
            raise DataValidationError(f"Cannot rename missing rendition file: {current_url}")

        if target_path.exists():
            raise DataValidationError(f"Cannot rename image ID because target rendition already exists: {target_url}")

        file_plan.append(
            {
                "field": field_name,
                "currentUrl": current_url,
                "targetUrl": target_url,
                "currentPath": current_path,
                "targetPath": target_path,
                "moveRequired": True,
            }
        )

    return file_plan


def apply_rename_file_plan(file_plan: list[dict[str, Any]]) -> None:
    """Move rendition files for an image ID rename and roll back on failure."""

    moved_items: list[dict[str, Any]] = []

    try:
        for item in file_plan:
            if not item.get("moveRequired"):
                continue

            current_path = item["currentPath"]
            target_path = item["targetPath"]
            target_path.parent.mkdir(parents=True, exist_ok=True)
            current_path.rename(target_path)
            moved_items.append(item)
    except OSError as error:
        for moved_item in reversed(moved_items):
            current_path = moved_item["currentPath"]
            target_path = moved_item["targetPath"]

            try:
                if target_path.exists() and not current_path.exists():
                    target_path.rename(current_path)
            except OSError:
                pass

        raise DataValidationError(f"Could not rename portfolio rendition files: {error}") from error


class DataValidationError(ValueError):
    """Raised when normalized editor data would create an unsafe JSON state."""


# Reads a JSON file from disk and returns an empty list when the file does not exist yet.
def read_json(path: Path) -> Any:
    if not path.exists():
        return []

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


# Writes JSON with stable indentation so Git diffs remain readable.
def write_json(path: Path, data: Any) -> None:
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


# Creates a safe folder/file name from a human-readable save reason.
def make_backup_slug(reason: str) -> str:
    return slugify(reason or "editor-save")


# Creates timestamped backup copies before the editor changes source JSON files.
def create_data_backup(reason: str) -> dict[str, Any]:
    """Copy the current JSON files into a dated backup folder.

    A backup is created before every editor save. The files are grouped in one
    folder so a future restore can recover categories, images, and hero slides
    from the same point in time.
    """

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup_name = f"{timestamp}-{make_backup_slug(reason)}"
    backup_path = BACKUP_DIR / backup_name
    backup_path.mkdir(parents=True, exist_ok=True)

    backed_up_files: list[str] = []

    for source_path in [CATEGORIES_PATH, GALLERY_IMAGES_PATH, HERO_SLIDES_PATH, GALLERY_CURATION_PATH, GALLERY_ROOM_PATH]:
        if not source_path.exists():
            continue

        destination_path = backup_path / source_path.name
        shutil.copy2(source_path, destination_path)
        backed_up_files.append(source_path.name)

    manifest = {
        "reason": reason,
        "createdAtUtc": datetime.now(timezone.utc).isoformat(),
        "backupFolder": backup_name,
        "files": backed_up_files,
    }

    write_json(backup_path / "manifest.json", manifest)

    return manifest


# Accepts only backup folder names created by the editor.
def is_safe_backup_name(name: str) -> bool:
    """Reject path traversal and other unsafe backup names.

    Restore requests come from the browser, so the backend must treat the backup
    folder name as untrusted input. This check ensures a restore request can only
    target a simple folder name inside local-editor/backups/.
    """

    return bool(re.fullmatch(r"[A-Za-z0-9._-]+", name or ""))


# Resolves a backup folder name into an absolute path inside the backups folder.
def get_backup_path(backup_name: str) -> Path:
    """Return the backup folder path after validating the folder name."""

    clean_backup_name = clean_string(backup_name)

    if not is_safe_backup_name(clean_backup_name):
        raise ValueError("Backup name is not valid.")

    backup_path = BACKUP_DIR / clean_backup_name

    if not backup_path.exists() or not backup_path.is_dir():
        raise ValueError(f"Backup not found: {clean_backup_name}")

    return backup_path


# Reads optional backup metadata written when the backup was created.
def read_backup_manifest(backup_path: Path) -> dict[str, Any]:
    """Read manifest.json when available and return a safe fallback otherwise."""

    manifest_path = backup_path / "manifest.json"

    if not manifest_path.exists():
        return {}

    try:
        manifest = read_json(manifest_path)
    except (json.JSONDecodeError, OSError):
        return {}

    if isinstance(manifest, dict):
        return manifest

    return {}


# Builds one summary card for the Backups page in the editor.
def summarize_backup_folder(backup_path: Path) -> dict[str, Any]:
    """Return browser-friendly metadata for one backup folder."""

    manifest = read_backup_manifest(backup_path)
    files = [
        file_name
        for file_name in ["categories.json", "galleryImages.json", "heroSlides.json", "galleryCuration.json", "galleryRoom.json"]
        if (backup_path / file_name).exists()
    ]

    created_at_utc = clean_string(manifest.get("createdAtUtc"))

    if not created_at_utc:
        created_at_utc = datetime.fromtimestamp(
            backup_path.stat().st_mtime,
            timezone.utc,
        ).isoformat()

    return {
        "backupFolder": backup_path.name,
        "reason": clean_string(manifest.get("reason")) or "backup",
        "createdAtUtc": created_at_utc,
        "files": files,
        "canRestore": all(file_name in files for file_name in ["categories.json", "galleryImages.json", "heroSlides.json", "galleryCuration.json", "galleryRoom.json"]),
    }


# Lists all available JSON backup folders for the editor UI.
def list_data_backups() -> list[dict[str, Any]]:
    """Return backup folders newest-first.

    The UI uses this list to show restore options. Folders without all three JSON
    files are still shown for transparency, but the Restore button is disabled.
    """

    if not BACKUP_DIR.exists():
        return []

    backups = [
        summarize_backup_folder(path)
        for path in BACKUP_DIR.iterdir()
        if path.is_dir()
    ]

    return sorted(
        backups,
        key=lambda item: (clean_string(item.get("createdAtUtc")), clean_string(item.get("backupFolder"))),
        reverse=True,
    )


# Loads and normalizes the three JSON files stored inside one backup folder.
def load_backup_data(backup_path: Path) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]]]:
    """Read a backup folder and validate that it can safely restore the site."""

    required_paths = [
        backup_path / "categories.json",
        backup_path / "galleryImages.json",
        backup_path / "heroSlides.json",
    ]

    missing_files = [path.name for path in required_paths if not path.exists()]

    if missing_files:
        raise DataValidationError(f"Backup is missing required files: {', '.join(missing_files)}")

    raw_categories = read_json(backup_path / "categories.json")
    raw_images = read_json(backup_path / "galleryImages.json")
    raw_hero_slides = read_json(backup_path / "heroSlides.json")

    if not isinstance(raw_categories, list):
        raise DataValidationError("Backup categories.json must contain a list.")

    if not isinstance(raw_images, list):
        raise DataValidationError("Backup galleryImages.json must contain a list.")

    if not isinstance(raw_hero_slides, list):
        raise DataValidationError("Backup heroSlides.json must contain a list.")

    categories = normalize_categories(raw_categories)
    valid_category_ids = {category["id"] for category in categories}
    fallback_category_id = categories[0]["id"]

    images = [
        normalize_image(image, valid_category_ids, fallback_category_id)
        for image in raw_images
        if isinstance(image, dict)
    ]

    hero_slides = [
        normalize_hero_slide(slide, valid_category_ids, fallback_category_id)
        for slide in raw_hero_slides
        if isinstance(slide, dict)
    ]

    # Restore validation should be stricter than normal loading. If a backup has
    # a broken hero slide reference, the editor should refuse to restore it
    # instead of copying the exact broken backup back into the project.
    validate_project_data(categories, images, hero_slides)

    return categories, images, hero_slides


# Restores one backup after creating a new backup of the current state.
def restore_data_backup(backup_name: str) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]], dict[str, Any], dict[str, Any]]:
    """Replace the current JSON files with a validated backup.

    The restore action is intentionally reversible. Before overwriting anything,
    the current JSON files are backed up into a new pre-restore folder.
    """

    backup_path = get_backup_path(backup_name)
    categories, images, hero_slides = load_backup_data(backup_path)
    safety_backup = create_data_backup(f"pre-restore-{backup_path.name}")

    # Copy the backup files back exactly as they were saved. Validation above
    # proves they can be loaded safely, and exact copying avoids unnecessary Git
    # diffs from reformatting or re-normalizing older backups.
    shutil.copy2(backup_path / "categories.json", CATEGORIES_PATH)
    shutil.copy2(backup_path / "galleryImages.json", GALLERY_IMAGES_PATH)
    shutil.copy2(backup_path / "heroSlides.json", HERO_SLIDES_PATH)

    backup_gallery_curation_path = backup_path / "galleryCuration.json"

    if backup_gallery_curation_path.exists():
        raw_gallery_curation = read_json(backup_gallery_curation_path)
        gallery_curation = normalize_gallery_curation(raw_gallery_curation, {image["id"] for image in images})
    else:
        gallery_curation = get_current_gallery_curation(images)

    write_json(GALLERY_CURATION_PATH, gallery_curation)

    backup_gallery_room_path = backup_path / "galleryRoom.json"

    if backup_gallery_room_path.exists():
        write_json(GALLERY_ROOM_PATH, normalize_gallery_room(read_json(backup_gallery_room_path)))

    restored_backup = summarize_backup_folder(backup_path)

    return categories, images, hero_slides, restored_backup, safety_backup


# Cleans category records and guarantees each category has a unique ID.
def normalize_categories(raw_categories: list[Any]) -> list[dict[str, str]]:
    categories: list[dict[str, str]] = []
    used_ids: set[str] = set()

    for raw_category in raw_categories:
        if not isinstance(raw_category, dict):
            continue

        label = clean_string(raw_category.get("label"))
        category_id = slugify(clean_string(raw_category.get("id")) or label)

        if not label:
            label = category_id.replace("-", " ").title()

        original_id = category_id
        count = 2

        while category_id in used_ids:
            category_id = f"{original_id}-{count}"
            count += 1

        used_ids.add(category_id)
        categories.append({"id": category_id, "label": label})

    if not categories:
        return DEFAULT_CATEGORIES

    return categories


# Converts incoming values into positive integers for image dimensions.
def clean_positive_int(value: Any) -> int | None:
    try:
        number = int(float(value))
    except (TypeError, ValueError):
        return None

    if number <= 0:
        return None

    return number


# Converts incoming values into positive floats for aspect ratios and sizes.
def clean_positive_float(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    if number <= 0:
        return None

    return round(number, 6)


# Resolves auto frame style into the concrete shape used for size limits.
def resolve_gallery_frame_style(frame_style: str, orientation: str | None) -> str:
    if frame_style in {"landscape", "portrait", "square"}:
        return frame_style

    if orientation in {"portrait", "square"}:
        return orientation

    return "landscape"


# Keeps virtual gallery frame size inside the allowed editor range.
def clean_gallery_size(
    value: Any,
    frame_style: str = "auto",
    orientation: str | None = None,
) -> float:
    resolved_style = resolve_gallery_frame_style(frame_style, orientation)
    default_size = GALLERY_DEFAULT_SIZE_BY_STYLE[resolved_style]
    max_size = GALLERY_MAX_SIZE_BY_STYLE[resolved_style]

    try:
        size = float(value)
    except (TypeError, ValueError):
        return default_size

    if size <= 0:
        return default_size

    return round(min(max_size, max(GALLERY_MIN_SIZE, size)), 3)


# Infers image orientation from measured pixel dimensions.
def get_orientation_from_dimensions(width: int | None, height: int | None) -> str | None:
    if not width or not height:
        return None

    aspect_ratio = width / height

    if abs(aspect_ratio - 1) <= 0.04:
        return "square"

    if aspect_ratio > 1:
        return "landscape"

    return "portrait"


# Uses a valid saved orientation or falls back to measured dimensions.
def normalize_orientation(value: Any, width: int | None, height: int | None) -> str | None:
    orientation = clean_string(value)

    if orientation in SUPPORTED_ORIENTATIONS:
        return orientation

    return get_orientation_from_dimensions(width, height)


# Normalizes virtual gallery fit mode to cover or contain.
def normalize_gallery_fit_mode(value: Any) -> str:
    fit_mode = clean_string(value)

    if fit_mode == "contain":
        return "contain"

    return "cover"


# Normalizes hero fit mode to cover or contain.
def normalize_hero_fit_mode(value: Any) -> str:
    fit_mode = clean_string(value)

    if fit_mode == "contain":
        return "contain"

    return "cover"


# Normalizes frame style to auto, landscape, portrait, or square.
def normalize_frame_style(value: Any) -> str:
    frame_style = clean_string(value)

    if frame_style in SUPPORTED_FRAME_STYLES:
        return frame_style

    return "auto"


# Cleans an object-position value used by CSS crop controls.
def normalize_object_position(value: Any, fallback: str = "50% 50%") -> str:
    position = clean_string(value)

    if POSITION_PATTERN.match(position):
        return position

    return fallback


# Cleans one image record and preserves only supported fields.
def normalize_image(
    raw_image: dict[str, Any],
    valid_category_ids: set[str],
    fallback_category_id: str,
) -> dict[str, Any]:
    category = clean_string(raw_image.get("category"))

    if category not in valid_category_ids:
        category = fallback_category_id

    width = clean_positive_int(raw_image.get("imageWidth"))
    height = clean_positive_int(raw_image.get("imageHeight"))
    aspect_ratio = clean_positive_float(raw_image.get("imageAspectRatio"))

    if not aspect_ratio and width and height:
        aspect_ratio = round(width / height, 6)

    orientation = normalize_orientation(raw_image.get("imageOrientation"), width, height)

    image: dict[str, Any] = {
        "id": clean_string(raw_image.get("id")),
        "title": clean_string(raw_image.get("title")),
        "category": category,
        "year": clean_string(raw_image.get("year")),
        "location": clean_string(raw_image.get("location")),
        "note": clean_string(raw_image.get("note")),
        "src": clean_string(raw_image.get("src")),
        "alt": clean_string(raw_image.get("alt")),
    }

    if width:
        image["imageWidth"] = width

    if height:
        image["imageHeight"] = height

    if aspect_ratio:
        image["imageAspectRatio"] = aspect_ratio

    if orientation:
        image["imageOrientation"] = orientation

    for optional_field in ["thumbSrc", "textureSrc", "fullSrc"]:
        value = clean_string(raw_image.get(optional_field))

        if value:
            image[optional_field] = value

    image["thumbnailPosition"] = normalize_object_position(raw_image.get("thumbnailPosition"))
    image["heroPosition"] = normalize_object_position(raw_image.get("heroPosition"))
    image["galleryPosition"] = normalize_object_position(raw_image.get("galleryPosition"))

    gallery_frame_style = normalize_frame_style(raw_image.get("galleryFrameStyle"))

    image["heroFrameStyle"] = normalize_frame_style(raw_image.get("heroFrameStyle"))
    image["heroFitMode"] = normalize_hero_fit_mode(raw_image.get("heroFitMode"))
    image["galleryFitMode"] = normalize_gallery_fit_mode(raw_image.get("galleryFitMode"))
    image["galleryFrameStyle"] = gallery_frame_style
    image["gallerySize"] = clean_gallery_size(
        raw_image.get("gallerySize"),
        gallery_frame_style,
        orientation,
    )

    return image


# Returns True when an image is eligible for the fixed 16:9 homepage hero.
def is_landscape_hero_image(image: dict[str, Any] | None) -> bool:
    if not image:
        return False

    orientation = clean_string(image.get("imageOrientation"))

    if orientation in SUPPORTED_ORIENTATIONS:
        return orientation == "landscape"

    aspect_ratio = clean_positive_float(image.get("imageAspectRatio"))

    if aspect_ratio:
        return aspect_ratio > 1

    width = clean_positive_int(image.get("imageWidth"))
    height = clean_positive_int(image.get("imageHeight"))

    if width and height:
        return width > height

    return True


def filter_hero_slides_for_landscape_images(
    hero_slides: list[dict[str, str]],
    images: list[dict[str, Any]],
) -> list[dict[str, str]]:
    images_by_id = {image["id"]: image for image in images}

    return [
        slide
        for slide in hero_slides
        if is_landscape_hero_image(images_by_id.get(slide.get("imageId", "")))
    ]


# Cleans one hero slide record and validates its target category.
def normalize_hero_slide(
    raw_slide: dict[str, Any],
    valid_category_ids: set[str],
    fallback_category_id: str,
) -> dict[str, str]:
    target_category = clean_string(raw_slide.get("targetCategory"))

    if target_category not in valid_category_ids:
        target_category = fallback_category_id

    return {
        "imageId": clean_string(raw_slide.get("imageId")),
        "targetCategory": target_category,
    }


# Normalizes all project data immediately before writing JSON.
#
# This is intentionally repeated at the write boundary because some editor
# workflows create a new record directly and then call save_project_data().
# Without this final pass, an imported record can carry UI-only values such as
# "auto" into heroFitMode/galleryFitMode and fail validation.
def normalize_project_data_for_save(
    raw_categories: list[Any],
    raw_images: list[Any],
    raw_hero_slides: list[Any],
) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]]]:
    categories = normalize_categories(raw_categories)

    if not categories:
        categories = normalize_categories(DEFAULT_CATEGORIES)

    valid_category_ids = {category["id"] for category in categories}
    fallback_category_id = categories[0]["id"]

    images = [
        normalize_image(image, valid_category_ids, fallback_category_id)
        for image in raw_images
        if isinstance(image, dict)
    ]

    images = relocate_imported_image_assets(images)

    hero_slides = [
        normalize_hero_slide(slide, valid_category_ids, fallback_category_id)
        for slide in raw_hero_slides
        if isinstance(slide, dict)
    ]

    image_ids = {image["id"] for image in images}
    hero_slides = [slide for slide in hero_slides if slide["imageId"] in image_ids]
    hero_slides = filter_hero_slides_for_landscape_images(hero_slides, images)

    return categories, images, hero_slides


# Validates the normalized data before it is allowed to overwrite source JSON.
def validate_project_data(
    categories: list[dict[str, str]],
    images: list[dict[str, Any]],
    hero_slides: list[dict[str, str]],
) -> None:
    if not categories:
        raise DataValidationError("At least one category is required.")

    category_ids = [category.get("id", "") for category in categories]
    duplicate_category_ids = sorted({category_id for category_id in category_ids if category_ids.count(category_id) > 1})

    if duplicate_category_ids:
        raise DataValidationError(f"Duplicate category IDs: {', '.join(duplicate_category_ids)}")

    for category in categories:
        if not category.get("id") or not category.get("label"):
            raise DataValidationError("Every category needs both an ID and a label.")

    valid_category_ids = set(category_ids)
    image_ids = [image.get("id", "") for image in images]
    duplicate_image_ids = sorted({image_id for image_id in image_ids if image_ids.count(image_id) > 1})

    if duplicate_image_ids:
        raise DataValidationError(f"Duplicate image IDs: {', '.join(duplicate_image_ids)}")

    for image in images:
        image_id = clean_string(image.get("id")) or "unknown image"

        if not clean_string(image.get("id")):
            raise DataValidationError("Every image needs a non-empty ID.")

        if not IMAGE_ID_PATTERN.match(clean_string(image.get("id"))):
            raise DataValidationError(f"Image '{image_id}' ID must use lowercase letters, numbers, and hyphens only.")

        if not clean_string(image.get("title")):
            raise DataValidationError(f"Image '{image_id}' needs a title.")

        if image.get("category") not in valid_category_ids:
            raise DataValidationError(f"Image '{image_id}' has an invalid category.")

        if not clean_string(image.get("src")):
            raise DataValidationError(f"Image '{image_id}' needs a source path.")

        if not clean_string(image.get("alt")):
            raise DataValidationError(f"Image '{image_id}' needs alt text.")

        if image.get("heroFitMode") not in SUPPORTED_FIT_MODES:
            raise DataValidationError(f"Image '{image_id}' has an invalid hero fit mode.")

        if image.get("galleryFitMode") not in SUPPORTED_FIT_MODES:
            raise DataValidationError(f"Image '{image_id}' has an invalid gallery fit mode.")

        if image.get("heroFrameStyle") not in SUPPORTED_FRAME_STYLES:
            raise DataValidationError(f"Image '{image_id}' has an invalid hero frame style.")

        if image.get("galleryFrameStyle") not in SUPPORTED_FRAME_STYLES:
            raise DataValidationError(f"Image '{image_id}' has an invalid gallery frame style.")

    valid_image_ids = set(image_ids)
    images_by_id = {image["id"]: image for image in images}

    for slide in hero_slides:
        if slide.get("imageId") not in valid_image_ids:
            raise DataValidationError(f"Hero slide references a missing image: {slide.get('imageId')}")

        if slide.get("targetCategory") not in valid_category_ids:
            raise DataValidationError(f"Hero slide for '{slide.get('imageId')}' has an invalid target category.")

        if not is_landscape_hero_image(images_by_id.get(slide.get("imageId", ""))):
            raise DataValidationError(f"Hero slide must use a landscape image: {slide.get('imageId')}")


# Converts incoming values into booleans for gallery curation controls.
def clean_bool(value: Any, fallback: bool = True) -> bool:
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        lowered = value.strip().lower()

        if lowered in {"true", "1", "yes", "on", "active", "visible", "show"}:
            return True

        if lowered in {"false", "0", "no", "off", "hidden", "inactive", "hide"}:
            return False

    return fallback


# Converts incoming values into positive integers for curation ordering.
def clean_positive_order(value: Any, fallback: int) -> int:
    try:
        order = int(float(value))
    except (TypeError, ValueError):
        return fallback

    if order <= 0:
        return fallback

    return order


def clean_gallery_position(value: Any, fallback: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = fallback

    number = max(GALLERY_POSITION_MIN, min(GALLERY_POSITION_MAX, number))
    snapped = round(number / GALLERY_GRID_CELL_METERS) * GALLERY_GRID_CELL_METERS
    return round(snapped, 2)


def clean_gallery_rotation_degrees(value: Any, fallback: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = fallback

    while number > 180:
        number -= 360

    while number <= -180:
        number += 360

    # The map editor supports cardinal and 45-degree diagonal wall facings.
    closest = min(SUPPORTED_WALL_ROTATIONS_DEGREES, key=lambda candidate: abs(candidate - number))
    return 180.0 if closest == -180.0 else closest


# Normalizes one wall/artwork assignment row from galleryCuration.json.
def normalize_gallery_curation_record(
    raw_record: dict[str, Any],
    valid_image_ids: set[str],
    fallback_order: int,
) -> dict[str, Any]:
    wall_id = slugify(clean_string(raw_record.get("wallId")))
    artwork_id = clean_string(raw_record.get("artworkId"))
    wall_type = clean_string(raw_record.get("wallType"))
    plaque_side = clean_string(raw_record.get("plaqueSide"))
    position_x = clean_gallery_position(raw_record.get("positionX"), 0.0)
    position_z = clean_gallery_position(raw_record.get("positionZ"), 0.0)
    rotation_y_degrees = clean_gallery_rotation_degrees(raw_record.get("rotationYDegrees"), 0.0)

    if artwork_id and artwork_id not in valid_image_ids:
        artwork_id = ""

    if wall_type in LEGACY_WALL_TYPES:
        wall_type = LEGACY_WALL_TYPES[wall_type]

    if wall_type not in SUPPORTED_WALL_TYPES:
        wall_type = legacy_wall_section_to_type(clean_string(raw_record.get("wallSection")))

    if wall_type not in SUPPORTED_WALL_TYPES:
        wall_type = "standard-display-wall"

    if plaque_side not in SUPPORTED_PLAQUE_SIDES:
        plaque_side = "auto"

    return {
        "wallId": wall_id,
        "artworkId": artwork_id,
        "showInGallery": clean_bool(raw_record.get("showInGallery"), True),
        "placedInGallery": clean_bool(raw_record.get("placedInGallery"), True),
        "displayOrder": clean_positive_order(raw_record.get("displayOrder"), fallback_order),
        "wallType": wall_type,
        "plaqueEnabled": clean_bool(raw_record.get("plaqueEnabled"), True),
        "plaqueSide": plaque_side,
        "positionX": position_x,
        "positionZ": position_z,
        "rotationYDegrees": rotation_y_degrees,
    }


# Normalizes the full list of editable gallery wall assignments.
def normalize_gallery_curation(
    raw_gallery_curation: Any,
    valid_image_ids: set[str],
) -> list[dict[str, Any]]:
    if not isinstance(raw_gallery_curation, list):
        return []

    records: list[dict[str, Any]] = []
    used_wall_ids: set[str] = set()

    for index, raw_record in enumerate(raw_gallery_curation, start=1):
        if not isinstance(raw_record, dict):
            continue

        record = normalize_gallery_curation_record(raw_record, valid_image_ids, index)

        if not record["wallId"] or record["wallId"] in used_wall_ids:
            continue

        used_wall_ids.add(record["wallId"])
        records.append(record)

    return sorted(records, key=lambda record: record.get("displayOrder", 9999))


# Reads the gallery curation file, using current images to drop broken artwork references.
def get_current_gallery_curation(images: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    if images is None:
        _categories, images, _hero_slides = get_current_data()

    valid_image_ids = {image["id"] for image in images}

    return normalize_gallery_curation(read_json(GALLERY_CURATION_PATH), valid_image_ids)


def make_centered_offsets(length: int) -> list[int]:
    safe_length = max(1, int(length or 1))
    half = safe_length // 2
    offsets = list(range(-half, half + 1))
    return offsets[:safe_length]


def get_gallery_wall_axis_step(rotation_y_degrees: float) -> tuple[int, int]:
    axis = rotation_y_degrees % 180.0

    if axis < 0:
        axis += 180.0

    if axis == 45.0:
        return (1, 1)

    if axis == 90.0:
        return (0, 1)

    if axis == 135.0:
        return (-1, 1)

    return (1, 0)


def get_gallery_wall_footprint_cells(record: dict[str, Any]) -> set[tuple[int, int]]:
    wall_type = clean_string(record.get("wallType"))
    footprint = GALLERY_WALL_FOOTPRINTS.get(wall_type, GALLERY_WALL_FOOTPRINTS["standard-display-wall"])
    position_x = float(record.get("positionX", 0.0))
    position_z = float(record.get("positionZ", 0.0))
    rotation_y_degrees = clean_gallery_rotation_degrees(record.get("rotationYDegrees"), 0.0)
    grid_x = round(position_x / GALLERY_GRID_CELL_METERS)
    grid_z = round(position_z / GALLERY_GRID_CELL_METERS)
    axis_x, axis_z = get_gallery_wall_axis_step(rotation_y_degrees)
    perpendicular_x, perpendicular_z = -axis_z, axis_x
    cells: set[tuple[int, int]] = set()

    for length_offset in make_centered_offsets(footprint["length_cells"]):
        for thickness_offset in make_centered_offsets(footprint["thickness_cells"]):
            cells.add((
                grid_x + axis_x * length_offset + perpendicular_x * thickness_offset,
                grid_z + axis_z * length_offset + perpendicular_z * thickness_offset,
            ))

    return cells




def gallery_wall_footprint_inside_bounds(cells: set[tuple[int, int]]) -> bool:
    min_cell = round(GALLERY_POSITION_MIN / GALLERY_GRID_CELL_METERS)
    max_cell = round(GALLERY_POSITION_MAX / GALLERY_GRID_CELL_METERS)

    return all(
        min_cell <= x <= max_cell and min_cell <= z <= max_cell
        for x, z in cells
    )


def find_gallery_wall_boundary_violations(gallery_curation: list[dict[str, Any]]) -> list[str]:
    violations: list[str] = []

    for record in gallery_curation:
        wall_id = clean_string(record.get("wallId"))

        if not wall_id or not clean_bool(record.get("placedInGallery"), True):
            continue

        if not gallery_wall_footprint_inside_bounds(get_gallery_wall_footprint_cells(record)):
            violations.append(wall_id)

    return violations

def gallery_wall_footprints_overlap(first: set[tuple[int, int]], second: set[tuple[int, int]]) -> bool:
    return bool(first.intersection(second))


def find_gallery_wall_placement_collisions(gallery_curation: list[dict[str, Any]]) -> list[tuple[str, str]]:
    footprints = [
        (clean_string(record.get("wallId")), get_gallery_wall_footprint_cells(record))
        for record in gallery_curation
        if clean_string(record.get("wallId")) and clean_bool(record.get("placedInGallery"), True)
    ]
    collisions: list[tuple[str, str]] = []

    for first_index, first in enumerate(footprints):
        for second in footprints[first_index + 1:]:
            if gallery_wall_footprints_overlap(first[1], second[1]):
                collisions.append((first[0], second[0]))

    return collisions


# Validates gallery curation references before writing them to disk.
def validate_gallery_curation(gallery_curation: list[dict[str, Any]], valid_image_ids: set[str]) -> None:
    wall_ids = [record.get("wallId", "") for record in gallery_curation]

    if len(wall_ids) != len(set(wall_ids)):
        raise DataValidationError("Gallery curation contains duplicate wall IDs.")

    for record in gallery_curation:
        wall_id = clean_string(record.get("wallId"))
        artwork_id = clean_string(record.get("artworkId"))

        if not wall_id:
            raise DataValidationError("Gallery curation rows must include a wall ID.")

        if artwork_id and artwork_id not in valid_image_ids:
            raise DataValidationError(f"Gallery wall '{wall_id}' references a missing image: {artwork_id}")

        if record.get("wallType") not in SUPPORTED_WALL_TYPES:
            raise DataValidationError(f"Gallery wall '{wall_id}' has an invalid wall type.")

        if record.get("plaqueSide") not in SUPPORTED_PLAQUE_SIDES:
            raise DataValidationError(f"Gallery wall '{wall_id}' has an invalid plaque side.")

        position_x = record.get("positionX")
        position_z = record.get("positionZ")
        rotation_y_degrees = record.get("rotationYDegrees")

        for field_name, number in {"positionX": position_x, "positionZ": position_z}.items():
            if not isinstance(number, (int, float)) or number < GALLERY_POSITION_MIN or number > GALLERY_POSITION_MAX:
                raise DataValidationError(f"Gallery wall '{wall_id}' has an invalid {field_name} value.")

        if rotation_y_degrees not in SUPPORTED_WALL_ROTATIONS_DEGREES:
            raise DataValidationError(f"Gallery wall '{wall_id}' has an invalid rotationYDegrees value.")

    boundary_violations = find_gallery_wall_boundary_violations(gallery_curation)

    if boundary_violations:
        violation_text = "; ".join(boundary_violations)
        raise DataValidationError(f"Gallery wall placement extends beyond the floor-map border: {violation_text}")

    placement_collisions = find_gallery_wall_placement_collisions(gallery_curation)

    if placement_collisions:
        collision_text = "; ".join([f"{first} overlaps {second}" for first, second in placement_collisions])
        raise DataValidationError(f"Gallery wall placement collision detected: {collision_text}")


# Saves only the curation file so wall assignments do not rewrite image/category JSON.
def save_gallery_curation(raw_gallery_curation: Any) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]], list[dict[str, Any]], dict[str, Any]]:
    categories, images, hero_slides = get_current_data()
    valid_image_ids = {image["id"] for image in images}
    gallery_curation = normalize_gallery_curation(raw_gallery_curation, valid_image_ids)

    validate_gallery_curation(gallery_curation, valid_image_ids)
    backup = create_data_backup("gallery-curation-save")
    write_json(GALLERY_CURATION_PATH, gallery_curation)

    return categories, images, hero_slides, gallery_curation, backup


# Saves one gallery wall curation record by merging it into the current curation
# file. This lets each wall card have a local save action without accidentally
# treating every unsaved card on the page as part of the save.
def save_gallery_curation_wall(raw_wall_record: Any) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]], list[dict[str, Any]], dict[str, Any]]:
    if not isinstance(raw_wall_record, dict):
        raise DataValidationError("Gallery wall record must be an object.")

    categories, images, hero_slides = get_current_data()
    valid_image_ids = {image["id"] for image in images}
    current_gallery_curation = get_current_gallery_curation(images)
    fallback_order = len(current_gallery_curation) + 1
    updated_record = normalize_gallery_curation_record(raw_wall_record, valid_image_ids, fallback_order)

    if not updated_record["wallId"]:
        raise DataValidationError("Gallery wall record must include a wall ID.")

    merged_gallery_curation: list[dict[str, Any]] = []
    found_wall = False

    for existing_record in current_gallery_curation:
        if existing_record.get("wallId") == updated_record["wallId"]:
            found_wall = True
            merged_gallery_curation.append(updated_record)
        else:
            merged_gallery_curation.append(existing_record)

    if not found_wall:
        merged_gallery_curation.append(updated_record)

    gallery_curation = normalize_gallery_curation(merged_gallery_curation, valid_image_ids)
    validate_gallery_curation(gallery_curation, valid_image_ids)
    backup = create_data_backup(f"gallery-curation-wall-{updated_record['wallId']}")
    write_json(GALLERY_CURATION_PATH, gallery_curation)

    return categories, images, hero_slides, gallery_curation, backup


# Updates gallery curation references when an image ID is renamed.
def rename_gallery_curation_image_reference(
    current_image_id: str,
    new_image_id: str,
    valid_image_ids: set[str],
) -> list[dict[str, Any]]:
    raw_gallery_curation = read_json(GALLERY_CURATION_PATH)

    if isinstance(raw_gallery_curation, list):
        for record in raw_gallery_curation:
            if isinstance(record, dict) and clean_string(record.get("artworkId")) == current_image_id:
                record["artworkId"] = new_image_id

    gallery_curation = normalize_gallery_curation(raw_gallery_curation, valid_image_ids)
    validate_gallery_curation(gallery_curation, valid_image_ids)

    return gallery_curation


# Reads all JSON data files and returns normalized categories, images, and hero slides.
def get_current_data() -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]]]:
    categories = read_json(CATEGORIES_PATH)

    if not categories:
        categories = DEFAULT_CATEGORIES

    categories = normalize_categories(categories)
    valid_category_ids = {category["id"] for category in categories}
    fallback_category_id = categories[0]["id"]

    images = [
        normalize_image(image, valid_category_ids, fallback_category_id)
        for image in read_json(GALLERY_IMAGES_PATH)
        if isinstance(image, dict)
    ]

    image_ids = {image["id"] for image in images}

    hero_slides = [
        normalize_hero_slide(slide, valid_category_ids, fallback_category_id)
        for slide in read_json(HERO_SLIDES_PATH)
        if isinstance(slide, dict)
    ]

    hero_slides = [slide for slide in hero_slides if slide["imageId"] in image_ids]
    hero_slides = filter_hero_slides_for_landscape_images(hero_slides, images)

    validate_project_data(categories, images, hero_slides)

    return categories, images, hero_slides


# Writes all three source JSON files after a final normalization, validation,
# and backup creation pass.
def save_project_data(
    categories: list[dict[str, str]],
    images: list[dict[str, Any]],
    hero_slides: list[dict[str, str]],
    backup_reason: str,
) -> dict[str, Any]:
    normalized_categories, normalized_images, normalized_hero_slides = normalize_project_data_for_save(
        categories,
        images,
        hero_slides,
    )

    # Mutate the supplied lists in place so callers that return these objects
    # to the editor receive the same cleaned data that was written to disk.
    categories[:] = normalized_categories
    images[:] = normalized_images
    hero_slides[:] = normalized_hero_slides

    validate_project_data(categories, images, hero_slides)
    backup = create_data_backup(backup_reason)

    write_json(CATEGORIES_PATH, categories)
    write_json(GALLERY_IMAGES_PATH, images)
    write_json(HERO_SLIDES_PATH, hero_slides)

    return backup


# Saves the entire editor state after normalizing categories, images, and hero slides.
def save_full_data(
    raw_categories: list[Any],
    raw_images: list[Any],
    raw_hero_slides: list[Any],
) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]], dict[str, Any]]:
    categories = normalize_categories(raw_categories)
    valid_category_ids = {category["id"] for category in categories}
    fallback_category_id = categories[0]["id"]

    images = [
        normalize_image(image, valid_category_ids, fallback_category_id)
        for image in raw_images
        if isinstance(image, dict)
    ]

    images = relocate_imported_image_assets(images)

    hero_slides = [
        normalize_hero_slide(slide, valid_category_ids, fallback_category_id)
        for slide in raw_hero_slides
        if isinstance(slide, dict)
    ]

    image_ids = {image["id"] for image in images}
    hero_slides = [slide for slide in hero_slides if slide["imageId"] in image_ids]
    hero_slides = filter_hero_slides_for_landscape_images(hero_slides, images)

    backup = save_project_data(categories, images, hero_slides, "full-editor-save")

    return categories, images, hero_slides, backup


def rename_image_id(
    current_image_id: str,
    requested_new_image_id: str,
) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]], dict[str, Any], dict[str, Any], list[dict[str, str]]]:
    """Rename an image ID, update references, and rename portfolio rendition files."""

    current_image_id = clean_string(current_image_id)
    requested_new_image_id = clean_string(requested_new_image_id)

    if not current_image_id:
        raise ValueError("Current image ID is required.")

    if not requested_new_image_id:
        raise DataValidationError("New image ID is required.")

    categories, images, hero_slides = get_current_data()
    image_index = next((index for index, image in enumerate(images) if image.get("id") == current_image_id), -1)

    if image_index < 0:
        raise ValueError(f"Image not found: {current_image_id}")

    existing_ids = {image["id"] for image in images if image.get("id") != current_image_id}
    new_image_id = make_unique_image_id(requested_new_image_id, existing_ids, current_image_id)

    if new_image_id == current_image_id:
        return categories, images, hero_slides, images[image_index], {"backupFolder": ""}, []

    if not IMAGE_ID_PATTERN.match(new_image_id):
        raise DataValidationError("New image ID must use lowercase letters, numbers, and hyphens only.")

    original_image = images[image_index]
    file_plan = get_rename_file_plan(original_image, new_image_id)

    updated_image = {
        **original_image,
        "id": new_image_id,
    }

    for item in file_plan:
        updated_image[item["field"]] = item["targetUrl"]

    images[image_index] = updated_image

    hero_slides = [
        {
            **slide,
            "imageId": new_image_id if slide.get("imageId") == current_image_id else slide.get("imageId", ""),
        }
        for slide in hero_slides
    ]

    gallery_curation = rename_gallery_curation_image_reference(
        current_image_id,
        new_image_id,
        {image["id"] for image in images},
    )

    # Validate before touching files. This catches duplicate IDs and bad references.
    validate_project_data(categories, images, hero_slides)
    validate_gallery_curation(gallery_curation, {image["id"] for image in images})

    backup = create_data_backup(f"rename-image-id-{current_image_id}-to-{new_image_id}")
    apply_rename_file_plan(file_plan)

    write_json(GALLERY_IMAGES_PATH, images)
    write_json(HERO_SLIDES_PATH, hero_slides)
    write_json(GALLERY_CURATION_PATH, gallery_curation)

    file_moves = [
        {
            "field": item["field"],
            "from": item["currentUrl"],
            "to": item["targetUrl"],
        }
        for item in file_plan
    ]

    return categories, images, hero_slides, updated_image, backup, file_moves



# Fields that can be updated by crop pages without rewriting the entire image list.
DIRECT_IMAGE_UPDATE_FIELDS = {
    "thumbnailPosition",
    "heroPosition",
    "galleryPosition",
    "galleryFitMode",
    "galleryFrameStyle",
    "gallerySize",
}


# Cleans the limited set of fields that can be saved from crop pages.
def normalize_direct_image_updates(raw_updates: dict[str, Any]) -> dict[str, Any]:
    updates: dict[str, Any] = {}

    if "thumbnailPosition" in raw_updates:
        updates["thumbnailPosition"] = normalize_object_position(raw_updates.get("thumbnailPosition"))

    if "heroPosition" in raw_updates:
        updates["heroPosition"] = normalize_object_position(raw_updates.get("heroPosition"))

    if "galleryPosition" in raw_updates:
        updates["galleryPosition"] = normalize_object_position(raw_updates.get("galleryPosition"))


    if "galleryFitMode" in raw_updates:
        updates["galleryFitMode"] = normalize_gallery_fit_mode(raw_updates.get("galleryFitMode"))

    if "galleryFrameStyle" in raw_updates:
        updates["galleryFrameStyle"] = normalize_frame_style(raw_updates.get("galleryFrameStyle"))

    if "gallerySize" in raw_updates:
        # Context-aware clamping happens in normalize_image after this value is
        # merged with the existing image orientation and frame style.
        updates["gallerySize"] = raw_updates.get("gallerySize")

    return updates


# Updates one image record without rewriting data from hidden editor pages.
def save_image_updates(
    image_id: str,
    raw_updates: dict[str, Any],
) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]], dict[str, Any], dict[str, Any]]:
    """Update one image record and persist the normalized JSON files.

    Crop pages use this function so a hero or gallery framing save only touches
    the selected image. This prevents hidden editor pages from overwriting data
    the user did not intend to edit.
    """

    categories, images, hero_slides = get_current_data()
    updates = normalize_direct_image_updates(raw_updates)
    valid_category_ids = {category["id"] for category in categories}
    fallback_category_id = categories[0]["id"] if categories else "personal"

    for index, image in enumerate(images):
        if image.get("id") != image_id:
            continue

        updated_image = {**image, **updates}
        images[index] = normalize_image(updated_image, valid_category_ids, fallback_category_id)
        backup = save_project_data(categories, images, hero_slides, "single-image-framing-save")

        return categories, images, hero_slides, images[index], backup

    raise ValueError(f"Image not found: {image_id}")
