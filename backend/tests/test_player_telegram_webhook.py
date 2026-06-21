"""PLT-202…204: player Telegram webhook."""

from __future__ import annotations

from datetime import datetime

import pytest

from app.auth import get_password_hash
from app.config import resolve_player_web_app_url
from app.models import NotificationLog, User
from app.telegram.player_webhook import process_player_update


def _start_update(
    *,
    telegram_user_id: int = 42,
    chat_id: int = 99,
    username: str = "tester",
) -> dict:
    return {
        "update_id": 1,
        "message": {
            "message_id": 10,
            "from": {"id": telegram_user_id, "username": username, "is_bot": False},
            "chat": {"id": chat_id, "type": "private"},
            "text": "/start",
        },
    }


def test_resolve_player_web_app_url_hash_router(monkeypatch):
    monkeypatch.setenv("PUBLIC_APP_URL", "https://app.example.com/#")
    from app import config as config_module

    config_module.config.PUBLIC_APP_URL = "https://app.example.com/#"
    config_module.config.ADMIN_WEB_BASE_URL = config_module._resolve_admin_web_base_url()
    assert resolve_player_web_app_url() == "https://app.example.com/#/"


def test_start_links_chat_id_and_logs(db_session, monkeypatch):
    user = User(
        username="tg_user",
        hashed_password=get_password_hash("secret"),
        telegram_id=42,
    )
    db_session.add(user)
    db_session.commit()

    sent: list[tuple] = []

    def _mock_send(chat_id, text, *, reply_markup=None):
        sent.append((chat_id, text, reply_markup))
        return True

    monkeypatch.setattr("app.telegram.player_webhook.send_player_message", _mock_send)

    process_player_update(db_session, _start_update())

    db_session.refresh(user)
    assert user.telegram_chat_id == 99
    assert user.telegram_started_at is not None
    assert isinstance(user.telegram_started_at, datetime)

    log = (
        db_session.query(NotificationLog)
        .filter(NotificationLog.kind == "player_bot_started")
        .one()
    )
    assert log.user_id == user.id

    assert len(sent) == 1
    chat_id, text, markup = sent[0]
    assert chat_id == 99
    assert "Монетка" in text
    assert markup["inline_keyboard"][0][0]["text"] == "Играть"
    assert "web_app" in markup["inline_keyboard"][0][0]
    assert markup["inline_keyboard"][0][0]["web_app"]["url"].endswith("/#/")


def test_start_unknown_telegram_still_welcomes(db_session, monkeypatch):
    sent: list[int] = []

    def _mock_send(chat_id, text, *, reply_markup=None):
        sent.append(chat_id)
        return True

    monkeypatch.setattr("app.telegram.player_webhook.send_player_message", _mock_send)

    process_player_update(db_session, _start_update(telegram_user_id=777, chat_id=888))

    assert sent == [888]
    logs = db_session.query(NotificationLog).filter(NotificationLog.kind == "player_bot_started").all()
    assert len(logs) == 1
    assert logs[0].user_id is None


def test_help_sends_help_text(db_session, monkeypatch):
    sent: list[str] = []

    def _mock_send(chat_id, text, *, reply_markup=None):
        sent.append(text)
        return True

    monkeypatch.setattr("app.telegram.player_webhook.send_player_message", _mock_send)

    process_player_update(
        db_session,
        {
            "message": {
                "chat": {"id": 1},
                "text": "/help",
            }
        },
    )

    assert len(sent) == 1
    assert "/start" in sent[0]


def test_webhook_rejects_bad_secret(db_session, monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.database import get_db
    from app.routers.telegram import router

    monkeypatch.setenv("PLAYER_TELEGRAM_WEBHOOK_SECRET", "top-secret")
    from app.config import config

    config.PLAYER_TELEGRAM_WEBHOOK_SECRET = "top-secret"

    mini = FastAPI()
    mini.include_router(router)

    def _db():
        yield db_session

    mini.dependency_overrides[get_db] = _db

    with TestClient(mini) as test_client:
        resp = test_client.post("/api/telegram/webhook/player", json=_start_update())
    assert resp.status_code == 403


def test_webhook_accepts_update_with_secret(db_session, monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.database import get_db
    from app.routers.telegram import router

    monkeypatch.setenv("PLAYER_TELEGRAM_WEBHOOK_SECRET", "top-secret")
    from app.config import config

    config.PLAYER_TELEGRAM_WEBHOOK_SECRET = "top-secret"
    monkeypatch.setattr("app.telegram.player_webhook.send_player_message", lambda *a, **k: True)

    mini = FastAPI()
    mini.include_router(router)

    def _db():
        yield db_session

    mini.dependency_overrides[get_db] = _db

    with TestClient(mini) as test_client:
        resp = test_client.post(
            "/api/telegram/webhook/player",
            json=_start_update(),
            headers={"X-Telegram-Bot-Api-Secret-Token": "top-secret"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"ok": "true"}
