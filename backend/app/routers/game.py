from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import json

from ..auth import get_current_user
from ..database import get_db
from ..game_period import process_period_end
from ..models import GameProfile, FinanceSalary, FinanceAsset, FinanceLiability, Transaction, GameStarterTemplate
from ..finance_helpers import monthly_interest_payment
from ..schemas import (
    GameProfileCreate,
    GameProfileResponse,
    TimeConfigUpdate,
    TimeStatusResponse,
    GameStartRequest,
    GameStartResponse,
    AssetCreate,
    LiabilityCreate,
    GameStarterTemplatePublic,
)
from ..game_time import (
    get_active_game_profile,
    sync_time,
    set_time_state,
    next_period,
    set_period_duration,
    get_seconds_until_next,
)

router = APIRouter(prefix="/api/game", tags=["game"])


def _validate_save_kind(save_kind: str) -> str:
    normalized = (save_kind or "").strip().lower()
    if normalized != "game":
        raise HTTPException(status_code=400, detail="save_kind must be game (plan — позже)")
    return normalized


@router.get("/templates", response_model=list[GameStarterTemplatePublic])
async def list_game_templates(db: Session = Depends(get_db)):
    rows = (
        db.query(GameStarterTemplate)
        .filter(GameStarterTemplate.is_active == 1)
        .order_by(GameStarterTemplate.sort_order.asc(), GameStarterTemplate.id.asc())
        .all()
    )
    return [
        GameStarterTemplatePublic(
            template_key=r.template_key,
            title=r.title,
            difficulty_rank=int(r.difficulty_rank or 1),
        )
        for r in rows
    ]


@router.get("/profiles", response_model=list[GameProfileResponse])
async def list_game_profiles(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(GameProfile)
        .filter(GameProfile.user_id == current_user.id, GameProfile.is_archived == 0)
        .order_by(GameProfile.created_at.desc())
        .all()
    )


