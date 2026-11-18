"""CRUD вариантов ответа для EventDefinition (C2e)."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from ..models import EventChoice, EventDefinition


def _parse_effects(raw: Any) -> str:
    if isinstance(raw, dict):
        return json.dumps(raw, ensure_ascii=False)
    if isinstance(raw, str):
        text = raw.strip() or "{}"
        json.loads(text)  # validate
        return text
    return "{}"


def list_event_choices(db: Session, definition_id: int) -> list[dict[str, Any]]:
    rows = (
        db.query(EventChoice)
        .filter(EventChoice.definition_id == definition_id)
        .order_by(EventChoice.id.asc())
        .all()
    )
    out: list[dict[str, Any]] = []
    for row in rows:
        try:
            effects = json.loads(row.effects_json or "{}")
        except json.JSONDecodeError:
            effects = {}
        out.append(
            {
                "id": row.id,
                "definition_id": row.definition_id,
                "title": row.title,
                "description": row.description or "",
                "effects": effects,
                "effects_json": row.effects_json or "{}",
            }
        )
    return out


def create_event_choice(
    db: Session,
    definition_id: int,
    *,
    title: str,
    description: str = "",
    effects: Any = None,
) -> dict[str, Any]:
    definition = db.query(EventDefinition).filter(EventDefinition.id == definition_id).first()
    if definition is None:
        raise LookupError("definition not found")
    title_clean = (title or "").strip()
    if not title_clean:
        raise ValueError("title required")
    row = EventChoice(
        definition_id=definition_id,
        title=title_clean,
        description=(description or "").strip(),
        effects_json=_parse_effects(effects if effects is not None else {}),
    )
    db.add(row)
    db.flush()
    return list_event_choices(db, definition_id)[-1]


def patch_event_choice(
    db: Session,
    choice_id: int,
    *,
    title: str | None = None,
    description: str | None = None,
    effects: Any = None,
) -> dict[str, Any] | None:
    row = db.query(EventChoice).filter(EventChoice.id == choice_id).first()
    if row is None:
        return None
    if title is not None:
        t = str(title).strip()
        if not t:
            raise ValueError("title required")
        row.title = t
    if description is not None:
        row.description = str(description).strip()
    if effects is not None:
        row.effects_json = _parse_effects(effects)
    db.flush()
    items = list_event_choices(db, int(row.definition_id))
    for item in items:
        if item["id"] == choice_id:
            return item
    return None


def delete_event_choice(db: Session, choice_id: int) -> bool:
    row = db.query(EventChoice).filter(EventChoice.id == choice_id).first()
    if row is None:
        return False
    db.delete(row)
    db.flush()
    return True
