"""Read, validate, back up, and write the portfolio JSON data files.

The local Flask editor is allowed to modify the same JSON files that the public
Vite site imports at build time. This module is the safety layer between the
browser editor and those source files. It normalizes incoming data, validates the
result, creates a timestamped backup, and then writes clean JSON back to disk.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
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
ABOUT_PHOTOS_PATH = DATA_DIR / "aboutPhotos.json"
ABOUT_COPY_PATH = DATA_DIR / "aboutCopy.json"
SITE_SEO_PATH = DATA_DIR / "siteSeo.json"
SITE_COPY_PATH = DATA_DIR / "siteCopy.json"

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
    "schemaVersion": 2,
    "id": "main-gallery-room",
    "label": "Main gallery room",
    "defaultRoomId": "room-main",
    "shape": "l-shaped",
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
    "layout": {"rooms": [], "hallways": []},
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
    layout = raw_room.get("layout") if isinstance(raw_room.get("layout"), dict) else {}

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

    def normalize_modules(values: Any, kind: str) -> list[dict[str, Any]]:
        if not isinstance(values, list):
            return []

        modules = []
        for index, value in enumerate(values):
            if not isinstance(value, dict):
                continue
            center = value.get("center")
            if not isinstance(center, list) or len(center) < 2:
                center = [0.0, 0.0]
            module = {
                "id": slugify(clean_string(value.get("id")) or f"{kind}-{index + 1}"),
                "label": clean_string(value.get("label")) or f"{kind.title()} {index + 1}",
                "center": [
                    clean_number(center[0], 0.0),
                    clean_number(center[1], 0.0),
                ],
                "width": clean_number(value.get("width"), 34.0 if kind == "room" else 7.0, 2.0),
                "depth": clean_number(value.get("depth"), 34.0 if kind == "room" else 7.0, 2.0),
            }
            if kind == "hallway":
                module["lengthPreset"] = "long" if value.get("lengthPreset") == "long" else "short"
                legacy_style = value.get("connectionStyle")
                if legacy_style not in {"centered", "left", "right", "corner"}:
                    legacy_style = "centered"
                start_style = value.get("startConnectionStyle", legacy_style)
                end_style = value.get("endConnectionStyle", legacy_style)
                module["startConnectionStyle"] = start_style if start_style in {"centered", "left", "right", "corner"} else "centered"
                module["endConnectionStyle"] = end_style if end_style in {"centered", "left", "right", "corner"} else "centered"
            modules.append(module)
        return modules

    normalized_rooms = normalize_modules(layout.get("rooms"), "room")
    normalized_hallways = normalize_modules(layout.get("hallways"), "hallway")
    normalized_modules = [*normalized_rooms, *normalized_hallways]
    if normalized_modules:
        layout_min_x = min(module["center"][0] - module["width"] / 2 for module in normalized_modules)
        layout_max_x = max(module["center"][0] + module["width"] / 2 for module in normalized_modules)
        layout_min_z = min(module["center"][1] - module["depth"] / 2 for module in normalized_modules)
        layout_max_z = max(module["center"][1] + module["depth"] / 2 for module in normalized_modules)
        movement_min_x = min(movement_min_x, layout_min_x)
        movement_max_x = max(movement_max_x, layout_max_x)
        movement_min_z = min(movement_min_z, layout_min_z)
        movement_max_z = max(movement_max_z, layout_max_z)
        grid_min_x = min(grid_min_x, layout_min_x - 2.0)
        grid_max_x = max(grid_max_x, layout_max_x + 2.0)
        grid_min_z = min(grid_min_z, layout_min_z - 2.0)
        grid_max_z = max(grid_max_z, layout_max_z + 2.0)
    requested_default_room_id = slugify(
        clean_string(raw_room.get("defaultRoomId"))
        or DEFAULT_GALLERY_ROOM["defaultRoomId"]
    )
    default_room = next(
        (room for room in normalized_rooms if room["id"] == requested_default_room_id),
        normalized_rooms[0] if normalized_rooms else None,
    )
    default_room_id = (
        default_room["id"]
        if default_room
        else DEFAULT_GALLERY_ROOM["defaultRoomId"]
    )
    normalized_start = [
        clean_number(start_position[0], DEFAULT_GALLERY_ROOM["start"]["position"][0]),
        clean_number(start_position[1], DEFAULT_GALLERY_ROOM["start"]["position"][1], 0.2, 3.2),
        clean_number(start_position[2], DEFAULT_GALLERY_ROOM["start"]["position"][2]),
    ]
    start_is_inside_default_room = bool(
        default_room
        and default_room["center"][0] - default_room["width"] / 2 <= normalized_start[0] <= default_room["center"][0] + default_room["width"] / 2
        and default_room["center"][1] - default_room["depth"] / 2 <= normalized_start[2] <= default_room["center"][1] + default_room["depth"] / 2
    )
    if default_room and not start_is_inside_default_room:
        normalized_start[0] = default_room["center"][0]
        normalized_start[2] = (
            default_room["center"][1]
            + max(0.0, default_room["depth"] / 2 - 2.6)
        )

    return {
        "schemaVersion": int(clean_number(raw_room.get("schemaVersion"), DEFAULT_GALLERY_ROOM["schemaVersion"], 1)),
        "id": slugify(clean_string(raw_room.get("id")) or DEFAULT_GALLERY_ROOM["id"]),
        "label": clean_string(raw_room.get("label")) or DEFAULT_GALLERY_ROOM["label"],
        "defaultRoomId": default_room_id,
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
            "position": normalized_start,
            "yaw": clean_number(start.get("yaw"), DEFAULT_GALLERY_ROOM["start"]["yaw"]),
        },
        "layout": {
            "rooms": normalized_rooms,
            "hallways": normalized_hallways,
        },
        "futureModelNotes": [
            clean_string(note)
            for note in raw_room.get("futureModelNotes", [])
            if clean_string(note)
        ] if isinstance(raw_room.get("futureModelNotes"), list) else [],
    }


def get_current_gallery_room() -> dict[str, Any]:
    """Read the current room footprint settings, falling back to the default room."""

    return normalize_gallery_room(read_json(GALLERY_ROOM_PATH))


def save_gallery_room(raw_room: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    """Normalize and save the modular gallery room layout with a backup."""

    requested_default_room_id = (
        slugify(clean_string(raw_room.get("defaultRoomId")))
        if isinstance(raw_room, dict)
        else ""
    )
    raw_layout = raw_room.get("layout", {}) if isinstance(raw_room, dict) else {}
    raw_rooms = raw_layout.get("rooms", []) if isinstance(raw_layout, dict) else []
    submitted_room_ids = {
        slugify(clean_string(room.get("id")))
        for room in raw_rooms
        if isinstance(room, dict) and clean_string(room.get("id"))
    }
    if requested_default_room_id and requested_default_room_id not in submitted_room_ids:
        raise DataValidationError("The default gallery room cannot be deleted.")

    gallery_room = normalize_gallery_room(raw_room)

    if not gallery_room["layout"]["rooms"]:
        raise DataValidationError("The gallery layout must contain at least one room.")

    backup = create_data_backup("gallery-room-layout-save")
    write_json(GALLERY_ROOM_PATH, gallery_room)
    return gallery_room, backup


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
    path.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    temporary_path: Path | None = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            newline="\n",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary_file:
            temporary_file.write(serialized)
            temporary_file.flush()
            os.fsync(temporary_file.fileno())
            temporary_path = Path(temporary_file.name)

        os.replace(temporary_path, path)
    finally:
        if temporary_path is not None and temporary_path.exists():
            temporary_path.unlink()


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

    for source_path in [CATEGORIES_PATH, GALLERY_IMAGES_PATH, HERO_SLIDES_PATH, GALLERY_CURATION_PATH, GALLERY_ROOM_PATH, ABOUT_PHOTOS_PATH, ABOUT_COPY_PATH, SITE_SEO_PATH, SITE_COPY_PATH]:
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
        for file_name in ["categories.json", "galleryImages.json", "heroSlides.json", "galleryCuration.json", "galleryRoom.json", "aboutPhotos.json", "aboutCopy.json", "siteSeo.json", "siteCopy.json"]
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
        "canRestore": all(file_name in files for file_name in [
            "categories.json",
            "galleryImages.json",
            "heroSlides.json",
            "galleryCuration.json",
            "galleryRoom.json",
            "aboutPhotos.json",
            "aboutCopy.json",
            "siteSeo.json",
        ]),
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

    backup_about_photos_path = backup_path / "aboutPhotos.json"

    if backup_about_photos_path.exists():
        write_json(ABOUT_PHOTOS_PATH, normalize_about_photos(read_json(backup_about_photos_path)))

    backup_about_copy_path = backup_path / "aboutCopy.json"

    if backup_about_copy_path.exists():
        write_json(ABOUT_COPY_PATH, normalize_about_copy(read_json(backup_about_copy_path)))

    backup_site_seo_path = backup_path / "siteSeo.json"

    if backup_site_seo_path.exists():
        write_json(SITE_SEO_PATH, normalize_site_seo(read_json(backup_site_seo_path)))

    backup_site_copy_path = backup_path / "siteCopy.json"

    if backup_site_copy_path.exists():
        write_json(SITE_COPY_PATH, normalize_site_copy(read_json(backup_site_copy_path)))


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

    # Missing isPublic means visible. Only write false into JSON so existing
    # public records stay clean while hidden records remain explicit.
    if clean_bool(raw_image.get("isPublic"), True) is False:
        image["isPublic"] = False

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
    image["heroScale"] = clean_number(raw_image.get("heroScale"), 1.0, 1.0, 4.0)
    image["galleryScale"] = clean_number(raw_image.get("galleryScale"), 1.0, 1.0, 4.0)

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

    if clean_bool(image.get("isPublic"), True) is False:
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
        "roomId": slugify(clean_string(raw_record.get("roomId")) or "room-main"),
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


def get_gallery_curation_status(
    images: list[dict[str, Any]] | None = None,
    normalized_gallery_curation: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Return diagnostics for the editor's gallery curation empty state.

    The frontend should not claim galleryCuration.json is missing when the file
    exists but zero rows were loaded. This status lets the editor distinguish a
    genuinely missing file from an empty or normalization-filtered file.
    """

    if images is None:
        _categories, images, _hero_slides = get_current_data()

    raw_gallery_curation = read_json(GALLERY_CURATION_PATH)
    valid_image_ids = {image["id"] for image in images}
    loaded_gallery_curation = (
        normalized_gallery_curation
        if normalized_gallery_curation is not None
        else normalize_gallery_curation(raw_gallery_curation, valid_image_ids)
    )

    return {
        "fileExists": GALLERY_CURATION_PATH.exists(),
        "rawRowCount": len(raw_gallery_curation) if isinstance(raw_gallery_curation, list) else 0,
        "loadedRowCount": len(loaded_gallery_curation),
    }


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
        (
            clean_string(record.get("wallId")),
            clean_string(record.get("roomId")) or "room-main",
            get_gallery_wall_footprint_cells(record),
        )
        for record in gallery_curation
        if clean_string(record.get("wallId")) and clean_bool(record.get("placedInGallery"), True)
    ]
    collisions: list[tuple[str, str]] = []

    for first_index, first in enumerate(footprints):
        for second in footprints[first_index + 1:]:
            if first[1] == second[1] and gallery_wall_footprints_overlap(first[2], second[2]):
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




