"""Инвест-продукты: тип и поиск по каталогу. Сам каталог со ставками — у приложения (у игры свой баланс)."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass


class UnknownInvestProduct(ValueError):
    """Запрошен вид продукта, которого нет в каталоге."""

    def __init__(self, kind: str):
        super().__init__(f"Неизвестный инвест-продукт: {kind}")
        self.kind = kind


@dataclass(frozen=True)
class InvestProduct:
    kind: str
    annual_rate_percent: float
    default_title: str


def find_invest_product(catalog: Mapping[str, InvestProduct], kind: str) -> InvestProduct:
    product = catalog.get(kind)
    if product is None:
        raise UnknownInvestProduct(kind)
    return product
