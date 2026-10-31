"""
PR-02: choose события один раз.

Ключ — profile+event (сервер сам). Повтор того же event — replay 200, не второй apply.
"""

from __future__ import annotations

import threading

import pytest
from sqlalchemy.orm import sessionmaker

from app.models import EventInstance, GameProfile, Transaction
from app.services.events.service import choose_event
from tests.fixtures.events import seed_cash_delta_event
from tests.fixtures.game import create_game_profile


pytestmark = pytest.mark.unit

_CASH_DELTA = -1_000.0


class TestChooseEventLock:
    def test_sequential_repeat_replays_without_second_apply(self, db_session, test_user):
        profile = create_game_profile(
            db_session,
            user_id=test_user.id,
            cash_balance=20_000.0,
            period_index=3,
            is_active=1,
        )
        inst, choice = seed_cash_delta_event(
            db_session,
            profile.id,
            period_index=3,
            cash_delta=_CASH_DELTA,
            key="choose_lock_seq",
        )
        cash_before = float(profile.cash_balance)

        first = choose_event(db_session, profile, inst.id, choice.id)
        second = choose_event(db_session, profile, inst.id, choice.id)

        db_session.refresh(profile)
        db_session.refresh(inst)
        assert first["status"] == "success"
        assert second["status"] == "success"
        assert inst.status == "selected"
        assert inst.selected_choice_id == choice.id
        assert float(profile.cash_balance) == pytest.approx(cash_before + _CASH_DELTA)
        event_tx = (
            db_session.query(Transaction)
            .filter(
                Transaction.game_profile_id == profile.id,
                Transaction.type == "event_cash",
            )
            .count()
        )
        assert event_tx == 1

    def test_concurrent_choose_applies_once(self, db_engine, db_session, test_user):
        profile = create_game_profile(
            db_session,
            user_id=test_user.id,
            cash_balance=20_000.0,
            period_index=3,
            is_active=1,
        )
        inst, choice = seed_cash_delta_event(
            db_session,
            profile.id,
            period_index=3,
            cash_delta=_CASH_DELTA,
            key="choose_lock_conc",
        )
        profile_id = profile.id
        event_id = inst.id
        choice_id = choice.id
        cash_before = float(profile.cash_balance)
        db_session.commit()

        Session = sessionmaker(bind=db_engine)
        results: list = []
        errors: list = []

        def worker() -> None:
            session = Session()
            try:
                locked = session.get(GameProfile, profile_id)
                results.append(choose_event(session, locked, event_id, choice_id))
            except Exception as exc:  # noqa: BLE001 — собираем для assert
                errors.append(exc)
            finally:
                session.close()

        threads = [threading.Thread(target=worker) for _ in range(2)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=15)
            assert not thread.is_alive()

        assert errors == []
        assert len(results) == 2
        assert {item["status"] for item in results} == {"success"}

        db_session.expire_all()
        locked = db_session.get(GameProfile, profile_id)
        resolved = db_session.get(EventInstance, event_id)
        assert resolved.status == "selected"
        assert resolved.selected_choice_id == choice_id
        assert float(locked.cash_balance) == pytest.approx(cash_before + _CASH_DELTA)
        event_tx = (
            db_session.query(Transaction)
            .filter(
                Transaction.game_profile_id == profile_id,
                Transaction.type == "event_cash",
            )
            .count()
        )
        assert event_tx == 1
