"""Инварианты движка достижений (criteria + порядок tier)."""

import json

from app.achievement_engine import (
    AchievementEvaluationContext,
    CRITERIA_SCHEMA_VERSION,
    evaluate_achievement_criteria,
)


def _ctx(**kwargs) -> AchievementEvaluationContext:
    defaults = dict(
        safety_fund_balance=0.0,
        cash_balance=0.0,
        monthly_reference_expense=10_000.0,
        monthly_salary=50_000.0,
        active_insurance_count=0,
        max_deposit_principal=0.0,
        active_bond_count=0,
        total_overdue_amount=0.0,
        clean_period_streak=0,
        period_index=1,
    )
    defaults.update(kwargs)
    return AchievementEvaluationContext(**defaults)


class TestAchievementCriteria:
    def test_safety_fund_months_tiers(self):
        c = _ctx(safety_fund_balance=9_999.0)
        crit1 = {"schema_version": CRITERIA_SCHEMA_VERSION, "type": "safety_fund_months", "months_multiplier": 1}
        assert evaluate_achievement_criteria(crit1, c) is False
        c_ok = _ctx(safety_fund_balance=10_000.0)
        assert evaluate_achievement_criteria(crit1, c_ok) is True
        crit3 = {"schema_version": CRITERIA_SCHEMA_VERSION, "type": "safety_fund_months", "months_multiplier": 3}
        assert evaluate_achievement_criteria(crit3, _ctx(safety_fund_balance=29_999.0)) is False
        assert evaluate_achievement_criteria(crit3, _ctx(safety_fund_balance=30_000.0)) is True

    def test_safety_fund_zero_expense_never_passes(self):
        crit = {"schema_version": CRITERIA_SCHEMA_VERSION, "type": "safety_fund_months", "months_multiplier": 1}
        assert evaluate_achievement_criteria(crit, _ctx(monthly_reference_expense=0, safety_fund_balance=1_000_000)) is False

    def test_liquid_net_worth(self):
        crit = {"schema_version": CRITERIA_SCHEMA_VERSION, "type": "liquid_net_worth", "min_amount": 100_000}
        assert evaluate_achievement_criteria(crit, _ctx(cash_balance=60_000, safety_fund_balance=39_999)) is False
        assert evaluate_achievement_criteria(crit, _ctx(cash_balance=60_000, safety_fund_balance=40_000)) is True

    def test_insurance_and_deposit(self):
        assert evaluate_achievement_criteria(
            {"type": "insurance_active_count", "min_count": 2},
            _ctx(active_insurance_count=1),
        ) is False
        assert evaluate_achievement_criteria(
            {"type": "insurance_active_count", "min_count": 2},
            _ctx(active_insurance_count=2),
        ) is True
        assert evaluate_achievement_criteria(
            {"type": "deposit_opened", "min_principal": 1000},
            _ctx(max_deposit_principal=999),
        ) is False
        assert evaluate_achievement_criteria(
            {"type": "deposit_opened", "min_principal": 1000},
            _ctx(max_deposit_principal=1000),
        ) is True

    def test_stub_always_false(self):
        assert evaluate_achievement_criteria({"type": "stub"}, _ctx(safety_fund_balance=1e9)) is False

    def test_invalid_json_shape_false(self):
        assert evaluate_achievement_criteria(json.loads('{"type": "unknown_xyz"}'), _ctx()) is False
