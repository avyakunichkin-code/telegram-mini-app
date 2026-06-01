import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...finance.balance_utils import TRANSACTION_TYPES, adjust_safety_fund_balance
from ...models import GameProfile
from .snapshot import get_current_period_snapshot

logger = logging.getLogger(__name__)


def contribute_to_safety_fund(db: Session, profile: GameProfile, amount: float) -> dict:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")
    if float(profile.cash_balance or 0) < amount:
        raise HTTPException(
            status_code=400,
            detail=f"Недостаточно средств. Доступно: {profile.cash_balance:,.2f} ₽",
        )

    period_index = profile.period_index
    snapshot = get_current_period_snapshot(db, profile)
    safety_before = float(profile.safety_fund_balance or 0)
    first_contribution = safety_before <= 1e-8

    try:
        new_safety_fund = adjust_safety_fund_balance(
            db=db,
            game_profile_id=profile.id,
            amount=amount,
            type=TRANSACTION_TYPES["SAFETY_FUND_CONTRIBUTION"],
            description=f"Взнос в подушку безопасности #{period_index}",
            period_index=period_index,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    db.refresh(profile)
    snapshot.safety_fund_total = profile.safety_fund_balance
    snapshot.safety_fund_contribution = float(snapshot.safety_fund_contribution or 0) + amount

    if first_contribution:
        try:
            from ...admin.notify import notify_first_safety_fund

            notify_first_safety_fund(
                db,
                profile,
                period_index=period_index,
                amount=amount,
                new_safety_fund_balance=float(profile.safety_fund_balance or 0),
            )
        except Exception:
            logger.exception(
                "Admin notify failed after first safety fund profile_id=%s",
                profile.id,
            )

    db.commit()

    return {
        "status": "success",
        "contributed": amount,
        "new_cash_balance": profile.cash_balance,
        "new_safety_fund_balance": new_safety_fund,
        "message": f"Отложено {amount:,.2f} ₽ в подушку безопасности",
    }


def withdraw_from_safety_fund(db: Session, profile: GameProfile, amount: float) -> dict:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")
    if float(profile.safety_fund_balance or 0) < amount:
        raise HTTPException(
            status_code=400,
            detail=f"Недостаточно средств на подушке безопасности. Доступно: {profile.safety_fund_balance:,.2f} ₽",
        )

    period_index = profile.period_index
    snapshot = get_current_period_snapshot(db, profile)

    try:
        new_safety_fund = adjust_safety_fund_balance(
            db=db,
            game_profile_id=profile.id,
            amount=-amount,
            type=TRANSACTION_TYPES["SAFETY_FUND_WITHDRAWAL"],
            description=f"Снятие с подушки безопасности #{period_index}",
            period_index=period_index,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    db.refresh(profile)
    snapshot.safety_fund_total = profile.safety_fund_balance
    db.commit()

    return {
        "status": "success",
        "withdrawn": amount,
        "new_cash_balance": profile.cash_balance,
        "new_safety_fund_balance": new_safety_fund,
        "message": f"Снято {amount:,.2f} ₽ с подушки безопасности",
    }

