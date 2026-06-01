"""
Чистые правила игры: инварианты логики, отделённые от БД и HTTP.

Числовые константы здесь — единый источник для кода; баланс может меняться,
тесты фиксируют структуру условий (AND/OR, окна, каскады), а не «вечные» цифры продукта.
"""

from __future__ import annotations

import json
from dataclasses import dataclass

# --- Победа MVP (числа настраиваемые) ---
MIN_PERIOD_INDEX_FOR_WIN = 7
MVP_SAFETY_FUND_OBLIGATIONS_MULTIPLIER = 3.0

# --- События ---
EVENTS_PER_PERIOD = 2
EVENT_TIER_WINDOW_BELOW_BAND = 2
PERIODS_PER_EVENT_TIER = 10
EVENT_LIFESTYLE_DELTA_ABS_CAP = 15000.0

REPEAT_POLICY_REPEATABLE = "repeatable"
REPEAT_POLICY_ONCE_PER_PROFILE = "once_per_profile"
REPEAT_POLICY_MAX_PER_PROFILE = "max_per_profile"

MANDATORY_GATE_NONE = "none"
MANDATORY_GATE_BLOCKS_PERIOD_END = "blocks_period_end"


def event_tier_progression_level(period_index: int) -> int:
    """Доступный tier-банд: периоды 1–10 → 1, 11–20 → 2, …"""
    p = max(1, int(period_index))
    return (p - 1) // PERIODS_PER_EVENT_TIER + 1


def event_tier_bounds(period_index: int) -> tuple[int, int]:
    """Окно core-отбора: [max(1, L − window), L], L из period_index."""
    L = event_tier_progression_level(period_index)
    lower = max(1, L - EVENT_TIER_WINDOW_BELOW_BAND)
    return lower, L


def event_tier_in_core_window(event_tier: int, period_index: int) -> bool:
    lo, hi = event_tier_bounds(period_index)
    t = max(1, int(event_tier or 1))
    return lo <= t <= hi


def event_tier_in_fallback_primary(event_tier: int, period_index: int) -> bool:
    """Fallback P1: tier ∈ [1, L]."""
    L = event_tier_progression_level(period_index)
    t = max(1, int(event_tier or 1))
    return 1 <= t <= L


@dataclass(frozen=True)
class EventProfileCounterSnapshot:
    times_selected: int = 0
    last_selected_period_index: int | None = None


@dataclass(frozen=True)
class EventProfileContext:
    """Снимок профиля для отбора событий (активы, долги, страховки)."""

    active_asset_kinds: frozenset[str]
    active_liability_count: int
    active_insurance_claim_keys: frozenset[str]


@dataclass(frozen=True)
class EventPrerequisites:
    """
    Условия выпадения события (prerequisites_json).

    active_asset_kinds_any — хотя бы один актив с kind из списка.
    active_asset_kinds_all — все перечисленные kind должны быть среди активов.
    min_active_liabilities / min_active_assets — нижние границы по числу активных записей.
    requires_insurance_any — хотя бы один активный полис с product+insured_object из списка dict.
    """

    active_asset_kinds_any: frozenset[str] = frozenset()
    active_asset_kinds_all: frozenset[str] = frozenset()
    min_active_liabilities: int = 0
    min_active_assets: int = 0
    requires_insurance_any: tuple[tuple[str, str], ...] = ()
    forbid_active_asset_kinds_any: frozenset[str] = frozenset()


def parse_event_prerequisites_json(raw: str | None) -> EventPrerequisites:
    if not raw or not str(raw).strip():
        return EventPrerequisites()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return EventPrerequisites()
    if not isinstance(data, dict):
        return EventPrerequisites()

    def _kind_set(key: str) -> frozenset[str]:
        val = data.get(key)
        if not isinstance(val, list):
            return frozenset()
        return frozenset(str(x).strip() for x in val if str(x).strip())

    ins_specs: list[tuple[str, str]] = []
    for item in data.get("requires_insurance_any") or []:
        if isinstance(item, dict):
            product = str(item.get("product") or "").strip()
            insured = str(item.get("insured_object") or "").strip()
            if product and insured:
                ins_specs.append((product, insured))

    return EventPrerequisites(
        active_asset_kinds_any=_kind_set("active_asset_kinds_any"),
        active_asset_kinds_all=_kind_set("active_asset_kinds_all"),
        forbid_active_asset_kinds_any=_kind_set("forbid_active_asset_kinds_any"),
        min_active_liabilities=max(0, int(data.get("min_active_liabilities") or 0)),
        min_active_assets=max(0, int(data.get("min_active_assets") or 0)),
        requires_insurance_any=tuple(ins_specs),
    )


def event_prerequisites_met(prereq: EventPrerequisites, ctx: EventProfileContext) -> bool:
    kinds = ctx.active_asset_kinds
    if prereq.forbid_active_asset_kinds_any and (kinds & prereq.forbid_active_asset_kinds_any):
        return False
    if prereq.active_asset_kinds_any and not (kinds & prereq.active_asset_kinds_any):
        return False
    if prereq.active_asset_kinds_all and not prereq.active_asset_kinds_all.issubset(kinds):
        return False
    if ctx.active_liability_count < prereq.min_active_liabilities:
        return False
    if len(kinds) < prereq.min_active_assets:
        return False
    for product, insured in prereq.requires_insurance_any:
        key = f"{product}:{insured}"
        if key not in ctx.active_insurance_claim_keys:
            return False
    return True


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
