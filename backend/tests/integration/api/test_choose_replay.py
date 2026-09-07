"""
PR-02 / G3: повтор POST /choose того же события — 200, cash один раз.
"""

from __future__ import annotations

import pytest

from app.models import GameProfile
from tests.fixtures.events import seed_cash_delta_event
from tests.fixtures.game import create_game_profile


pytestmark = pytest.mark.integration


def test_choose_repeat_returns_200_and_does_not_debit_twice(
    client, db_session, test_user
):
    profile = create_game_profile(
        db_session,
        user_id=test_user.id,
        cash_balance=15_000.0,
        period_index=3,
        is_active=1,
    )
    for row in db_session.query(GameProfile).filter(GameProfile.user_id == test_user.id):
        row.is_active = 1 if row.id == profile.id else 0
    db_session.commit()

    inst, choice = seed_cash_delta_event(
        db_session,
        profile.id,
        period_index=3,
        cash_delta=-2_000.0,
        key="choose_replay_http",
    )

    first = client.post(
        f"/api/game/events/{inst.id}/choose",
        json={"choice_id": choice.id},
    )
    second = client.post(
        f"/api/game/events/{inst.id}/choose",
        json={"choice_id": choice.id},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["status"] == "success"
    assert second.json()["status"] == "success"

    db_session.refresh(profile)
    assert float(profile.cash_balance) == pytest.approx(13_000.0)
