"""Контрактные тесты: старт игры, идемпотентность, overview."""

import pytest

from app.models import FinanceSalary, GameProfile


class TestGameStartValidation:
    def test_game_requires_template_key(self, client, auth_headers):
        r = client.post(
            "/api/game/start",
            headers=auth_headers,
            json={"profile_name": "Test", "save_kind": "game"},
        )
        assert r.status_code == 400
        assert "template_key" in r.json()["detail"].lower()

    def test_unknown_template_404(self, client, auth_headers):
        r = client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "Test",
                "save_kind": "game",
                "template_key": "missing_template",
            },
        )
        assert r.status_code == 404

    def test_invalid_save_kind_422(self, client, auth_headers):
        r = client.post(
            "/api/game/start",
            headers=auth_headers,
            json={"profile_name": "Test", "save_kind": "invalid"},
        )
        assert r.status_code == 422


class TestGameFlowAndIdempotency:
    def test_start_claim_salary_overview(self, client, auth_headers, db_session):
        start = client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "Quality",
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        )
        assert start.status_code == 200
        profile_id = start.json()["profile_id"]

        claim1 = client.post("/api/game/period/claim-salary", headers=auth_headers)
        assert claim1.status_code == 200
        body1 = claim1.json()
        assert body1["already_claimed"] is False
        assert body1["amount"] == 50000

        claim2 = client.post("/api/game/period/claim-salary", headers=auth_headers)
        assert claim2.status_code == 200
        body2 = claim2.json()
        assert body2["already_claimed"] is True
        assert body2["amount"] == 50000

        profile = db_session.query(GameProfile).filter(GameProfile.id == profile_id).first()
        salary = db_session.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile_id).first()
        assert profile.cash_balance == 15000 + salary.monthly_amount

        overview = client.get("/api/finance/overview", headers=auth_headers)
        assert overview.status_code == 200
        ov = overview.json()
        assert ov["victory"] is not None
        assert ov["victory"]["template_key"] == "mq_game_basic_v1"
        assert ov["total_monthly_income"] >= 50000
        assert ov["monthly_burn_total"] == pytest.approx(37500.0, abs=1.0)
        assert ov["monthly_burn_breakdown"] is not None
        assert len(ov["monthly_burn_breakdown"]["by_category"]) >= 5

        expenses = client.get("/api/game/expenses", headers=auth_headers)
        assert expenses.status_code == 200
        ex = expenses.json()
        assert ex["total"] == pytest.approx(37500.0, abs=1.0)
        assert ex["total_monthly_outflow"] >= ex["total"]

    def test_contribute_idempotency_key(self, client, auth_headers):
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "Idem",
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        )
        client.post("/api/game/period/claim-salary", headers=auth_headers)
        headers = {**auth_headers, "Idempotency-Key": "contrib-1"}
        r1 = client.post(
            "/api/game/period/contribute-to-safety-fund",
            headers=headers,
            json={"amount": 1000},
        )
        r2 = client.post(
            "/api/game/period/contribute-to-safety-fund",
            headers=headers,
            json={"amount": 1000},
        )
        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r1.json()["contributed"] == r2.json()["contributed"]
        assert r1.json()["new_safety_fund_balance"] == r2.json()["new_safety_fund_balance"]

        overview = client.get("/api/finance/overview", headers=auth_headers).json()
        assert overview["safety_fund_balance"] == 1000


class TestGameProfilesList:
    def test_list_profiles_serializes_without_level_xp(self, client, auth_headers):
        create = client.post(
            "/api/game/profiles",
            headers=auth_headers,
            json={"name": "Slot A", "save_kind": "game"},
        )
        assert create.status_code == 200
        body = create.json()
        assert "level" not in body
        assert "xp" not in body
        assert body["name"] == "Slot A"

        listed = client.get("/api/game/profiles", headers=auth_headers)
        assert listed.status_code == 200
        profiles = listed.json()
        assert isinstance(profiles, list)
        assert len(profiles) >= 1
        first = profiles[0]
        assert "level" not in first
        assert "xp" not in first
        assert "period_index" in first
        assert "cash_balance" in first
