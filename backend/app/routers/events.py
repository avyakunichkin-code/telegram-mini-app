from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..events.constants import ALLOWED_EFFECT_KEYS, EVENTS_UNLOCK_INTRO_KEY
from ..game.rules import EVENTS_PER_PERIOD
from ..game.time import get_active_game_profile, sync_time
from ..models import GameProfile
from ..services.events import service as svc

# Re-export для тестов и legacy-импортов; prod-код — app.services.events.service.
build_pending_events_payload = svc.build_pending_events_payload
choose_event = svc.choose_event
ensure_period_events = svc.ensure_period_events
ensure_events_unlock_intro = svc.ensure_events_unlock_intro
expire_pending_events_for_closed_period = svc.expire_pending_events_for_closed_period
serialize_instance_rows = svc.serialize_instance_rows
record_event_profile_selection = svc.record_event_profile_selection
_ensure_seed_events = svc._ensure_seed_events
_pick_diverse_period_events = svc._pick_diverse_period_events
_period_pool_instance_count = svc._period_pool_instance_count
_needs_config_for_profile = svc._needs_config_for_profile
_needs_rescue_min_axis = svc._needs_rescue_min_axis
_order_events_recommended_first = svc._order_events_recommended_first

router = APIRouter(prefix="/api/game/events", tags=["events"])


@router.get("/pending")
async def get_pending_event(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    return build_pending_events_payload(db, profile)


@router.post("/{event_id}/choose")
async def choose_event_endpoint(
    event_id: int,
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    choice_id = payload.get("choice_id")
    if not choice_id:
        raise HTTPException(status_code=400, detail="choice_id is required")

    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    return choose_event(db, profile, event_id, int(choice_id))
