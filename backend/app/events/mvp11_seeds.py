"""
Синхронизация каталога MVP 1.1 в PostgreSQL.
Канон контента: data/events/mvp11/*.yaml (см. mvp11_catalog.py, ADR-008).
"""

from __future__ import annotations

import json

from sqlalchemy.orm import Session, joinedload

from ..models import EventDefinition, EventChoice
from .mvp11_catalog import load_mvp11_catalog
from .taxonomy import audience_template_keys, serialize_audience_template_keys

MVP11_EVENT_SPECS, EVENT_TAXONOMY = load_mvp11_catalog()


def _metadata_for_spec(spec: dict) -> dict:
    meta = dict(EVENT_TAXONOMY.get(spec["key"]) or {})
    extra = spec.get("metadata_json")
    if isinstance(extra, dict):
        meta.update(extra)
    return meta


_MVP11_CATALOG_KEYS = frozenset(spec["key"] for spec in MVP11_EVENT_SPECS)


def _json_canon(obj: object) -> str:
    return json.dumps(obj, ensure_ascii=False, sort_keys=True)


def _target_prerequisites_json(spec: dict, row: EventDefinition | None) -> str:
    if "prerequisites_json" in spec:
        return _json_canon(spec.get("prerequisites_json") or {})
    if row is None:
        return _json_canon({})
    try:
        parsed = json.loads(row.prerequisites_json or "{}")
    except json.JSONDecodeError:
        return ""
    return _json_canon(parsed if isinstance(parsed, dict) else {})


def _target_is_active(spec: dict, row: EventDefinition | None) -> int:
    if "is_active" in spec:
        return int(spec.get("is_active", 1))
    if row is None:
        return 1
    return int(row.is_active or 0)


def _choice_snapshots_from_spec(spec: dict) -> list[dict]:
    return [
        {
            "title": ch["title"],
            "description": ch.get("description", ""),
            "effects_json": _json_canon(ch.get("effects") or {}),
        }
        for ch in (spec.get("choices") or [])
    ]


def _choice_snapshots_from_row(choices: list[EventChoice]) -> list[dict]:
    ordered = sorted(choices, key=lambda c: int(c.id))
    out: list[dict] = []
    for ch in ordered:
        try:
            effects = json.loads(ch.effects_json or "{}")
        except json.JSONDecodeError:
            return []
        if not isinstance(effects, dict):
            effects = {}
        out.append(
            {
                "title": ch.title,
                "description": ch.description or "",
                "effects_json": _json_canon(effects),
            }
        )
    return out


def _definition_snapshot_from_spec(spec: dict, row: EventDefinition | None) -> dict:
    return {
        "title": spec["title"],
        "description": spec.get("description", ""),
        "event_tier": int(spec.get("event_tier", 1)),
        "repeat_policy": str(spec.get("repeat_policy", "repeatable")),
        "repeat_max": spec.get("repeat_max"),
        "cooldown_periods": int(spec.get("cooldown_periods", 0) or 0),
        "mandatory_gate": str(spec.get("mandatory_gate", "none")),
        "weight": int(spec.get("weight", 100)),
        "metadata_json": _json_canon(_metadata_for_spec(spec)),
        "prerequisites_json": _target_prerequisites_json(spec, row),
        "is_active": _target_is_active(spec, row),
        "content_class": str(spec.get("content_class", "universal")),
        "event_slot": str(spec.get("event_slot", "period_choice")),
        "audience_template_keys": serialize_audience_template_keys(
            list(spec.get("audience_template_keys") or ["all"])
        ),
        "choices": _choice_snapshots_from_spec(spec),
    }


def _definition_snapshot_from_row(row: EventDefinition, choices: list[EventChoice]) -> dict:
    try:
        meta = json.loads(row.metadata_json or "{}")
    except json.JSONDecodeError:
        meta = {}
    if not isinstance(meta, dict):
        meta = {}
    return {
        "title": row.title,
        "description": row.description or "",
        "event_tier": int(row.event_tier),
        "repeat_policy": str(row.repeat_policy),
        "repeat_max": row.repeat_max,
        "cooldown_periods": int(row.cooldown_periods or 0),
        "mandatory_gate": str(row.mandatory_gate),
        "weight": int(row.weight),
        "metadata_json": _json_canon(meta),
        "prerequisites_json": _target_prerequisites_json({}, row),
        "is_active": int(row.is_active or 0),
        "content_class": str(getattr(row, "content_class", None) or "universal"),
        "event_slot": str(getattr(row, "event_slot", None) or "period_choice"),
        "audience_template_keys": serialize_audience_template_keys(audience_template_keys(row)),
        "choices": _choice_snapshots_from_row(choices),
    }


def _mvp11_definition_matches_spec(row: EventDefinition, spec: dict) -> bool:
    choices = list(row.choices or [])
    expected = _definition_snapshot_from_spec(spec, row)
    actual = _definition_snapshot_from_row(row, choices)
    actual["prerequisites_json"] = _target_prerequisites_json(spec, row)
    actual["is_active"] = _target_is_active(spec, row)
    return expected == actual


