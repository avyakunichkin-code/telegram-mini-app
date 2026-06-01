import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...models import GameProfile
from ...schemas import (
    GameProfileCreate,
    GameProfileResponse,
    OnboardingPatchRequest,
    OnboardingPatchResponse,
)
from .templates import validate_save_kind

logger = logging.getLogger(__name__)

_ONBOARDING_STATES = frozenset({"draft", "started", "brief_done"})
_ONBOARDING_STEPS = frozenset({"period_timer", "salary", "next_period", "safety_fund", "farewell"})


def list_game_profiles(db: Session, user_id: int) -> list[GameProfile]:
    return (
        db.query(GameProfile)
        .filter(GameProfile.user_id == user_id)
        .order_by(GameProfile.is_active.desc(), GameProfile.updated_at.desc(), GameProfile.id.desc())
        .all()
    )


def create_game_profile(db: Session, user_id: int, payload: GameProfileCreate) -> GameProfile:
    save_kind = validate_save_kind(payload.save_kind)
    profile_name = (payload.name or "").strip()
    if not profile_name:
        raise HTTPException(status_code=400, detail="name is required")

    has_any = db.query(GameProfile).filter(GameProfile.user_id == user_id).count() > 0
    if not has_any:
        db.query(GameProfile).filter(GameProfile.user_id == user_id).update({"is_active": 0})

    profile = GameProfile(
        user_id=user_id,
        name=profile_name,
        save_kind=save_kind,
        is_active=0 if has_any else 1,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    try:
        from ...admin.notify import notify_profile_created

        notify_profile_created(db, profile)
    except Exception:
        logger.warning("Admin notify failed for profile_created", exc_info=True)

    return profile


def patch_profile_onboarding(
    db: Session,
    user_id: int,
    payload: OnboardingPatchRequest,
) -> OnboardingPatchResponse:
    from ...admin.notify import (
        notify_onboarding_brief_done,
        notify_onboarding_skipped,
        notify_onboarding_step_reached,
    )
    from ...game.time import get_active_game_profile

    profile = get_active_game_profile(db, user_id)
    prev_step = str(getattr(profile, "onboarding_step", "period_timer") or "period_timer")
    prev_state = str(profile.onboarding_state or "draft")

    if payload.onboarding_skip_count is not None:
        skip = int(payload.onboarding_skip_count)
        if skip not in (1, 2):
            raise HTTPException(status_code=400, detail="onboarding_skip_count must be 1 or 2")
        notify_onboarding_skipped(
            db,
            profile,
            skip_count=skip,
            step=prev_step,
        )

    if payload.onboarding_state is not None:
        state = payload.onboarding_state.strip()
        if state not in _ONBOARDING_STATES:
            raise HTTPException(status_code=400, detail="Invalid onboarding_state")
        profile.onboarding_state = state

    if payload.onboarding_step is not None:
        step = payload.onboarding_step.strip()
        if step not in _ONBOARDING_STEPS:
            raise HTTPException(status_code=400, detail="Invalid onboarding_step")
        profile.onboarding_step = step

    db.commit()
    db.refresh(profile)

    new_step = str(getattr(profile, "onboarding_step", "period_timer") or "period_timer")
    new_state = str(profile.onboarding_state or "draft")

    if payload.onboarding_step is not None and new_step != prev_step:
        notify_onboarding_step_reached(
            db,
            profile,
            step=new_step,
            period_index=int(profile.period_index),
        )

    if new_state == "brief_done" and prev_state != "brief_done":
        notify_onboarding_brief_done(db, profile)

    return OnboardingPatchResponse(
        onboarding_state=new_state,
        onboarding_step=new_step,
    )


def activate_game_profile(db: Session, user_id: int, profile_id: int) -> dict:
    profile = (
        db.query(GameProfile)
        .filter(
            GameProfile.id == profile_id,
            GameProfile.user_id == user_id,
            GameProfile.is_archived == 0,
        )
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Game profile not found")

    db.query(GameProfile).filter(GameProfile.user_id == user_id).update({"is_active": 0})
    profile.is_active = 1
    db.commit()
    return {"status": "success", "active_profile_id": profile_id}
