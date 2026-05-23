"""
Доли расходов по категориям для game_starter_templates (E1).
Сумма по категориям должна совпадать с base_monthly_lifestyle_expense шаблона.
Жильё/аренда/ЖКУ — в активах (owned / leased), не в burn. См. starter-template-balance-ladder.md
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session


# template_key -> { category_key: amount } — без housing
EXPENSE_BUDGET_BY_TEMPLATE: dict[str, dict[str, float]] = {
    "mq_game_basic_v1": {
        "housing": 0,
        "food": 16600,
        "transport": 5200,
        "communications": 3500,
        "health": 3900,
        "clothing": 3100,
        "leisure": 5200,
        "other": 0,
    },
    "mq_game_tight_budget_v1": {
        "housing": 0,
        "food": 12150,
        "transport": 3850,
        "communications": 2575,
        "health": 2860,
        "clothing": 2210,
        "leisure": 3855,
        "other": 0,
    },
    "mq_game_mortgage_stress_v1": {
        "housing": 0,
        "food": 19300,
        "transport": 6100,
        "communications": 4075,
        "health": 4540,
        "clothing": 3520,
        "leisure": 6090,
        "other": 0,
    },
    "mq_game_debt_stack_v1": {
        "housing": 0,
        "food": 40350,
        "transport": 12750,
        "communications": 8515,
        "health": 9490,
        "clothing": 7360,
        "leisure": 12785,
        "other": 0,
    },
}

# Пропорции по умолчанию (без жилья — для Plan и fallback)
_DEFAULT_SHARES: dict[str, float] = {
    "housing": 0.0,
    "food": 0.44,
    "transport": 0.14,
    "communications": 0.09,
    "health": 0.10,
    "clothing": 0.08,
    "leisure": 0.15,
    "other": 0.0,
}


def default_plan_expense_budget(monthly_salary: float, *, lifestyle_share: float = 0.55) -> dict[str, float]:
    """Стартовый бюджет Plan: доля зарплаты по категориям (_DEFAULT_SHARES)."""
    salary = max(0.0, float(monthly_salary or 0))
    if salary <= 0:
        return {k: 0.0 for k in _DEFAULT_SHARES}
    target = round(salary * lifestyle_share, 2)
    rough = {k: round(target * share) for k, share in _DEFAULT_SHARES.items()}
    return _normalize_sum(rough, target)


def expense_budget_for_template(
    template_key: str | None,
    base_monthly: float,
    blueprint: dict[str, Any] | None = None,
    db: Session | None = None,
) -> dict[str, float]:
    """Возвращает словарь category_key -> amount (≥ 0), сумма ≈ base_monthly.

    Приоритет: ``blueprint.expense_budget`` → строки в БД ``game_starter_template_expense_allocations``
    → пресеты Python ``EXPENSE_BUDGET_BY_TEMPLATE`` → доли ``_DEFAULT_SHARES``.
    """
    bp = blueprint or {}
    raw = bp.get("expense_budget")
    if isinstance(raw, dict) and raw:
        out = {str(k): max(0.0, float(v or 0)) for k, v in raw.items()}
        return _normalize_sum(out, base_monthly)

    tk = (template_key or "").strip()
    if db is not None and tk:
        from .models import GameStarterTemplateExpenseAllocation

        rows = (
            db.query(GameStarterTemplateExpenseAllocation)
            .filter(GameStarterTemplateExpenseAllocation.template_key == tk)
            .all()
        )
        if rows:
            weights = {str(r.category_key): max(0.0, float(r.weight or 0)) for r in rows}
            total_w = sum(weights.values())
            if total_w > 0:
                rough = {k: float(base_monthly) * (weights[k] / total_w) for k in weights}
                return _normalize_sum(rough, base_monthly)

    if tk in EXPENSE_BUDGET_BY_TEMPLATE:
        preset = dict(EXPENSE_BUDGET_BY_TEMPLATE[tk])
        if base_monthly > 0 and abs(sum(preset.values()) - base_monthly) > 0.01:
            return _normalize_sum(preset, base_monthly)
        return preset

    if base_monthly <= 0:
        return {k: 0.0 for k in _DEFAULT_SHARES}

    rough = {k: round(base_monthly * share) for k, share in _DEFAULT_SHARES.items()}
    return _normalize_sum(rough, base_monthly)


def _normalize_sum(budget: dict[str, float], target: float) -> dict[str, float]:
    target = max(0.0, float(target))
    if not budget:
        return {"other": target}
    keys = list(budget.keys())
    current = sum(max(0.0, float(budget[k])) for k in keys)
    if current <= 0:
        out = {k: 0.0 for k in keys}
        if keys:
            out[keys[0]] = target
        else:
            out["other"] = target
        return out
    if abs(current - target) < 0.02:
        return {k: round(max(0.0, float(budget[k])), 2) for k in keys}
    scale = target / current
    scaled = {k: round(max(0.0, float(budget[k])) * scale, 2) for k in keys}
    diff = round(target - sum(scaled.values()), 2)
    if abs(diff) >= 0.01 and keys:
        scaled[keys[0]] = round(scaled[keys[0]] + diff, 2)
    return scaled
