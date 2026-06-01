from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...constants import EPSILON
from ...finance.annuity import monthly_payment, prepay_waterfall
from ...finance.balance_utils import adjust_balance
from ...finance.helpers import monthly_interest_payment
from ...finance.liability_kinds import (
    CONSUMER_KINDS,
    DISBURSE_TO_ASSET,
    DISBURSE_TO_CASH,
    MAX_ACTIVE_CONSUMER_LOANS,
    PAYMENT_MODE_ANNUITY,
    PAYMENT_MODE_INTEREST_ONLY,
    SECURED_KINDS,
    effective_liability_kind,
    effective_payment_mode,
    remaining_periods,
)
from ...finance.liability_present import liability_to_response
from ...models import FinanceLiability, GameProfile, LiabilityTemplate


def _cash_required_to_close(liability: FinanceLiability) -> float:
    return float(liability.overdue_amount or 0) + float(liability.total_debt or 0)


def _count_active_consumer_loans(db: Session, profile_id: int) -> int:
    rows = (
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.game_profile_id == profile_id,
            FinanceLiability.is_active == 1,
        )
        .all()
    )
    n = 0
    for row in rows:
        if effective_liability_kind(row) in CONSUMER_KINDS and not getattr(row, "secured_asset_id", None):
            n += 1
    return n


def create_liability(db: Session, profile: GameProfile, payload) -> FinanceLiability:
    if payload.total_debt < 0 or payload.annual_rate_percent < 0:
        raise HTTPException(status_code=400, detail="Numeric values must be >= 0")

    mp = monthly_interest_payment(payload.total_debt, payload.annual_rate_percent)
    liability = FinanceLiability(
        title=(payload.title or "Обязательство").strip() or "Обязательство",
        total_debt=payload.total_debt,
        annual_rate_percent=payload.annual_rate_percent,
        monthly_payment=mp,
        liability_kind="unsecured",
        payment_mode=PAYMENT_MODE_INTEREST_ONLY,
        game_profile_id=profile.id,
    )
    db.add(liability)
    db.commit()
    db.refresh(liability)
    return liability


def list_liabilities(db: Session, profile: GameProfile) -> list[FinanceLiability]:
    return (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id, FinanceLiability.is_active == 1)
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

    liability.is_active = 0
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

    kind = (getattr(tpl, "liability_kind", None) or "consumer").strip()
    disburse = (getattr(tpl, "disbursement_mode", None) or DISBURSE_TO_CASH).strip()

    if kind in SECURED_KINDS or disburse == DISBURSE_TO_ASSET:
        raise HTTPException(
            status_code=400,
            detail="Use POST /api/finance/acquisitions/secured for mortgage and auto loan",
        )

    if kind in CONSUMER_KINDS and _count_active_consumer_loans(db, profile.id) >= MAX_ACTIVE_CONSUMER_LOANS:
        raise HTTPException(status_code=400, detail="Maximum active consumer loans reached")

    principal = float(tpl.total_debt)
    rate = float(tpl.annual_rate_percent)
    term = getattr(tpl, "term_periods", None)
    term_i = int(term) if term is not None else 0

    if term_i > 0:
        mp = monthly_payment(principal, rate, term_i)
        pay_mode = PAYMENT_MODE_ANNUITY
    else:
        mp = monthly_interest_payment(principal, rate)
        pay_mode = PAYMENT_MODE_INTEREST_ONLY

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
        original_principal=principal,
        annual_rate_percent=rate,
        monthly_payment=mp,
        liability_kind=kind if kind in CONSUMER_KINDS else "consumer",
        secured_asset_id=None,
        term_periods=term_i if term_i > 0 else None,
        periods_paid=0,
        payment_mode=pay_mode,
        overdue_amount=0,
        overdue_periods=0,
        is_active=1,
    )
    db.add(liability)
    db.commit()
    db.refresh(liability)
    return liability


def prepay_liability(db: Session, profile: GameProfile, liability_id: int, amount: float) -> FinanceLiability:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be > 0")

    liability = (
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.id == liability_id,
            FinanceLiability.game_profile_id == profile.id,
            FinanceLiability.is_active == 1,
        )
        .first()
    )
    if not liability:
        raise HTTPException(status_code=404, detail="Liability not found")

    if float(profile.cash_balance) + EPSILON < float(amount):
        raise HTTPException(status_code=400, detail="Недостаточно средств на счёте")

    new_overdue, new_debt, to_od, to_body = prepay_waterfall(
        amount, float(liability.overdue_amount or 0), float(liability.total_debt or 0)
    )
    applied = to_od + to_body
    if applied <= EPSILON:
        raise HTTPException(status_code=400, detail="Nothing to prepay")

    adjust_balance(
        db=db,
        game_profile_id=profile.id,
        amount=-applied,
        type="liability_prepay",
        description=f"Досрочное погашение: {liability.title}",
        period_index=int(profile.period_index),
    )

    liability.overdue_amount = new_overdue
    liability.total_debt = new_debt

    if effective_payment_mode(liability) == PAYMENT_MODE_ANNUITY:
        n_rem = remaining_periods(liability)
        if n_rem > 0 and new_debt > EPSILON:
            liability.monthly_payment = monthly_payment(
                new_debt, float(liability.annual_rate_percent), n_rem
            )
        elif new_debt <= EPSILON:
            liability.is_active = 0

    db.commit()
    db.refresh(liability)
    return liability
