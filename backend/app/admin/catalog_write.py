"""Создание и клонирование строк справочников (C1)."""

from __future__ import annotations

import json
import time
from typing import Any, Optional

from sqlalchemy.orm import Session

from ..models import (
    AssetTemplate,
    EventChoice,
    EventDefinition,
    GameStarterTemplate,
    GameStarterTemplateExpenseAllocation,
    LiabilityTemplate,
)
from .catalogs import get_catalog_spec

def _draft_key(prefix: str, explicit: Optional[str] = None) -> str:
    raw = (explicit or "").strip()
    if raw:
        return raw
    return f"draft_{prefix}_{int(time.time())}"


def _ensure_unique_key(db: Session, model: type, attr: str, base: str) -> str:
    candidate = base
    col = getattr(model, attr)
    n = 2
    while db.query(model).filter(col == candidate).first() is not None:
        candidate = f"{base}_{n}"
        n += 1
    return candidate


def create_catalog_row(
    db: Session,
    catalog_key: str,
    *,
    template_key: Optional[str] = None,
    key: Optional[str] = None,
    title: Optional[str] = None,
) -> dict[str, Any]:
    spec = get_catalog_spec(catalog_key)
    if spec is None:
        raise KeyError(catalog_key)

    if catalog_key == "liabilities":
        tkey = _ensure_unique_key(
            db,
            LiabilityTemplate,
            "template_key",
            _draft_key("liab", template_key),
        )
        row = LiabilityTemplate(
            template_key=tkey,
            title=(title or "Черновик обязательства").strip(),
            total_debt=100_000.0,
            annual_rate_percent=12.0,
            is_active=0,
            sort_order=9999,
        )
        db.add(row)
        db.flush()
        return {"id": row.id, "template_key": row.template_key}

    if catalog_key == "assets":
        tkey = _ensure_unique_key(
            db,
            AssetTemplate,
            "template_key",
            _draft_key("asset", template_key),
        )
        row = AssetTemplate(
            template_key=tkey,
            title=(title or "Черновик актива").strip(),
            kind="generic",
            asset_value=1.0,
            monthly_maintenance_cost=0.0,
            monthly_income=0.0,
            is_active=0,
            sort_order=9999,
        )
        db.add(row)
        db.flush()
        return {"id": row.id, "template_key": row.template_key}

    if catalog_key == "starters":
        tkey = _ensure_unique_key(
            db,
            GameStarterTemplate,
            "template_key",
            _draft_key("starter", template_key),
        )
        row = GameStarterTemplate(
            template_key=tkey,
            title=(title or "Черновик стартера").strip(),
            difficulty_rank=1,
            base_monthly_lifestyle_expense=0.0,
            blueprint_json="{}",
            victory_config_json="{}",
            is_active=0,
            sort_order=9999,
            applies_to_save_kind="game",
        )
        db.add(row)
        db.flush()
        return {"id": row.id, "template_key": row.template_key}

    if catalog_key == "events":
        ekey = _ensure_unique_key(
            db,
            EventDefinition,
            "key",
            _draft_key("event", key or template_key),
        )
        row = EventDefinition(
            key=ekey,
            mode="game",
            title=(title or "Черновик события").strip(),
            description="",
            weight=10,
            is_active=0,
            event_tier=1,
            repeat_policy="repeatable",
            cooldown_periods=0,
            content_class="universal",
            event_slot="period_choice",
            audience_template_keys='["all"]',
            metadata_json="{}",
            prerequisites_json="{}",
        )
        db.add(row)
        db.flush()
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


