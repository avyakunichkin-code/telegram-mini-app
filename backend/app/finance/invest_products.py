"""
Серверный каталог инвест-продуктов MVP: ставка задаётся только здесь, не клиентом.

FE дублирует значения в `frontend-react/src/constants/investProducts.js` (только для подписи в UI).
"""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import HTTPException


@dataclass(frozen=True)
class InvestProduct:
    kind: str
    annual_rate_percent: float
    default_title: str


INVEST_PRODUCTS: dict[str, InvestProduct] = {
    "deposit": InvestProduct(kind="deposit", annual_rate_percent=14.0, default_title="Депозит"),
    "bond": InvestProduct(kind="bond", annual_rate_percent=16.0, default_title="ОФЗ (условно)"),
}


def get_invest_product(kind: str) -> InvestProduct:
    product = INVEST_PRODUCTS.get(kind)
    if product is None:
        raise HTTPException(status_code=400, detail=f"Неизвестный инвест-продукт: {kind}")
    return product
