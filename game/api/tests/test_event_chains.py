"""Цепочки событий: подержанное авто (задаток → follow-up через 2 периода)."""

import json

import pytest

from app.events.chains import (
    USED_CAR_CHAIN_KEY,
    USED_CAR_DEPOSIT_AMOUNT,
    ensure_scheduled_chain_events,
    enrich_used_car_context,
    get_active_chain,
    resolve_car_deal_prices,
    schedule_event_chain,
)
from app.models import AssetTemplate, EventChoice, EventDefinition, EventInstance, FinanceAsset, GameProfile
from app.events.mvp11_seeds import ensure_mvp11_event_catalog


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


def _surface_used_car_deadline(db_session, profile, *, branch: str, deposit: float, discount: float):
    schedule_event_chain(
        db_session,
        profile,
        chain_key=USED_CAR_CHAIN_KEY,
        followup_definition_key="mq11_used_car_deadline",
        after_periods=1,
        context={
            "branch": branch,
            "deposit_amount": deposit,
            "template_key": "car_personal",
            "list_price": 1_000_000,
            "discount_rate": discount,
        },
    )
    db_session.commit()
    profile.period_index = int(profile.period_index) + 1
    db_session.commit()
    ensure_scheduled_chain_events(db_session, profile.id, int(profile.period_index))
    return (
        db_session.query(EventInstance)
        .filter(EventInstance.game_profile_id == profile.id, EventInstance.status == "pending")
        .one()
    )


def _choice_id(db_session, inst, *, action: str, branch: str) -> int:
    for ch in db_session.query(EventChoice).filter(EventChoice.definition_id == inst.definition_id).all():
        eff = json.loads(ch.effects_json or "{}")
        if eff.get("used_car_action") == action and eff.get("requires_chain_branch") == branch:
            return int(ch.id)
    raise AssertionError(f"no choice {action}/{branch}")


