"""Каталог страховых продуктов: продукт + объект → kind, подписи для UI."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class InsuranceProductSpec:
    product: str
    insured_object: str
    title: str
    product_label: str
    object_label: str

    @property
    def kind(self) -> str:
        return insurance_kind(self.product, self.insured_object)

    def to_dict(self) -> dict[str, Any]:
        return {
            "product": self.product,
            "insured_object": self.insured_object,
            "kind": self.kind,
            "title": self.title,
            "product_label": self.product_label,
            "object_label": self.object_label,
        }


def insurance_kind(product: str, insured_object: str) -> str:
    return f"{product.strip()}_{insured_object.strip()}"


# MVP-каталог (продукт × объект). Риски событий выводятся из пары, отдельные теги не храним.
INSURANCE_CATALOG: tuple[InsuranceProductSpec, ...] = (
    InsuranceProductSpec("mortgage", "life", "Ипотека — страхование жизни", "Ипотека", "Жизнь"),
    InsuranceProductSpec("mortgage", "property", "Ипотека — страхование имущества", "Ипотека", "Имущество"),
    InsuranceProductSpec("auto", "property", "КАСКО", "Авто", "Имущество"),
    InsuranceProductSpec("auto", "liability", "ОСАГО", "Авто", "Ответственность"),
    InsuranceProductSpec("health", "life", "Страхование здоровья", "Здоровье", "Жизнь"),
    InsuranceProductSpec("property", "property", "Страхование имущества", "Имущество", "Имущество"),
)

_CATALOG_BY_PAIR: dict[tuple[str, str], InsuranceProductSpec] = {
    (s.product, s.insured_object): s for s in INSURANCE_CATALOG
}

_CATALOG_BY_KIND: dict[str, InsuranceProductSpec] = {s.kind: s for s in INSURANCE_CATALOG}

# Сетка 2×2 на экране «Страховки» (основные пары MVP).
INSURANCE_GRID_KINDS: tuple[str, ...] = (
    "mortgage_life",
    "mortgage_property",
    "auto_liability",
    "auto_property",
)


@dataclass(frozen=True)
class InsurancePlanSpec:
    plan_key: str
    kind: str
    label: str
    monthly_premium: float
    payout_amount: float
    term_periods: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "plan_key": self.plan_key,
            "kind": self.kind,
            "label": self.label,
            "monthly_premium": self.monthly_premium,
            "payout_amount": self.payout_amount,
            "term_periods": self.term_periods,
        }


# Готовые тарифы на каждый тип (без ручного ввода в UI).
INSURANCE_PLANS: tuple[InsurancePlanSpec, ...] = (
    InsurancePlanSpec("mortgage_life_basic", "mortgage_life", "Базовый", 1200, 1_500_000, 12),
    InsurancePlanSpec("mortgage_life_standard", "mortgage_life", "Стандарт", 1800, 2_500_000, 12),
    InsurancePlanSpec("mortgage_life_plus", "mortgage_life", "Максимум", 2600, 4_000_000, 24),
    InsurancePlanSpec("mortgage_property_basic", "mortgage_property", "Базовый", 1400, 2_000_000, 12),
    InsurancePlanSpec("mortgage_property_standard", "mortgage_property", "Стандарт", 1800, 3_500_000, 12),
    InsurancePlanSpec("mortgage_property_plus", "mortgage_property", "Максимум", 2400, 5_000_000, 24),
    InsurancePlanSpec("auto_liability_basic", "auto_liability", "Базовый", 1800, 300_000, 12),
    InsurancePlanSpec("auto_liability_standard", "auto_liability", "Стандарт", 2400, 400_000, 12),
    InsurancePlanSpec("auto_liability_plus", "auto_liability", "Плюс", 3600, 600_000, 12),
    InsurancePlanSpec("auto_property_basic", "auto_property", "Базовый", 6500, 800_000, 12),
    InsurancePlanSpec("auto_property_standard", "auto_property", "Стандарт", 8500, 1_200_000, 12),
    InsurancePlanSpec("auto_property_plus", "auto_property", "Премиум", 12_000, 2_500_000, 24),
    InsurancePlanSpec("health_life_basic", "health_life", "Базовый", 900, 200_000, 12),
    InsurancePlanSpec("health_life_standard", "health_life", "Стандарт", 1500, 400_000, 12),
    InsurancePlanSpec("property_property_basic", "property_property", "Базовый", 1100, 500_000, 12),
    InsurancePlanSpec("property_property_standard", "property_property", "Стандарт", 1600, 1_000_000, 12),
)

_PLANS_BY_KEY: dict[str, InsurancePlanSpec] = {p.plan_key: p for p in INSURANCE_PLANS}

# Старый MVP: kind = health | property | car
_LEGACY_KIND_MAP: dict[str, tuple[str, str]] = {
    "health": ("health", "life"),
    "property": ("property", "property"),
    "car": ("auto", "property"),
}


def list_catalog() -> list[dict[str, Any]]:
    return [s.to_dict() for s in INSURANCE_CATALOG]


def list_grid_catalog() -> list[dict[str, Any]]:
    return [s.to_dict() for s in INSURANCE_CATALOG if s.kind in INSURANCE_GRID_KINDS]


def list_plans(*, kind: str | None = None) -> list[dict[str, Any]]:
    rows = INSURANCE_PLANS
    if kind:
        k = kind.strip()
        rows = tuple(p for p in rows if p.kind == k)
    return [p.to_dict() for p in rows]


def resolve_plan(plan_key: str) -> InsurancePlanSpec:
    key = (plan_key or "").strip()
    plan = _PLANS_BY_KEY.get(key)
    if not plan:
        raise ValueError(f"unknown insurance plan: {key}")
    return plan


def resolve_product_object(
    *,
    product: str | None = None,
    insured_object: str | None = None,
    kind: str | None = None,
) -> InsuranceProductSpec:
    p = (product or "").strip()
    o = (insured_object or "").strip()
    k = (kind or "").strip()

    if p and o:
        spec = _CATALOG_BY_PAIR.get((p, o))
        if not spec:
            raise ValueError(f"unknown insurance product/object: {p}/{o}")
        return spec

    if k:
        if k in _CATALOG_BY_KIND:
            return _CATALOG_BY_KIND[k]
        if k in _LEGACY_KIND_MAP:
            lp, lo = _LEGACY_KIND_MAP[k]
            return _CATALOG_BY_PAIR[(lp, lo)]
        raise ValueError(f"unknown insurance kind: {k}")

    raise ValueError("product and insured_object or kind required")


def legacy_kind_to_pair(kind: str) -> tuple[str, str]:
    k = (kind or "").strip()
    if k in _LEGACY_KIND_MAP:
        return _LEGACY_KIND_MAP[k]
    if k in _CATALOG_BY_KIND:
        s = _CATALOG_BY_KIND[k]
        return s.product, s.insured_object
    if "_" in k:
        product, _, obj = k.partition("_")
        if (product, obj) in _CATALOG_BY_PAIR:
            return product, obj
    raise ValueError(f"cannot map legacy kind: {kind}")
