"""Агрегация воронки O2 Progressive Guidance для Watchtower."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..guidance.curriculum import BEAT_BY_ID, CURRICULUM
from ..models import NotificationLog, User

GUIDANCE_FUNNEL_STEPS: list[tuple[str, str]] = [
    (beat.id, f"{beat.period_index}. {beat.title}")
    for beat in CURRICULUM
]


def _parse_progress(raw: str | None) -> dict[str, Any]:
    try:
        data = json.loads(raw or "{}")
    except json.JSONDecodeError:
        return {"completed_beats": []}
    if not isinstance(data, dict):
        return {"completed_beats": []}
    completed = data.get("completed_beats")
    if not isinstance(completed, list):
        completed = []
    return {
        "completed_beats": [str(x) for x in completed if str(x) in BEAT_BY_ID],
    }


def _current_beat_id(progress: dict[str, Any]) -> str | None:
    completed = set(progress.get("completed_beats") or [])
    for beat in CURRICULUM:
        if beat.id not in completed:
            return beat.id
    return None


def user_guidance_admin_fields(user: User) -> dict[str, Any]:
    completed = int(getattr(user, "guidance_completed", 0) or 0) == 1
    current_beat = None
    if not completed:
        current_beat = _current_beat_id(
            _parse_progress(getattr(user, "guidance_progress_json", None))
        )
    return {
        "guidance_completed": completed,
        "guidance_current_beat": current_beat,
    }


def build_onboarding_funnel(db: Session) -> dict[str, Any]:
    """Воронка O2: guidance на уровне user + legacy game_started в log."""
    users = db.query(User).all()

    guidance_completed_total = sum(
        1 for u in users if int(getattr(u, "guidance_completed", 0) or 0) == 1
    )
    in_progress_users: list[User] = [
        u
        for u in users
        if int(getattr(u, "guidance_completed", 0) or 0) == 0
    ]

    current_by_beat: dict[str, int] = {beat.id: 0 for beat in CURRICULUM}
    reached_by_beat: dict[str, int] = {beat.id: 0 for beat in CURRICULUM}

    for user in in_progress_users:
        progress = _parse_progress(getattr(user, "guidance_progress_json", None))
        for beat_id in progress.get("completed_beats") or []:
            if beat_id in reached_by_beat:
                reached_by_beat[beat_id] += 1
        current = _current_beat_id(progress)
        if current and current in current_by_beat:
            current_by_beat[current] += 1

    started_profiles = (
        db.query(func.count(func.distinct(NotificationLog.game_profile_id)))
        .filter(
            NotificationLog.audience == "admin",
            NotificationLog.kind == "game_started",
        )
        .scalar()
        or 0
    )

    steps = []
    for step_id, label in GUIDANCE_FUNNEL_STEPS:
        steps.append(
            {
                "step": step_id,
                "label": label,
                "current_count": int(current_by_beat.get(step_id, 0)),
                "reached_count": int(reached_by_beat.get(step_id, 0)),
            }
        )

    in_progress_total = len(in_progress_users)
    denom = max(int(started_profiles), guidance_completed_total + in_progress_total, 1)
    completion_rate = round(100.0 * guidance_completed_total / denom, 1)

    return {
        "started_profiles": int(started_profiles),
        "draft_profiles": in_progress_total,
        "brief_done_profiles": guidance_completed_total,
        "completion_rate_pct": completion_rate,
        "steps": steps,
        "guidance_mode": "o2",
    }
