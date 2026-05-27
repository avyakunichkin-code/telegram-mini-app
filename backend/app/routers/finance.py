import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import (
    FinanceSalary,
    FinanceLiability,
    FinanceAsset,
    Transaction,
    PeriodEconomyClosing,
    AssetTemplate,
    LiabilityTemplate,
    GameStarterTemplate,
)
from ..balance_utils import adjust_balance, adjust_safety_fund_balance
from ..finance_analytics import avg_net_cashflow_last_closed_intervals as _avg_net_cashflow_last_closed_intervals
from ..finance_helpers import monthly_interest_payment
from ..game_time import get_active_game_profile, sync_time, get_seconds_until_next
from ..expenses import compute_monthly_burn
from ..finance_overview_build import build_finance_overview
from ..starter_mechanics import (
    MECHANIC_CAPITAL_LIABILITIES,
    MECHANIC_CAPITAL_PROPERTY,
    require_capital_mechanic,
)
from ..schemas import (
    SalaryProfileUpdate,
    SalaryProfileResponse,
    LiabilityCreate,
    LiabilityResponse,
    AssetCreate,
    AssetResponse,
    FinanceOverview,
    MonthlyBurnBreakdown,
    VictoryOverview,
    VictoryGoalOverview,
    AchievementUnlockEvent,
    AnalyticsTimeseriesPoint,
    FinanceAnalyticsTimeseriesResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/finance", tags=["finance"])

EPSILON = 1e-6


def _cash_required_to_close(liability: FinanceLiability) -> float:
    return float(liability.overdue_amount or 0) + float(liability.total_debt or 0)


def _get_or_create_salary_profile(db: Session, game_profile_id: int) -> FinanceSalary:
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == game_profile_id).first()
    if salary:
        return salary

    salary = FinanceSalary(game_profile_id=game_profile_id, monthly_amount=0, monthly_receipts_count=1)
    db.add(salary)
    db.commit()
    db.refresh(salary)
    return salary


