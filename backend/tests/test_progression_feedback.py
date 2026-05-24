"""
Прогрессия после удаления character XP: period_close без xp/level, overview без character_*.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest

from app.game_period import process_period_end
from app.models import FinanceSalary, GameProfile, PeriodSnapshot
from app.routers.game import _period_close_summary


class TestPeriodCloseSummaryMapping:
    def test_maps_achievement_unlocks(self):
        summary = _period_close_summary(
            {
                "total_spent": 9600.0,
                "new_balance": 55400.0,
                "breakdown": [{"type": "burn", "title": "Жизнь", "amount": 9600.0}],
                "achievement_unlocks": [
                    {
                        "chain_key": "safety",
                        "tier_key": "t1",
                        "tier_index": 1,
                        "title": "Подушка",
                    }
                ],
            }
        )
        assert summary.total_spent == 9600.0
        assert summary.new_balance == 55400.0
        assert len(summary.achievement_unlocks) == 1
        assert summary.achievement_unlocks[0].title == "Подушка"

    def test_empty_achievement_unlocks_default(self):
        summary = _period_close_summary(
            {
                "total_spent": 0,
                "new_balance": 1000,
            }
        )
        assert summary.achievement_unlocks == []

    def test_maps_period_compare_deltas(self):
        summary = _period_close_summary(
            {
                "closed_period_index": 2,
                "cash_delta": 1500.0,
                "income_delta": 5000.0,
                "expense_delta": -1200.0,
                "safety_fund_delta": 10000.0,
                "invest_capital_delta": 25000.0,
                "debt_delta": -8000.0,
                "total_spent": 0,
                "new_balance": 1000,
            }
        )
        assert summary.closed_period_index == 2
        assert summary.cash_delta == 1500.0
        assert summary.income_delta == 5000.0
        assert summary.expense_delta == -1200.0
        assert summary.safety_fund_delta == 10000.0
        assert summary.invest_capital_delta == 25000.0
        assert summary.debt_delta == -8000.0


class TestFinanceOverviewProgression:
    def test_overview_has_no_character_progression_fields(self, client, auth_headers):
        start = client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "Prog feedback",
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        )
        assert start.status_code == 200

        overview = client.get("/api/finance/overview", headers=auth_headers)
        assert overview.status_code == 200
        ov = overview.json()

        for key in (
            "character_level",
            "character_xp",
            "character_xp_need_for_next",
            "character_unlocks",
        ):
            assert key not in ov


class TestTimeNextPeriodClose:
    def test_time_next_returns_period_close_without_xp(self, client, auth_headers, db_session):
        assert (
            client.post(
                "/api/game/start",
                headers=auth_headers,
                json={
                    "profile_name": "Period close",
                    "save_kind": "game",
                    "template_key": "mq_game_basic_v1",
                },
            ).status_code
            == 200
        )
        assert client.post("/api/game/period/claim-salary", headers=auth_headers).status_code == 200

        profile = (
            db_session.query(GameProfile)
            .filter(GameProfile.is_active == 1)
            .order_by(GameProfile.id.desc())
            .first()
        )
        assert profile is not None
        period_before = int(profile.period_index)

        nxt = client.post("/api/game/time/next", headers=auth_headers)
        assert nxt.status_code == 200
        body = nxt.json()

        assert body["period_index"] == period_before + 1
        pc = body.get("period_close")
        assert pc is not None
        assert "xp_earned" not in pc
        assert "character_level" not in pc
        assert isinstance(pc.get("achievement_unlocks"), list)


class TestGamePeriodAchievementResilience:
    @pytest.fixture()
    def profile_ready_for_close(self, db_session):
        profile = GameProfile(
            user_id=1,
            name="close-ach",
            save_kind="game",
            starter_template_key="mq_game_basic_v1",
            base_monthly_lifestyle_expense=9600.0,
            is_active=1,
            period_index=1,
            cash_balance=50_000.0,
            safety_fund_balance=0.0,
            last_period_salary_claimed=1,
        )
        db_session.add(profile)
        db_session.flush()

        db_session.add(FinanceSalary(game_profile_id=profile.id, monthly_amount=50_000.0))
        db_session.add(
            PeriodSnapshot(
                game_profile_id=profile.id,
                period_index=1,
                salary_claimed=1,
                salary_amount=50_000.0,
                safety_fund_contribution=0.0,
                safety_fund_total=0.0,
                xp_earned=0,
            )
        )
        db_session.commit()
        db_session.refresh(profile)
        return profile

    def test_period_end_survives_achievement_failure(self, db_session, profile_ready_for_close):
        profile = profile_ready_for_close

        with patch("app.game_period.process_achievement_unlocks", side_effect=RuntimeError("boom")):
            result = process_period_end(db_session, profile)

        db_session.refresh(profile)

        assert profile.period_index == 2
        assert result["achievement_unlocks"] == []

    def test_period_end_advances_period(self, db_session, profile_ready_for_close):
        profile = profile_ready_for_close
        process_period_end(db_session, profile)
        db_session.refresh(profile)
        assert int(profile.period_index) == 2
