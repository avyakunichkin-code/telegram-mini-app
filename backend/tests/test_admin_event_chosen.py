"""A4+ — event_chosen в notification_log (log-only)."""

from __future__ import annotations

import json

from app.models import EventChoice, EventDefinition, EventInstance, GameProfile, NotificationLog


def test_choose_event_writes_event_chosen_log(
    client, auth_headers, db_session, test_user
):
    profile = GameProfile(
        user_id=test_user.id,
        name="log_evt",
        save_kind="game",
        starter_template_key="mq_game_basic_v1",
        is_active=1,
        cash_balance=50_000.0,
        period_index=1,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    ed = EventDefinition(
        key="test_event_chosen_log",
        mode="any",
        title="Событие для лога",
        is_active=1,
        weight=100,
    )
    db_session.add(ed)
    db_session.flush()
    choice = EventChoice(
        definition_id=ed.id,
        title="Согласиться",
        effects_json=json.dumps({"cash_delta": 0}, ensure_ascii=False),
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
        headers=auth_headers,
    )
    assert res.status_code == 200

    row = (
        db_session.query(NotificationLog)
        .filter(
            NotificationLog.kind == "event_chosen",
            NotificationLog.game_profile_id == profile.id,
        )
        .order_by(NotificationLog.id.desc())
        .first()
    )
    assert row is not None
    assert row.audience == "admin"
    assert row.telegram_sent == 0
    payload = json.loads(row.payload_json or "{}")
    assert payload.get("event_key") == "test_event_chosen_log"
    assert payload.get("choice_title") == "Согласиться"
