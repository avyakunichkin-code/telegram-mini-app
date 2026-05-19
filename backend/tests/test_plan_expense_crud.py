"""Plan mode: старт с бюджетом и CRUD статей расходов."""

from __future__ import annotations

import pytest

from app.models import GameProfile, ProfileExpenseLine


def _start_plan(client, auth_headers, *, budget=None, salary=80000):
    payload = {
        "profile_name": "Plan budget",
        "save_kind": "plan",
        "cash_balance": 50000,
        "monthly_salary": salary,
        "period_duration_seconds": 60,
        "assets": [],
        "liabilities": [],
    }
    if budget is not None:
        payload["expense_budget"] = budget
    return client.post("/api/game/start", headers=auth_headers, json=payload)


class TestPlanStartExpenses:
    def test_plan_start_with_explicit_budget(self, client, auth_headers, db_session):
        budget = {"housing": 15000, "food": 20000, "transport": 5000}
        r = _start_plan(client, auth_headers, budget=budget)
        assert r.status_code == 200
        profile_id = r.json()["profile_id"]

        profile = db_session.query(GameProfile).filter(GameProfile.id == profile_id).first()
        assert profile.save_kind == "plan"
        assert profile.base_monthly_lifestyle_expense == pytest.approx(40000.0, abs=0.02)

        lines = (
            db_session.query(ProfileExpenseLine)
            .filter(ProfileExpenseLine.game_profile_id == profile_id, ProfileExpenseLine.is_active == 1)
            .all()
        )
        assert len(lines) == 3
        assert all(ln.source_kind == "plan" for ln in lines)

        ov = client.get("/api/finance/overview", headers=auth_headers)
        assert ov.status_code == 200
        assert ov.json()["save_kind"] == "plan"
        assert ov.json()["monthly_burn_total"] == pytest.approx(40000.0, abs=1.0)

    def test_plan_start_auto_budget_from_salary(self, client, auth_headers):
        r = _start_plan(client, auth_headers, salary=100000)
        assert r.status_code == 200
        ex = client.get("/api/game/expenses", headers=auth_headers)
        assert ex.status_code == 200
        assert ex.json()["total"] == pytest.approx(55000.0, abs=500.0)


class TestPlanExpenseCrud:
    def test_crud_lines_plan_only(self, client, auth_headers, db_session):
        _start_plan(
            client,
            auth_headers,
            budget={"food": 10000, "housing": 8000},
        )

        cats = client.get("/api/game/expenses/categories", headers=auth_headers)
        assert cats.status_code == 200
        assert len(cats.json()) >= 6

        created = client.post(
            "/api/game/expenses/lines",
            headers=auth_headers,
            json={"category_key": "leisure", "amount_monthly": 3000, "title": "Кино"},
        )
        assert created.status_code == 200
        line_id = created.json()["id"]
        assert created.json()["amount_monthly"] == 3000

        patched = client.patch(
            f"/api/game/expenses/lines/{line_id}",
            headers=auth_headers,
            json={"amount_monthly": 4500},
        )
        assert patched.status_code == 200
        assert patched.json()["amount_monthly"] == 4500

        ov = client.get("/api/finance/overview", headers=auth_headers)
        assert ov.json()["monthly_burn_total"] == pytest.approx(22500.0, abs=1.0)

        deleted = client.delete(f"/api/game/expenses/lines/{line_id}", headers=auth_headers)
        assert deleted.status_code == 204

        ov2 = client.get("/api/finance/overview", headers=auth_headers)
        assert ov2.json()["monthly_burn_total"] == pytest.approx(18000.0, abs=1.0)

    def test_game_profile_cannot_create_line(self, client, auth_headers):
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "Game only",
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        )
        r = client.post(
            "/api/game/expenses/lines",
            headers=auth_headers,
            json={"category_key": "food", "amount_monthly": 1000},
        )
        assert r.status_code == 403
