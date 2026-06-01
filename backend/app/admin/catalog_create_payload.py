"""Создание строк справочника из полного payload (форма «Создать»)."""

from __future__ import annotations

import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from ..models import (
    AssetTemplate,
    EventChoice,
    EventDefinition,
    GameStarterTemplate,
    LiabilityTemplate,
)
from .catalog_choices import create_event_choice
from .catalog_write import _draft_key, _ensure_unique_key


def _bool_int(value: Any, default: int = 0) -> int:
    if isinstance(value, bool):
        return 1 if value else 0
    if isinstance(value, int):
        return 1 if value != 0 else 0
    if isinstance(value, str):
        return 1 if value.strip().lower() in ("1", "true", "yes", "on") else 0
    return default


def create_catalog_row_payload(
    db: Session,
    catalog_key: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    data = dict(payload or {})

    if catalog_key == "liabilities":
        tkey = _ensure_unique_key(
            db,
            LiabilityTemplate,
            "template_key",
            str(data.get("template_key") or "").strip() or _draft_key("liab"),
        )
        row = LiabilityTemplate(
            template_key=tkey,
            title=str(data.get("title") or "Новое обязательство").strip(),
            total_debt=float(data.get("total_debt") or 100_000),
            annual_rate_percent=float(data.get("annual_rate_percent") or 12),
            is_active=_bool_int(data.get("is_active"), 0),
            sort_order=int(data.get("sort_order") or 9999),
        )
        db.add(row)
        db.flush()
        return {"id": row.id, "template_key": row.template_key}

    if catalog_key == "assets":
        tkey = _ensure_unique_key(
            db,
            AssetTemplate,
            "template_key",
            str(data.get("template_key") or "").strip() or _draft_key("asset"),
        )
        row = AssetTemplate(
            template_key=tkey,
            title=str(data.get("title") or "Новый актив").strip(),
            kind=str(data.get("kind") or "generic").strip(),
            asset_value=float(data.get("asset_value") or 1),
            monthly_maintenance_cost=float(data.get("monthly_maintenance_cost") or 0),
            monthly_income=float(data.get("monthly_income") or 0),
            estate_role=data.get("estate_role"),
            is_active=_bool_int(data.get("is_active"), 0),
            sort_order=int(data.get("sort_order") or 9999),
        )
        db.add(row)
        db.flush()
        return {"id": row.id, "template_key": row.template_key}

    if catalog_key == "starters":
        tkey = _ensure_unique_key(
            db,
            GameStarterTemplate,
            "template_key",
            str(data.get("template_key") or "").strip() or _draft_key("starter"),
        )
        row = GameStarterTemplate(
            template_key=tkey,
            title=str(data.get("title") or "Новый стартер").strip(),
            difficulty_rank=int(data.get("difficulty_rank") or 1),
            base_monthly_lifestyle_expense=float(data.get("base_monthly_lifestyle_expense") or 0),
            blueprint_json=str(data.get("blueprint_json") or "{}"),
            victory_config_json=str(data.get("victory_config_json") or "{}"),
            is_active=_bool_int(data.get("is_active"), 0),
            sort_order=int(data.get("sort_order") or 9999),
            applies_to_save_kind=str(data.get("applies_to_save_kind") or "game").strip(),
        )
        db.add(row)
        db.flush()
        return {"id": row.id, "template_key": row.template_key}

    if catalog_key == "events":
        ekey = _ensure_unique_key(
            db,
            EventDefinition,
            "key",
            str(data.get("key") or "").strip() or _draft_key("event"),
        )
        row = EventDefinition(
            key=ekey,
            mode=str(data.get("mode") or "game").strip(),
            title=str(data.get("title") or "Новое событие").strip(),
            description=str(data.get("description") or "").strip(),
            weight=int(data.get("weight") or 10),
            is_active=_bool_int(data.get("is_active"), 0),
            mandatory=_bool_int(data.get("mandatory"), 0),
            mandatory_gate=str(data.get("mandatory_gate") or "none").strip(),
            category=data.get("category"),
            metadata_json=str(data.get("metadata_json") or "{}"),
            prerequisites_json=str(data.get("prerequisites_json") or "{}"),
            event_tier=int(data.get("event_tier") or 1),
            repeat_policy=str(data.get("repeat_policy") or "repeatable").strip(),
            repeat_max=data.get("repeat_max"),
            cooldown_periods=int(data.get("cooldown_periods") or 0),
            content_class=str(data.get("content_class") or "universal").strip(),
            event_slot=str(data.get("event_slot") or "period_choice").strip(),
            audience_template_keys=str(data.get("audience_template_keys") or '["all"]'),
        )
        db.add(row)
        db.flush()
        choices = data.get("choices")
        if isinstance(choices, list) and choices:
            for ch in choices:
                if not isinstance(ch, dict):
                    continue
                create_event_choice(
                    db,
                    int(row.id),
                    title=str(ch.get("title") or "Вариант"),
                    description=str(ch.get("description") or ""),
                    effects=ch.get("effects") if ch.get("effects") is not None else ch.get("effects_json"),
                )
        else:
            db.add(
                EventChoice(
                    definition_id=row.id,
                    title="Вариант 1",
                    description="",
                    effects_json=json.dumps({"cash_delta": 0}, ensure_ascii=False),
                )
            )
            db.flush()
        return {"id": row.id, "key": row.key}

    raise KeyError(catalog_key)
