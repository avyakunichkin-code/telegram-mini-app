"""Инварианты игровой логики (структура правил, не баланс продукта)."""

import pytest

from app.game_rules import (
    CHARACTER_MAX_LEVEL,
    EVENTS_PER_PERIOD,
    EVENT_TIER_WINDOW_BELOW_LEVEL,
    MIN_PERIOD_INDEX_FOR_WIN,
    MVP_SAFETY_FUND_OBLIGATIONS_MULTIPLIER,
    REPEAT_POLICY_MAX_PER_PROFILE,
    REPEAT_POLICY_ONCE_PER_PROFILE,
    XP_NEED_BY_LEVEL,
    XP_TOTAL_TO_MAX_LEVEL,
    EventProfileContext,
    EventProfileCounterSnapshot,
    EventPrerequisites,
    apply_xp_to_character_state,
    character_xp_need_for_next_level,
    clamp_profile_lifestyle_delta,
    evaluate_mvp_victory,
    event_prerequisites_met,
    event_tier_bounds,
    event_tier_in_core_window,
    event_tier_in_fallback_primary,
    is_event_definition_eligible,
    parse_event_prerequisites_json,
    MvpVictoryInput,
)


class TestXpProgression:
    def test_need_table_matches_v2(self):
        assert sum(XP_NEED_BY_LEVEL) == XP_TOTAL_TO_MAX_LEVEL
        assert character_xp_need_for_next_level(1) == XP_NEED_BY_LEVEL[0]
        assert character_xp_need_for_next_level(0) == character_xp_need_for_next_level(1)
        assert character_xp_need_for_next_level(CHARACTER_MAX_LEVEL) == 0

    def test_need_grows_with_level_phantom_finale_smaller(self):
        needs = [character_xp_need_for_next_level(L) for L in range(1, CHARACTER_MAX_LEVEL)]
        assert needs[:-1] == sorted(needs[:-1])
        assert needs[-1] == 115
        assert needs[-2] == 650

    def test_negative_delta_rejected(self):
        with pytest.raises(ValueError, match="delta must be >= 0"):
            apply_xp_to_character_state(1, 0, -1)

    def test_zero_delta_preserves_state(self):
        level, xp, info = apply_xp_to_character_state(3, 40, 0)
        assert level == 3
        assert xp == 40
        assert info["xp_gained"] == 0
        assert info["level_up"] is False
        assert info["new_level"] is None

    def test_after_gain_xp_stays_below_next_threshold(self):
        level, xp, info = apply_xp_to_character_state(1, 0, 10)
        assert info["xp_gained"] == 10
        assert xp < character_xp_need_for_next_level(level)

    def test_single_level_up(self):
        need = character_xp_need_for_next_level(1)
        level, xp, info = apply_xp_to_character_state(1, 0, need)
        assert level == 2
        assert xp == 0
        assert info["level_up"] is True
        assert info["new_level"] == 2

    def test_cascade_level_up(self):
        need1 = character_xp_need_for_next_level(1)
        need2 = character_xp_need_for_next_level(2)
        level, xp, info = apply_xp_to_character_state(1, 0, need1 + need2)
        assert level == 3
        assert xp == 0
        assert info["level_up"] is True

    def test_stops_at_max_level(self):
        level, xp, info = apply_xp_to_character_state(CHARACTER_MAX_LEVEL - 1, 0, 10_000)
        assert level == CHARACTER_MAX_LEVEL
        assert info.get("at_max_level") is True


class TestEventTierWindow:
    @pytest.mark.parametrize(
        "character_level, expected",
        [
            (1, (1, 1)),
            (2, (1, 2)),
            (5, (3, 5)),
            (7, (5, 7)),
        ],
    )
    def test_bounds(self, character_level, expected):
        assert event_tier_bounds(character_level) == expected
        assert EVENT_TIER_WINDOW_BELOW_LEVEL == 2

    @pytest.mark.parametrize(
        "tier, level, in_core",
        [
            (1, 1, True),
            (2, 1, False),
            (3, 5, True),
            (5, 5, True),
            (2, 5, False),
            (1, 5, False),
            (6, 5, False),
        ],
    )
    def test_core_window(self, tier, level, in_core):
        assert event_tier_in_core_window(tier, level) is in_core

    def test_fallback_primary_wider_than_core_at_high_level(self):
        L = 6
        for tier in range(1, L + 1):
            assert event_tier_in_fallback_primary(tier, L)
        assert not event_tier_in_core_window(L + 1, L)
        assert not event_tier_in_fallback_primary(L + 1, L)


