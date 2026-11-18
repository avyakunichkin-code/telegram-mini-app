import json

from app.models import EventChoice, EventDefinition, EventInstance, GameProfile
from app.routers.events import (
    _needs_config_for_profile,
    _order_events_recommended_first,
    serialize_instance_rows,
)
from app.events.taxonomy import build_metadata_json


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
        "initial": {"comfort": 72, "status": 48, "social": 58, "health": 76},
        "periods_to_empty_target": 12,
        "thresholds": {"low": 40, "distressed": 30},
        "player_support": {"proactive_hints": True, "rescue_event_bias": 1.2},
        "treat_self": {"cooldown_periods": 15, "options": []},
    }
    row.blueprint_json = json.dumps(bp, ensure_ascii=False)
    db_session.commit()


def test_order_events_recommended_first():
    events = [
        {"id": 1, "title": "A"},
        {"id": 2, "title": "B", "recommended": True},
        {"id": 3, "title": "C"},
        {"id": 4, "title": "D", "recommended": True},
    ]
    ordered = _order_events_recommended_first(events)
    assert [e["id"] for e in ordered] == [2, 4, 1, 3]


def test_recommended_flag_and_sort_in_pending_payload(db_session, test_user, seed_basic_template):
    _patch_template_needs(db_session)
    profile = GameProfile(
        user_id=test_user.id,
        name="RescueRec",
        save_kind="game",
        starter_template_key="mq_game_basic_v1",
        is_active=1,
        cash_balance=1000.0,
        period_index=3,
        need_comfort=60.0,
        need_status=55.0,
        need_social=12.0,
        need_health=58.0,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    rescue_meta = json.dumps(
        build_metadata_json(
            event_domain="social_family",
            scenario_shape="rescue",
            extra={"is_rescue": True, "rescue_axes": ["social"]},
        ),
        ensure_ascii=False,
    )
    other_meta = json.dumps(
        build_metadata_json(event_domain="consumption", scenario_shape="soft_offer"),
        ensure_ascii=False,
    )

    rescue_def = EventDefinition(
        key="test_rescue_rec",
        mode="any",
        title="Rescue test",
        description="",
        weight=100,
        is_active=1,
        metadata_json=rescue_meta,
    )
    other_def = EventDefinition(
        key="test_other_rec",
        mode="any",
        title="Other test",
        description="",
        weight=100,
        is_active=1,
        metadata_json=other_meta,
    )
    db_session.add_all([rescue_def, other_def])
    db_session.flush()

    for defn in (rescue_def, other_def):
        db_session.add(
            EventChoice(
                definition_id=defn.id,
                title="OK",
                effects_json=json.dumps({"cash_delta": 0, "needs_delta": {"social": 5}}, ensure_ascii=False),
            )
        )
    db_session.flush()

    # other created first -> would be first without sort
    inst_other = EventInstance(
        game_profile_id=profile.id,
        definition_id=other_def.id,
        period_index=3,
        status="pending",
    )
    inst_rescue = EventInstance(
        game_profile_id=profile.id,
        definition_id=rescue_def.id,
        period_index=3,
        status="pending",
    )
    db_session.add_all([inst_other, inst_rescue])
    db_session.commit()

    needs_cfg = _needs_config_for_profile(db_session, profile)
    events = _order_events_recommended_first(
        serialize_instance_rows(
            db_session,
            [inst_other, inst_rescue],
            profile=profile,
            needs_cfg=needs_cfg,
        )
    )
    assert len(events) == 2
    assert events[0]["recommended"] is True
    assert events[0]["recommended_for_need"] == "Связи"
    assert events[0]["key"] == "test_rescue_rec"
    assert events[1].get("recommended") is not True


def test_rescue_events_exposed_in_pending(client, auth_headers, db_session, seed_basic_template):
    _patch_template_needs(db_session)
    start = client.post(
        "/api/game/start",
        headers=auth_headers,
        json={"profile_name": "Rescue", "save_kind": "game", "template_key": "mq_game_basic_v1"},
    )
    assert start.status_code == 200

    pending = client.get("/api/game/events/pending", headers=auth_headers)
    assert pending.status_code == 200
    body = pending.json()
    assert "events" in body
    assert isinstance(body["events"], list)
