"""
PR-01: HTTP-контракт close.

G1: два последовательных POST /time/next — два месяца (игрок так и закрывает ход за ходом).
Идемпотентность — только повтор того же period (см. unit/game/test_time_next_lock.py).
"""

from __future__ import annotations

import pytest

from app.models import GameProfile


pytestmark = pytest.mark.integration


def _start_and_claim(client, auth_headers, name: str) -> None:
    assert (
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": name,
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        ).status_code
        == 200
    )
    assert client.post("/api/game/period/claim-salary", headers=auth_headers).status_code == 200


def _active_profile(db_session) -> GameProfile:
    profile = (
        db_session.query(GameProfile)
        .filter(GameProfile.is_active == 1)
        .order_by(GameProfile.id.desc())
        .first()
    )
    assert profile is not None
    return profile


class TestTimeNextHttpLockContract:
    def test_two_sequential_time_next_advance_two_months(
        self, client, auth_headers, db_session
    ):
        _start_and_claim(client, auth_headers, "PR-01 sequential")
        profile = _active_profile(db_session)
        start = int(profile.period_index)

        first = client.post("/api/game/time/next", headers=auth_headers)
        second = client.post("/api/game/time/next", headers=auth_headers)
        assert first.status_code == 200
        assert second.status_code == 200

        db_session.refresh(profile)
        assert int(profile.period_index) == start + 2
        assert first.json()["period_close"]["closed_period_index"] == start
        assert second.json()["period_close"]["closed_period_index"] == start + 1
