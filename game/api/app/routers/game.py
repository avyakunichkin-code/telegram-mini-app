from typing import Optional, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game.bootstrap import build_game_bootstrap
from ..game.presence import touch_last_seen
from ..game.session import resolve_game_session
from ..schemas import (
    GameProfileCreate,
    GameProfileResponse,
    TimeStatusResponse,
    GameStartRequest,
    GameStartResponse,
    GameStarterTemplatePublic,
    OnboardingPatchRequest,
    OnboardingPatchResponse,
    GameBootstrapResponse,
    GuidancePatchRequest,
    GuidancePatchResponse,
    GuidanceOverview,
    RunFinaleDismissResponse,
    RunFeedbackRequest,
    RunFeedbackResponse,
)
from ..services.game.profiles import (
    activate_game_profile as service_activate_game_profile,
    create_game_profile as service_create_game_profile,
    list_game_profiles as service_list_game_profiles,
    patch_profile_onboarding as service_patch_profile_onboarding,
)
from ..services.game.start import start_new_game as service_start_new_game
from ..services.game.guidance import get_guidance as service_get_guidance, patch_user_guidance as service_patch_guidance
from ..services.game.templates import list_game_templates as service_list_game_templates
from ..services.game.run_finale import (
    dismiss_victory_finale as service_dismiss_victory_finale,
    submit_run_feedback as service_submit_run_feedback,
)
from ..services.period.close import go_to_next_period as service_go_to_next_period
from ..schemas import PlaytestSurveyIdentity, PlaytestSurveyState, PlaytestSurveySubmit
from ..services.game.playtest_survey import survey_profile, survey_state, save_survey

router = APIRouter(prefix="/api/game", tags=["game"])


@router.get("/playtest-survey", response_model=PlaytestSurveyState)
def get_playtest_survey(profile_id: int = Query(..., gt=0), survey_key: Literal["first_turns_v1", "first_turns_v2"] = "first_turns_v1",
                       current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return survey_state(db, survey_profile(db, current_user.id, profile_id), survey_key)


@router.post("/playtest-survey/dismiss", response_model=PlaytestSurveyState)
def dismiss_playtest_survey(payload: PlaytestSurveyIdentity, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return save_survey(db, current_user.id, payload.profile_id, None, survey_key=payload.survey_key)


@router.post("/playtest-survey", response_model=PlaytestSurveyState)
def submit_playtest_survey(payload: PlaytestSurveySubmit, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return save_survey(db, current_user.id, payload.profile_id, payload)


@router.get("/bootstrap", response_model=GameBootstrapResponse)
def game_bootstrap(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    survey_key: Literal["first_turns_v1", "first_turns_v2"] = "first_turns_v1",
):
    """Overview + time + period + events одним запросом (Mini App cold start / refresh)."""
    # Заход считаем до открытия партии: 410 на старом сохранении — тоже визит.
    touch_last_seen(db, current_user)
    profile, session_status, defeat_reason, defeat_period_index = resolve_game_session(
        db, current_user.id
    )
    return build_game_bootstrap(
        db,
        profile,
        game_session_status=session_status,
        defeat_reason=defeat_reason,
        defeat_period_index=defeat_period_index,
        survey_key=survey_key,
    )


@router.post("/run-finale/dismiss", response_model=RunFinaleDismissResponse)
def dismiss_run_finale(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_dismiss_victory_finale(db, current_user.id)


@router.post("/run-feedback", response_model=RunFeedbackResponse)
def post_run_feedback(
    payload: RunFeedbackRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_submit_run_feedback(db, current_user.id, payload)


@router.get("/templates", response_model=list[GameStarterTemplatePublic])
def list_game_templates(
    for_save_kind: Optional[str] = Query(
        None,
        description="Фильтр каталога: game. Без параметра — только шаблоны Game.",
    ),
    db: Session = Depends(get_db),
):
    return service_list_game_templates(db, for_save_kind)


@router.get("/profiles", response_model=list[GameProfileResponse])
def list_game_profiles(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_list_game_profiles(db, current_user.id)


@router.post("/profiles", response_model=GameProfileResponse)
def create_game_profile(
    payload: GameProfileCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_create_game_profile(db, current_user.id, payload)


@router.patch("/profile/onboarding", response_model=OnboardingPatchResponse)
def patch_profile_onboarding(
    payload: OnboardingPatchRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_patch_profile_onboarding(db, current_user.id, payload)


@router.get("/guidance", response_model=GuidanceOverview)
def get_game_guidance(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_get_guidance(db, current_user.id)


@router.patch("/guidance", response_model=GuidancePatchResponse)
def patch_game_guidance(
    payload: GuidancePatchRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_patch_guidance(db, current_user.id, payload)


@router.post("/guidance/replay")
def replay_game_guidance(
    current_user=Depends(get_current_user),
):
    raise HTTPException(status_code=501, detail="Guidance replay is not available in O2")


@router.post("/profiles/{profile_id}/activate")
def activate_game_profile(
    profile_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_activate_game_profile(db, current_user.id, profile_id)


@router.post("/start", response_model=GameStartResponse)
def start_new_game(
    payload: GameStartRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service_start_new_game(db, current_user.id, payload)


@router.post("/guest-start", response_model=GameStartResponse)
def start_or_resume_guest(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_guest:
        raise HTTPException(403, "Guest identity required")
    return service_start_new_game(db, current_user.id, GameStartRequest(
        profile_name="Моя история", save_kind="game", template_key="mq_game_basic_v1",
    ), resume_guest=True)


@router.post("/time/next", response_model=TimeStatusResponse)
def go_to_next_period(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """«Завершить ход» (TB1). Real-time таймера нет: play/pause/config удалены."""
    return service_go_to_next_period(db, current_user.id)
