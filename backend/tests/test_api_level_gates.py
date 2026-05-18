"""Интеграция: level gate на invest deposit до 3 уровня."""

from app.models import GameProfile


class TestInvestLevelGate:
    def test_deposit_blocked_at_level_1(self, client, auth_headers, seed_basic_template, db_session):
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "GateTest",
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        )
        profile = db_session.query(GameProfile).filter(GameProfile.is_active == 1).first()
        profile.level = 1
        db_session.commit()

        r = client.post(
            "/api/invest/deposit/open",
            headers=auth_headers,
            json={"amount": 1000, "annual_rate_percent": 10},
        )
        assert r.status_code == 403
        body = r.json()
        assert body["detail"]["code"] == "level_gate"
        assert body["detail"]["required_level"] == 3

    def test_overview_includes_character_unlocks(self, client, auth_headers, seed_basic_template):
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "Unlocks",
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        )
        ov = client.get("/api/finance/overview", headers=auth_headers).json()
        unlocks = {u["feature"]: u for u in ov["character_unlocks"]}
        assert "invest.deposit_open" in unlocks
        assert unlocks["invest.deposit_open"]["min_level"] == 3
