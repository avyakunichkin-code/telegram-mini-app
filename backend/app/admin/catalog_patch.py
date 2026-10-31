"""PATCH строк справочников (C2)."""

from __future__ import annotations

import json
import math
from typing import Any, Optional

from sqlalchemy.orm import Session

from ..events.mvp11_seeds import YAML_EVENT_READONLY_DETAIL, is_yaml_catalog_event_key
from ..models import AssetTemplate, EventDefinition, GameStarterTemplate, LiabilityTemplate
from .catalog_validate import (
    validate_audience_template_keys,
    validate_blueprint_json,
    validate_generic_json_object,
    validate_victory_config_json,
)
from .catalog_detail import get_catalog_row_detail
from .catalogs import get_catalog_spec


def _coerce_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in ("1", "true", "yes", "on")
    return bool(value)


def _coerce_number(value: Any, cast: type, *, nullable: bool = False) -> Any:
    """int/float из JSON или строки формы; мусор, bool, NaN/inf → ValueError (→ 422, не 500)."""
    if nullable and (value is None or value == ""):
        return None
    if isinstance(value, bool) or value is None:
        raise ValueError(value)
    try:
        result = cast(value)
    except (TypeError, ValueError, OverflowError) as exc:
        raise ValueError(value) from exc
    if cast is float and not math.isfinite(result):
        raise ValueError(value)
    return result


