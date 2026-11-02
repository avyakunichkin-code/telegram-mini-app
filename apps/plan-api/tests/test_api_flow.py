"""API plan-api на БД `plan`: путь чекапа, вход по коду, изоляция, удаление, границы (SPEC_plan-v1 CS-1, CS-7…CS-9)."""

from __future__ import annotations

import ast
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from plan_api.main import CONSENT_VERSION, create_app
from plan_api.repo import Repo
from plan_api.settings import MIGRATIONS, Settings
from tvoy_platform.db import Database
from tvoy_platform.migrations import migrate

QUICK = {
    "income": {"min": 150_000, "max": 180_000},
    "must_expenses": {"min": 90_000, "max": 110_000},
    "debt_payments": {"min": 20_000, "max": 20_000},
    "savings": {"min": 100_000, "max": 150_000},
    "children": 1,
}


@pytest.fixture()
def app():
    return create_app(Settings(database_url="sqlite://"))


@pytest.fixture()
def client(app):
    return TestClient(app)


def login(client: TestClient, email: str) -> dict:
    code = client.post("/api/auth/email/request-code", json={"email": email}).json()["dev_code"]
    r = client.post("/api/auth/email/verify", json={"email": email, "code": code, "consent_version": CONSENT_VERSION})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def rows(app, sql: str, **params) -> list:
    with app.state.db.session() as s:
        return s.execute(text(sql), params).all()


def test_cs1_quick_then_complete(client):
    h = login(client, "a@example.com")
    ck = client.post("/api/checkups", json={"entry_question": "resilience"}, headers=h).json()
    r = client.post(f"/api/checkups/{ck['id']}/quick", json=QUICK, headers=h)
    assert r.status_code == 200, r.text
    assert sum(m["role"] == "child" for m in r.json()["members"]) == 1
    draft = client.get(f"/api/checkups/{ck['id']}/report", headers=h).json()
    assert draft["final"] is False and draft["precision"] == "draft"
    assert len(draft["areas"]) == 4 and len(draft["scenarios"]) == 4
    final = client.post(f"/api/checkups/{ck['id']}/complete", headers={**h, "Idempotency-Key": "k1"}).json()
    assert final["final"] is True and len(final["steps"]) == 3
    again = client.post(f"/api/checkups/{ck['id']}/complete", headers={**h, "Idempotency-Key": "k1"}).json()
    assert again["steps"][0]["id"] == final["steps"][0]["id"]
    assert client.post(f"/api/checkups/{ck['id']}/complete", headers={**h, "Idempotency-Key": "k2"}).status_code == 409
    step = client.patch(f"/api/steps/{final['steps'][0]['id']}", json={"status": "done"}, headers=h).json()
    assert step["status"] == "done"
    saved = client.get(f"/api/checkups/{ck['id']}/report", headers=h).json()
    assert saved["steps"][0]["status"] == "done"
    assert client.get("/api/dev/funnel").json()["step_done"] == 1


def test_data_survives_restart(tmp_path):
    """Хранилище — БД, а не память процесса: новый процесс видит чекап."""
    settings = Settings(database_url=f"sqlite:///{tmp_path / 'plan.db'}")
    c1 = TestClient(create_app(settings))
    h = login(c1, "persist@example.com")
    ck = c1.post("/api/checkups", json={"entry_question": "overview"}, headers=h).json()
    c1.post(f"/api/checkups/{ck['id']}/quick", json=QUICK, headers=h)
    c2 = TestClient(create_app(settings))
    got = c2.get(f"/api/checkups/{ck['id']}", headers=h)
    assert got.status_code == 200 and got.json()["data"]["incomes"]


