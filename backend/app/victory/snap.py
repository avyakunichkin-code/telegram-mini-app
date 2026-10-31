"""Снимок метрик для victory engine (пассивный доход, активы)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from typing import TYPE_CHECKING

from fincore.metrics import HouseholdMetrics

from ..game.adapters.fincore_snapshot import household_metrics
from ..finance.period_metrics import avg_net_cashflow_last_closed_intervals
from ..finance.balance_utils import TRANSACTION_TYPES
from ..models import (
    FinanceAsset,
    FinanceSalary,
    GameProfile,
    InsurancePolicy,
    InvestmentPosition,
    PeriodSnapshot,
    Transaction,
)

if TYPE_CHECKING:
    from .engine import VictoryEvaluationInput

# Согласовано с каталогом активов и blueprint шаблонов (vehicle = legacy в сидах).
CAR_ASSET_KINDS = frozenset({"car_personal", "car_taxi", "vehicle", "rental_car", "car"})
RENTAL_HOME_ASSET_KINDS = frozenset(
    {"rental_home", "rental_house", "rental_mansion"}
)


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


def _has_active_insurance(db: Session, profile_id: int) -> bool:
    row = (
        db.query(InsurancePolicy.id)
        .filter(
            InsurancePolicy.game_profile_id == profile_id,
            InsurancePolicy.is_active == 1,
        )
        .first()
    )
    return row is not None


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


def build_victory_evaluation_input(
    db: Session, profile: GameProfile, metrics: HouseholdMetrics | None = None
) -> VictoryEvaluationInput:
    """
    Вход целей победы. Денежные метрики — `fincore.metrics` (SPL-207b); `metrics` можно передать
    готовыми, чтобы overview считал снимок один раз (ADR-009 §4).
    """
    from .engine import VictoryEvaluationInput
    m = metrics if metrics is not None else household_metrics(db, profile)
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_salary = float(salary.monthly_amount if salary else 0)

    avg_cf_6, avg_cf_n = avg_net_cashflow_last_closed_intervals(db, profile.id, max_intervals=6)
    period_index = int(profile.period_index or 1)

    return VictoryEvaluationInput(
        period_index=period_index,
        safety_fund_balance=float(profile.safety_fund_balance),
        cash_balance=float(profile.cash_balance),
        total_monthly_obligations=float(m.structural_obligations),
        total_overdue_amount=float(m.total_overdue),
        # Без проекции вкладов: цели победы считают поток от зарплаты и аренды (критерий 2 SPL-207b).
        net_monthly_cashflow=float(m.net_structural_cashflow),
        monthly_salary=monthly_salary,
        monthly_burn_total=float(m.lifestyle_burn),
        avg_net_cashflow_6p=float(avg_cf_6),
        avg_net_cashflow_6p_n=int(avg_cf_n),
        # Проекция вкладов — по всем видам позиций (сейчас их два: deposit и bond).
        monthly_passive_income=round(m.passive_income, 2),
        monthly_expenses_total=float(m.total_monthly_outflow),
        owned_asset_kinds=active_asset_kinds(db, profile.id),
        salary_ever_claimed=_salary_ever_claimed(db, profile),
        safety_ever_contributed=_safety_ever_contributed(db, profile.id),
        has_active_deposit=_has_active_investment(db, profile.id, "deposit"),
        has_active_bond=_has_active_investment(db, profile.id, "bond"),
        has_active_insurance=_has_active_insurance(db, profile.id),
    )
