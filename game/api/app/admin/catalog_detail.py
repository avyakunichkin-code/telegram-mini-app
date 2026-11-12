"""Детальная строка справочника для редактора (C2)."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from ..models import AssetTemplate, EventDefinition, GameStarterTemplate, LiabilityTemplate
from .catalog_choices import list_event_choices
from .catalogs import get_catalog_spec


def get_catalog_row_detail(db: Session, catalog_key: str, row_id: int) -> dict[str, Any] | None:
    spec = get_catalog_spec(catalog_key)
    if spec is None:
        raise KeyError(catalog_key)

    row = db.query(spec.model).filter(spec.model.id == row_id).first()
    if row is None:
        return None

    if catalog_key == "liabilities":
        assert isinstance(row, LiabilityTemplate)
        return {
            "id": row.id,
            "catalog_key": catalog_key,
            "template_key": row.template_key,
            "title": row.title,
            "total_debt": float(row.total_debt or 0),
            "annual_rate_percent": float(row.annual_rate_percent or 0),
            "is_active": bool(row.is_active),
            "sort_order": int(row.sort_order or 0),
        }

    if catalog_key == "assets":
        assert isinstance(row, AssetTemplate)
        return {
            "id": row.id,
            "catalog_key": catalog_key,
            "template_key": row.template_key,
            "title": row.title,
            "kind": row.kind,
            "asset_value": float(row.asset_value or 0),
            "monthly_maintenance_cost": float(row.monthly_maintenance_cost or 0),
            "monthly_income": float(row.monthly_income or 0),
            "estate_role": row.estate_role,
            "monthly_rent_cost": float(row.monthly_rent_cost or 0),
            "monthly_utilities_cost": float(row.monthly_utilities_cost or 0),
            "income_yield_annual": row.income_yield_annual,
            "has_tenants_default": bool(row.has_tenants_default),
            "is_active": bool(row.is_active),
            "sort_order": int(row.sort_order or 0),
        }

    if catalog_key == "starters":
        assert isinstance(row, GameStarterTemplate)
        return {
            "id": row.id,
            "catalog_key": catalog_key,
            "template_key": row.template_key,
            "title": row.title,
            "difficulty_rank": int(row.difficulty_rank or 0),
            "base_monthly_lifestyle_expense": float(row.base_monthly_lifestyle_expense or 0),
            "applies_to_save_kind": row.applies_to_save_kind,
            "is_active": bool(row.is_active),
            "sort_order": int(row.sort_order or 0),
            "blueprint_json": row.blueprint_json or "{}",
            "victory_config_json": row.victory_config_json or "{}",
        }

    if catalog_key == "events":
        assert isinstance(row, EventDefinition)
        return {
            "id": row.id,
            "catalog_key": catalog_key,
            "key": row.key,
            "title": row.title,
            "description": row.description or "",
            "mode": row.mode,
            "weight": int(row.weight or 0),
            "is_active": bool(row.is_active),
            "mandatory": bool(row.mandatory),
            "mandatory_gate": row.mandatory_gate,
            "category": row.category,
            "event_tier": int(row.event_tier or 1),
            "repeat_policy": row.repeat_policy,
            "repeat_max": row.repeat_max,
            "cooldown_periods": int(row.cooldown_periods or 0),
            "content_class": row.content_class,
            "event_slot": row.event_slot,
            "audience_template_keys": row.audience_template_keys or '["all"]',
            "metadata_json": row.metadata_json or "{}",
            "prerequisites_json": row.prerequisites_json or "{}",
            "choices": list_event_choices(db, int(row.id)),
        }

    raise KeyError(catalog_key)
