from __future__ import annotations

import json


def _patch_template_needs(db_session, template_key: str = "mq_game_basic_v1"):
    from app.models import GameStarterTemplate

    row = (
        db_session.query(GameStarterTemplate)
        .filter(GameStarterTemplate.template_key == template_key)
        .first()
    )
    assert row is not None
    bp = json.loads(row.blueprint_json or "{}")
    bp["needs"] = {
        "enabled": True,
        "character_label": "Студент",
        "initial": {"comfort": 72, "status": 48, "social": 58, "health": 76},
        "periods_to_empty_target": 12,
        "thresholds": {"low": 40, "distressed": 30},
        "consequence_profile": "soft",
        "consequences": {
            "distressed_cash_penalty_pct_salary": 0.02,
            "distressed_cash_penalty_min": 1000,
        },
        "player_support": {"proactive_hints": True},
        "treat_self": {
            "cooldown_periods": 15,
            "default_cost_pct_salary": 0.08,
            "cost_min": 2000,
            "cost_max": 25000,
            "options": [
                {
                    "id": "picnic_friends",
                    "title": "Отгул: пикник с друзьями",
                    "subtitle": "Отдых и общение",
                    "needs_delta": {"social": 22, "health": 18, "comfort": 6, "status": 4},
                }
            ],
        },
    }
    row.blueprint_json = json.dumps(bp, ensure_ascii=False)
    db_session.commit()


def test_overview_includes_needs_and_treat_self(client, auth_headers, db_session):
    _patch_template_needs(db_session)

    start = client.post(
        "/api/game/start",
        headers=auth_headers,
        json={"profile_name": "Needs", "save_kind": "game", "template_key": "mq_game_basic_v1"},
    )
    assert start.status_code == 200

    ov = client.get("/api/finance/overview", headers=auth_headers)
    assert ov.status_code == 200
    body = ov.json()

    assert "needs" in body
    assert body["needs"]["comfort"] == 72.0
    assert body["needs"]["social"] == 58.0

    assert body["needs_meta"]["consequence_profile"] == "soft"
    assert body["needs_meta"]["thresholds"]["distressed"] == 30
    assert body["treat_self"]["available"] is True
    assert len(body["treat_self"]["options"]) == 1
    assert body["treat_self"]["options"][0]["id"] == "picnic_friends"
    assert body["treat_self"]["options"][0]["cost"] > 0


def test_treat_self_applies_cost_and_delta(client, auth_headers, db_session):
    _patch_template_needs(db_session)
    assert (
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={"profile_name": "Treat", "save_kind": "game", "template_key": "mq_game_basic_v1"},
        ).status_code
        == 200
    )

    before = client.get("/api/finance/overview", headers=auth_headers).json()
    cash_before = float(before["cash_balance"])
    social_before = float(before["needs"]["social"])

    res = client.post(
        "/api/game/period/treat-self",
        headers=auth_headers,
        json={"option_id": "picnic_friends"},
    )
    assert res.status_code == 200
    r = res.json()
    assert r["status"] == "success"
    assert r["option_id"] == "picnic_friends"
    assert r["cost"] > 0
    assert r["needs_after"]["social"] > social_before

    after = client.get("/api/finance/overview", headers=auth_headers).json()
    assert float(after["cash_balance"]) < cash_before


def test_needs_guide_endpoint(client, auth_headers):
    assert (
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={"profile_name": "Guide", "save_kind": "game", "template_key": "mq_game_basic_v1"},
        ).status_code
        == 200
    )
    g = client.get("/api/game/needs/guide", headers=auth_headers)
    assert g.status_code == 200
    body = g.json()
    assert isinstance(body["maintenance"], list)
    assert isinstance(body["critical"], list)
    assert len(body["maintenance"]) >= 1
    assert len(body["critical"]) >= 1

