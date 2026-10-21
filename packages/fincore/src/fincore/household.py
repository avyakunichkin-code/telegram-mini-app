"""
Финансовое состояние домохозяйства на начало месяца — вход для расчётов ядра (ADR-016, SPL-203).

Только финансы: ни потребностей, ни событий, ни победы. Время — `month_index`;
приложение само переводит своё время (ход игры, календарный месяц Plan) в индекс месяца.
Идентификаторы — непрозрачные ключи приложения: ядро их только переносит в результат.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .liabilities import PAYMENT_MODE_INTEREST_ONLY


@dataclass(frozen=True)
class Income:
    """Регулярный доход за месяц (зарплата и т. п.)."""

    monthly_amount: float
    receipts_per_month: int = 1


@dataclass(frozen=True)
class Liability:
    id: int | str
    title: str
    total_debt: float
    annual_rate_percent: float
    monthly_payment: float
    overdue_amount: float = 0.0
    overdue_months: int = 0
    kind: str = "unsecured"
    payment_mode: str = PAYMENT_MODE_INTEREST_ONLY
    term_months: int | None = None
    months_paid: int = 0
    secured_asset_id: int | str | None = None


@dataclass(frozen=True)
class Asset:
    id: int | str
    title: str
    kind: str
    value: float
    monthly_maintenance: float = 0.0
    monthly_income: float = 0.0


@dataclass(frozen=True)
class ExpenseLine:
    id: int | str
    category_key: str
    title: str
    amount_monthly: float
    tier: str = "must"
    expires_month_index: int | None = None


@dataclass(frozen=True)
class InsurancePolicy:
    id: int | str
    title: str
    kind: str
    monthly_premium: float
    coverage_limit: float = 0.0
    started_month_index: int | None = None
    expires_month_index: int | None = None
    claimed_month_index: int | None = None
    insured_asset_id: int | str | None = None


@dataclass(frozen=True)
class InvestmentPosition:
    id: int | str
    kind: str
    title: str
    principal: float
    annual_rate_percent: float
    last_accrued_month_index: int


@dataclass(frozen=True)
class HouseholdSnapshot:
    """
    Снимок перед расчётом месяца `month_index`.

    `extra_monthly_expense` — расходы на жизнь вне статей (у игры: legacy-дельта
    или базовый бюджет шаблона без статей), может быть отрицательной.
    Расходы на жизнь за месяц = max(0, сумма статей + extra) — ограничение снизу делает ядро.

    `incomes` — справочно: зачислять ли доход в расчёте месяца, решает вызывающий
    (у игры зарплата приходит по кнопке и уже лежит в `cash`).
    """

    month_index: int
    cash: float
    safety_fund: float = 0.0
    incomes: tuple[Income, ...] = field(default_factory=tuple)
    liabilities: tuple[Liability, ...] = field(default_factory=tuple)
    assets: tuple[Asset, ...] = field(default_factory=tuple)
    expense_lines: tuple[ExpenseLine, ...] = field(default_factory=tuple)
    extra_monthly_expense: float = 0.0
    policies: tuple[InsurancePolicy, ...] = field(default_factory=tuple)
    investments: tuple[InvestmentPosition, ...] = field(default_factory=tuple)

    @property
    def monthly_income(self) -> float:
        return sum(i.monthly_amount for i in self.incomes)

    @property
    def total_debt(self) -> float:
        return sum(li.total_debt + li.overdue_amount for li in self.liabilities)
