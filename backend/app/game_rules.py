"""
Чистые правила игры: инварианты логики, отделённые от БД и HTTP.

Числовые константы здесь — единый источник для кода; баланс может меняться,
тесты фиксируют структуру условий (AND/OR, окна, каскады), а не «вечные» цифры продукта.
"""

from __future__ import annotations

from dataclasses import dataclass

# --- Победа MVP (числа настраиваемые) ---
MIN_PERIOD_INDEX_FOR_WIN = 7
MVP_SAFETY_FUND_OBLIGATIONS_MULTIPLIER = 3.0

# --- XP / уровень персонажа (v2: balance-xp-evening-session.md) ---
CHARACTER_MAX_LEVEL = 12
XP_TOTAL_TO_MAX_LEVEL = 2500
# need(L) для перехода L → L+1; сумма = 2500
XP_NEED_BY_LEVEL: tuple[int, ...] = (
    30,
    45,
    65,
    95,
    140,
    200,
    280,
    380,
    500,
    650,
    115,
)
# Устаревшие константы (линейная v1) — только для совместимости тестов/миграций
XP_NEED_BASE = XP_NEED_BY_LEVEL[0]
XP_NEED_PER_LEVEL_STEP = XP_NEED_BY_LEVEL[1] - XP_NEED_BY_LEVEL[0]

# --- События ---
EVENT_TIER_WINDOW_BELOW_LEVEL = 2
EVENT_LIFESTYLE_DELTA_ABS_CAP = 15000.0

REPEAT_POLICY_REPEATABLE = "repeatable"
REPEAT_POLICY_ONCE_PER_PROFILE = "once_per_profile"
REPEAT_POLICY_MAX_PER_PROFILE = "max_per_profile"

MANDATORY_GATE_NONE = "none"
MANDATORY_GATE_BLOCKS_PERIOD_END = "blocks_period_end"


def character_xp_need_for_next_level(level: int) -> int:
    L = max(1, int(level))
    if L >= CHARACTER_MAX_LEVEL:
        return 0
    idx = L - 1
    if idx < len(XP_NEED_BY_LEVEL):
        return int(XP_NEED_BY_LEVEL[idx])
    return int(XP_NEED_BY_LEVEL[-1])


def character_xp_cumulative_to_reach_level(level: int) -> int:
    """Накопительный XP для входа на уровень level (level 1 → 0)."""
    target = max(1, min(int(level), CHARACTER_MAX_LEVEL))
    if target <= 1:
        return 0
    return sum(int(x) for x in XP_NEED_BY_LEVEL[: target - 1])


def apply_xp_to_character_state(level: int, xp: int, delta: int) -> tuple[int, int, dict]:
    """
    Начисляет XP (delta >= 0), каскад level-up. Без побочных эффектов.
    Возвращает (new_level, new_xp, info_dict).
    """
    if delta < 0:
        raise ValueError("apply_xp_to_character_state: delta must be >= 0")

    cur_level = max(1, int(level))
    cur_xp = max(0, int(xp))

    if delta == 0:
        need = character_xp_need_for_next_level(cur_level)
        return cur_level, cur_xp, {
            "xp_gained": 0,
            "level_up": False,
            "new_level": None,
            "character_xp_need_for_next": need,
        }

    cur_xp += int(delta)
    level_up = False
    while cur_level < CHARACTER_MAX_LEVEL:
        xp_for_next = character_xp_need_for_next_level(cur_level)
        if xp_for_next <= 0 or cur_xp < xp_for_next:
            break
        cur_level += 1
        cur_xp -= xp_for_next
        level_up = True

    return cur_level, cur_xp, {
        "xp_gained": delta,
        "level_up": level_up,
        "new_level": cur_level if level_up else None,
        "character_xp_need_for_next": character_xp_need_for_next_level(cur_level),
        "at_max_level": cur_level >= CHARACTER_MAX_LEVEL,
    }


def event_tier_bounds(character_level: int) -> tuple[int, int]:
    """Окно core-отбора: [max(1, L − window), L]."""
    L = max(1, int(character_level))
    lower = max(1, L - EVENT_TIER_WINDOW_BELOW_LEVEL)
    return lower, L


