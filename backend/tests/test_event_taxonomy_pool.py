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
                        "mq11_family_vacation_offer",
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
    def test_consumption_variant_defs_present(self, catalog):
        """Канон: generic coffee выключен; student/pro + три общих consumption-события."""
        keys = (
            "mq11_coffee_takeaway_student",
            "mq11_coffee_takeaway_pro",
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

        legacy = catalog.query(EventDefinition).filter(EventDefinition.key == "mq11_coffee_takeaway").first()
        assert legacy is not None
        assert legacy.is_active == 0


class TestFamilyMoneyRetired:
    def test_family_money_events_inactive(self, catalog):
        """Снята PO 2026-10-21 (замена — family_vacation); строки в БД гасятся, а не удаляются."""
        for key in ("mq11_family_money_request", "mq11_family_money_callback"):
            row = catalog.query(EventDefinition).filter(EventDefinition.key == key).first()
            assert row is not None, key
            assert row.is_active == 0, key