DEFAULT_ABOUT_COPY = {
    "schemaVersion": 2,
    "hero": {
        "eyebrow": "About / Contact",
        "headline": "A reserved space for the personal side of the archive.",
        "intro": "Placeholder copy. Replace this with your final About introduction when you are ready.",
    },
    "about": {
        "eyebrow": "About Me",
        "heading": "Personal background",
        "paragraphs": [
            "Placeholder copy. Use this block for the short version of who you are, where you are from, and what shaped your creative point of view.",
            "Placeholder copy. Use this second paragraph for photography, climbing, community, technical work, and the personal thread between them.",
        ],
    },
    "project": {
        "eyebrow": "Photography / Project",
        "heading": "Creative practice, technical crossover, and the archive system.",
        "paragraphs": [
            "Placeholder copy. Use this block for how you think about photography, climbing, landscape, portrait work, commercial work, visual storytelling, and building this site as an evolving archive.",
            "Placeholder copy. Use this block for the bridge between photography, editing, web development, support work, and the interactive gallery concept.",
        ],
    },
    "additional": {
        "eyebrow": "Additional Notes",
        "heading": "A third space for the story still taking shape.",
        "paragraphs": [
            "Placeholder copy. Use this section to expand on an idea that does not fit naturally into the biography or project-practice sections above.",
            "Placeholder copy. This can become a note about process, influences, current direction, selected experience, or the relationship between the archive and future work.",
        ],
    },
    "contact": {
        "eyebrow": "Contact",
        "headline": "Available for selected projects, collaborations, and image work.",
        "body": "Placeholder copy. Replace this with your preferred contact language and availability notes.",
        "email": "jtaylorpike@gmail.com",
        "links": [],
    },
}


