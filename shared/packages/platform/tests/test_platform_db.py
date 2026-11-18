import ast
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import text

from tvoy_platform.db import Database, normalize_url
from tvoy_platform.health import health_router
from tvoy_platform.migrations import migrate

SRC = Path(__file__).resolve().parents[1] / "src" / "tvoy_platform"


def test_session_commits_and_rolls_back():
    db = Database("sqlite://")
    with db.session() as s:
        s.execute(text("CREATE TABLE t (v INTEGER)"))
        s.execute(text("INSERT INTO t VALUES (1)"))
    with pytest.raises(RuntimeError):
        with db.session() as s:
            s.execute(text("INSERT INTO t VALUES (2)"))
            raise RuntimeError
    with db.session() as s:
        assert s.execute(text("SELECT COUNT(*) FROM t")).scalar() == 1


def test_postgres_url_uses_psycopg3():
    assert normalize_url("postgres://u:p@h/db") == "postgresql+psycopg://u:p@h/db"
    assert normalize_url("postgresql://u:p@h/db") == "postgresql+psycopg://u:p@h/db"
    assert normalize_url("sqlite://") == "sqlite://"


def test_migrate_applies_in_order_once(tmp_path):
    (tmp_path / "0002_add.sql").write_text("ALTER TABLE a ADD COLUMN b INTEGER", encoding="utf-8")
    (tmp_path / "0001_init.sql").write_text("CREATE TABLE a (id INTEGER);\nCREATE INDEX ix_a ON a (id);", encoding="utf-8")
    (tmp_path / "README.md").write_text("не миграция", encoding="utf-8")
    db = Database("sqlite://")
    assert migrate(db.engine, tmp_path) == ["0001_init.sql", "0002_add.sql"]
    assert migrate(db.engine, tmp_path) == []
    with db.session() as s:
        s.execute(text("INSERT INTO a (id, b) VALUES (1, 2)"))


def test_migrate_rejects_duplicate_numbers(tmp_path):
    (tmp_path / "0001_a.sql").write_text("SELECT 1", encoding="utf-8")
    (tmp_path / "0001_b.sql").write_text("SELECT 1", encoding="utf-8")
    with pytest.raises(ValueError):
        migrate(Database("sqlite://").engine, tmp_path)


def test_health_200_and_503():
    alive = Database("sqlite://")
    app = FastAPI()
    app.include_router(health_router(alive, "demo", mode="test"))
    r = TestClient(app).get("/api/health")
    assert r.status_code == 200 and r.json()["database"] == "connected" and r.json()["mode"] == "test"

    dead = Database("sqlite:///" + str(Path("/nonexistent-dir/x/y.db")))
    app2 = FastAPI()
    app2.include_router(health_router(dead, "demo"))
    r = TestClient(app2).get("/api/health")
    assert r.status_code == 503 and r.json()["database"] == "unavailable"
    assert "nonexistent" not in r.text


def test_platform_knows_no_domains():
    """ADR-016 п.4: platform не импортирует ни игру, ни Plan, ни ядро."""
    forbidden = {"app", "plan_api", "fincore"}
    for path in SRC.glob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            names = []
            if isinstance(node, ast.Import):
                names = [a.name for a in node.names]
            elif isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
                names = [node.module]
            for name in names:
                assert name.split(".")[0] not in forbidden, f"{path.name}: import {name}"
