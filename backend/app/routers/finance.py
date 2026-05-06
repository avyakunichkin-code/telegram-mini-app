from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import FinanceSalary, FinanceLiability, FinanceAsset, Transaction
from ..balance_utils import adjust_balance, get_cash_balance, adjust_safety_fund_balance
from ..game_time import get_active_game_profile, sync_time, get_seconds_until_next
from ..schemas import (
    SalaryProfileUpdate,
    SalaryProfileResponse,
    LiabilityCreate,
    LiabilityResponse,
    AssetCreate,
    AssetResponse,
    FinanceOverview,
)

router = APIRouter(prefix="/api/finance", tags=["finance"])


def _compute_gamification(net_cashflow: float, liabilities_ratio: float, assets_count: int):
    score = 0
    if net_cashflow > 0:
        score += min(50, int(net_cashflow // 1000) * 5)
    if liabilities_ratio <= 20:
        score += 30
    elif liabilities_ratio <= 35:
        score += 20
    elif liabilities_ratio <= 50:
        score += 10
    score += min(20, assets_count * 5)
    score = max(0, min(100, score))

    if score >= 80:
        level = "Финансовый стратег"
    elif score >= 55:
        level = "Уверенный планировщик"
    elif score >= 30:
        level = "Начинающий инвестор"
    else:
        level = "Финансовый новичок"

    xp_to_next = 0 if score >= 100 else 100 - score
    return score, level, xp_to_next


def _get_or_create_salary_profile(db: Session, game_profile_id: int) -> FinanceSalary:
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == game_profile_id).first()
    if salary:
        return salary

    salary = FinanceSalary(game_profile_id=game_profile_id, monthly_amount=0, monthly_receipts_count=1)
    db.add(salary)
    db.commit()
    db.refresh(salary)
    return salary


def _compute_gamification(net_cashflow: float, liabilities_ratio: float, assets_count: int) -> tuple[int, str, int]:
    score = 0
    if net_cashflow > 0:
        score += min(50, int(net_cashflow // 1000) * 5)
    if liabilities_ratio <= 20:
        score += 30
    elif liabilities_ratio <= 35:
        score += 20
    elif liabilities_ratio <= 50:
        score += 10
    score += min(20, assets_count * 5)
    score = max(0, min(100, score))

    if score >= 80:
        level = "Финансовый стратег"
    elif score >= 55:
        level = "Уверенный планировщик"
    elif score >= 30:
        level = "Начинающий инвестор"
    else:
        level = "Финансовый новичок"

    xp_to_next = 0 if score >= 100 else 100 - score
    return score, level, xp_to_next


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
    if payload.total_debt < 0 or payload.annual_rate_percent < 0 or payload.monthly_payment < 0:
        raise HTTPException(status_code=400, detail="Numeric values must be >= 0")

    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    liability = FinanceLiability(
        title=(payload.title or "Обязательство").strip() or "Обязательство",
        total_debt=payload.total_debt,
        annual_rate_percent=payload.annual_rate_percent,
        monthly_payment=payload.monthly_payment,
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
    db.delete(liability)
    db.commit()
    return {"status": "success", "deleted_id": liability_id}


@router.post("/assets", response_model=AssetResponse)
async def create_asset(
    payload: AssetCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.asset_value < 0 or payload.monthly_maintenance_cost < 0:
        raise HTTPException(status_code=400, detail="Numeric values must be >= 0")

    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    asset = FinanceAsset(
        title=(payload.title or "Актив").strip() or "Актив",
        asset_value=payload.asset_value,
        monthly_maintenance_cost=payload.monthly_maintenance_cost,
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


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
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

    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_income = salary.monthly_amount if salary else 0

    # Преобразуем обязательства в Pydantic-схемы
    liabilities_orm = db.query(FinanceLiability).filter(
        FinanceLiability.game_profile_id == profile.id,
        FinanceLiability.is_active == 1
    ).all()
    liabilities = [
        LiabilityResponse(
            id=l.id,
            title=l.title,
            total_debt=l.total_debt,
            annual_rate_percent=l.annual_rate_percent,
            monthly_payment=l.monthly_payment,
            overdue_amount=float(getattr(l, "overdue_amount", 0) or 0),
            overdue_periods=int(getattr(l, "overdue_periods", 0) or 0),
            created_at=l.created_at
        ) for l in liabilities_orm
    ]

    # Преобразуем активы в Pydantic-схемы
    assets_orm = db.query(FinanceAsset).filter(
        FinanceAsset.game_profile_id == profile.id,
        FinanceAsset.is_active == 1
    ).all()
    assets = [
        AssetResponse(
            id=a.id,
            title=a.title,
            asset_value=a.asset_value,
            monthly_maintenance_cost=a.monthly_maintenance_cost,
            created_at=a.created_at
        ) for a in assets_orm
    ]

    total_liability_payment = sum(l.monthly_payment for l in liabilities)
    total_asset_maintenance = sum(a.monthly_maintenance_cost for a in assets)
    total_monthly_obligations = total_liability_payment + total_asset_maintenance
    net_cashflow = monthly_income - total_monthly_obligations
    liabilities_ratio = (total_liability_payment / monthly_income * 100) if monthly_income > 0 else 0
    total_overdue_amount = sum(float(l.overdue_amount or 0) for l in liabilities_orm)
    overdue_liabilities_count = sum(1 for l in liabilities_orm if float(getattr(l, "overdue_amount", 0) or 0) > 0)

    score, level, xp_to_next = _compute_gamification(net_cashflow, liabilities_ratio, len(assets))

    # MVP-условие победы: подушка >= 3 * обязательные расходы, нет просрочек, net_cashflow >= 0
    win_target_safety_fund = float(total_monthly_obligations) * 3.0
    win_progress_safety_fund = 1.0 if win_target_safety_fund <= 0 else float(profile.safety_fund_balance) / win_target_safety_fund
    win_ready = (total_overdue_amount <= 0) and (net_cashflow >= 0)
    win_reached = win_ready and (float(profile.safety_fund_balance) >= win_target_safety_fund) and (win_target_safety_fund > 0)

    return FinanceOverview(
        salary=SalaryProfileResponse(
            monthly_amount=salary.monthly_amount if salary else 0,
            monthly_receipts_count=salary.monthly_receipts_count if salary else 1
        ),
        liabilities=liabilities,
        assets=assets,
        total_monthly_income=round(monthly_income, 2),
        total_monthly_liabilities_payment=round(total_liability_payment, 2),
        total_monthly_assets_maintenance=round(total_asset_maintenance, 2),
        net_monthly_cashflow=round(net_cashflow, 2),
        liabilities_to_income_ratio=round(liabilities_ratio, 2),
        gamification_level=level,
        score=score,
        xp_to_next_level=xp_to_next,
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
        cash_balance=round(profile.cash_balance, 2),
        safety_fund_balance=round(profile.safety_fund_balance, 2),
        total_monthly_obligations=round(total_monthly_obligations, 2),
        total_overdue_amount=round(total_overdue_amount, 2),
        overdue_liabilities_count=overdue_liabilities_count,
        win_target_safety_fund=round(win_target_safety_fund, 2),
        win_progress_safety_fund=round(win_progress_safety_fund, 4),
        win_ready=bool(win_ready),
        win_reached=bool(win_reached),
    )
