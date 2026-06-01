"""Admin quick wins AQ-01…AQ-07."""

from __future__ import annotations

from app.game.period import _apply_defeat_to_profile
from app.models import GameProfile, PlayerRunFeedback
from tests.fixtures.game import create_game_profile


def test_metrics_summary_defeats_and_feedback(client, admin_env, auth_headers, db_session, test_user):
    profile = create_game_profile(
        db_session,
        user_id=test_user.id,
        name="Defeated",
        starter_template_key="student",
    )
    _apply_defeat_to_profile(profile)
    db_session.add(
        PlayerRunFeedback(
            user_id=test_user.id,
            game_profile_id=profile.id,
            outcome="defeat",
            template_key="student",
            period_index=3,
            defeat_reason="cash_negative_streak",
            comment="Сложно",
        )
    )
    db_session.commit()

    resp = client.get("/api/admin/metrics/summary?days=7", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["defeats_total"] >= 1
    assert data["defeats_recent"] >= 1
    assert data["run_feedback_recent"] >= 1


def test_watchtower_profile_filter_defeat(client, admin_env, auth_headers, db_session, test_user):
    profile = create_game_profile(
        db_session,
        user_id=test_user.id,
        name="Loss run",
        starter_template_key="student",
    )
    _apply_defeat_to_profile(profile)
    db_session.commit()

    resp = client.get(
        "/api/admin/watchtower?profile_filter=defeat&profile_limit=20",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    profiles = resp.json()["profiles"]
    assert profiles
    assert all(p["run_outcome"] == "defeat" for p in profiles)
    assert profiles[0]["is_archived"] is True
    assert profiles[0]["run_outcome_label"] == "Поражение"


def test_profile_inspector_latest_run_feedback(
    client, admin_env, auth_headers, db_session, test_user
):
    profile = create_game_profile(
        db_session,
        user_id=test_user.id,
        name="Feedback profile",
        starter_template_key="student",
    )
    db_session.add(
        PlayerRunFeedback(
            user_id=test_user.id,
            game_profile_id=profile.id,
            outcome="victory",
            template_key="student",
            period_index=7,
            comment="Отличная игра",
        )
    )
    db_session.commit()

    resp = client.get(f"/api/admin/profiles/{profile.id}", headers=auth_headers)
    assert resp.status_code == 200
    fb = resp.json()["latest_run_feedback"]
    assert fb is not None
    assert fb["outcome"] == "victory"
    assert fb["comment"] == "Отличная игра"


def test_export_profiles_csv(client, admin_env, auth_headers):
    resp = client.get("/api/admin/export/profiles.csv?limit=10", headers=auth_headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")
    body = resp.text
    assert "id,user_id,username" in body.splitlines()[0]


def test_export_run_feedback_csv(client, admin_env, auth_headers, db_session, test_user):
    profile = create_game_profile(
        db_session,
        user_id=test_user.id,
        name="CSV fb",
        starter_template_key="student",
    )
    db_session.add(
        PlayerRunFeedback(
            user_id=test_user.id,
            game_profile_id=profile.id,
            outcome="defeat",
            comment="export me",
        )
    )
    db_session.commit()

    resp = client.get("/api/admin/export/run-feedback.csv", headers=auth_headers)
    assert resp.status_code == 200
    assert "export me" in resp.text
