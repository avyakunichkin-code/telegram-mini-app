from copy import deepcopy

import pytest

from app.events.choice_snapshot import attach_event_instance_choice_snapshot, parse_choice_snapshot
from app.events.mandatory import pending_mandatory_blocking_event_titles
from app.events.mvp11_seeds import MVP11_EVENT_SPECS, _sync_mvp11_spec, ensure_mvp11_event_catalog
from app.finance.expenses import compute_monthly_burn, expire_expense_lines_for_period
from app.game.rules import EventProfileCounterSnapshot, is_event_definition_eligible
from app.models import EventChoice, EventDefinition, EventInstance, EventProfileChain, FinanceLiability, FinanceSalary
from app.services.events.choose import choose_event
from app.services.events.payload import serialize_instance_rows
from app.services.events.spawn import ensure_period_events
from tests.fixtures.game import create_game_profile


VACATION_KEY = "mq11_family_vacation_offer"
REST_TITLE = "Короткий отдых рядом с домом"
CARD_KEY = "mq11_card_minimum_entrepreneur"


def _pending_instance(db, profile, definition):
    instance = EventInstance(
        game_profile_id=profile.id,
        period_index=profile.period_index,
        definition_id=definition.id,
        status="pending",
    )
    db.add(instance)
    db.flush()
    attach_event_instance_choice_snapshot(db, profile, definition, instance)
    db.commit()
    return instance


def _choice_ids(db, definition):
    return [
        choice.id
        for choice in db.query(EventChoice).filter_by(definition_id=definition.id).order_by(EventChoice.id)
    ]


@pytest.mark.parametrize(
    ("template", "salary"),
    [("mq_game_debt_stack_v1", 200_000), ("mq_game_mortgage_stress_v1", 62_500)],
)
def test_local_rest_preview_matches_one_payment_without_followup(db_session, test_user, template, salary):
    ensure_mvp11_event_catalog(db_session)
    profile = create_game_profile(
        db_session, user_id=test_user.id, cash_balance=300_000, period_index=12, starter_template_key=template,
    )
    db_session.add(FinanceSalary(game_profile_id=profile.id, monthly_amount=salary))
    db_session.commit()

    definition = db_session.query(EventDefinition).filter_by(key=VACATION_KEY).one()
    instance = _pending_instance(db_session, profile, definition)
    payload = serialize_instance_rows(db_session, [instance], profile=profile)[0]
    choice = next(choice for choice in payload["choices"] if choice["title"] == REST_TITLE)
    cash = next(impact for impact in choice["impacts"] if impact["kind"] == "cash")
    expected = salary * 0.12
    assert cash["delta"] == pytest.approx(-expected)

    choose_event(db_session, profile, instance.id, choice["id"])
    db_session.refresh(profile)
    assert profile.cash_balance == pytest.approx(300_000 - expected)
    assert db_session.query(EventProfileChain).filter_by(game_profile_id=profile.id).count() == 0

    choose_event(db_session, profile, instance.id, choice["id"])
    db_session.refresh(profile)
    assert profile.cash_balance == pytest.approx(300_000 - expected)


def test_catalog_upgrade_keeps_old_vacation_choices_and_matching_description(db_session, test_user):
    ensure_mvp11_event_catalog(db_session)
    definition = db_session.query(EventDefinition).filter_by(key=VACATION_KEY).one()
    old_spec = deepcopy(next(spec for spec in MVP11_EVENT_SPECS if spec["key"] == VACATION_KEY))
    old_spec["choices"] = old_spec["choices"][:3]
    old_spec["description"] = old_spec["description"].split(REST_TITLE)[0].strip()
    _sync_mvp11_spec(db_session, old_spec, definition)
    db_session.commit()
    old_ids = _choice_ids(db_session, definition)
    assert len(old_ids) == 3
    profile = create_game_profile(
        db_session, user_id=test_user.id, period_index=12, starter_template_key="mq_game_debt_stack_v1",
    )
    old_instance = _pending_instance(db_session, profile, definition)

    ensure_mvp11_event_catalog(db_session)
    new_ids = _choice_ids(db_session, definition)
    assert new_ids[:3] == old_ids and len(new_ids) == 4
    assert parse_choice_snapshot(old_instance) == set(old_ids)
    old_payload = serialize_instance_rows(db_session, [old_instance], profile=profile)[0]
    assert all(choice["title"] != REST_TITLE for choice in old_payload["choices"])
    assert old_payload["description"] == old_spec["description"]

    new_instance = _pending_instance(db_session, profile, definition)
    assert parse_choice_snapshot(new_instance) == set(new_ids)
    ensure_mvp11_event_catalog(db_session)
    assert _choice_ids(db_session, definition) == new_ids


