"""
PR-14 / AI C1: close не молчит, если пул событий не собрал карточки.

CS-1 exception → флаг true, период +1
CS-2 тихий empty → флаг true
CS-3 ход 1–2 → флаг false
CS-4 нормальный spawn ≥3 → флаг false
"""

from __future__ import annotations

import logging
from unittest.mock import patch

import pytest

from app.game.period import process_period_end
from app.game.rules import MIN_PERIOD_INDEX_FOR_GAME_EVENTS
from app.services.events.service import (
    SPAWN_ALREADY_FULL,
    SPAWN_EMPTY_POOL,
    SPAWN_OK,
    SPAWN_SKIPPED_INTRO,
    ensure_period_events,
)
from tests.fixtures.game import create_profile_ready_for_period_close


pytestmark = pytest.mark.unit


def _close_profile(db_session, test_user, *, period_index: int = 1, **kwargs):
    defaults = {
        "user_id": test_user.id,
        "cash_balance": 10_000.0,
        "base_monthly_lifestyle_expense": 0.0,
        "period_index": period_index,
    }
    defaults.update(kwargs)
    return create_profile_ready_for_period_close(db_session, **defaults)


class TestPeriodCloseEventPoolFailure:
    def test_close_completes_and_flags_when_event_pool_raises(
        self, db_session, test_user, caplog
    ):
        profile = _close_profile(db_session, test_user)
        closed_index = int(profile.period_index)

        with caplog.at_level(logging.ERROR, logger="app.game.period"):
            with (
                patch("app.game.period._ensure_seed_events", return_value=None),
                patch(
                    "app.game.period.ensure_period_events",
                    side_effect=RuntimeError("pool boom"),
                ),
            ):
                result = process_period_end(db_session, profile)

        db_session.refresh(profile)
        assert result["closed_period_index"] == closed_index
        assert int(profile.period_index) == closed_index + 1
        assert result["events_spawn_failed"] is True
        assert any(
            "Period event pool failed" in rec.getMessage() and rec.exc_info
            for rec in caplog.records
        )

    def test_close_flags_silent_empty_pool(self, db_session, test_user):
        profile = _close_profile(
            db_session, test_user, period_index=MIN_PERIOD_INDEX_FOR_GAME_EVENTS
        )

        with (
            patch("app.game.period._ensure_seed_events", return_value=None),
            patch(
                "app.game.period.ensure_period_events",
                return_value=SPAWN_EMPTY_POOL,
            ),
        ):
            result = process_period_end(db_session, profile)

        assert result["events_spawn_failed"] is True
        assert int(profile.period_index) == MIN_PERIOD_INDEX_FOR_GAME_EVENTS + 1

    def test_intro_period_does_not_flag_missing_events(self, db_session, test_user):
        profile = _close_profile(db_session, test_user, period_index=1)

        with (
            patch("app.game.period._ensure_seed_events", return_value=None),
            patch(
                "app.game.period.ensure_period_events",
                return_value=SPAWN_SKIPPED_INTRO,
            ),
        ):
            result = process_period_end(db_session, profile)

        assert result["events_spawn_failed"] is False

    def test_successful_spawn_does_not_flag(self, db_session, test_user):
        profile = _close_profile(
            db_session, test_user, period_index=MIN_PERIOD_INDEX_FOR_GAME_EVENTS
        )

        with (
            patch("app.game.period._ensure_seed_events", return_value=None),
            patch("app.game.period.ensure_period_events", return_value=SPAWN_OK),
        ):
            result = process_period_end(db_session, profile)

        assert result["events_spawn_failed"] is False


class TestEnsurePeriodEventsSpawnStatus:
    def test_intro_period_returns_skipped(self, db_session, test_user):
        profile = _close_profile(db_session, test_user, period_index=1)
        status = ensure_period_events(db_session, profile.id, 1, "game")
        assert status == SPAWN_SKIPPED_INTRO

    def test_eligible_period_without_definitions_returns_empty(
        self, db_session, test_user
    ):
        profile = _close_profile(
            db_session, test_user, period_index=MIN_PERIOD_INDEX_FOR_GAME_EVENTS
        )
        status = ensure_period_events(
            db_session, profile.id, MIN_PERIOD_INDEX_FOR_GAME_EVENTS, "game"
        )
        assert status == SPAWN_EMPTY_POOL

    def test_already_full_returns_already_full(self, db_session, test_user):
        profile = _close_profile(
            db_session, test_user, period_index=MIN_PERIOD_INDEX_FOR_GAME_EVENTS
        )
        from app.models import EventDefinition, EventInstance

        definition = EventDefinition(
            key="pr14_full_dummy",
            mode="any",
            title="Dummy",
            description="x",
            is_active=1,
            weight=1,
        )
        db_session.add(definition)
        db_session.flush()
        for _ in range(2):
            db_session.add(
                EventInstance(
                    game_profile_id=profile.id,
                    definition_id=definition.id,
                    period_index=MIN_PERIOD_INDEX_FOR_GAME_EVENTS,
                    status="pending",
                )
            )
        db_session.commit()

        status = ensure_period_events(
            db_session, profile.id, MIN_PERIOD_INDEX_FOR_GAME_EVENTS, "game"
        )
        assert status == SPAWN_ALREADY_FULL