class TestUsedCarDealV2:
    """Разбор 2026-10-21: рынок 1 000 000, задаток → 750 000, «подумать» → 900 000, ветка автокредита."""

    @pytest.fixture()
    def pro_profile(self, db_session, test_user):
        from tests.fixtures.dl1_catalog import seed_dl1_catalog

        seed_dl1_catalog(db_session)
        ensure_mvp11_event_catalog(db_session)
        profile = GameProfile(
            user_id=test_user.id,
            name="used-car-v2",
            save_kind="game",
            starter_template_key="mq_game_tight_budget_v1",
            is_active=1,
            period_index=5,
            cash_balance=100_000,
        )
        db_session.add(profile)
        db_session.commit()
        return profile

    def test_list_price_override_sets_deal_prices(self, db_session, car_template):
        ctx = enrich_used_car_context(
            db_session,
            {"branch": "deposit", "deposit_amount": 50_000, "list_price": 1_000_000, "discount_rate": 0.25},
        )
        assert ctx["deal_price"] == 750_000
        assert ctx["remaining_cash_due"] == 700_000
        thinking = enrich_used_car_context(
            db_session, {"branch": "thinking", "list_price": 1_000_000, "discount_rate": 0.10}
        )
        assert thinking["deal_price"] == 900_000

    def test_deposit_loan_creates_car_at_market_value_and_auto_loan(self, db_session, pro_profile):
        from fincore.annuity import monthly_payment
        from app.models import FinanceLiability
        from app.services.events.choose import choose_event

        inst = _surface_used_car_deadline(db_session, pro_profile, branch="deposit", deposit=50_000, discount=0.25)
        choice = _choice_id(db_session, inst, action="complete_with_loan", branch="deposit")
        choose_event(db_session, pro_profile, inst.id, choice)
        db_session.refresh(pro_profile)

        assert pro_profile.cash_balance == pytest.approx(100_000)  # задаток списан на шаге 1, доплаты нет
        car = db_session.query(FinanceAsset).filter(FinanceAsset.game_profile_id == pro_profile.id).one()
        assert car.kind == "car_personal"
        assert car.asset_value == pytest.approx(1_000_000)  # рыночная, не цена сделки
        loan = db_session.query(FinanceLiability).filter(FinanceLiability.game_profile_id == pro_profile.id).one()
        assert loan.liability_kind == "auto_loan"
        assert loan.secured_asset_id == car.id
        assert loan.total_debt == pytest.approx(700_000)
        assert loan.annual_rate_percent == pytest.approx(14.0)
        assert loan.term_periods == 60
        assert loan.monthly_payment == pytest.approx(monthly_payment(700_000, 14.0, 60))
        assert get_active_chain(db_session, pro_profile.id, USED_CAR_CHAIN_KEY) is None

    def test_sell_right_after_loan_purchase_keeps_the_spread(self, db_session, pro_profile):
        from app.services.events.choose import choose_event
        from app.services.finance.asset_sale import sell_asset

        inst = _surface_used_car_deadline(db_session, pro_profile, branch="deposit", deposit=50_000, discount=0.25)
        choose_event(db_session, pro_profile, inst.id, _choice_id(db_session, inst, action="complete_with_loan", branch="deposit"))
        car = db_session.query(FinanceAsset).filter(FinanceAsset.game_profile_id == pro_profile.id).one()
        result = sell_asset(db_session, pro_profile, car.id)
        db_session.refresh(pro_profile)
        # Кредит 700 000 гасится из выручки 1 000 000 → +300 000 на счёт (минус задаток 50 000 = +250 000 за сделку).
        assert result["payoff"] == pytest.approx(700_000)
        assert pro_profile.cash_balance == pytest.approx(100_000 + 300_000)

    def test_thinking_cash_purchase_pays_900k_for_1m_car(self, db_session, pro_profile):
        from app.services.events.choose import choose_event

        pro_profile.cash_balance = 950_000
        db_session.commit()
        inst = _surface_used_car_deadline(db_session, pro_profile, branch="thinking", deposit=0, discount=0.10)
        choose_event(db_session, pro_profile, inst.id, _choice_id(db_session, inst, action="complete_purchase", branch="thinking"))
        db_session.refresh(pro_profile)
        assert pro_profile.cash_balance == pytest.approx(50_000)
        car = db_session.query(FinanceAsset).filter(FinanceAsset.game_profile_id == pro_profile.id).one()
        assert car.asset_value == pytest.approx(1_000_000)

    def test_loan_choice_preview_shows_market_value_and_payment(self, db_session, pro_profile):
        from app.services.events.payload import serialize_instance_rows

        inst = _surface_used_car_deadline(db_session, pro_profile, branch="deposit", deposit=50_000, discount=0.25)
        rows = serialize_instance_rows(db_session, [inst], profile=pro_profile)
        loan = next(c for c in rows[0]["choices"] if "автокредит" in c["title"])
        coin = next(i for i in loan["impacts"] if i["kind"] == "coin")
        assert coin["delta"] == pytest.approx(1_000_000)
        tips = [i.get("tip", "") for i in loan["impacts"]]
        assert any("Автокредит" in t and "700 000" in t for t in tips)
        assert not any(i["kind"] == "cash" for i in loan["impacts"])


class TestUsedCarCatalog:
    def test_offer_targets_personas_with_property_once_per_game(self):
        from app.events.mvp11_catalog import load_mvp11_catalog

        specs, _ = load_mvp11_catalog(force_reload=True)
        offer = next(s for s in specs if s["key"] == "mq11_used_car_offer")
        assert "mq_game_basic_v1" not in offer["audience_template_keys"]
        assert offer["repeat_policy"] == "once_per_profile"
        deposit = next(c for c in offer["choices"] if "задаток" in c["title"].lower())
        assert not deposit["effects"].get("needs_delta")  # задаток ничего не даёт до покупки
        ctxs = [c["effects"]["enqueue_event"]["context"] for c in offer["choices"] if c["effects"].get("enqueue_event")]
        discount = {ctx["branch"]: ctx["discount_rate"] for ctx in ctxs}
        assert discount["deposit"] > discount["thinking"]