@router.post("/profiles", response_model=GameProfileResponse)
async def create_game_profile(
    payload: GameProfileCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    save_kind = _validate_save_kind(payload.save_kind)
    profile_name = (payload.name or "").strip()
    if not profile_name:
        raise HTTPException(status_code=400, detail="name is required")

    has_any = db.query(GameProfile).filter(GameProfile.user_id == current_user.id).count() > 0
    if not has_any:
        db.query(GameProfile).filter(GameProfile.user_id == current_user.id).update({"is_active": 0})

    profile = GameProfile(
        user_id=current_user.id,
        name=profile_name,
        save_kind=save_kind,
        is_active=0 if has_any else 1,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/profiles/{profile_id}/activate")
async def activate_game_profile(
    profile_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(GameProfile)
        .filter(
            GameProfile.id == profile_id,
            GameProfile.user_id == current_user.id,
            GameProfile.is_archived == 0,
        )
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Game profile not found")

    db.query(GameProfile).filter(GameProfile.user_id == current_user.id).update({"is_active": 0})
    profile.is_active = 1
    db.commit()
    return {"status": "success", "active_profile_id": profile_id}


@router.post("/start", response_model=GameStartResponse)
async def start_new_game(
        request: Request,
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Новый профиль Game: либо из шаблона (`template_key`), либо ручной набор активов/долгов (legacy UI).
    """
    body = await request.json()

    if "monthly_salary" not in body and "monthly_amount" in body:
        payload = GameStartRequest(
            profile_name=body.get("profile_name"),
            save_kind=body.get("save_kind") or "game",
            template_key=body.get("template_key"),
            period_duration_seconds=body.get("period_duration_seconds") or 300,
            cash_balance=body.get("cash_balance", 0),
            monthly_salary=body.get("monthly_amount", 0),
            assets=[],
            liabilities=[],
        )
    else:
        payload = GameStartRequest(**body)

    if not payload.profile_name.strip():
        raise HTTPException(status_code=400, detail="profile_name is required")

    save_kind = _validate_save_kind(payload.save_kind)

    starter_template_key = None
    base_monthly_lifestyle = 0.0
    period_duration_seconds = int(payload.period_duration_seconds)
    cash_balance = float(payload.cash_balance)
    monthly_salary = float(payload.monthly_salary)
    assets_list: List[AssetCreate] = []
    liabilities_list: List[LiabilityCreate] = []

    if payload.template_key:
        tk = (payload.template_key or "").strip()
        if not tk:
            raise HTTPException(status_code=400, detail="template_key is empty")
        tmpl = (
            db.query(GameStarterTemplate)
            .filter(GameStarterTemplate.template_key == tk, GameStarterTemplate.is_active == 1)
            .first()
        )
        if not tmpl:
            raise HTTPException(status_code=404, detail="game template not found")
        try:
            bp = json.loads(tmpl.blueprint_json or "{}")
        except json.JSONDecodeError:
            bp = {}
        period_duration_seconds = int(bp.get("period_duration_seconds") or period_duration_seconds)
        cash_balance = float(bp.get("cash_balance", cash_balance))
        monthly_salary = float(bp.get("monthly_salary", monthly_salary))
        starter_template_key = tk
        base_monthly_lifestyle = float(tmpl.base_monthly_lifestyle_expense or 0)

        for a in bp.get("assets") or []:
            if isinstance(a, dict):
                assets_list.append(
                    AssetCreate(
                        title=a.get("title") or "Актив",
                        kind=a.get("kind") or "generic",
                        asset_value=float(a.get("asset_value") or 0),
                        monthly_maintenance_cost=float(a.get("monthly_maintenance_cost") or 0),
                        monthly_income=float(a.get("monthly_income") or 0),
                    )
                )
        for li in bp.get("liabilities") or []:
            if isinstance(li, dict):
                liabilities_list.append(
                    LiabilityCreate(
                        title=li.get("title") or "Обязательство",
                        total_debt=float(li.get("total_debt") or 0),
                        annual_rate_percent=float(li.get("annual_rate_percent") or 0),
                    )
                )
    else:
        assets_list = list(payload.assets)
        liabilities_list = list(payload.liabilities)

    if period_duration_seconds < 10:
        raise HTTPException(status_code=400, detail="period_duration_seconds must be >= 10")
    if cash_balance < 0:
        raise HTTPException(status_code=400, detail="cash_balance cannot be negative")
    if monthly_salary < 0:
        raise HTTPException(status_code=400, detail="monthly_salary cannot be negative")

    db.query(GameProfile).filter(
        GameProfile.user_id == current_user.id,
        GameProfile.is_active == 1
    ).update({"is_active": 0})

    new_profile = GameProfile(
        user_id=current_user.id,
        name=payload.profile_name.strip(),
        save_kind=save_kind,
        starter_template_key=starter_template_key,
        starter_params_json="{}",
        base_monthly_lifestyle_expense=base_monthly_lifestyle,
        delta_monthly_lifestyle_expense=0,
        is_active=1,
        period_duration_seconds=period_duration_seconds,
        cash_balance=cash_balance,
        safety_fund_balance=0,
        negative_periods_count=0,
        period_index=1,
        time_state="pause",
        period_anchor_at=datetime.utcnow(),
        base_params_locked=1,
        onboarding_state="started",
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    salary = FinanceSalary(
        game_profile_id=new_profile.id,
        monthly_amount=monthly_salary,
        monthly_receipts_count=1
    )
    db.add(salary)

    for asset_data in assets_list:
        asset = FinanceAsset(
            game_profile_id=new_profile.id,
            title=asset_data.title,
            kind=getattr(asset_data, "kind", None) or "generic",
            asset_value=asset_data.asset_value,
            monthly_maintenance_cost=asset_data.monthly_maintenance_cost,
            monthly_income=float(getattr(asset_data, "monthly_income", 0) or 0),
            is_active=1
        )
        db.add(asset)

    for liability_data in liabilities_list:
        liability = FinanceLiability(
            game_profile_id=new_profile.id,
            title=liability_data.title,
            total_debt=liability_data.total_debt,
            annual_rate_percent=liability_data.annual_rate_percent,
            monthly_payment=monthly_interest_payment(liability_data.total_debt, liability_data.annual_rate_percent),
            is_active=1
        )
        db.add(liability)

    start_transaction = Transaction(
        game_profile_id=new_profile.id,
        amount=cash_balance,
        type="initial_balance",
        description=f"Стартовый баланс при создании профиля '{new_profile.name}'",
        period_index=1
    )
    db.add(start_transaction)

    db.commit()

    return GameStartResponse(
        profile_id=new_profile.id,
        message=f"Игра '{new_profile.name}' успешно запущена. Баланс: {cash_balance} ₽"
    )


@router.get("/time", response_model=TimeStatusResponse)
async def get_time_status(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)  # Важно: синхронизируем перед возвратом
    db.commit()
    db.refresh(profile)
    return TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
    )


@router.post("/time/play", response_model=TimeStatusResponse)
async def set_play_mode(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    set_time_state(profile, "play")
    db.commit()
    db.refresh(profile)
    return TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
    )


@router.post("/time/pause", response_model=TimeStatusResponse)
async def set_pause_mode(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    set_time_state(profile, "pause")
    db.commit()
    db.refresh(profile)
    return TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
    )


@router.post("/time/next", response_model=TimeStatusResponse)
async def go_to_next_period(
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Активный профиль не найден")

    # Завершаем текущий период
    period_result = process_period_end(db, profile)

    if period_result["game_over"]:
        raise HTTPException(
            status_code=400,
            detail="Игра окончена. Вы трижды подряд имели отрицательный баланс. Начните новую игру."
        )

    # Обновляем состояние времени
    sync_time(profile)
    set_time_state(profile, "pause")
    db.commit()
    db.refresh(profile)

    return TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
    )


@router.put("/time/config", response_model=TimeStatusResponse)
async def update_time_config(
    payload: TimeConfigUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    set_period_duration(profile, payload.period_duration_seconds)
    db.commit()
    db.refresh(profile)
    return TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
    )
