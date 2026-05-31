from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game.bootstrap import build_game_bootstrap
from ..game.time import resolve_game_session
from ..schemas import (
    GameProfileCreate,
    GameProfileResponse,
    TimeConfigUpdate,
    TimeStatusResponse,
    GameStartRequest,
    GameStartResponse,
    GameStarterTemplatePublic,
    OnboardingPatchRequest,
    OnboardingPatchResponse,
    GameBootstrapResponse,
)
from ..services.game.profiles import (
    activate_game_profile as service_activate_game_profile,
    create_game_profile as service_create_game_profile,
    list_game_profiles as service_list_game_profiles,
    patch_profile_onboarding as service_patch_profile_onboarding,
)
from ..services.game.start import start_new_game as service_start_new_game
from ..services.game.templates import list_game_templates as service_list_game_templates
from ..services.game.time import (
    get_time_status as service_get_time_status,
    go_to_next_period as service_go_to_next_period,
    set_pause_mode as service_set_pause_mode,
    set_play_mode as service_set_play_mode,
    update_time_config as service_update_time_config,
)

router = APIRouter(prefix="/api/game", tags=["game"])


@router.get("/bootstrap", response_model=GameBootstrapResponse)
async def game_bootstrap(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Overview + time + period + events одним запросом (Mini App cold start / refresh)."""
    profile, session_status, defeat_reason, defeat_period_index = resolve_game_session(
        db, current_user.id
    )
    return build_game_bootstrap(
        db,
        profile,
        game_session_status=session_status,
        defeat_reason=defeat_reason,
        defeat_period_index=defeat_period_index,
    )


@router.get("/templates", response_model=list[GameStarterTemplatePublic])
async def list_game_templates(
    for_save_kind: Optional[str] = Query(
        None,
        description="Фильтр каталога: game | plan. Без параметра — только шаблоны Game.",
    ),
    db: Session = Depends(get_db),
):
    return service_list_game_templates(db, for_save_kind)


@router.get("/profiles", response_model=list[GameProfileResponse])
async def list_game_profiles(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_list_game_profiles(db, current_user.id)


@router.post("/profiles", response_model=GameProfileResponse)
async def create_game_profile(
    payload: GameProfileCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_create_game_profile(db, current_user.id, payload)


@router.patch("/profile/onboarding", response_model=OnboardingPatchResponse)
async def patch_profile_onboarding(
    payload: OnboardingPatchRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_patch_profile_onboarding(db, current_user.id, payload)


@router.post("/profiles/{profile_id}/activate")
async def activate_game_profile(
    profile_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_activate_game_profile(db, current_user.id, profile_id)


@router.post("/start", response_model=GameStartResponse)
async def start_new_game(
    payload: GameStartRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_start_new_game(db, current_user.id, payload)


@router.get("/time", response_model=TimeStatusResponse)
async def get_time_status(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_get_time_status(db, current_user.id)


@router.post("/time/play", response_model=TimeStatusResponse)
async def set_play_mode(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_set_play_mode(db, current_user.id)


@router.post("/time/pause", response_model=TimeStatusResponse)
async def set_pause_mode(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_set_pause_mode(db, current_user.id)


@router.post("/time/next", response_model=TimeStatusResponse)
async def go_to_next_period(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_go_to_next_period(db, current_user.id)


@router.put("/time/config", response_model=TimeStatusResponse)
async def update_time_config(
    payload: TimeConfigUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_update_time_config(db, current_user.id, payload)
