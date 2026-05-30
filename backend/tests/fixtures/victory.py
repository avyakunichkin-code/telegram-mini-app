"""Фабрики VictoryEvaluationInput для unit-тестов victory engine."""

from __future__ import annotations

from app.game.rules import MIN_PERIOD_INDEX_FOR_WIN
from app.victory.engine import VictoryEvaluationInput


def base_victory_snap(**kwargs) -> VictoryEvaluationInput:
    defaults = {
        "period_index": MIN_PERIOD_INDEX_FOR_WIN,
        "safety_fund_balance": 0.0,
        "cash_balance": 20_000.0,
        "total_monthly_obligations": 10_000.0,
        "total_overdue_amount": 0.0,
        "net_monthly_cashflow": 1.0,
        "monthly_salary": 50_000.0,
        "avg_net_cashflow_6p": 0.0,
        "avg_net_cashflow_6p_n": 0,
        "monthly_burn_total": 9_600.0,
        "monthly_passive_income": 0.0,
        "monthly_expenses_total": 19_600.0,
        "owned_asset_kinds": frozenset(),
        "salary_ever_claimed": False,
        "safety_ever_contributed": False,
        "has_active_deposit": False,
        "has_active_bond": False,
        "has_active_insurance": False,
    }
    defaults.update(kwargs)
    return VictoryEvaluationInput(**defaults)


THREE_STEP_GOALS = [
    {
        "key": "step_a",
        "type": "action_once",
        "title": "Зарплата",
        "action": "salary_claimed",
        "enabled": True,
    },
    {
        "key": "step_b",
        "type": "action_once",
        "title": "Инвестиции",
        "action": "invest_opened",
        "enabled": True,
    },
    {
        "key": "step_c",
        "type": "net_monthly_cashflow_nonneg",
        "title": "Cashflow ≥ 0",
        "enabled": True,
    },
]


def three_step_config(*, progression_mode: str, required_goals_met: int = 2) -> dict:
    return {
        "min_period_index_for_victory": MIN_PERIOD_INDEX_FOR_WIN,
        "required_goals_met": required_goals_met,
        "progression_mode": progression_mode,
        "goals": list(THREE_STEP_GOALS),
    }


def skipped_middle_snap(**kwargs) -> VictoryEvaluationInput:
    """Шаг A и C выполнены по raw-метрикам, B — нет (типичный chain vs parallel)."""
    defaults = {
        "salary_ever_claimed": True,
        "has_active_deposit": False,
        "has_active_bond": False,
        "net_monthly_cashflow": 1.0,
    }
    defaults.update(kwargs)
    return base_victory_snap(**defaults)