class TestEventEligibility:
    def test_once_per_profile_blocked_after_first_selection(self):
        c = EventProfileCounterSnapshot(times_selected=1, last_selected_period_index=3)
        assert not is_event_definition_eligible(
            repeat_policy=REPEAT_POLICY_ONCE_PER_PROFILE,
            repeat_max=None,
            cooldown_periods=0,
            current_period_index=10,
            counter=c,
        )

    def test_max_per_profile_respects_repeat_max(self):
        c = EventProfileCounterSnapshot(times_selected=2, last_selected_period_index=1)
        assert not is_event_definition_eligible(
            repeat_policy=REPEAT_POLICY_MAX_PER_PROFILE,
            repeat_max=2,
            cooldown_periods=0,
            current_period_index=5,
            counter=c,
        )

    def test_cooldown_blocks_until_periods_elapsed(self):
        c = EventProfileCounterSnapshot(times_selected=1, last_selected_period_index=5)
        assert not is_event_definition_eligible(
            repeat_policy="repeatable",
            repeat_max=None,
            cooldown_periods=3,
            current_period_index=7,
            counter=c,
        )
        assert is_event_definition_eligible(
            repeat_policy="repeatable",
            repeat_max=None,
            cooldown_periods=3,
            current_period_index=8,
            counter=c,
        )

    def test_no_counter_allows_first_time(self):
        assert is_event_definition_eligible(
            repeat_policy=REPEAT_POLICY_ONCE_PER_PROFILE,
            repeat_max=None,
            cooldown_periods=0,
            current_period_index=1,
            counter=None,
        )


class TestEventPrerequisites:
    def test_events_per_period_is_two(self):
        assert EVENTS_PER_PERIOD == 2

    def test_car_event_requires_vehicle_asset(self):
        prereq = parse_event_prerequisites_json(
            '{"active_asset_kinds_any":["car_personal","car_taxi"]}'
        )
        no_car = EventProfileContext(
            active_asset_kinds=frozenset({"home"}),
            active_liability_count=0,
            active_insurance_claim_keys=frozenset(),
        )
        with_car = EventProfileContext(
            active_asset_kinds=frozenset({"car_personal"}),
            active_liability_count=0,
            active_insurance_claim_keys=frozenset(),
        )
        assert not event_prerequisites_met(prereq, no_car)
        assert event_prerequisites_met(prereq, with_car)

    def test_refinance_requires_liability(self):
        prereq = EventPrerequisites(min_active_liabilities=1)
        ctx = EventProfileContext(
            active_asset_kinds=frozenset(),
            active_liability_count=0,
            active_insurance_claim_keys=frozenset(),
        )
        assert not event_prerequisites_met(prereq, ctx)
        ctx_ok = EventProfileContext(
            active_asset_kinds=frozenset(),
            active_liability_count=1,
            active_insurance_claim_keys=frozenset(),
        )
        assert event_prerequisites_met(prereq, ctx_ok)


class TestMvpVictory:
    def _snap(self, **kwargs):
        defaults = dict(
            period_index=MIN_PERIOD_INDEX_FOR_WIN,
            safety_fund_balance=30_000.0,
            total_monthly_obligations=10_000.0,
            total_overdue_amount=0.0,
            net_monthly_cashflow=1.0,
        )
        defaults.update(kwargs)
        return MvpVictoryInput(**defaults)

    def test_early_period_never_wins_even_if_finances_ready(self):
        r = evaluate_mvp_victory(self._snap(period_index=MIN_PERIOD_INDEX_FOR_WIN - 1))
        assert r.win_ready is True
        assert r.win_reached is False

    def test_win_requires_all_conditions_and(self):
        target = 10_000.0 * MVP_SAFETY_FUND_OBLIGATIONS_MULTIPLIER
        r = evaluate_mvp_victory(
            self._snap(
                safety_fund_balance=target,
                total_overdue_amount=0,
                net_monthly_cashflow=0,
            )
        )
        assert r.win_reached is True

    def test_overdue_blocks_win(self):
        target = 10_000.0 * MVP_SAFETY_FUND_OBLIGATIONS_MULTIPLIER
        r = evaluate_mvp_victory(
            self._snap(safety_fund_balance=target, total_overdue_amount=1.0)
        )
        assert r.win_ready is False
        assert r.win_reached is False

    def test_negative_cashflow_blocks_win(self):
        target = 10_000.0 * MVP_SAFETY_FUND_OBLIGATIONS_MULTIPLIER
        r = evaluate_mvp_victory(
            self._snap(safety_fund_balance=target, net_monthly_cashflow=-0.01)
        )
        assert r.win_ready is False
        assert r.win_reached is False

    def test_insufficient_safety_blocks_win(self):
        target = 10_000.0 * MVP_SAFETY_FUND_OBLIGATIONS_MULTIPLIER
        r = evaluate_mvp_victory(
            self._snap(safety_fund_balance=target - 1.0)
        )
        assert r.win_ready is True
        assert r.win_reached is False

    def test_zero_obligations_target_blocks_win(self):
        r = evaluate_mvp_victory(
            self._snap(total_monthly_obligations=0, safety_fund_balance=1_000_000)
        )
        assert r.win_target_safety_fund == 0
        assert r.win_reached is False

    def test_custom_min_period_and_multiplier(self):
        r = evaluate_mvp_victory(
            self._snap(period_index=5, total_monthly_obligations=1000, safety_fund_balance=2000),
            min_period_index=5,
            safety_multiplier=2.0,
        )
        assert r.win_target_safety_fund == 2000
        assert r.win_reached is True


class TestLifestyleClamp:
    def test_clamps_symmetrically(self):
        cap = 100.0
        assert clamp_profile_lifestyle_delta(0, 150, abs_cap=cap) == cap
        assert clamp_profile_lifestyle_delta(0, -150, abs_cap=cap) == -cap
        assert clamp_profile_lifestyle_delta(50, 30, abs_cap=cap) == 80
