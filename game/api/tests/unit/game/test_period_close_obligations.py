"""
CS: period close — платежи по FinanceLiability и просрочка (backlog #2).

Gate: G1 happy (полная оплата), G2 boundary (нехватка cash), G4 инвариант overdue.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest

from app.game.period import process_period_end
from app.models import FinanceLiability
from tests.fixtures.game import (
    create_finance_liability,
    create_profile_ready_for_period_close,
)


pytestmark = pytest.mark.unit

_PERIOD_PATCHES = patch("app.game.period.ensure_period_events", return_value=None)


def _liability_breakdown(result: dict, title: str) -> dict:
    for item in result.get("breakdown") or []:
        if isinstance(item, dict) and item.get("type") == "liability" and item.get("title") == title:
            return item
    raise AssertionError(f"liability breakdown for {title!r} not found")


class TestPeriodCloseObligations:
    def test_full_liability_payment_clears_overdue(self, db_session, test_user):
        profile = create_profile_ready_for_period_close(
            db_session,
            user_id=test_user.id,
            cash_balance=20_000.0,
        )
        create_finance_liability(
            db_session,
            profile.id,
            title="Ипотека",
            monthly_payment=5_000.0,
        )

        with _PERIOD_PATCHES:
            result = process_period_end(db_session, profile)

        db_session.refresh(profile)
        liability = (
            db_session.query(FinanceLiability)
            .filter(FinanceLiability.game_profile_id == profile.id)
            .one()
        )

        row = _liability_breakdown(result, "Ипотека")
        assert row["due"] == 5_000.0
        assert row["paid"] == 5_000.0
        assert row["unpaid"] == 0.0
        assert float(liability.overdue_amount) == 0.0
        assert int(liability.overdue_periods) == 0
        assert result["overdue_added"] == 0.0
        assert float(profile.cash_balance) == pytest.approx(15_000.0, abs=0.01)

    def test_partial_payment_records_overdue_without_negative_cash_from_liability(
        self, db_session, test_user
    ):
        profile = create_profile_ready_for_period_close(
            db_session,
            user_id=test_user.id,
            cash_balance=10_000.0,
            base_monthly_lifestyle_expense=0.0,
        )
        create_finance_liability(
            db_session,
            profile.id,
            title="Кредит",
            monthly_payment=15_000.0,
        )

        with _PERIOD_PATCHES:
            result = process_period_end(db_session, profile)

        db_session.refresh(profile)
        liability = (
            db_session.query(FinanceLiability)
            .filter(FinanceLiability.game_profile_id == profile.id)
            .one()
        )

        row = _liability_breakdown(result, "Кредит")
        assert row["paid"] == 10_000.0
        assert row["unpaid"] == 5_000.0
        assert float(liability.overdue_amount) == 5_000.0
        assert int(liability.overdue_periods) == 1
        assert result["overdue_added"] == 5_000.0

    def test_previous_overdue_included_in_due_total(self, db_session, test_user):
        profile = create_profile_ready_for_period_close(
            db_session,
            user_id=test_user.id,
            cash_balance=12_000.0,
        )
        create_finance_liability(
            db_session,
            profile.id,
            title="Кредит",
            monthly_payment=5_000.0,
            overdue_amount=3_000.0,
            overdue_periods=1,
        )

        with _PERIOD_PATCHES:
            result = process_period_end(db_session, profile)

        db_session.refresh(profile)
        liability = (
            db_session.query(FinanceLiability)
            .filter(FinanceLiability.game_profile_id == profile.id)
            .one()
        )

        row = _liability_breakdown(result, "Кредит")
        assert row["due"] == 8_000.0
        assert row["paid"] == 8_000.0
        assert row["unpaid"] == 0.0
        assert float(liability.overdue_amount) == 0.0
        assert float(profile.cash_balance) == pytest.approx(4_000.0, abs=0.01)
