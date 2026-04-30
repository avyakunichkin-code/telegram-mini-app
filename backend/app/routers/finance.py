from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import SalaryProfile, Liability, Asset
from app.schemas import (
    SalaryProfileUpdate,
    SalaryProfileResponse,
    LiabilityCreate,
    LiabilityResponse,
    AssetCreate,
    AssetResponse,
    FinanceOverview,
)

router = APIRouter(prefix="/api/finance", tags=["finance"])


def _get_or_create_salary_profile(db: Session, user_id: int) -> SalaryProfile:
    profile = db.query(SalaryProfile).filter(SalaryProfile.user_id == user_id).first()
    if profile:
        return profile

    profile = SalaryProfile(user_id=user_id, monthly_amount=0, monthly_receipts_count=1)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


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

    profile = _get_or_create_salary_profile(db, current_user.id)
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

    liability = Liability(
        title=(payload.title or "Обязательство").strip() or "Обязательство",
        total_debt=payload.total_debt,
        annual_rate_percent=payload.annual_rate_percent,
        monthly_payment=payload.monthly_payment,
        user_id=current_user.id,
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
    return (
        db.query(Liability)
        .filter(Liability.user_id == current_user.id)
        .order_by(Liability.created_at.desc())
        .all()
    )


@router.delete("/liabilities/{liability_id}")
async def delete_liability(
    liability_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    liability = (
        db.query(Liability)
        .filter(Liability.id == liability_id, Liability.user_id == current_user.id)
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

    asset = Asset(
        title=(payload.title or "Актив").strip() or "Актив",
        asset_value=payload.asset_value,
        monthly_maintenance_cost=payload.monthly_maintenance_cost,
        user_id=current_user.id,
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
    return db.query(Asset).filter(Asset.user_id == current_user.id).order_by(Asset.created_at.desc()).all()


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.user_id == current_user.id).first()
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
    profile = _get_or_create_salary_profile(db, current_user.id)
    liabilities = db.query(Liability).filter(Liability.user_id == current_user.id).all()
    assets = db.query(Asset).filter(Asset.user_id == current_user.id).all()

    total_income = profile.monthly_amount
    total_liability_payments = sum(item.monthly_payment for item in liabilities)
    total_assets_maintenance = sum(item.monthly_maintenance_cost for item in assets)
    net_cashflow = total_income - total_liability_payments - total_assets_maintenance
    liabilities_ratio = (total_liability_payments / total_income * 100) if total_income > 0 else 0

    score, level, xp_to_next = _compute_gamification(net_cashflow, liabilities_ratio, len(assets))

    return FinanceOverview(
        salary=SalaryProfileResponse(
            monthly_amount=profile.monthly_amount,
            monthly_receipts_count=profile.monthly_receipts_count,
        ),
        liabilities=liabilities,
        assets=assets,
        total_monthly_income=round(total_income, 2),
        total_monthly_liabilities_payment=round(total_liability_payments, 2),
        total_monthly_assets_maintenance=round(total_assets_maintenance, 2),
        net_monthly_cashflow=round(net_cashflow, 2),
        liabilities_to_income_ratio=round(liabilities_ratio, 2),
        gamification_level=level,
        score=score,
        xp_to_next_level=xp_to_next,
    )
