"""
Контракт trade-off выборов событий (authoring).

Автоматически: event-balance-rules §1/§3 (free lunch, Pareto, xp_delta).
Ручной audit: §10 lifecycle, §11 needs_axis — /event-analysis, EVT1-105.

См. .cursor/skills/create-event/event-balance-rules.md
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

FORBIDDEN_EFFECT_KEYS = frozenset({"xp_delta"})

NEEDS_AXES = ("comfort", "status", "social", "health")


@dataclass(frozen=True)
class BalanceViolation:
    event_key: str
    choice_title: str
    code: str
    detail: str


def _needs_sum_positive(effects: dict[str, Any]) -> float:
    raw = effects.get("needs_delta")
    if not isinstance(raw, dict):
        return 0.0
    return sum(max(0.0, float(raw.get(ax, 0) or 0)) for ax in NEEDS_AXES)


def _needs_sum_negative(effects: dict[str, Any]) -> float:
    raw = effects.get("needs_delta")
    if not isinstance(raw, dict):
        return 0.0
    return sum(min(0.0, float(raw.get(ax, 0) or 0)) for ax in NEEDS_AXES)


def _cash(effects: dict[str, Any]) -> float:
    return float(effects.get("cash_delta", 0) or 0)


def _has_insurance_claim(effects: dict[str, Any]) -> bool:
    return isinstance(effects.get("insurance_claim"), dict)


def _has_special_engine_action(effects: dict[str, Any]) -> bool:
    """Оплата/покупка обрабатывается движком — не сравниваем Pareto по needs+ без cash."""
    return effects.get("used_car_action") is not None


def _has_future_money_cost(effects: dict[str, Any]) -> bool:
    if effects.get("monthly_burn_delta_pct") not in (None, 0, 0.0):
        return float(effects.get("monthly_burn_delta_pct") or 0) > 0
    if float(effects.get("monthly_lifestyle_delta", 0) or 0) > 0:
        return True
    if float(effects.get("monthly_expense_delta", 0) or 0) > 0:
        return True
    line = effects.get("expense_line")
    if isinstance(line, dict):
        amt = float(line.get("amount_monthly", line.get("amount", 0)) or 0)
        if amt > 0:
            return True
    return False


def _choice_vector(effects: dict[str, Any]) -> tuple[float, float, float]:
    """cash, needs_plus, burn_flag (0/1 lower is better for burn cost)."""
    burn_penalty = 1.0 if _has_future_money_cost(effects) else 0.0
    return (_cash(effects), _needs_sum_positive(effects), -burn_penalty)


def _pareto_dominates(a: dict[str, Any], b: dict[str, Any]) -> bool:
    va, vb = _choice_vector(a), _choice_vector(b)
    not_worse = all(x >= y for x, y in zip(va, vb))
    strictly_better = any(x > y for x, y in zip(va, vb))
    return not_worse and strictly_better


def is_free_lunch(effects: dict[str, Any], *, needs_threshold: float = 0.5) -> bool:
    """needs+ без cash-, burn+ и без compensating needs- на других осях."""
    if _needs_sum_positive(effects) <= needs_threshold:
        return False
    if _cash(effects) < -1e-6:
        return False
    if _has_future_money_cost(effects):
        return False
    if _needs_sum_negative(effects) < -1e-6:
        return False
    return True


def validate_choice_effects(
    event_key: str,
    choice_title: str,
    effects: dict[str, Any],
) -> list[BalanceViolation]:
    out: list[BalanceViolation] = []
    if not isinstance(effects, dict):
        return out
    for bad in set(effects.keys()) & FORBIDDEN_EFFECT_KEYS:
        out.append(
            BalanceViolation(
                event_key, choice_title, "forbidden_effect", f"{bad} removed from product (ADR-003)"
            )
        )
    if is_free_lunch(effects):
        out.append(
            BalanceViolation(
                event_key,
                choice_title,
                "free_lunch",
                "needs+ without cash-, burn+, or needs- on other axes",
            )
        )
    return out


def validate_event_spec(spec: dict[str, Any]) -> list[BalanceViolation]:
    key = str(spec.get("key") or "")
    violations: list[BalanceViolation] = []
    choices = spec.get("choices") or []
    effect_list = [ch.get("effects") or {} for ch in choices if isinstance(ch, dict)]

    for ch in choices:
        if not isinstance(ch, dict):
            continue
        title = str(ch.get("title") or "")
        violations.extend(validate_choice_effects(key, title, ch.get("effects") or {}))

    for i, ea in enumerate(effect_list):
        for j, eb in enumerate(effect_list):
            if i >= j:
                continue
            if _has_insurance_claim(ea) or _has_insurance_claim(eb):
                continue
            if _has_special_engine_action(ea) or _has_special_engine_action(eb):
                continue
            if _pareto_dominates(ea, eb):
                ti = str(choices[i].get("title") or i)
                tj = str(choices[j].get("title") or j)
                violations.append(
                    BalanceViolation(
                        key,
                        ti,
                        "pareto_dominates",
                        f"dominates «{tj}» (better cash, needs+, lower burn cost)",
                    )
                )
    return violations


def validate_mvp11_balance(specs: list[dict]) -> list[BalanceViolation]:
    all_v: list[BalanceViolation] = []
    for spec in specs:
        all_v.extend(validate_event_spec(spec))
    return all_v
