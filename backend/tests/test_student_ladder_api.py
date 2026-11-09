"""Лестница студента через API с настоящими флагами: что открыто и что ещё закрыто."""
import pytest

from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.models import EventDefinition, EventInstance, GameProfile
from app.routers.events import ensure_period_events
from app.seeds.capital_catalog import upsert_capital_asset_catalog, upsert_capital_liability_catalog
from app.starters.template_presentation import granted_capital_mechanics_from_blueprint
from app.victory.mechanics_progression import DEFAULT_BASIC_UNLOCK


@pytest.fixture()
def laddered(client, auth_headers, db_session):
    upsert_capital_asset_catalog(db_session)
    upsert_capital_liability_catalog(db_session)
    ensure_mvp11_event_catalog(db_session)
    db_session.commit()
    start = client.post(
        "/api/game/start",
        headers=auth_headers,
        json={"profile_name": "Ladder", "save_kind": "game", "template_key": "mq_game_basic_v1"},
    )
    assert start.status_code == 200
    assert client.post("/api/game/period/claim-salary", headers=auth_headers).status_code == 200
    safety = client.post("/api/game/period/contribute-to-safety-fund", headers=auth_headers, json={"amount": 2000})
    assert safety.status_code == 200
    assert client.post("/api/invest/bond/buy", headers=auth_headers, json={"amount": 1000}).status_code == 200
    profile = db_session.query(GameProfile).filter(GameProfile.save_kind == "game").one()
    profile.cash_balance = 5_000_000
    db_session.commit()
    return profile


def _at(db_session, profile, period):
    profile.period_index = period
    db_session.commit()


def _car(client, headers):
    return client.post(
        "/api/finance/acquisitions/secured",
        headers=headers,
        json={"liability_key": "car_loan", "asset_key": "car_personal", "down_payment": 200_000},
    )


def _mortgage(client, headers):
    return client.post(
        "/api/finance/acquisitions/secured",
        headers=headers,
        json={"liability_key": "mortgage", "asset_key": "apt_1br"},
    )


def test_car_loan_opens_on_turn_20(client, auth_headers, db_session, laddered):
    _at(db_session, laddered, 19)
    assert _car(client, auth_headers).status_code == 403
    _at(db_session, laddered, 20)
    assert _car(client, auth_headers).status_code == 200


def test_mortgage_opens_on_turn_32(client, auth_headers, db_session, laddered):
    _at(db_session, laddered, 26)
    assert _mortgage(client, auth_headers).status_code == 403
    _at(db_session, laddered, 32)
    assert _mortgage(client, auth_headers).status_code == 200


def test_free_form_asset_stays_closed_for_student(client, auth_headers, db_session, laddered):
    _at(db_session, laddered, 40)
    res = client.post(
        "/api/finance/assets",
        headers=auth_headers,
        json={"kind": "car_x", "asset_value": 0, "monthly_maintenance_cost": 0, "monthly_income": 1_000_000},
    )
    assert res.status_code == 403


def test_real_flags_surface_unlock_card(db_session, laddered):
    _at(db_session, laddered, 6)
    ensure_period_events(db_session, laddered.id, 6, "game")
    keys = {
        d.key
        for d in db_session.query(EventDefinition)
        .join(EventInstance, EventInstance.definition_id == EventDefinition.id)
        .filter(EventInstance.game_profile_id == laddered.id)
    }
    assert "mq11_student_unlock_insurance" in keys


def test_diploma_cannot_be_skipped(db_session, laddered):
    defn = db_session.query(EventDefinition).filter(EventDefinition.key == "mq11_student_diploma_offer").one()
    assert defn.mandatory_gate == "blocks_period_end"


def test_picker_promises_only_start_of_ladder():
    blueprint = {"mechanics": {"capital_invest": True, "capital_car": True}, "mechanics_unlock": DEFAULT_BASIC_UNLOCK}
    assert granted_capital_mechanics_from_blueprint(blueprint, "mq_game_basic_v1") == {"capital_invest"}
