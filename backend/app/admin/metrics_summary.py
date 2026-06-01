"""Сводные KPI для Watchtower (A2)."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import GameProfile, NotificationLog, User
from ..timeutil import utc_now_naive


def build_metrics_summary(db: Session, *, days: int = 7) -> dict[str, Any]:
    window_days = max(1, min(int(days or 7), 90))
    since = utc_now_naive() - timedelta(days=window_days)

    users_total = int(db.query(func.count(User.id)).scalar() or 0)
    users_recent = int(
        db.query(func.count(User.id)).filter(User.created_at >= since).scalar() or 0
    )

    profiles_total = int(db.query(func.count(GameProfile.id)).scalar() or 0)
    profiles_active = int(
        db.query(func.count(GameProfile.id))
        .filter(GameProfile.is_active == 1)
        .scalar()
        or 0
    )
    profiles_recent = int(
        db.query(func.count(GameProfile.id))
        .filter(GameProfile.created_at >= since)
        .scalar()
        or 0
    )

    guidance_completed_total = int(
        db.query(func.count(User.id))
        .filter(User.guidance_completed == 1)
        .scalar()
        or 0
    )
    guidance_completed_recent = int(
        db.query(func.count(User.id))
        .filter(
            User.guidance_completed == 1,
            User.guidance_completed_at.isnot(None),
            User.guidance_completed_at >= since,
        )
        .scalar()
        or 0
    )

    users_with_profiles = (
        db.query(func.count(func.distinct(GameProfile.user_id))).scalar() or 0
    )
    guidance_in_progress = int(
        db.query(func.count(User.id))
        .filter(
            User.guidance_completed == 0,
            User.id.in_(db.query(GameProfile.user_id).distinct()),
        )
        .scalar()
        or 0
    )

    wins_total = int(
        db.query(func.count(NotificationLog.id))
        .filter(
            NotificationLog.audience == "admin",
            NotificationLog.kind == "game_won",
        )
        .scalar()
        or 0
    )
    wins_recent = int(
        db.query(func.count(NotificationLog.id))
        .filter(
            NotificationLog.audience == "admin",
            NotificationLog.kind == "game_won",
            NotificationLog.created_at >= since,
        )
        .scalar()
        or 0
    )

    avg_period_raw = (
        db.query(func.avg(GameProfile.period_index))
        .filter(GameProfile.is_active == 1)
        .scalar()
    )
    avg_period_index = round(float(avg_period_raw or 0), 1)

    game_started_recent = int(
        db.query(func.count(func.distinct(NotificationLog.game_profile_id)))
        .filter(
            NotificationLog.audience == "admin",
            NotificationLog.kind == "game_started",
            NotificationLog.created_at >= since,
        )
        .scalar()
        or 0
    )

    return {
        "window_days": window_days,
        "users_total": users_total,
        "users_recent": users_recent,
        "profiles_total": profiles_total,
        "profiles_active": profiles_active,
        "profiles_recent": profiles_recent,
        "users_with_profiles": int(users_with_profiles),
        "guidance_in_progress": guidance_in_progress,
        "guidance_completed_total": guidance_completed_total,
        "guidance_completed_recent": guidance_completed_recent,
        "wins_total": wins_total,
        "wins_recent": wins_recent,
        "avg_period_index_active": avg_period_index,
        "game_started_recent": game_started_recent,
    }
