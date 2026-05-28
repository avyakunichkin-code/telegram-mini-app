"""Регрессии A0 Watchtower (code review + TDD)."""

from __future__ import annotations

import pytest

from app.admin.notify import _admin_link, emit_admin_alert
from app.auth import get_password_hash
from app.config import _resolve_admin_web_base_url
from app.models import GameProfile, NotificationLog, User


@pytest.fixture()
def admin_env(test_user, monkeypatch):
    monkeypatch.setenv("ADMIN_USER_IDS", str(test_user.id))
    from app.config import config

    config.ADMIN_USER_IDS = {test_user.id}
    monkeypatch.delenv("OPS_TELEGRAM_BOT_TOKEN", raising=False)
    monkeypatch.delenv("OPS_TELEGRAM_CHAT_ID", raising=False)
    from app import config as config_module

    config_module.config.OPS_TELEGRAM_BOT_TOKEN = ""
    config_module.config.OPS_TELEGRAM_CHAT_ID = ""
    yield test_user


def test_emit_admin_alert_does_not_commit_parent_session_pending(db_session, monkeypatch):
    """Critical: при чужих pending на сессии emit не вызывает commit()."""
    commit_calls: list[int] = []
    original_commit = db_session.commit

    def tracked_commit():
        commit_calls.append(1)
        return original_commit()

    monkeypatch.setattr(db_session, "commit", tracked_commit)
    monkeypatch.setattr(
        "app.admin.notify._send_telegram_message",
        lambda _text: False,
    )

    pending = User(
        username="pending_emit_isolation",
        hashed_password=get_password_hash("secret"),
    )
    db_session.add(pending)

    emit_admin_alert(
        db_session,
        "user_registered",
        {"username": "pending_emit_isolation"},
        dedupe_key="isolation:test",
    )

    assert commit_calls == []
    # Алерт виден в той же транзакции, но после rollback наружу ничего не утекло
    assert (
        db_session.query(NotificationLog)
        .filter(NotificationLog.dedupe_key == "isolation:test")
        .count()
        == 1
    )
    db_session.rollback()
    assert (
        db_session.query(User)
        .filter(User.username == "pending_emit_isolation")
        .count()
        == 0
    )
    assert (
        db_session.query(NotificationLog)
        .filter(NotificationLog.dedupe_key == "isolation:test")
        .count()
        == 0
    )


def test_emit_admin_alert_commits_when_session_clean(db_session, monkeypatch):
    monkeypatch.setattr(
        "app.admin.notify._send_telegram_message",
        lambda _text: False,
    )
    row = emit_admin_alert(
        db_session,
        "game_started",
        {"profile_id": 42},
        game_profile_id=42,
        dedupe_key="clean:commit:1",
    )
    assert row is not None
    assert (
        db_session.query(NotificationLog)
        .filter(NotificationLog.dedupe_key == "clean:commit:1")
        .count()
        == 1
    )


def test_admin_link_inserts_hash_when_base_omits_it(monkeypatch):
    monkeypatch.setenv("ADMIN_WEB_BASE_URL", "https://example.github.io/telegram-mini-app")
    link = _admin_link("/admin?profile=3")
    assert link == "https://example.github.io/telegram-mini-app/#/admin?profile=3"


def test_admin_link_preserves_existing_hash_base(monkeypatch):
    monkeypatch.setenv(
        "ADMIN_WEB_BASE_URL",
        "https://example.github.io/telegram-mini-app/#",
    )
    link = _admin_link("/admin")
    assert link.endswith("#/admin")


def test_watchtower_profile_counts_match_profiles(client, admin_env, auth_headers, db_session):
    user = admin_env
    for idx in range(3):
        db_session.add(
            GameProfile(
                user_id=user.id,
                name=f"P{idx}",
                save_kind="game",
                is_active=0,
            )
        )
    db_session.commit()

    resp = client.get("/api/admin/watchtower?user_limit=50", headers=auth_headers)
    assert resp.status_code == 200
    row = next(u for u in resp.json()["users"] if u["id"] == user.id)
    assert row["profiles_count"] >= 3


def test_dedupe_race_returns_none_without_raising(db_session, monkeypatch):
    monkeypatch.setattr(
        "app.admin.notify._send_telegram_message",
        lambda _text: False,
    )
    first = emit_admin_alert(
        db_session,
        "game_started",
        {"profile_id": 99},
        game_profile_id=99,
        dedupe_key="game_started:99",
    )
    second = emit_admin_alert(
        db_session,
        "game_started",
        {"profile_id": 99},
        game_profile_id=99,
        dedupe_key="game_started:99",
    )
    assert first is not None
    assert second is None
    assert (
        db_session.query(NotificationLog)
        .filter(NotificationLog.dedupe_key == "game_started:99")
        .count()
        == 1
    )