def _mvp11_catalog_complete(db: Session) -> bool:
    """Все ключи MVP 1.1 есть в БД (включая намеренно неактивные, напр. is_active=0 в сидах)."""
    count = (
        db.query(EventDefinition.key)
        .filter(EventDefinition.key.in_(_MVP11_CATALOG_KEYS))
        .count()
    )
    return count == len(_MVP11_CATALOG_KEYS)


def _mvp11_catalog_in_sync(db: Session) -> bool:
    """Быстрый путь: каталог полный и совпадает с MVP11_EVENT_SPECS."""
    if not _mvp11_catalog_complete(db):
        return False
    rows = (
        db.query(EventDefinition)
        .options(joinedload(EventDefinition.choices))
        .filter(EventDefinition.key.in_(_MVP11_CATALOG_KEYS))
        .all()
    )
    by_key = {row.key: row for row in rows}
    for spec in MVP11_EVENT_SPECS:
        row = by_key.get(spec["key"])
        if row is None or not _mvp11_definition_matches_spec(row, spec):
            return False
    return True


def _sync_mvp11_spec(db: Session, spec: dict, existing: EventDefinition | None) -> None:
    meta_json = json.dumps(_metadata_for_spec(spec), ensure_ascii=False)
    if existing:
        existing.title = spec["title"]
        existing.description = spec["description"]
        existing.event_tier = int(spec.get("event_tier", 1))
        existing.repeat_policy = str(spec.get("repeat_policy", "repeatable"))
        existing.repeat_max = spec.get("repeat_max")
        existing.cooldown_periods = int(spec.get("cooldown_periods", 0) or 0)
        existing.mandatory_gate = str(spec.get("mandatory_gate", "none"))
        existing.weight = int(spec.get("weight", 100))
        existing.metadata_json = meta_json
        existing.content_class = str(spec.get("content_class", "universal"))
        existing.event_slot = str(spec.get("event_slot", "period_choice"))
        existing.audience_template_keys = serialize_audience_template_keys(
            list(spec.get("audience_template_keys") or ["all"])
        )
        if "is_active" in spec:
            existing.is_active = int(spec.get("is_active", 1))
        if "prerequisites_json" in spec:
            existing.prerequisites_json = json.dumps(
                spec.get("prerequisites_json") or {}, ensure_ascii=False
            )
        spec_choices = list(spec.get("choices") or [])
        existing_choices = sorted(existing.choices or [], key=lambda c: int(c.id))
        for idx, ch in enumerate(spec_choices):
            if idx < len(existing_choices):
                existing_choices[idx].title = ch["title"]
                existing_choices[idx].description = ch.get("description", "")
                existing_choices[idx].effects_json = json.dumps(
                    ch.get("effects", {}), ensure_ascii=False
                )
            else:
                db.add(
                    EventChoice(
                        definition_id=existing.id,
                        title=ch["title"],
                        description=ch.get("description", ""),
                        effects_json=json.dumps(ch.get("effects", {}), ensure_ascii=False),
                    )
                )
        for extra in existing_choices[len(spec_choices) :]:
            db.delete(extra)
        return
    ed = EventDefinition(
        key=spec["key"],
        mode="any",
        title=spec["title"],
        description=spec["description"],
        weight=int(spec.get("weight", 100)),
        is_active=int(spec.get("is_active", 1)),
        event_tier=int(spec.get("event_tier", 1)),
        repeat_policy=str(spec.get("repeat_policy", "repeatable")),
        repeat_max=spec.get("repeat_max"),
        cooldown_periods=int(spec.get("cooldown_periods", 0) or 0),
        mandatory_gate=str(spec.get("mandatory_gate", "none")),
        prerequisites_json=json.dumps(spec.get("prerequisites_json") or {}, ensure_ascii=False),
        metadata_json=meta_json,
        content_class=str(spec.get("content_class", "universal")),
        event_slot=str(spec.get("event_slot", "period_choice")),
        audience_template_keys=serialize_audience_template_keys(
            list(spec.get("audience_template_keys") or ["all"])
        ),
    )
    db.add(ed)
    db.flush()
    for ch in spec["choices"]:
        db.add(
            EventChoice(
                definition_id=ed.id,
                title=ch["title"],
                description=ch.get("description", ""),
                effects_json=json.dumps(ch.get("effects", {}), ensure_ascii=False),
            )
        )


def ensure_mvp11_event_catalog(db: Session) -> None:
    """Добавляет отсутствующие определения; обновляет существующие по ключу из YAML-каталога."""
    if _mvp11_catalog_in_sync(db):
        return
    for spec in MVP11_EVENT_SPECS:
        existing = db.query(EventDefinition).filter(EventDefinition.key == spec["key"]).first()
        _sync_mvp11_spec(db, spec, existing)
    db.commit()
