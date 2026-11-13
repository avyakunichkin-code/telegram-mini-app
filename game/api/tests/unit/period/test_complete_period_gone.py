"""
PR-03: legacy complete_period не двигает месяц (defense in depth на сервисе).
"""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.services.period.complete import complete_period
from tests.fixtures.game import create_game_profile


pytestmark = pytest.mark.unit


class TestCompletePeriodServiceGone:
    def test_complete_period_raises_410_and_does_not_mutate(
        self, db_session, test_user
    ):
        profile = create_game_profile(
            db_session,
            user_id=test_user.id,
            period_index=2,
            cash_balance=12_345.0,
        )

        with pytest.raises(HTTPException) as exc:
            complete_period(db_session, profile)

        assert exc.value.status_code == 410
        assert "/api/game/time/next" in str(exc.value.detail)

        db_session.refresh(profile)
        assert int(profile.period_index) == 2
        assert float(profile.cash_balance) == 12_345.0