def test_completed_checkup_is_read_only_and_recheck_copies(client):
    h = login(client, "b@example.com")
    ck = client.post("/api/checkups", json={"entry_question": "overview"}, headers=h).json()
    client.post(f"/api/checkups/{ck['id']}/demo", headers=h)
    client.post(f"/api/checkups/{ck['id']}/complete", headers=h)
    assert client.put(f"/api/checkups/{ck['id']}/sections/goals", json=[], headers=h).status_code == 409
    nxt = client.post("/api/checkups", json={"entry_question": "goal"}, headers=h).json()
    assert nxt["parent_checkup_id"] == ck["id"] and nxt["data"]["incomes"]


def test_section_validation(client):
    h = login(client, "c@example.com")
    ck = client.post("/api/checkups", json={"entry_question": "overview"}, headers=h).json()
    bad = [{"member_id": "m_me", "amount": {"min": 10, "max": 5}}]
    assert client.put(f"/api/checkups/{ck['id']}/sections/incomes", json=bad, headers=h).status_code == 422
    unknown = [{"member_id": "nobody", "amount": {"min": 5, "max": 10}}]
    assert client.put(f"/api/checkups/{ck['id']}/sections/incomes", json=unknown, headers=h).status_code == 422


# --- вход по коду -----------------------------------------------------------------------------


def test_consent_required_for_new_user_and_logged(app, client):
    code = client.post("/api/auth/email/request-code", json={"email": "d@example.com"}).json()["dev_code"]
    r = client.post("/api/auth/email/verify", json={"email": "d@example.com", "code": code})
    assert r.status_code == 400 and r.json()["error"]["code"] == "consent_required"
    r = client.post("/api/auth/email/verify", json={"email": "d@example.com", "code": code, "consent_version": CONSENT_VERSION})
    assert r.status_code == 200
    assert rows(app, "SELECT consent_version FROM consent_log") == [(CONSENT_VERSION,)]


def test_code_is_mailed_hashed_and_single_use(app, client):
    client.post("/api/auth/email/request-code", json={"email": "Mail@Example.com"})
    email, code = app.state.mailer.sent[-1]
    assert email == "mail@example.com"
    stored = rows(app, "SELECT code_hash FROM email_codes")[0][0]
    assert code not in stored and len(stored) == 64
    body = {"email": email, "code": code, "consent_version": CONSENT_VERSION}
    assert client.post("/api/auth/email/verify", json=body).status_code == 200
    assert client.post("/api/auth/email/verify", json=body).status_code == 400


def test_code_attempts_and_ttl(app, client):
    code = client.post("/api/auth/email/request-code", json={"email": "f@example.com"}).json()["dev_code"]
    wrong = "000000" if code != "000000" else "111111"
    for _ in range(5):
        assert client.post("/api/auth/email/verify", json={"email": "f@example.com", "code": wrong}).status_code == 400
    ok = {"email": "f@example.com", "code": code, "consent_version": CONSENT_VERSION}
    assert client.post("/api/auth/email/verify", json=ok).status_code == 400  # 5 попыток исчерпаны

    code = client.post("/api/auth/email/request-code", json={"email": "g@example.com"}).json()["dev_code"]
    with app.state.db.session() as s:
        s.execute(text("UPDATE email_codes SET expires_at = '2000-01-01T00:00:00+00:00'"))
    ok = {"email": "g@example.com", "code": code, "consent_version": CONSENT_VERSION}
    assert client.post("/api/auth/email/verify", json=ok).status_code == 400


def test_code_rate_limit_per_email(client):
    for _ in range(3):
        assert client.post("/api/auth/email/request-code", json={"email": "h@example.com"}).status_code == 200
    r = client.post("/api/auth/email/request-code", json={"email": "h@example.com"})
    assert r.status_code == 429 and r.json()["error"]["code"] == "too_many_requests"


def test_production_hides_dev_code_and_dev_routes(tmp_path):
    url = f"sqlite:///{tmp_path / 'prod.db'}"
    migrate(Database(url).engine, MIGRATIONS)
    client = TestClient(create_app(Settings(env="production", database_url=url, secret_key="p" * 40)))
    r = client.post("/api/auth/email/request-code", json={"email": "p@example.com"})
    assert r.status_code == 200 and "dev_code" not in r.json()
    assert client.get("/api/dev/funnel").status_code == 404
    assert client.get("/api/health").json()["env"] == "production"


