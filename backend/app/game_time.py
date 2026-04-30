from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import GameProfile


def get_active_game_profile(db: Session, user_id: int) -> GameProfile:
    profile = (
        db.query(GameProfile)
        .filter(GameProfile.user_id == user_id, GameProfile.is_active == 1, GameProfile.is_archived == 0)
        .first()
    )
    if profile:
        return profile

    fallback = GameProfile(user_id=user_id, name="Мой первый профиль", mode="light", is_active=1)
    db.add(fallback)
    db.commit()
    db.refresh(fallback)
    return fallback


def sync_time(profile: GameProfile) -> int:
    if profile.time_state != "play":
        return 0
    now = datetime.utcnow()
    elapsed = (now - profile.period_anchor_at).total_seconds()
    if elapsed < profile.period_duration_seconds:
        return 0
    passed = int(elapsed // profile.period_duration_seconds)
    profile.period_index += passed
    profile.period_anchor_at += timedelta(seconds=passed * profile.period_duration_seconds)
    return passed


def set_time_state(profile: GameProfile, state: str) -> None:
    normalized = (state or "").strip().lower()
    if normalized not in {"play", "pause"}:
        raise HTTPException(status_code=400, detail="time_state must be play or pause")
    profile.time_state = normalized
    if normalized == "play":
        profile.period_anchor_at = datetime.utcnow()


def next_period(profile: GameProfile) -> None:
    profile.period_index += 1
    profile.period_anchor_at = datetime.utcnow()


def set_period_duration(profile: GameProfile, seconds: int) -> None:
    if seconds < 10:
        raise HTTPException(status_code=400, detail="period_duration_seconds must be >= 10")
    profile.period_duration_seconds = seconds
    profile.period_anchor_at = datetime.utcnow()


def get_seconds_until_next(profile: GameProfile) -> int:
    if profile.time_state != "play":
        return profile.period_duration_seconds
    now = datetime.utcnow()
    elapsed = int((now - profile.period_anchor_at).total_seconds())
    remaining = profile.period_duration_seconds - elapsed
    return max(0, remaining)
