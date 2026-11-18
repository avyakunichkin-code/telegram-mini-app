"""События: effect expense_line (E1-C)."""

from __future__ import annotations

import json

import pytest

from app.finance.expense_defaults import expense_budget_for_template
from app.finance.expenses import (
    compute_monthly_burn,
    ensure_expense_category_catalog,
    expire_expense_lines_for_period,
    seed_expense_lines_from_budget,
)
from app.models import EventChoice, EventDefinition, EventInstance, GameProfile, ProfileExpenseLine
from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.services.events.choose import choose_event
from app.services.events.payload import serialize_instance_rows


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


@pytest.mark.parametrize(
    ("key", "template", "choice_index", "term", "monthly"),
    [
        ("mq11_phone_tariff_student", "mq_game_basic_v1", 0, 3, 1100),
        ("mq11_phone_tariff_pro", "mq_game_tight_budget_v1", 0, 3, 1400),
        ("mq11_home_internet", "mq_game_basic_v1", 0, 4, 500),
        ("mq11_streaming_offer", "mq_game_basic_v1", 0, 4, 400),
        ("mq11_lifestyle_creep", "mq_game_basic_v1", 0, 4, 900),
        ("mq11_staff_retention_entrepreneur", "mq_game_debt_stack_v1", 1, 3, 8000),
        ("mq11_relocation_bonus", "mq_game_tight_budget_v1", 1, 6, 3000),
    ],
)
def test_trial_expense_matches_preview_and_ends_at_term(
    db_session, profile_with_lines, key, template, choice_index, term, monthly,
):
    ensure_mvp11_event_catalog(db_session)
    profile = profile_with_lines
    profile.starter_template_key = template
    start = profile.period_index
    definition = db_session.query(EventDefinition).filter_by(key=key).one()
    instance = EventInstance(
        game_profile_id=profile.id,
        definition_id=definition.id,
        period_index=start,
        status="pending",
    )
    db_session.add(instance)
    db_session.commit()

    payload = serialize_instance_rows(db_session, [instance], profile=profile)[0]
    choice = payload["choices"][choice_index]
    burn_impact = next(impact for impact in choice["impacts"] if impact["kind"] == "burn")
    assert burn_impact["delta"] == monthly
    before = float(compute_monthly_burn(db_session, profile).total)
    choose_event(db_session, profile, instance.id, choice["id"])
    assert float(compute_monthly_burn(db_session, profile).total) == before + monthly

    assert expire_expense_lines_for_period(db_session, profile, start + term - 1) == 0
    assert expire_expense_lines_for_period(db_session, profile, start + term) == 1
    assert float(compute_monthly_burn(db_session, profile).total) == before
