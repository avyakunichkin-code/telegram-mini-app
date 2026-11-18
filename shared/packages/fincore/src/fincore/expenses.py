"""
Расходы на жизнь за месяц по статьям бюджета (SPL-204).

Статья активна в месяце `m`, если у неё нет срока или `expires_month_index > m`.
Сумма статьи не бывает отрицательной; расходы вне статей (`extra`) — могут.
Итог = max(0, Σ статей + extra) — то же ограничение снизу, что в `HouseholdSnapshot`.

Округление — `round(…, 2)`, как в игре до переноса: сумма каждой статьи и итоги.
Суммы по категориям складываются до округления статей.
"""

from __future__ import annotations

import dataclasses
from collections.abc import Iterable, Mapping
from dataclasses import dataclass

from .household import ExpenseLine

DEFAULT_TIER = "must"


@dataclass(frozen=True)
class ExpenseCategory:
    """Справочник категории: название и уровень по умолчанию (обязательная / по желанию)."""

    title: str
    default_tier: str = DEFAULT_TIER


@dataclass(frozen=True)
class CategoryBurn:
    category_key: str
    title: str
    amount: float
    tier: str


@dataclass(frozen=True)
class MonthlyBurn:
    """
    `lines` — активные статьи в порядке входа, сумма каждой ≥ 0 и округлена до копеек.
    `by_category` — по убыванию суммы; при равенстве — в порядке первой статьи категории.
    """

    total: float
    lines_sum: float
    extra: float
    lines: tuple[ExpenseLine, ...] = ()
    by_category: tuple[CategoryBurn, ...] = ()


def is_line_active(line: ExpenseLine, month_index: int) -> bool:
    return line.expires_month_index is None or line.expires_month_index > month_index


def monthly_burn(
    lines: Iterable[ExpenseLine],
    *,
    month_index: int,
    extra: float = 0.0,
    categories: Mapping[str, ExpenseCategory] | None = None,
) -> MonthlyBurn:
    categories = categories or {}
    active: list[ExpenseLine] = []
    by_cat: dict[str, float] = {}
    for line in lines:
        if not is_line_active(line, month_index):
            continue
        amount = max(0.0, float(line.amount_monthly))
        active.append(dataclasses.replace(line, amount_monthly=round(amount, 2)))
        by_cat[line.category_key] = by_cat.get(line.category_key, 0.0) + amount

    lines_sum = sum(line.amount_monthly for line in active)
    total = max(0.0, lines_sum + extra)

    by_category = tuple(
        CategoryBurn(
            category_key=key,
            title=categories[key].title if key in categories else key,
            amount=round(amount, 2),
            tier=categories[key].default_tier if key in categories else DEFAULT_TIER,
        )
        for key, amount in sorted(by_cat.items(), key=lambda item: -item[1])
    )
    return MonthlyBurn(
        total=round(total, 2),
        lines_sum=round(lines_sum, 2),
        extra=round(extra, 2),
        lines=tuple(active),
        by_category=by_category,
    )
