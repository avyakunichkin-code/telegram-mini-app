"""
PR-02: зарплата один раз за период.

Ключ — profile+period (сервер сам). Повтор периода — already_claimed.
Два потока — один adjust_balance. Новый период — снова одна выплата.
"""

from __future__ import annotations

import threading

import pytest
from sqlalchemy.orm import sessionmaker

from app.finance.balance_utils import TRANSACTION_TYPES
from app.models import FinanceSalary, GameProfile, PeriodSnapshot, Transaction
from app.services.period.salary import claim_salary
from tests.fixtures.game import create_profile_ready_for_period_close


pytestmark = pytest.mark.unit

_SALARY = 50_000.0


def _count_salary_tx(db, profile_id: int) -> int:
    return (
        db.query(Transaction)
        .filter(
            Transaction.game_profile_id == profile_id,
            Transaction.type == TRANSACTION_TYPES["SALARY"],
        )
        .count()
    )


class TestClaimSalaryLock:
    def test_sequential_repeat_is_already_claimed(self, db_session, test_user):
        profile = create_profile_ready_for_period_close(
            db_session,
            user_id=test_user.id,
            cash_balance=10_000.0,
            salary_already_claimed=False,
        )
        cash_before = float(profile.cash_balance)

        first = claim_salary(db_session, profile)
        second = claim_salary(db_session, profile)

        db_session.refresh(profile)
        assert first["already_claimed"] is False
        assert second["already_claimed"] is True
        assert float(profile.cash_balance) == pytest.approx(cash_before + _SALARY)
        assert _count_salary_tx(db_session, profile.id) == 1

    def test_next_period_allows_one_claim_again(self, db_session, test_user):
        profile = create_profile_ready_for_period_close(
            db_session,
            user_id=test_user.id,
            cash_balance=10_000.0,
            salary_already_claimed=False,
        )
        first = claim_salary(db_session, profile)
        assert first["already_claimed"] is False

        profile.period_index = int(profile.period_index) + 1
        db_session.add(
            PeriodSnapshot(
                game_profile_id=profile.id,
                period_index=profile.period_index,
                salary_claimed=0,
                salary_amount=0.0,
            )
        )
        db_session.commit()
        db_session.refresh(profile)

        second = claim_salary(db_session, profile)
        db_session.refresh(profile)

        assert second["already_claimed"] is False
        assert _count_salary_tx(db_session, profile.id) == 2
        assert float(profile.cash_balance) == pytest.approx(10_000.0 + 2 * _SALARY)

    def test_concurrent_claims_pay_once(self, db_engine, db_session, test_user):
        profile = create_profile_ready_for_period_close(
            db_session,
            user_id=test_user.id,
            cash_balance=10_000.0,
            salary_already_claimed=False,
        )
        profile_id = profile.id
        cash_before = float(profile.cash_balance)
        db_session.commit()

        Session = sessionmaker(bind=db_engine)
        results: list = []
        errors: list = []

        def worker() -> None:
            session = Session()
            try:
                locked = session.get(GameProfile, profile_id)
                results.append(claim_salary(session, locked))
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
        assert float(locked.cash_balance) == pytest.approx(cash_before + _SALARY)
        assert _count_salary_tx(db_session, profile_id) == 1
        amounts = {float(item["amount"]) for item in results}
        assert amounts == {_SALARY}
        already = [bool(item["already_claimed"]) for item in results]
        assert already.count(False) >= 1
        salary_row = (
            db_session.query(FinanceSalary)
            .filter(FinanceSalary.game_profile_id == profile_id)
            .one()
        )
        assert float(salary_row.monthly_amount) == pytest.approx(_SALARY)
