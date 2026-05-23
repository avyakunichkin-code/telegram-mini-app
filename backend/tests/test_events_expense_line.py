"""События: effect expense_line (E1-C)."""

from __future__ import annotations

import json

import pytest

from app.expense_template_defaults import expense_budget_for_template
from app.expenses import compute_monthly_burn, ensure_expense_category_catalog, seed_expense_lines_from_budget
from app.models import EventChoice, EventDefinition, EventInstance, GameProfile, ProfileExpenseLine
from app.mvp11_event_seeds import ensure_mvp11_event_catalog


@pytest.fixture()
def profile_with_lines(db_session, test_user):
    ensure_expense_category_catalog(db_session)
    profile = GameProfile(
        user_id=test_user.id,
        name="Event burn",
        save_kind="game",
        starter_template_key="mq_game_basic_v1",
        base_monthly_lifestyle_expense=37500.0,
        is_active=1,
        period_index=2,
        cash_balance=50000,
    )
    db_session.query(GameProfile).filter(GameProfile.user_id == test_user.id).update({"is_active": 0})
    profile.is_active = 1
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    budget = expense_budget_for_template("mq_game_basic_v1", 37500.0, {})
    seed_expense_lines_from_budget(db_session, profile, budget, period_index=1)
    db_session.commit()
    return profile


def test_choose_event_expense_line(client, auth_headers, db_session, profile_with_lines):
    ensure_mvp11_event_catalog(db_session)
    ed = db_session.query(EventDefinition).filter(EventDefinition.key == "mq11_streaming_offer").first()
    assert ed is not None
    choice = (
        db_session.query(EventChoice)
        .filter(EventChoice.definition_id == ed.id, EventChoice.title.like("Один сервис%"))
        .first()
    )
    assert choice is not None

    inst = EventInstance(
        game_profile_id=profile_with_lines.id,
        definition_id=ed.id,
        period_index=profile_with_lines.period_index,
        status="pending",
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)

    before = float(compute_monthly_burn(db_session, profile_with_lines).total)

    r = client.post(
        f"/api/game/events/{inst.id}/choose",
        headers=auth_headers,
        json={"choice_id": choice.id},
    )
    assert r.status_code == 200

    db_session.refresh(profile_with_lines)
    after = float(compute_monthly_burn(db_session, profile_with_lines).total)
    assert after >= before + 399

    event_lines = (
        db_session.query(ProfileExpenseLine)
        .filter(
            ProfileExpenseLine.game_profile_id == profile_with_lines.id,
            ProfileExpenseLine.source_kind == "event",
        )
        .all()
    )
    assert len(event_lines) >= 1
    assert any(l.category_key == "communications" for l in event_lines)
