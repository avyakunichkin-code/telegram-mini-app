"""API прототипа: путь чекапа, изоляция, удаление, границы (SPEC_plan-v1 CS-1, CS-7…CS-9)."""

from __future__ import annotations

import ast
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from plan_api.main import CONSENT_VERSION, app
from plan_api.store import store


@pytest.fixture()
def client():
    store.__init__()
    return TestClient(app)


def login(client: TestClient, email: str) -> dict:
    code = client.post("/api/auth/email/request-code", json={"email": email}).json()["dev_code"]
    r = client.post("/api/auth/email/verify", json={"email": email, "code": code, "consent_version": CONSENT_VERSION})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_cs1_quick_then_complete(client):
    h = login(client, "a@example.com")
    ck = client.post("/api/checkups", json={"entry_question": "resilience"}, headers=h).json()
    quick = {
        "income": {"min": 150_000, "max": 180_000},
        "must_expenses": {"min": 90_000, "max": 110_000},
        "debt_payments": {"min": 20_000, "max": 20_000},
        "savings": {"min": 100_000, "max": 150_000},
        "children": 1,
    }
    r = client.post(f"/api/checkups/{ck['id']}/quick", json=quick, headers=h)
    assert r.status_code == 200, r.text
    assert sum(m["role"] == "child" for m in r.json()["members"]) == 1
    draft = client.get(f"/api/checkups/{ck['id']}/report", headers=h).json()
    assert draft["final"] is False and draft["precision"] == "draft"
    assert len(draft["areas"]) == 4 and len(draft["scenarios"]) == 4
    final = client.post(f"/api/checkups/{ck['id']}/complete", headers={**h, "Idempotency-Key": "k1"}).json()
    assert final["final"] is True and len(final["steps"]) == 3
    again = client.post(f"/api/checkups/{ck['id']}/complete", headers={**h, "Idempotency-Key": "k1"}).json()
    assert again["steps"][0]["id"] == final["steps"][0]["id"]
    step = client.patch(f"/api/steps/{final['steps'][0]['id']}", json={"status": "done"}, headers=h).json()
    assert step["status"] == "done"
    assert client.get("/api/dev/funnel").json()["step_done"] == 1


def test_completed_checkup_is_read_only_and_recheck_copies(client):
    h = login(client, "b@example.com")
    ck = client.post("/api/checkups", json={"entry_question": "overview"}, headers=h).json()
    client.post(f"/api/checkups/{ck['id']}/demo", headers=h)
    client.post(f"/api/checkups/{ck['id']}/complete", headers=h)
    r = client.put(f"/api/checkups/{ck['id']}/sections/goals", json=[], headers=h)
    assert r.status_code == 409
    nxt = client.post("/api/checkups", json={"entry_question": "goal"}, headers=h).json()
    assert nxt["parent_checkup_id"] == ck["id"] and nxt["data"]["incomes"]


def test_section_validation(client):
    h = login(client, "c@example.com")
    ck = client.post("/api/checkups", json={"entry_question": "overview"}, headers=h).json()
    bad = [{"member_id": "m_me", "amount": {"min": 10, "max": 5}}]
    assert client.put(f"/api/checkups/{ck['id']}/sections/incomes", json=bad, headers=h).status_code == 422
    unknown = [{"member_id": "nobody", "amount": {"min": 5, "max": 10}}]
    assert client.put(f"/api/checkups/{ck['id']}/sections/incomes", json=unknown, headers=h).status_code == 422


def test_consent_required_for_new_user(client):
    code = client.post("/api/auth/email/request-code", json={"email": "d@example.com"}).json()["dev_code"]
    r = client.post("/api/auth/email/verify", json={"email": "d@example.com", "code": code})
    assert r.status_code == 400 and r.json()["error"]["code"] == "consent_required"


def test_cs7_isolation(client):
    ha, hb = login(client, "a@example.com"), login(client, "b@example.com")
    ck = client.post("/api/checkups", json={"entry_question": "overview"}, headers=ha).json()
    assert client.get(f"/api/checkups/{ck['id']}", headers=hb).status_code == 404
    assert client.get("/api/me", headers={"Authorization": "Bearer game-token"}).status_code == 401


def test_cs8_delete_account(client):
    h = login(client, "e@example.com")
    ck = client.post("/api/checkups", json={"entry_question": "overview"}, headers=h).json()
    assert client.delete("/api/me", headers=h).status_code == 202
    assert client.get("/api/me", headers=h).status_code == 401
    assert ck["id"] not in store.checkups


def test_cs9_plan_does_not_import_game():
    forbidden = ("app", "sqlalchemy")
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
