"""
Разблокировки механик по character_level (LEVEL_XP_SYSTEM §3, §8).

Блокируются только **новые** действия; обслуживание уже выданных blueprint-сущностей не трогаем.
"""

from __future__ import annotations

from fastapi import HTTPException

from .models import GameProfile

# Целевая карта LEVEL_XP_SYSTEM §3
UNLOCK_DEPOSIT_OPEN = 3
UNLOCK_BOND_BUY = 4
UNLOCK_INSURANCE_BUY = 5
UNLOCK_ASSET_FROM_TEMPLATE = 6
UNLOCK_LIABILITY_FROM_TEMPLATE = 6

FEATURE_LABELS: dict[str, str] = {
    "invest.deposit_open": "Вклад",
    "invest.bond_buy": "Облигации",
    "insurance.buy": "Страховка",
    "finance.asset_from_template": "Покупка актива из каталога",
    "finance.liability_from_template": "Новый кредит из каталога",
}


def character_level(profile: GameProfile) -> int:
    return max(1, int(getattr(profile, "level", 1) or 1))


def is_feature_unlocked(profile: GameProfile, min_level: int) -> bool:
    return character_level(profile) >= int(min_level)


def require_character_level(profile: GameProfile, min_level: int, feature_key: str) -> None:
    level = character_level(profile)
    if level >= int(min_level):
        return
    label = FEATURE_LABELS.get(feature_key, feature_key)
    raise HTTPException(
        status_code=403,
        detail={
            "code": "level_gate",
            "feature": feature_key,
            "required_level": int(min_level),
            "character_level": level,
            "message": f"{label} доступно с {int(min_level)} уровня персонажа (сейчас {level})",
        },
    )


def character_unlocks_payload(profile: GameProfile) -> list[dict]:
    """Снимок для UI: какие механики открыты на текущем уровне."""
    gates = [
        ("invest.deposit_open", UNLOCK_DEPOSIT_OPEN),
        ("invest.bond_buy", UNLOCK_BOND_BUY),
        ("insurance.buy", UNLOCK_INSURANCE_BUY),
        ("finance.asset_from_template", UNLOCK_ASSET_FROM_TEMPLATE),
        ("finance.liability_from_template", UNLOCK_LIABILITY_FROM_TEMPLATE),
    ]
    level = character_level(profile)
    return [
        {
            "feature": key,
            "min_level": min_lvl,
            "unlocked": level >= min_lvl,
            "label": FEATURE_LABELS.get(key, key),
        }
        for key, min_lvl in gates
    ]
