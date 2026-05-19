"""Агрегация воронки guided onboarding для Watchtower."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import GameProfile, NotificationLog

ONBOARDING_FUNNEL_STEPS: list[tuple[str, str]] = [
    ("period_timer", "1. Период и таймер"),
    ("salary", "2. Зарплата"),
    ("next_period", "3. Следующий период"),
    ("safety_fund", "4. Подушка"),
    ("farewell", "5. Финиш"),
]

_DRAFT_STATES = ("draft", "started")


def build_onboarding_funnel(db: Session) -> dict[str, Any]:
    draft_filter = GameProfile.onboarding_state.in_(_DRAFT_STATES)

    draft_total = (
        db.query(func.count(GameProfile.id)).filter(draft_filter).scalar() or 0
    )
    brief_done_total = (
        db.query(func.count(GameProfile.id))
        .filter(GameProfile.onboarding_state == "brief_done")
        .scalar()
        or 0
    )

    current_by_step: dict[str, int] = {
        str(step): int(cnt)
        for step, cnt in (
            db.query(GameProfile.onboarding_step, func.count(GameProfile.id))
            .filter(draft_filter)
            .group_by(GameProfile.onboarding_step)
            .all()
        )
    }

    reached_rows = (
        db.query(NotificationLog.game_profile_id, NotificationLog.payload_json)
        .filter(
            NotificationLog.audience == "admin",
            NotificationLog.kind == "onboarding_step_reached",
        )
        .all()
    )
    reached_by_step: dict[str, set[int]] = {s[0]: set() for s in ONBOARDING_FUNNEL_STEPS}
    for profile_id, raw in reached_rows:
        if profile_id is None:
            continue
        try:
            payload = json.loads(raw or "{}")
        except json.JSONDecodeError:
            continue
        step = payload.get("step")
        if step in reached_by_step:
            reached_by_step[step].add(int(profile_id))

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
    for step_id, label in ONBOARDING_FUNNEL_STEPS:
        current = int(current_by_step.get(step_id, 0))
        reached = len(reached_by_step.get(step_id, set()))
        steps.append(
            {
                "step": step_id,
                "label": label,
                "current_count": current,
                "reached_count": reached,
            }
        )

    denom = int(started_profiles) or max(int(draft_total) + int(brief_done_total), 1)
    completion_rate = round(100.0 * int(brief_done_total) / denom, 1)

    return {
        "started_profiles": int(started_profiles),
        "draft_profiles": int(draft_total),
        "brief_done_profiles": int(brief_done_total),
        "completion_rate_pct": completion_rate,
        "steps": steps,
    }
