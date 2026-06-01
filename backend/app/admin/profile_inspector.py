"""Детальная карточка профиля для Admin Watchtower (A3)."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from ..models import GameProfile, NotificationLog, PeriodEconomyClosing, PlayerRunFeedback, User
from .run_feedback import OUTCOME_LABEL_RU
from ..victory.profile import profile_win_reached
from .notify_messages import format_alert_message_ru, kind_label_ru
from .onboarding_funnel import _parse_progress, user_guidance_admin_fields


def _guidance_completed_beats(user: User) -> list[str]:
    progress = _parse_progress(getattr(user, "guidance_progress_json", None))
    return list(progress.get("completed_beats") or [])


def build_profile_inspector(
    db: Session,
    profile_id: int,
    *,
    log_limit: int = 50,
    closing_limit: int = 12,
) -> dict[str, Any] | None:
    row = (
        db.query(GameProfile, User)
        .join(User, User.id == GameProfile.user_id)
        .filter(GameProfile.id == profile_id)
        .first()
    )
    if row is None:
        return None

    profile, user = row
    guidance = user_guidance_admin_fields(user)

    closings = (
        db.query(PeriodEconomyClosing)
        .filter(PeriodEconomyClosing.game_profile_id == profile.id)
        .order_by(PeriodEconomyClosing.period_index.desc())
        .limit(closing_limit)
        .all()
    )

    logs = (
        db.query(NotificationLog)
        .filter(NotificationLog.game_profile_id == profile.id)
        .order_by(NotificationLog.id.desc())
        .limit(log_limit)
        .all()
    )

    win_reached = False
    try:
        win_reached = profile_win_reached(db, profile)
    except Exception:
        win_reached = False

    latest_feedback = (
        db.query(PlayerRunFeedback)
        .filter(PlayerRunFeedback.game_profile_id == profile.id)
        .order_by(PlayerRunFeedback.id.desc())
        .first()
    )
    latest_run_feedback = None
    if latest_feedback is not None:
        outcome = str(latest_feedback.outcome or "")
        comment = str(latest_feedback.comment or "").strip()
        latest_run_feedback = {
            "id": latest_feedback.id,
            "outcome": outcome,
            "outcome_label": OUTCOME_LABEL_RU.get(outcome, outcome or "—"),
            "template_key": latest_feedback.template_key,
            "period_index": int(latest_feedback.period_index or 0),
            "defeat_reason": latest_feedback.defeat_reason,
            "comment": comment,
            "created_at": latest_feedback.created_at,
        }

    return {
        "profile": {
            "id": profile.id,
            "user_id": profile.user_id,
            "username": user.username,
            "name": profile.name,
            "save_kind": profile.save_kind,
            "starter_template_key": profile.starter_template_key,
            "is_active": bool(profile.is_active),
            "is_archived": bool(getattr(profile, "is_archived", 0)),
            "period_index": int(profile.period_index or 1),
            "time_state": str(profile.time_state or "pause"),
            "cash_balance": round(float(profile.cash_balance or 0), 2),
            "safety_fund_balance": round(float(profile.safety_fund_balance or 0), 2),
            "negative_periods_count": int(profile.negative_periods_count or 0),
            "clean_period_streak": int(profile.clean_period_streak or 0),
            "onboarding_state": str(getattr(profile, "onboarding_state", "") or ""),
            "onboarding_step": str(getattr(profile, "onboarding_step", "") or ""),
            "period_duration_seconds": int(profile.period_duration_seconds or 0),
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
            **guidance,
            "guidance_completed_beats": _guidance_completed_beats(user),
        },
        "user": {
            "id": user.id,
            "username": user.username,
            "telegram_id": user.telegram_id,
            "guidance_completed_at": getattr(user, "guidance_completed_at", None),
        },
        "economy": {
            "win_reached": win_reached,
        },
        "period_closings": [
            {
                "period_index": int(c.period_index),
                "cash_balance": round(float(c.cash_balance or 0), 2),
                "safety_fund_balance": round(float(c.safety_fund_balance or 0), 2),
                "total_overdue_amount": round(float(c.total_overdue_amount or 0), 2),
                "monthly_burn_total": round(float(c.monthly_burn_total or 0), 2),
                "period_income_rate": round(float(c.period_income_rate or 0), 2),
                "period_expense_total": round(float(c.period_expense_total or 0), 2),
                "total_debt_balance": round(float(c.total_debt_balance or 0), 2),
                "closed_at": c.closed_at,
            }
            for c in closings
        ],
        "activity_log": [
            _activity_log_row(log)
            for log in logs
        ],
        "latest_run_feedback": latest_run_feedback,
    }


def _activity_log_row(log: NotificationLog) -> dict[str, Any]:
    payload = _parse_payload_raw(log.payload_json)
    return {
        "id": log.id,
        "audience": log.audience,
        "kind": log.kind,
        "kind_label": kind_label_ru(log.kind),
        "summary": format_alert_message_ru(log.kind, payload),
        "payload": payload,
        "telegram_sent": bool(log.telegram_sent),
        "created_at": log.created_at,
    }


def _parse_payload_raw(raw: str | None) -> dict[str, Any]:
    try:
        data = json.loads(raw or "{}")
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}
