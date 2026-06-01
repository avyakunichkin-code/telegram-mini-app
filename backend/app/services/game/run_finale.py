"""Use-cases финала партии (GE1)."""
from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...game.run_finale import build_run_finale_payload
from ...game.time import get_active_game_profile, resolve_game_session
from ...models import GameProfile, PlayerRunFeedback
from ...schemas import RunFeedbackRequest, RunFeedbackResponse, RunFinaleDismissResponse
from ...timeutil import utc_now_naive
from ...victory.profile import profile_win_reached


def dismiss_victory_finale(db: Session, user_id: int) -> RunFinaleDismissResponse:
    profile = get_active_game_profile(db, user_id)
    if not profile_win_reached(db, profile):
        raise HTTPException(status_code=400, detail="Victory not reached for active profile")
    profile.victory_finale_shown_at = utc_now_naive()
    db.commit()
    db.refresh(profile)
    return RunFinaleDismissResponse(
        status="success",
        victory_finale_shown_at=profile.victory_finale_shown_at,
    )


def submit_run_feedback(db: Session, user_id: int, payload: RunFeedbackRequest) -> RunFeedbackResponse:
    text = (payload.text or "").strip()
    if len(text) < 2:
        raise HTTPException(status_code=400, detail="text is too short")
    if len(text) > 2000:
        raise HTTPException(status_code=400, detail="text is too long")

    profile, session_status, defeat_reason, _ = resolve_game_session(db, user_id)
    outcome = (payload.outcome or "").strip().lower()
    if outcome not in ("victory", "defeat"):
        if session_status == "defeated":
            outcome = "defeat"
        elif profile_win_reached(db, profile):
            outcome = "victory"
        else:
            outcome = "defeat"

    row = PlayerRunFeedback(
        user_id=user_id,
        game_profile_id=profile.id,
        outcome=outcome,
        template_key=getattr(profile, "starter_template_key", None),
        period_index=int(profile.period_index or 0),
        defeat_reason=defeat_reason if outcome == "defeat" else None,
        comment=text,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return RunFeedbackResponse(status="success", id=row.id)
