"""
PR-03 / QA C2: POST /api/game/period/complete-period не двигает месяц.

Канон close — POST /api/game/time/next → process_period_end.
Legacy-путь без экономики должен отвечать 410 Gone.
"""

from __future__ import annotations

import pytest

from app.models import GameProfile


pytestmark = pytest.mark.integration


def _start_game(client, auth_headers, profile_name: str = "PR-03 gone"):
    r = client.post(
        "/api/game/start",
        headers=auth_headers,
        json={
            "profile_name": profile_name,
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
    )
    assert r.status_code == 200


def _active_profile(db_session) -> GameProfile:
    profile = (
        db_session.query(GameProfile)
        .filter(GameProfile.is_active == 1)
        .order_by(GameProfile.id.desc())
        .first()
    )
    assert profile is not None
    return profile


class TestCompletePeriodGone:
    def test_authenticated_complete_period_returns_410(self, client, auth_headers):
        _start_game(client, auth_headers)
        r = client.post("/api/game/period/complete-period", headers=auth_headers)
        assert r.status_code == 410
        detail = r.json().get("detail")
        assert isinstance(detail, str)
        assert "/api/game/time/next" in detail

    def test_complete_period_does_not_advance_period_or_skip_burn(
        self, client, auth_headers, db_session
    ):
        _start_game(client, auth_headers)
        profile = _active_profile(db_session)
        period_before = int(profile.period_index)
        cash_before = float(profile.cash_balance)

        r = client.post("/api/game/period/complete-period", headers=auth_headers)
        assert r.status_code == 410

        db_session.refresh(profile)
        assert int(profile.period_index) == period_before
        assert float(profile.cash_balance) == cash_before
