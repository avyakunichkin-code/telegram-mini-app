"""
Эвристики «застрял» для Ops Watchtower (A4).

Пороги — черновик из PLAN_admin-analytics-ops.md; dedupe в notification_log.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Optional

from sqlalchemy.orm import Session

from ..models import GameProfile, User
from ..timeutil import utc_now_naive
from .notify import emit_admin_alert

PLAYER_STUCK_HOURS = 24
ONBOARDING_STUCK_HOURS = 24
PLAYER_STUCK_MAX_PERIOD_INDEX = 3


def _stale(updated_at, *, hours: int) -> bool:
    if updated_at is None:
        return False
    return updated_at <= utc_now_naive() - timedelta(hours=hours)


def is_player_stuck(profile: GameProfile) -> bool:
    if int(profile.is_active or 0) != 1:
        return False
    if str(profile.time_state or "") != "play":
        return False
    if int(profile.period_index or 0) >= PLAYER_STUCK_MAX_PERIOD_INDEX:
        return False
    return _stale(profile.updated_at, hours=PLAYER_STUCK_HOURS)


def is_onboarding_stuck(profile: GameProfile, user: User) -> bool:
    if int(profile.is_active or 0) != 1:
        return False
    if int(profile.period_index or 0) > 1:
        return False
    if int(getattr(user, "guidance_completed", 0) or 0) == 1:
        return False
    onboarding_state = str(getattr(profile, "onboarding_state", "") or "")
    if onboarding_state == "brief_done":
        return False
    return _stale(profile.updated_at, hours=ONBOARDING_STUCK_HOURS)


def profile_stuck_kind(profile: GameProfile, user: User) -> Optional[str]:
    if is_onboarding_stuck(profile, user):
        return "onboarding_stuck"
    if is_player_stuck(profile):
        return "player_stuck"
    return None


def maybe_emit_player_stuck(db: Session, profile: GameProfile) -> None:
    if not is_player_stuck(profile):
        return
    hours_idle = PLAYER_STUCK_HOURS
    emit_admin_alert(
        db,
        "player_stuck",
        {
            "name": profile.name,
            "period_index": int(profile.period_index),
            "time_state": profile.time_state,
            "hours_idle": hours_idle,
            "profile_id": profile.id,
        },
        user_id=profile.user_id,
        game_profile_id=profile.id,
        dedupe_key=f"player_stuck:{profile.id}",
        send_telegram=True,
    )


def maybe_emit_onboarding_stuck(db: Session, profile: GameProfile, user: User) -> None:
    if not is_onboarding_stuck(profile, user):
        return
    emit_admin_alert(
        db,
        "onboarding_stuck",
        {
            "name": profile.name,
            "period_index": int(profile.period_index),
            "onboarding_state": str(getattr(profile, "onboarding_state", "") or ""),
            "guidance_completed": bool(int(getattr(user, "guidance_completed", 0) or 0)),
            "hours_idle": ONBOARDING_STUCK_HOURS,
            "profile_id": profile.id,
        },
        user_id=profile.user_id,
        game_profile_id=profile.id,
        dedupe_key=f"onboarding_stuck:{profile.id}",
        send_telegram=True,
    )


def scan_stuck_and_emit(
    db: Session,
    profiles_with_users: list[tuple[GameProfile, User]],
) -> None:
    """Проверить видимые в Watchtower профили и записать stuck-алерты (dedupe)."""
    for profile, user in profiles_with_users:
        maybe_emit_onboarding_stuck(db, profile, user)
        maybe_emit_player_stuck(db, profile)
