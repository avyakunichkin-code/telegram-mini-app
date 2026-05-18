"""Единая модель XP/уровня персонажа (RPG) для профиля игры."""

from __future__ import annotations

from sqlalchemy.orm import Session

from .game_rules import apply_xp_to_character_state, character_xp_need_for_next_level
from .models import GameProfile

__all__ = ("character_xp_need_for_next_level", "apply_character_xp")


def apply_character_xp(profile: GameProfile, delta: int, db: Session) -> dict:
    """
    Начисляет XP (delta >= 0), обрабатывает каскад level-up.
    Возвращает служебный dict для API-ответов.
    """
    _ = db  # сессия для единообразия вызовов роутеров; flush/commit снаружи
    new_level, new_xp, info = apply_xp_to_character_state(
        int(getattr(profile, "level", 1) or 1),
        int(getattr(profile, "xp", 0) or 0),
        delta,
    )
    profile.level = new_level
    profile.xp = new_xp
    return info
