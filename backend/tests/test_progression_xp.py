"""XP v2: кривая уровней, пакет периода, milestone."""

from app.game_rules import (
    CHARACTER_MAX_LEVEL,
    XP_NEED_BY_LEVEL,
    XP_TOTAL_TO_MAX_LEVEL,
    apply_xp_to_character_state,
    character_xp_cumulative_to_reach_level,
    character_xp_need_for_next_level,
)
from app.progression_xp import (
    compute_period_close_xp,
    milestone_xp_for_closed_period,
    safety_contribute_xp_for_grant,
)


class TestXpCurveV2:
    def test_need_table_sums_to_2500(self):
        assert sum(XP_NEED_BY_LEVEL) == XP_TOTAL_TO_MAX_LEVEL == 2500
        assert len(XP_NEED_BY_LEVEL) == CHARACTER_MAX_LEVEL - 1

    def test_phantom_level_12_step(self):
        assert XP_NEED_BY_LEVEL[-1] == 115
        assert character_xp_need_for_next_level(11) == 115
        assert character_xp_need_for_next_level(12) == 0

    def test_cumulative_to_level_4_is_140(self):
        assert character_xp_cumulative_to_reach_level(4) == 140

    def test_rich_first_period_moves_past_level_3(self):
        period_xp = compute_period_close_xp(salary_claimed=True, safety_fund_contribution=40_000)
        assert period_xp == 12 + 10 + 20
        level, _, info = apply_xp_to_character_state(1, 0, period_xp + 20 + 28 + 6)
        assert level >= 3
        assert info["level_up"] is True

    def test_cumulative_140_reaches_level_4(self):
        level, xp, _ = apply_xp_to_character_state(1, 0, 140)
        assert level == 4
        assert xp == 0

    def test_max_level_caps_progression(self):
        total = sum(XP_NEED_BY_LEVEL)
        level, xp, info = apply_xp_to_character_state(1, 0, total + 500)
        assert level == CHARACTER_MAX_LEVEL
        assert info.get("at_max_level") is True
        assert character_xp_need_for_next_level(level) == 0


class TestPeriodCloseXp:
    def test_base_only(self):
        assert compute_period_close_xp(salary_claimed=False, safety_fund_contribution=0) == 12

    def test_full_package(self):
        assert compute_period_close_xp(salary_claimed=True, safety_fund_contribution=10_000) == 12 + 10 + 5


class TestSafetyContributeCap:
    def test_third_grant_zero(self):
        assert safety_contribute_xp_for_grant(0) == 3
        assert safety_contribute_xp_for_grant(1) == 3
        assert safety_contribute_xp_for_grant(2) == 0


class TestMilestones:
    def test_once_per_period(self):
        import json

        from app.progression_xp import save_milestones_awarded

        class P:
            progression_milestones_awarded = "[]"

        profile = P()
        xp1, lst1 = milestone_xp_for_closed_period(profile, 1)
        assert xp1 == 20
        save_milestones_awarded(profile, lst1)
        assert json.loads(profile.progression_milestones_awarded) == [1]
        xp2, _ = milestone_xp_for_closed_period(profile, 1)
        assert xp2 == 0
