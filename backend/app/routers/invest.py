from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game.time import get_active_game_profile, sync_time
from ..idempotency import read_idempotency_key, run_idempotent
from ..services.invest.service import (
    buy_bond as service_buy_bond,
    close_position as service_close_position,
    list_active_positions as service_list_active_positions,
    open_deposit as service_open_deposit,
)


router = APIRouter(prefix="/api/invest", tags=["invest"])


@router.get("/positions")
async def list_positions(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    return service_list_active_positions(db, profile)


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
        return service_open_deposit(db, profile, amount=amount, annual_rate_percent=annual_rate_percent)

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
        return service_buy_bond(
            db,
            profile,
            amount=amount,
            annual_rate_percent=annual_rate_percent,
            title=title,
        )

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
    return service_close_position(db, profile, position_id=position_id)

