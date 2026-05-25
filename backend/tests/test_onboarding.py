"""Онбординг: draft на старте, PATCH profile/onboarding."""

from app.models import GameProfile


def test_game_start_sets_onboarding_draft(client, auth_headers, db_session):
    r = client.post(
        "/api/game/start",
        json={
            "profile_name": "Onboard Test",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    assert r.status_code == 200
    profile = (
        db_session.query(GameProfile)
        .filter(GameProfile.name == "Onboard Test")
        .order_by(GameProfile.id.desc())
        .first()
    )
    assert profile is not None
    assert profile.onboarding_state == "draft"
    assert profile.onboarding_step == "period_timer"


def test_patch_onboarding_started(client, auth_headers, db_session):
    client.post(
        "/api/game/start",
        json={
            "profile_name": "Onboard Started",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    r = client.patch(
        "/api/game/profile/onboarding",
        json={"onboarding_state": "started", "onboarding_step": "period_timer"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["onboarding_state"] == "started"
    assert data["onboarding_step"] == "period_timer"


def test_patch_onboarding_brief_done(client, auth_headers, db_session):
    client.post(
        "/api/game/start",
        json={
            "profile_name": "Onboard Patch",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    r = client.patch(
        "/api/game/profile/onboarding",
        json={"onboarding_state": "brief_done", "onboarding_step": "farewell"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["onboarding_state"] == "brief_done"
    assert data["onboarding_step"] == "farewell"

    ov = client.get("/api/finance/overview", headers=auth_headers)
    assert ov.status_code == 200
    assert ov.json()["onboarding_state"] == "brief_done"