def test_production_without_migrations_has_no_schema(tmp_path):
    """В production схема не создаётся при старте — только `plan_api.migrate`."""
    url = f"sqlite:///{tmp_path / 'empty.db'}"
    create_app(Settings(env="production", database_url=url, secret_key="p" * 40))
    with Database(url).session() as s:
        assert s.execute(text("SELECT name FROM sqlite_master WHERE name = 'users'")).first() is None


# --- изоляция и удаление ----------------------------------------------------------------------


def test_cs7_isolation_and_game_token_rejected(app, client):
    ha, hb = login(client, "a@example.com"), login(client, "b@example.com")
    ck = client.post("/api/checkups", json={"entry_question": "overview"}, headers=ha).json()
    assert client.get(f"/api/checkups/{ck['id']}", headers=hb).status_code == 404
    uid = client.get("/api/me", headers=ha).json()["user"]["id"]
    exp = datetime.now(timezone.utc) + timedelta(days=1)
    # Токен игры (backend/app/auth.py): sub + exp, без iss/aud. Даже с секретом Plan — 401.
    game_like = jwt.encode({"sub": uid, "exp": exp}, app.state.settings.secret_key, algorithm="HS256")
    game_dev = jwt.encode({"sub": uid, "exp": exp}, "dev-only-insecure-secret-key-do-not-deploy", algorithm="HS256")
    foreign_iss = jwt.encode(
        {"sub": uid, "exp": exp, "iss": "game", "aud": "plan-web", "ver": 0}, app.state.settings.secret_key, algorithm="HS256"
    )
    for token in (game_like, game_dev, foreign_iss, "game-token"):
        assert client.get("/api/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_cs8_delete_blocks_login_then_purge_removes_rows(app, client):
    h = login(client, "e@example.com")
    ck = client.post("/api/checkups", json={"entry_question": "overview"}, headers=h).json()
    client.post(f"/api/checkups/{ck['id']}/demo", headers=h)
    client.post(f"/api/checkups/{ck['id']}/complete", headers=h)
    other = login(client, "keep@example.com")

    assert client.delete("/api/me", headers=h).status_code == 202
    assert client.get("/api/me", headers=h).status_code == 401  # токен отозван
    code = client.post("/api/auth/email/request-code", json={"email": "e@example.com"}).json()["dev_code"]
    r = client.post("/api/auth/email/verify", json={"email": "e@example.com", "code": code})
    assert r.status_code == 403 and r.json()["error"]["code"] == "account_deleted"

    with app.state.db.session() as s:
        assert Repo(s).purge_deleted() == 1
    for table in ("users", "households", "consent_log", "checkups", "reports", "steps", "email_codes", "code_requests"):
        count = rows(app, f"SELECT COUNT(*) FROM {table}")[0][0]
        assert count == {"users": 1, "households": 1, "consent_log": 1, "code_requests": 1}.get(table, 0), table
    assert rows(app, "SELECT COUNT(*) FROM product_events WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users)")[0][0] == 0
    assert client.get("/api/me", headers=other).status_code == 200
    # после purge e-mail свободен: новая регистрация — новый аккаунт
    assert login(client, "e@example.com")


def test_cs9_plan_does_not_import_game():
    forbidden = ("app", "backend")
    files = list((Path(__file__).parents[1] / "plan_api").rglob("*.py"))
    assert files
    for path in files:
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            names = []
            if isinstance(node, ast.Import):
                names = [a.name for a in node.names]
            elif isinstance(node, ast.ImportFrom) and node.level == 0:
                names = [node.module or ""]
            for name in names:
                assert name.split(".")[0] not in forbidden, f"{path}: {name}"
