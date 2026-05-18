"""Единая модель XP/уровня персонажа (RPG) для профиля игры."""

from __future__ import annotations

from sqlalchemy.orm import Session

from .models import GameProfile


def character_xp_need_for_next_level(level: int) -> int:
    """Порог XP для перехода с текущего числового уровня на следующий (см. SPEC / LEVEL_XP_SYSTEM)."""
    L = max(1, int(level))
    return 100 + max(0, L - 1) * 50


def apply_character_xp(profile: GameProfile, delta: int, db: Session) -> dict:
    """
    Начисляет XP (delta >= 0), обрабатывает каскад level-up.
    Возвращает служебный dict для API-ответов.
    """
    if delta < 0:
        raise ValueError("apply_character_xp: delta must be >= 0")

    if delta == 0:
        need = character_xp_need_for_next_level(profile.level)
        return {
            "xp_gained": 0,
            "level_up": False,
            "new_level": None,
            "character_xp_need_for_next": need,
        }

    profile.xp = int(getattr(profile, "xp", 0) or 0) + int(delta)
    level_up = False
    xp_for_next = character_xp_need_for_next_level(profile.level)
    while profile.xp >= xp_for_next:
        profile.level += 1
        profile.xp -= xp_for_next
        level_up = True
        xp_for_next = character_xp_need_for_next_level(profile.level)

    return {
        "xp_gained": delta,
        "level_up": level_up,
        "new_level": int(profile.level) if level_up else None,
        "character_xp_need_for_next": character_xp_need_for_next_level(profile.level),
    }
