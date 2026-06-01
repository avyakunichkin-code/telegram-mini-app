"""
CS: POST /api/game/time/next — cashflow и просрочка обязательств в period_close + overview.

Gate: G1 happy (оплата без просрочки), G3 контракт total_overdue_amount для FE.
"""

from __future__ import annotations

import pytest

from app.models import FinanceLiability, GameProfile
from tests.fixtures.game import create_finance_liability


pytestmark = pytest.mark.integration


def _start_game_and_claim_salary(client, auth_headers, profile_name: str):
    assert (
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": profile_name,
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        ).status_code
        == 200
    )
    assert client.post("/api/game/period/claim-salary", headers=auth_headers).status_code == 200


def _active_profile(db_session) -> GameProfile:
    profile = (
        db_session.query(GameProfile)
        .filter(GameProfile.is_active == 1)
        .order_by(GameProfile.id.desc())
        .first()
    )
    assert profile is not None
    return profile


class TestTimeNextCashflowWithLiabilities:
    def test_time_next_pays_liability_without_overdue(self, client, auth_headers, db_session):
        _start_game_and_claim_salary(client, auth_headers, "Liability paid")
        profile = _active_profile(db_session)
        cash_after_salary = float(profile.cash_balance)

        create_finance_liability(
            db_session,
            profile.id,
            title="Малый платёж",
            monthly_payment=5_000.0,
        )

        nxt = client.post("/api/game/time/next", headers=auth_headers)
        assert nxt.status_code == 200
        body = nxt.json()
        pc = body["period_close"]
        assert pc is not None
        assert pc["closed_period_index"] == 1
        assert isinstance(pc["cash_delta"], (int, float))
        assert isinstance(pc["new_balance"], (int, float))
        assert pc["new_balance"] < cash_after_salary

        ov = client.get("/api/finance/overview", headers=auth_headers).json()
        assert float(ov["total_overdue_amount"]) == 0.0

    def test_time_next_partial_liability_shows_overdue_in_overview(
        self, client, auth_headers, db_session
    ):
        _start_game_and_claim_salary(client, auth_headers, "Liability overdue")
        profile = _active_profile(db_session)
        cash_after_salary = float(profile.cash_balance)
        assert cash_after_salary >= 60_000.0

        create_finance_liability(
            db_session,
            profile.id,
            title="Ипотека",
            monthly_payment=80_000.0,
        )

        nxt = client.post("/api/game/time/next", headers=auth_headers)
        assert nxt.status_code == 200
        pc = nxt.json()["period_close"]
        assert pc["new_balance"] is not None
        assert pc["expense_delta"] != 0 or pc["cash_delta"] != 0

        liability = (
            db_session.query(FinanceLiability)
            .filter(FinanceLiability.game_profile_id == profile.id)
            .one()
        )
        assert float(liability.overdue_amount) > 0.0

        ov = client.get("/api/finance/overview", headers=auth_headers).json()
        assert float(ov["total_overdue_amount"]) == pytest.approx(
            float(liability.overdue_amount), abs=0.01
        )
