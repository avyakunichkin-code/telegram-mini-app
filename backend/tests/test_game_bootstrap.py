"""GET /api/game/bootstrap — единый снимок состояния игры."""

from __future__ import annotations


def test_game_bootstrap_shape(client):
    start = client.post(
        "/api/game/start",
        json={
            "profile_name": "Bootstrap Test",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
            "period_duration_seconds": 300,
        },
    )
    assert start.status_code == 200, start.text

    res = client.get("/api/game/bootstrap")
    assert res.status_code == 200, res.text
    body = res.json()

    assert "overview" in body
    assert "time" in body
    assert "period" in body
    assert "events" in body

    assert body["overview"]["cash_balance"] is not None
    assert body["time"]["time_state"] in ("play", "pause")
    assert body["period"]["period_index"] >= 1
    assert isinstance(body["events"]["events"], list)


def test_health_lightweight(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert "users" not in data
