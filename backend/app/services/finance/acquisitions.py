"""DL1 path A: secured asset + loan bundle."""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...constants import EPSILON
from ...finance.annuity import monthly_payment
from ...finance.balance_utils import adjust_balance
from ...finance.liability_kinds import (
    ASSET_KIND_FOR_AUTO,
    DISBURSE_TO_ASSET,
    LIABILITY_KIND_AUTO_LOAN,
    LIABILITY_KIND_MORTGAGE,
    PAYMENT_MODE_ANNUITY,
    SECURED_KINDS,
)
from ...models import AssetTemplate, FinanceAsset, FinanceLiability, GameProfile, LiabilityTemplate


def _asset_kind_matches(requires: str | None, asset_kind: str) -> bool:
    if not requires:
        return True
    req = requires.strip().lower()
    kind = (asset_kind or "").strip().lower()
    if req == "car":
        return kind in ASSET_KIND_FOR_AUTO or kind.startswith("car")
    return kind == req or kind.startswith(req)


def _active_secured_on_asset(db: Session, asset_id: int) -> FinanceLiability | None:
    return (
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.secured_asset_id == asset_id,
            FinanceLiability.is_active == 1,
        )
        .first()
    )


def create_secured_acquisition(
    db: Session,
    profile: GameProfile,
    *,
    liability_key: str,
    asset_key: str,
    down_payment: float | None = None,
) -> dict:
    liability_key = (liability_key or "").strip()
    asset_key = (asset_key or "").strip()
    if not liability_key or not asset_key:
        raise HTTPException(status_code=400, detail="liability_key and asset_key are required")

    liab_tpl = (
        db.query(LiabilityTemplate)
        .filter(LiabilityTemplate.template_key == liability_key, LiabilityTemplate.is_active == 1)
        .first()
    )
    if not liab_tpl:
        raise HTTPException(status_code=404, detail="Liability template not found")

    kind = (getattr(liab_tpl, "liability_kind", None) or "").strip()
    if kind not in SECURED_KINDS:
        raise HTTPException(status_code=400, detail="Template is not a secured loan product")

    disburse = (getattr(liab_tpl, "disbursement_mode", None) or "").strip()
    if disburse and disburse != DISBURSE_TO_ASSET:
        raise HTTPException(status_code=400, detail="Secured product must use to_asset_purchase disbursement")

    asset_tpl = (
        db.query(AssetTemplate)
        .filter(AssetTemplate.template_key == asset_key, AssetTemplate.is_active == 1)
        .first()
    )
    if not asset_tpl:
        raise HTTPException(status_code=404, detail="Asset template not found")

    if not _asset_kind_matches(getattr(liab_tpl, "requires_asset_kind", None), asset_tpl.kind):
        raise HTTPException(status_code=400, detail="Asset kind does not match loan product")

    purchase_price = float(asset_tpl.asset_value)
    if purchase_price <= EPSILON:
        raise HTTPException(status_code=400, detail="Invalid asset template price")

    down = float(down_payment) if down_payment is not None else float(getattr(liab_tpl, "down_payment_amount", 0) or 0)
    if down < 0:
        raise HTTPException(status_code=400, detail="down_payment must be >= 0")
    if down >= purchase_price - EPSILON:
        raise HTTPException(status_code=400, detail="down_payment must be less than purchase price")

    if float(profile.cash_balance) + EPSILON < down:
        raise HTTPException(status_code=400, detail="Недостаточно средств на счёте для первоначального взноса")

    principal = round(purchase_price - down, 2)
    term = int(getattr(liab_tpl, "term_periods", None) or 0)
    if term <= 0:
        raise HTTPException(status_code=400, detail="Secured template must define term_periods")

    rate = float(liab_tpl.annual_rate_percent)
    pay = monthly_payment(principal, rate, term)

    if down > EPSILON:
        adjust_balance(
            db=db,
            game_profile_id=profile.id,
            amount=-down,
            type="asset_down_payment",
            description=f"Первоначальный взнос: {asset_tpl.title}",
            period_index=int(profile.period_index),
        )

    asset = FinanceAsset(
        game_profile_id=profile.id,
        title=asset_tpl.title,
        kind=asset_tpl.kind,
        asset_value=purchase_price,
        monthly_maintenance_cost=float(asset_tpl.monthly_maintenance_cost),
        monthly_income=float(asset_tpl.monthly_income or 0),
        has_tenants=int(getattr(asset_tpl, "has_tenants_default", 0) or 0),
        acquisition_mode="secured",
        is_active=1,
    )
    db.add(asset)
    db.flush()

    if _active_secured_on_asset(db, asset.id):
        raise HTTPException(status_code=400, detail="Asset already has secured debt")

    liability = FinanceLiability(
        game_profile_id=profile.id,
        title=liab_tpl.title,
        total_debt=principal,
        original_principal=principal,
        annual_rate_percent=rate,
        monthly_payment=pay,
        liability_kind=kind or LIABILITY_KIND_MORTGAGE,
        secured_asset_id=asset.id,
        term_periods=term,
        periods_paid=0,
        payment_mode=PAYMENT_MODE_ANNUITY,
        overdue_amount=0,
        overdue_periods=0,
        is_active=1,
    )
    db.add(liability)
    db.commit()
    db.refresh(asset)
    db.refresh(liability)
    return {"asset": asset, "liability": liability}
