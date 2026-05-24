"""Компоненты игровой логики (структура правил, не баланс прогресса)."""

import pytest

from app.game_rules import (
    EVENTS_PER_PERIOD,
    EVENT_TIER_WINDOW_BELOW_BAND,
    MIN_PERIOD_INDEX_FOR_WIN,
    MVP_SAFETY_FUND_OBLIGATIONS_MULTIPLIER,
    REPEAT_POLICY_MAX_PER_PROFILE,
    REPEAT_POLICY_ONCE_PER_PROFILE,
    EventProfileContext,
    EventProfileCounterSnapshot,
    EventPrerequisites,
    clamp_profile_lifestyle_delta,
    evaluate_mvp_victory,
    event_prerequisites_met,
    event_tier_bounds,
    event_tier_in_core_window,
    event_tier_in_fallback_primary,
    event_tier_progression_level,
    is_event_definition_eligible,
    parse_event_prerequisites_json,
    MvpVictoryInput,
)


class TestEventTierWindow:
    @pytest.mark.parametrize(
        "period_index, expected_bounds, progression_level",
        [
            (1, (1, 1), 1),
            (10, (1, 1), 1),
            (11, (1, 2), 2),
            (20, (1, 2), 2),
            (21, (1, 3), 3),
        ],
    )
    def test_bounds_and_progression_level(self, period_index, expected_bounds, progression_level):
        assert event_tier_progression_level(period_index) == progression_level
        assert event_tier_bounds(period_index) == expected_bounds
        assert EVENT_TIER_WINDOW_BELOW_BAND == 2

    @pytest.mark.parametrize(
        "tier, period_index, in_core",
        [
            (1, 1, True),
            (2, 1, False),
            (1, 10, True),
            (2, 10, False),
            (1, 11, True),
            (2, 11, True),
            (3, 11, False),
            (1, 21, True),
            (3, 21, True),
        ],
    )
    def test_core_window(self, tier, period_index, in_core):
        assert event_tier_in_core_window(tier, period_index) is in_core

    def test_fallback_primary_wider_than_core_at_period_21(self):
        period_index = 21
        L = event_tier_progression_level(period_index)
        for tier in range(1, L + 1):
            assert event_tier_in_fallback_primary(tier, period_index)
        assert not event_tier_in_core_window(L + 1, period_index)
        assert not event_tier_in_fallback_primary(L + 1, period_index)


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
