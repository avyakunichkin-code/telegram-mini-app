"""Цепочка mq11_family_vacation_* (B3, PO 2026-10-21): копить дешевле, чем отдыхать в кредит."""

import json

import pytest

from app.events.chains import (
    FAMILY_VACATION_CHAIN_KEY,
    CHAIN_FOLLOWUP_EXCLUDE_FROM_RANDOM_POOL,
    ensure_scheduled_chain_events,
    get_active_chain,
)
from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.models import EventChoice, EventDefinition, EventInstance, FinanceSalary, GameProfile

SALARY = 150_000


def _specs() -> dict[str, dict]:
    from app.events.mvp11_catalog import load_mvp11_catalog

    specs, _ = load_mvp11_catalog(force_reload=True)
    return {s["key"]: s for s in specs if s["key"].startswith("mq11_family_vacation_")}


def _pct(spec: dict, title_part: str) -> float:
    ch = next(c for c in spec["choices"] if title_part in c["title"])
    return float(ch["effects"].get("cash_pct_salary") or 0)


class TestFamilyVacationCatalog:
    def test_saving_is_cheaper_than_credit_for_same_needs(self):
        s = _specs()
        save = _pct(s["mq11_family_vacation_trip"], "ранней брони")
        card_full = _pct(s["mq11_family_vacation_card_bill"], "сразу")
        card_split = _pct(s["mq11_family_vacation_card_bill"], "частями") + _pct(
            s["mq11_family_vacation_card_tail"], "Понятно"
        )
        assert save < card_full < card_split

        card_needs = next(c for c in s["mq11_family_vacation_offer"]["choices"] if "кредитке" in c["title"])
        trip_needs = next(c for c in s["mq11_family_vacation_trip"]["choices"] if "ранней брони" in c["title"])
        plus = lambda ch: {k: v for k, v in ch["effects"]["needs_delta"].items() if v > 0}  # noqa: E731
        assert plus(card_needs) == plus(trip_needs)

    def test_audience_is_family_personas_and_followups_off_random_pool(self):
        s = _specs()
        assert set(s["mq11_family_vacation_offer"]["audience_template_keys"]) == {
            "mq_game_mortgage_stress_v1",
            "mq_game_debt_stack_v1",
        }
        for key in ("mq11_family_vacation_card_bill", "mq11_family_vacation_card_tail", "mq11_family_vacation_trip"):
            assert key in CHAIN_FOLLOWUP_EXCLUDE_FROM_RANDOM_POOL
            assert s[key]["mandatory_gate"] == "blocks_period_end", key

    def test_final_steps_recap_the_first_choice(self):
        s = _specs()
        texts = [
            next(c for c in s["mq11_family_vacation_card_bill"]["choices"] if "сразу" in c["title"])["description"],
            s["mq11_family_vacation_card_tail"]["choices"][0]["description"],
            next(c for c in s["mq11_family_vacation_trip"]["choices"] if "ранней брони" in c["title"])["description"],
        ]
        assert all("периодов назад" in t or "периода назад" in t for t in texts)


class TestFamilyVacationFlow:
    @pytest.fixture()
    def manager(self, db_session, test_user):
        ensure_mvp11_event_catalog(db_session)
        profile = GameProfile(
            user_id=test_user.id,
            name="vacation",
            save_kind="game",
            starter_template_key="mq_game_mortgage_stress_v1",
            is_active=1,
            period_index=4,
            cash_balance=500_000,
        )
        db_session.add(profile)
        db_session.commit()
        db_session.add(FinanceSalary(game_profile_id=profile.id, monthly_amount=SALARY))
        db_session.commit()
        return profile

    def _offer(self, db_session, profile) -> EventInstance:
        defn = db_session.query(EventDefinition).filter(EventDefinition.key == "mq11_family_vacation_offer").one()
        inst = EventInstance(
            game_profile_id=profile.id, period_index=profile.period_index, definition_id=defn.id, status="pending"
        )
        db_session.add(inst)
        db_session.commit()
        return inst

    def _choose(self, db_session, profile, inst: EventInstance, title_part: str) -> None:
        from app.services.events.choose import choose_event

        choice = next(
            c
            for c in db_session.query(EventChoice).filter(EventChoice.definition_id == inst.definition_id).all()
            if title_part in c.title
        )
        choose_event(db_session, profile, inst.id, int(choice.id))
        db_session.refresh(profile)

    def _advance(self, db_session, profile, periods: int) -> EventInstance:
        profile.period_index = int(profile.period_index) + periods
        db_session.commit()
        ensure_scheduled_chain_events(db_session, profile.id, int(profile.period_index))
        return (
            db_session.query(EventInstance)
            .filter(
                EventInstance.game_profile_id == profile.id,
                EventInstance.status == "pending",
                EventInstance.period_index == profile.period_index,
            )
            .one()
        )

    def test_card_split_path_costs_85_percent_and_closes_chain(self, db_session, manager):
        self._choose(db_session, manager, self._offer(db_session, manager), "кредитке")
        assert manager.cash_balance == pytest.approx(500_000)  # отпуск сейчас, со счёта ничего

        bill = self._advance(db_session, manager, 3)
        self._choose(db_session, manager, bill, "частями")
        assert get_active_chain(db_session, manager.id, FAMILY_VACATION_CHAIN_KEY) is not None  # хвост впереди

        tail = self._advance(db_session, manager, 3)
        defn = db_session.get(EventDefinition, tail.definition_id)
        assert defn.key == "mq11_family_vacation_card_tail"
        self._choose(db_session, manager, tail, "Понятно")

        assert manager.cash_balance == pytest.approx(500_000 - 0.85 * SALARY)
        assert get_active_chain(db_session, manager.id, FAMILY_VACATION_CHAIN_KEY) is None

    def test_save_path_costs_55_percent(self, db_session, manager):
        self._choose(db_session, manager, self._offer(db_session, manager), "Копить")
        trip = self._advance(db_session, manager, 3)
        assert json.loads(db_session.get(EventDefinition, trip.definition_id).metadata_json)["interaction_kind"] == (
            "chain_followup"
        )
        self._choose(db_session, manager, trip, "ранней брони")
        assert manager.cash_balance == pytest.approx(500_000 - 0.55 * SALARY)
        assert get_active_chain(db_session, manager.id, FAMILY_VACATION_CHAIN_KEY) is None
