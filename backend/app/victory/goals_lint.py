"""
Victory goals linter.

Checks DB-stored goals for consistency and common mistakes:
- unknown mechanics keys in requires_mechanics
- unsupported action_once actions
- obvious params/type mismatches
- optional rule: "probe goals first" (action_once) before effort goals

MVP: intended to run as a CLI command and optionally during app boot.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable

from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from ..victory.mechanics_progression import ALL_MECHANIC_KEYS


SUPPORTED_ACTION_ONCE = {
    "salary_claimed",
    "safety_contributed",
    "invest_deposit_opened",
    "invest_bond_bought",
    "invest_opened",
    "insurance_purchased",
}

EFFORT_GOAL_TYPES = {
    "safety_fund_months",
    "passive_income_monthly_min",
    "cash_balance_min",
    "asset_kind_any_owned",
    "avg_liquid_delta_6p",
    "expense_to_income_ratio",
    "net_monthly_cashflow_nonneg",
    "no_overdue",
    "passive_income_net_monthly_min",
}


@dataclass(frozen=True)
class LintIssue:
    template_key: str
    goal_key: str | None
    severity: str  # "error" | "warn"
    message: str


def _as_str_list(raw: Any) -> list[str]:
    if isinstance(raw, list):
        return [str(x).strip() for x in raw if str(x).strip()]
    return []


def _lint_rows(template_key: str, rows: list[dict[str, Any]]) -> list[LintIssue]:
    issues: list[LintIssue] = []
    keys: set[str] = set()

    seen_effort = False
    for r in rows:
        goal_key = str(r.get("goal_key") or "").strip()
        goal_type = str(r.get("goal_type") or "").strip()
        title = str(r.get("title") or "").strip()

        if not goal_key:
            issues.append(LintIssue(template_key, None, "error", "empty goal_key"))
            continue
        if goal_key in keys:
            issues.append(LintIssue(template_key, goal_key, "error", "duplicate goal_key"))
        keys.add(goal_key)

        if not goal_type:
            issues.append(LintIssue(template_key, goal_key, "error", "empty goal_type"))
        if not title:
            issues.append(LintIssue(template_key, goal_key, "error", "empty title"))

        requires = _as_str_list(r.get("requires_mechanics"))
        for m in requires:
            if m not in ALL_MECHANIC_KEYS:
                issues.append(
                    LintIssue(
                        template_key,
                        goal_key,
                        "error",
                        f"unknown requires_mechanics key: {m}",
                    )
                )

        params = r.get("params") if isinstance(r.get("params"), dict) else {}

        if goal_type == "action_once":
            action = str(params.get("action") or "").strip()
            if not action:
                issues.append(LintIssue(template_key, goal_key, "error", "action_once missing params.action"))
            elif action not in SUPPORTED_ACTION_ONCE:
                issues.append(
                    LintIssue(
                        template_key,
                        goal_key,
                        "error",
                        f"unsupported action_once action: {action}",
                    )
                )
        elif goal_type == "safety_fund_months":
            mm = params.get("months_multiplier")
            if not isinstance(mm, (int, float)) or float(mm) <= 0:
                issues.append(LintIssue(template_key, goal_key, "error", "safety_fund_months invalid months_multiplier"))
        elif goal_type == "passive_income_monthly_min":
            v = params.get("min_monthly")
            if not isinstance(v, (int, float)) or float(v) <= 0:
                issues.append(LintIssue(template_key, goal_key, "error", "passive_income_monthly_min invalid min_monthly"))
        elif goal_type == "cash_balance_min":
            v = params.get("min_cash")
            if not isinstance(v, (int, float)) or float(v) <= 0:
                issues.append(LintIssue(template_key, goal_key, "error", "cash_balance_min invalid min_cash"))

        # Ordering heuristic: action_once should go before "effort" goals.
        is_effort = goal_type in EFFORT_GOAL_TYPES
        if is_effort:
            seen_effort = True
        if seen_effort and goal_type == "action_once":
            issues.append(
                LintIssue(
                    template_key,
                    goal_key,
                    "warn",
                    "action_once appears after effort goal (recommended: probe goals first)",
                )
            )

    return issues


def lint_victory_goals(db: Session, *, template_keys: Iterable[str] | None = None) -> list[LintIssue]:
    """
    Lints goals stored in victory_goals table. If table doesn't exist, returns [].
    """
    keys = [str(k).strip() for k in (template_keys or []) if str(k).strip()]

    try:
        if keys:
            rows = db.execute(
                text(
                    """
                    SELECT template_key, goal_key, goal_type, title, order_index, requires_mechanics, params
                    FROM victory_goals
                    WHERE template_key = ANY(:keys)
                    ORDER BY template_key ASC, order_index ASC, id ASC
                    """
                ),
                {"keys": keys},
            ).mappings().all()
        else:
            rows = db.execute(
                text(
                    """
                    SELECT template_key, goal_key, goal_type, title, order_index, requires_mechanics, params
                    FROM victory_goals
                    ORDER BY template_key ASC, order_index ASC, id ASC
                    """
                )
            ).mappings().all()
    except OperationalError:
        return []

    grouped: dict[str, list[dict[str, Any]]] = {}
    for r in rows:
        tk = str(r.get("template_key") or "").strip()
        if not tk:
            continue
        grouped.setdefault(tk, []).append(dict(r))

    issues: list[LintIssue] = []
    for tk, rs in grouped.items():
        issues.extend(_lint_rows(tk, rs))
    return issues