def clean_copy_text(value: Any, fallback: str) -> str:
    """Clean one user-editable About copy field and preserve a safe fallback."""

    text = clean_string(value)

    return text or fallback


def normalize_copy_paragraphs(raw_paragraphs: Any, fallback: list[str]) -> list[str]:
    """Normalize one About copy paragraph list for public rendering."""

    if not isinstance(raw_paragraphs, list):
        return list(fallback)

    paragraphs = [clean_string(paragraph) for paragraph in raw_paragraphs]
    paragraphs = [paragraph for paragraph in paragraphs if paragraph]

    return paragraphs[:4] or list(fallback)


def normalize_about_copy_links(raw_links: Any) -> list[dict[str, str]]:
    """Normalize optional contact/social links for the About contact card."""

    if not isinstance(raw_links, list):
        return []

    links: list[dict[str, str]] = []

    for raw_link in raw_links:
        if not isinstance(raw_link, dict):
            continue

        label = clean_string(raw_link.get("label"))
        url = clean_string(raw_link.get("url"))

        if not label or not url:
            continue

        links.append({"label": label, "url": url})

        if len(links) >= 6:
            break

    return links


def normalize_about_copy(raw_copy: Any) -> dict[str, Any]:
    """Normalize user-editable About/contact copy from aboutCopy.json."""

    if not isinstance(raw_copy, dict):
        raw_copy = {}

    raw_hero = raw_copy.get("hero") if isinstance(raw_copy.get("hero"), dict) else {}
    raw_about = raw_copy.get("about") if isinstance(raw_copy.get("about"), dict) else {}
    raw_project = raw_copy.get("project") if isinstance(raw_copy.get("project"), dict) else {}
    raw_additional = raw_copy.get("additional") if isinstance(raw_copy.get("additional"), dict) else {}
    raw_contact = raw_copy.get("contact") if isinstance(raw_copy.get("contact"), dict) else {}

    return {
        "schemaVersion": 2,
        "hero": {
            "eyebrow": clean_copy_text(raw_hero.get("eyebrow"), DEFAULT_ABOUT_COPY["hero"]["eyebrow"]),
            "headline": clean_copy_text(raw_hero.get("headline"), DEFAULT_ABOUT_COPY["hero"]["headline"]),
            "intro": clean_copy_text(raw_hero.get("intro"), DEFAULT_ABOUT_COPY["hero"]["intro"]),
        },
        "about": {
            "eyebrow": clean_copy_text(raw_about.get("eyebrow"), DEFAULT_ABOUT_COPY["about"]["eyebrow"]),
            "heading": clean_copy_text(raw_about.get("heading"), DEFAULT_ABOUT_COPY["about"]["heading"]),
            "paragraphs": normalize_copy_paragraphs(raw_about.get("paragraphs"), DEFAULT_ABOUT_COPY["about"]["paragraphs"]),
        },
        "project": {
            "eyebrow": clean_copy_text(raw_project.get("eyebrow"), DEFAULT_ABOUT_COPY["project"]["eyebrow"]),
            "heading": clean_copy_text(raw_project.get("heading"), DEFAULT_ABOUT_COPY["project"]["heading"]),
            "paragraphs": normalize_copy_paragraphs(raw_project.get("paragraphs"), DEFAULT_ABOUT_COPY["project"]["paragraphs"]),
        },
        "additional": {
            "eyebrow": clean_copy_text(raw_additional.get("eyebrow"), DEFAULT_ABOUT_COPY["additional"]["eyebrow"]),
            "heading": clean_copy_text(raw_additional.get("heading"), DEFAULT_ABOUT_COPY["additional"]["heading"]),
            "paragraphs": normalize_copy_paragraphs(raw_additional.get("paragraphs"), DEFAULT_ABOUT_COPY["additional"]["paragraphs"]),
        },
        "contact": {
            "eyebrow": clean_copy_text(raw_contact.get("eyebrow"), DEFAULT_ABOUT_COPY["contact"]["eyebrow"]),
            "headline": clean_copy_text(raw_contact.get("headline"), DEFAULT_ABOUT_COPY["contact"]["headline"]),
            "body": clean_copy_text(raw_contact.get("body"), DEFAULT_ABOUT_COPY["contact"]["body"]),
            "email": clean_copy_text(raw_contact.get("email"), DEFAULT_ABOUT_COPY["contact"]["email"]),
            "links": normalize_about_copy_links(raw_contact.get("links")),
        },
    }


