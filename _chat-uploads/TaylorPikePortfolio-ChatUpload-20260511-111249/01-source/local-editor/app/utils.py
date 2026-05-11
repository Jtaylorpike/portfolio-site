from __future__ import annotations

import re
from pathlib import Path
from typing import Any


def clean_string(value: Any) -> str:
    if value is None:
        return ""

    return str(value).strip()


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = value.strip("-")

    return value or "item"


def title_from_filename(filename: str) -> str:
    stem = Path(filename).stem
    cleaned = re.sub(r"[-_]+", " ", stem).strip()

    if not cleaned:
        return "Untitled Image"

    return cleaned.title()


def make_unique_value(base_value: str, used_values: set[str]) -> str:
    candidate = base_value
    count = 2

    while candidate in used_values:
        candidate = f"{base_value}-{count}"
        count += 1

    used_values.add(candidate)

    return candidate