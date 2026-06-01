from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..schemas import (
    SafetyFundContribution,
    PeriodStatusResponse,
    PeriodSummaryResponse,
    TreatSelfRequest,
    TreatSelfResponse,
)
from ..game.time import get_active_game_profile, sync_time
from ..idempotency import read_idempotency_key, run_idempotent
from ..services.period.complete import complete_period as service_complete_period
from ..services.period.salary import claim_salary as service_claim_salary
from ..services.period.status import build_period_status
from ..services.period.safety_fund import (
    contribute_to_safety_fund as service_contribute_to_safety_fund,
    withdraw_from_safety_fund as service_withdraw_from_safety_fund,
)
from ..services.period.treat_self import treat_self as service_treat_self

router = APIRouter(prefix="/api/game/period", tags=["period"])


@router.get("/status", response_model=PeriodStatusResponse)
async def get_period_status(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получает статус текущего периода — какие действия выполнены"""
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    return build_period_status(db, profile)


@router.post("/claim-salary")
async def claim_salary(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить зарплату за текущий период (один раз за период; повтор — идемпотентный 200)."""
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    return service_claim_salary(db, profile)


@router.post("/contribute-to-safety-fund")
async def contribute_to_safety_fund(
    request: Request,
    contribution: SafetyFundContribution,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Отложить деньги в подушку безопасности.
    Списывает указанную сумму с cash_balance и зачисляет на safety_fund_balance.
    """
    idem_key = read_idempotency_key(request)

    def _execute() -> dict:
        profile = get_active_game_profile(db, current_user.id)
        sync_time(profile)
        return service_contribute_to_safety_fund(db, profile, float(contribution.amount))

    if idem_key:
        status, body = run_idempotent(
            db,
            user_id=current_user.id,
            route_key="period.contribute_safety_fund",
            idempotency_key=idem_key,
            handler=_execute,
        )
        return JSONResponse(status_code=status, content=body)
    return _execute()


@router.post("/complete-period", response_model=PeriodSummaryResponse)
async def complete_period(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Завершает текущий период (вызывается при Next или автоматически)
    Фиксирует итоги и переносит состояние в следующий период
    """
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    return service_complete_period(db, profile)


@router.post("/withdraw-from-safety-fund")
async def withdraw_from_safety_fund(
    request: Request,
    withdrawal: SafetyFundContribution,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Снять деньги с подушки безопасности на основной счёт.
    Без комиссии, без ограничений по периоду.
    """
    idem_key = read_idempotency_key(request)

    def _execute() -> dict:
        profile = get_active_game_profile(db, current_user.id)
        sync_time(profile)
        return service_withdraw_from_safety_fund(db, profile, float(withdrawal.amount))

    if idem_key:
        status, body = run_idempotent(
            db,
            user_id=current_user.id,
            route_key="period.withdraw_safety_fund",
            idempotency_key=idem_key,
            handler=_execute,
        )
        return JSONResponse(status_code=status, content=body)
    return _execute()


@router.post("/treat-self", response_model=TreatSelfResponse)
async def treat_self(
    request: Request,
    payload: TreatSelfRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """«Порадовать себя»: списание с cash + needs_delta, с кулдауном по периодам (ADR-006)."""
    option_id = (payload.option_id or "").strip()
    if not option_id:
        raise HTTPException(status_code=400, detail="option_id is required")

    idem_key = read_idempotency_key(request)

    def _execute() -> dict:
        profile = get_active_game_profile(db, current_user.id)
        sync_time(profile)
        return service_treat_self(db, profile, option_id)

    if idem_key:
        status, body = run_idempotent(
            db,
            user_id=current_user.id,
            route_key="period.treat_self",
            idempotency_key=idem_key,
            handler=_execute,
        )
        return JSONResponse(status_code=status, content=body)
    return _execute()