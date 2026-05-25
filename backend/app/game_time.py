from typing import Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import GameProfile
from .timeutil import utc_now_naive


def get_active_game_profile(db: Session, user_id: int) -> GameProfile:
    profile = (
        db.query(GameProfile)
        .filter(GameProfile.user_id == user_id, GameProfile.is_active == 1, GameProfile.is_archived == 0)
        .first()
    )
    if profile:
        return profile

    fallback = GameProfile(user_id=user_id, name="Мой первый профиль", save_kind="game", is_active=1)
    db.add(fallback)
    db.commit()
    db.refresh(fallback)
    return fallback


def sync_time(profile: GameProfile) -> Tuple[int, float]:
    """
    Пошаговый месяц (TB1): real-time не продвигает period_index.
    Закрытие периода — только через process_period_end (POST /api/game/time/next).
    """
    return 0, 0.0


def set_time_state(profile: GameProfile, state: str) -> None:
    normalized = (state or "").strip().lower()
    if normalized not in {"play", "pause"}:
        raise HTTPException(status_code=400, detail="time_state must be play or pause")

    if normalized == "play" and profile.time_state != "play":
        profile.period_anchor_at = utc_now_naive()

    profile.time_state = normalized


def next_period(profile: GameProfile) -> None:
    """Legacy helper: инкремент периода без экономики. В prod используйте process_period_end."""
    sync_time(profile)
    profile.period_index += 1
    profile.period_anchor_at = utc_now_naive()


def set_period_duration(profile: GameProfile, seconds: int) -> None:
    if seconds < 10:
        raise HTTPException(status_code=400, detail="period_duration_seconds must be >= 10")
    profile.period_duration_seconds = seconds
    if profile.time_state == "play":
        profile.period_anchor_at = utc_now_naive()


def get_seconds_until_next(profile: GameProfile) -> int:
    """Turn-based: авто-закрытия по времени нет."""
    return 0
