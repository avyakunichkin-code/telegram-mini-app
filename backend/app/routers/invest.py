from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game_time import get_active_game_profile, sync_time
from ..balance_utils import adjust_balance
from ..models import InvestmentPosition
from ..idempotency import read_idempotency_key, run_idempotent


router = APIRouter(prefix="/api/invest", tags=["invest"])


@router.get("/positions")
async def list_positions(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
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


@router.post("/deposit/open")
async def open_deposit(
    request: Request,
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    amount = float(payload.get("amount") or 0)
    annual_rate_percent = float(payload.get("annual_rate_percent") or 0)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be > 0")
    if annual_rate_percent < 0:
        raise HTTPException(status_code=400, detail="annual_rate_percent must be >= 0")

    idem_key = read_idempotency_key(request)

    def _execute() -> dict:
        profile = get_active_game_profile(db, current_user.id)
        sync_time(profile)
        if profile.cash_balance < amount:
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

    if idem_key:
        status, body = run_idempotent(
            db,
            user_id=current_user.id,
            route_key="invest.deposit_open",
            idempotency_key=idem_key,
            handler=_execute,
        )
        return JSONResponse(status_code=status, content=body)
    return _execute()


@router.post("/bond/buy")
async def buy_bond(
    request: Request,
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    amount = float(payload.get("amount") or 0)
    annual_rate_percent = float(payload.get("annual_rate_percent") or 0)
    title = (payload.get("title") or "ОФЗ (условно)").strip() or "ОФЗ (условно)"
    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be > 0")
    if annual_rate_percent < 0:
        raise HTTPException(status_code=400, detail="annual_rate_percent must be >= 0")

    idem_key = read_idempotency_key(request)

    def _execute() -> dict:
        profile = get_active_game_profile(db, current_user.id)
        sync_time(profile)
        if profile.cash_balance < amount:
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

    if idem_key:
        status, body = run_idempotent(
            db,
            user_id=current_user.id,
            route_key="invest.bond_buy",
            idempotency_key=idem_key,
            handler=_execute,
        )
        return JSONResponse(status_code=status, content=body)
    return _execute()


@router.post("/positions/{position_id}/close")
async def close_position(position_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)

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

