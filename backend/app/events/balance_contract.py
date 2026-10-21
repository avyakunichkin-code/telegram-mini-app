"""
Контракт trade-off выборов событий (authoring).

Автоматически: event-balance-rules §1/§3 (free lunch, Pareto, xp_delta).
Ручной audit: §10 lifecycle, §11 needs_axis — /event-analysis, EVT1-105.

См. .claude/skills/create-event/event-balance-rules.md
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

FORBIDDEN_EFFECT_KEYS = frozenset({"xp_delta"})

NEEDS_AXES = ("comfort", "status", "social", "health")

DECLINE_TITLE_MARKERS = (
    "отказ",
    "остаться",
    "не участ",
    "пропуст",
    "не трат",
    "не брать",
    "закрыться",
    "не идти",
    "не ехать",
)


def _is_decline_choice(title: str) -> bool:
    t = str(title or "").lower()
    return any(marker in t for marker in DECLINE_TITLE_MARKERS)


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


REFERENCE_SALARY = 62_500.0  # Студент — для сравнения выборов с cash_pct_salary без профиля


def _cash(effects: dict[str, Any]) -> float:
    if "cash_delta" not in effects and effects.get("cash_pct_salary") is not None:
        return -float(effects["cash_pct_salary"]) * REFERENCE_SALARY
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


def _monthly_burn_delta_rub(effects: dict[str, Any]) -> float:
    """Суммарная дельта burn в ₽/мес из явных полей (без pct — нужен профиль)."""
    delta = float(effects.get("monthly_lifestyle_delta", 0) or 0)
    delta += float(effects.get("monthly_expense_delta", 0) or 0)
    line = effects.get("expense_line")
    if isinstance(line, dict):
        delta += float(line.get("amount_monthly", line.get("amount", 0)) or 0)
    return delta


def _burn_axis_score(effects: dict[str, Any]) -> float:
    """Выше = лучше для игрока: экономия burn ↑, рост burn ↓."""
    delta = _monthly_burn_delta_rub(effects)
    if delta < -1e-6:
        return abs(delta) / 500.0
    if delta > 1e-6:
        return -delta / 500.0
    pct = effects.get("monthly_burn_delta_pct")
    if pct is not None and float(pct or 0) > 1e-6:
        return -2.0
    return 0.0


def _has_enqueue_event(effects: dict[str, Any]) -> bool:
    return isinstance(effects.get("enqueue_event"), dict)


def _choice_vector(effects: dict[str, Any]) -> tuple[float, float, float, float]:
    """cash, needs+, needs_minus (выше = лучше), burn_score (выше = лучше)."""
    return (
        _cash(effects),
        _needs_sum_positive(effects),
        _needs_sum_negative(effects),
        _burn_axis_score(effects),
    )


def _pareto_dominates(a: dict[str, Any], b: dict[str, Any]) -> bool:
    va, vb = _choice_vector(a), _choice_vector(b)
    not_worse = all(x >= y for x, y in zip(va, vb))
    strictly_better = any(x > y for x, y in zip(va, vb))
    return not_worse and strictly_better


def is_free_lunch(effects: dict[str, Any], *, needs_threshold: float = 0.5) -> bool:
    if _needs_sum_positive(effects) <= needs_threshold:
        return False
    if _cash(effects) < -1e-6:
        return False
    if _has_future_money_cost(effects):
        return False
    if _needs_sum_negative(effects) < -1e-6:
        return False
    return True


def is_refusal_net_needs_bonus(effects: dict[str, Any]) -> bool:
    """Отказ с net needs+ без cash/burn — §2 event-balance-rules."""
    if _cash(effects) < -1e-6 or _has_future_money_cost(effects):
        return False
    pos = _needs_sum_positive(effects)
    if pos <= 0.5:
        return False
    neg = _needs_sum_negative(effects)
    return pos + neg > 0.5


def validate_choice_effects(
    event_key: str,
    choice_title: str,
    effects: dict[str, Any],
    *,
    scenario_shape: str | None = None,
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
    shape = str(scenario_shape or "").lower()
    if shape in {"soft_offer", "tradeoff"} and _is_decline_choice(choice_title):
        if is_refusal_net_needs_bonus(effects):
            out.append(
                BalanceViolation(
                    event_key,
                    choice_title,
                    "refusal_needs_bonus",
                    "decline choice with net needs+ and no cash/burn cost",
                )
            )
    return out


def validate_event_spec(spec: dict[str, Any]) -> list[BalanceViolation]:
    key = str(spec.get("key") or spec.get("definition_key") or "")
    scenario_shape = spec.get("scenario_shape")
    violations: list[BalanceViolation] = []
    choices = spec.get("choices") or []
    effect_list = [ch.get("effects") or {} for ch in choices if isinstance(ch, dict)]

    for ch in choices:
        if not isinstance(ch, dict):
            continue
        title = str(ch.get("title") or "")
        violations.extend(
            validate_choice_effects(
                key,
                title,
                ch.get("effects") or {},
                scenario_shape=scenario_shape,
            )
        )

    for i, ea in enumerate(effect_list):
        for j, eb in enumerate(effect_list):
            if i >= j:
                continue
            if _has_insurance_claim(ea) or _has_insurance_claim(eb):
                continue
            if _has_special_engine_action(ea) or _has_special_engine_action(eb):
                continue
            if _has_enqueue_event(ea) or _has_enqueue_event(eb):
                continue
            if ea.get("requires_chain_branch") or eb.get("requires_chain_branch"):
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
            elif _pareto_dominates(eb, ea):
                ti = str(choices[i].get("title") or i)
                tj = str(choices[j].get("title") or j)
                violations.append(
                    BalanceViolation(
                        key,
                        tj,
                        "pareto_dominates",
                        f"dominates «{ti}» (better cash, needs+, lower burn cost)",
                    )
                )
    return violations


def validate_mvp11_balance(specs: list[dict]) -> list[BalanceViolation]:
    all_v: list[BalanceViolation] = []
    for spec in specs:
        all_v.extend(validate_event_spec(spec))
    return all_v


# --- Коридор кривой цены (SPEC_needs-set-point §1, PLAN NV-102) ---
# Только отчёт: предупреждения не входят в validate_mvp11_balance и не ломают contract.

CURVE_TOLERANCE = 0.5
PLEASURE_AXIS_CAP = 15.0


@dataclass(frozen=True)
class CurveWarning:
    event_key: str
    choice_title: str
    code: str  # curve_over | curve_under | axis_cap
    needs_plus: float
    expected_min: float
    expected_max: float
    detail: str


def template_salaries() -> dict[str, float]:
    """template_key → monthly_salary из сидов стартовых шаблонов."""
    from ..seeds.game_starter_templates import GAME_STARTER_TEMPLATE_SEEDS

    out: dict[str, float] = {}
    for seed in GAME_STARTER_TEMPLATE_SEEDS:
        salary = (seed.get("blueprint") or {}).get("monthly_salary")
        if salary:
            out[str(seed["template_key"])] = float(salary)
    return out


def _audience_salaries(spec: dict[str, Any], salaries: dict[str, float]) -> list[float]:
    keys = [str(k) for k in (spec.get("audience_template_keys") or []) if k]
    if not keys or "all" in keys:
        return sorted(salaries.values())
    picked = [salaries[k] for k in keys if k in salaries]
    return sorted(picked) or sorted(salaries.values())


def _is_one_off_spend(effects: dict[str, Any]) -> bool:
    """Разовая трата без регулярных расходов и действий движка — к ней применима кривая."""
    if _cash(effects) >= -1e-6:
        return False
    if _has_future_money_cost(effects) or _monthly_burn_delta_rub(effects) < -1e-6:
        return False
    if _has_insurance_claim(effects) or _has_special_engine_action(effects):
        return False
    if isinstance(effects.get("asset_from_template"), dict):
        return False
    return True


def curve_corridor_warnings(
    specs: list[dict],
    *,
    salaries: dict[str, float] | None = None,
    tolerance: float = CURVE_TOLERANCE,
    axis_cap: float = PLEASURE_AXIS_CAP,
) -> list[CurveWarning]:
    """Выборы с разовой тратой, чьи needs+ выходят из коридора needs_points ± tolerance."""
    from ..needs.value_curve import needs_points

    sal = salaries if salaries is not None else template_salaries()
    out: list[CurveWarning] = []
    for spec in specs:
        key = str(spec.get("key") or spec.get("definition_key") or "")
        audience = _audience_salaries(spec, sal)
        if not audience:
            continue
        for ch in spec.get("choices") or []:
            if not isinstance(ch, dict):
                continue
            effects = ch.get("effects") or {}
            if not isinstance(effects, dict) or not _is_one_off_spend(effects):
                continue
            plus = _needs_sum_positive(effects)
            if plus <= 0.5:
                continue
            title = str(ch.get("title") or "")
            purpose = str(ch.get("purpose") or "pleasure")
            if purpose != "pleasure":
                continue  # смягчение, вложение, обязательство — не покупка удовольствия
            pct = effects.get("cash_pct_salary")
            if pct is not None and "cash_delta" not in effects:
                # Доля зарплаты: баллы одинаковы у всех персон.
                cost = float(pct) * REFERENCE_SALARY
                lo = needs_points(cost, REFERENCE_SALARY) * (1 - tolerance)
                hi = needs_points(cost, REFERENCE_SALARY) * (1 + tolerance)
            else:
                cost = -_cash(effects)
                # Богатая персона получает за ту же сумму меньше баллов.
                lo = needs_points(cost, audience[-1]) * (1 - tolerance)
                hi = needs_points(cost, audience[0]) * (1 + tolerance)
            if plus > hi:
                out.append(CurveWarning(key, title, "curve_over", plus, lo, hi,
                                        f"needs+ {plus:g} > {hi:.1f} за {cost:g} руб"))
            elif plus < lo:
                out.append(CurveWarning(key, title, "curve_under", plus, lo, hi,
                                        f"needs+ {plus:g} < {lo:.1f} за {cost:g} руб"))
            raw = effects.get("needs_delta") or {}
            over_axes = [ax for ax in NEEDS_AXES if float(raw.get(ax, 0) or 0) > axis_cap]
            if over_axes:
                out.append(CurveWarning(key, title, "axis_cap", plus, lo, hi,
                                        f"оси {', '.join(over_axes)} > {axis_cap:g} за выбор"))
    return out
