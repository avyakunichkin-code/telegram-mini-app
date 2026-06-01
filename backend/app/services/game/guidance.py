from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...guidance.engine import build_guidance_overview, patch_guidance
from ...models import User
from ...schemas import GuidanceOverview, GuidancePatchRequest, GuidancePatchResponse
from ...game.time import get_active_game_profile


def get_guidance(db: Session, user_id: int) -> GuidanceOverview:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    profile = get_active_game_profile(db, user_id)
    data = build_guidance_overview(db, user, profile)
    return GuidanceOverview(**data)


def patch_user_guidance(db: Session, user_id: int, payload: GuidancePatchRequest) -> GuidancePatchResponse:
    try:
        data = patch_guidance(
            db,
            user_id,
            action=payload.action.strip(),
            beat_id=payload.beat_id,
            view_index=payload.view_index,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    return GuidancePatchResponse(guidance=GuidanceOverview(**data))
