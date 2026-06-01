"""O2 Progressive Guidance — user-level progress, overview, PATCH."""

from app.models import GameProfile, User


def test_overview_includes_guidance_on_fresh_start(client, auth_headers):
    client.post(
        "/api/game/start",
        json={
            "profile_name": "Guidance Fresh",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    ov = client.get("/api/finance/overview", headers=auth_headers)
    assert ov.status_code == 200
    data = ov.json()
    guidance = data.get("guidance") or {}
    assert guidance.get("show_curriculum") is True
    assert guidance.get("beat_id") == "p1_period"


def test_get_and_patch_guidance(client, auth_headers):
    client.post(
        "/api/game/start",
        json={
            "profile_name": "Guidance Patch",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    g0 = client.get("/api/game/guidance", headers=auth_headers)
    assert g0.status_code == 200
    assert g0.json()["show_curriculum"] is True

    r = client.patch(
        "/api/game/guidance",
        json={"action": "advance_read", "beat_id": "p1_period"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    body = r.json()["guidance"]
    assert "p1_period" in (body.get("completed_beats") or [])


def test_skip_all_completes_guidance(client, auth_headers, db_session):
    client.post(
        "/api/game/start",
        json={
            "profile_name": "Guidance Skip",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    r = client.patch(
        "/api/game/guidance",
        json={"action": "skip_all"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["guidance"]["show_curriculum"] is False

    user = db_session.query(User).order_by(User.id.desc()).first()
    assert user is not None
    assert int(user.guidance_completed or 0) == 1

    profile = (
        db_session.query(GameProfile)
        .filter(GameProfile.name == "Guidance Skip")
        .first()
    )
    assert profile.onboarding_state == "brief_done"


def test_new_profile_skips_draft_when_guidance_completed(client, auth_headers, db_session):
    client.post(
        "/api/game/start",
        json={
            "profile_name": "First Game",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    client.patch("/api/game/guidance", json={"action": "skip_all"}, headers=auth_headers)

    r2 = client.post(
        "/api/game/start",
        json={
            "profile_name": "Second Game",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    assert r2.status_code == 200
    profile = (
        db_session.query(GameProfile)
        .filter(GameProfile.name == "Second Game")
        .first()
    )
    assert profile.onboarding_state == "brief_done"


def test_guidance_replay_returns_501(client, auth_headers):
    r = client.post("/api/game/guidance/replay", headers=auth_headers)
    assert r.status_code == 501


def test_dismiss_beat_skips_beat_without_completing_guidance(client, auth_headers, db_session):
    client.post(
        "/api/game/start",
        json={
            "profile_name": "Guidance Dismiss",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    r = client.patch(
        "/api/game/guidance",
        json={"action": "dismiss_beat"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    guidance = r.json()["guidance"]
    assert guidance.get("show_curriculum") is True
    assert "p1_period" in (guidance.get("completed_beats") or [])

    user = db_session.query(User).order_by(User.id.desc()).first()
    assert user is not None
    assert int(user.guidance_completed or 0) == 0


def test_p1_close_body_includes_close_preview(client, auth_headers):
    client.post(
        "/api/game/start",
        json={
            "profile_name": "Guidance Close Preview",
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
        headers=auth_headers,
    )
    for _ in range(3):
        client.patch(
            "/api/game/guidance",
            json={"action": "dismiss_beat"},
            headers=auth_headers,
        )
    ov = client.get("/api/finance/overview", headers=auth_headers)
    guidance = ov.json().get("guidance") or {}
    assert guidance.get("beat_id") == "p1_close"
    body = guidance.get("body") or ""
    assert "Предпросмотр" in body
