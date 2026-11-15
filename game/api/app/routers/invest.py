from functools import partial
from math import isfinite

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game.session import get_active_game_profile
from ..idempotency import load_stored_body, read_idempotency_key, run_idempotent
from ..services.invest.service import (
    buy_bond as service_buy_bond,
    close_position as service_close_position,
    list_active_positions as service_list_active_positions,
    lock_investment_profile,
    open_deposit as service_open_deposit,
)


router = APIRouter(prefix="/api/invest", tags=["invest"])


@router.get("/positions")
def list_positions(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    return service_list_active_positions(db, profile)


def _purchase_response(request: Request, db: Session, user_id: int, route_key: str, purchase):
    idem_key = read_idempotency_key(request)
    if not idem_key:
        return purchase(db, get_active_game_profile(db, user_id))

    key = {"user_id": user_id, "route_key": route_key, "idempotency_key": idem_key}
    stored = load_stored_body(db, **key)
    if stored is not None:
        return JSONResponse(status_code=200, content=stored)

    profile = get_active_game_profile(db, user_id)
    lock_investment_profile(db, profile)
    status, body = run_idempotent(
        db, **key, handler=lambda: purchase(db, profile, commit=False),
    )
    return JSONResponse(status_code=status, content=body)


def _purchase_amount(payload: dict) -> float:
    try:
        amount = float(payload.get("amount") or 0)
    except (TypeError, ValueError, OverflowError):
        amount = 0
    if not isfinite(amount) or amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be > 0")
    return amount


@router.post("/deposit/open")
def open_deposit(
    request: Request,
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _purchase_response(
        request, db, current_user.id, "invest.deposit_open",
        partial(service_open_deposit, amount=_purchase_amount(payload)),
    )


@router.post("/bond/buy")
def buy_bond(
    request: Request,
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _purchase_response(
        request, db, current_user.id, "invest.bond_buy",
        partial(service_buy_bond, amount=_purchase_amount(payload), title=str(payload.get("title") or "")),
    )


@router.post("/positions/{position_id}/close")
def close_position(position_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    return service_close_position(db, profile, position_id=position_id)

