"""Продуктовая воронка Watchtower (PLT-101): register → профиль → закрытия периодов → исход."""

from __future__ import annotations

import statistics
from datetime import timedelta
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import GameProfile, PeriodEconomyClosing, User
from ..timeutil import utc_now_naive

_VALID_SAVE_KINDS = frozenset({"game", "plan"})


def _normalize_save_kind(save_kind: str | None) -> str | None:
    raw = str(save_kind or "").strip().lower()
    if raw in _VALID_SAVE_KINDS:
        return raw
    return None


def _cohort_profiles_query(db: Session, since, *, save_kind: str | None = None):
    query = db.query(GameProfile.id).filter(GameProfile.created_at >= since)
    sk = _normalize_save_kind(save_kind)
    if sk:
        query = query.filter(GameProfile.save_kind == sk)
    return query


def _close_counts_for_profile_ids(db: Session, profile_ids: list[int]) -> dict[int, int]:
    if not profile_ids:
        return {}
    rows = (
        db.query(
            PeriodEconomyClosing.game_profile_id,
            func.count(PeriodEconomyClosing.id),
        )
        .filter(PeriodEconomyClosing.game_profile_id.in_(profile_ids))
        .group_by(PeriodEconomyClosing.game_profile_id)
        .all()
    )
    return {int(pid): int(cnt) for pid, cnt in rows}


def _activation_from_profile_ids(
    db: Session,
    profile_ids: list[int],
) -> dict[str, Any]:
    if not profile_ids:
        return {
            "profiles_cohort": 0,
            "profiles_with_close": 0,
            "pct_ge5_closes": 0.0,
            "pct_ge8_closes": 0.0,
            "median_closes": None,
        }

    close_map = _close_counts_for_profile_ids(db, profile_ids)
    closes = [close_map.get(pid, 0) for pid in profile_ids]
    played = [n for n in closes if n >= 1]
    cohort_n = len(profile_ids)

    def pct_at_least(threshold: int) -> float:
        if cohort_n == 0:
            return 0.0
        return round(100.0 * sum(1 for n in closes if n >= threshold) / cohort_n, 1)

    median = round(float(statistics.median(played)), 1) if played else None

    return {
        "profiles_cohort": cohort_n,
        "profiles_with_close": len(played),
        "pct_ge5_closes": pct_at_least(5),
        "pct_ge8_closes": pct_at_least(8),
        "median_closes": median,
    }


def _milestone_steps(
    db: Session,
    *,
    since,
    save_kind: str | None,
    profile_ids: list[int],
) -> list[dict[str, Any]]:
    users_recent = int(
        db.query(func.count(User.id)).filter(User.created_at >= since).scalar() or 0
    )
    profiles_started = len(profile_ids)

    close_map = _close_counts_for_profile_ids(db, profile_ids)
    closes = [close_map.get(pid, 0) for pid in profile_ids]

    outcome_q = db.query(GameProfile).filter(GameProfile.id.in_(profile_ids)) if profile_ids else None
    victories = 0
    defeats = 0
    if outcome_q is not None:
        victories = int(
            outcome_q.filter(GameProfile.run_outcome == "victory").count()
        )
        defeats = int(
            outcome_q.filter(GameProfile.run_outcome == "defeat").count()
        )

    def count_closes(min_n: int) -> int:
        return sum(1 for n in closes if n >= min_n)

    base = profiles_started or 1

    return [
        {
            "step": "users_registered",
            "label": "Регистрации",
            "count": users_recent,
            "rate_pct": None,
        },
        {
            "step": "profiles_started",
            "label": "Старт профиля",
            "count": profiles_started,
            "rate_pct": round(100.0 * profiles_started / users_recent, 1) if users_recent else None,
        },
        {
            "step": "period_1",
            "label": "≥1 закрытый период",
            "count": count_closes(1),
            "rate_pct": round(100.0 * count_closes(1) / base, 1),
        },
        {
            "step": "period_3",
            "label": "≥3 периода",
            "count": count_closes(3),
            "rate_pct": round(100.0 * count_closes(3) / base, 1),
        },
        {
            "step": "period_5",
            "label": "≥5 периодов (PA-A1)",
            "count": count_closes(5),
            "rate_pct": round(100.0 * count_closes(5) / base, 1),
        },
        {
            "step": "period_8",
            "label": "≥8 периодов (PA-A1s)",
            "count": count_closes(8),
            "rate_pct": round(100.0 * count_closes(8) / base, 1),
        },
        {
            "step": "victory",
            "label": "Победа",
            "count": victories,
            "rate_pct": round(100.0 * victories / base, 1),
        },
        {
            "step": "defeat",
            "label": "Поражение",
            "count": defeats,
            "rate_pct": round(100.0 * defeats / base, 1),
        },
    ]


def _segment_summary(db: Session, *, since, save_kind: str) -> dict[str, Any]:
    profile_ids = [int(row[0]) for row in _cohort_profiles_query(db, since, save_kind=save_kind).all()]
    activation = _activation_from_profile_ids(db, profile_ids)
    profiles_total = int(
        db.query(func.count(GameProfile.id))
        .filter(GameProfile.save_kind == save_kind)
        .scalar()
        or 0
    )
    return {
        "save_kind": save_kind,
        "profiles_total": profiles_total,
        "profiles_recent": activation["profiles_cohort"],
        "activation": activation,
    }


def build_product_funnel(
    db: Session,
    *,
    days: int = 7,
    save_kind: str | None = None,
) -> dict[str, Any]:
    window_days = max(1, min(int(days or 7), 90))
    since = utc_now_naive() - timedelta(days=window_days)
    sk = _normalize_save_kind(save_kind)

    profile_ids = [int(row[0]) for row in _cohort_profiles_query(db, since, save_kind=sk).all()]
    activation = _activation_from_profile_ids(db, profile_ids)
    steps = _milestone_steps(db, since=since, save_kind=sk, profile_ids=profile_ids)

    by_save_kind = [_segment_summary(db, since=since, save_kind=kind) for kind in ("game", "plan")]

    return {
        "window_days": window_days,
        "save_kind": sk,
        "steps": steps,
        "activation": activation,
        "by_save_kind": by_save_kind,
    }
