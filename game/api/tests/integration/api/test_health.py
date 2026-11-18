"""
PR-05: /api/health отражает живость БД HTTP-статусом.

Render (и любой балансировщик) смотрит на код ответа, а не на тело:
мёртвая БД → 503, иначе инстанс считается здоровым и получает трафик.
"""

from __future__ import annotations

import pytest
from sqlalchemy.exc import OperationalError

from app.database import get_db
from main import app


pytestmark = pytest.mark.integration


class _DeadSession:
    def execute(self, *_args, **_kwargs):
        raise OperationalError("SELECT 1", {}, Exception("connection refused: secret-host:5432"))


class TestHealth:
    def test_db_alive_returns_200(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "ok"
        assert body["database"] == "connected"

    def test_db_dead_returns_503_without_leaking_error(self, client):
        def dead_db():
            yield _DeadSession()

        app.dependency_overrides[get_db] = dead_db
        r = client.get("/api/health")
        assert r.status_code == 503
        body = r.json()
        assert body["status"] == "error"
        assert body["database"] == "unavailable"
        # Текст исключения (хост, DSN) наружу не отдаём — только в лог.
        assert "secret-host" not in r.text
