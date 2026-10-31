"""SPL-205: закрытие периода поверх `fincore.month_step` — подготовка снимка, журнал, сверка остатка."""

from __future__ import annotations

import dataclasses
import logging
from unittest.mock import patch

import pytest

from app.game import period as period_module
from app.game.period import _TRANSACTION_TYPE_BY_POSTING, process_period_end
from app.models import ProfileExpenseLine, Transaction
from fincore import month as core_month
from tests.fixtures.game import create_finance_liability, create_profile_ready_for_period_close

_NO_EVENTS = patch("app.game.period.ensure_period_events", return_value=None)


def test_backfill_happens_before_snapshot(db_session, test_user):
    """Критерий 1 SPL-204/205: без статей, base > 0, delta ≠ 0 → списываются статьи из base + delta."""
    profile = create_profile_ready_for_period_close(
        db_session, user_id=test_user.id, cash_balance=100_000.0, delta_monthly_lifestyle_expense=1_500.0,
    )
    profile.base_monthly_lifestyle_expense = 30_000.0  # после создания: статей ещё нет
    db_session.commit()

    with _NO_EVENTS:
        process_period_end(db_session, profile)

    lines = db_session.query(ProfileExpenseLine).filter(ProfileExpenseLine.game_profile_id == profile.id).all()
    assert lines, "статьи должны появиться из base"
    (lifestyle,) = (
        db_session.query(Transaction)
        .filter(Transaction.game_profile_id == profile.id, Transaction.type == "lifestyle_expense")
        .all()
    )
    assert lifestyle.amount == pytest.approx(-(sum(float(ln.amount_monthly) for ln in lines) + 1_500.0))


def test_cash_drift_between_snapshot_and_db_is_logged(db_session, test_user, caplog):
    profile = create_profile_ready_for_period_close(db_session, user_id=test_user.id, cash_balance=10_000.0)
    create_finance_liability(db_session, profile.id, monthly_payment=4_000.0)

    real_snapshot = period_module.build_household_snapshot

    def stale_snapshot(db, prof):
        return dataclasses.replace(real_snapshot(db, prof), cash=1_000.0)

    with _NO_EVENTS, patch.object(period_module, "build_household_snapshot", stale_snapshot), \
            caplog.at_level(logging.WARNING, logger="app.game.period"):
        process_period_end(db_session, profile)

    assert any("cash drift" in r.getMessage() for r in caplog.records)


def test_no_drift_warning_on_regular_close(db_session, test_user, caplog):
    profile = create_profile_ready_for_period_close(db_session, user_id=test_user.id, cash_balance=10_000.0)
    create_finance_liability(db_session, profile.id, monthly_payment=4_000.0)
    with _NO_EVENTS, caplog.at_level(logging.WARNING, logger="app.game.period"):
        process_period_end(db_session, profile)
    assert not any("cash drift" in r.getMessage() for r in caplog.records)


def test_every_posted_kind_has_transaction_type():
    posted = {
        value
        for name, value in vars(core_month).items()
        if name.startswith("POSTING_")
    } - {core_month.POSTING_INCOME, core_month.POSTING_INSURANCE_PREMIUM}
    assert posted == set(_TRANSACTION_TYPE_BY_POSTING)
