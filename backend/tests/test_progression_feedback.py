"""
Прогрессия XP v2 и обратная связь: period_close, overview.newly_unlocked, устойчивость достижений.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest

from app.game_period import process_period_end
from app.models import FinanceSalary, GameProfile, PeriodSnapshot
from app.progression_xp import compute_period_close_xp
from app.routers.game import _period_close_summary


class TestPeriodCloseSummaryMapping:
    def test_maps_xp_breakdown_and_achievements(self):
        summary = _period_close_summary(
            {
                "total_spent": 9600.0,
                "new_balance": 55400.0,
                "breakdown": [{"type": "burn", "title": "Жизнь", "amount": 9600.0}],
                "xp_earned": 50,
                "xp_period_close": 22,
                "xp_milestone": 20,
                "milestone_title": "Первый шаг",
                "xp_from_achievements": 8,
                "achievement_unlocks": [
                    {
                        "chain_key": "safety",
                        "tier_key": "t1",
                        "tier_index": 1,
                        "title": "Подушка",
                        "xp_reward": 8,
                        "xp_gained": 8,
                        "level_up": False,
                        "new_level": None,
                    }
                ],
                "level_up": True,
                "new_level": 2,
                "character_level": 2,
            }
        )
        assert summary.xp_period_close == 22
        assert summary.xp_milestone == 20
        assert summary.milestone_title == "Первый шаг"
        assert summary.xp_from_achievements == 8
        assert summary.xp_earned == 50
        assert summary.level_up is True
        assert summary.new_level == 2
        assert summary.character_level == 2
        assert len(summary.achievement_unlocks) == 1
        assert summary.achievement_unlocks[0].title == "Подушка"
        assert summary.achievement_unlocks[0].xp_reward == 8

    def test_empty_achievement_unlocks_default(self):
        summary = _period_close_summary(
            {
                "total_spent": 0,
                "new_balance": 1000,
                "xp_earned": 12,
                "xp_period_close": 12,
                "character_level": 1,
            }
        )
        assert summary.achievement_unlocks == []
        assert summary.xp_milestone == 0
        assert summary.milestone_title is None


class TestFinanceOverviewProgression:
    def test_overview_exposes_progression_and_newly_unlocked(self, client, auth_headers):
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

        assert ov["character_level"] >= 1
        assert "character_xp" in ov
        assert "character_xp_need_for_next" in ov
        assert ov["character_xp_need_for_next"] > 0
        assert "newly_unlocked" in ov
        assert isinstance(ov["newly_unlocked"], list)


class TestTimeNextPeriodClose:
    def test_time_next_returns_period_close_xp_fields(self, client, auth_headers, db_session):
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

        expected_period_xp = compute_period_close_xp(
            salary_claimed=True,
            safety_fund_contribution=0.0,
        )
        rhythm_xp = expected_period_xp + 20
        assert pc["xp_period_close"] == expected_period_xp
        assert pc["xp_milestone"] == 20
        assert pc["milestone_title"]
        assert pc["xp_earned"] >= rhythm_xp
        assert pc["xp_from_achievements"] == pc["xp_earned"] - rhythm_xp
        assert pc["character_level"] >= 1
        assert isinstance(pc.get("achievement_unlocks"), list)


class TestGamePeriodAchievementResilience:
    @pytest.fixture()
    def profile_ready_for_close(self, db_session):
        profile = GameProfile(
            user_id=1,
            name="close-xp",
            save_kind="game",
            starter_template_key="mq_game_basic_v1",
            base_monthly_lifestyle_expense=9600.0,
            is_active=1,
            period_index=1,
            level=1,
            xp=0,
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
        level_before = int(profile.level)
        xp_before = int(profile.xp or 0)

        with patch("app.game_period.process_achievement_unlocks", side_effect=RuntimeError("boom")):
            result = process_period_end(db_session, profile)

        db_session.refresh(profile)

        assert profile.period_index == 2
        assert result["achievement_unlocks"] == []
        assert result["xp_from_achievements"] == 0
        rhythm_xp = int(result["xp_period_close"]) + int(result["xp_milestone"])
        assert result["xp_earned"] == rhythm_xp
        assert int(profile.xp or 0) > xp_before or int(profile.level) > level_before

    def test_period_end_commits_rhythm_xp_when_achievements_ok(self, db_session, profile_ready_for_close):
        profile = profile_ready_for_close
        result = process_period_end(db_session, profile)
        db_session.refresh(profile)

        expected_rhythm = compute_period_close_xp(salary_claimed=True, safety_fund_contribution=0.0) + 20
        assert result["xp_period_close"] + result["xp_milestone"] == expected_rhythm
        assert int(profile.period_index) == 2
