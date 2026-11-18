"""
Шаг одного месяца по снимку домохозяйства (SPL-205, ADR-016).

`month_step(snapshot)` считает, что произойдёт с деньгами за месяц, и ничего не пишет:
проводки по порядку, итог по каждому долгу и вкладу, расходы на жизнь. Приложение само
переносит проводки в свой журнал, а итоги — в свои таблицы.

Порядок проводок — часть контракта: платёж по долгу берёт столько, сколько осталось после
предыдущих списаний.
  0. доход (только при `credit_income=True`; у игры зарплата приходит по кнопке и уже в `cash`)
  1. обслуживание активов (может увести в минус)
  2. доход от активов
  3. долги по порядку снимка: платим сколько есть, остаток уходит в просрочку
  4. расходы на жизнь (могут увести в минус)
  5. страховые премии (могут увести в минус)
  6. вклады: депозит капитализирует проценты, облигация платит купон на счёт

Остаток после каждой проводки округляется до копеек (`quantize_money`) — так же, как его
хранит приложение; от этого зависит, сколько достанется следующему долгу.
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass

from .annuity import split_full_payment
from .expenses import ExpenseCategory, MonthlyBurn, monthly_burn
from .household import HouseholdSnapshot, Liability
from .insurance import premium_due
from .liabilities import PAYMENT_MODE_ANNUITY
from .money import EPSILON, quantize_money

POSTING_INCOME = "income"
POSTING_ASSET_MAINTENANCE = "asset_maintenance"
POSTING_ASSET_INCOME = "asset_income"
POSTING_LIABILITY_PAYMENT = "liability_payment"
POSTING_LIFESTYLE_EXPENSE = "lifestyle_expense"
POSTING_INSURANCE_PREMIUM = "insurance_premium"
POSTING_BOND_COUPON = "bond_coupon"


@dataclass(frozen=True)
class Posting:
    """Движение денег на счёте. `amount` со знаком; `ref_id` — долг или вклад, если проводка про него."""

    kind: str
    amount: float
    cash_after: float
    ref_id: int | str | None = None
    title: str = ""


@dataclass(frozen=True)
class LiabilityOutcome:
    """Долг после месяца: сколько причиталось и заплачено, тело, просрочка, срок."""

    id: int | str
    title: str
    due: float
    paid: float
    unpaid: float
    total_debt: float
    overdue_amount: float
    overdue_months: int
    months_paid: int
    is_active: bool


@dataclass(frozen=True)
class InvestmentOutcome:
    id: int | str
    kind: str
    title: str
    principal: float
    last_accrued_month_index: int
    interest: float = 0.0
    coupon: float = 0.0


@dataclass(frozen=True)
class MonthResult:
    month_index: int
    cash_start: float
    cash_end: float
    postings: tuple[Posting, ...]
    liabilities: tuple[LiabilityOutcome, ...]
    investments: tuple[InvestmentOutcome, ...]
    burn: MonthlyBurn
    asset_maintenance: float = 0.0
    asset_income: float = 0.0
    insurance_premiums: float = 0.0
    deposit_interest: float = 0.0
    bond_coupons: float = 0.0
    overdue_added: float = 0.0

    def postings_of(self, kind: str) -> tuple[Posting, ...]:
        return tuple(p for p in self.postings if p.kind == kind)


def installments_outstanding(amount: float, monthly_due: float) -> int:
    """Сколько взносов (включая частично оплаченный) покрывает неоплаченная сумма."""
    if monthly_due <= EPSILON or amount <= EPSILON:
        return 0
    return int(math.ceil(round(amount / monthly_due, 6)))


class _Ledger:
    def __init__(self, cash: float) -> None:
        self.cash = cash
        self.postings: list[Posting] = []

    def post(self, kind: str, amount: float, *, ref_id=None, title: str = "") -> None:
        self.cash = quantize_money(self.cash + amount)
        self.postings.append(Posting(kind=kind, amount=amount, cash_after=self.cash, ref_id=ref_id, title=title))


def _pay_liability(ledger: _Ledger, li: Liability) -> tuple[LiabilityOutcome, float]:
    """Возвращает итог долга и сумму, ушедшую в просрочку в этом месяце."""
    monthly_due = float(li.monthly_payment)
    previous_overdue = float(li.overdue_amount or 0)
    due_total = monthly_due + previous_overdue

    available = max(0.0, float(ledger.cash))
    paid = min(available, due_total)
    unpaid = round(due_total - paid, 2)
    if paid > 0:
        ledger.post(POSTING_LIABILITY_PAYMENT, -paid, ref_id=li.id, title=li.title)

    total_debt = float(li.total_debt)
    months_paid = int(li.months_paid or 0)
    is_active = True
    if li.payment_mode == PAYMENT_MODE_ANNUITY:
        # Платёж гасит самые старые взносы первыми: каждый полностью закрытый взнос
        # (в т.ч. просроченный) уменьшает тело долга по графику аннуитета.
        completed = installments_outstanding(previous_overdue, monthly_due) + 1 - installments_outstanding(
            unpaid, monthly_due
        )
        for _ in range(max(0, completed)):
            if not is_active:
                break
            _interest, _principal, total_debt = split_full_payment(
                total_debt, float(li.annual_rate_percent), monthly_due
            )
            months_paid += 1
            term = int(li.term_months or 0)
            if total_debt <= EPSILON or (term > 0 and months_paid >= term):
                is_active = False
                total_debt = 0.0

    overdue_added = 0.0
    if unpaid <= EPSILON and paid + EPSILON >= due_total:
        overdue_amount, overdue_months = 0.0, 0
    else:
        overdue_amount = float(unpaid)
        if unpaid > EPSILON:
            overdue_months = int(li.overdue_months or 0) + 1
            overdue_added = unpaid
        else:
            overdue_months = 0

    outcome = LiabilityOutcome(
        id=li.id,
        title=li.title,
        due=due_total,
        paid=paid,
        unpaid=unpaid,
        total_debt=total_debt,
        overdue_amount=overdue_amount,
        overdue_months=overdue_months,
        months_paid=months_paid,
        is_active=is_active,
    )
    return outcome, overdue_added


def month_step(
    snapshot: HouseholdSnapshot,
    *,
    categories: Mapping[str, ExpenseCategory] | None = None,
    credit_income: bool = False,
) -> MonthResult:
    m = int(snapshot.month_index)
    ledger = _Ledger(float(snapshot.cash))

    if credit_income:
        for income in snapshot.incomes:
            if income.monthly_amount:
                ledger.post(POSTING_INCOME, float(income.monthly_amount))

    maintenance = sum(float(a.monthly_maintenance) for a in snapshot.assets)
    if maintenance > 0:
        ledger.post(POSTING_ASSET_MAINTENANCE, -maintenance)
    asset_income = sum(float(a.monthly_income or 0) for a in snapshot.assets)
    if asset_income > 0:
        ledger.post(POSTING_ASSET_INCOME, asset_income)

    liabilities: list[LiabilityOutcome] = []
    overdue_added = 0.0
    for li in snapshot.liabilities:
        outcome, added = _pay_liability(ledger, li)
        liabilities.append(outcome)
        overdue_added += added

    burn = monthly_burn(
        snapshot.expense_lines,
        month_index=m,
        extra=snapshot.extra_monthly_expense,
        categories=categories,
    )
    if burn.total > 0:
        ledger.post(POSTING_LIFESTYLE_EXPENSE, -burn.total)

    premiums = 0.0
    for policy in snapshot.policies:
        due = premium_due(policy, m)
        if due > 0:
            premiums += due
    if premiums > 0:
        ledger.post(POSTING_INSURANCE_PREMIUM, -premiums)

    investments: list[InvestmentOutcome] = []
    deposit_interest = 0.0
    bond_coupons = 0.0
    for pos in snapshot.investments:
        last_accrued = int(pos.last_accrued_month_index or 0)
        months = m - last_accrued
        if last_accrued >= m or months <= 0:
            continue
        monthly_rate = float(pos.annual_rate_percent) / 100.0 / 12.0
        principal = float(pos.principal)
        interest = coupon = 0.0
        if pos.kind == "deposit":
            interest = principal * monthly_rate * months
            principal = principal + interest
            deposit_interest += interest
        elif pos.kind == "bond":
            coupon = principal * monthly_rate * months
            if coupon != 0:
                ledger.post(POSTING_BOND_COUPON, +coupon, ref_id=pos.id, title=pos.title)
                bond_coupons += coupon
        investments.append(
            InvestmentOutcome(
                id=pos.id,
                kind=pos.kind,
                title=pos.title,
                principal=principal,
                last_accrued_month_index=m,
                interest=interest,
                coupon=coupon,
            )
        )

    return MonthResult(
        month_index=m,
        cash_start=float(snapshot.cash),
        cash_end=ledger.cash,
        postings=tuple(ledger.postings),
        liabilities=tuple(liabilities),
        investments=tuple(investments),
        burn=burn,
        asset_maintenance=maintenance,
        asset_income=asset_income,
        insurance_premiums=premiums,
        deposit_interest=deposit_interest,
        bond_coupons=bond_coupons,
        overdue_added=overdue_added,
    )
