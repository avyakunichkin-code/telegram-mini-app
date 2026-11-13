"""TB1: пошаговый месяц — real-time таймера нет (play/pause/config удалены 2026-10-14)."""

from __future__ import annotations

import pytest


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", "/api/game/time"),
        ("post", "/api/game/time/play"),
        ("post", "/api/game/time/pause"),
        ("put", "/api/game/time/config"),
    ],
)
def test_timer_endpoints_removed(client, method, path):
    res = getattr(client, method)(path, json={}) if method != "get" else client.get(path)
    assert res.status_code in (404, 405), (path, res.status_code, res.text)


def test_close_month_response_has_no_timer_fields(client):
    start = client.post(
        "/api/game/start",
        json={"profile_name": "No timer", "save_kind": "game", "template_key": "mq_game_basic_v1"},
    )
    assert start.status_code == 200, start.text

    res = client.post("/api/game/time/next")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["period_index"] == 2
    for removed in ("time_state", "period_duration_seconds", "seconds_until_next_period"):
        assert removed not in body


def test_start_ignores_legacy_period_duration_field(client):
    """Старые клиенты ещё шлют period_duration_seconds — поле игнорируется, не 422."""
    res = client.post(
        "/api/game/start",
        json={
            "profile_name": "Legacy client",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
            "period_duration_seconds": 5,
        },
    )
    assert res.status_code == 200, res.text
