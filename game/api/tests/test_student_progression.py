"""Лестница открытий студента, новые условия событий, эффект зарплаты (SPEC_student-progression)."""
from app.game.rules import EventPrerequisites, EventProfileContext, event_prerequisites_met
from app.starters.mechanics import BASIC_V1_MECHANICS, is_car_asset_kind
from app.victory.mechanics_progression import (
    DEFAULT_BASIC_UNLOCK,
    compute_mechanics_effective,
    next_unlock_period,
)

MET = {"tutorial_invest"}


def _open(period, met=MET):
    flags = compute_mechanics_effective(BASIC_V1_MECHANICS, DEFAULT_BASIC_UNLOCK, set(met), period)
    return {k for k, v in flags.items() if v and k.startswith("capital_") and k != "capital_flows"}


def test_start_opens_only_invest():
    assert _open(1, met=set()) == {"capital_invest"}


def test_ladder_requires_goal_even_late():
    assert _open(40, met=set()) == {"capital_invest"}


def test_ladder_opens_one_step_at_a_time():
    assert _open(5) == {"capital_invest"}
    assert _open(6) == {"capital_invest", "capital_insurance"}
    assert _open(12) == {"capital_invest", "capital_insurance", "capital_liabilities"}
    assert "capital_car" in _open(20) and "capital_property" not in _open(20)
    assert "capital_property" in _open(26) and "capital_mortgage" not in _open(26)
    assert "capital_mortgage" in _open(32)


def test_opened_step_stays_open_on_later_periods():
    for period in range(6, 41):
        assert "capital_insurance" in _open(period)


def test_next_unlock_period_waits_for_goal():
    assert next_unlock_period(DEFAULT_BASIC_UNLOCK, set(), 3) is None
    assert next_unlock_period(DEFAULT_BASIC_UNLOCK, MET, 3) == 6
    assert next_unlock_period(DEFAULT_BASIC_UNLOCK, MET, 12) == 20
    assert next_unlock_period(DEFAULT_BASIC_UNLOCK, MET, 32) is None


def test_car_kinds():
    assert is_car_asset_kind("car_personal") and is_car_asset_kind("car_taxi")
    assert not is_car_asset_kind("apt_1br") and not is_car_asset_kind(None)


def _ctx(period=1, opened=frozenset()):
    return EventProfileContext(
        active_asset_kinds=frozenset(),
        active_liability_count=0,
        active_liability_kinds=frozenset(),
        active_insurance_claim_keys=frozenset(),
        period_index=period,
        open_capital_mechanics=opened,
    )


def test_prerequisite_min_period():
    prereq = EventPrerequisites(min_period_index=8)
    assert not event_prerequisites_met(prereq, _ctx(period=7))
    assert event_prerequisites_met(prereq, _ctx(period=8))


def test_prerequisite_requires_open_mechanic():
    prereq = EventPrerequisites(requires_mechanics_all=frozenset({"capital_car"}))
    assert not event_prerequisites_met(prereq, _ctx())
    assert event_prerequisites_met(prereq, _ctx(opened=frozenset({"capital_car"})))


def _start(client, headers):
    res = client.post(
        "/api/game/start",
        headers=headers,
        json={"profile_name": "Ladder", "save_kind": "game", "template_key": "mq_game_basic_v1"},
    )
    assert res.status_code == 200


def test_locked_car_and_mortgage_rejected_by_api(client, auth_headers):
    _start(client, auth_headers)
    car = client.post("/api/finance/assets/from-template", headers=auth_headers, json={"key": "car_personal"})
    assert car.status_code == 403
    assert car.json()["detail"]["mechanic"] == "capital_car"
    mortgage = client.post(
        "/api/finance/acquisitions/secured",
        headers=auth_headers,
        json={"liability_key": "mortgage", "asset_key": "apt_1br"},
    )
    assert mortgage.status_code == 403


def test_overview_reports_locked_ladder(client, auth_headers):
    _start(client, auth_headers)
    body = client.get("/api/finance/overview", headers=auth_headers).json()
    assert body["mechanics"]["capital_car"] is True
    assert body["mechanics_effective"]["capital_car"] is False
    assert body["mechanics_next_unlock_period"] is None  # цель tutorial_invest ещё не выполнена
