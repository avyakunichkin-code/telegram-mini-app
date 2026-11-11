"""DC-01/DC-02: движения журнала привязаны к кредиту через transactions.liability_id."""

from __future__ import annotations

import pytest

from app.events.chain_actions import ACTION_PREPAY_DEBTS, ACTION_REFINANCE, apply_chain_action
from app.game.period import process_period_end
from app.models import Transaction
from app.services.finance.liabilities import delete_liability, prepay_liability
from app.services.invest.service import buy_bond
from tests.fixtures.game import create_finance_liability, create_profile_ready_for_period_close


def _transactions(db_session, profile_id: int, tx_type: str) -> list[Transaction]:
    return (
        db_session.query(Transaction)
        .filter(Transaction.game_profile_id == profile_id, Transaction.type == tx_type)
        .order_by(Transaction.id)
        .all()
    )


def test_monthly_payment_is_linked_to_its_liability(db_session, test_user):
    profile = create_profile_ready_for_period_close(
        db_session, user_id=test_user.id, cash_balance=200_000.0, period_index=1
    )
    first = create_finance_liability(db_session, profile.id, total_debt=100_000.0, monthly_payment=1_000.0)
    second = create_finance_liability(db_session, profile.id, total_debt=50_000.0, monthly_payment=700.0)

    process_period_end(db_session, profile)

    payments = _transactions(db_session, profile.id, "liability_payment")
    assert {tx.liability_id: float(tx.amount) for tx in payments} == {
        first.id: pytest.approx(-1_000.0, abs=0.01),
        second.id: pytest.approx(-700.0, abs=0.01),
    }


def test_bond_coupon_ref_id_does_not_become_liability_id(db_session, test_user):
    profile = create_profile_ready_for_period_close(
        db_session, user_id=test_user.id, cash_balance=200_000.0, period_index=1
    )
    buy_bond(db_session, profile, amount=100_000, title="ОФЗ тест")
    db_session.refresh(profile)

    process_period_end(db_session, profile)

    coupons = _transactions(db_session, profile.id, "bond_coupon")
    assert len(coupons) == 1
    assert coupons[0].liability_id is None


# --- DC-02: движения вне конца хода -------------------------------------------------


def _annuity_liability(db_session, profile_id: int):
    return create_finance_liability(
        db_session,
        profile_id,
        total_debt=60_000.0,
        monthly_payment=5_300.0,
        payment_mode="annuity",
        term_periods=12,
        periods_paid=0,
    )


def _only_tx(db_session, profile_id: int, tx_type: str) -> Transaction:
    rows = _transactions(db_session, profile_id, tx_type)
    assert len(rows) == 1
    return rows[0]


def test_close_is_linked_to_its_liability(db_session, test_user):
    profile = create_profile_ready_for_period_close(db_session, user_id=test_user.id, cash_balance=200_000.0)
    liability = create_finance_liability(db_session, profile.id, total_debt=40_000.0, overdue_amount=1_000.0)

    delete_liability(db_session, profile, liability.id)

    tx = _only_tx(db_session, profile.id, "liability_close")
    assert tx.liability_id == liability.id
    assert float(tx.amount) == pytest.approx(-41_000.0, abs=0.01)


def test_service_prepay_is_linked_to_its_liability(db_session, test_user):
    profile = create_profile_ready_for_period_close(db_session, user_id=test_user.id, cash_balance=200_000.0)
    liability = _annuity_liability(db_session, profile.id)

    prepay_liability(db_session, profile, liability.id, 10_000.0)

    tx = _only_tx(db_session, profile.id, "liability_prepay")
    assert tx.liability_id == liability.id
    assert float(tx.amount) == pytest.approx(-10_000.0, abs=0.01)


def test_event_prepay_is_linked_to_its_liability(db_session, test_user):
    profile = create_profile_ready_for_period_close(db_session, user_id=test_user.id, cash_balance=200_000.0)
    liability = _annuity_liability(db_session, profile.id)

    apply_chain_action(db_session, profile, {"action": ACTION_PREPAY_DEBTS, "amount": 10_000})

    tx = _only_tx(db_session, profile.id, "liability_prepay")
    assert tx.liability_id == liability.id


def test_refinance_fee_is_linked_to_its_liability(db_session, test_user):
    profile = create_profile_ready_for_period_close(db_session, user_id=test_user.id, cash_balance=200_000.0)
    liability = _annuity_liability(db_session, profile.id)

    apply_chain_action(db_session, profile, {"action": ACTION_REFINANCE, "fee_pct_debt": 0.02, "rate_delta_pp": -2})

    tx = _only_tx(db_session, profile.id, "liability_fee")
    assert tx.liability_id == liability.id
    assert float(tx.amount) == pytest.approx(-1_200.0, abs=0.01)
