"""Последние комментарии с экрана финала партии (GE1-FB) для Watchtower."""
from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import GameProfile, PlayerRunFeedback, User

OUTCOME_LABEL_RU = {
    "victory": "Победа",
    "defeat": "Поражение",
}


def build_run_feedback_rows(db: Session, *, limit: int = 50) -> list[dict]:
    rows = (
        db.query(PlayerRunFeedback, User, GameProfile)
        .join(User, User.id == PlayerRunFeedback.user_id)
        .join(GameProfile, GameProfile.id == PlayerRunFeedback.game_profile_id)
        .order_by(PlayerRunFeedback.id.desc())
        .limit(limit)
        .all()
    )
    out: list[dict] = []
    for fb, user, profile in rows:
        outcome = str(fb.outcome or "")
        comment = str(fb.comment or "").strip()
        preview = comment if len(comment) <= 120 else f"{comment[:117]}…"
        out.append(
            {
                "id": fb.id,
                "user_id": fb.user_id,
                "username": user.username,
                "game_profile_id": fb.game_profile_id,
                "profile_name": profile.name,
                "outcome": outcome,
                "outcome_label": OUTCOME_LABEL_RU.get(outcome, outcome or "—"),
                "template_key": fb.template_key,
                "period_index": int(fb.period_index or 0),
                "defeat_reason": fb.defeat_reason,
                "comment": comment,
                "comment_preview": preview,
                "created_at": fb.created_at,
            }
        )
    return out
