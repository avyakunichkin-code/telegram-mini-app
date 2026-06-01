"""DL1: sell asset with secured debt payoff."""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...constants import EPSILON
from ...finance.annuity import sale_cashflow
from ...finance.balance_utils import adjust_balance
from ...models import FinanceAsset, FinanceLiability, GameProfile, InsurancePolicy


def _active_secured_liability(db: Session, asset_id: int) -> FinanceLiability | None:
    return (
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.secured_asset_id == asset_id,
            FinanceLiability.is_active == 1,
        )
        .first()
    )


def _deactivate_policies_for_asset(db: Session, profile_id: int, asset_id: int) -> None:
    rows = (
        db.query(InsurancePolicy)
        .filter(
            InsurancePolicy.game_profile_id == profile_id,
            InsurancePolicy.insured_asset_id == asset_id,
            InsurancePolicy.is_active == 1,
        )
        .all()
    )
    for pol in rows:
        pol.is_active = 0


def sell_asset(db: Session, profile: GameProfile, asset_id: int) -> dict:
    asset = (
        db.query(FinanceAsset)
        .filter(
            FinanceAsset.id == asset_id,
            FinanceAsset.game_profile_id == profile.id,
            FinanceAsset.is_active == 1,
        )
        .first()
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    sale_price = float(asset.asset_value or 0)
    secured = _active_secured_liability(db, asset.id)
    payoff = cash_net = top_up = 0.0

    if secured:
        payoff, cash_net, top_up = sale_cashflow(
            sale_price,
            float(secured.overdue_amount or 0),
            float(secured.total_debt or 0),
        )
        if top_up > EPSILON and float(profile.cash_balance) + EPSILON < top_up:
            raise HTTPException(
                status_code=400,
                detail="Недостаточно средств: выручка не покрывает остаток кредита",
            )
        if top_up > EPSILON:
            adjust_balance(
                db=db,
                game_profile_id=profile.id,
                amount=-top_up,
                type="liability_payoff_from_sale",
                description=f"Доплата при продаже: {secured.title}",
                period_index=int(profile.period_index),
            )
        if cash_net > EPSILON:
            adjust_balance(
                db=db,
                game_profile_id=profile.id,
                amount=cash_net,
                type="asset_sale",
                description=f"Продажа актива: {asset.title}",
                period_index=int(profile.period_index),
            )
        secured.total_debt = 0
        secured.overdue_amount = 0
        secured.is_active = 0
    elif sale_price > EPSILON:
        adjust_balance(
            db=db,
            game_profile_id=profile.id,
            amount=sale_price,
            type="asset_sale",
            description=f"Продажа актива: {asset.title}",
            period_index=int(profile.period_index),
        )

    _deactivate_policies_for_asset(db, profile.id, asset.id)
    asset.is_active = 0
    db.commit()
    return {
        "status": "success",
        "deleted_id": asset_id,
        "payoff": payoff if secured else 0.0,
        "cash_net": cash_net if secured else sale_price,
        "top_up": top_up if secured else 0.0,
    }
