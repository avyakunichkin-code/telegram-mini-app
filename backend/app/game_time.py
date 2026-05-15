from datetime import datetime, timedelta
from typing import Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import GameProfile


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
    Синхронизирует игровое время.
    Возвращает (количество пройденных периодов, накопленный остаток секунд)
    """
    if profile.time_state != "play":
        return 0, 0.0

    now = datetime.utcnow()
    elapsed = (now - profile.period_anchor_at).total_seconds()

    if elapsed < profile.period_duration_seconds:
        return 0, elapsed

    passed = int(elapsed // profile.period_duration_seconds)
    remainder = elapsed % profile.period_duration_seconds

    profile.period_index += passed
    profile.period_anchor_at = now - timedelta(seconds=remainder)

    return passed, remainder


def set_time_state(profile: GameProfile, state: str) -> None:
    normalized = (state or "").strip().lower()
    if normalized not in {"play", "pause"}:
        raise HTTPException(status_code=400, detail="time_state must be play or pause")

    # При переключении в play синхронизируем время
    if normalized == "play" and profile.time_state != "play":
        sync_time(profile)
        profile.period_anchor_at = datetime.utcnow()

    profile.time_state = normalized


def next_period(profile: GameProfile) -> None:
    """Принудительный переход к следующему периоду"""
    sync_time(profile)  # Сначала синхронизируем
    profile.period_index += 1
    profile.period_anchor_at = datetime.utcnow()


def set_period_duration(profile: GameProfile, seconds: int) -> None:
    if seconds < 10:
        raise HTTPException(status_code=400, detail="period_duration_seconds must be >= 10")
    profile.period_duration_seconds = seconds
    if profile.time_state == "play":
        profile.period_anchor_at = datetime.utcnow()


def get_seconds_until_next(profile: GameProfile) -> int:
    """Возвращает количество секунд до конца текущего периода"""
    if profile.time_state != "play":
        return profile.period_duration_seconds

    now = datetime.utcnow()
    elapsed = (now - profile.period_anchor_at).total_seconds()
    remaining = profile.period_duration_seconds - elapsed
    return max(0, int(remaining))