"""Unit-тесты validate_game_start_request."""

import pytest
from fastapi import HTTPException

from app.game_start_validation import validate_game_start_request
from app.models import GameStarterTemplate
from app.schemas import GameStartRequest


def test_validate_requires_template_for_game(db_session):
    with pytest.raises(HTTPException) as exc:
        validate_game_start_request(
            GameStartRequest(profile_name="X", save_kind="game"),
            db_session,
        )
    assert exc.value.status_code == 400


def test_validate_template_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        validate_game_start_request(
            GameStartRequest(
                profile_name="X",
                save_kind="game",
                template_key="nope",
            ),
            db_session,
        )
    assert exc.value.status_code == 404


def test_validate_ok_with_seeded_template(db_session):
    db_session.add(
        GameStarterTemplate(
            template_key="mq_game_basic_v1",
            title="t",
            difficulty_rank=1,
            base_monthly_lifestyle_expense=0,
            blueprint_json="{}",
            victory_config_json="{}",
            is_active=1,
            sort_order=1,
        )
    )
    db_session.commit()
    validate_game_start_request(
        GameStartRequest(
            profile_name="OK",
            save_kind="game",
            template_key="mq_game_basic_v1",
        ),
        db_session,
    )
