from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..expenses import burn_breakdown_for_api, compute_monthly_burn
from ..game_time import get_active_game_profile, sync_time
from ..models import FinanceAsset, FinanceLiability, FinanceSalary
from ..schemas import ExpensesSnapshotResponse, MonthlyBurnBreakdown

router = APIRouter(prefix="/api/game/expenses", tags=["expenses"])


@router.get("", response_model=ExpensesSnapshotResponse)
async def get_expenses_snapshot(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Снимок burn rate и разбивка по категориям для активной партии."""
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)

    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_income = float(salary.monthly_amount if salary else 0)

    assets_orm = (
        db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == profile.id, FinanceAsset.is_active == 1)
        .all()
    )
    liabilities_orm = (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id, FinanceLiability.is_active == 1)
        .all()
    )
    assets_income = sum(float(a.monthly_income or 0) for a in assets_orm)
    total_liability_payment = sum(float(l.monthly_payment or 0) for l in liabilities_orm)
    total_asset_maintenance = sum(float(a.monthly_maintenance_cost or 0) for a in assets_orm)
    total_monthly_obligations = total_liability_payment + total_asset_maintenance
    total_income = monthly_income + assets_income

    burn_snapshot = compute_monthly_burn(db, profile)
    monthly_burn_total = float(burn_snapshot.total)
    total_monthly_outflow = total_monthly_obligations + monthly_burn_total
    expense_to_income_ratio = (
        round(monthly_burn_total / total_income, 4) if total_income > 0 else 0.0
    )

    return ExpensesSnapshotResponse(
        period_index=int(profile.period_index),
        total=round(monthly_burn_total, 2),
        monthly_lifestyle_expense=round(monthly_burn_total, 2),
        breakdown=MonthlyBurnBreakdown(**burn_breakdown_for_api(burn_snapshot)),
        total_monthly_outflow=round(total_monthly_outflow, 2),
        expense_to_income_ratio=expense_to_income_ratio,
    )
