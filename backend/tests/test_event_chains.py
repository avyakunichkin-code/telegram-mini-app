"""Цепочки событий: подержанное авто (задаток → follow-up через 2 периода)."""

import json

import pytest

from app.event_chains import (
    USED_CAR_CHAIN_KEY,
    USED_CAR_DEPOSIT_AMOUNT,
    ensure_scheduled_chain_events,
    enrich_used_car_context,
    get_active_chain,
    resolve_car_deal_prices,
    schedule_event_chain,
)
from app.models import AssetTemplate, EventChoice, EventDefinition, EventInstance, FinanceAsset, GameProfile
from app.mvp11_event_seeds import ensure_mvp11_event_catalog


@pytest.fixture()
def car_template(db_session):
    existing = (
        db_session.query(AssetTemplate).filter(AssetTemplate.template_key == "car_personal").first()
    )
    if existing:
        return existing
    tpl = AssetTemplate(
        template_key="car_personal",
        title="Личная машина",
        kind="car_personal",
        asset_value=1_200_000,
        monthly_maintenance_cost=12_000,
        monthly_income=0,
        is_active=1,
        sort_order=30,
    )
    db_session.add(tpl)
    db_session.commit()
    return tpl


class TestUsedCarChain:
    def test_deal_price_25_percent_off(self, db_session, car_template):
        list_price, deal = resolve_car_deal_prices(
            db_session, template_key="car_personal", discount_rate=0.25
        )
        assert list_price == 1_200_000
        assert deal == 900_000

    def test_schedule_and_surface_followup(self, db_session, car_template):
        ensure_mvp11_event_catalog(db_session)
        profile = GameProfile(
            user_id=1,
            name="car-chain",
            save_kind="game",
            is_active=1,
            level=3,
            period_index=1,
            cash_balance=200_000,
        )
        db_session.add(profile)
        db_session.commit()

        schedule_event_chain(
            db_session,
            profile,
            chain_key=USED_CAR_CHAIN_KEY,
            followup_definition_key="mq11_used_car_deadline",
            after_periods=2,
            context={
                "branch": "deposit",
                "deposit_amount": USED_CAR_DEPOSIT_AMOUNT,
                "template_key": "car_personal",
                "discount_rate": 0.25,
            },
        )
        db_session.commit()

        chain = get_active_chain(db_session, profile.id, USED_CAR_CHAIN_KEY)
        assert chain is not None
        assert chain.due_period_index == 3

        ctx = enrich_used_car_context(db_session, json.loads(chain.context_json))
        assert ctx["remaining_cash_due"] == pytest.approx(900_000 - 50_000)

        created = ensure_scheduled_chain_events(db_session, profile.id, 3)
        assert created == 1

        inst = (
            db_session.query(EventInstance)
            .filter(
                EventInstance.game_profile_id == profile.id,
                EventInstance.period_index == 3,
                EventInstance.status == "pending",
            )
            .first()
        )
        assert inst is not None
        defn = db_session.query(EventDefinition).filter(EventDefinition.id == inst.definition_id).first()
        assert defn.key == "mq11_used_car_deadline"

    def test_offer_hidden_when_car_owned(self, db_session, car_template):
        ensure_mvp11_event_catalog(db_session)
        profile = GameProfile(
            user_id=1,
            name="has-car",
            save_kind="game",
            is_active=1,
            level=3,
            period_index=2,
        )
        db_session.add(profile)
        db_session.commit()
        db_session.add(
            FinanceAsset(
                game_profile_id=profile.id,
                title="Машина",
                kind="car_personal",
                asset_value=1_000_000,
                is_active=1,
            )
        )
        db_session.commit()

        from app.routers.events import ensure_period_events

        offer = db_session.query(EventDefinition).filter(EventDefinition.key == "mq11_used_car_offer").first()
        offer.weight = 10_000
        for row in db_session.query(EventDefinition).filter(EventDefinition.is_active == 1).all():
            if row.key not in ("mq11_used_car_offer",):
                row.is_active = 0
        db_session.commit()

        ensure_period_events(db_session, profile.id, 2, "game")
        instances = (
            db_session.query(EventInstance)
            .filter(EventInstance.game_profile_id == profile.id, EventInstance.period_index == 2)
            .all()
        )
        assert offer.id not in {i.definition_id for i in instances}