def patch_catalog_row(
    db: Session,
    catalog_key: str,
    row_id: int,
    patch: dict[str, Any],
) -> tuple[dict[str, Any] | None, dict[str, list[str]]]:
    """
    Применить частичное обновление. Возвращает (detail, errors).
    Если errors не пуст — detail None, строка не сохранена.
    """
    spec = get_catalog_spec(catalog_key)
    if spec is None:
        raise KeyError(catalog_key)

    row = db.query(spec.model).filter(spec.model.id == row_id).first()
    if row is None:
        raise LookupError("row not found")

    errors: dict[str, list[str]] = {}
    data = dict(patch or {})

    def set_errors(field: str, msgs: list[str]) -> None:
        if msgs:
            errors[field] = msgs

    def set_number(field: str, cast: type, *, nullable: bool = False) -> None:
        if field not in data:
            return
        try:
            setattr(row, field, _coerce_number(data[field], cast, nullable=nullable))
        except ValueError:
            set_errors(field, ["Ожидается целое число" if cast is int else "Ожидается число"])

    if catalog_key == "liabilities":
        assert isinstance(row, LiabilityTemplate)
        if "template_key" in data:
            key = str(data["template_key"] or "").strip()
            if key and key != row.template_key:
                if (
                    db.query(LiabilityTemplate)
                    .filter(LiabilityTemplate.template_key == key)
                    .first()
                ):
                    set_errors("template_key", ["Ключ уже занят"])
                else:
                    row.template_key = key
        if "title" in data:
            row.title = str(data["title"] or "").strip() or row.title
        set_number("total_debt", float)
        set_number("annual_rate_percent", float)
        if "is_active" in data:
            row.is_active = 1 if _coerce_bool(data["is_active"]) else 0
        set_number("sort_order", int)

    elif catalog_key == "assets":
        assert isinstance(row, AssetTemplate)
        if "template_key" in data:
            key = str(data["template_key"] or "").strip()
            if key and key != row.template_key:
                if db.query(AssetTemplate).filter(AssetTemplate.template_key == key).first():
                    set_errors("template_key", ["Ключ уже занят"])
                else:
                    row.template_key = key
        for field in (
            "title",
            "kind",
            "estate_role",
        ):
            if field in data:
                setattr(row, field, str(data[field] or "").strip() or getattr(row, field))
        for field in (
            "asset_value",
            "monthly_maintenance_cost",
            "monthly_income",
            "monthly_rent_cost",
            "monthly_utilities_cost",
        ):
            set_number(field, float)
        set_number("income_yield_annual", float, nullable=True)
        if "has_tenants_default" in data:
            row.has_tenants_default = 1 if _coerce_bool(data["has_tenants_default"]) else 0
        if "is_active" in data:
            row.is_active = 1 if _coerce_bool(data["is_active"]) else 0
        set_number("sort_order", int)

    elif catalog_key == "starters":
        assert isinstance(row, GameStarterTemplate)
        if "template_key" in data:
            key = str(data["template_key"] or "").strip()
            if key and key != row.template_key:
                if (
                    db.query(GameStarterTemplate)
                    .filter(GameStarterTemplate.template_key == key)
                    .first()
                ):
                    set_errors("template_key", ["Ключ уже занят"])
                else:
                    row.template_key = key
        if "title" in data:
            row.title = str(data["title"] or "").strip() or row.title
        set_number("difficulty_rank", int)
        set_number("base_monthly_lifestyle_expense", float)
        if "applies_to_save_kind" in data:
            row.applies_to_save_kind = str(data["applies_to_save_kind"] or "game")
        if "is_active" in data:
            row.is_active = 1 if _coerce_bool(data["is_active"]) else 0
        set_number("sort_order", int)
        if "blueprint_json" in data:
            raw = data["blueprint_json"]
            if isinstance(raw, dict):
                raw = json.dumps(raw, ensure_ascii=False)
            set_errors("blueprint_json", validate_blueprint_json(str(raw)))
            if "blueprint_json" not in errors:
                row.blueprint_json = str(raw)
        if "victory_config_json" in data:
            raw = data["victory_config_json"]
            if isinstance(raw, dict):
                raw = json.dumps(raw, ensure_ascii=False)
            set_errors("victory_config_json", validate_victory_config_json(str(raw)))
            if "victory_config_json" not in errors:
                row.victory_config_json = str(raw)

    elif catalog_key == "events":
        assert isinstance(row, EventDefinition)
        if is_yaml_catalog_event_key(row.key):
            # ADR-008: канон — data/events/mvp11/*.yaml; правка в БД откатится при следующем синке.
            return None, {"key": [YAML_EVENT_READONLY_DETAIL]}
        if "key" in data:
            key = str(data["key"] or "").strip()
            if key and key != row.key:
                if db.query(EventDefinition).filter(EventDefinition.key == key).first():
                    set_errors("key", ["Ключ уже занят"])
                else:
                    row.key = key
        for field in ("title", "description", "mode", "category", "mandatory_gate", "content_class", "event_slot", "repeat_policy"):
            if field in data:
                setattr(row, field, str(data[field] if data[field] is not None else ""))
        set_number("weight", int)
        set_number("event_tier", int)
        set_number("repeat_max", int, nullable=True)
        set_number("cooldown_periods", int)
        if "mandatory" in data:
            row.mandatory = 1 if _coerce_bool(data["mandatory"]) else 0
        if "is_active" in data:
            row.is_active = 1 if _coerce_bool(data["is_active"]) else 0
        if "audience_template_keys" in data:
            raw = data["audience_template_keys"]
            if isinstance(raw, (list, dict)):
                raw = json.dumps(raw, ensure_ascii=False)
            set_errors("audience_template_keys", validate_audience_template_keys(str(raw)))
            if "audience_template_keys" not in errors:
                row.audience_template_keys = str(raw)
        for json_field in ("metadata_json", "prerequisites_json"):
            if json_field in data:
                raw = data[json_field]
                if isinstance(raw, dict):
                    raw = json.dumps(raw, ensure_ascii=False)
                set_errors(json_field, validate_generic_json_object(str(raw), field_label=json_field))
                if json_field not in errors:
                    setattr(row, json_field, str(raw))
    else:
        raise KeyError(catalog_key)

    if errors:
        return None, errors

    db.flush()
    return get_catalog_row_detail(db, catalog_key, row_id), {}
