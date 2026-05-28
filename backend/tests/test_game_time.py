"""TB1: пошаговый период — sync_time не сдвигает period_index."""

from __future__ import annotations

from datetime import timedelta

from app.game.time import get_seconds_until_next, sync_time
from app.models import GameProfile
from app.timeutil import utc_now_naive


def test_sync_time_does_not_advance_period_index(db_session):
    profile = GameProfile(
        user_id=88_001,
        name="TB1 sync",
        save_kind="game",
        is_active=1,
        time_state="play",
        period_index=3,
        period_duration_seconds=300,
        period_anchor_at=utc_now_naive() - timedelta(seconds=900),
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    passed, elapsed = sync_time(profile)
    db_session.commit()
    db_session.refresh(profile)

    assert passed == 0
    assert elapsed == 0.0
    assert profile.period_index == 3


def test_get_seconds_until_next_is_zero_turn_based(db_session):
    profile = GameProfile(
        user_id=88_002,
        name="TB1 seconds",
        save_kind="game",
        is_active=1,
        time_state="play",
        period_index=1,
        period_duration_seconds=300,
        period_anchor_at=utc_now_naive(),
    )
    db_session.add(profile)
    db_session.commit()

    assert get_seconds_until_next(profile) == 0
    profile.time_state = "pause"
    assert get_seconds_until_next(profile) == 0