def get_current_about_copy() -> dict[str, Any]:
    """Read and normalize About/contact page copy."""

    return normalize_about_copy(read_json(ABOUT_COPY_PATH))


def save_about_copy(raw_about_copy: Any, backup_reason: str = "about-copy-save") -> tuple[dict[str, Any], dict[str, Any]]:
    """Save About/contact copy with a standard editor backup."""

    about_copy = normalize_about_copy(raw_about_copy)
    backup = create_data_backup(backup_reason)
    write_json(ABOUT_COPY_PATH, about_copy)

    return about_copy, backup


SITE_SEO_ROUTE_IDS = ("entry", "home", "portfolio", "about", "gallery")


def normalize_string_list(raw_values: Any, limit: int = 24) -> list[str]:
    if not isinstance(raw_values, list):
        return []

    values: list[str] = []

    for raw_value in raw_values:
        value = clean_string(raw_value)

        if value and value not in values:
            values.append(value)

        if len(values) >= limit:
            break

    return values


def normalize_site_seo(raw_seo: Any) -> dict[str, Any]:
    """Normalize editable global and route-level search/social metadata."""

    if not isinstance(raw_seo, dict):
        raw_seo = {}

    raw_routes = raw_seo.get("routes") if isinstance(raw_seo.get("routes"), dict) else {}
    routes: dict[str, dict[str, str]] = {}

    for route_id in SITE_SEO_ROUTE_IDS:
        raw_route = raw_routes.get(route_id) if isinstance(raw_routes.get(route_id), dict) else {}
        routes[route_id] = {
            "title": clean_string(raw_route.get("title")),
            "description": clean_string(raw_route.get("description")),
            "canonicalPath": clean_string(raw_route.get("canonicalPath")) or "/",
        }

    site_url = clean_string(raw_seo.get("siteUrl"))

    if site_url and not site_url.startswith(("https://", "http://")):
        raise DataValidationError("Site URL must begin with https:// or http://.")

    return {
        "schemaVersion": 1,
        "siteName": clean_string(raw_seo.get("siteName")),
        "authorName": clean_string(raw_seo.get("authorName")),
        "siteUrl": site_url,
        "locale": clean_string(raw_seo.get("locale")) or "en_US",
        "themeColor": clean_string(raw_seo.get("themeColor")) or "#060807",
        "defaultImage": clean_string(raw_seo.get("defaultImage")),
        "contactEmail": clean_string(raw_seo.get("contactEmail")),
        "sameAs": normalize_string_list(raw_seo.get("sameAs")),
        "keywords": normalize_string_list(raw_seo.get("keywords")),
        "routes": routes,
    }


