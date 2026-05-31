"""Единый снимок состояния игры для Mini App (1 round-trip вместо 4)."""
from __future__ import annotations

from sqlalchemy.orm import Session

from ..finance.overview_build import build_finance_overview
from .time import get_seconds_until_next, sync_time
from ..models import GameProfile
from ..services.events.service import build_pending_events_payload
from ..services.period.status import build_period_status
from ..schemas import GameBootstrapResponse, PendingEventsPayload, TimeStatusResponse


def build_game_bootstrap(
    db: Session,
    profile: GameProfile,
    *,
    game_session_status: str = "active",
    defeat_reason: str | None = None,
    defeat_period_index: int | None = None,
) -> GameBootstrapResponse:
    sync_time(profile)
    db.commit()
    db.refresh(profile)

    overview = build_finance_overview(db, profile)
    period = build_period_status(db, profile)
    events_raw = (
        build_pending_events_payload(db, profile)
        if game_session_status == "active" and int(profile.is_active or 0) == 1
        else {"events": [], "event": None}
    )
    time = TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
    )
    return GameBootstrapResponse(
        overview=overview,
        time=time,
        period=period,
        events=PendingEventsPayload(**events_raw),
        game_session_status=game_session_status,
        defeat_reason=defeat_reason,
        defeat_period_index=defeat_period_index,
    )
