"""Разблокировка разделов капитала по цепочке целей (mechanics_effective)."""
from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from .models import GameProfile, GameStarterTemplate

MECHANIC_CAPITAL_INVEST = "capital_invest"
MECHANIC_CAPITAL_INSURANCE = "capital_insurance"
MECHANIC_CAPITAL_PROPERTY = "capital_property"
MECHANIC_CAPITAL_LIABILITIES = "capital_liabilities"

CAPITAL_MECHANIC_KEYS = (
    MECHANIC_CAPITAL_INVEST,
    MECHANIC_CAPITAL_INSURANCE,
    MECHANIC_CAPITAL_PROPERTY,
    MECHANIC_CAPITAL_LIABILITIES,
)

MECHANIC_DASHBOARD_CORE = "dashboard_core"
MECHANIC_CAPITAL_FLOWS = "capital_flows"

ALL_MECHANIC_KEYS = (
    MECHANIC_DASHBOARD_CORE,
    MECHANIC_CAPITAL_FLOWS,
    *CAPITAL_MECHANIC_KEYS,
)

DEFAULT_BASIC_UNLOCK: list[dict[str, Any]] = [
    {"after_goal": None, "grant": [MECHANIC_CAPITAL_FLOWS]},
    {"after_goal": "tutorial_cushion", "grant": [MECHANIC_CAPITAL_INVEST]},
]

TEMPLATE_MECHANICS_UNLOCK_PRESETS: dict[str, list[dict[str, Any]]] = {
    "mq_game_basic_v1": list(DEFAULT_BASIC_UNLOCK),
}


def mechanics_unlock_from_blueprint(
    blueprint: dict[str, Any], template_key: str | None
) -> list[dict[str, Any]]:
    raw = blueprint.get("mechanics_unlock")
    if isinstance(raw, list) and raw:
        return [s for s in raw if isinstance(s, dict)]
    tk = (template_key or "").strip()
    if tk in TEMPLATE_MECHANICS_UNLOCK_PRESETS:
        return list(TEMPLATE_MECHANICS_UNLOCK_PRESETS[tk])
    return [{"after_goal": None, "grant": [MECHANIC_CAPITAL_FLOWS, *CAPITAL_MECHANIC_KEYS]}]


def _template_allows_requires(requires: list[str], template_cap: dict[str, bool]) -> bool:
    for key in requires:
        if key in CAPITAL_MECHANIC_KEYS and not template_cap.get(key, False):
            return False
    return True


def compute_mechanics_effective(
    template_cap: dict[str, bool],
    unlock_steps: list[dict[str, Any]],
    chain_met_goal_keys: set[str],
) -> dict[str, bool]:
    """Эффективные флаги UI/API: grant из unlock_steps после выполненных ключей целей."""
    effective: dict[str, bool] = {
        MECHANIC_DASHBOARD_CORE: True,
        MECHANIC_CAPITAL_FLOWS: False,
    }
    for key in CAPITAL_MECHANIC_KEYS:
        effective[key] = False

    for step in unlock_steps:
        after = step.get("after_goal")
        if after is not None and after not in chain_met_goal_keys:
            continue
        grants = step.get("grant") or []
        if not isinstance(grants, list):
            continue
        for grant in grants:
            g = str(grant).strip()
            if not g:
                continue
            if g in CAPITAL_MECHANIC_KEYS:
                if template_cap.get(g, False):
                    effective[g] = True
            elif g in (MECHANIC_CAPITAL_FLOWS, MECHANIC_DASHBOARD_CORE):
                effective[g] = True

    return effective


def goal_requires_list(goal: dict[str, Any]) -> list[str]:
    raw = goal.get("requires_mechanics")
    if not isinstance(raw, list):
        return [MECHANIC_DASHBOARD_CORE]
    return [str(x).strip() for x in raw if str(x).strip()]


def goal_mechanics_available(
    requires: list[str],
    template_cap: dict[str, bool],
    effective: dict[str, bool],
) -> tuple[bool, str | None]:
    if not _template_allows_requires(requires, template_cap):
        return False, "Недоступно в этом сценарии"
    for key in requires:
        if key == MECHANIC_DASHBOARD_CORE:
            continue
        if key == MECHANIC_CAPITAL_FLOWS:
            if not effective.get(MECHANIC_CAPITAL_FLOWS, False):
                return False, "Откроется на следующих шагах сценария"
            continue
        if key in CAPITAL_MECHANIC_KEYS:
            if not effective.get(key, False):
                return False, "Откроется после предыдущих шагов"
    return True, None


def resolve_template_and_unlock(
    db: Session, profile: GameProfile
) -> tuple[dict[str, bool], list[dict[str, Any]], str]:
    from .starter_mechanics import _parse_blueprint, mechanics_from_blueprint

    template_key = getattr(profile, "starter_template_key", None) or "mq_game_basic_v1"
    blueprint: dict[str, Any] = {}
    row = (
        db.query(GameStarterTemplate)
        .filter(GameStarterTemplate.template_key == template_key)
        .first()
    )
    if row:
        template_key = row.template_key
        blueprint = _parse_blueprint(row.blueprint_json)
    template_cap = mechanics_from_blueprint(blueprint, template_key)
    unlock_steps = mechanics_unlock_from_blueprint(blueprint, template_key)
    return template_cap, unlock_steps, template_key


def capital_flags_for_api(effective: dict[str, bool]) -> dict[str, bool]:
    return {k: bool(effective.get(k, False)) for k in CAPITAL_MECHANIC_KEYS}
