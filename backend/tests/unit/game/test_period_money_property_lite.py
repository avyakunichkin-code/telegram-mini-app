"""
CS: property-lite — salary и safety fund (backlog #5).

Инвариант: балансы остаются finite; отказы не меняют состояние.
"""

from __future__ import annotations

import math

import pytest
from fastapi import HTTPException

from app.services.period.salary import claim_salary
from app.services.period.safety_fund import contribute_to_safety_fund, withdraw_from_safety_fund
from tests.fixtures.game import create_profile_ready_for_period_close
from tests.fixtures.money import assert_finite_money


pytestmark = pytest.mark.unit


@pytest.mark.parametrize(
    "initial_cash, contribute_amount",
    [
        (50_000.0, 1.0),
        (50_000.0, 12_345.67),
        (50_000.0, 49_999.99),
        (1_000_000.0, 500_000.0),
    ],
)
def test_contribute_preserves_finite_balances(
    db_session, test_user, initial_cash, contribute_amount
):
    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        cash_balance=initial_cash,
        safety_fund_balance=0.0,
    )
    cash_before = float(profile.cash_balance)
    safety_before = float(profile.safety_fund_balance)

    result = contribute_to_safety_fund(db_session, profile, contribute_amount)
    db_session.refresh(profile)

    new_cash = assert_finite_money(result["new_cash_balance"], label="cash")
    new_safety = assert_finite_money(result["new_safety_fund_balance"], label="safety")

    assert new_cash == pytest.approx(cash_before - contribute_amount, abs=0.02)
    assert new_safety == pytest.approx(safety_before + contribute_amount, abs=0.02)


@pytest.mark.parametrize("over_contribute", [50_001.0, 100_000.0])
def test_contribute_rejects_insufficient_cash_without_mutation(
    db_session, test_user, over_contribute
):
    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        cash_balance=50_000.0,
        safety_fund_balance=1_000.0,
    )
    cash_before = float(profile.cash_balance)
    safety_before = float(profile.safety_fund_balance)

    with pytest.raises(HTTPException) as exc:
        contribute_to_safety_fund(db_session, profile, over_contribute)
    assert exc.value.status_code == 400

    db_session.refresh(profile)
    assert float(profile.cash_balance) == cash_before
    assert float(profile.safety_fund_balance) == safety_before


def test_withdraw_after_contribute_finite(db_session, test_user):
    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        cash_balance=30_000.0,
        safety_fund_balance=0.0,
    )
    contribute_to_safety_fund(db_session, profile, 10_000.0)
    db_session.refresh(profile)

    result = withdraw_from_safety_fund(db_session, profile, 4_000.0)
    db_session.refresh(profile)

    assert_finite_money(result["new_cash_balance"])
    assert_finite_money(result["new_safety_fund_balance"])
    assert float(profile.cash_balance) == pytest.approx(24_000.0, abs=0.02)
    assert float(profile.safety_fund_balance) == pytest.approx(6_000.0, abs=0.02)


def test_withdraw_rejects_over_safety_balance(db_session, test_user):
    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        cash_balance=10_000.0,
        safety_fund_balance=2_000.0,
    )
    cash_before = float(profile.cash_balance)
    safety_before = float(profile.safety_fund_balance)

    with pytest.raises(HTTPException) as exc:
        withdraw_from_safety_fund(db_session, profile, 5_000.0)
    assert exc.value.status_code == 400

    db_session.refresh(profile)
    assert float(profile.cash_balance) == cash_before
    assert float(profile.safety_fund_balance) == safety_before


@pytest.mark.parametrize("monthly_salary", [1.0, 50_000.0, 123_456.78])
def test_claim_salary_increases_cash_finite(db_session, test_user, monthly_salary):
    from app.models import FinanceSalary

    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        cash_balance=15_000.0,
        salary_already_claimed=False,
    )
    salary_row = (
        db_session.query(FinanceSalary)
        .filter(FinanceSalary.game_profile_id == profile.id)
        .one()
    )
    salary_row.monthly_amount = monthly_salary
    db_session.commit()

    result = claim_salary(db_session, profile)
    db_session.refresh(profile)

    assert result["already_claimed"] is False
    new_balance = assert_finite_money(result["new_balance"])
    assert new_balance == pytest.approx(15_000.0 + monthly_salary, abs=0.02)
    assert_finite_money(profile.cash_balance)


def test_double_claim_salary_idempotent_finite(db_session, test_user):
    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        cash_balance=10_000.0,
        salary_already_claimed=False,
    )
    first = claim_salary(db_session, profile)
    db_session.refresh(profile)
    balance_after_first = float(profile.cash_balance)
    assert_finite_money(balance_after_first)

    second = claim_salary(db_session, profile)
    db_session.refresh(profile)

    assert second["already_claimed"] is True
    assert_finite_money(second["new_balance"])
    assert float(profile.cash_balance) == pytest.approx(balance_after_first, abs=0.02)
    assert first["amount"] == second["amount"]


def test_salary_sequence_stays_finite(db_session, test_user):
    """Несколько взносов подряд — без NaN/inf."""
    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        cash_balance=100_000.0,
        salary_already_claimed=False,
    )
    claim_salary(db_session, profile)
    db_session.refresh(profile)

    for amount in (100.0, 250.5, 1_000.0, 0.01):
        contribute_to_safety_fund(db_session, profile, amount)
        db_session.refresh(profile)
        assert math.isfinite(float(profile.cash_balance))
        assert math.isfinite(float(profile.safety_fund_balance))
