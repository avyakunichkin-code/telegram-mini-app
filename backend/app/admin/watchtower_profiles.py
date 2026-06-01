"""Запросы и строки профилей для Admin Watchtower (AQ-01, AQ-02)."""

from __future__ import annotations

from typing import Any

from sqlalchemy import or_
from sqlalchemy.orm import Query, Session

from ..models import GameProfile, User
from .onboarding_funnel import user_guidance_admin_fields
from .stuck_scan import profile_stuck_kind

RUN_OUTCOME_LABEL_RU = {
    "victory": "Победа",
    "defeat": "Поражение",
}


def run_outcome_label(outcome: str | None) -> str | None:
    raw = str(outcome or "").strip()
    if not raw:
        return None
    return RUN_OUTCOME_LABEL_RU.get(raw, raw)


def profile_rows_query(
    db: Session,
    *,
    q: str = "",
    profile_filter: str = "",
    user_id: int | None = None,
) -> Query:
    query = db.query(GameProfile, User).join(User, User.id == GameProfile.user_id)

    if user_id is not None:
        query = query.filter(GameProfile.user_id == int(user_id))

    needle = (q or "").strip()
    if needle:
        like = f"%{needle}%"
        query = query.filter(
            or_(
                User.username.ilike(like),
                GameProfile.name.ilike(like),
            )
        )

    filt = (profile_filter or "").strip().lower()
    if filt == "defeat":
        query = query.filter(GameProfile.run_outcome == "defeat")
    elif filt == "victory":
        query = query.filter(GameProfile.run_outcome == "victory")
    elif filt == "guidance_draft":
        query = query.filter(User.guidance_completed == 0)
    # stuck — после scan_stuck_and_emit, см. fetch_profile_rows

    return query.order_by(GameProfile.updated_at.desc())


def build_admin_profile_row(profile: GameProfile, user: User) -> dict[str, Any]:
    outcome = str(getattr(profile, "run_outcome", "") or "").strip() or None
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "username": user.username,
        "name": profile.name,
        "save_kind": profile.save_kind,
        "starter_template_key": profile.starter_template_key,
        "is_active": bool(profile.is_active),
        "is_archived": bool(getattr(profile, "is_archived", 0)),
        "run_outcome": outcome,
        "run_outcome_label": run_outcome_label(outcome),
        "period_index": int(profile.period_index or 1),
        "cash_balance": round(float(profile.cash_balance or 0), 2),
        "onboarding_state": str(getattr(profile, "onboarding_state", "brief_done") or "brief_done"),
        "onboarding_step": str(getattr(profile, "onboarding_step", "farewell") or "farewell"),
        **user_guidance_admin_fields(user),
        "created_at": profile.created_at,
        "updated_at": profile.updated_at,
        "stuck_kind": profile_stuck_kind(profile, user),
    }


def fetch_profile_rows(
    db: Session,
    *,
    limit: int = 50,
    q: str = "",
    profile_filter: str = "",
    stuck_only: bool = False,
    user_id: int | None = None,
) -> list[tuple[GameProfile, User]]:
    filt = (profile_filter or "").strip().lower()
    if stuck_only and not filt:
        filt = "stuck"

    query = profile_rows_query(
        db,
        q=q,
        profile_filter=filt if filt != "stuck" else "",
        user_id=user_id,
    )
    fetch_limit = limit
    if filt == "stuck":
        fetch_limit = min(max(limit * 5, limit), 500)

    rows = query.limit(fetch_limit).all()
    if filt != "stuck":
        return rows

    stuck_rows = [
        (profile, user)
        for profile, user in rows
        if profile_stuck_kind(profile, user) is not None
    ]
    return stuck_rows[:limit]