def get_current_site_seo() -> dict[str, Any]:
    return normalize_site_seo(read_json(SITE_SEO_PATH))


def save_site_seo(raw_site_seo: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    site_seo = normalize_site_seo(raw_site_seo)

    if not site_seo["siteName"] or not site_seo["siteUrl"]:
        raise DataValidationError("Site name and site URL are required.")

    backup = create_data_backup("site-seo-save")
    write_json(SITE_SEO_PATH, site_seo)
    return site_seo, backup


DEFAULT_SITE_COPY = {
    "entry": {
        "eyebrow": "Creative Portfolio",
        "headline": "A visual archive for photography, climbing, landscape, and experimental web spaces.",
        "body": "Enter the traditional portfolio or move through the work in the desktop virtual gallery.",
        "primaryAction": "Continue to Website",
        "galleryAction": "Enter Virtual Gallery",
    },
    "home": {
        "eyebrow": "Selected Work",
        "statement": "A visual archive of movement, space, and imagination.",
        "galleryAction": "Enter Virtual Gallery",
        "portfolioAction": "View Portfolio",
    },
}


def normalize_site_copy(raw_site_copy: Any) -> dict[str, Any]:
    """Normalize portfolio entry-screen and homepage copy."""

    source = raw_site_copy if isinstance(raw_site_copy, dict) else {}
    raw_entry = source.get("entry") if isinstance(source.get("entry"), dict) else {}
    raw_home = source.get("home") if isinstance(source.get("home"), dict) else {}

    return {
        "schemaVersion": 1,
        "entry": {
            key: clean_copy_text(raw_entry.get(key), fallback)
            for key, fallback in DEFAULT_SITE_COPY["entry"].items()
        },
        "home": {
            key: clean_copy_text(raw_home.get(key), fallback)
            for key, fallback in DEFAULT_SITE_COPY["home"].items()
        },
    }


def get_current_site_copy() -> dict[str, Any]:
    return normalize_site_copy(read_json(SITE_COPY_PATH))


def save_site_settings(raw_site_seo: Any, raw_site_copy: Any) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    """Save the portfolio's SEO metadata and public entry/home copy together."""

    site_seo = normalize_site_seo(raw_site_seo)
    site_copy = normalize_site_copy(raw_site_copy)

    if not site_seo["siteName"] or not site_seo["siteUrl"]:
        raise DataValidationError("Site name and site URL are required.")

    backup = create_data_backup("site-settings-save")
    write_json(SITE_SEO_PATH, site_seo)
    write_json(SITE_COPY_PATH, site_copy)
    return site_seo, site_copy, backup


ABOUT_PHOTO_PLACEMENT_ROLES = {"upper-collage", "lower-collage", "background-float", "unused"}


def normalize_about_photo(raw_photo: Any) -> dict[str, Any]:
    """Normalize one About/contact page photo record.

    About photos are intentionally separate from portfolio images. They can
    temporarily reference portfolio rendition paths, but native About imports
    should write into public/images/about/.
    """

    if not isinstance(raw_photo, dict):
        raw_photo = {}

    photo_id = slugify(clean_string(raw_photo.get("id")) or "about-photo")
    title = clean_string(raw_photo.get("title")) or photo_id.replace("-", " ").title()
    src = clean_string(raw_photo.get("src"))
    thumb_src = clean_string(raw_photo.get("thumbSrc")) or src
    full_src = clean_string(raw_photo.get("fullSrc")) or src
    alt = clean_string(raw_photo.get("alt")) or f"About page photograph: {title}"
    orientation = clean_string(raw_photo.get("imageOrientation"))
    placement_role = clean_string(raw_photo.get("placementRole")) or "lower-collage"

    if orientation not in SUPPORTED_ORIENTATIONS:
        orientation = "portrait"

    if placement_role not in ABOUT_PHOTO_PLACEMENT_ROLES:
        placement_role = "lower-collage"

    normalized: dict[str, Any] = {
        "id": photo_id,
        "title": title,
        "year": clean_string(raw_photo.get("year")),
        "location": clean_string(raw_photo.get("location")),
        "note": clean_string(raw_photo.get("note")),
        "src": src,
        "thumbSrc": thumb_src,
        "fullSrc": full_src,
        "alt": alt,
        "imageOrientation": orientation,
        "placementRole": placement_role,
        "aboutPosition": normalize_object_position(raw_photo.get("aboutPosition")),
        "aboutScale": max(1.0, min(4.0, clean_number(raw_photo.get("aboutScale"), 1.0))),
        "sourceType": clean_string(raw_photo.get("sourceType")) or "about",
    }

    if raw_photo.get("backgroundX") not in (None, "") and raw_photo.get("backgroundY") not in (None, ""):
        normalized["backgroundX"] = max(-35.0, min(100.0, clean_number(raw_photo.get("backgroundX"), 0.0)))
        normalized["backgroundY"] = max(-12.0, min(100.0, clean_number(raw_photo.get("backgroundY"), 0.0)))

    if raw_photo.get("backgroundWidth") not in (None, ""):
        normalized["backgroundWidth"] = max(12.0, min(90.0, clean_number(raw_photo.get("backgroundWidth"), 42.0)))

    if raw_photo.get("collageX") not in (None, "") and raw_photo.get("collageY") not in (None, ""):
        normalized["collageX"] = max(-35.0, min(100.0, clean_number(raw_photo.get("collageX"), 0.0)))
        normalized["collageY"] = max(-35.0, min(100.0, clean_number(raw_photo.get("collageY"), 0.0)))

    if raw_photo.get("collageWidth") not in (None, ""):
        normalized["collageWidth"] = max(12.0, min(100.0, clean_number(raw_photo.get("collageWidth"), 42.0)))

    if raw_photo.get("collageLayer") not in (None, ""):
        normalized["collageLayer"] = max(1, min(99, int(clean_number(raw_photo.get("collageLayer"), 1))))

    if raw_photo.get("collageRotation") not in (None, ""):
        normalized["collageRotation"] = max(-45.0, min(45.0, clean_number(raw_photo.get("collageRotation"), 0.0)))

    if raw_photo.get("collageOpacity") not in (None, ""):
        normalized["collageOpacity"] = max(0.0, min(1.0, clean_number(raw_photo.get("collageOpacity"), 1.0)))

    if raw_photo.get("mobileX") not in (None, "") and raw_photo.get("mobileY") not in (None, ""):
        normalized["mobileX"] = max(-35.0, min(100.0, clean_number(raw_photo.get("mobileX"), 0.0)))
        normalized["mobileY"] = max(-35.0, min(100.0, clean_number(raw_photo.get("mobileY"), 0.0)))

    if raw_photo.get("mobileWidth") not in (None, ""):
        normalized["mobileWidth"] = max(12.0, min(100.0, clean_number(raw_photo.get("mobileWidth"), 42.0)))

    if raw_photo.get("mobileLayer") not in (None, ""):
        normalized["mobileLayer"] = max(1, min(99, int(clean_number(raw_photo.get("mobileLayer"), 1))))

    if raw_photo.get("mobileRotation") not in (None, ""):
        normalized["mobileRotation"] = max(-45.0, min(45.0, clean_number(raw_photo.get("mobileRotation"), 0.0)))

    if raw_photo.get("mobileOpacity") not in (None, ""):
        normalized["mobileOpacity"] = max(0.0, min(1.0, clean_number(raw_photo.get("mobileOpacity"), 1.0)))

    if raw_photo.get("isActive") is False:
        normalized["isActive"] = False

    source_image_id = clean_string(raw_photo.get("sourceImageId"))

    if source_image_id:
        normalized["sourceImageId"] = source_image_id

    for key in ["imageWidth", "imageHeight"]:
        try:
            value = int(raw_photo.get(key) or 0)
        except (TypeError, ValueError):
            value = 0

        if value > 0:
            normalized[key] = value

    try:
        aspect_ratio = float(raw_photo.get("imageAspectRatio") or 0)
    except (TypeError, ValueError):
        aspect_ratio = 0

    if aspect_ratio > 0:
        normalized["imageAspectRatio"] = round(aspect_ratio, 6)

    return normalized


def normalize_about_photos(raw_photos: Any) -> list[dict[str, Any]]:
    """Normalize About/contact image records and make IDs unique."""

    if not isinstance(raw_photos, list):
        return []

    normalized_photos: list[dict[str, Any]] = []
    used_ids: set[str] = set()

    for index, raw_photo in enumerate(raw_photos, start=1):
        if not isinstance(raw_photo, dict):
            continue

        photo = normalize_about_photo(raw_photo)
        base_id = photo["id"] or f"about-photo-{index:02d}"
        candidate_id = base_id
        suffix = 2

        while candidate_id in used_ids:
            candidate_id = f"{base_id}-{suffix}"
            suffix += 1

        photo["id"] = candidate_id
        used_ids.add(candidate_id)
        normalized_photos.append(photo)

    return normalized_photos


def get_current_about_photos() -> list[dict[str, Any]]:
    """Read and normalize About/contact page photos."""

    return normalize_about_photos(read_json(ABOUT_PHOTOS_PATH))


def save_about_photos(raw_about_photos: Any, backup_reason: str = "about-photos-save") -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Save About/contact page photo records with a standard editor backup."""

    about_photos = normalize_about_photos(raw_about_photos)
    backup = create_data_backup(backup_reason)
    write_json(ABOUT_PHOTOS_PATH, about_photos)

    return about_photos, backup


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
    raw_about_photos: Any = None,
    raw_about_copy: Any = None,
) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]], list[dict[str, Any]], dict[str, Any], dict[str, Any]]:
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

    if raw_about_photos is None:
        about_photos = get_current_about_photos()
    else:
        about_photos = normalize_about_photos(raw_about_photos)
        write_json(ABOUT_PHOTOS_PATH, about_photos)

    if raw_about_copy is None:
        about_copy = get_current_about_copy()
    else:
        about_copy = normalize_about_copy(raw_about_copy)
        write_json(ABOUT_COPY_PATH, about_copy)

    return categories, images, hero_slides, about_photos, about_copy, backup


def normalize_rename_image_metadata_updates(raw_updates: Any) -> dict[str, Any]:
    """Clean the non-path image fields that may travel with an ID rename.

    The rename action is commonly run immediately after editing the image title.
    Sending this small whitelist with the rename lets the backend save the
    current visible metadata and the new filename-derived ID in one atomic write,
    while still preventing the browser from overriding path, dimension, or ID
    fields that the backend owns during the rename.
    """

    if not isinstance(raw_updates, dict):
        return {}

    updates: dict[str, Any] = {}

    for field_name in ["title", "category", "year", "location", "note", "alt"]:
        if field_name in raw_updates:
            updates[field_name] = clean_string(raw_updates.get(field_name))

    if "isPublic" in raw_updates:
        updates["isPublic"] = clean_bool(raw_updates.get("isPublic"), True)

    for field_name in ["thumbnailPosition", "heroPosition", "galleryPosition"]:
        if field_name in raw_updates:
            updates[field_name] = normalize_object_position(raw_updates.get(field_name))

    if "galleryFitMode" in raw_updates:
        updates["galleryFitMode"] = normalize_gallery_fit_mode(raw_updates.get("galleryFitMode"))

    if "galleryFrameStyle" in raw_updates:
        updates["galleryFrameStyle"] = normalize_frame_style(raw_updates.get("galleryFrameStyle"))

    if "gallerySize" in raw_updates:
        updates["gallerySize"] = raw_updates.get("gallerySize")

    if "heroFitMode" in raw_updates:
        updates["heroFitMode"] = normalize_hero_fit_mode(raw_updates.get("heroFitMode"))

    if "heroFrameStyle" in raw_updates:
        updates["heroFrameStyle"] = normalize_frame_style(raw_updates.get("heroFrameStyle"))

    return updates


def rename_image_id(
    current_image_id: str,
    requested_new_image_id: str,
    image_updates: Any | None = None,
) -> tuple[list[dict[str, str]], list[dict[str, Any]], list[dict[str, str]], dict[str, Any], dict[str, Any], list[dict[str, str]]]:
    """Rename an image ID, update references, rename renditions, and preserve visible metadata edits."""

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

    if not IMAGE_ID_PATTERN.match(new_image_id):
        raise DataValidationError("New image ID must use lowercase letters, numbers, and hyphens only.")

    original_image = images[image_index]
    metadata_updates = normalize_rename_image_metadata_updates(image_updates)

    if new_image_id == current_image_id and not metadata_updates:
        return categories, images, hero_slides, images[image_index], {"backupFolder": ""}, []

    file_plan = [] if new_image_id == current_image_id else get_rename_file_plan(original_image, new_image_id)

    updated_image = {
        **original_image,
        **metadata_updates,
        "id": new_image_id,
    }

    for item in file_plan:
        updated_image[item["field"]] = item["targetUrl"]

    valid_category_ids = {category["id"] for category in categories}
    fallback_category_id = categories[0]["id"] if categories else "personal"
    updated_image = normalize_image(updated_image, valid_category_ids, fallback_category_id)
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

    backup_label = f"rename-image-id-{current_image_id}-to-{new_image_id}"
    if new_image_id == current_image_id:
        backup_label = f"rename-image-id-metadata-refresh-{current_image_id}"

    backup = create_data_backup(backup_label)
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
    "heroScale",
    "galleryPosition",
    "galleryScale",
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

    if "heroScale" in raw_updates:
        updates["heroScale"] = clean_number(raw_updates.get("heroScale"), 1.0, 1.0, 4.0)

    if "galleryScale" in raw_updates:
        updates["galleryScale"] = clean_number(raw_updates.get("galleryScale"), 1.0, 1.0, 4.0)


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
