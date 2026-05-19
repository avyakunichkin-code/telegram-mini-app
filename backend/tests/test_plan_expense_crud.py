"""Plan mode: старт с бюджетом и CRUD статей расходов."""

from __future__ import annotations

import pytest

from app.models import GameProfile, ProfileExpenseLine


def _start_plan(client, auth_headers, *, template_key="mq_plan_basic_v1"):
    return client.post(
        "/api/game/start",
        headers=auth_headers,
        json={
            "profile_name": "Plan budget",
            "save_kind": "plan",
            "template_key": template_key,
        },
    )


class TestPlanStartExpenses:
    def test_plan_start_from_template(self, client, auth_headers, db_session):
        r = _start_plan(client, auth_headers)
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
        assert len(lines) >= 5
        assert all(ln.source_kind == "plan" for ln in lines)

        ov = client.get("/api/finance/overview", headers=auth_headers)
        assert ov.status_code == 200
        assert ov.json()["save_kind"] == "plan"
        assert ov.json()["monthly_burn_total"] == pytest.approx(40000.0, abs=1.0)


class TestPlanExpenseCrud:
    def test_crud_lines_plan_only(self, client, auth_headers, db_session):
        _start_plan(client, auth_headers)

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
        assert ov.json()["monthly_burn_total"] == pytest.approx(44500.0, abs=1.0)

        deleted = client.delete(f"/api/game/expenses/lines/{line_id}", headers=auth_headers)
        assert deleted.status_code == 204

        ov2 = client.get("/api/finance/overview", headers=auth_headers)
        assert ov2.json()["monthly_burn_total"] == pytest.approx(40000.0, abs=1.0)

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
