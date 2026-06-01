"""
Конфиги победы по ключам game_starter_templates (victory_config_json).

Учебная цепочка (tutorial): action_once + requires_mechanics + mechanics_unlock в blueprint.
Откат: VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY и playtest_mode без tutorial.
"""

from __future__ import annotations

import json
from typing import Any

from ..victory.mechanics_progression import (
    MECHANIC_CAPITAL_INVEST,
    MECHANIC_CAPITAL_INSURANCE,
    MECHANIC_CAPITAL_PROPERTY,
    MECHANIC_DASHBOARD_CORE,
)
from .snap import RENTAL_HOME_ASSET_KINDS

VICTORY_SCHEMA_VERSION = 1
DEFAULT_TEMPLATE_KEY = "mq_game_basic_v1"
PLAYTEST_MODE_TAG = "tutorial"


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
            "key": "cash_floor",
            "type": "cash_balance_min",
            "title": f"Наличные ≥ {int(min_cash):,}".replace(",", " "),
            "min_cash": min_cash,
            "required": False,
            "enabled": True,
        },
        _expense_ratio_goal(0.48),
    ]


# --- Учебная цепочка (basic) ---

_BASIC_TUTORIAL_CHAIN: list[dict[str, Any]] = [
    {
        "key": "tutorial_salary",
        "type": "action_once",
        "title": "Забрать зарплату (первый ход)",
        "action": "salary_claimed",
        "requires_mechanics": [MECHANIC_DASHBOARD_CORE],
        "required": False,
        "enabled": True,
    },
    {
        "key": "tutorial_cushion",
        "type": "action_once",
        "title": "Подушка: внести любую сумму (фундамент безопасности)",
        "action": "safety_contributed",
        "requires_mechanics": [MECHANIC_DASHBOARD_CORE],
        "required": False,
        "enabled": True,
    },
    {
        "key": "tutorial_invest",
        "type": "action_once",
        "title": "Инвестиции: открыть депозит или купить облигацию (можно от 1 000 ₽)",
        "action": "invest_opened",
        "requires_mechanics": [MECHANIC_CAPITAL_INVEST],
        "required": False,
        "enabled": True,
    },
    {
        "key": "safety_3x",
        "type": "safety_fund_months",
        "title": "Подушка ≥ 3× текущих расходов за период",
        "months_multiplier": 3,
        "requires_mechanics": [MECHANIC_DASHBOARD_CORE],
        "required": False,
        "enabled": True,
    },
    {
        "key": "invest_income_15k",
        "type": "passive_income_monthly_min",
        "title": "Доход с инвестиций ≥ 15 000 ₽/мес",
        "min_monthly": 15_000,
        "requires_mechanics": [MECHANIC_CAPITAL_INVEST],
        "required": False,
        "enabled": True,
    },
]


_HARDER_TUTORIAL_CORE: list[dict[str, Any]] = [
    {
        "key": "tutorial_salary",
        "type": "action_once",
        "title": "Забрать зарплату (первый ход)",
        "action": "salary_claimed",
        "requires_mechanics": [MECHANIC_DASHBOARD_CORE],
        "required": False,
        "enabled": True,
    },
    {
        "key": "tutorial_cushion",
        "type": "action_once",
        "title": "Подушка: внести любую сумму (фундамент безопасности)",
        "action": "safety_contributed",
        "requires_mechanics": [MECHANIC_DASHBOARD_CORE],
        "required": False,
        "enabled": True,
    },
    {
        "key": "tutorial_invest",
        "type": "action_once",
        "title": "Инвестиции: открыть депозит или купить облигацию (можно от 1 000 ₽)",
        "action": "invest_opened",
        "requires_mechanics": [MECHANIC_CAPITAL_INVEST],
        "required": False,
        "enabled": True,
    },
    {
        "key": "tutorial_insurance",
        "type": "action_once",
        "title": "Страховка: оформить любой полис (понять премии и выплаты)",
        "action": "insurance_purchased",
        "requires_mechanics": [MECHANIC_CAPITAL_INSURANCE],
        "required": False,
        "enabled": True,
    },
    {
        "key": "safety_6x",
        "type": "safety_fund_months",
        "title": "Подушка ≥ 6× текущих расходов за период",
        "months_multiplier": 6,
        "requires_mechanics": [MECHANIC_DASHBOARD_CORE],
        "required": False,
        "enabled": True,
    },
    {
        "key": "invest_income_80k",
        "type": "passive_income_monthly_min",
        "title": "Доход с инвестиций ≥ 80 000 ₽/мес",
        "min_monthly": 80_000,
        "requires_mechanics": [MECHANIC_CAPITAL_INVEST],
        "required": False,
        "enabled": True,
    },
]

