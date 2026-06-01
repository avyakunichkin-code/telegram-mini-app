from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...constants import EPSILON
from ...finance.balance_utils import adjust_balance
from ...models import AssetTemplate, FinanceAsset, GameProfile


def create_asset(db: Session, profile: GameProfile, payload) -> FinanceAsset:
    # payload is AssetCreate (pydantic)
    if payload.asset_value < 0 or payload.monthly_maintenance_cost < 0 or payload.monthly_income < 0:
        raise HTTPException(status_code=400, detail="Numeric values must be >= 0")

    if int(profile.base_params_locked) == 1 and float(payload.asset_value) > EPSILON:
        cost = float(payload.asset_value)
        if float(profile.cash_balance) + EPSILON < cost:
            raise HTTPException(status_code=400, detail="Недостаточно средств на счёте для покупки актива")
        adjust_balance(
            db=db,
            game_profile_id=profile.id,
            amount=-cost,
            type="asset_purchase",
            description=f"Покупка актива: {(payload.title or 'Актив').strip()}",
            period_index=int(profile.period_index),
        )

    asset = FinanceAsset(
        title=(payload.title or "Актив").strip() or "Актив",
        kind=(payload.kind or "generic").strip() or "generic",
        asset_value=payload.asset_value,
        monthly_maintenance_cost=payload.monthly_maintenance_cost,
        monthly_income=payload.monthly_income,
        game_profile_id=profile.id,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def list_assets(db: Session, profile: GameProfile) -> list[FinanceAsset]:
    return (
        db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == profile.id)
        .order_by(FinanceAsset.created_at.desc())
        .all()
    )


def create_asset_from_template(db: Session, profile: GameProfile, *, key: str) -> FinanceAsset:
    key = (key or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="key is required")

    tpl_row = (
        db.query(AssetTemplate)
        .filter(AssetTemplate.template_key == key, AssetTemplate.is_active == 1)
        .first()
    )
    if not tpl_row:
        raise HTTPException(status_code=404, detail="Template not found")

    cost = float(tpl_row.asset_value)
    if cost > EPSILON:
        if float(profile.cash_balance) + EPSILON < cost:
            raise HTTPException(status_code=400, detail="Недостаточно средств на счёте для покупки актива")
        adjust_balance(
            db=db,
            game_profile_id=profile.id,
            amount=-cost,
            type="asset_purchase",
            description=f"Покупка актива из каталога: {tpl_row.title}",
            period_index=int(profile.period_index),
        )

    has_tenants = int(getattr(tpl_row, "has_tenants_default", 0) or 0)
    asset = FinanceAsset(
        title=tpl_row.title,
        kind=tpl_row.kind,
        asset_value=cost,
        monthly_maintenance_cost=float(tpl_row.monthly_maintenance_cost),
        monthly_income=float(tpl_row.monthly_income or 0),
        has_tenants=has_tenants,
        acquisition_mode="cash",
        game_profile_id=profile.id,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def delete_asset(db: Session, profile: GameProfile, asset_id: int) -> dict:
    from .asset_sale import sell_asset

    return sell_asset(db, profile, asset_id)

