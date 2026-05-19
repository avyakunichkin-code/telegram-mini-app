"""
Доли расходов по категориям для game_starter_templates (E1).
Сумма по категориям должна совпадать с base_monthly_lifestyle_expense шаблона.
"""

from __future__ import annotations

from typing import Any

# template_key -> { category_key: amount } — абсолютные суммы (не доли)
EXPENSE_BUDGET_BY_TEMPLATE: dict[str, dict[str, float]] = {
    "mq_game_basic_v1": {
        "housing": 1200,
        "food": 3800,
        "transport": 1100,
        "communications": 900,
        "health": 900,
        "clothing": 700,
        "leisure": 1000,
        "other": 0,
    },
    "mq_game_tight_budget_v1": {
        "housing": 2200,
        "food": 4200,
        "transport": 1900,
        "communications": 1100,
        "health": 1400,
        "clothing": 1100,
        "leisure": 1900,
        "other": 0,
    },
    "mq_game_mortgage_stress_v1": {
        # Ипотека в liabilities; housing = ЖКУ/коммуналка
        "housing": 1800,
        "food": 4500,
        "transport": 2000,
        "communications": 1200,
        "health": 1600,
        "clothing": 1300,
        "leisure": 2700,
        "other": 0,
    },
    "mq_game_debt_stack_v1": {
        "housing": 2000,
        "food": 4800,
        "transport": 2200,
        "communications": 1300,
        "health": 1700,
        "clothing": 1400,
        "leisure": 3200,
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


def expense_budget_for_template(
    template_key: str | None,
    base_monthly: float,
    blueprint: dict[str, Any] | None = None,
) -> dict[str, float]:
    """Возвращает словарь category_key -> amount (≥ 0), сумма ≈ base_monthly."""
    bp = blueprint or {}
    raw = bp.get("expense_budget")
    if isinstance(raw, dict) and raw:
        out = {str(k): max(0.0, float(v or 0)) for k, v in raw.items()}
        return _normalize_sum(out, base_monthly)

    tk = (template_key or "").strip()
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