def event_tier_in_core_window(event_tier: int, character_level: int) -> bool:
    lo, hi = event_tier_bounds(character_level)
    t = max(1, int(event_tier or 1))
    return lo <= t <= hi


def event_tier_in_fallback_primary(event_tier: int, character_level: int) -> bool:
    """Fallback P1: tier ∈ [1, L]."""
    L = max(1, int(character_level))
    t = max(1, int(event_tier or 1))
    return 1 <= t <= L


@dataclass(frozen=True)
class EventProfileCounterSnapshot:
    times_selected: int = 0
    last_selected_period_index: int | None = None


def is_event_definition_eligible(
    *,
    repeat_policy: str | None,
    repeat_max: int | None,
    cooldown_periods: int,
    current_period_index: int,
    counter: EventProfileCounterSnapshot | None,
) -> bool:
    """
    Можно ли выпадать definition в текущем периоде с учётом repeat_policy, repeat_max и cooldown.
    """
    pol = str(repeat_policy or REPEAT_POLICY_REPEATABLE).strip() or REPEAT_POLICY_REPEATABLE
    times = max(0, int(counter.times_selected)) if counter else 0
    last_period = counter.last_selected_period_index if counter else None

    if pol == REPEAT_POLICY_ONCE_PER_PROFILE and times >= 1:
        return False

    if pol == REPEAT_POLICY_MAX_PER_PROFILE:
        cap = int(repeat_max) if repeat_max is not None else 1
        if times >= cap:
            return False
    elif repeat_max is not None and times >= int(repeat_max):
        return False

    cd = max(0, int(cooldown_periods or 0))
    if cd > 0 and last_period is not None:
        if int(current_period_index) - int(last_period) < cd:
            return False

    return True


def is_event_repeat_allowed(
    definition_id: int,
    repeat_policy: str | None,
    blocked_once_ids: set[int],
) -> bool:
    """Deprecated: используйте is_event_definition_eligible + EventProfileCounterSnapshot."""
    if str(repeat_policy or "").strip() == REPEAT_POLICY_ONCE_PER_PROFILE:
        if int(definition_id) in blocked_once_ids:
            return False
    return True


def clamp_profile_lifestyle_delta(current_delta: float, addition: float, abs_cap: float | None = None) -> float:
    cap = EVENT_LIFESTYLE_DELTA_ABS_CAP if abs_cap is None else float(abs_cap)
    nd = float(current_delta) + float(addition)
    if nd > cap:
        return cap
    if nd < -cap:
        return -cap
    return nd


@dataclass(frozen=True)
class MvpVictoryInput:
    period_index: int
    safety_fund_balance: float
    total_monthly_obligations: float
    total_overdue_amount: float
    net_monthly_cashflow: float


@dataclass(frozen=True)
class MvpVictoryResult:
    win_target_safety_fund: float
    win_progress_safety_fund: float
    win_ready: bool
    win_reached: bool


def evaluate_mvp_victory(
    snap: MvpVictoryInput,
    *,
    min_period_index: int = MIN_PERIOD_INDEX_FOR_WIN,
    safety_multiplier: float = MVP_SAFETY_FUND_OBLIGATIONS_MULTIPLIER,
) -> MvpVictoryResult:
    """
    Победа MVP: все условия одновременно (AND); ранние периоды блокируют win_reached.
    win_ready — подмножество без подушки и без проверки периода.
    """
    win_target = float(snap.total_monthly_obligations) * float(safety_multiplier)
    win_ready = float(snap.total_overdue_amount) <= 0 and float(snap.net_monthly_cashflow) >= 0
    win_allowed_by_period = int(snap.period_index) >= int(min_period_index)
    win_reached = (
        win_allowed_by_period
        and win_ready
        and float(snap.safety_fund_balance) >= win_target
        and win_target > 0
    )
    if win_target <= 0:
        progress = 1.0
    else:
        progress = float(snap.safety_fund_balance) / win_target
    return MvpVictoryResult(
        win_target_safety_fund=win_target,
        win_progress_safety_fund=progress,
        win_ready=win_ready,
        win_reached=win_reached,
    )
