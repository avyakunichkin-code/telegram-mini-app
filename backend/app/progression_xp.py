"""
Начисление XP: пакет закрытия периода, milestone, действия подушки.

Константы синхронизированы с docs/vision/ideas/balance-xp-evening-session.md
и docs/specs/gameplay/catalogs/XP_EVENTS_ACTIONS_MATRIX.md.
"""

from __future__ import annotations

import json

from .models import GameProfile

# --- Закрытие периода ---
PERIOD_CLOSE_BASE_XP = 12
PERIOD_CLOSE_SALARY_BONUS_XP = 10
PERIOD_CLOSE_SAVINGS_STEP = 2000
PERIOD_CLOSE_SAVINGS_CAP_XP = 20

# --- Действия в периоде ---
SAFETY_CONTRIBUTE_XP = 3
SAFETY_CONTRIBUTE_XP_MAX_GRANTS_PER_PERIOD = 2
SAFETY_WITHDRAW_XP = 1
SAFETY_WITHDRAW_XP_MAX_GRANTS_PER_PERIOD = 1

# --- Milestone (один раз на профиль) ---
TEMPLATE_MILESTONE_XP_BY_PERIOD: dict[int, int] = {
    1: 20,
    3: 25,
    7: 30,
}


def compute_period_close_xp(*, salary_claimed: bool, safety_fund_contribution: float) -> int:
    xp = PERIOD_CLOSE_BASE_XP
    if salary_claimed:
        xp += PERIOD_CLOSE_SALARY_BONUS_XP
    contrib = max(0.0, float(safety_fund_contribution or 0))
    if contrib > 0:
        xp += min(
            PERIOD_CLOSE_SAVINGS_CAP_XP,
            int(contrib // PERIOD_CLOSE_SAVINGS_STEP),
        )
    return xp


def safety_contribute_xp_for_grant(grants_already: int) -> int:
    if int(grants_already) >= SAFETY_CONTRIBUTE_XP_MAX_GRANTS_PER_PERIOD:
        return 0
    return SAFETY_CONTRIBUTE_XP


def safety_withdraw_xp_for_grant(grants_already: int) -> int:
    if int(grants_already) >= SAFETY_WITHDRAW_XP_MAX_GRANTS_PER_PERIOD:
        return 0
    return SAFETY_WITHDRAW_XP


def _milestones_awarded_set(profile: GameProfile) -> set[int]:
    raw = getattr(profile, "progression_milestones_awarded", None) or "[]"
    try:
        data = json.loads(raw) if isinstance(raw, str) else raw
    except (json.JSONDecodeError, TypeError):
        data = []
    if not isinstance(data, list):
        return set()
    out: set[int] = set()
    for item in data:
        try:
            out.add(int(item))
        except (TypeError, ValueError):
            continue
    return out


def milestone_xp_for_closed_period(profile: GameProfile, closed_period_index: int) -> tuple[int, list[int]]:
    """
    XP за milestone закрытого периода (до инкремента period_index).
    Возвращает (xp, новый список выданных периодов для сохранения).
    """
    period = int(closed_period_index)
    xp_amount = int(TEMPLATE_MILESTONE_XP_BY_PERIOD.get(period, 0))
    if xp_amount <= 0:
        return 0, sorted(_milestones_awarded_set(profile))

    awarded = _milestones_awarded_set(profile)
    if period in awarded:
        return 0, sorted(awarded)

    awarded.add(period)
    return xp_amount, sorted(awarded)


def save_milestones_awarded(profile: GameProfile, periods: list[int]) -> None:
    profile.progression_milestones_awarded = json.dumps(periods, ensure_ascii=False)
