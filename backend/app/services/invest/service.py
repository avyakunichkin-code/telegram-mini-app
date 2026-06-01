from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...finance.balance_utils import adjust_balance
from ...models import GameProfile, InvestmentPosition
from ...starters.mechanics import MECHANIC_CAPITAL_INVEST, require_capital_mechanic


def list_active_positions(db: Session, profile: GameProfile) -> list[dict]:
    rows = (
        db.query(InvestmentPosition)
        .filter(InvestmentPosition.game_profile_id == profile.id, InvestmentPosition.is_active == 1)
        .order_by(InvestmentPosition.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "kind": r.kind,
            "title": r.title,
            "principal": r.principal,
            "annual_rate_percent": r.annual_rate_percent,
            "started_period": r.started_period,
            "last_accrued_period": r.last_accrued_period,
        }
        for r in rows
    ]


def open_deposit(db: Session, profile: GameProfile, *, amount: float, annual_rate_percent: float) -> dict:
    require_capital_mechanic(db, profile, MECHANIC_CAPITAL_INVEST)
    if float(profile.cash_balance or 0) < amount:
        raise HTTPException(status_code=400, detail="Недостаточно средств")

    adjust_balance(db, profile.id, -amount, "deposit_open", "Открытие депозита", profile.period_index)
    pos = InvestmentPosition(
        game_profile_id=profile.id,
        kind="deposit",
        title=f"Депозит {annual_rate_percent:.1f}% годовых",
        principal=amount,
        annual_rate_percent=annual_rate_percent,
        started_period=profile.period_index,
        last_accrued_period=profile.period_index,
        is_active=1,
    )
    db.add(pos)
    db.commit()
    db.refresh(pos)
    return {"status": "success", "position_id": pos.id}


def buy_bond(db: Session, profile: GameProfile, *, amount: float, annual_rate_percent: float, title: str) -> dict:
    require_capital_mechanic(db, profile, MECHANIC_CAPITAL_INVEST)
    if float(profile.cash_balance or 0) < amount:
        raise HTTPException(status_code=400, detail="Недостаточно средств")

    adjust_balance(db, profile.id, -amount, "bond_buy", f"Покупка облигаций: {title}", profile.period_index)
    pos = InvestmentPosition(
        game_profile_id=profile.id,
        kind="bond",
        title=title,
        principal=amount,
        annual_rate_percent=annual_rate_percent,
        started_period=profile.period_index,
        last_accrued_period=profile.period_index,
        is_active=1,
    )
    db.add(pos)
    db.commit()
    db.refresh(pos)
    return {"status": "success", "position_id": pos.id}


def close_position(db: Session, profile: GameProfile, *, position_id: int) -> dict:
    require_capital_mechanic(db, profile, MECHANIC_CAPITAL_INVEST)

    pos = (
        db.query(InvestmentPosition)
        .filter(
            InvestmentPosition.id == position_id,
            InvestmentPosition.game_profile_id == profile.id,
            InvestmentPosition.is_active == 1,
        )
        .first()
    )
    if not pos:
        raise HTTPException(status_code=404, detail="Position not found")

    pos.is_active = 0
    db.commit()
    # возвращаем тело (principal уже включает капитализацию депозита)
    adjust_balance(db, profile.id, +float(pos.principal), "invest_close", f"Закрытие: {pos.title}", profile.period_index)
    db.commit()
    return {"status": "success"}

