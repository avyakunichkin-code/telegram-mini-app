"""Guidance-хуки внутри чужих транзакций (выбор события, закрытие периода) и контракт PATCH."""

from __future__ import annotations

import json

from app.models import EventChoice, EventDefinition, EventInstance, GameProfile, User


def _start_game(client, auth_headers, name: str) -> None:
    res = client.post(
        "/api/game/start",
        json={"profile_name": name, "save_kind": "game", "template_key": "mq_game_basic_v1"},
        headers=auth_headers,
    )
    assert res.status_code == 200, res.text


def _active_profile(db_session, name: str) -> GameProfile:
    return db_session.query(GameProfile).filter(GameProfile.name == name).one()


def _pending_event(db_session, profile: GameProfile, key: str) -> tuple[EventInstance, EventChoice]:
    ed = EventDefinition(key=key, mode="any", title="Событие", is_active=1, weight=100)
    db_session.add(ed)
    db_session.flush()
    choice = EventChoice(
        definition_id=ed.id,
        title="Ок",
        effects_json=json.dumps({"cash_delta": 0}),
    )
    db_session.add(choice)
    db_session.flush()
    inst = EventInstance(
        game_profile_id=profile.id,
        definition_id=ed.id,
        period_index=int(profile.period_index),
        status="pending",
    )
    db_session.add(inst)
    db_session.commit()
    return inst, choice


def _break_session_with_flush_error(db, user_id: int) -> None:
    """Дубликат username → IntegrityError на flush: без savepoint сессия остаётся в failed-состоянии."""
    existing = db.query(User).filter(User.id == user_id).one()
    db.add(User(username=existing.username, hashed_password="x"))
    db.flush()


def test_patch_guidance_unknown_action_returns_400(client, auth_headers):
    _start_game(client, auth_headers, "Guidance Unknown Action")
    res = client.patch("/api/game/guidance", json={"action": "teleport"}, headers=auth_headers)
    assert res.status_code == 400
    assert "teleport" in res.json()["detail"]


def test_event_chosen_updates_guidance_in_same_transaction(client, auth_headers, db_session, test_user):
    _start_game(client, auth_headers, "Guidance Event Chosen")
    profile = _active_profile(db_session, "Guidance Event Chosen")
    inst, choice = _pending_event(db_session, profile, "test_guidance_event_chosen")

    res = client.post(
        f"/api/game/events/{inst.id}/choose", json={"choice_id": choice.id}, headers=auth_headers
    )
    assert res.status_code == 200, res.text

    db_session.expire_all()
    progress = json.loads(db_session.get(User, test_user.id).guidance_progress_json or "{}")
    assert progress.get("events_chosen_p2") == 1
    assert "t_events_intro" in progress.get("completed_triggers", [])


def test_event_chosen_guidance_db_error_does_not_break_choice(
    client, auth_headers, db_session, test_user, monkeypatch
):
    _start_game(client, auth_headers, "Guidance Event Broken")
    profile = _active_profile(db_session, "Guidance Event Broken")
    inst, choice = _pending_event(db_session, profile, "test_guidance_event_broken")

    def broken_hook(db, user_id, profile):
        _break_session_with_flush_error(db, user_id)

    monkeypatch.setattr("app.guidance.engine.on_event_chosen", broken_hook)

    res = client.post(
        f"/api/game/events/{inst.id}/choose", json={"choice_id": choice.id}, headers=auth_headers
    )
    assert res.status_code == 200, res.text
    db_session.expire_all()
    assert db_session.get(EventInstance, inst.id).status == "selected"


def test_period_close_guidance_db_error_does_not_break_close(
    client, auth_headers, db_session, monkeypatch
):
    _start_game(client, auth_headers, "Guidance Close Broken")
    profile = _active_profile(db_session, "Guidance Close Broken")
    start_index = int(profile.period_index)

    def broken_hook(db, user_id, profile, closed_period_index):
        _break_session_with_flush_error(db, user_id)

    monkeypatch.setattr("app.guidance.engine.on_period_closed_guidance", broken_hook)

    res = client.post("/api/game/time/next", headers=auth_headers)
    assert res.status_code == 200, res.text
    db_session.expire_all()
    assert int(db_session.get(GameProfile, profile.id).period_index) == start_index + 1


def _set_progress_all_done_except_farewell_dismissed(db_session, user_id: int) -> None:
    """Spine пройден, все триггеры (включая t_farewell) закрыты — но guidance_completed ещё 0."""
    from app.guidance.curriculum import SPINE_BEAT_IDS
    from app.guidance.triggers import TRIGGER_IDS

    user = db_session.get(User, user_id)
    user.guidance_progress_json = json.dumps(
        {"completed_beats": sorted(SPINE_BEAT_IDS), "completed_triggers": sorted(TRIGGER_IDS)}
    )
    db_session.commit()


def _brief_done_alerts(db_session) -> int:
    from app.models import NotificationLog

    return db_session.query(NotificationLog).filter(NotificationLog.kind == "onboarding_brief_done").count()


def test_get_guidance_does_not_complete_onboarding(client, auth_headers, db_session, test_user):
    """Решение PO (вариант A): GET только читает — без complete_guidance и ops-алерта."""
    _start_game(client, auth_headers, "Guidance Get Readonly")
    _set_progress_all_done_except_farewell_dismissed(db_session, test_user.id)

    for url in ("/api/game/guidance", "/api/finance/overview"):
        assert client.get(url, headers=auth_headers).status_code == 200

    db_session.expire_all()
    assert int(db_session.get(User, test_user.id).guidance_completed or 0) == 0
    assert _brief_done_alerts(db_session) == 0


def test_dismiss_farewell_completes_onboarding_in_patch(client, auth_headers, db_session, test_user):
    from app.guidance.curriculum import SPINE_BEAT_IDS
    from app.guidance.triggers import TRIGGER_IDS

    _start_game(client, auth_headers, "Guidance Farewell Dismiss")
    user = db_session.get(User, test_user.id)
    user.guidance_progress_json = json.dumps(
        {
            "completed_beats": sorted(SPINE_BEAT_IDS),
            "completed_triggers": sorted(TRIGGER_IDS - {"t_farewell"}),
        }
    )
    db_session.commit()

    res = client.patch(
        "/api/game/guidance",
        json={"action": "dismiss_beat", "beat_id": "t_farewell"},
        headers=auth_headers,
    )

    assert res.status_code == 200, res.text
    db_session.expire_all()
    assert int(db_session.get(User, test_user.id).guidance_completed or 0) == 1
    assert _active_profile(db_session, "Guidance Farewell Dismiss").onboarding_state == "brief_done"
    assert _brief_done_alerts(db_session) == 1
