"""
Прогноз и стресс-сценарии (SPEC_plan-v1 §Расчёт отчёта, п. 2–3).

Движение денег считает только ядро: `month_step` → `next_snapshot`. Сценарий — модификатор
снимка на каждый месяц; Plan не знает формул платежей и начислений.
"""

from __future__ import annotations

import dataclasses
from collections.abc import Callable
from dataclasses import dataclass

from fincore.annuity import monthly_payment
from fincore.forecast import next_snapshot
from fincore.household import ExpenseLine, HouseholdSnapshot, Income, Liability
from fincore.liabilities import LIABILITY_KIND_MORTGAGE, PAYMENT_MODE_ANNUITY
from fincore.month import MonthResult, month_step

from ..schemas import CheckupData, Member
from . import config
from .adapter import month_label

Modifier = Callable[[int, HouseholdSnapshot, HouseholdSnapshot], HouseholdSnapshot]


@dataclass(frozen=True)
class Run:
    months: tuple[str, ...]
    liquid: tuple[float, ...]  # остаток на счёте минус просрочка, на конец месяца
    results: tuple[MonthResult, ...]

    @property
    def months_until_negative(self) -> int | None:
        for i, v in enumerate(self.liquid):
            if v < 0:
                return i + 1
        return None

    @property
    def min_liquid(self) -> float:
        return min(self.liquid) if self.liquid else 0.0


def run(start: HouseholdSnapshot, *, months: int = config.FORECAST_MONTHS, modifier: Modifier | None = None) -> Run:
    current, results, liquid = start, [], []
    for i in range(months):
        snap = modifier(i, current, start) if modifier else current
        result = month_step(snap, credit_income=True)
        results.append(result)
        overdue = sum(o.overdue_amount for o in result.liabilities)
        liquid.append(round(result.cash_end - overdue, 2))
        current = next_snapshot(snap, result)
    return Run(
        months=tuple(month_label(start.month_index + i) for i in range(months)),
        liquid=tuple(liquid),
        results=tuple(results),
    )


def verdict(r: Run, monthly_outflow: float) -> str:
    if r.months_until_negative is None:
        return "ok"
    return "edge" if r.min_liquid >= -monthly_outflow else "fail"


def _income_by_member(start: HouseholdSnapshot) -> dict[object, float]:
    by: dict[object, float] = {}
    for inc in start.incomes:
        by[inc.member_id] = by.get(inc.member_id, 0.0) + inc.monthly_amount
    return by


def main_earner(start: HouseholdSnapshot) -> object | None:
    by = _income_by_member(start)
    return max(by, key=by.get) if by else None


def s1_income_loss(start: HouseholdSnapshot) -> Modifier:
    earner = main_earner(start)

    def mod(i: int, snap: HouseholdSnapshot, orig: HouseholdSnapshot) -> HouseholdSnapshot:
        incomes = tuple(
            dataclasses.replace(inc, monthly_amount=0.0)
            if inc.member_id == earner and i < config.S1_MONTHS_WITHOUT_INCOME
            else inc
            for inc in orig.incomes
        )
        return dataclasses.replace(snap, incomes=incomes)

    return mod


def s2_child(start: HouseholdSnapshot, members: list[Member]) -> Modifier:
    adults = {m.id for m in members if m.role == "adult"}
    by = {k: v for k, v in _income_by_member(start).items() if k in adults or not adults}
    # уходит в декрет тот, у кого доход меньше (если доход один — он)
    leaver = min(by, key=by.get) if by else None
    child_line = ExpenseLine(id="s2_child", category_key="child", title="Ребёнок", amount_monthly=config.S2_CHILD_MONTHLY_COST)

    def mod(i: int, snap: HouseholdSnapshot, orig: HouseholdSnapshot) -> HouseholdSnapshot:
        cut = 1 - config.S2_PARENTAL_LEAVE_CUT if i < config.S2_MONTHS else 1.0
        incomes = tuple(
            dataclasses.replace(inc, monthly_amount=round(inc.monthly_amount * cut, 2)) if inc.member_id == leaver else inc
            for inc in orig.incomes
        )
        return dataclasses.replace(snap, incomes=incomes, expense_lines=orig.expense_lines + (child_line,))

    return mod


def s3_prices(start: HouseholdSnapshot) -> Modifier:
    grown = tuple(
        dataclasses.replace(e, amount_monthly=round(e.amount_monthly * (1 + config.S3_PRICE_GROWTH), 2))
        for e in start.expense_lines
    )

    def mod(i: int, snap: HouseholdSnapshot, orig: HouseholdSnapshot) -> HouseholdSnapshot:
        return dataclasses.replace(snap, expense_lines=grown)

    return mod


def combine(*mods: Modifier) -> Modifier:
    def mod(i: int, snap: HouseholdSnapshot, orig: HouseholdSnapshot) -> HouseholdSnapshot:
        for m in mods:
            snap = m(i, snap, orig)
            orig = dataclasses.replace(orig, incomes=snap.incomes, expense_lines=snap.expense_lines)
        return snap

    return mod


def with_decision(start: HouseholdSnapshot, data: CheckupData) -> tuple[HouseholdSnapshot, float] | None:
    """Снимок после решения «ипотека»: взнос списан, новый аннуитет добавлен. None — решения нет."""
    if not data.decision:
        return None
    d = data.decision[0]
    principal = float(d.price) - float(d.down_payment)
    payment = monthly_payment(principal, float(d.annual_rate), d.term_months) if principal > 0 else 0.0
    loan = Liability(
        id="decision",
        title="Новый кредит",
        total_debt=max(principal, 0.0),
        annual_rate_percent=float(d.annual_rate),
        monthly_payment=payment,
        kind=LIABILITY_KIND_MORTGAGE,
        payment_mode=PAYMENT_MODE_ANNUITY,
        term_months=d.term_months,
    )
    snap = dataclasses.replace(
        start,
        cash=round(start.cash - float(d.down_payment), 2),
        liabilities=start.liabilities + ((loan,) if principal > 0 else ()),
    )
    return snap, payment


def with_income_member(start: HouseholdSnapshot, member_id: object) -> tuple[Income, ...]:
    return tuple(i for i in start.incomes if i.member_id == member_id)
