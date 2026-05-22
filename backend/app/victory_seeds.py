"""
Конфиги победы по ключам game_starter_templates (victory_config_json).

Временный режим плейтеста: ``playtest_mode: "v1"`` — вернуть канон из *_LEGACY при откате.
"""

from __future__ import annotations

import json
from typing import Any

from .victory_snap import CAR_ASSET_KINDS, RENTAL_HOME_ASSET_KINDS

VICTORY_SCHEMA_VERSION = 1
DEFAULT_TEMPLATE_KEY = "mq_game_basic_v1"
PLAYTEST_MODE_TAG = "v1"


def _expense_ratio_goal(max_ratio: float) -> dict[str, Any]:
    pct = int(round(max_ratio * 100))
    return {
        "key": "burn_ratio",
        "type": "expense_to_income_ratio",
        "title": f"Расходы на жизнь ≤ {pct}% дохода",
        "max_ratio": max_ratio,
        "required": False,
        "enabled": True,
    }


# --- Канон (откат после плейтеста) ---

_BASIC_GOALS_LEGACY: list[dict[str, Any]] = [
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
    _expense_ratio_goal(0.55),
]


def _harder_goals_legacy(min_cash: float) -> list[dict[str, Any]]:
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
        _expense_ratio_goal(0.48),
    ]


# --- Плейтест (временно) ---

_BASIC_GOALS_PLAYTEST: list[dict[str, Any]] = [
    {
        "key": "safety_3x",
        "type": "safety_fund_months",
        "title": "Подушка ≥ 3× обязательств",
        "months_multiplier": 3,
        "required": False,
        "enabled": True,
    },
    {
        "key": "passive_income_100k",
        "type": "passive_income_monthly_min",
        "title": "Пассивный доход ≥ 100 000 ₽/мес",
        "min_monthly": 100_000,
        "required": False,
        "enabled": True,
    },
    {
        "key": "car_owned",
        "type": "asset_kind_any_owned",
        "title": "Машина в собственности",
        "asset_kinds_any": sorted(CAR_ASSET_KINDS),
        "required": False,
        "enabled": True,
    },
]


def _harder_goals_playtest() -> list[dict[str, Any]]:
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
            "key": "passive_net_250k",
            "type": "passive_income_net_monthly_min",
            "title": "Пассивный доход − расходы ≥ 250 000 ₽/мес",
            "min_net": 250_000,
            "required": False,
            "enabled": True,
        },
        {
            "key": "level_10",
            "type": "character_level",
            "title": "Уровень персонажа ≥ 10",
            "min_level": 10,
            "required": False,
            "enabled": True,
        },
        {
            "key": "cash_10m",
            "type": "cash_balance_min",
            "title": "Наличные ≥ 10 000 000 ₽",
            "min_cash": 10_000_000,
            "required": False,
            "enabled": True,
        },
        {
            "key": "rental_home_owned",
            "type": "asset_kind_any_owned",
            "title": "Сдаваемая квартира в собственности",
            "asset_kinds_any": sorted(RENTAL_HOME_ASSET_KINDS),
            "required": False,
            "enabled": True,
        },
    ]


def _config(
    *,
    required_goals_met: int,
    goals: list[dict[str, Any]],
    min_period: int = 7,
    playtest_mode: str | None = PLAYTEST_MODE_TAG,
) -> dict[str, Any]:
    cfg: dict[str, Any] = {
        "schema_version": VICTORY_SCHEMA_VERSION,
        "min_period_index_for_victory": min_period,
        "required_goals_met": required_goals_met,
        "goals": goals,
    }
    if playtest_mode:
        cfg["playtest_mode"] = playtest_mode
    return cfg


_HARDER_PLAYTEST = _harder_goals_playtest()

VICTORY_CONFIG_BY_TEMPLATE_KEY: dict[str, dict[str, Any]] = {
    DEFAULT_TEMPLATE_KEY: _config(required_goals_met=3, goals=list(_BASIC_GOALS_PLAYTEST)),
    "mq_game_tight_budget_v1": _config(required_goals_met=5, goals=list(_HARDER_PLAYTEST)),
    "mq_game_mortgage_stress_v1": _config(required_goals_met=5, goals=list(_HARDER_PLAYTEST)),
    "mq_game_debt_stack_v1": _config(required_goals_met=5, goals=list(_HARDER_PLAYTEST)),
}

# Для отката: подставить VICTORY_CONFIG_BY_TEMPLATE_KEY из LEGACY_* ниже.
VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY: dict[str, dict[str, Any]] = {
    DEFAULT_TEMPLATE_KEY: _config(
        required_goals_met=3,
        goals=list(_BASIC_GOALS_LEGACY),
        playtest_mode=None,
    ),
    "mq_game_tight_budget_v1": _config(
        required_goals_met=3,
        goals=_harder_goals_legacy(12_000),
        playtest_mode=None,
    ),
    "mq_game_mortgage_stress_v1": _config(
        required_goals_met=3,
        goals=_harder_goals_legacy(15_000),
        playtest_mode=None,
    ),
    "mq_game_debt_stack_v1": _config(
        required_goals_met=3,
        goals=_harder_goals_legacy(18_000),
        playtest_mode=None,
    ),
}


def victory_config_for_template(template_key: str | None) -> dict[str, Any]:
    key = (template_key or "").strip() or DEFAULT_TEMPLATE_KEY
    return VICTORY_CONFIG_BY_TEMPLATE_KEY.get(key) or VICTORY_CONFIG_BY_TEMPLATE_KEY[DEFAULT_TEMPLATE_KEY]


def victory_config_json_for_template(template_key: str | None) -> str:
    return json.dumps(victory_config_for_template(template_key), ensure_ascii=False)
