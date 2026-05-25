"""Разрешения механик из blueprint шаблона."""

from app.starter_mechanics import (
    BASIC_V1_MECHANICS,
    mechanics_from_blueprint,
    resolve_profile_mechanics,
)


class TestMechanicsFromBlueprint:
    def test_basic_v1_preset(self):
        m = mechanics_from_blueprint({}, "mq_game_basic_v1")
        assert m == BASIC_V1_MECHANICS

    def test_blueprint_overrides_preset(self):
        bp = {"mechanics": {"capital_insurance": True}}
        m = mechanics_from_blueprint(bp, "mq_game_basic_v1")
        assert m["capital_insurance"] is True
        assert m["capital_invest"] is True
        assert m["capital_property"] is False

    def test_unknown_template_defaults_all_on(self):
        m = mechanics_from_blueprint({}, "mq_game_custom_future")
        assert all(m.values())


class TestMechanicsInOverview:
    def test_basic_new_profile_effective_invest_locked(self, client, auth_headers):
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "MechEff",
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        )
        ov = client.get("/api/finance/overview", headers=auth_headers)
        assert ov.status_code == 200
        body = ov.json()
        assert body["mechanics"]["capital_invest"] is True
        eff = body.get("mechanics_effective") or {}
        assert eff.get("capital_invest") is False

    def test_basic_template_overview_mechanics(self, client, auth_headers):
        start = client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "Mech",
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        )
        assert start.status_code == 200

        ov = client.get("/api/finance/overview", headers=auth_headers)
        assert ov.status_code == 200
        mech = ov.json()["mechanics"]
        assert mech["capital_invest"] is True
        assert mech["capital_insurance"] is False
        assert mech["capital_property"] is False
        assert mech["capital_liabilities"] is False

    def test_insurance_buy_403_when_disabled(self, client, auth_headers):
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "NoIns",
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        )
        r = client.post(
            "/api/insurance/buy",
            headers=auth_headers,
            json={"plan_key": "auto_liability_basic", "title": "ОСАГО"},
        )
        assert r.status_code == 403
        assert r.json()["detail"]["code"] == "mechanic_disabled"
