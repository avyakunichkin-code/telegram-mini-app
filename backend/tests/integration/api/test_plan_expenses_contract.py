"""
CS: Plan mode — старт, CRUD статей расходов, guard для Game (backlog #4).

Gate: G1 happy, G2 boundary, G3 overview contract, G4 save_kind invariant.
"""

from __future__ import annotations

import pytest

from app.models import GameProfile, ProfileExpenseLine
from tests.fixtures.plan import start_plan


pytestmark = pytest.mark.integration


class TestPlanStartContract:
    def test_plan_start_from_template_lines_and_burn(self, client, auth_headers, db_session):
        r = start_plan(client, auth_headers)
        assert r.status_code == 200
        profile_id = r.json()["profile_id"]

        profile = db_session.query(GameProfile).filter(GameProfile.id == profile_id).first()
        assert profile.save_kind == "plan"
        assert profile.base_monthly_lifestyle_expense == pytest.approx(40_000.0, abs=0.02)

        lines = (
            db_session.query(ProfileExpenseLine)
            .filter(
                ProfileExpenseLine.game_profile_id == profile_id,
                ProfileExpenseLine.is_active == 1,
            )
            .all()
        )
        assert len(lines) >= 5
        assert all(ln.source_kind == "plan" for ln in lines)

        ov = client.get("/api/finance/overview", headers=auth_headers).json()
        assert ov["save_kind"] == "plan"
        assert ov["monthly_burn_total"] == pytest.approx(40_000.0, abs=1.0)
        assert ov.get("needs") is None

    def test_plan_start_with_explicit_wizard_budget(self, client, auth_headers, db_session):
        budget = {"housing": 15_000, "food": 20_000, "transport": 5_000}
        r = start_plan(client, auth_headers, template_key=None, budget=budget)
        assert r.status_code == 200
        profile_id = r.json()["profile_id"]

        lines = (
            db_session.query(ProfileExpenseLine)
            .filter(
                ProfileExpenseLine.game_profile_id == profile_id,
                ProfileExpenseLine.is_active == 1,
            )
            .all()
        )
        assert len(lines) == 3
        assert all(ln.source_kind == "plan" and ln.source_ref == "wizard" for ln in lines)

        ov = client.get("/api/finance/overview", headers=auth_headers).json()
        assert ov["monthly_burn_total"] == pytest.approx(40_000.0, abs=1.0)


class TestPlanExpenseCrudContract:
    def test_crud_updates_monthly_burn_total(self, client, auth_headers):
        start_plan(client, auth_headers)

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

        patched = client.patch(
            f"/api/game/expenses/lines/{line_id}",
            headers=auth_headers,
            json={"amount_monthly": 4500},
        )
        assert patched.status_code == 200
        assert patched.json()["amount_monthly"] == 4500

        ov = client.get("/api/finance/overview", headers=auth_headers).json()
        assert ov["monthly_burn_total"] == pytest.approx(44_500.0, abs=1.0)

        assert client.delete(f"/api/game/expenses/lines/{line_id}", headers=auth_headers).status_code == 204

        ov2 = client.get("/api/finance/overview", headers=auth_headers).json()
        assert ov2["monthly_burn_total"] == pytest.approx(40_000.0, abs=1.0)

    def test_unknown_category_falls_back_to_other(self, client, auth_headers, db_session):
        start_plan(client, auth_headers, profile_name="Plan category fallback")
        created = client.post(
            "/api/game/expenses/lines",
            headers=auth_headers,
            json={"category_key": "not_a_real_category", "amount_monthly": 500},
        )
        assert created.status_code == 200
        assert created.json()["category_key"] == "other"

    def test_negative_amount_rejected(self, client, auth_headers):
        start_plan(client, auth_headers)
        r = client.post(
            "/api/game/expenses/lines",
            headers=auth_headers,
            json={"category_key": "food", "amount_monthly": -100},
        )
        assert r.status_code == 422

    def test_game_profile_cannot_mutate_expense_lines(self, client, auth_headers):
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
