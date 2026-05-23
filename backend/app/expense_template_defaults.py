"""
Доли расходов по категориям для game_starter_templates (E1).
Сумма по категориям должна совпадать с base_monthly_lifestyle_expense шаблона.
См. docs/vision/ideas/starter-template-balance-ladder.md
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session


# template_key -> { category_key: amount } — абсолютные суммы (не доли)
EXPENSE_BUDGET_BY_TEMPLATE: dict[str, dict[str, float]] = {
    "mq_game_basic_v1": {
        "housing": 5500,
        "food": 9500,
        "transport": 2800,
        "communications": 2200,
        "health": 2200,
        "clothing": 1800,
        "leisure": 1000,
        "other": 0,
    },
    "mq_game_tight_budget_v1": {
        "housing": 28000,
        "food": 12000,
        "transport": 4000,
        "communications": 2500,
        "health": 3000,
        "clothing": 2500,
        "leisure": 4000,
        "other": 0,
    },
    "mq_game_mortgage_stress_v1": {
        # Ипотека в liabilities; housing = ЖКУ, быт, семья ~4 чел.
        "housing": 32000,
        "food": 24000,
        "transport": 5000,
        "communications": 2500,
        "health": 3000,
        "clothing": 2000,
        "leisure": 2500,
        "other": 0,
    },
    "mq_game_debt_stack_v1": {
        "housing": 38000,
        "food": 32000,
        "transport": 8000,
        "communications": 4000,
        "health": 5000,
        "clothing": 4000,
        "leisure": 17000,
        "other": 0,
    },
}

# Пропорции по умолчанию, если в blueprint нет expense_budget
_DEFAULT_SHARES: dict[str, float] = {
    "housing": 0.14,
    "food": 0.38,
    "transport": 0.12,
    "communications": 0.08,
    "health": 0.09,
    "clothing": 0.07,
    "leisure": 0.12,
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
    # масштабируем пропорционально
    scale = target / current
    scaled = {k: round(max(0.0, float(budget[k])) * scale, 2) for k in keys}
    diff = round(target - sum(scaled.values()), 2)
    if abs(diff) >= 0.01 and keys:
        scaled[keys[0]] = round(scaled[keys[0]] + diff, 2)
    return scaled
