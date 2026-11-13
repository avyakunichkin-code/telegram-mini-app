"""Цепочки перестройки активов A1–A3 (PO 2026-10-22): вторая машина, подушка/КАСКО, рефинансирование.

Проходим цепочки реальным выбором события (choose_event): деньги, активы и долги после каждого шага.
"""

from __future__ import annotations

import json

import pytest

from app.events.chains import (
    CAR_CUSHION_CHAIN_KEY,
    REFINANCE_CHAIN_KEY,
    SECOND_CAR_CHAIN_KEY,
    ensure_scheduled_chain_events,
    get_active_chain,
)
from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from fincore.annuity import monthly_payment
from app.game.rules import EventProfileContext, event_prerequisites_met, parse_event_prerequisites_json
from app.models import (
    EventChoice,
    EventDefinition,
    EventInstance,
    FinanceAsset,
    FinanceLiability,
    FinanceSalary,
    GameProfile,
    InsurancePolicy,
)

SALARY = 200_000
CAR_VALUE = 1_200_000


@pytest.fixture()
def entrepreneur(db_session, test_user):
    """Как Предприниматель: две машины, ипотека 3,8 млн (13,5%, 240 пер.), карта 150 000 под 24%."""
    ensure_mvp11_event_catalog(db_session)
    profile = GameProfile(
        user_id=test_user.id,
        name="assets",
        save_kind="game",
        starter_template_key="mq_game_debt_stack_v1",
        is_active=1,
        period_index=10,
        cash_balance=100_000,
        safety_fund_balance=0,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.add(FinanceSalary(game_profile_id=profile.id, monthly_amount=SALARY))
    home = FinanceAsset(game_profile_id=profile.id, title="Квартира", kind="home", asset_value=10_000_000,
                        monthly_maintenance_cost=30_000, is_active=1)
    db_session.add(home)
    for title in ("Автомобиль", "Второй автомобиль"):
        db_session.add(FinanceAsset(game_profile_id=profile.id, title=title, kind="car_personal",
                                    asset_value=CAR_VALUE, monthly_maintenance_cost=18_000, is_active=1))
    db_session.flush()
    db_session.add(FinanceLiability(
        game_profile_id=profile.id, title="Ипотека", total_debt=3_800_000, original_principal=3_800_000,
        annual_rate_percent=13.5, monthly_payment=monthly_payment(3_800_000, 13.5, 240),
        liability_kind="mortgage", secured_asset_id=home.id, term_periods=240, periods_paid=0,
        payment_mode="annuity", is_active=1,
    ))
    db_session.add(FinanceLiability(
        game_profile_id=profile.id, title="Кредитная карта", total_debt=150_000, original_principal=150_000,
        annual_rate_percent=24, monthly_payment=3_000, liability_kind="consumer",
        payment_mode="interest_only", is_active=1,
    ))
    db_session.commit()
    return profile


def _offer(db_session, profile, key: str) -> EventInstance:
    defn = db_session.query(EventDefinition).filter(EventDefinition.key == key).one()
    inst = EventInstance(game_profile_id=profile.id, period_index=profile.period_index,
                         definition_id=defn.id, status="pending")
    db_session.add(inst)
    db_session.commit()
    return inst


def _rows(db_session, profile, inst):
    from app.services.events.payload import serialize_instance_rows

    return serialize_instance_rows(db_session, [inst], profile=profile)[0]["choices"]


def _choose(db_session, profile, inst, title_part: str) -> None:
    from app.services.events.choose import choose_event

    visible = _rows(db_session, profile, inst)
    choice = next(c for c in visible if title_part in c["title"])
    choose_event(db_session, profile, inst.id, int(choice["id"]))
    db_session.refresh(profile)


def _next(db_session, profile, periods: int) -> EventInstance:
    profile.period_index = int(profile.period_index) + periods
    db_session.commit()
    ensure_scheduled_chain_events(db_session, profile.id, int(profile.period_index))
    return (
        db_session.query(EventInstance)
        .filter(EventInstance.game_profile_id == profile.id, EventInstance.status == "pending",
                EventInstance.period_index == profile.period_index)
        .one()
    )


def _key(db_session, inst) -> str:
    return db_session.get(EventDefinition, inst.definition_id).key


def _active(db_session, model, profile, **filters):
    q = db_session.query(model).filter(model.game_profile_id == profile.id, model.is_active == 1)
    for k, v in filters.items():
        q = q.filter(getattr(model, k) == v)
    return q.all()


class TestSecondCarChain:
    def test_offer_needs_two_cars(self):
        prereq = parse_event_prerequisites_json(json.dumps({"min_assets_of_kind": {"car_personal": 2}}))
        base = dict(active_asset_kinds=frozenset({"car_personal"}), active_liability_count=0,
                    active_liability_kinds=frozenset(), active_insurance_claim_keys=frozenset())
        one = EventProfileContext(**base, active_asset_kind_counts=(("car_personal", 1),))
        two = EventProfileContext(**base, active_asset_kind_counts=(("car_personal", 2),))
        assert not event_prerequisites_met(prereq, one)
        assert event_prerequisites_met(prereq, two)

    def test_quick_sale_then_debts_frees_cashflow(self, db_session, entrepreneur):
        mortgage = _active(db_session, FinanceLiability, entrepreneur, liability_kind="mortgage")[0]
        old_payment = float(mortgage.monthly_payment)

        offer = _offer(db_session, entrepreneur, "mq11_second_car_offer")
        quick = next(c for c in _rows(db_session, entrepreneur, offer) if "перекупщику" in c["title"])
        assert any(i["kind"] == "cash" and i["delta"] == pytest.approx(0.9 * CAR_VALUE) for i in quick["impacts"])
        _choose(db_session, entrepreneur, offer, "перекупщику")
        assert entrepreneur.cash_balance == pytest.approx(100_000 + 0.9 * CAR_VALUE)
        assert len(_active(db_session, FinanceAsset, entrepreneur, kind="car_personal")) == 1

        proceeds = _next(db_session, entrepreneur, 1)
        assert _key(db_session, proceeds) == "mq11_second_car_proceeds"
        _choose(db_session, entrepreneur, proceeds, "дорогие долги")

        # Карта (24%) закрыта целиком, остаток выручки — досрочно в ипотеку.
        assert not _active(db_session, FinanceLiability, entrepreneur, liability_kind="consumer")
        db_session.refresh(mortgage)
        assert mortgage.total_debt == pytest.approx(3_800_000 - (0.9 * CAR_VALUE - 150_000))
        assert mortgage.monthly_payment == pytest.approx(monthly_payment(mortgage.total_debt, 13.5, 240))
        assert mortgage.monthly_payment < old_payment
        assert entrepreneur.cash_balance == pytest.approx(100_000)

        epilogue = _next(db_session, entrepreneur, 3)
        visible = _rows(db_session, entrepreneur, epilogue)
        assert len(visible) == 1 and "закрыли дорогие долги" in visible[0]["description"]
        _choose(db_session, entrepreneur, epilogue, "Понятно")
        assert get_active_chain(db_session, entrepreneur.id, SECOND_CAR_CHAIN_KEY) is None

    def test_hold_price_sells_later_at_97_percent(self, db_session, entrepreneur):
        _choose(db_session, entrepreneur, _offer(db_session, entrepreneur, "mq11_second_car_offer"), "Выставить")
        bargain = _next(db_session, entrepreneur, 2)
        _choose(db_session, entrepreneur, bargain, "Держать цену")
        late = _next(db_session, entrepreneur, 2)
        assert _key(db_session, late) == "mq11_second_car_sold_late"
        _choose(db_session, entrepreneur, late, "Продать за 97%")
        assert entrepreneur.cash_balance == pytest.approx(100_000 + 0.97 * CAR_VALUE)

        proceeds = _next(db_session, entrepreneur, 1)
        _choose(db_session, entrepreneur, proceeds, "подушку")
        assert entrepreneur.safety_fund_balance == pytest.approx(0.97 * CAR_VALUE)
        assert entrepreneur.cash_balance == pytest.approx(100_000)


class TestRefinanceChain:
    def test_rate_cut_charges_fee_and_lowers_payment(self, db_session, entrepreneur):
        entrepreneur.cash_balance = 300_000
        db_session.commit()
        offer = _offer(db_session, entrepreneur, "mq11_refinance_offer")
        _choose(db_session, entrepreneur, offer, "Снизить ставку")
        mortgage = _active(db_session, FinanceLiability, entrepreneur, liability_kind="mortgage")[0]
        assert mortgage.annual_rate_percent == pytest.approx(10.5)
        assert mortgage.monthly_payment == pytest.approx(monthly_payment(3_800_000, 10.5, 240))
        assert entrepreneur.cash_balance == pytest.approx(300_000 - 0.02 * 3_800_000)

        freed = _next(db_session, entrepreneur, 2)
        assert _key(db_session, freed) == "mq11_refinance_freed"
        _choose(db_session, entrepreneur, freed, "Гасить досрочно")
        db_session.refresh(mortgage)
        assert mortgage.total_debt == pytest.approx(3_800_000 - 0.2 * SALARY)
        assert get_active_chain(db_session, entrepreneur.id, REFINANCE_CHAIN_KEY) is not None

        epilogue = _next(db_session, entrepreneur, 4)
        visible = _rows(db_session, entrepreneur, epilogue)
        assert len(visible) == 1 and "снизили ставку и гасили досрочно" in visible[0]["description"]
        _choose(db_session, entrepreneur, epilogue, "Понятно")
        assert get_active_chain(db_session, entrepreneur.id, REFINANCE_CHAIN_KEY) is None

    def test_term_extension_lowers_payment_but_raises_overpayment(self, db_session, entrepreneur):
        mortgage = _active(db_session, FinanceLiability, entrepreneur, liability_kind="mortgage")[0]
        before_payment = float(mortgage.monthly_payment)
        before_total = before_payment * 240

        offer = _offer(db_session, entrepreneur, "mq11_refinance_offer")
        term = next(c for c in _rows(db_session, entrepreneur, offer) if "Растянуть" in c["title"])
        assert any("264 пер." in i.get("tip", "") for i in term["impacts"])
        _choose(db_session, entrepreneur, offer, "Растянуть")
        db_session.refresh(mortgage)
        assert mortgage.term_periods == 264
        assert entrepreneur.cash_balance == pytest.approx(100_000)  # без комиссии
        assert mortgage.monthly_payment < before_payment
        assert mortgage.monthly_payment * 264 > before_total


class TestCarCushionChain:
    def test_kasko_pays_for_the_accident(self, db_session, entrepreneur):
        _choose(db_session, entrepreneur, _offer(db_session, entrepreneur, "mq11_car_cushion_offer"), "КАСКО")
        assert entrepreneur.cash_balance == pytest.approx(100_000 - 0.03 * SALARY)
        policy = _active(db_session, InsurancePolicy, entrepreneur)[0]
        assert policy.kind == "auto_property" and policy.payout_amount == pytest.approx(0.6 * SALARY)

        accident = _next(db_session, entrepreneur, 3)
        assert _key(db_session, accident) == "mq11_car_cushion_accident"
        assert {c["title"] for c in _rows(db_session, entrepreneur, accident)} == {
            "Оплатить по КАСКО",
            "Оплатить из своих, полис сберечь",
        }
        cash_before = float(entrepreneur.cash_balance)
        _choose(db_session, entrepreneur, accident, "по КАСКО")
        assert entrepreneur.cash_balance == pytest.approx(cash_before)  # выплата = ремонт
        db_session.refresh(policy)
        assert policy.claimed_period_index is not None

    def test_no_preparation_card_debt_keeps_cash_but_adds_interest(self, db_session, entrepreneur):
        _choose(db_session, entrepreneur, _offer(db_session, entrepreneur, "mq11_car_cushion_offer"), "не случится")
        accident = _next(db_session, entrepreneur, 3)
        _choose(db_session, entrepreneur, accident, "кредитку")
        assert entrepreneur.cash_balance == pytest.approx(100_000)
        card = [li for li in _active(db_session, FinanceLiability, entrepreneur) if "ремонт" in li.title]
        assert card and card[0].total_debt == pytest.approx(0.6 * SALARY)
        assert card[0].monthly_payment == pytest.approx(0.6 * SALARY * 0.22 / 12)

    def test_cushion_absorbs_repair_without_debt(self, db_session, entrepreneur):
        entrepreneur.cash_balance = 200_000
        db_session.commit()
        _choose(db_session, entrepreneur, _offer(db_session, entrepreneur, "mq11_car_cushion_offer"), "подушку")
        assert entrepreneur.safety_fund_balance == pytest.approx(0.3 * SALARY)
        accident = _next(db_session, entrepreneur, 3)
        _choose(db_session, entrepreneur, accident, "из подушки")
        assert entrepreneur.safety_fund_balance == pytest.approx(0)
        assert entrepreneur.cash_balance == pytest.approx(200_000 - 0.6 * SALARY)
        assert get_active_chain(db_session, entrepreneur.id, CAR_CUSHION_CHAIN_KEY) is not None
