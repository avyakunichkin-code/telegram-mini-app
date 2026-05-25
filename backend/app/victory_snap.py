"""Снимок метрик для victory engine (пассивный доход, активы)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from typing import TYPE_CHECKING

from .expenses import compute_monthly_burn
from .finance_analytics import avg_net_cashflow_last_closed_intervals
from .balance_utils import TRANSACTION_TYPES
from .models import (
    FinanceAsset,
    FinanceLiability,
    FinanceSalary,
    GameProfile,
    InvestmentPosition,
    PeriodSnapshot,
    Transaction,
)

if TYPE_CHECKING:
    from .victory_engine import VictoryEvaluationInput

# Согласовано с каталогом активов и blueprint шаблонов (vehicle = legacy в сидах).
CAR_ASSET_KINDS = frozenset({"car_personal", "car_taxi", "vehicle", "rental_car", "car"})
RENTAL_HOME_ASSET_KINDS = frozenset(
    {"rental_home", "rental_house", "rental_mansion"}
)


def compute_monthly_passive_income(db: Session, profile_id: int, *, period_index: int) -> float:
    """Депозиты (%%/12) + купоны облигаций + monthly_income активов."""
    assets = (
        db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == profile_id, FinanceAsset.is_active == 1)
        .all()
    )
    monthly_asset_income = sum(float(getattr(a, "monthly_income", 0) or 0) for a in assets)

    bonds = (
        db.query(InvestmentPosition)
        .filter(
            InvestmentPosition.game_profile_id == profile_id,
            InvestmentPosition.is_active == 1,
            InvestmentPosition.kind == "bond",
        )
        .all()
    )
    bond_monthly = sum(
        float(p.principal or 0) * float(p.annual_rate_percent or 0) / 100.0 / 12.0 for p in bonds
    )

    deposits = (
        db.query(InvestmentPosition)
        .filter(
            InvestmentPosition.game_profile_id == profile_id,
            InvestmentPosition.is_active == 1,
            InvestmentPosition.kind == "deposit",
        )
        .all()
    )
    deposit_monthly = 0.0
    for pos in deposits:
        principal = float(pos.principal or 0)
        rate = float(pos.annual_rate_percent or 0) / 100.0
        deposit_monthly += principal * rate / 12.0

    return round(monthly_asset_income + bond_monthly + deposit_monthly, 2)


def _salary_ever_claimed(db: Session, profile: GameProfile) -> bool:
    if int(getattr(profile, "last_period_salary_claimed", 0) or 0) > 0:
        return True
    row = (
        db.query(PeriodSnapshot.id)
        .filter(
            PeriodSnapshot.game_profile_id == profile.id,
            PeriodSnapshot.salary_claimed == 1,
        )
        .first()
    )
    return row is not None


def _safety_ever_contributed(db: Session, profile_id: int) -> bool:
    snap = (
        db.query(PeriodSnapshot.id)
        .filter(
            PeriodSnapshot.game_profile_id == profile_id,
            PeriodSnapshot.safety_fund_contribution > 0,
        )
        .first()
    )
    if snap is not None:
        return True
    tx = (
        db.query(Transaction.id)
        .filter(
            Transaction.game_profile_id == profile_id,
            Transaction.type == TRANSACTION_TYPES["SAFETY_FUND_CONTRIBUTION"],
        )
        .first()
    )
    return tx is not None


def _has_active_investment(db: Session, profile_id: int, kind: str) -> bool:
    row = (
        db.query(InvestmentPosition.id)
        .filter(
            InvestmentPosition.game_profile_id == profile_id,
            InvestmentPosition.is_active == 1,
            InvestmentPosition.kind == kind,
        )
        .first()
    )
    return row is not None


def active_asset_kinds(db: Session, profile_id: int) -> frozenset[str]:
    rows = (
        db.query(FinanceAsset.kind)
        .filter(FinanceAsset.game_profile_id == profile_id, FinanceAsset.is_active == 1)
        .all()
    )
    return frozenset(str(r[0] or "").strip() for r in rows if r[0])


def build_victory_evaluation_input(db: Session, profile: GameProfile) -> VictoryEvaluationInput:
    from .victory_engine import VictoryEvaluationInput
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    liabilities_orm = (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id, FinanceLiability.is_active == 1)
        .all()
    )
    assets_orm = (
        db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == profile.id, FinanceAsset.is_active == 1)
        .all()
    )

    assets_income = sum(float(a.monthly_income or 0) for a in assets_orm)
    total_liability_payment = sum(float(l.monthly_payment or 0) for l in liabilities_orm)
    total_asset_maintenance = sum(float(a.monthly_maintenance_cost or 0) for a in assets_orm)
    total_monthly_obligations = total_liability_payment + total_asset_maintenance
    monthly_salary = float(salary.monthly_amount if salary else 0)
    total_income = monthly_salary + assets_income
    net_cashflow = total_income - total_monthly_obligations
    total_overdue_amount = sum(float(l.overdue_amount or 0) for l in liabilities_orm)

    avg_cf_6, avg_cf_n = avg_net_cashflow_last_closed_intervals(db, profile.id, max_intervals=6)
    monthly_burn_total = float(compute_monthly_burn(db, profile).total)
    period_index = int(profile.period_index or 1)
    monthly_passive = compute_monthly_passive_income(db, profile.id, period_index=period_index)
    monthly_expenses_total = monthly_burn_total + total_monthly_obligations

    return VictoryEvaluationInput(
        period_index=period_index,
        safety_fund_balance=float(profile.safety_fund_balance),
        cash_balance=float(profile.cash_balance),
        total_monthly_obligations=float(total_monthly_obligations),
        total_overdue_amount=float(total_overdue_amount),
        net_monthly_cashflow=float(net_cashflow),
        monthly_salary=monthly_salary,
        monthly_burn_total=monthly_burn_total,
        avg_net_cashflow_6p=float(avg_cf_6),
        avg_net_cashflow_6p_n=int(avg_cf_n),
        monthly_passive_income=monthly_passive,
        monthly_expenses_total=monthly_expenses_total,
        owned_asset_kinds=active_asset_kinds(db, profile.id),
        salary_ever_claimed=_salary_ever_claimed(db, profile),
        safety_ever_contributed=_safety_ever_contributed(db, profile.id),
        has_active_deposit=_has_active_investment(db, profile.id, "deposit"),
        has_active_bond=_has_active_investment(db, profile.id, "bond"),
    )
