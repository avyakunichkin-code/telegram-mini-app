from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...constants import EPSILON
from ...finance.balance_utils import adjust_balance
from ...finance.helpers import monthly_interest_payment
from ...models import FinanceLiability, GameProfile, LiabilityTemplate


def _cash_required_to_close(liability: FinanceLiability) -> float:
    return float(liability.overdue_amount or 0) + float(liability.total_debt or 0)


def create_liability(db: Session, profile: GameProfile, payload) -> FinanceLiability:
    # payload is LiabilityCreate (pydantic)
    if payload.total_debt < 0 or payload.annual_rate_percent < 0:
        raise HTTPException(status_code=400, detail="Numeric values must be >= 0")

    mp = monthly_interest_payment(payload.total_debt, payload.annual_rate_percent)
    liability = FinanceLiability(
        title=(payload.title or "Обязательство").strip() or "Обязательство",
        total_debt=payload.total_debt,
        annual_rate_percent=payload.annual_rate_percent,
        monthly_payment=mp,
        game_profile_id=profile.id,
    )
    db.add(liability)
    db.commit()
    db.refresh(liability)
    return liability


def list_liabilities(db: Session, profile: GameProfile) -> list[FinanceLiability]:
    return (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id)
        .order_by(FinanceLiability.created_at.desc())
        .all()
    )


def delete_liability(db: Session, profile: GameProfile, liability_id: int) -> dict:
    liability = (
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.id == liability_id,
            FinanceLiability.game_profile_id == profile.id,
        )
        .first()
    )
    if not liability:
        raise HTTPException(status_code=404, detail="Liability not found")

    due = round(_cash_required_to_close(liability), 2)
    if due > EPSILON:
        if float(profile.cash_balance) + EPSILON < due:
            raise HTTPException(
                status_code=400,
                detail="Недостаточно средств на счёте, чтобы вернуть тело долга и погасить просрочку",
            )
        adjust_balance(
            db=db,
            game_profile_id=profile.id,
            amount=-due,
            type="liability_close",
            description=f"Закрытие обязательства: {liability.title}",
            period_index=int(profile.period_index),
        )

    db.delete(liability)
    db.commit()
    return {"status": "success", "deleted_id": liability_id}


def create_liability_from_template(db: Session, profile: GameProfile, *, key: str) -> FinanceLiability:
    key = (key or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="key is required")

    tpl = (
        db.query(LiabilityTemplate)
        .filter(LiabilityTemplate.template_key == key, LiabilityTemplate.is_active == 1)
        .first()
    )
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found or inactive")

    principal = float(tpl.total_debt)
    rate = float(tpl.annual_rate_percent)
    mp = monthly_interest_payment(principal, rate)

    adjust_balance(
        db=db,
        game_profile_id=profile.id,
        amount=principal,
        type="liability_disbursement",
        description=f"Получение кредита: {tpl.title}",
        period_index=int(profile.period_index),
    )

    liability = FinanceLiability(
        game_profile_id=profile.id,
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

