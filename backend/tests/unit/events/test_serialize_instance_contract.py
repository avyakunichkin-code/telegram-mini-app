"""
Контракт сериализации pending-событий для FE (EventCard L3).

Техника: characterization + contract — фиксируем поля, без которых UI ломается
(event_domain, insurance_claim на choice).
"""

import json

import pytest

from app.events.taxonomy import build_metadata_json
from app.models import EventChoice, EventDefinition, EventInstance
from app.services.events.service import serialize_instance_rows
from tests.fixtures.game import create_auto_liability_policy, create_game_profile


pytestmark = pytest.mark.unit


def _event_with_choices(db, *, user_id: int, domain: str = "auto", with_insurance: bool = True):
    profile = create_game_profile(db, user_id=user_id)
    meta = json.dumps(
        build_metadata_json(event_domain=domain, scenario_shape="incident"),
        ensure_ascii=False,
    )
    definition = EventDefinition(
        key="test_serialize_dtp",
        mode="any",
        title="ДТП",
        description="Столкновение на парковке.",
        metadata_json=meta,
        is_active=1,
        weight=100,
    )
    db.add(definition)
    db.flush()

    effects = {"cash_delta": -5000}
    if with_insurance:
        effects["insurance_claim"] = {"kind": "auto_liability"}

    choice_insured = EventChoice(
        definition_id=definition.id,
        title="По полису",
        description="ОСАГО",
        effects_json=json.dumps(effects, ensure_ascii=False),
    )
    choice_cash = EventChoice(
        definition_id=definition.id,
        title="Из своих",
        effects_json=json.dumps({"cash_delta": -45000}, ensure_ascii=False),
    )
    db.add_all([choice_insured, choice_cash])
    db.flush()

    instance = EventInstance(
        game_profile_id=profile.id,
        definition_id=definition.id,
        period_index=profile.period_index,
        status="pending",
    )
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return profile, instance, choice_insured, choice_cash


class TestSerializeInstanceContract:
    def test_exposes_event_domain_for_fe_pill(self, db_session, test_user):
        profile, instance, *_ = _event_with_choices(db_session, user_id=test_user.id, domain="auto")

        rows = serialize_instance_rows(db_session, [instance], profile=profile)

        assert len(rows) == 1
        assert rows[0]["event_domain"] == "auto"
        assert rows[0]["title"] == "ДТП"
        assert rows[0]["description"] == "Столкновение на парковке."

    def test_insurance_choice_hidden_without_active_policy(self, db_session, test_user):
        """Выбор с insurance_claim не показываем, если полиса нет — FE не получит halo зря."""
        profile, instance, choice_insured, choice_cash = _event_with_choices(
            db_session, user_id=test_user.id
        )

        rows = serialize_instance_rows(db_session, [instance], profile=profile)
        choice_ids = {c["id"] for c in rows[0]["choices"]}

        assert choice_insured.id not in choice_ids
        assert choice_cash.id in choice_ids

    def test_insurance_choice_exposed_when_policy_exists(self, db_session, test_user):
        profile, instance, choice_insured, choice_cash = _event_with_choices(
            db_session, user_id=test_user.id
        )
        create_auto_liability_policy(db_session, profile.id)

        rows = serialize_instance_rows(db_session, [instance], profile=profile)
        by_id = {c["id"]: c for c in rows[0]["choices"]}

        assert by_id[choice_insured.id]["insurance_claim"] is True
        assert "effects_json" not in by_id[choice_insured.id]
        assert "insurance_claim" not in by_id[choice_cash.id]

    def test_consumption_domain_defaults_when_metadata_missing(self, db_session, test_user):
        profile = create_game_profile(db_session, user_id=test_user.id)
        definition = EventDefinition(
            key="test_no_meta",
            mode="any",
            title="Кофе",
            is_active=1,
            weight=1,
        )
        db_session.add(definition)
        db_session.flush()
        instance = EventInstance(
            game_profile_id=profile.id,
            definition_id=definition.id,
            period_index=profile.period_index,
            status="pending",
        )
        db_session.add(instance)
        db_session.commit()

        rows = serialize_instance_rows(db_session, [instance], profile=profile)

        assert rows[0]["event_domain"] == "consumption"
