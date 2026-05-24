"""
Движок победы v2: M из N целей из victory_config_json шаблона.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

from .game_rules import MIN_PERIOD_INDEX_FOR_WIN
from .victory_seeds import DEFAULT_TEMPLATE_KEY, victory_config_for_template

VICTORY_SCHEMA_VERSION = 1


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


@dataclass(frozen=True)
class VictoryEvaluationResult:
    schema_version: int
    template_key: str
    min_period_index: int
    period_gate_open: bool
    goals_met: int
    goals_required: int
    goals_enabled: int
    win_reached: bool
    win_ready: bool
    win_target_safety_fund: float
    win_progress_safety_fund: float
    goals: tuple[VictoryGoalResult, ...]


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
        )

    obligations = float(snap.total_monthly_obligations)

    if gtype == "safety_fund_months":
        mult = float(goal.get("months_multiplier", 3))
        target = obligations * mult
        current = float(snap.safety_fund_balance)
        detail = {"target": target, "current": current, "months_multiplier": mult}
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
) -> VictoryEvaluationResult:
    min_period = int(config.get("min_period_index_for_victory", MIN_PERIOD_INDEX_FOR_WIN))
    required_met = int(config.get("required_goals_met", 1))
    schema_version = int(config.get("schema_version", VICTORY_SCHEMA_VERSION))
    tk = (template_key or "").strip() or DEFAULT_TEMPLATE_KEY

    raw_goals = config.get("goals") or []
    goal_results = [_evaluate_goal(g, snap) for g in raw_goals if isinstance(g, dict)]
    enabled = [g for g in goal_results if g.enabled]
    goals_enabled = len(enabled)
    goals_met = sum(1 for g in enabled if g.met)

    period_gate_open = int(snap.period_index) >= min_period
    win_reached = period_gate_open and goals_met >= required_met and goals_enabled > 0
    win_ready = _compute_win_ready(goal_results, required_met)
    win_target, win_progress = _safety_legacy_fields(goal_results)

    return VictoryEvaluationResult(
        schema_version=schema_version,
        template_key=tk,
        min_period_index=min_period,
        period_gate_open=period_gate_open,
        goals_met=goals_met,
        goals_required=required_met,
        goals_enabled=goals_enabled,
        win_reached=win_reached,
        win_ready=win_ready,
        win_target_safety_fund=win_target,
        win_progress_safety_fund=win_progress,
        goals=tuple(goal_results),
    )
