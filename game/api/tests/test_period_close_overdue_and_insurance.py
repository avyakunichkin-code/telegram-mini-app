"""Закрытие месяца: погашенная просрочка аннуитета уменьшает тело; сбой премий не ломает и не теряется молча."""

from __future__ import annotations

import logging
from unittest.mock import patch

import pytest

from fincore.annuity import monthly_payment, split_full_payment
from app.finance.balance_utils import adjust_balance
from app.game import period as period_module
from app.game.period import process_period_end
from app.models import FinanceLiability, Transaction
from tests.fixtures.game import create_profile_ready_for_period_close
from tests.test_insurance_policy_expiry import _policy

_NO_EVENTS = patch("app.game.period.ensure_period_events", return_value=None)


def test_expiry_does_not_skip_another_policys_premium(db_session, test_user, caplog):
    profile = create_profile_ready_for_period_close(
        db_session, user_id=test_user.id, cash_balance=10_000.0, period_index=2
    )
    expired = _policy(db_session, profile.id, expires_period_index=2)
    active = _policy(db_session, profile.id, expires_period_index=13, monthly_premium=900)
    with _NO_EVENTS, caplog.at_level(logging.ERROR, logger="app.game.period"):
        result = process_period_end(db_session, profile)
    db_session.refresh(expired)
    db_session.refresh(active)
    assert expired.is_active == 0
    assert active.is_active == 1
    assert result["new_balance"] == 9_100.0
    assert not any("Insurance premiums failed" in r.getMessage() for r in caplog.records)


def test_failure_after_insurance_rolls_back_expiry_and_earlier_debits(
    db_session, test_user, monkeypatch
):
    from app.services.period.close import close_open_period

    profile = create_profile_ready_for_period_close(
        db_session, user_id=test_user.id, cash_balance=10_000.0,
        base_monthly_lifestyle_expense=1_000.0,
    )
    expired = _policy(db_session, profile.id, expires_period_index=1)
    profile_id, policy_id, period = profile.id, expired.id, int(profile.period_index)

    def fail_after_insurance(*args, **kwargs):
        raise RuntimeError("failure after insurance")

    monkeypatch.setattr(period_module, "_accrue_investments", fail_after_insurance)
    with pytest.raises(RuntimeError, match="failure after insurance"):
        close_open_period(db_session, test_user.id, intended_period=period)
    db_session.expire_all()
    db_session.refresh(profile)
    db_session.refresh(expired)
    assert profile.id == profile_id and expired.id == policy_id
    assert profile.cash_balance == 10_000.0
    assert profile.period_index == period
    assert expired.is_active == 1
    assert db_session.query(Transaction).filter_by(game_profile_id=profile_id).count() == 0


def _annuity(db_session, profile_id: int, *, principal: float, rate: float, term: int) -> FinanceLiability:
    liability = FinanceLiability(
        game_profile_id=profile_id,
        title="Автокредит",
        total_debt=principal,
        original_principal=principal,
        annual_rate_percent=rate,
        monthly_payment=monthly_payment(principal, rate, term),
        term_periods=term,
        periods_paid=0,
        payment_mode="annuity",
        is_active=1,
    )
    db_session.add(liability)
    db_session.commit()
    db_session.refresh(liability)
    return liability


def test_paid_overdue_annuity_installment_reduces_principal(db_session, test_user):
    profile = create_profile_ready_for_period_close(
        db_session, user_id=test_user.id, cash_balance=0.0
    )
    liability = _annuity(db_session, profile.id, principal=100_000.0, rate=12.0, term=12)
    due = float(liability.monthly_payment)

    with _NO_EVENTS:
        process_period_end(db_session, profile)  # денег нет — взнос в просрочку
        db_session.refresh(liability)
        assert float(liability.overdue_amount) == pytest.approx(due)
        assert float(liability.total_debt) == 100_000.0

        profile.cash_balance = 10 * due
        db_session.commit()
        process_period_end(db_session, profile)  # гасим просрочку + текущий взнос

    db_session.refresh(liability)
    _i1, _p1, after_first = split_full_payment(100_000.0, 12.0, due)
    _i2, _p2, after_second = split_full_payment(after_first, 12.0, due)
    assert float(liability.overdue_amount) == 0.0
    assert int(liability.periods_paid) == 2
    assert float(liability.total_debt) == pytest.approx(after_second, abs=0.01)


def test_partial_payment_keeps_debt_until_installment_completed(db_session, test_user):
    profile = create_profile_ready_for_period_close(
        db_session, user_id=test_user.id, cash_balance=0.0
    )
    liability = _annuity(db_session, profile.id, principal=100_000.0, rate=12.0, term=12)
    due = float(liability.monthly_payment)
    profile.cash_balance = round(due * 0.4, 2)
    db_session.commit()

    with _NO_EVENTS:
        process_period_end(db_session, profile)

    db_session.refresh(liability)
    assert float(liability.total_debt) == 100_000.0
    assert int(liability.periods_paid) == 0
    assert float(liability.overdue_amount) == pytest.approx(due * 0.6, abs=0.01)


def test_insurance_failure_is_rolled_back_and_logged(db_session, test_user, monkeypatch, caplog):
    profile = create_profile_ready_for_period_close(
        db_session, user_id=test_user.id, cash_balance=10_000.0
    )
    closed = int(profile.period_index)

    def half_charged(db, prof, period_index, total):
        adjust_balance(db, prof.id, -2_000, "insurance_premium", "Премия", period_index)
        raise RuntimeError("premium calc failed")

    monkeypatch.setattr(period_module, "post_premiums_for_period", half_charged)

    with _NO_EVENTS, caplog.at_level(logging.ERROR, logger="app.game.period"):
        result = process_period_end(db_session, profile)

    db_session.refresh(profile)
    assert int(profile.period_index) == closed + 1
    assert float(result["new_balance"]) == 10_000.0
    assert (
        db_session.query(Transaction)
        .filter(Transaction.game_profile_id == profile.id, Transaction.type == "insurance_premium")
        .count()
        == 0
    )
    assert any("Insurance premiums failed" in r.getMessage() for r in caplog.records)
