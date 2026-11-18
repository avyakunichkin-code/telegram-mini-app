"""
Игровой профиль → `fincore.household.HouseholdSnapshot` (ADR-016, SPL-203).

Только чтение: не создаёт статьи, не истекает полисы, не пишет в БД.
Время: месяц ядра = период игры (`month_index = period_index`).

Предусловие для расчёта месяца: игровые подготовки уже сделаны —
`ensure_profile_expense_lines` (backfill статей из базы шаблона) и
`expire_expense_lines_for_period`. Иначе профиль без статей с base > 0 и delta ≠ 0
даст в снимке только delta, а игра спишет base + delta.
Порядок долгов, активов, полисов, вкладов и статей — по `id`, как в закрытии периода.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from fincore import household as hh
from fincore.metrics import HouseholdMetrics, compute_metrics

from ...finance.expenses import (
    active_expense_lines_query,
    ensure_expense_category_catalog,
    ensure_profile_expense_lines,
    expense_categories_for_core,
    expense_line_for_core,
    lifestyle_extra,
)
from ...finance.liability_kinds import effective_liability_kind, effective_payment_mode
from ...services.insurance.service import policy_for_core
from ...models import (
    FinanceAsset,
    FinanceLiability,
    FinanceSalary,
    GameProfile,
    InsurancePolicy,
    InvestmentPosition,
)


def month_index_for_period(period_index: int | None) -> int:
    return max(1, int(period_index or 1))


def _f(value) -> float:
    return float(value or 0)


def _opt_int(value) -> int | None:
    return int(value) if value is not None else None


def _expense_lines(db: Session, profile: GameProfile, period_index: int) -> tuple[hh.ExpenseLine, ...]:
    categories = expense_categories_for_core(db)
    return tuple(
        expense_line_for_core(row, categories)
        for row in active_expense_lines_query(db, profile.id, period_index).all()
    )


def build_household_snapshot(db: Session, profile: GameProfile) -> hh.HouseholdSnapshot:
    period_index = month_index_for_period(profile.period_index)

    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    incomes = (
        (hh.Income(monthly_amount=_f(salary.monthly_amount), receipts_per_month=int(salary.monthly_receipts_count or 1)),)
        if salary is not None
        else ()
    )

    liabilities = tuple(
        hh.Liability(
            id=int(li.id),
            title=li.title,
            total_debt=_f(li.total_debt),
            annual_rate_percent=_f(li.annual_rate_percent),
            monthly_payment=_f(li.monthly_payment),
            overdue_amount=_f(li.overdue_amount),
            overdue_months=int(li.overdue_periods or 0),
            kind=effective_liability_kind(li),
            payment_mode=effective_payment_mode(li),
            term_months=_opt_int(li.term_periods),
            months_paid=int(li.periods_paid or 0),
            secured_asset_id=_opt_int(li.secured_asset_id),
        )
        for li in db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id, FinanceLiability.is_active == 1)
        .order_by(FinanceLiability.id)
        .all()
    )

    assets = tuple(
        hh.Asset(
            id=int(a.id),
            title=a.title,
            kind=str(a.kind or "generic"),
            value=_f(a.asset_value),
            monthly_maintenance=_f(a.monthly_maintenance_cost),
            monthly_income=_f(a.monthly_income),
        )
        for a in db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == profile.id, FinanceAsset.is_active == 1)
        .order_by(FinanceAsset.id)
        .all()
    )

    policies = tuple(
        policy_for_core(p)
        for p in db.query(InsurancePolicy)
        .filter(InsurancePolicy.game_profile_id == profile.id, InsurancePolicy.is_active == 1)
        .order_by(InsurancePolicy.id)
        .all()
    )

    investments = tuple(
        hh.InvestmentPosition(
            id=int(pos.id),
            kind=pos.kind,
            title=pos.title,
            principal=_f(pos.principal),
            annual_rate_percent=_f(pos.annual_rate_percent),
            last_accrued_month_index=int(pos.last_accrued_period or 0),
        )
        for pos in db.query(InvestmentPosition)
        .filter(InvestmentPosition.game_profile_id == profile.id, InvestmentPosition.is_active == 1)
        .order_by(InvestmentPosition.id)
        .all()
    )

    expense_lines = _expense_lines(db, profile, period_index)

    return hh.HouseholdSnapshot(
        month_index=period_index,
        cash=_f(profile.cash_balance),
        safety_fund=_f(profile.safety_fund_balance),
        incomes=incomes,
        liabilities=liabilities,
        assets=assets,
        expense_lines=expense_lines,
        extra_monthly_expense=lifestyle_extra(profile, bool(expense_lines)),
        policies=policies,
        investments=investments,
    )


def prepared_household_snapshot(db: Session, profile: GameProfile) -> hh.HouseholdSnapshot:
    """
    Снимок для расчётов вне закрытия (overview, превью, цели победы): сначала backfill статей из базы
    шаблона, если их нет, — как делал `compute_monthly_burn`. Пишет в БД только этот backfill.
    """
    ensure_expense_category_catalog(db)
    ensure_profile_expense_lines(db, profile)
    return build_household_snapshot(db, profile)


def household_metrics(db: Session, profile: GameProfile) -> HouseholdMetrics:
    """Метрики ADR-009 профиля — одна формула для overview, целей победы и аналитики (SPL-207b)."""
    return compute_metrics(prepared_household_snapshot(db, profile))
