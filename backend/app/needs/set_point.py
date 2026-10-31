"""
Потребности: износ рутиной + уровень жизни — SPEC_needs-set-point §2–3, ADR-015.

Здесь только расчёт: износ w, потолок бонуса, уровень жизни L и прогноз
«обнулится без событий». Применение в закрытии периода — шаг 4 плана NV.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.orm import Session

from .engine import AXES
from .value_curve import CURVE_ALPHA, IMPULSE_SCALE, needs_points

MODEL_LINEAR = "linear"
MODEL_SET_POINT = "set_point"
VALID_MODELS = frozenset({MODEL_LINEAR, MODEL_SET_POINT})

LEVEL_MAX = 90.0
BONUS_CAP_SAFETY = 0.8
ASSET_AXIS_CAP = 25.0
OTHER_CATEGORY_WEIGHT = 0.4
IDLE_FORECAST_HORIZON = 120

DEFAULT_CATEGORY_AXES: dict[str, dict[str, float]] = {
    "food": {"comfort": 0.4, "health": 0.6},
    "transport": {"comfort": 0.8, "status": 0.2},
    "communications": {"comfort": 0.4, "social": 0.6},
    "health": {"health": 1.0},
    "clothing": {"comfort": 0.4, "status": 0.6},
    "leisure": {"comfort": 0.2, "social": 0.6, "health": 0.2},
    "other": {"comfort": 0.5, "social": 0.5},
}

# kind актива → (доли осей, как считать стоимость). Финансовые и доходные активы — 0.
ASSET_KIND_AXES: dict[str, tuple[dict[str, float], str]] = {
    "car": ({"comfort": 0.6, "status": 0.4}, "value"),
    "car_personal": ({"comfort": 0.6, "status": 0.4}, "value"),
    "home": ({"comfort": 0.7, "status": 0.3}, "value"),
    "house": ({"comfort": 0.7, "status": 0.3}, "value"),
    "mansion": ({"comfort": 0.7, "status": 0.3}, "value"),
    "leased_dwelling": ({"comfort": 0.8, "status": 0.2}, "rent_year"),
    "rental_car": ({"comfort": 0.8, "status": 0.2}, "rent_year"),
}

DEFAULT_STRESSORS: dict[str, dict[str, float]] = {
    "overdue": {"comfort": -10.0, "status": -5.0, "health": -5.0},
    "negative_cash": {"comfort": -5.0},
}


def _num(raw: Any, default: float) -> float:
    try:
        v = float(raw)
    except (TypeError, ValueError):
        return float(default)
    return v if math.isfinite(v) else float(default)


def _axis_map(raw: Any) -> dict[str, float]:
    if not isinstance(raw, dict):
        return {}
    return {ax: _num(raw.get(ax), 0.0) for ax in AXES if raw.get(ax) is not None}


def parse_set_point_config(needs: dict, initial: dict[str, float]) -> dict:
    """Нормализует needs.set_point с дефолтами spec (вызывается из parse_needs_config)."""
    raw = needs.get("set_point") if isinstance(needs.get("set_point"), dict) else {}
    base_raw = raw.get("base") if isinstance(raw.get("base"), dict) else {}
    base = {ax: _num(base_raw.get(ax), round(0.8 * float(initial.get(ax) or 0))) for ax in AXES}
    hab = raw.get("habituation") if isinstance(raw.get("habituation"), dict) else {}
    cat_raw = raw.get("category_axes") if isinstance(raw.get("category_axes"), dict) else None
    category_axes = (
        {str(k): _axis_map(v) for k, v in cat_raw.items()} if cat_raw else dict(DEFAULT_CATEGORY_AXES)
    )
    st_raw = raw.get("stressors") if isinstance(raw.get("stressors"), dict) else None
    # Стрессоры только снижают L — иначе конфиг мог бы обойти инвариант давления.
    stressors = (
        {str(k): {ax: min(0.0, v) for ax, v in _axis_map(v).items()} for k, v in st_raw.items()}
        if st_raw
        else dict(DEFAULT_STRESSORS)
    )
    rate = min(0.9, max(0.01, _num(raw.get("adaptation_rate"), 0.05)))
    return {
        "adaptation_rate": rate,
        "passive_periods_to_zero": max(2, int(_num(raw.get("passive_periods_to_zero"), 20))),
        "base": base,
        "bonus_cap_max": max(0.0, _num(raw.get("bonus_cap_max"), 12.0)),
        "budget_scale": max(0.0, _num(raw.get("budget_scale"), 40.0)),
        "curve_alpha": min(1.0, max(0.05, _num(raw.get("curve_alpha"), CURVE_ALPHA))),
        "impulse_scale": max(0.0, _num(raw.get("impulse_scale"), IMPULSE_SCALE)),
        "habituation": {
            "min": min(1.0, max(0.0, _num(hab.get("min"), 0.4))),
            "half_life_periods": max(0.5, _num(hab.get("half_life_periods"), 6.0)),
        },
        "category_axes": category_axes,
        "stressors": stressors,
        "zero_threshold": max(0.0, _num(raw.get("zero_threshold"), 1.0)),
    }


def parse_model(needs: dict) -> str:
    m = str(needs.get("model") or MODEL_LINEAR).strip().lower()
    return m if m in VALID_MODELS else MODEL_LINEAR


# ---------- Чистые функции (без БД) ----------


def derive_wear(initial: dict[str, float], sp: dict) -> dict[str, float]:
    """Износ w: пассивный игрок с L = base доходит от initial до нуля за T периодов (spec §2)."""
    r = float(sp["adaptation_rate"])
    q = (1.0 - r) ** int(sp["passive_periods_to_zero"])
    out: dict[str, float] = {}
    for ax in AXES:
        n0 = float(initial.get(ax) or 0)
        idle_target = -q * n0 / (1.0 - q)
        out[ax] = round(r * (float(sp["base"][ax]) - idle_target), 3)
    return out


def bonus_caps(wear: dict[str, float], sp: dict) -> dict[str, float]:
    """Потолок положительного вклада уровня жизни: base + cap < w / r (инвариант давления)."""
    r = float(sp["adaptation_rate"])
    out: dict[str, float] = {}
    for ax in AXES:
        headroom = float(wear[ax]) / r - float(sp["base"][ax])
        out[ax] = round(max(0.0, min(float(sp["bonus_cap_max"]), BONUS_CAP_SAFETY * headroom)), 3)
    return out


def pressure_invariant_violations(wear: dict[str, float], caps: dict[str, float], sp: dict) -> list[str]:
    """Оси, где без событий потребность могла бы не обнулиться (ось с нулевым износом и базой — уже ноль)."""
    r = float(sp["adaptation_rate"])
    return [
        ax
        for ax in AXES
        if float(wear[ax]) > 0 and float(sp["base"][ax]) + float(caps[ax]) >= float(wear[ax]) / r
    ]


def habituation(age_periods: float, sp: dict) -> float:
    h = sp["habituation"]
    age = max(0.0, float(age_periods))
    return float(h["min"]) + (1.0 - float(h["min"])) * 0.5 ** (age / float(h["half_life_periods"]))


@dataclass(frozen=True)
class LevelSource:
    source: str  # budget | asset | asset_lost | stress | cap
    kind: str
    title: str | None
    axis: str
    delta: float


@dataclass(frozen=True)
class CategorySpend:
    category_key: str
    norm: float
    current: float
    grew_at_period: int | None = None


@dataclass(frozen=True)
class AssetHolding:
    kind: str
    title: str | None
    value: float
    monthly_cost: float
    acquired_period: int | None = None


@dataclass
class LevelResult:
    level: dict[str, float]
    sources: list[LevelSource] = field(default_factory=list)
    bonus_cap: dict[str, float] = field(default_factory=dict)


def compute_level(
    sp: dict,
    *,
    caps: dict[str, float],
    salary: float,
    period_index: int,
    spends: list[CategorySpend],
    assets: list[AssetHolding],
    stress_flags: dict[str, bool],
    starter_assets: list[AssetHolding] | None = None,
) -> LevelResult:
    """L = clamp(base + min(cap, budget⁺ + assets⁺) + budget⁻ + assets⁻ + stress, 0, 90) — spec §3.

    Стартовые активы шаблона — норма персоны (как бюджет шаблона): бонус дают только новые
    покупки, продажа стартового актива — потеря без привыкания.
    """
    alpha = float(sp["curve_alpha"])
    k_imp = float(sp["impulse_scale"])
    plus = {ax: 0.0 for ax in AXES}
    minus = {ax: 0.0 for ax in AXES}
    stress = {ax: 0.0 for ax in AXES}
    sources: list[LevelSource] = []

    for sp_row in spends:
        shares = sp["category_axes"].get(sp_row.category_key) or {}
        if not shares:
            continue
        if sp_row.norm > 0:
            d = float(sp["budget_scale"]) * ((max(0.0, sp_row.current) / sp_row.norm) ** alpha - 1.0)
        else:
            d = OTHER_CATEGORY_WEIGHT * needs_points(sp_row.current, salary, k=k_imp, alpha=alpha)
        if d > 0 and sp_row.grew_at_period is not None:
            d *= habituation(period_index - sp_row.grew_at_period, sp)
        if abs(d) < 1e-6:
            continue
        for ax, share in shares.items():
            v = d * float(share)
            (plus if v > 0 else minus)[ax] += v
            sources.append(LevelSource("budget", sp_row.category_key, None, ax, round(v, 2)))

    def _asset_axes(a: AssetHolding) -> dict[str, float]:
        spec = ASSET_KIND_AXES.get(a.kind)
        if not spec:
            return {}
        shares, basis = spec
        equiv = a.value if basis == "value" else 12.0 * a.monthly_cost
        pts = needs_points(equiv, salary, k=k_imp, alpha=alpha)
        return {ax: min(ASSET_AXIS_CAP, pts * float(share)) for ax, share in shares.items()}

    def _same_holding(x: AssetHolding, y: AssetHolding) -> bool:
        if x.kind != y.kind:
            return False
        basis = (ASSET_KIND_AXES.get(x.kind) or ({}, "value"))[1]
        if basis == "rent_year":
            return abs(x.monthly_cost - y.monthly_cost) < 1.0
        return abs(x.value - y.value) < 1.0

    unmatched_starters = list(starter_assets or [])
    for a in assets:
        twin = next((s0 for s0 in unmatched_starters if _same_holding(s0, a)), None)
        if twin is not None:
            unmatched_starters.remove(twin)
            continue
        h = habituation(period_index - a.acquired_period, sp) if a.acquired_period is not None else 1.0
        for ax, v in _asset_axes(a).items():
            v *= h
            if v > 1e-6:
                plus[ax] += v
                sources.append(LevelSource("asset", a.kind, a.title, ax, round(v, 2)))
    for lost in unmatched_starters:
        for ax, v in _asset_axes(lost).items():
            if v > 1e-6:
                minus[ax] -= v
                sources.append(LevelSource("asset_lost", lost.kind, lost.title, ax, round(-v, 2)))

    for key, active in stress_flags.items():
        if not active:
            continue
        for ax, v in (sp["stressors"].get(key) or {}).items():
            stress[ax] += float(v)
            sources.append(LevelSource("stress", key, None, ax, round(float(v), 2)))

    level: dict[str, float] = {}
    for ax in AXES:
        bonus = plus[ax]
        if bonus > caps[ax]:
            sources.append(LevelSource("cap", "bonus_cap", None, ax, round(caps[ax] - bonus, 2)))
            bonus = caps[ax]
        raw = float(sp["base"][ax]) + bonus + minus[ax] + stress[ax]
        level[ax] = round(max(0.0, min(LEVEL_MAX, raw)), 2)
    return LevelResult(level=level, sources=sources, bonus_cap=dict(caps))


def step_toward_level(n: float, level: float, wear: float, rate: float) -> float:
    """Один период без событий: N + r(L − N) − w, clamp 0..100 (spec §2)."""
    return max(0.0, min(100.0, n + rate * (level - n) - wear))


def periods_to_zero_if_idle(
    needs_now: dict[str, float],
    level: dict[str, float],
    wear: dict[str, float],
    sp: dict,
) -> dict[str, int | None]:
    """Через сколько закрытий периода ось станет «нулём», если не участвовать в событиях."""
    thr = float(sp["zero_threshold"])
    r = float(sp["adaptation_rate"])
    out: dict[str, int | None] = {}
    for ax in AXES:
        n = float(needs_now.get(ax) or 0)
        hit = None
        for t in range(1, IDLE_FORECAST_HORIZON + 1):
            n = step_toward_level(n, float(level[ax]), float(wear[ax]), r)
            if n < thr:
                hit = t
                break
        out[ax] = hit
    return out


def linear_periods_to_zero(needs_now: dict[str, float], decay: dict[str, float]) -> dict[str, int | None]:
    out: dict[str, int | None] = {}
    for ax in AXES:
        d = float(decay.get(ax) or 0)
        n = float(needs_now.get(ax) or 0)
        out[ax] = None if d <= 0 else max(0, math.ceil(n / d))
    return out


# ---------- Сбор входов из БД ----------


def _spends_for_profile(db: Session, profile, blueprint: dict) -> list[CategorySpend]:
    from ..finance.expense_defaults import expense_budget_for_template
    from ..finance.expenses import compute_monthly_burn
    from ..models import ProfileExpenseLine

    snapshot = compute_monthly_burn(db, profile)
    template_key = getattr(profile, "starter_template_key", None)
    base_total = float(getattr(profile, "base_monthly_lifestyle_expense", 0) or 0)
    norm = expense_budget_for_template(template_key, base_total, blueprint, db) if base_total > 0 else {}

    current: dict[str, float] = {}
    for line in snapshot.lines:
        current[line.category_key] = current.get(line.category_key, 0.0) + float(line.amount_monthly)

    # legacy monthly_lifestyle_delta: рост — в «прочее», урезание — равномерно по нормам категорий.
    legacy = float(snapshot.legacy_delta or 0)
    norm_total = sum(v for v in norm.values() if v > 0)
    if legacy > 0:
        current["other"] = current.get("other", 0.0) + legacy
    elif legacy < 0 and norm_total > 0:
        for cat, b in norm.items():
            if b > 0:
                current[cat] = current.get(cat, 0.0) + legacy * (b / norm_total)

    # Когда статья категории последний раз выросла (для привыкания) — по статьям из событий.
    line_ids = [l.id for l in snapshot.lines if l.source_kind not in ("template", "legacy_import")]
    grew: dict[str, int] = {}
    if line_ids:
        rows = (
            db.query(ProfileExpenseLine.category_key, ProfileExpenseLine.created_period_index)
            .filter(ProfileExpenseLine.id.in_(line_ids))
            .order_by(ProfileExpenseLine.id)
            .all()
        )
        for cat, created in rows:
            grew[cat] = max(grew.get(cat, 0), int(created or 0))

    cats = set(norm) | set(current)
    return [
        CategorySpend(cat, float(norm.get(cat, 0) or 0), float(current.get(cat, 0) or 0), grew.get(cat))
        for cat in sorted(cats)
    ]


def _assets_for_profile(db: Session, profile) -> list[AssetHolding]:
    from ..models import FinanceAsset

    rows = (
        db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == profile.id, FinanceAsset.is_active == 1)
        .order_by(FinanceAsset.id)  # compute_level сопоставляет активы со стартовыми по порядку
        .all()
    )
    # acquired_period_index (NV-304); NULL у старых строк = с начала игры.
    return [
        AssetHolding(
            kind=str(a.kind or ""),
            title=a.title,
            value=float(a.asset_value or 0),
            monthly_cost=float(a.monthly_maintenance_cost or 0),
            acquired_period=int(getattr(a, "acquired_period_index", None) or 1),
        )
        for a in rows
    ]


def starter_assets_from_blueprint(blueprint: dict) -> list[AssetHolding]:
    out: list[AssetHolding] = []
    for a in blueprint.get("assets") or []:
        if not isinstance(a, dict):
            continue
        out.append(
            AssetHolding(
                kind=str(a.get("kind") or ""),
                title=a.get("title"),
                value=_num(a.get("asset_value"), 0.0),
                monthly_cost=_num(a.get("monthly_maintenance_cost"), 0.0),
            )
        )
    return out


def _stress_flags(db: Session, profile) -> dict[str, bool]:
    from ..models import FinanceLiability

    overdue = (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id, FinanceLiability.overdue_amount > 0)
        .count()
    )
    return {"overdue": overdue > 0, "negative_cash": float(profile.cash_balance or 0) < 0}


@dataclass
class SetPointSnapshot:
    model: str
    level: dict[str, float]
    wear: dict[str, float]
    bonus_cap: dict[str, float]
    sources: list[LevelSource]
    periods_to_zero_if_idle: dict[str, int | None]


def build_set_point_snapshot(
    db: Session,
    profile,
    needs_cfg: dict,
    blueprint: dict,
    *,
    salary: float,
    needs_now: dict[str, float],
) -> SetPointSnapshot:
    """L, износ и прогноз для overview. Считается для любой модели (превью до перевода шаблона)."""
    from .engine import compute_decay

    sp = needs_cfg["set_point"]
    wear = derive_wear(needs_cfg["initial"], sp)
    caps = bonus_caps(wear, sp)
    res = compute_level(
        sp,
        caps=caps,
        salary=salary,
        period_index=max(1, int(profile.period_index or 1)),
        spends=_spends_for_profile(db, profile, blueprint),
        assets=_assets_for_profile(db, profile),
        stress_flags=_stress_flags(db, profile),
        starter_assets=starter_assets_from_blueprint(blueprint),
    )
    model = needs_cfg.get("model") or MODEL_LINEAR
    if model == MODEL_SET_POINT:
        idle = periods_to_zero_if_idle(needs_now, res.level, wear, sp)
    else:
        idle = linear_periods_to_zero(needs_now, compute_decay(needs_cfg, needs_now))
    return SetPointSnapshot(model, res.level, wear, caps, res.sources, idle)
