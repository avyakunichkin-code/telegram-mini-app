"""Оценка победы для профиля (общая логика с finance overview)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from .models import GameProfile, GameStarterTemplate
from .mechanics_progression import resolve_template_and_unlock
from .victory_engine import evaluate_victory, parse_victory_config
from .victory_seeds import DEFAULT_TEMPLATE_KEY
from .victory_snap import build_victory_evaluation_input


def profile_win_reached(db: Session, profile: GameProfile) -> bool:
    template_key = getattr(profile, "starter_template_key", None) or DEFAULT_TEMPLATE_KEY
    template_row = (
        db.query(GameStarterTemplate)
        .filter(GameStarterTemplate.template_key == template_key)
        .first()
    )
    if template_row:
        template_key = template_row.template_key
        raw_victory = template_row.victory_config_json
    else:
        raw_victory = None

    victory_cfg = parse_victory_config(raw_victory, template_key=template_key)
    snap = build_victory_evaluation_input(db, profile)
    template_cap, mechanics_unlock, template_key = resolve_template_and_unlock(db, profile)
    victory_result = evaluate_victory(
        victory_cfg,
        snap,
        template_key=template_key,
        template_cap=template_cap,
        mechanics_unlock=mechanics_unlock,
    )
    return bool(victory_result.win_reached)
