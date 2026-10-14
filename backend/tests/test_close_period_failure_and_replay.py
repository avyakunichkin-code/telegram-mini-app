"""«Завершить ход»: сбой не коммитит половину списаний; повтор после поражения отдаёт game_over."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from app.finance.balance_utils import adjust_balance
from app.models import ApiIdempotencyRecord, GameProfile, Transaction
from app.services.period import close as close_service
from app.services.period.close import TIME_NEXT_ROUTE_KEY, close_open_period, go_to_next_period
from tests.fixtures.game import create_profile_ready_for_period_close


def _only_active(db_session, user_id: int, profile: GameProfile) -> None:
    db_session.query(GameProfile).filter(
        GameProfile.user_id == user_id, GameProfile.id != profile.id
    ).update({"is_active": 0})
    profile.is_active = 1
    db_session.commit()


def test_failed_period_end_does_not_commit_partial_debits(db_session, test_user, monkeypatch):
    profile = create_profile_ready_for_period_close(
        db_session, user_id=test_user.id, cash_balance=10_000.0
    )
    _only_active(db_session, test_user.id, profile)
    period = int(profile.period_index)

    def half_done_period_end(db, prof):
        adjust_balance(db, prof.id, -3_000, "asset_maintenance", "Обслуживание", period)
        raise RuntimeError("crash mid period end")

    monkeypatch.setattr(close_service, "process_period_end", half_done_period_end)

    with pytest.raises(RuntimeError):
        close_open_period(db_session, test_user.id, intended_period=period)

    db_session.expire_all()
    fresh = db_session.get(GameProfile, profile.id)
    assert float(fresh.cash_balance) == 10_000.0
    assert int(fresh.period_index) == period
    assert (
        db_session.query(Transaction)
        .filter(Transaction.game_profile_id == profile.id, Transaction.type == "asset_maintenance")
        .count()
        == 0
    )
    assert (
        db_session.query(ApiIdempotencyRecord)
        .filter(ApiIdempotencyRecord.route_key == TIME_NEXT_ROUTE_KEY)
        .count()
        == 0
    )


def test_retry_after_defeat_replays_game_over(db_session, test_user, seed_basic_template):
    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        cash_balance=500.0,
        negative_periods_count=2,
        base_monthly_lifestyle_expense=37_500.0,
    )
    _only_active(db_session, test_user.id, profile)

    with patch("app.game.period.ensure_period_events", return_value=None):
        first = go_to_next_period(db_session, test_user.id)
        assert first.game_over is True

        retry = go_to_next_period(db_session, test_user.id)

    assert retry.game_over is True
    assert retry.defeat_reason == first.defeat_reason
    assert retry.period_close is not None
    assert retry.period_close.closed_period_index == first.period_close.closed_period_index