@router.put("/salary", response_model=SalaryProfileResponse)
async def upsert_salary_profile(
    payload: SalaryProfileUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.monthly_amount < 0:
        raise HTTPException(status_code=400, detail="monthly_amount must be >= 0")
    if payload.monthly_receipts_count <= 0:
        raise HTTPException(status_code=400, detail="monthly_receipts_count must be > 0")

    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    if game_profile.base_params_locked == 1:
        raise HTTPException(status_code=400, detail="Base parameters are locked after game start")
    profile = _get_or_create_salary_profile(db, game_profile.id)
    profile.monthly_amount = payload.monthly_amount
    profile.monthly_receipts_count = payload.monthly_receipts_count
    db.commit()
    db.refresh(profile)

    return SalaryProfileResponse(
        monthly_amount=profile.monthly_amount,
        monthly_receipts_count=profile.monthly_receipts_count,
    )


@router.post("/liabilities", response_model=LiabilityResponse)
async def create_liability(
    payload: LiabilityCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.total_debt < 0 or payload.annual_rate_percent < 0:
        raise HTTPException(status_code=400, detail="Numeric values must be >= 0")

    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    require_capital_mechanic(db, game_profile, MECHANIC_CAPITAL_LIABILITIES)
    mp = monthly_interest_payment(payload.total_debt, payload.annual_rate_percent)
    liability = FinanceLiability(
        title=(payload.title or "Обязательство").strip() or "Обязательство",
        total_debt=payload.total_debt,
        annual_rate_percent=payload.annual_rate_percent,
        monthly_payment=mp,
        game_profile_id=game_profile.id,
    )
    db.add(liability)
    db.commit()
    db.refresh(liability)
    return liability


@router.get("/liabilities", response_model=list[LiabilityResponse])
async def list_liabilities(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    return (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == game_profile.id)
        .order_by(FinanceLiability.created_at.desc())
        .all()
    )


@router.get("/transactions")
async def get_transactions(
        limit: int = 50,
        offset: int = 0,
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db)
):
    profile = get_active_game_profile(db, current_user.id)
    transactions = db.query(Transaction).filter(
        Transaction.game_profile_id == profile.id
    ).order_by(Transaction.timestamp.desc()).offset(offset).limit(limit).all()

    return [
        {
            "id": t.id,
            "amount": t.amount,
            "type": t.type,
            "description": t.description,
            "period_index": t.period_index,
            "timestamp": t.timestamp.isoformat()
        }
        for t in transactions
    ]


@router.delete("/liabilities/{liability_id}")
async def delete_liability(
    liability_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    liability = (
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.id == liability_id,
            FinanceLiability.game_profile_id == game_profile.id,
        )
        .first()
    )
    if not liability:
        raise HTTPException(status_code=404, detail="Liability not found")

    due = round(_cash_required_to_close(liability), 2)
    if due > EPSILON:
        if float(game_profile.cash_balance) + EPSILON < due:
            raise HTTPException(
                status_code=400,
                detail="Недостаточно средств на счёте, чтобы вернуть тело долга и погасить просрочку",
            )
        adjust_balance(
            db=db,
            game_profile_id=game_profile.id,
            amount=-due,
            type="liability_close",
            description=f"Закрытие обязательства: {liability.title}",
            period_index=int(game_profile.period_index),
        )
    db.delete(liability)
    db.commit()
    return {"status": "success", "deleted_id": liability_id}


@router.post("/liabilities/from-template", response_model=LiabilityResponse)
async def create_liability_from_template(
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    key = (payload.get("key") or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="key is required")

    tpl = (
        db.query(LiabilityTemplate)
        .filter(LiabilityTemplate.template_key == key, LiabilityTemplate.is_active == 1)
        .first()
    )
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found or inactive")

    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    require_capital_mechanic(db, game_profile, MECHANIC_CAPITAL_LIABILITIES)
    principal = float(tpl.total_debt)
    rate = float(tpl.annual_rate_percent)
    mp = monthly_interest_payment(principal, rate)

    adjust_balance(
        db=db,
        game_profile_id=game_profile.id,
        amount=principal,
        type="liability_disbursement",
        description=f"Получение кредита: {tpl.title}",
        period_index=int(game_profile.period_index),
    )

    liability = FinanceLiability(
        game_profile_id=game_profile.id,
        title=tpl.title,
        total_debt=principal,
        annual_rate_percent=rate,
        monthly_payment=mp,
        overdue_amount=0,
        overdue_periods=0,
        is_active=1,
    )
    db.add(liability)
    db.commit()
    db.refresh(liability)
    return liability


@router.post("/assets", response_model=AssetResponse)
async def create_asset(
    payload: AssetCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.asset_value < 0 or payload.monthly_maintenance_cost < 0 or payload.monthly_income < 0:
        raise HTTPException(status_code=400, detail="Numeric values must be >= 0")

    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    require_capital_mechanic(db, game_profile, MECHANIC_CAPITAL_PROPERTY)
    if int(game_profile.base_params_locked) == 1 and payload.asset_value > EPSILON:
        if float(game_profile.cash_balance) + EPSILON < float(payload.asset_value):
            raise HTTPException(status_code=400, detail="Недостаточно средств на счёте для покупки актива")
        adjust_balance(
            db=db,
            game_profile_id=game_profile.id,
            amount=-float(payload.asset_value),
            type="asset_purchase",
            description=f"Покупка актива: {(payload.title or 'Актив').strip()}",
            period_index=int(game_profile.period_index),
        )

    asset = FinanceAsset(
        title=(payload.title or "Актив").strip() or "Актив",
        kind=(payload.kind or "generic").strip() or "generic",
        asset_value=payload.asset_value,
        monthly_maintenance_cost=payload.monthly_maintenance_cost,
        monthly_income=payload.monthly_income,
        game_profile_id=game_profile.id,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/assets", response_model=list[AssetResponse])
async def list_assets(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    return (
        db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == game_profile.id)
        .order_by(FinanceAsset.created_at.desc())
        .all()
    )


def _templates_db_session(db: Session):
    rows = (
        db.query(AssetTemplate)
        .filter(AssetTemplate.is_active == 1)
        .order_by(AssetTemplate.sort_order.asc(), AssetTemplate.id.asc())
        .all()
    )
    return [
        {
            "key": t.template_key,
            "title": t.title,
            "kind": t.kind,
            "asset_value": float(t.asset_value),
            "monthly_maintenance_cost": float(t.monthly_maintenance_cost),
            "monthly_income": float(t.monthly_income or 0),
        }
        for t in rows
    ]


@router.get("/asset-templates")
async def list_asset_templates(db: Session = Depends(get_db)):
    return _templates_db_session(db)


@router.get("/liability-templates")
async def list_liability_templates(db: Session = Depends(get_db)):
    rows = (
        db.query(LiabilityTemplate)
        .filter(LiabilityTemplate.is_active == 1)
        .order_by(LiabilityTemplate.sort_order.asc(), LiabilityTemplate.id.asc())
        .all()
    )
    out = []
    for t in rows:
        td = float(t.total_debt)
        ar = float(t.annual_rate_percent)
        mp = monthly_interest_payment(td, ar)
        out.append({
            "key": t.template_key,
            "title": t.title,
            "total_debt": td,
            "annual_rate_percent": ar,
            "monthly_payment": mp,
        })
    return out


@router.post("/assets/from-template", response_model=AssetResponse)
async def create_asset_from_template(
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    key = (payload.get("key") or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="key is required")

    tpl_row = db.query(AssetTemplate).filter(AssetTemplate.template_key == key, AssetTemplate.is_active == 1).first()
    if not tpl_row:
        raise HTTPException(status_code=404, detail="Template not found")
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    require_capital_mechanic(db, game_profile, MECHANIC_CAPITAL_PROPERTY)

    cost = float(tpl_row.asset_value)
    if cost > EPSILON:
        if float(game_profile.cash_balance) + EPSILON < cost:
            raise HTTPException(status_code=400, detail="Недостаточно средств на счёте для покупки актива")
        adjust_balance(
            db=db,
            game_profile_id=game_profile.id,
            amount=-cost,
            type="asset_purchase",
            description=f"Покупка актива из каталога: {tpl_row.title}",
            period_index=int(game_profile.period_index),
        )

    has_tenants = int(getattr(tpl_row, "has_tenants_default", 0) or 0)
    asset = FinanceAsset(
        title=tpl_row.title,
        kind=tpl_row.kind,
        asset_value=cost,
        monthly_maintenance_cost=float(tpl_row.monthly_maintenance_cost),
        monthly_income=float(tpl_row.monthly_income or 0),
        has_tenants=has_tenants,
        game_profile_id=game_profile.id,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return AssetResponse(
        id=asset.id,
        title=asset.title,
        kind=asset.kind,
        asset_value=asset.asset_value,
        monthly_maintenance_cost=asset.monthly_maintenance_cost,
        monthly_income=asset.monthly_income,
        created_at=asset.created_at,
    )


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    asset = (
        db.query(FinanceAsset)
        .filter(
            FinanceAsset.id == asset_id,
            FinanceAsset.game_profile_id == game_profile.id,
        )
        .first()
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    sale = float(asset.asset_value or 0)
    if sale > EPSILON:
        adjust_balance(
            db=db,
            game_profile_id=game_profile.id,
            amount=sale,
            type="asset_sale",
            description=f"Продажа актива: {asset.title}",
            period_index=int(game_profile.period_index),
        )
    db.delete(asset)
    db.commit()
    return {"status": "success", "deleted_id": asset_id}


@router.get("/overview", response_model=FinanceOverview)
async def finance_overview(
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    return build_finance_overview(db, profile)


@router.get("/analytics/timeseries", response_model=FinanceAnalyticsTimeseriesResponse)
async def finance_analytics_timeseries(
    limit: int = 48,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)

    limit = max(4, min(120, limit))

    closings_rows = (
        db.query(PeriodEconomyClosing)
        .filter(PeriodEconomyClosing.game_profile_id == profile.id)
        .order_by(PeriodEconomyClosing.period_index.desc())
        .limit(limit)
        .all()
    )
    closings_rows = list(reversed(closings_rows))

    liabilities_orm = db.query(FinanceLiability).filter(
        FinanceLiability.game_profile_id == profile.id,
        FinanceLiability.is_active == 1,
    ).all()
    total_overdue_now = round(sum(float(l.overdue_amount or 0) for l in liabilities_orm), 2)
    burn_now = round(float(compute_monthly_burn(db, profile).total), 2)

    points: List[AnalyticsTimeseriesPoint] = [
        AnalyticsTimeseriesPoint(
            period_index=int(r.period_index),
            cash_balance=round(float(r.cash_balance), 2),
            safety_fund_balance=round(float(r.safety_fund_balance), 2),
            total_overdue_amount=round(float(r.total_overdue_amount), 2),
            monthly_burn_total=round(float(getattr(r, "monthly_burn_total", 0) or 0), 2),
            is_projection=False,
        )
        for r in closings_rows
    ]

    points.append(
        AnalyticsTimeseriesPoint(
            period_index=int(profile.period_index),
            cash_balance=round(float(profile.cash_balance), 2),
            safety_fund_balance=round(float(profile.safety_fund_balance), 2),
            total_overdue_amount=total_overdue_now,
            monthly_burn_total=burn_now,
            is_projection=True,
        )
    )

    return FinanceAnalyticsTimeseriesResponse(
        current_period_index=int(profile.period_index),
        clean_period_streak=int(getattr(profile, "clean_period_streak", 0) or 0),
        points=points,
    )
