"""
Конфиги победы по ключам game_starter_templates (victory_config_json).
"""

from __future__ import annotations

import json
from typing import Any

VICTORY_SCHEMA_VERSION = 1
DEFAULT_TEMPLATE_KEY = "mq_game_basic_v1"

_BASIC_GOALS: list[dict[str, Any]] = [
    {
        "key": "safety_3x",
        "type": "safety_fund_months",
        "title": "Подушка ≥ 3× обязательств",
        "months_multiplier": 3,
        "required": False,
        "enabled": True,
    },
    {
        "key": "no_overdue",
        "type": "no_overdue",
        "title": "Нет просрочки",
        "required": False,
        "enabled": True,
    },
    {
        "key": "flow_nonneg",
        "type": "net_monthly_cashflow_nonneg",
        "title": "Неотрицательный месячный поток",
        "required": False,
        "enabled": True,
    },
]


def _config(*, required_goals_met: int, goals: list[dict[str, Any]], min_period: int = 7) -> dict[str, Any]:
    return {
        "schema_version": VICTORY_SCHEMA_VERSION,
        "min_period_index_for_victory": min_period,
        "required_goals_met": required_goals_met,
        "goals": goals,
    }


def _harder_goals(min_cash: float) -> list[dict[str, Any]]:
    return [
        {
            "key": "safety_6x",
            "type": "safety_fund_months",
            "title": "Подушка ≥ 6× обязательств",
            "months_multiplier": 6,
            "required": False,
            "enabled": True,
        },
        {
            "key": "no_overdue",
            "type": "no_overdue",
            "title": "Нет просрочки",
            "required": False,
            "enabled": True,
        },
        {
            "key": "avg_liquid_6p",
            "type": "avg_liquid_delta_6p",
            "title": "Средний прирост ликвидности за 6 периодов",
            "window": 6,
            "min_samples": 3,
            "salary_multiplier": 5,
            "required": False,
            "enabled": True,
        },
        {
            "key": "level_5",
            "type": "character_level",
            "title": "Уровень персонажа ≥ 5",
            "min_level": 5,
            "required": False,
            "enabled": True,
        },
        {
            "key": "cash_floor",
            "type": "cash_balance_min",
            "title": f"Наличные ≥ {int(min_cash):,}".replace(",", " "),
            "min_cash": min_cash,
            "required": False,
            "enabled": True,
        },
    ]


VICTORY_CONFIG_BY_TEMPLATE_KEY: dict[str, dict[str, Any]] = {
    DEFAULT_TEMPLATE_KEY: _config(required_goals_met=3, goals=list(_BASIC_GOALS)),
    "mq_game_tight_budget_v1": _config(required_goals_met=3, goals=_harder_goals(12_000)),
    "mq_game_mortgage_stress_v1": _config(required_goals_met=3, goals=_harder_goals(15_000)),
    "mq_game_debt_stack_v1": _config(required_goals_met=3, goals=_harder_goals(18_000)),
}


def victory_config_for_template(template_key: str | None) -> dict[str, Any]:
    key = (template_key or "").strip() or DEFAULT_TEMPLATE_KEY
    return VICTORY_CONFIG_BY_TEMPLATE_KEY.get(key) or VICTORY_CONFIG_BY_TEMPLATE_KEY[DEFAULT_TEMPLATE_KEY]


def victory_config_json_for_template(template_key: str | None) -> str:
    return json.dumps(victory_config_for_template(template_key), ensure_ascii=False)
