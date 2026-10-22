"""
Прогноз на N месяцев вперёд (SPL-206): `month_step` в цикле.

Снимок следующего месяца собирается из итогов предыдущего: остаток, долги (погашенные
выпадают), вклады. Статьи расходов и полисы переносятся как есть — срок у них по `month_index`,
ядро само перестаёт их учитывать после истечения. Новых событий, покупок и решений прогноз
не знает: это «что будет, если ничего не менять».
"""

from __future__ import annotations

import dataclasses
from collections.abc import Mapping

from .expenses import ExpenseCategory
from .household import HouseholdSnapshot
from .month import MonthResult, month_step


def next_snapshot(snapshot: HouseholdSnapshot, result: MonthResult) -> HouseholdSnapshot:
    """Снимок на начало месяца `month_index + 1` после месяца с итогом `result`."""
    outcomes = {o.id: o for o in result.liabilities}
    liabilities = tuple(
        dataclasses.replace(
            li,
            total_debt=o.total_debt,
            overdue_amount=o.overdue_amount,
            overdue_months=o.overdue_months,
            months_paid=o.months_paid,
        )
        for li in snapshot.liabilities
        if (o := outcomes[li.id]).is_active
    )
    accrued = {o.id: o for o in result.investments}
    investments = tuple(
        dataclasses.replace(
            pos,
            principal=accrued[pos.id].principal,
            last_accrued_month_index=accrued[pos.id].last_accrued_month_index,
        )
        if pos.id in accrued
        else pos
        for pos in snapshot.investments
    )
    return dataclasses.replace(
        snapshot,
        month_index=snapshot.month_index + 1,
        cash=result.cash_end,
        liabilities=liabilities,
        investments=investments,
    )


def forecast(
    snapshot: HouseholdSnapshot,
    *,
    months: int,
    categories: Mapping[str, ExpenseCategory] | None = None,
    credit_income: bool = False,
) -> tuple[MonthResult, ...]:
    """Итоги `months` месяцев подряд, начиная с `snapshot.month_index`."""
    if months < 1:
        raise ValueError("months must be >= 1")
    results: list[MonthResult] = []
    current = snapshot
    for _ in range(months):
        result = month_step(current, categories=categories, credit_income=credit_income)
        results.append(result)
        current = next_snapshot(current, result)
    return tuple(results)
