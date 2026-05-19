"""A0 Watchtower: admin API, dedupe, emit."""

from __future__ import annotations

import os

import pytest

from app.admin_notify import _admin_link, emit_admin_alert
from app.config import _resolve_admin_web_base_url
from app.models import NotificationLog


def test_admin_web_base_url_render_default(monkeypatch):
    monkeypatch.delenv("ADMIN_WEB_BASE_URL", raising=False)
    monkeypatch.delenv("PUBLIC_APP_URL", raising=False)
    monkeypatch.setenv("DATABASE_URL", "postgresql://x@dpg-xxx.render.com/db")
    assert "github.io" in _resolve_admin_web_base_url()
    assert "localhost" not in _resolve_admin_web_base_url()


def test_admin_link_uses_hash_router(monkeypatch):
    monkeypatch.setenv("ADMIN_WEB_BASE_URL", "https://example.github.io/telegram-mini-app/#")
    link = _admin_link("/admin?profile=7")
    assert link == "https://example.github.io/telegram-mini-app/#/admin?profile=7"


def test_emit_admin_alert_dedupe(db_session):
    os.environ.setdefault("SECRET_KEY", "test")
    first = emit_admin_alert(
        db_session,
        "user_registered",
        {"username": "a"},
        user_id=1,
        dedupe_key="user_registered:1",
    )
    second = emit_admin_alert(
        db_session,
        "user_registered",
        {"username": "a"},
        user_id=1,
        dedupe_key="user_registered:1",
    )
    assert first is not None
    assert second is None
    assert db_session.query(NotificationLog).count() == 1


def test_admin_watchtower_forbidden(client, auth_headers, monkeypatch):
    monkeypatch.setenv("ADMIN_USER_IDS", "")
    from app.config import config

    config.ADMIN_USER_IDS = set()
    resp = client.get("/api/admin/watchtower", headers=auth_headers)
    assert resp.status_code == 403


def test_admin_watchtower_ok(client, admin_env, auth_headers):
    token_headers = auth_headers
    resp = client.get("/api/admin/watchtower", headers=token_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    assert "profiles" in data
    assert "notifications" in data
    assert "onboarding_funnel" in data
    assert len(data["onboarding_funnel"]["steps"]) == 5
    usernames = [u["username"] for u in data["users"]]
    assert admin_env.username in usernames


def test_register_emits_admin_notification(client, db_session, monkeypatch):
    monkeypatch.setenv("ADMIN_USER_IDS", "99999")
    from app.config import config

    config.ADMIN_USER_IDS = set()
    resp = client.post(
        "/api/register",
        json={
            "username": "watchtower_new",
            "password": "secret123",
            "password_confirm": "secret123",
            "email": "wt@example.com",
        },
    )
    assert resp.status_code == 200
    row = (
        db_session.query(NotificationLog)
        .filter(NotificationLog.kind == "user_registered")
        .order_by(NotificationLog.id.desc())
        .first()
    )
    assert row is not None
    assert row.audience == "admin"
