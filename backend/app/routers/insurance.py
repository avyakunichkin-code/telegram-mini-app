from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game.time import get_active_game_profile, sync_time
from ..idempotency import read_idempotency_key, run_idempotent
from ..services.insurance.service import (
    buy_policy as service_buy_policy,
    cancel_policy as service_cancel_policy,
    get_insurance_catalog as service_get_insurance_catalog,
    list_policies as service_list_policies,
)

router = APIRouter(prefix="/api/insurance", tags=["insurance"])


@router.get("/catalog")
async def insurance_catalog():
    """Справочник пар продукт × объект, сетка 2×2 и готовые тарифы."""
    return service_get_insurance_catalog()


@router.get("/policies")
async def list_policies(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    return service_list_policies(db, profile)


@router.post("/buy")
async def buy_policy(
    request: Request,
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    idem_key = read_idempotency_key(request)

    def _execute() -> dict:
        profile = get_active_game_profile(db, current_user.id)
        sync_time(profile)
        return service_buy_policy(db, profile, payload)

    if idem_key:
        status, body = run_idempotent(
            db,
            user_id=current_user.id,
            route_key="insurance.buy",
            idempotency_key=idem_key,
            handler=_execute,
        )
        return JSONResponse(status_code=status, content=body)
    return _execute()


@router.post("/{policy_id}/cancel")
async def cancel_policy(policy_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    return service_cancel_policy(db, profile, policy_id)