_HARDER_FINALE_CASH_10M: dict[str, Any] = {
    "key": "cash_10m",
    "type": "cash_balance_min",
    "title": "Наличные ≥ 10 000 000 ₽",
    "min_cash": 10_000_000,
    "requires_mechanics": [MECHANIC_DASHBOARD_CORE],
    "required": False,
    "enabled": True,
}

_HARDER_FINALE_RENTAL: dict[str, Any] = {
    "key": "rental_home_owned",
    "type": "asset_kind_any_owned",
    "title": "Сдаваемая квартира в собственности",
    "asset_kinds_any": sorted(RENTAL_HOME_ASSET_KINDS),
    "requires_mechanics": [MECHANIC_CAPITAL_PROPERTY],
    "required": False,
    "enabled": True,
}


def _harder_tutorial_chain(template_key: str) -> list[dict[str, Any]]:
    goals = list(_HARDER_TUTORIAL_CORE)
    # Временный финал: "наличные" для всех harder-шаблонов.
    # Причина: цель "сдаваемая квартира" легко эксплойтится (нет связи ипотека↔объект,
    # нет первоначальных взносов/лимитов, можно брать много ипотек и купить что угодно).
    goals.append(dict(_HARDER_FINALE_CASH_10M))
    return goals


def _config(
    *,
    required_goals_met: int,
    goals: list[dict[str, Any]],
    playtest_mode: str | None = PLAYTEST_MODE_TAG,
    progression_mode: str = "chain",
) -> dict[str, Any]:
    cfg: dict[str, Any] = {
        "schema_version": VICTORY_SCHEMA_VERSION,
        "required_goals_met": required_goals_met,
        "progression_mode": progression_mode,
        "goals": goals,
    }
    if playtest_mode:
        cfg["playtest_mode"] = playtest_mode
    return cfg


VICTORY_CONFIG_BY_TEMPLATE_KEY: dict[str, dict[str, Any]] = {
    DEFAULT_TEMPLATE_KEY: _config(
        required_goals_met=len(_BASIC_TUTORIAL_CHAIN),
        goals=list(_BASIC_TUTORIAL_CHAIN),
    ),
    "mq_game_tight_budget_v1": _config(
        required_goals_met=len(_harder_tutorial_chain("mq_game_tight_budget_v1")),
        goals=_harder_tutorial_chain("mq_game_tight_budget_v1"),
    ),
    "mq_game_mortgage_stress_v1": _config(
        required_goals_met=len(_harder_tutorial_chain("mq_game_mortgage_stress_v1")),
        goals=_harder_tutorial_chain("mq_game_mortgage_stress_v1"),
    ),
    "mq_game_debt_stack_v1": _config(
        required_goals_met=len(_harder_tutorial_chain("mq_game_debt_stack_v1")),
        goals=_harder_tutorial_chain("mq_game_debt_stack_v1"),
    ),
}

VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY: dict[str, dict[str, Any]] = {
    DEFAULT_TEMPLATE_KEY: _config(
        required_goals_met=3,
        goals=list(_BASIC_GOALS_LEGACY),
        playtest_mode=None,
        progression_mode="parallel",
    ),
    "mq_game_tight_budget_v1": _config(
        required_goals_met=3,
        goals=_harder_goals_legacy(12_000),
        playtest_mode=None,
        progression_mode="parallel",
    ),
    "mq_game_mortgage_stress_v1": _config(
        required_goals_met=3,
        goals=_harder_goals_legacy(15_000),
        playtest_mode=None,
        progression_mode="parallel",
    ),
    "mq_game_debt_stack_v1": _config(
        required_goals_met=3,
        goals=_harder_goals_legacy(18_000),
        playtest_mode=None,
        progression_mode="parallel",
    ),
}


def victory_config_for_template(template_key: str | None) -> dict[str, Any]:
    key = (template_key or "").strip() or DEFAULT_TEMPLATE_KEY
    return VICTORY_CONFIG_BY_TEMPLATE_KEY.get(key) or VICTORY_CONFIG_BY_TEMPLATE_KEY[DEFAULT_TEMPLATE_KEY]


def victory_config_json_for_template(template_key: str | None) -> str:
    return json.dumps(victory_config_for_template(template_key), ensure_ascii=False)
