"""
Движок победы v2: цели из victory_config_json шаблона.

Режимы:
- ``chain`` — цепочка: цель засчитывается только после предыдущих; победа — все шаги по порядку.
- ``parallel`` — M из N (legacy): любые цели из списка.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, replace
from typing import Any

from ..victory.mechanics_progression import (
    MECHANIC_DASHBOARD_CORE,
    compute_mechanics_effective,
    goal_mechanics_available,
    goal_requires_list,
    _template_allows_requires,
)
from ..victory.mechanics_progression import CAPITAL_MECHANIC_KEYS
from ..starters.mechanics import DEFAULT_MECHANICS
from .seeds import DEFAULT_TEMPLATE_KEY, victory_config_for_template

VICTORY_SCHEMA_VERSION = 1

PROGRESSION_CHAIN = "chain"
PROGRESSION_PARALLEL = "parallel"


@dataclass(frozen=True)
class VictoryEvaluationInput:
    period_index: int
    safety_fund_balance: float
    cash_balance: float
    total_monthly_obligations: float
    total_overdue_amount: float
    net_monthly_cashflow: float
    monthly_salary: float
    avg_net_cashflow_6p: float
    avg_net_cashflow_6p_n: int
    monthly_burn_total: float = 0
    monthly_passive_income: float = 0
    monthly_expenses_total: float = 0
    owned_asset_kinds: frozenset[str] = frozenset()
    salary_ever_claimed: bool = False
    safety_ever_contributed: bool = False
    has_active_deposit: bool = False
    has_active_bond: bool = False
    has_active_insurance: bool = False


@dataclass(frozen=True)
class VictoryGoalResult:
    key: str
    type: str
    title: str
    required: bool
    enabled: bool
    met: bool
    progress: float = 0.0
    detail: dict[str, Any] = field(default_factory=dict)
    available: bool = True
    blocked_reason: str | None = None


@dataclass(frozen=True)
class VictoryEvaluationResult:
    schema_version: int
    template_key: str
    min_period_index: int
    period_gate_open: bool
    progression_mode: str
    current_goal_key: str | None
    goals_met: int
    goals_required: int
    goals_enabled: int
    win_reached: bool
    win_ready: bool
    win_target_safety_fund: float
    win_progress_safety_fund: float
    goals: tuple[VictoryGoalResult, ...]
    mechanics_effective: dict[str, bool] = field(default_factory=dict)


def parse_victory_config(raw: str | dict[str, Any] | None, *, template_key: str | None = None) -> dict[str, Any]:
    if isinstance(raw, dict):
        cfg = raw
    elif raw and str(raw).strip() not in ("", "{}"):
        try:
            cfg = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            cfg = {}
    else:
        cfg = {}

    if not cfg or not cfg.get("goals"):
        return victory_config_for_template(template_key)

    return cfg


def _goal_enabled(goal: dict[str, Any]) -> bool:
    return bool(goal.get("enabled", True))


def _evaluate_goal(goal: dict[str, Any], snap: VictoryEvaluationInput) -> VictoryGoalResult:
    gtype = str(goal.get("type") or "").strip()
    key = str(goal.get("key") or gtype or "goal")
    title = str(goal.get("title") or key)
    required = bool(goal.get("required", False))
    enabled = _goal_enabled(goal)

    met = False
    progress = 0.0
    detail: dict[str, Any] = {}

    if not enabled:
        return VictoryGoalResult(
            key=key,
            type=gtype,
            title=title,
            required=required,
            enabled=False,
            met=False,
            progress=0.0,
            detail=detail,
            available=False,
            blocked_reason=None,
        )

    if gtype == "action_once":
        action = str(goal.get("action") or "").strip()
        detail = {"action": action}
        met = False
        if action == "salary_claimed":
            met = bool(snap.salary_ever_claimed)
        elif action == "safety_contributed":
            met = bool(snap.safety_ever_contributed)
        elif action == "invest_deposit_opened":
            met = bool(snap.has_active_deposit)
        elif action == "invest_bond_bought":
            met = bool(snap.has_active_bond)
        elif action == "invest_opened":
            met = bool(snap.has_active_deposit or snap.has_active_bond)
        elif action == "insurance_purchased":
            met = bool(snap.has_active_insurance)
        else:
            detail["error"] = f"unknown_action:{action}"
        progress = 1.0 if met else 0.0
        return VictoryGoalResult(
            key=key,
            type=gtype,
            title=title,
            required=required,
            enabled=True,
            met=met,
            progress=progress,
            detail=detail,
        )

    obligations = float(snap.total_monthly_obligations)

    if gtype == "safety_fund_months":
        mult = float(goal.get("months_multiplier", 3))
        # Та же база, что у overview.safety_fund_baseline_target: обязательства + burn.
        pressure = float(snap.monthly_expenses_total)
        if pressure <= 0:
            pressure = obligations
        target = pressure * mult
        current = float(snap.safety_fund_balance)
        detail = {
            "target": target,
            "current": current,
            "months_multiplier": mult,
            "pressure_monthly": pressure,
        }
        if target > 0:
            progress = min(1.0, current / target)
            met = current >= target
        else:
            progress = 0.0
            met = False

    elif gtype == "no_overdue":
        overdue = float(snap.total_overdue_amount)
        detail = {"total_overdue_amount": overdue}
        met = overdue <= 0
        progress = 1.0 if met else 0.0

    elif gtype == "net_monthly_cashflow_nonneg":
        flow = float(snap.net_monthly_cashflow)
        detail = {"net_monthly_cashflow": flow}
        met = flow >= 0
        progress = 1.0 if met else max(0.0, min(1.0, 1.0 + flow / max(abs(flow), 1.0))) if flow < 0 else 1.0

    elif gtype == "avg_liquid_delta_6p":
        window = int(goal.get("window", 6))
        min_samples = int(goal.get("min_samples", 3))
        avg = float(snap.avg_net_cashflow_6p)
        n = int(snap.avg_net_cashflow_6p_n)
        salary = float(snap.monthly_salary)
        salary_mult = goal.get("salary_multiplier")
        min_avg = goal.get("min_avg")

        if salary_mult is not None:
            threshold = salary * float(salary_mult)
            detail = {
                "avg_net_cashflow_6p": avg,
                "samples": n,
                "window": window,
                "threshold": threshold,
                "monthly_salary": salary,
                "salary_multiplier": float(salary_mult),
            }
        elif min_avg is not None:
            threshold = float(min_avg)
            detail = {
                "avg_net_cashflow_6p": avg,
                "samples": n,
                "window": window,
                "threshold": threshold,
            }
        else:
            threshold = 0.0
            detail = {"avg_net_cashflow_6p": avg, "samples": n, "window": window, "threshold": threshold}

        if n < min_samples:
            met = False
            progress = n / min_samples if min_samples > 0 else 0.0
        elif threshold > 0:
            progress = min(1.0, max(0.0, avg / threshold))
            met = avg >= threshold
        else:
            met = avg >= 0
            progress = 1.0 if met else 0.0

    elif gtype == "cash_balance_min":
        min_cash = float(goal.get("min_cash", 0))
        cash = float(snap.cash_balance)
        detail = {"cash_balance": cash, "min_cash": min_cash}
        if min_cash > 0:
            progress = min(1.0, cash / min_cash)
            met = cash >= min_cash
        else:
            met = True
            progress = 1.0

    elif gtype == "expense_to_income_ratio":
        max_ratio = float(goal.get("max_ratio", 1.0))
        salary = max(1.0, float(snap.monthly_salary))
        burn = max(0.0, float(snap.monthly_burn_total))
        ratio = burn / salary
        detail = {
            "monthly_burn_total": burn,
            "monthly_salary": salary,
            "ratio": round(ratio, 4),
            "max_ratio": max_ratio,
        }
        if max_ratio > 0:
            progress = min(1.0, max(0.0, (max_ratio - ratio) / max_ratio))
            met = ratio <= max_ratio
        else:
            met = True
            progress = 1.0

    elif gtype == "passive_income_monthly_min":
        min_monthly = float(goal.get("min_monthly", 0))
        current = float(snap.monthly_passive_income)
        detail = {"monthly_passive_income": current, "min_monthly": min_monthly}
        if min_monthly > 0:
            progress = min(1.0, current / min_monthly)
            met = current >= min_monthly
        else:
            met = True
            progress = 1.0

    elif gtype == "passive_income_net_monthly_min":
        min_net = float(goal.get("min_net", 0))
        current = float(snap.monthly_passive_income) - float(snap.monthly_expenses_total)
        detail = {
            "passive_net_monthly": round(current, 2),
            "monthly_passive_income": float(snap.monthly_passive_income),
            "monthly_expenses_total": float(snap.monthly_expenses_total),
            "min_net": min_net,
        }
        if min_net > 0:
            progress = min(1.0, max(0.0, current / min_net))
            met = current >= min_net
        else:
            met = current >= 0
            progress = 1.0 if met else 0.0

    elif gtype == "asset_kind_any_owned":
        required_any = goal.get("asset_kinds_any") or []
        if not isinstance(required_any, list):
            required_any = []
        kinds_norm = {str(k).strip() for k in required_any if str(k).strip()}
        owned = set(snap.owned_asset_kinds)
        matched = kinds_norm & owned
        detail = {
            "asset_kinds_any": sorted(kinds_norm),
            "owned_asset_kinds": sorted(owned),
            "matched": sorted(matched),
        }
        met = bool(matched)
        progress = 1.0 if met else 0.0

    else:
        detail = {"error": f"unknown_goal_type:{gtype}"}
        met = False
        progress = 0.0

    return VictoryGoalResult(
        key=key,
        type=gtype,
        title=title,
        required=required,
        enabled=True,
        met=met,
        progress=round(progress, 4),
        detail=detail,
    )


def _compute_win_ready(goal_results: list[VictoryGoalResult], required_met: int) -> bool:
    enabled = [g for g in goal_results if g.enabled]
    if not enabled:
        return False

    by_type = {g.type: g for g in enabled}
    if "no_overdue" in by_type and "net_monthly_cashflow_nonneg" in by_type:
        return by_type["no_overdue"].met and by_type["net_monthly_cashflow_nonneg"].met

    met_count = sum(1 for g in enabled if g.met)
    return met_count >= max(0, required_met - 1)


def _progression_mode(config: dict[str, Any]) -> str:
    mode = str(config.get("progression_mode") or PROGRESSION_CHAIN).strip().lower()
    return mode if mode in (PROGRESSION_CHAIN, PROGRESSION_PARALLEL) else PROGRESSION_CHAIN


def _apply_chain_progression(
    goal_results: list[VictoryGoalResult],
) -> tuple[list[VictoryGoalResult], int, str | None, set[str]]:
    """Эффективный met по цепочке; raw_met в detail. Учитываются только available цели."""
    prior_ok = True
    out: list[VictoryGoalResult] = []
    current_key: str | None = None
    chain_met = 0
    chain_met_keys: set[str] = set()

    for g in goal_results:
        if not g.enabled:
            out.append(g)
            continue

        if not g.available:
            out.append(g)
            if prior_ok and current_key is None:
                current_key = g.key
            prior_ok = False
            continue

        raw_met = g.met
        effective_met = raw_met and prior_ok
        detail = dict(g.detail)
        detail["raw_met"] = raw_met

        if current_key is None and not effective_met:
            current_key = g.key
        if effective_met:
            chain_met += 1
            chain_met_keys.add(g.key)
        else:
            prior_ok = False

        out.append(replace(g, met=effective_met, detail=detail))

    return out, chain_met, current_key, chain_met_keys


def _permissive_mechanics_context() -> tuple[dict[str, bool], list[dict[str, Any]]]:
    cap = dict(DEFAULT_MECHANICS)
    unlock = [{"after_goal": None, "grant": list(CAPITAL_MECHANIC_KEYS)}]
    return cap, unlock


def _apply_availability(
    evaluated: list[VictoryGoalResult],
    requires_by_key: dict[str, list[str]],
    template_cap: dict[str, bool],
    effective: dict[str, bool],
) -> list[VictoryGoalResult]:
    staged: list[VictoryGoalResult] = []
    for g in evaluated:
        if not g.enabled:
            staged.append(g)
            continue
        req = requires_by_key.get(g.key, [MECHANIC_DASHBOARD_CORE])
        if not _template_allows_requires(req, template_cap):
            staged.append(
                replace(
                    g,
                    enabled=False,
                    available=False,
                    blocked_reason=None,
                    met=False,
                )
            )
            continue
        avail, reason = goal_mechanics_available(req, template_cap, effective)
        staged.append(replace(g, available=avail, blocked_reason=reason))
    return staged


def _finalize_with_mechanics(
    evaluated: list[VictoryGoalResult],
    raw_goals: list[dict[str, Any]],
    template_cap: dict[str, bool],
    unlock_steps: list[dict[str, Any]],
    *,
    chain_mode: bool,
) -> tuple[list[VictoryGoalResult], dict[str, bool], int, str | None]:
    requires_by_key = {
        str(g.get("key")): goal_requires_list(g) for g in raw_goals if isinstance(g, dict)
    }
    effective = compute_mechanics_effective(template_cap, unlock_steps, set())
    chain_results = evaluated
    goals_met = 0
    current_key: str | None = None

    for pass_i in range(4):
        staged = _apply_availability(evaluated, requires_by_key, template_cap, effective)
        if chain_mode:
            chain_results, goals_met, current_key, chain_met_keys = _apply_chain_progression(staged)
            new_effective = compute_mechanics_effective(template_cap, unlock_steps, chain_met_keys)
            if pass_i > 0 and new_effective == effective:
                effective = new_effective
                break
            effective = new_effective
        else:
            chain_results = staged
            enabled_avail = [g for g in staged if g.enabled and g.available]
            goals_met = sum(1 for g in enabled_avail if g.met)
            current_key = next((g.key for g in enabled_avail if not g.met), None)
            break

    if chain_mode:
        chain_met_keys = {g.key for g in chain_results if g.enabled and g.met}
        effective = compute_mechanics_effective(template_cap, unlock_steps, chain_met_keys)
        staged = _apply_availability(evaluated, requires_by_key, template_cap, effective)
        chain_results, goals_met, current_key, _ = _apply_chain_progression(staged)

    return chain_results, effective, goals_met, current_key


def _safety_legacy_fields(goal_results: list[VictoryGoalResult]) -> tuple[float, float]:
    for g in goal_results:
        if g.enabled and g.type == "safety_fund_months":
            target = float(g.detail.get("target", 0))
            current = float(g.detail.get("current", 0))
            if target <= 0:
                return 0.0, 0.0
            return target, min(1.0, current / target)
    return 0.0, 0.0


def evaluate_victory(
    config: dict[str, Any],
    snap: VictoryEvaluationInput,
    *,
    template_key: str | None = None,
    template_cap: dict[str, bool] | None = None,
    mechanics_unlock: list[dict[str, Any]] | None = None,
) -> VictoryEvaluationResult:
    required_met = int(config.get("required_goals_met", 1))
    schema_version = int(config.get("schema_version", VICTORY_SCHEMA_VERSION))
    tk = (template_key or "").strip() or DEFAULT_TEMPLATE_KEY

    if template_cap is None or mechanics_unlock is None:
        default_cap, default_unlock = _permissive_mechanics_context()
        template_cap = template_cap if template_cap is not None else default_cap
        mechanics_unlock = mechanics_unlock if mechanics_unlock is not None else default_unlock

    progression = _progression_mode(config)
    raw_goals = config.get("goals") or []
    evaluated = [_evaluate_goal(g, snap) for g in raw_goals if isinstance(g, dict)]
    chain_mode = progression == PROGRESSION_CHAIN

    goal_results, mechanics_effective, goals_met, current_goal_key = _finalize_with_mechanics(
        evaluated,
        raw_goals,
        template_cap,
        mechanics_unlock,
        chain_mode=chain_mode,
    )

    enabled_avail = [g for g in goal_results if g.enabled and g.available]
    goals_enabled = len(enabled_avail)
    goals_required = goals_enabled if chain_mode else required_met

    # Победа только по целям; ворота по номеру периода сняты (2026-06).
    period_gate_open = True
    min_period = 1

    if chain_mode:
        all_chain_met = goals_enabled > 0 and goals_met >= goals_enabled
        win_reached = all_chain_met
        win_ready = goals_met >= max(0, goals_enabled - 1) and not win_reached
    else:
        win_reached = goals_met >= required_met and goals_enabled > 0
        win_ready = _compute_win_ready(goal_results, required_met) and not win_reached

    win_target, win_progress = _safety_legacy_fields(goal_results)

    return VictoryEvaluationResult(
        schema_version=schema_version,
        template_key=tk,
        min_period_index=min_period,
        period_gate_open=period_gate_open,
        progression_mode=progression,
        current_goal_key=current_goal_key,
        goals_met=goals_met,
        goals_required=goals_required,
        goals_enabled=goals_enabled,
        win_reached=win_reached,
        win_ready=win_ready,
        win_target_safety_fund=win_target,
        win_progress_safety_fund=win_progress,
        goals=tuple(goal_results),
        mechanics_effective=mechanics_effective,
    )
