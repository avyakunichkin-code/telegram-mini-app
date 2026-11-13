"""
Адаптер чекапа Plan → `fincore.HouseholdSnapshot` (SPEC_plan-v1 §Адаптер).

Из одного чекапа — два снимка: `base` (середины диапазонов) и `pessimistic` (доход — min,
расходы — max, накопления — min). Время: календарный `YYYY-MM` → `month_index`.
"""

from __future__ import annotations

import math
from typing import Literal

from fincore.annuity import monthly_interest_payment
from fincore.household import Asset, ExpenseLine, HouseholdSnapshot, Income, InsurancePolicy, InvestmentPosition, Liability
from fincore.liabilities import (
    LIABILITY_KIND_AUTO_LOAN,
    LIABILITY_KIND_CONSUMER,
    LIABILITY_KIND_MORTGAGE,
    LIABILITY_KIND_UNSECURED,
    PAYMENT_MODE_ANNUITY,
    PAYMENT_MODE_INTEREST_ONLY,
)

from ..schemas import CheckupData, LiabilityRow, Range
from . import config

Mode = Literal["base", "pessimistic"]
Side = Literal["income", "expense", "asset"]

_KIND = {
    "mortgage": LIABILITY_KIND_MORTGAGE,
    "car": LIABILITY_KIND_AUTO_LOAN,
    "consumer": LIABILITY_KIND_CONSUMER,
    "card": LIABILITY_KIND_UNSECURED,
    "microloan": LIABILITY_KIND_UNSECURED,
    "private": LIABILITY_KIND_UNSECURED,
}


def month_index(ym: str) -> int:
    year, month = (int(x) for x in ym.split("-"))
    return (year - 2000) * 12 + (month - 1)


def month_label(index: int) -> str:
    return f"{2000 + index // 12:04d}-{index % 12 + 1:02d}"


def pick(r: Range, mode: Mode, side: Side) -> float:
    lo, hi = float(r.min), float(r.max)
    if mode == "base":
        return round((lo + hi) / 2, 2)
    return hi if side == "expense" else lo


def remaining_term(balance: float, annual_rate: float, payment: float) -> int | None:
    """Сколько месяцев гасится долг при фиксированном платеже; None — платёж не покрывает проценты."""
    if balance <= 0:
        return 0
    r = annual_rate / 100 / 12
    if r == 0:
        return max(1, math.ceil(balance / payment)) if payment > 0 else None
    if payment <= balance * r + 0.005:
        return None
    return max(1, math.ceil(-math.log(1 - r * balance / payment) / math.log(1 + r)))


def to_liability(row: LiabilityRow, index: int) -> Liability:
    balance, rate, payment = float(row.balance), float(row.annual_rate), float(row.monthly_payment)
    term = row.term_months_left or remaining_term(balance, rate, payment)
    if term:
        mode = PAYMENT_MODE_ANNUITY
    else:
        # платёж не гасит тело: в ядре это «только проценты», тело стоит на месте
        mode, payment = PAYMENT_MODE_INTEREST_ONLY, max(payment, monthly_interest_payment(balance, rate))
    return Liability(
        id=row.id or f"li{index}",
        title=row.title,
        total_debt=balance,
        annual_rate_percent=rate,
        monthly_payment=payment,
        overdue_amount=float(row.overdue_amount),
        overdue_months=1 if row.overdue_amount > 0 else 0,
        kind=_KIND[row.kind],
        payment_mode=mode,
        term_months=term or None,
        member_id=row.member_id,
    )


def build_snapshot(data: CheckupData, as_of: str, mode: Mode = "base", *, merge_cushion: bool = False) -> HouseholdSnapshot:
    """
    `merge_cushion=True` — для прогноза: в Plan семья тратит подушку, когда кончаются деньги
    на счёте, а ядро платит только из `cash`. Для метрик подушка остаётся отдельно.
    """
    m = month_index(as_of)
    cash = sum(pick(s.amount, mode, "asset") for s in data.savings if not s.is_safety_fund and s.kind != "deposit")
    cushion = sum(pick(s.amount, mode, "asset") for s in data.savings if s.is_safety_fund)
    deposits = tuple(
        InvestmentPosition(
            id=f"dep{i}",
            kind="deposit",
            title="Вклад",
            principal=pick(s.amount, mode, "asset"),
            annual_rate_percent=float(s.annual_rate),
            last_accrued_month_index=m - 1,
        )
        for i, s in enumerate(data.savings)
        if s.kind == "deposit" and not s.is_safety_fund
    )
    assets = tuple(
        Asset(
            id=f"as{i}",
            title=a.title or a.kind,
            kind=a.kind,
            value=float(a.value),
            monthly_maintenance=float(a.monthly_maintenance),
            monthly_income=float(a.monthly_income),
        )
        for i, a in enumerate(data.assets)
    ) + tuple(
        Asset(id=f"inv{i}", title=inv.asset_class, kind=f"invest:{inv.asset_class}", value=float(inv.amount))
        for i, inv in enumerate(data.investments)
    )
    return HouseholdSnapshot(
        month_index=m,
        cash=round(cash + (cushion if merge_cushion else 0.0), 2),
        safety_fund=0.0 if merge_cushion else round(cushion, 2),
        incomes=tuple(Income(monthly_amount=pick(i.amount, mode, "income"), member_id=i.member_id) for i in data.incomes),
        liabilities=tuple(to_liability(li, i) for i, li in enumerate(data.liabilities)),
        assets=assets,
        expense_lines=tuple(
            ExpenseLine(
                id=f"ex{i}",
                category_key=e.category_key,
                title=e.title or e.category_key,
                amount_monthly=pick(e.amount, mode, "expense"),
                tier=e.tier,
            )
            for i, e in enumerate(data.expenses)
        ),
        policies=tuple(
            InsurancePolicy(
                id=f"pol{i}",
                title=p.kind,
                kind=p.kind,
                monthly_premium=float(p.monthly_premium),
                coverage_limit=float(p.coverage),
                started_month_index=m - 1,
            )
            for i, p in enumerate(data.insurance)
        ),
        investments=deposits,
    )


def precision(data: CheckupData) -> tuple[str, float]:
    """Доля «точных» денежных полей, взвешенная по сумме (SPEC §Ввод диапазонами)."""
    ranges = [i.amount for i in data.incomes] + [e.amount for e in data.expenses] + [s.amount for s in data.savings]
    total = exact = 0.0
    for r in ranges:
        weight = float(r.max)
        if weight <= 0:
            continue
        total += weight
        if float(r.min) > 0 and float(r.max) / float(r.min) <= config.PRECISION_EXACT_RATIO:
            exact += weight
    # оценённые по платежу кредиты из быстрого старта тоже снижают точность
    for li in data.liabilities:
        total += float(li.monthly_payment)
        if not li.estimated:
            exact += float(li.monthly_payment)
    share = exact / total if total > 0 else 0.0
    if share >= config.PRECISION_REFINED:
        return "refined", share
    if share >= config.PRECISION_APPROX:
        return "approximate", share
    return "draft", share