def clone_catalog_row(db: Session, catalog_key: str, row_id: int) -> dict[str, Any]:
    spec = get_catalog_spec(catalog_key)
    if spec is None:
        raise KeyError(catalog_key)

    source = db.query(spec.model).filter(spec.model.id == row_id).first()
    if source is None:
        raise LookupError("row not found")

    if catalog_key == "liabilities":
        assert isinstance(source, LiabilityTemplate)
        tkey = _ensure_unique_key(
            db,
            LiabilityTemplate,
            "template_key",
            f"{source.template_key}_copy",
        )
        row = LiabilityTemplate(
            template_key=tkey,
            title=f"{source.title} (копия)",
            total_debt=source.total_debt,
            annual_rate_percent=source.annual_rate_percent,
            is_active=0,
            sort_order=int(source.sort_order or 9999),
        )
        db.add(row)
        db.flush()
        return {"id": row.id, "template_key": row.template_key}

    if catalog_key == "assets":
        assert isinstance(source, AssetTemplate)
        tkey = _ensure_unique_key(
            db,
            AssetTemplate,
            "template_key",
            f"{source.template_key}_copy",
        )
        row = AssetTemplate(
            template_key=tkey,
            title=f"{source.title} (копия)",
            kind=source.kind,
            asset_value=source.asset_value,
            monthly_maintenance_cost=source.monthly_maintenance_cost,
            monthly_income=source.monthly_income,
            estate_role=source.estate_role,
            monthly_rent_cost=source.monthly_rent_cost,
            monthly_utilities_cost=source.monthly_utilities_cost,
            income_yield_annual=source.income_yield_annual,
            has_tenants_default=source.has_tenants_default,
            is_active=0,
            sort_order=int(source.sort_order or 9999),
        )
        db.add(row)
        db.flush()
        return {"id": row.id, "template_key": row.template_key}

    if catalog_key == "starters":
        assert isinstance(source, GameStarterTemplate)
        tkey = _ensure_unique_key(
            db,
            GameStarterTemplate,
            "template_key",
            f"{source.template_key}_copy",
        )
        row = GameStarterTemplate(
            template_key=tkey,
            title=f"{source.title} (копия)",
            difficulty_rank=source.difficulty_rank,
            base_monthly_lifestyle_expense=source.base_monthly_lifestyle_expense,
            blueprint_json=source.blueprint_json,
            victory_config_json=source.victory_config_json,
            is_active=0,
            sort_order=int(source.sort_order or 9999),
            applies_to_save_kind=source.applies_to_save_kind,
        )
        db.add(row)
        db.flush()
        for alloc in (
            db.query(GameStarterTemplateExpenseAllocation)
            .filter(GameStarterTemplateExpenseAllocation.template_key == source.template_key)
            .all()
        ):
            db.add(
                GameStarterTemplateExpenseAllocation(
                    template_key=tkey,
                    category_key=alloc.category_key,
                    weight=alloc.weight,
                )
            )
        db.flush()
        return {"id": row.id, "template_key": row.template_key}

    if catalog_key == "events":
        assert isinstance(source, EventDefinition)
        ekey = _ensure_unique_key(db, EventDefinition, "key", f"{source.key}_copy")
        row = EventDefinition(
            key=ekey,
            mode=source.mode,
            title=f"{source.title} (копия)",
            description=source.description,
            weight=source.weight,
            is_active=0,
            mandatory=source.mandatory,
            mandatory_gate=source.mandatory_gate,
            category=source.category,
            metadata_json=source.metadata_json,
            prerequisites_json=source.prerequisites_json,
            event_tier=source.event_tier,
            repeat_policy=source.repeat_policy,
            repeat_max=source.repeat_max,
            cooldown_periods=source.cooldown_periods,
            content_class=source.content_class,
            event_slot=source.event_slot,
            audience_template_keys=source.audience_template_keys,
        )
        db.add(row)
        db.flush()
        for ch in source.choices:
            db.add(
                EventChoice(
                    definition_id=row.id,
                    title=ch.title,
                    description=ch.description,
                    effects_json=ch.effects_json,
                )
            )
        db.flush()
        return {"id": row.id, "key": row.key}

    raise KeyError(catalog_key)
