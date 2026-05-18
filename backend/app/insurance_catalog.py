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

# Старый MVP: kind = health | property | car
_LEGACY_KIND_MAP: dict[str, tuple[str, str]] = {
    "health": ("health", "life"),
    "property": ("property", "property"),
    "car": ("auto", "property"),
}


def list_catalog() -> list[dict[str, Any]]:
    return [s.to_dict() for s in INSURANCE_CATALOG]


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
