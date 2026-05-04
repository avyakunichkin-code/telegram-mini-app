from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from ..auth import get_current_user
from ..database import get_db
from ..game_period import process_period_end
from ..models import GameProfile, FinanceSalary, FinanceAsset, FinanceLiability, Transaction
from ..schemas import (GameProfileCreate, GameProfileResponse, TimeConfigUpdate, TimeStatusResponse, GameStartRequest,
                       GameStartResponse, AssetCreate, LiabilityCreate)
from ..game_time import (
    get_active_game_profile,
    sync_time,
    set_time_state,
    next_period,
    set_period_duration,
    get_seconds_until_next,
)

router = APIRouter(prefix="/api/game", tags=["game"])


def _validate_mode(mode: str) -> str:
    normalized = (mode or "").strip().lower()
    if normalized not in {"light", "hardcore"}:
        raise HTTPException(status_code=400, detail="mode must be light or hardcore")
    return normalized


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
    mode = _validate_mode(payload.mode)
    profile_name = (payload.name or "").strip()
    if not profile_name:
        raise HTTPException(status_code=400, detail="name is required")

    has_any = db.query(GameProfile).filter(GameProfile.user_id == current_user.id).count() > 0
    if not has_any:
        db.query(GameProfile).filter(GameProfile.user_id == current_user.id).update({"is_active": 0})

    profile = GameProfile(
        user_id=current_user.id,
        name=profile_name,
        mode=mode,
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
    # Получаем тело запроса в сыром виде
    body = await request.json()

    # Преобразуем старый формат в новый, если нужно
    if "monthly_salary" in body:
        # Уже новый формат
        payload = GameStartRequest(**body)
    else:
        # Старый формат: конвертируем
        payload = GameStartRequest(
            profile_name=body.get("profile_name"),
            mode=body.get("mode"),
            period_duration_seconds=body.get("period_duration_seconds"),
            cash_balance=body.get("cash_balance", 0),
            monthly_salary=body.get("monthly_amount", 0),
            assets=[],          # в старом формате активов не было
            liabilities=[]      # и обязательств тоже
        )
    """
    Создаёт новый игровой профиль с полной конфигурацией:
    - стартовый баланс
    - зарплата
    - список активов (со стоимостью и обслуживанием)
    - список обязательств (долг, процент, платёж)
    """
    # 1. Валидация
    if not payload.profile_name.strip():
        raise HTTPException(status_code=400, detail="profile_name is required")
    if payload.mode not in ["light", "hardcore"]:
        raise HTTPException(status_code=400, detail="mode must be light or hardcore")
    if payload.period_duration_seconds < 10:
        raise HTTPException(status_code=400, detail="period_duration_seconds must be >= 10")
    if payload.cash_balance < 0:
        raise HTTPException(status_code=400, detail="cash_balance cannot be negative")
    if payload.monthly_salary < 0:
        raise HTTPException(status_code=400, detail="monthly_salary cannot be negative")

    # Деактивируем все текущие активные профили пользователя
    db.query(GameProfile).filter(
        GameProfile.user_id == current_user.id,
        GameProfile.is_active == 1
    ).update({"is_active": 0})

    # Создаём профиль
    new_profile = GameProfile(
        user_id=current_user.id,
        name=payload.profile_name.strip(),
        mode=payload.mode,
        is_active=1,
        period_duration_seconds=payload.period_duration_seconds,
        cash_balance=payload.cash_balance,
        safety_fund_balance=0,
        negative_periods_count=0,
        period_index=1,
        time_state="pause",
        period_anchor_at=datetime.utcnow(),
        base_params_locked=1,
        onboarding_state="started"
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    # Зарплата
    salary = FinanceSalary(
        game_profile_id=new_profile.id,
        monthly_amount=payload.monthly_salary,
        monthly_receipts_count=1
    )
    db.add(salary)

    # Активы и обязательства из payload (если есть)
    for asset_data in payload.assets:
        asset = FinanceAsset(
            game_profile_id=new_profile.id,
            title=asset_data.title,
            asset_value=asset_data.asset_value,
            monthly_maintenance_cost=asset_data.monthly_maintenance_cost,
            is_active=1
        )
        db.add(asset)

    for liability_data in payload.liabilities:
        liability = FinanceLiability(
            game_profile_id=new_profile.id,
            title=liability_data.title,
            total_debt=liability_data.total_debt,
            annual_rate_percent=liability_data.annual_rate_percent,
            monthly_payment=liability_data.monthly_payment,
            is_active=1
        )
        db.add(liability)

    # Транзакция начального баланса
    start_transaction = Transaction(
        game_profile_id=new_profile.id,
        amount=payload.cash_balance,
        type="initial_balance",
        description=f"Стартовый баланс при создании профиля '{new_profile.name}'",
        period_index=1
    )
    db.add(start_transaction)

    db.commit()

    return GameStartResponse(
        profile_id=new_profile.id,
        message=f"Игра '{new_profile.name}' успешно запущена. Баланс: {payload.cash_balance} ₽"
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
