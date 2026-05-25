"""Реестр справочников для admin API (Catalog Registry Lite)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Optional, Sequence

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from .models import (
    AssetTemplate,
    EventChoice,
    EventDefinition,
    GameStarterTemplate,
    LiabilityTemplate,
)


@dataclass(frozen=True)
class CatalogColumn:
    key: str
    label: str


@dataclass(frozen=True)
class CatalogSpec:
    key: str
    title: str
    model: type
    search_attrs: tuple[str, ...]
    order_by: tuple[Any, ...]
    columns: tuple[CatalogColumn, ...]
    serialize: Callable[[Any, dict[str, Any]], dict[str, Any]]


def _bool_active(value: Any) -> bool:
    return bool(value)


def _serialize_liability(row: LiabilityTemplate, _ctx: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.id,
        "template_key": row.template_key,
        "title": row.title,
        "total_debt": round(float(row.total_debt or 0), 2),
        "annual_rate_percent": round(float(row.annual_rate_percent or 0), 2),
        "is_active": _bool_active(row.is_active),
        "sort_order": int(row.sort_order or 0),
    }


def _serialize_asset(row: AssetTemplate, _ctx: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.id,
        "template_key": row.template_key,
        "title": row.title,
        "kind": row.kind,
        "asset_value": round(float(row.asset_value or 0), 2),
        "monthly_income": round(float(row.monthly_income or 0), 2),
        "is_active": _bool_active(row.is_active),
        "sort_order": int(row.sort_order or 0),
    }


def _serialize_starter(row: GameStarterTemplate, _ctx: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.id,
        "template_key": row.template_key,
        "title": row.title,
        "difficulty_rank": int(row.difficulty_rank or 0),
        "base_monthly_lifestyle_expense": round(float(row.base_monthly_lifestyle_expense or 0), 2),
        "applies_to_save_kind": row.applies_to_save_kind,
        "is_active": _bool_active(row.is_active),
        "sort_order": int(row.sort_order or 0),
    }


def _serialize_event(row: EventDefinition, ctx: dict[str, Any]) -> dict[str, Any]:
    counts: dict[int, int] = ctx.get("event_choice_counts") or {}
    return {
        "id": row.id,
        "key": row.key,
        "title": row.title,
        "mode": row.mode,
        "event_tier": int(row.event_tier or 0),
        "repeat_policy": row.repeat_policy,
        "weight": int(row.weight or 0),
        "choices_count": counts.get(int(row.id), 0),
        "is_active": _bool_active(row.is_active),
    }


CATALOGS: dict[str, CatalogSpec] = {
    "liabilities": CatalogSpec(
        key="liabilities",
        title="Шаблоны долгов",
        model=LiabilityTemplate,
        search_attrs=("template_key", "title"),
        order_by=(LiabilityTemplate.sort_order.asc(), LiabilityTemplate.id.asc()),
        columns=(
            CatalogColumn("template_key", "Ключ"),
            CatalogColumn("title", "Название"),
            CatalogColumn("total_debt", "Сумма"),
            CatalogColumn("annual_rate_percent", "Ставка %"),
            CatalogColumn("is_active", "Активен"),
            CatalogColumn("sort_order", "Порядок"),
        ),
        serialize=_serialize_liability,
    ),
    "assets": CatalogSpec(
        key="assets",
        title="Шаблоны активов",
        model=AssetTemplate,
        search_attrs=("template_key", "title", "kind"),
        order_by=(AssetTemplate.sort_order.asc(), AssetTemplate.id.asc()),
        columns=(
            CatalogColumn("template_key", "Ключ"),
            CatalogColumn("title", "Название"),
            CatalogColumn("kind", "Тип"),
            CatalogColumn("asset_value", "Стоимость"),
            CatalogColumn("monthly_income", "Доход/мес"),
            CatalogColumn("is_active", "Активен"),
            CatalogColumn("sort_order", "Порядок"),
        ),
        serialize=_serialize_asset,
    ),
    "starters": CatalogSpec(
        key="starters",
        title="Стартовые шаблоны",
        model=GameStarterTemplate,
        search_attrs=("template_key", "title"),
        order_by=(GameStarterTemplate.sort_order.asc(), GameStarterTemplate.id.asc()),
        columns=(
            CatalogColumn("template_key", "Ключ"),
            CatalogColumn("title", "Название"),
            CatalogColumn("difficulty_rank", "Сложность"),
            CatalogColumn("base_monthly_lifestyle_expense", "База расходов"),
            CatalogColumn("applies_to_save_kind", "Режим"),
            CatalogColumn("is_active", "Активен"),
            CatalogColumn("sort_order", "Порядок"),
        ),
        serialize=_serialize_starter,
    ),
    "events": CatalogSpec(
        key="events",
        title="События",
        model=EventDefinition,
        search_attrs=("key", "title", "category"),
        order_by=(EventDefinition.event_tier.asc(), EventDefinition.key.asc()),
        columns=(
            CatalogColumn("key", "Ключ"),
            CatalogColumn("title", "Название"),
            CatalogColumn("mode", "Режим"),
            CatalogColumn("event_tier", "Tier"),
            CatalogColumn("repeat_policy", "Повтор"),
            CatalogColumn("choices_count", "Варианты"),
            CatalogColumn("weight", "Вес"),
            CatalogColumn("is_active", "Активен"),
        ),
        serialize=_serialize_event,
    ),
}


def list_catalog_meta() -> list[dict[str, Any]]:
    return [
        {
            "key": spec.key,
            "title": spec.title,
            "columns": [{"key": c.key, "label": c.label} for c in spec.columns],
        }
        for spec in CATALOGS.values()
    ]


def get_catalog_spec(catalog_key: str) -> Optional[CatalogSpec]:
    return CATALOGS.get(catalog_key)


def _build_search_filter(spec: CatalogSpec, q: str):
    term = f"%{q.strip()}%"
    clauses = []
    for attr_name in spec.search_attrs:
        col = getattr(spec.model, attr_name, None)
        if col is not None:
            clauses.append(col.ilike(term))
    return or_(*clauses) if clauses else None


def _active_column(model: type):
    return getattr(model, "is_active", None)


def fetch_catalog_rows(
    db: Session,
    catalog_key: str,
    *,
    q: str = "",
    active_only: bool = False,
    limit: int = 200,
) -> tuple[CatalogSpec, list[dict[str, Any]], int]:
    spec = get_catalog_spec(catalog_key)
    if spec is None:
        raise KeyError(catalog_key)

    query = db.query(spec.model)
    active_col = _active_column(spec.model)
    if active_only and active_col is not None:
        query = query.filter(active_col == 1)

    q = (q or "").strip()
    if q:
        search_filter = _build_search_filter(spec, q)
        if search_filter is not None:
            query = query.filter(search_filter)

    total = query.count()
    rows = query.order_by(*spec.order_by).limit(limit).all()

    ctx: dict[str, Any] = {}
    if spec.key == "events" and rows:
        ids = [int(r.id) for r in rows]
        ctx["event_choice_counts"] = {
            int(def_id): int(cnt)
            for def_id, cnt in (
                db.query(EventChoice.definition_id, func.count(EventChoice.id))
                .filter(EventChoice.definition_id.in_(ids))
                .group_by(EventChoice.definition_id)
                .all()
            )
        }

    serialized = [spec.serialize(row, ctx) for row in rows]
    return spec, serialized, total
