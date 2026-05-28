"""Пул событий: ротация доменов и усталость по весу."""

import json

import pytest

from app.events.taxonomy import effective_event_weight, event_domain
from app.game.rules import EventProfileCounterSnapshot
from app.models import EventDefinition, GameProfile
from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.routers.events import _pick_diverse_period_events, ensure_period_events


@pytest.fixture()
def catalog(db_session):
    ensure_mvp11_event_catalog(db_session)
    return db_session


class TestEventTaxonomyPool:
    def test_pick_two_different_domains_when_possible(self, catalog):
        defs = (
            catalog.query(EventDefinition)
            .filter(
                EventDefinition.is_active == 1,
                EventDefinition.key.in_(
                    (
                        "mq11_groceries_discount",
                        "mq11_home_internet",
                        "mq11_family_money_request",
                    )
                ),
            )
            .all()
        )
        assert len(defs) >= 2
        domains = {event_domain(d) for d in defs}
        assert len(domains) >= 2

        picked = _pick_diverse_period_events(defs, 2, {})
        assert len(picked) == 2
        assert event_domain(picked[0]) != event_domain(picked[1])

    def test_fatigue_lowers_effective_weight(self, catalog):
        defn = (
            catalog.query(EventDefinition)
            .filter(EventDefinition.key == "mq11_groceries_discount")
            .first()
        )
        base = int(defn.weight)
        counter = EventProfileCounterSnapshot(times_selected=4, last_selected_period_index=1)
        assert effective_event_weight(defn, counter) < base

    def test_ensure_period_events_respects_active_flag(self, catalog):
        profile = GameProfile(
            user_id=1,
            name="refi-off",
            save_kind="game",
            is_active=1,
            period_index=3,
            cash_balance=100_000,
        )
        catalog.add(profile)
        catalog.commit()

        refi = (
            catalog.query(EventDefinition).filter(EventDefinition.key == "mq11_refinance_bank").first()
        )
        refi.is_active = 0
        refi.weight = 50_000
        catalog.commit()

        ensure_period_events(catalog, profile.id, 3, "game")
        from app.models import EventInstance

        rows = (
            catalog.query(EventDefinition.key)
            .join(EventInstance, EventInstance.definition_id == EventDefinition.id)
            .filter(
                EventInstance.game_profile_id == profile.id,
                EventInstance.period_index == 3,
            )
            .all()
        )
        keys = [r[0] for r in rows]
        assert "mq11_refinance_bank" not in keys


class TestConsumptionVariantsSeeded:
    def test_four_variant_defs_present(self, catalog):
        keys = (
            "mq11_coffee_takeaway",
            "mq11_clothing_clearance",
            "mq11_food_delivery_promo",
            "mq11_appliance_sale",
        )
        for key in keys:
            row = catalog.query(EventDefinition).filter(EventDefinition.key == key).first()
            assert row is not None, key
            assert row.is_active == 1
            meta = json.loads(row.metadata_json)
            assert meta.get("event_domain") == "consumption"


class TestFamilyMoneyChain:
    def test_refuse_schedules_callback_next_period(self, catalog):
        from app.events.chains import FAMILY_MONEY_CHAIN_KEY, ensure_scheduled_chain_events, get_active_chain
        from app.events.chains import schedule_event_chain

        profile = GameProfile(
            user_id=2,
            name="family",
            save_kind="game",
            is_active=1,
            period_index=2,
            cash_balance=80_000,
        )
        catalog.add(profile)
        catalog.commit()

        schedule_event_chain(
            catalog,
            profile,
            chain_key=FAMILY_MONEY_CHAIN_KEY,
            followup_definition_key="mq11_family_money_callback",
            after_periods=1,
            context={"branch": "refused_once"},
        )
        catalog.commit()

        chain = get_active_chain(catalog, profile.id, FAMILY_MONEY_CHAIN_KEY)
        assert chain is not None
        assert chain.due_period_index == 3

        created = ensure_scheduled_chain_events(catalog, profile.id, 3)
        assert created == 1

        defn = (
            catalog.query(EventDefinition)
            .filter(EventDefinition.key == "mq11_family_money_callback")
            .first()
        )
        meta = json.loads(defn.metadata_json)
        assert meta["interaction_kind"] == "chain_followup"
