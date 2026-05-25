"""Разрешения механик из blueprint шаблона старта (Game Mode)."""
from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import GameProfile, GameStarterTemplate

# Ключи в blueprint.mechanics — управляют разделами «Управление капиталом».
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

# mq_game_basic_v1: только инвестиции; доходы/расходы — всегда (не в flags).
BASIC_V1_MECHANICS: dict[str, bool] = {
    MECHANIC_CAPITAL_INVEST: True,
    MECHANIC_CAPITAL_INSURANCE: False,
    MECHANIC_CAPITAL_PROPERTY: False,
    MECHANIC_CAPITAL_LIABILITIES: False,
}

DEFAULT_MECHANICS: dict[str, bool] = {k: True for k in CAPITAL_MECHANIC_KEYS}

TEMPLATE_MECHANICS_PRESETS: dict[str, dict[str, bool]] = {
    "mq_game_basic_v1": BASIC_V1_MECHANICS,
}


def _parse_blueprint(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def mechanics_from_blueprint(blueprint: dict[str, Any], template_key: str | None) -> dict[str, bool]:
    """Слить preset шаблона, blueprint.mechanics и дефолты (все capital-механики включены)."""
    out = dict(DEFAULT_MECHANICS)
    tk = (template_key or "").strip()
    if tk in TEMPLATE_MECHANICS_PRESETS:
        out.update(TEMPLATE_MECHANICS_PRESETS[tk])
    raw = blueprint.get("mechanics")
    if isinstance(raw, dict):
        for key in CAPITAL_MECHANIC_KEYS:
            if key in raw:
                out[key] = bool(raw[key])
    return out


def resolve_profile_mechanics(
    db: Session, profile: GameProfile
) -> dict[str, bool]:
    template_key = getattr(profile, "starter_template_key", None) or "mq_game_basic_v1"
    blueprint: dict[str, Any] = {}
    row = (
        db.query(GameStarterTemplate)
        .filter(GameStarterTemplate.template_key == template_key)
        .first()
    )
    if row:
        blueprint = _parse_blueprint(row.blueprint_json)
    return mechanics_from_blueprint(blueprint, template_key)


def resolve_profile_mechanics_effective(db: Session, profile: GameProfile) -> dict[str, bool]:
    """Флаги разделов капитала с учётом цепочки целей (mechanics_unlock)."""
    from .mechanics_progression import capital_flags_for_api, resolve_template_and_unlock
    from .victory_engine import evaluate_victory, parse_victory_config
    from .victory_snap import build_victory_evaluation_input

    template_cap, unlock_steps, template_key = resolve_template_and_unlock(db, profile)
    row = (
        db.query(GameStarterTemplate)
        .filter(GameStarterTemplate.template_key == template_key)
        .first()
    )
    raw_victory = row.victory_config_json if row else None
    victory_cfg = parse_victory_config(raw_victory, template_key=template_key)
    snap = build_victory_evaluation_input(db, profile)
    result = evaluate_victory(
        victory_cfg,
        snap,
        template_key=template_key,
        template_cap=template_cap,
        mechanics_unlock=unlock_steps,
    )
    return capital_flags_for_api(result.mechanics_effective)


def require_capital_mechanic(
    db: Session, profile: GameProfile, mechanic_key: str
) -> None:
    perms = resolve_profile_mechanics_effective(db, profile)
    if not perms.get(mechanic_key, True):
        raise HTTPException(
            status_code=403,
            detail={
                "code": "mechanic_disabled",
                "mechanic": mechanic_key,
                "message": "Эта механика недоступна в текущем сценарии",
            },
        )
