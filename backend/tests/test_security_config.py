"""Безопасность конфигурации: SECRET_KEY не может быть заглушкой на проде; вебхук игрока fail-closed."""

from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.config import _DEV_SECRET_KEY, _resolve_secret_key, config, is_production_env


@pytest.mark.parametrize("placeholder", ["", "default-secret-key-change-me", "change-me"])
def test_secret_key_placeholder_refused_in_production(monkeypatch, placeholder):
    monkeypatch.setenv("RENDER", "true")
    monkeypatch.setenv("SECRET_KEY", placeholder)
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        _resolve_secret_key()


def test_secret_key_placeholder_uses_dev_key_locally(monkeypatch):
    monkeypatch.delenv("RENDER", raising=False)
    monkeypatch.delenv("ENVIRONMENT", raising=False)
    monkeypatch.setenv("SECRET_KEY", "change-me")
    assert _resolve_secret_key() == _DEV_SECRET_KEY


def test_secret_key_real_value_kept_in_production(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "a-real-random-key")
    assert is_production_env()
    assert _resolve_secret_key() == "a-real-random-key"


def test_player_webhook_rejects_everything_without_configured_secret(db_session, monkeypatch):
    from app.database import get_db
    from app.routers.telegram import router

    monkeypatch.setattr(config, "PLAYER_TELEGRAM_WEBHOOK_SECRET", "")
    called = []
    monkeypatch.setattr("app.routers.telegram.process_player_update", lambda *a, **k: called.append(a))

    mini = FastAPI()
    mini.include_router(router)
    mini.dependency_overrides[get_db] = lambda: (yield db_session)

    with TestClient(mini) as client:
        resp = client.post(
            "/api/telegram/webhook/player",
            json={"update_id": 1, "message": {"text": "/start", "chat": {"id": 1}, "from": {"id": 1}}},
            headers={"X-Telegram-Bot-Api-Secret-Token": ""},
        )
    assert resp.status_code == 403
    assert called == []
