from math import fsum

from fastapi import HTTPException
from sqlalchemy import update
from sqlalchemy.orm import Session

from ...finance.balance_utils import _lock_profile_for_balance, adjust_balance
from ...finance.invest_products import get_invest_product
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


def lock_investment_profile(db: Session, profile: GameProfile) -> GameProfile:
    if db.get_bind().dialect.name == "sqlite":
        # Acquire the SQLite writer lock before reading balances or positions.
        db.execute(
            update(GameProfile)
            .where(GameProfile.id == profile.id)
            .values(cash_balance=GameProfile.cash_balance)
        )
    return _lock_profile_for_balance(db, profile.id)


def _purchase(db: Session, profile: GameProfile, *, kind: str, amount: float,
              title: str, transaction_type: str, description: str, commit: bool) -> dict:
    try:
        profile = lock_investment_profile(db, profile)
        require_capital_mechanic(db, profile, MECHANIC_CAPITAL_INVEST)
        if float(profile.cash_balance or 0) < amount:
            raise HTTPException(status_code=400, detail="Недостаточно средств")

        period = int(profile.period_index or 1)
        last_accrued = max(0, period - 1)
        rate = get_invest_product(kind).annual_rate_percent
        rows = (
            db.query(InvestmentPosition)
            .filter_by(
                game_profile_id=profile.id,
                kind=kind,
                annual_rate_percent=rate,
                last_accrued_period=last_accrued,
                is_active=1,
            )
            .order_by(InvestmentPosition.id)
            .all()
        )
        adjust_balance(db, profile.id, -amount, transaction_type, description, period)
        if rows:
            pos = rows[0]
            pos.principal = fsum([amount, *(row.principal for row in rows)])
            for duplicate in rows[1:]:
                duplicate.is_active = 0
        else:
            pos = InvestmentPosition(
                game_profile_id=profile.id,
                kind=kind,
                title=title,
                principal=amount,
                annual_rate_percent=rate,
                started_period=period,
                last_accrued_period=last_accrued,
                is_active=1,
            )
            db.add(pos)
        db.flush()
        result = {"status": "success", "position_id": pos.id}
        if commit:
            db.commit()
        return result
    except Exception:
        db.rollback()
        raise


def open_deposit(db: Session, profile: GameProfile, *, amount: float, commit: bool = True) -> dict:
    rate = get_invest_product("deposit").annual_rate_percent
    title = f"Депозит {f'{rate:g}'.replace('.', ',')}% годовых"
    return _purchase(
        db, profile, kind="deposit", amount=amount, title=title,
        transaction_type="deposit_open", description="Открытие депозита", commit=commit,
    )


def buy_bond(
    db: Session, profile: GameProfile, *, amount: float, title: str | None = None, commit: bool = True,
) -> dict:
    product = get_invest_product("bond")
    title = ((title or "").strip() or product.default_title)[:160]
    return _purchase(
        db, profile, kind="bond", amount=amount, title=title,
        transaction_type="bond_buy", description=f"Покупка облигаций: {title}", commit=commit,
    )


def close_position(db: Session, profile: GameProfile, *, position_id: int) -> dict:
    try:
        profile = lock_investment_profile(db, profile)
        require_capital_mechanic(db, profile, MECHANIC_CAPITAL_INVEST)
        pos = db.query(InvestmentPosition).filter_by(
            id=position_id, game_profile_id=profile.id, is_active=1,
        ).first()
        if not pos:
            raise HTTPException(status_code=404, detail="Position not found")

        pos.is_active = 0
        adjust_balance(db, profile.id, +float(pos.principal), "invest_close", f"Закрытие: {pos.title}", profile.period_index)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"status": "success"}
