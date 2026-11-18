"""
Словарь финансовых метрик ADR-009 поверх `HouseholdSnapshot` (SPL-207).

Одна формула — одно место: игра (overview, цели победы, аналитика) и Plan считают
метрики отсюда. Имена — по ADR-009 §2; поля API игры сохраняют свои старые имена.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from .expenses import monthly_burn
from .household import HouseholdSnapshot, Liability
from .liabilities import PAYMENT_MODE_ANNUITY


def structural_obligations(snap: HouseholdSnapshot) -> float:
    """Σ платежей по долгам + Σ обслуживания активов (без расходов на жизнь)."""
    return liability_payments(snap) + asset_maintenance(snap)


def liability_payments(snap: HouseholdSnapshot) -> float:
    return sum(li.monthly_payment for li in snap.liabilities)


def asset_maintenance(snap: HouseholdSnapshot) -> float:
    return sum(a.monthly_maintenance for a in snap.assets)


def lifestyle_burn(snap: HouseholdSnapshot) -> float:
    """Расходы на жизнь за месяц: статьи + расходы вне статей, не меньше нуля (`expenses.monthly_burn`)."""
    return monthly_burn(snap.expense_lines, month_index=snap.month_index, extra=snap.extra_monthly_expense).total


def asset_income(snap: HouseholdSnapshot) -> float:
    return sum(a.monthly_income for a in snap.assets)


def income_steady(snap: HouseholdSnapshot) -> float:
    """Регулярный доход: доходы домохозяйства + доход от активов (аренда и т. п.)."""
    return snap.monthly_income + asset_income(snap)


def invest_income_projection(snap: HouseholdSnapshot) -> float:
    """
    Проекция дохода от вкладов за месяц: 1/12 годовой ставки по позициям с телом и ставкой > 0.
    Все виды позиций (у игры сейчас только deposit и bond; вход целей победы считает только их).
    """
    return sum(
        pos.principal * (pos.annual_rate_percent / 100.0) / 12.0
        for pos in snap.investments
        if pos.principal > 0 and pos.annual_rate_percent > 0
    )


def liability_owed(li: Liability) -> float:
    """
    Сколько реально должны по одному долгу (для капитала).
    Аннуитет: пропущенный взнос остаётся в теле долга — просрочку не прибавляем, иначе тело
    посчиталось бы дважды (невыплаченные проценты взноса при этом не учтены — оценка снизу).
    Только проценты: просрочка — неоплаченные проценты сверх тела, прибавляем.
    """
    if li.payment_mode == PAYMENT_MODE_ANNUITY:
        return li.total_debt
    return li.total_debt + li.overdue_amount


def safe_ratio(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator > 0 else 0.0


def average_liquid_delta(liquid_by_month: Sequence[float], max_intervals: int = 6) -> tuple[float, int]:
    """
    Среднее изменение ликвидности (cash + подушка) между соседними закрытиями месяца.
    Вход — значения по возрастанию месяца; берём до `max_intervals` последних интервалов.
    """
    if max_intervals <= 0:
        return 0.0, 0
    window = list(liquid_by_month)[-(max_intervals + 1):]
    if len(window) < 2:
        return 0.0, 0
    deltas = [window[i] - window[i - 1] for i in range(1, len(window))]
    tail = deltas[-max_intervals:]
    return round(sum(tail) / len(tail), 2), len(tail)


@dataclass(frozen=True)
class HouseholdMetrics:
    """
    Метрики ADR-009 §2 на снимке. Не округлены — округляет потребитель под свой контракт.

    - `expense_to_income_ratio` — база «доход с проекцией вкладов» (KPI overview). У цели победы
      `expense_to_income_ratio` база другая — зарплата (ADR-009 §2.3); её здесь нет.
    - `net_structural_cashflow` — без проекции вкладов (как вход целей победы);
      `..._with_invest` — с проекцией (как `net_monthly_cashflow` в overview).
    - `total_debt` — только тела (ADR-009 §2.1); просрочка — отдельно в `total_overdue`.
    - `net_worth` — ликвидность + активы + вклады − `liability_owed` по долгам (см. там оговорку).
    """

    liability_payments: float
    asset_maintenance: float
    structural_obligations: float
    lifestyle_burn: float
    total_monthly_outflow: float
    income_steady: float
    invest_income_projection: float
    income_with_invest_projection: float
    passive_income: float
    net_structural_cashflow: float
    net_structural_cashflow_with_invest: float
    expense_to_income_ratio: float
    liabilities_to_income_percent: float
    total_debt: float
    total_overdue: float
    liquid: float
    safety_fund_months: float
    net_worth: float


def compute_metrics(snap: HouseholdSnapshot) -> HouseholdMetrics:
    payments = liability_payments(snap)
    maintenance = asset_maintenance(snap)
    obligations = payments + maintenance
    burn = lifestyle_burn(snap)
    outflow = obligations + burn
    steady = income_steady(snap)
    invest = invest_income_projection(snap)
    income_full = steady + invest
    debt = sum(li.total_debt for li in snap.liabilities)
    overdue = sum(li.overdue_amount for li in snap.liabilities)
    liquid = snap.cash + snap.safety_fund
    holdings = sum(a.value for a in snap.assets) + sum(pos.principal for pos in snap.investments)
    return HouseholdMetrics(
        liability_payments=payments,
        asset_maintenance=maintenance,
        structural_obligations=obligations,
        lifestyle_burn=burn,
        total_monthly_outflow=outflow,
        income_steady=steady,
        invest_income_projection=invest,
        income_with_invest_projection=income_full,
        passive_income=asset_income(snap) + invest,
        net_structural_cashflow=steady - obligations,
        net_structural_cashflow_with_invest=income_full - obligations,
        expense_to_income_ratio=safe_ratio(burn, income_full),
        liabilities_to_income_percent=safe_ratio(payments, income_full) * 100,
        total_debt=debt,
        total_overdue=overdue,
        liquid=liquid,
        safety_fund_months=safe_ratio(snap.safety_fund, outflow),
        net_worth=liquid + holdings - sum(liability_owed(li) for li in snap.liabilities),
    )
