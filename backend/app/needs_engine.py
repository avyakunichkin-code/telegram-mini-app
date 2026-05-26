from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any


AXES = ("comfort", "status", "social", "health")


def _clamp_need(v: float) -> float:
    try:
        n = float(v)
    except Exception:
        n = 0.0
    if not math.isfinite(n):
        n = 0.0
    # 1 знак после запятой (как в SPEC)
    n = round(n, 1)
    if n < 0:
        return 0.0
    if n > 100:
        return 100.0
    return n


def _as_bool(v: Any) -> bool:
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return float(v) != 0
    if isinstance(v, str):
        return v.strip().lower() in ("1", "true", "yes", "y", "on")
    return False


def parse_needs_config(blueprint: dict | None) -> dict | None:
    """
    Возвращает нормализованный config needs из blueprint_json.
    Если needs отсутствует или disabled — None.
    """
    if not isinstance(blueprint, dict):
        return None
    needs = blueprint.get("needs")
    if not isinstance(needs, dict):
        return None
    enabled = _as_bool(needs.get("enabled", True))
    if not enabled:
        return None

    thresholds = needs.get("thresholds") if isinstance(needs.get("thresholds"), dict) else {}
    treat_self = needs.get("treat_self") if isinstance(needs.get("treat_self"), dict) else {}
    player_support = needs.get("player_support") if isinstance(needs.get("player_support"), dict) else {}
    consequences = needs.get("consequences") if isinstance(needs.get("consequences"), dict) else {}

    initial = needs.get("initial") if isinstance(needs.get("initial"), dict) else {}
    initial_norm = {k: _clamp_need(initial.get(k, 0)) for k in AXES}

    cfg = {
        "enabled": True,
        "character_label": str(needs.get("character_label") or "") or None,
        "initial": initial_norm,
        "periods_to_empty_target": int(needs.get("periods_to_empty_target") or 12),
        "decay_per_period": needs.get("decay_per_period") if isinstance(needs.get("decay_per_period"), dict) else None,
        "thresholds": {
            "low": int(thresholds.get("low") or 40),
            "distressed": int(thresholds.get("distressed") or 30),
        },
        "consequence_profile": str(needs.get("consequence_profile") or "standard"),
        "consequences": {
            "distressed_cash_penalty_pct_salary": float(
                consequences.get("distressed_cash_penalty_pct_salary") or 0
            ),
            "distressed_cash_penalty_min": float(consequences.get("distressed_cash_penalty_min") or 0),
        },
        "player_support": {
            "proactive_hints": _as_bool(player_support.get("proactive_hints", False)),
            "rescue_event_bias": float(player_support.get("rescue_event_bias") or 1.0),
        },
        "treat_self": {
            "cooldown_periods": int(treat_self.get("cooldown_periods") or 15),
            "default_cost_pct_salary": float(treat_self.get("default_cost_pct_salary") or 0.08),
            "cost_min": float(treat_self.get("cost_min") or 2000),
            "cost_max": float(treat_self.get("cost_max") or 25000),
            "options": treat_self.get("options") if isinstance(treat_self.get("options"), list) else [],
        },
    }

    # safety: не даём уйти в ноль/отрицательные значения в конфиге
    if cfg["periods_to_empty_target"] <= 0:
        cfg["periods_to_empty_target"] = 12
    if cfg["treat_self"]["cooldown_periods"] < 0:
        cfg["treat_self"]["cooldown_periods"] = 0

    return cfg


def needs_values_from_profile(profile) -> dict[str, float]:
    return {
        "comfort": _clamp_need(getattr(profile, "need_comfort", 0) or 0),
        "status": _clamp_need(getattr(profile, "need_status", 0) or 0),
        "social": _clamp_need(getattr(profile, "need_social", 0) or 0),
        "health": _clamp_need(getattr(profile, "need_health", 0) or 0),
    }


def set_profile_needs(profile, values: dict[str, float]) -> None:
    setattr(profile, "need_comfort", _clamp_need(values.get("comfort", 0)))
    setattr(profile, "need_status", _clamp_need(values.get("status", 0)))
    setattr(profile, "need_social", _clamp_need(values.get("social", 0)))
    setattr(profile, "need_health", _clamp_need(values.get("health", 0)))


@dataclass(frozen=True)
class NeedsDecayResult:
    before: dict[str, float]
    decay: dict[str, float]
    after: dict[str, float]
    has_zero_after: bool
    is_distressed_after: bool
    min_axis: str


def compute_decay(cfg: dict, before: dict[str, float]) -> dict[str, float]:
    override = cfg.get("decay_per_period") if isinstance(cfg.get("decay_per_period"), dict) else None
    out: dict[str, float] = {}
    if override:
        for k in AXES:
            out[k] = _clamp_need(float(override.get(k) or 0))
        return out
    initial = cfg.get("initial") if isinstance(cfg.get("initial"), dict) else {}
    target = int(cfg.get("periods_to_empty_target") or 12)
    target = max(1, target)
    for k in AXES:
        out[k] = _clamp_need(float(initial.get(k) or 0) / float(target))
    return out


def apply_decay(cfg: dict, before: dict[str, float]) -> NeedsDecayResult:
    decay = compute_decay(cfg, before)
    after = {k: _clamp_need(float(before.get(k) or 0) - float(decay.get(k) or 0)) for k in AXES}
    has_zero = any(float(after[k]) <= 0.0 for k in AXES)
    distressed_thr = int(cfg.get("thresholds", {}).get("distressed") or 30)
    is_distressed = any(0.0 < float(after[k]) < float(distressed_thr) for k in AXES)
    min_axis = min(AXES, key=lambda k: float(after.get(k) or 0))
    return NeedsDecayResult(
        before=before,
        decay=decay,
        after=after,
        has_zero_after=has_zero,
        is_distressed_after=is_distressed,
        min_axis=min_axis,
    )


def treat_self_availability(cfg: dict, *, period_index: int, last_period_index: int) -> dict:
    cooldown = int(cfg.get("treat_self", {}).get("cooldown_periods") or 15)
    if last_period_index <= 0:
        return {"available": True, "cooldown_periods_remaining": 0}
    ready_at = int(last_period_index) + int(cooldown)
    remaining = max(0, int(ready_at) - int(period_index))
    return {"available": remaining <= 0, "cooldown_periods_remaining": remaining}


def normalize_treat_self_options(cfg: dict, *, monthly_salary: float) -> list[dict]:
    ts = cfg.get("treat_self") if isinstance(cfg.get("treat_self"), dict) else {}
    default_pct = float(ts.get("default_cost_pct_salary") or 0.08)
    cmin = float(ts.get("cost_min") or 0)
    cmax = float(ts.get("cost_max") or 0)
    out: list[dict] = []
    for raw in (ts.get("options") or []):
        if not isinstance(raw, dict):
            continue
        oid = str(raw.get("id") or "").strip()
        title = str(raw.get("title") or "").strip()
        if not oid or not title:
            continue
        subtitle = str(raw.get("subtitle") or "").strip() or None
        pct = float(raw.get("cost_pct_salary") or default_pct)
        cost = float(monthly_salary) * pct
        if cmin > 0:
            cost = max(cost, cmin)
        if cmax > 0:
            cost = min(cost, cmax)
        cost = round(cost, 2)
        needs_delta = raw.get("needs_delta") if isinstance(raw.get("needs_delta"), dict) else {}
        nd = {k: float(needs_delta.get(k) or 0) for k in AXES}
        out.append(
            {
                "id": oid,
                "title": title,
                "subtitle": subtitle,
                "cost": cost,
                "needs_delta": nd,
            }
        )
    return out

