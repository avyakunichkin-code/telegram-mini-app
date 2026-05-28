"""Ops-аналитика онбординга: PATCH + emit + funnel."""

from app.admin.notify import emit_admin_alert
from app.admin.onboarding_funnel import build_onboarding_funnel
from app.models import GameProfile, NotificationLog


def test_patch_onboarding_emits_step_and_brief_done(client, auth_headers, db_session):
    client.post(
        "/api/game/start",
        json={
            "profile_name": "Onboard Ops",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    r = client.patch(
        "/api/game/profile/onboarding",
        json={"onboarding_step": "salary"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["onboarding_step"] == "salary"

    logs = (
        db_session.query(NotificationLog)
        .filter(NotificationLog.kind == "onboarding_step_reached")
        .all()
    )
    assert len(logs) >= 1
    assert all(l.telegram_sent == 0 for l in logs)

    r2 = client.patch(
        "/api/game/profile/onboarding",
        json={"onboarding_state": "brief_done", "onboarding_step": "farewell"},
        headers=auth_headers,
    )
    assert r2.status_code == 200
    done = (
        db_session.query(NotificationLog)
        .filter(NotificationLog.kind == "onboarding_brief_done")
        .count()
    )
    assert done == 1


def test_onboarding_skip_count_emits(client, auth_headers, db_session):
    client.post(
        "/api/game/start",
        json={
            "profile_name": "Skip Ops",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    r = client.patch(
        "/api/game/profile/onboarding",
        json={"onboarding_skip_count": 2, "onboarding_state": "brief_done"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    skipped = (
        db_session.query(NotificationLog)
        .filter(NotificationLog.kind == "onboarding_skipped")
        .count()
    )
    assert skipped == 1


def test_watchtower_includes_funnel(client, admin_env, auth_headers):
    r = client.get("/api/admin/watchtower", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "onboarding_funnel" in data
    assert "steps" in data["onboarding_funnel"]
    assert len(data["onboarding_funnel"]["steps"]) == 5


def test_build_onboarding_funnel_empty(db_session):
    funnel = build_onboarding_funnel(db_session)
    assert funnel["draft_profiles"] == 0
    assert len(funnel["steps"]) == 5


def test_step_reached_no_telegram(db_session, monkeypatch):
    sent = []

    def fake_send(text):
        sent.append(text)
        return True

    monkeypatch.setattr("app.admin.notify._send_telegram_message", fake_send)

    profile = GameProfile(
        user_id=1,
        name="T",
        save_kind="game",
        is_active=1,
        period_index=1,
        cash_balance=0,
        onboarding_state="draft",
        onboarding_step="salary",
    )
    db_session.add(profile)
    db_session.commit()

    emit_admin_alert(
        db_session,
        "onboarding_step_reached",
        {"step": "salary"},
        game_profile_id=profile.id,
        dedupe_key="test:step:salary",
        send_telegram=False,
    )
    assert sent == []
