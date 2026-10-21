"""HouseholdSnapshot: неизменяемый вход ядра и сводные величины."""

import dataclasses

import pytest

from fincore.household import HouseholdSnapshot, Income, Liability


def test_snapshot_aggregates_income_and_debt():
    snap = HouseholdSnapshot(
        month_index=4,
        cash=1_000.0,
        incomes=(Income(monthly_amount=50_000.0), Income(monthly_amount=5_000.0)),
        liabilities=(
            Liability(id=1, title="Кредит", total_debt=10_000.0, annual_rate_percent=20.0,
                      monthly_payment=1_000.0, overdue_amount=250.0),
        ),
    )
    assert snap.monthly_income == 55_000.0
    assert snap.debt_with_overdue == 10_250.0


def test_snapshot_is_immutable():
    snap = HouseholdSnapshot(month_index=1, cash=0.0)
    with pytest.raises(dataclasses.FrozenInstanceError):
        snap.cash = 1.0  # type: ignore[misc]
