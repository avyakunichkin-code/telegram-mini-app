from __future__ import annotations

import json

from app.models import EventChoice, EventDefinition, EventInstance, GameProfile
from app.needs.engine import parse_needs_delta


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


def test_parse_needs_delta_rejects_unknown_keys():
    try:
        parse_needs_delta({"comfort": 1, "mood": 2})
    except ValueError as e:
        assert "unknown" in str(e).lower()
    else:
        raise AssertionError("expected ValueError")


def test_choose_event_applies_needs_delta(client, auth_headers, db_session, test_user):
    _patch_template_needs(db_session)
    profile = GameProfile(
        user_id=test_user.id,
        name="evt_needs",
        save_kind="game",
        starter_template_key="mq_game_basic_v1",
        is_active=1,
        cash_balance=50000.0,
        period_index=1,
        need_comfort=70.0,
        need_status=50.0,
        need_social=50.0,
        need_health=70.0,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    ed = EventDefinition(key="test_needs_evt", mode="any", title="Тест", is_active=1, weight=100)
    db_session.add(ed)
    db_session.flush()
    choice = EventChoice(
        definition_id=ed.id,
        title="Поддержать",
        effects_json=json.dumps(
            {"cash_delta": 0, "needs_delta": {"social": 10, "health": 5}},
            ensure_ascii=False,
        ),
    )
    db_session.add(choice)
    db_session.flush()
    inst = EventInstance(
        game_profile_id=profile.id,
        definition_id=ed.id,
        period_index=1,
        status="pending",
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    db_session.refresh(choice)

    res = client.post(
        f"/api/game/events/{inst.id}/choose",
        json={"choice_id": choice.id},
    )
    assert res.status_code == 200

    db_session.refresh(profile)
    assert float(profile.need_social) == 60.0
    assert float(profile.need_health) == 75.0


def test_pending_events_expose_needs_delta(client, auth_headers, db_session, test_user):
    _patch_template_needs(db_session)
    profile = GameProfile(
        user_id=test_user.id,
        name="evt_preview",
        save_kind="game",
        starter_template_key="mq_game_basic_v1",
        is_active=1,
        cash_balance=1000.0,
        period_index=1,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    ed = EventDefinition(key="test_needs_preview", mode="any", title="Превью", is_active=1, weight=100)
    db_session.add(ed)
    db_session.flush()
    choice = EventChoice(
        definition_id=ed.id,
        title="Вариант",
        effects_json=json.dumps({"needs_delta": {"comfort": 8}}, ensure_ascii=False),
    )
    db_session.add(choice)
    db_session.flush()
    inst = EventInstance(
        game_profile_id=profile.id,
        definition_id=ed.id,
        period_index=1,
        status="pending",
    )
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)

    pending = client.get("/api/game/events/pending", headers=auth_headers)
    assert pending.status_code == 200
    events = pending.json().get("events") or []
    match = next((e for e in events if e.get("id") == inst.id), None)
    assert match is not None
    ch = (match.get("choices") or [])[0]
    assert ch.get("needs_delta", {}).get("comfort") == 8.0


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

