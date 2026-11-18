"""Voluntary questionnaire; no financial rules or finale outcomes are modified."""
import json

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ...game.session import PLAN_REMOVED_DETAIL
from ...models import GameProfile, PeriodEconomyClosing, PlayerPlaytestSurvey, User
from ...schemas import PlaytestSurveyState, PlaytestSurveySubmit
from ...timeutil import utc_now_naive

SURVEY_KEY = "first_turns_v2"


def survey_profile(db: Session, user_id: int, profile_id: int) -> GameProfile:
    profile = db.query(GameProfile).filter(GameProfile.id == profile_id, GameProfile.user_id == user_id).first()
    if profile is None:
        raise HTTPException(404, "Партия не найдена")
    if profile.save_kind != "game":
        raise HTTPException(410, PLAN_REMOVED_DETAIL)
    if not profile.starter_template_key:
        raise HTTPException(404, "Сначала начни партию")
    return profile


def _row(db: Session, user_id: int, survey_key: str):
    return db.query(PlayerPlaytestSurvey).filter_by(user_id=user_id, survey_key=survey_key).first()


def _closed(db: Session, profile: GameProfile) -> int:
    return int(db.query(func.count(PeriodEconomyClosing.id)).filter_by(game_profile_id=profile.id).scalar() or 0)


def survey_state(db: Session, profile: GameProfile, survey_key: str = SURVEY_KEY) -> PlaytestSurveyState | None:
    if profile.save_kind != "game" or not profile.starter_template_key:
        return None
    row = _row(db, profile.user_id, survey_key)
    state = row.state if row else "pending"
    closed = _closed(db, profile)
    return PlaytestSurveyState(survey_key=survey_key, profile_id=profile.id, state=state, closed_turns=closed,
                              should_offer=closed >= 5 and state == "pending",
                              can_submit=state != "submitted", response_id=row.id if row else None)


def save_survey(db: Session, user_id: int, profile_id: int, payload: PlaytestSurveySubmit | None, *, survey_key="first_turns_v1", _retried=False):
    # Lock the account, including the no-row-yet case. UNIQUE is the final DB invariant.
    db.query(User).filter_by(id=user_id).with_for_update().one()
    profile = survey_profile(db, user_id, profile_id)
    survey_key = payload.survey_key if payload else survey_key
    row = _row(db, user_id, survey_key)
    if row and row.state == "submitted":
        if payload and (row.game_profile_id != profile_id or json.loads(row.answers_json) != payload.answers.model_dump()
                        or row.comment != payload.comment):
            raise HTTPException(409, "Ответ уже отправлен")
        return survey_state(db, profile, survey_key)
    closed_turns = _closed(db, profile)
    if row is None:
        row = PlayerPlaytestSurvey(user_id=user_id, survey_key=survey_key, game_profile_id=profile_id)
        db.add(row)
    row.game_profile_id = profile_id
    row.template_key = profile.starter_template_key
    row.period_index = int(profile.period_index or 1)
    row.closed_turns = closed_turns
    if payload is None:
        row.state = "dismissed"
        row.dismissed_at = row.dismissed_at or utc_now_naive()
    else:
        row.state = "submitted"
        row.answers_json = json.dumps(payload.answers.model_dump(), ensure_ascii=False, sort_keys=True)
        row.comment = payload.comment
        row.submitted_at = utc_now_naive()
    try:
        db.commit()
    except IntegrityError:
        # SQLite has no FOR UPDATE; a simultaneous first insert can win UNIQUE.
        db.rollback()
        if _retried or _row(db, user_id, survey_key) is None:
            raise
        return save_survey(db, user_id, profile_id, payload, survey_key=survey_key, _retried=True)
    return survey_state(db, profile, survey_key)


def admin_survey_rows(db: Session, limit: int) -> list[dict]:
    rows = db.query(PlayerPlaytestSurvey).filter_by(state="submitted").order_by(
        PlayerPlaytestSurvey.submitted_at.desc(), PlayerPlaytestSurvey.id.desc()).limit(limit).all()
    return [dict(id=r.id, survey_key=r.survey_key, game_profile_id=r.game_profile_id,
                 template_key=r.template_key, period_index=r.period_index, closed_turns=r.closed_turns,
                 answers=json.loads(r.answers_json), comment=r.comment, submitted_at=r.submitted_at) for r in rows]
