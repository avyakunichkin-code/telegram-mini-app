"""
Серверный каталог инвест-продуктов игры: ставка задаётся только здесь, не клиентом.
Ставки — баланс игры, поэтому каталог не в ядре; тип и поиск — `fincore.invest` (ADR-016).

FE дублирует значения в `frontend-react/src/constants/investProducts.js` (только для подписи в UI).
"""

from __future__ import annotations

from fastapi import HTTPException

from fincore.invest import InvestProduct, UnknownInvestProduct, find_invest_product

INVEST_PRODUCTS: dict[str, InvestProduct] = {
    "deposit": InvestProduct(kind="deposit", annual_rate_percent=14.0, default_title="Депозит"),
    "bond": InvestProduct(kind="bond", annual_rate_percent=16.0, default_title="ОФЗ (условно)"),
}


def get_invest_product(kind: str) -> InvestProduct:
    try:
        return find_invest_product(INVEST_PRODUCTS, kind)
    except UnknownInvestProduct as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
