"""
PR-01 / QA C1: POST time/next закрывает один месяц, не два.

Ключ close — profile+period (сервер сам). Повтор intended period — replay.
Два последовательных хода — два месяца (так и должно быть).
"""

from __future__ import annotations

import threading

import pytest
from sqlalchemy.orm import sessionmaker

from app.models import GameProfile
from app.services.game.time import close_open_period, go_to_next_period
from tests.fixtures.game import create_profile_ready_for_period_close


pytestmark = pytest.mark.unit

_LIFESTYLE = 4_000.0


def _ready_profile(db_session, test_user, **kwargs) -> GameProfile:
    defaults = {
        "user_id": test_user.id,
        "cash_balance": 40_000.0,
        "base_monthly_lifestyle_expense": _LIFESTYLE,
    }
    defaults.update(kwargs)
    return create_profile_ready_for_period_close(db_session, **defaults)


class TestCloseOpenPeriodLock:
    def test_same_intended_period_closes_once_and_replays(
        self, db_session, test_user
    ):
        profile = _ready_profile(db_session, test_user)
        intended = int(profile.period_index)
        cash_before = float(profile.cash_balance)

        first = close_open_period(db_session, test_user.id, intended_period=intended)
        second = close_open_period(db_session, test_user.id, intended_period=intended)

        db_session.refresh(profile)
        assert int(profile.period_index) == intended + 1
        assert float(profile.cash_balance) == pytest.approx(cash_before - _LIFESTYLE)
        assert first.period_index == intended + 1
        assert second.period_index == first.period_index
        assert first.period_close is not None
        assert second.period_close is not None
        assert second.period_close.closed_period_index == first.period_close.closed_period_index
        assert second.period_close.new_balance == pytest.approx(first.period_close.new_balance)

    def test_sequential_months_each_advance(self, db_session, test_user):
        profile = _ready_profile(db_session, test_user)
        start = int(profile.period_index)

        first = go_to_next_period(db_session, test_user.id)
        second = go_to_next_period(db_session, test_user.id)

        db_session.refresh(profile)
        assert int(profile.period_index) == start + 2
        assert first.period_close.closed_period_index == start
        assert second.period_close.closed_period_index == start + 1

    def test_concurrent_closes_advance_period_once(
        self, db_engine, db_session, test_user
    ):
        profile = _ready_profile(db_session, test_user)
        profile_id = profile.id
        user_id = test_user.id
        intended = int(profile.period_index)
        cash_before = float(profile.cash_balance)
        db_session.commit()

        Session = sessionmaker(bind=db_engine)
        results: list = []
        errors: list = []

        def worker() -> None:
            session = Session()
            try:
                results.append(
                    close_open_period(session, user_id, intended_period=intended)
                )
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

        db_session.expire_all()
        locked = db_session.get(GameProfile, profile_id)
        assert int(locked.period_index) == intended + 1
        assert float(locked.cash_balance) == pytest.approx(cash_before - _LIFESTYLE)
        assert {item.period_index for item in results} == {intended + 1}
