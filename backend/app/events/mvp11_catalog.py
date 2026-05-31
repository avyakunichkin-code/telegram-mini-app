"""
Загрузка каталога MVP 1.1 из data/events/mvp11/ (YAML).
Кэш в памяти на процесс — перезагрузка при рестарте API.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from .taxonomy import DEFAULT_INTERACTION_KIND, build_metadata_json, infer_taxonomy_from_yaml

def _resolve_catalog_dir() -> Path:
    """data/events/mvp11 от корня репо (Render клонирует весь репо, rootDir=backend)."""
    here = Path(__file__).resolve()
    for base in (here.parents[3], here.parents[2]):
        cand = base / "data" / "events" / "mvp11"
        if (cand / "catalog.yaml").is_file():
            return cand
    raise FileNotFoundError(
        "MVP11 YAML catalog not found: expected data/events/mvp11/catalog.yaml "
        f"(searched from {here})"
    )


_CATALOG_DIR = _resolve_catalog_dir()
_CATALOG_MANIFEST = _CATALOG_DIR / "catalog.yaml"

_cached_specs: list[dict[str, Any]] | None = None
_cached_taxonomy: dict[str, dict[str, Any]] | None = None


def catalog_dir() -> Path:
    return _resolve_catalog_dir()


def _load_yaml_file(path: Path) -> dict[str, Any]:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError(f"{path}: expected mapping root")
    return raw


def _yaml_event_to_spec_and_meta(event: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    key = str(event.get("definition_key") or event.get("key") or "").strip()
    if not key:
        raise ValueError("event missing definition_key")

    event_domain = str(event.get("event_domain") or "consumption").strip()
    interaction_kind = str(event.get("interaction_kind") or DEFAULT_INTERACTION_KIND).strip()
    scenario_shape = event.get("scenario_shape")
    extra = event.get("extra")
    extra_dict = dict(extra) if isinstance(extra, dict) else None

    meta = build_metadata_json(
        event_domain=event_domain,
        interaction_kind=interaction_kind,
        scenario_shape=str(scenario_shape) if scenario_shape else None,
        extra=extra_dict,
    )

    spec: dict[str, Any] = {
        "key": key,
        "title": str(event["title"]),
        "description": str(event.get("description") or ""),
        "weight": int(event.get("weight", 100)),
        "event_tier": int(event.get("event_tier", 1)),
        "repeat_policy": str(event.get("repeat_policy", "repeatable")),
        "choices": [],
    }
    if "cooldown_periods" in event:
        spec["cooldown_periods"] = int(event.get("cooldown_periods") or 0)
    if "repeat_max" in event:
        spec["repeat_max"] = event.get("repeat_max")
    if "mandatory_gate" in event:
        spec["mandatory_gate"] = str(event.get("mandatory_gate", "none"))
    if "is_active" in event:
        spec["is_active"] = int(event.get("is_active", 1))
    prereq = event.get("prerequisites")
    if isinstance(prereq, dict) and prereq:
        spec["prerequisites_json"] = prereq

    choices_out: list[dict[str, Any]] = []
    for ch in event.get("choices") or []:
        if not isinstance(ch, dict):
            continue
        choice: dict[str, Any] = {
            "title": str(ch["title"]),
            "effects": dict(ch.get("effects") or {}),
        }
        if ch.get("description"):
            choice["description"] = str(ch["description"])
        choices_out.append(choice)
    if len(choices_out) < 2:
        raise ValueError(f"{key}: need at least 2 choices")
    spec["choices"] = choices_out

    tax = infer_taxonomy_from_yaml(event)
    spec["content_class"] = tax["content_class"]
    spec["event_slot"] = tax["event_slot"]
    spec["audience_template_keys"] = tax["audience_template_keys"]
    return spec, meta


def load_mvp11_catalog(
    *,
    catalog_dir: Path | None = None,
    force_reload: bool = False,
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    """Возвращает (MVP11_EVENT_SPECS, EVENT_TAXONOMY)."""
    global _cached_specs, _cached_taxonomy
    if not force_reload and _cached_specs is not None and _cached_taxonomy is not None:
        return _cached_specs, _cached_taxonomy

    base = catalog_dir or _CATALOG_DIR
    manifest_path = base / "catalog.yaml"
    if not manifest_path.is_file():
        raise FileNotFoundError(f"MVP11 catalog manifest not found: {manifest_path}")

    manifest = _load_yaml_file(manifest_path)
    includes = manifest.get("includes") or []
    if not isinstance(includes, list):
        raise ValueError("catalog.yaml: includes must be a list")

    specs: list[dict[str, Any]] = []
    taxonomy: dict[str, dict[str, Any]] = {}
    seen_keys: set[str] = set()

    for rel in includes:
        rel_path = str(rel).replace("\\", "/")
        path = base / rel_path
        if not path.is_file():
            raise FileNotFoundError(f"included catalog file missing: {path}")
        doc = _load_yaml_file(path)
        events = doc.get("events")
        if not isinstance(events, list):
            raise ValueError(f"{path}: events must be a list")
        for raw_event in events:
            if not isinstance(raw_event, dict):
                raise ValueError(f"{path}: each event must be a mapping")
            spec, meta = _yaml_event_to_spec_and_meta(raw_event)
            if spec["key"] in seen_keys:
                raise ValueError(f"duplicate definition_key: {spec['key']}")
            seen_keys.add(spec["key"])
            specs.append(spec)
            taxonomy[spec["key"]] = meta

    _cached_specs = specs
    _cached_taxonomy = taxonomy
    return specs, taxonomy


def clear_mvp11_catalog_cache() -> None:
    """Для тестов."""
    global _cached_specs, _cached_taxonomy
    _cached_specs = None
    _cached_taxonomy = None