def test_card_story_deactivation_preserves_pending_choices_and_prevents_new_spawns(db_session, test_user, monkeypatch):
    ensure_mvp11_event_catalog(db_session)
    card = db_session.query(EventDefinition).filter_by(key=CARD_KEY).one()
    assert card.is_active == 0
    ids = _choice_ids(db_session, card)
    assert len(ids) == 3
    profile = create_game_profile(
        db_session, user_id=test_user.id, cash_balance=500_000,
        period_index=3, starter_template_key="mq_game_debt_stack_v1",
    )
    db_session.add(FinanceLiability(
        game_profile_id=profile.id, title="Card", total_debt=150_000, annual_rate_percent=24,
        monthly_payment=3_000, liability_kind="consumer", payment_mode="interest_only",
    ))
    card.is_active = 1
    old_instance = _pending_instance(db_session, profile, card)

    ensure_mvp11_event_catalog(db_session)
    db_session.refresh(card)
    assert card.is_active == 0
    assert _choice_ids(db_session, card) == ids
    payload = serialize_instance_rows(db_session, [old_instance], profile=profile)[0]
    assert {choice["id"] for choice in payload["choices"]} == set(ids)

    # If the active filter is dropped, this weight wins under equal draws.
    card.weight = 50_000
    profile.period_index = 4
    db_session.commit()
    monkeypatch.setattr("app.services.events.selection.random.random", lambda: 0.5)
    ensure_period_events(db_session, profile.id, 4, "game")
    assert db_session.query(EventInstance).filter_by(game_profile_id=profile.id, definition_id=card.id).count() == 1


def test_course_can_repeat_six_periods_after_last_selection(db_session):
    ensure_mvp11_event_catalog(db_session)
    course = db_session.query(EventDefinition).filter_by(key="mq11_evening_course").one()
    counter = EventProfileCounterSnapshot(times_selected=1, last_selected_period_index=11)
    eligibility = dict(
        repeat_policy=course.repeat_policy,
        repeat_max=course.repeat_max,
        cooldown_periods=course.cooldown_periods,
        counter=counter,
    )
    assert not is_event_definition_eligible(current_period_index=16, **eligibility)
    assert is_event_definition_eligible(current_period_index=17, **eligibility)


@pytest.mark.parametrize("issued_before_upgrade", [False, True])
def test_flood_can_be_resolved_without_cash_or_policy(db_session, test_user, issued_before_upgrade):
    ensure_mvp11_event_catalog(db_session)
    key = "mq11_home_water_damage"
    definition = db_session.query(EventDefinition).filter_by(key=key).one()
    profile = create_game_profile(db_session, user_id=test_user.id, cash_balance=1000, period_index=21)
    if issued_before_upgrade:
        original = deepcopy(next(spec for spec in MVP11_EVENT_SPECS if spec["key"] == key))
        original["choices"] = original["choices"][:2]
        _sync_mvp11_spec(db_session, original, definition)
        db_session.commit()
    instance = _pending_instance(db_session, profile, definition)
    ensure_mvp11_event_catalog(db_session)

    assert pending_mandatory_blocking_event_titles(db_session, profile.id, 21)
    payload = serialize_instance_rows(db_session, [instance], profile=profile)[0]
    assert [choice["title"] for choice in payload["choices"]] == [
        "Ремонт за свой счёт", "Восстанавливать жильё поэтапно",
    ]
    option = payload["choices"][1]
    assert not any(impact["kind"] == "cash" for impact in option["impacts"])
    before = compute_monthly_burn(db_session, profile).total
    choose_event(db_session, profile, instance.id, option["id"])
    assert profile.cash_balance == 1000
    assert not pending_mandatory_blocking_event_titles(db_session, profile.id, 21)
    assert compute_monthly_burn(db_session, profile).total == before + 15_000
    assert expire_expense_lines_for_period(db_session, profile, 26) == 0
    assert expire_expense_lines_for_period(db_session, profile, 27) == 1
    assert compute_monthly_burn(db_session, profile).total == before
